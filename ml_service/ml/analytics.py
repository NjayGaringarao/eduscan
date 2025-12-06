"""
Analytics Orchestrator
Main module that computes performance metrics for a user.
"""

from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone
from services.supabase import get_supabase
from ml.attendance_feature import AttendanceFeature
from ml.models.classifier import AttendanceForecast


class PerformanceAnalytics:
    """Main analytics orchestrator."""
    
    def __init__(self):
        """Initialize analytics with ML models."""
        # AttendanceForecast will be initialized per-user based on their type
        self.attendance_forecast = None
    
    async def compute_performance_metrics(self, user_id: str) -> Dict[str, Any]:
        """
        Compute performance metrics for a user.
        
        Args:
            user_id: User ID to analyze
            
        Returns:
            PerformanceMetrics dictionary with ML risk plus statistical metrics
        """
        try:
            # Fetch session stats + attendance marks
            session_records = await self._fetch_user_attendance_records(user_id)
            attendance_marks = await self._fetch_user_attendance_marks(user_id, n_records=10)
            
            if not attendance_marks:
                return self._get_default_metrics()
            
            # Statistical analysis
            avg_punctuality = self._calculate_avg_punctuality(session_records)
            avg_time_balance = self._calculate_avg_time_balance(session_records)
            attendance_rate = await self._calculate_attendance_rate(user_id)
            
            # ML predictions using 10-step binary extractor
            attendance_feature = AttendanceFeature(attendance_marks, {})
            binary_sequence = attendance_feature.extract_binary_sequence(n_records=10)
            user_type_label = await self._determine_user_type(user_id)
            
            # Initialize and load model for this user type
            forecast_model = AttendanceForecast(user_type=user_type_label)
            forecast_model.load_model()
            
            attendance_forecast = forecast_model.predict(binary_sequence)
            
            return {
                'averagePunctuality': avg_punctuality,
                'averageTimeBalance': avg_time_balance,
                'attendanceForecast': attendance_forecast,
                'attendanceRate': attendance_rate,
                'lastUpdated': datetime.now(timezone.utc).isoformat(),
                'dataPoints': len(attendance_marks)
            }
            
        except Exception as e:
            print(f"Error computing metrics for user {user_id}: {e}")
            import traceback
            traceback.print_exc()
            return self._get_default_metrics()
    
    async def _fetch_user_attendance_records(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch 15 most recent sessions for user (completed), using new session fields."""
        try:
            supabase = get_supabase()
            
            response = supabase.table("session") \
                .select("punctuality, time_balance, arrival, departure") \
                .eq("user_id", user_id) \
                .not_.is_("departure", "null") \
                .order("arrival", desc=True) \
                .limit(15) \
                .execute()
            
            records = response.data if response.data else []
            return list(records)
        except Exception as e:
            print(f"Error fetching attendance records: {e}")
            return []
    
    async def _fetch_user_attendance_marks(self, user_id: str, n_records: int = 10) -> List[Dict[str, Any]]:
        """Fetch chronological attendance_state rows (PRESENT/ABSENT) for binary sequences."""
        try:
            supabase = get_supabase()
            response = supabase.table("attendance_state") \
                .select("mark, marked_at") \
                .eq("user_id", user_id) \
                .in_("mark", ["PRESENT", "ABSENT"]) \
                .order("marked_at", desc=True) \
                .limit(n_records) \
                .execute()
            
            records = response.data if response.data else []
            records.reverse()
            return records
        except Exception as e:
            print(f"Error fetching attendance marks: {e}")
            return []

    async def _determine_user_type(self, user_id: str) -> str:
        """Return user type label (STUDENT or EMPLOYEE)."""
        try:
            supabase = get_supabase()
            student = supabase.table("student") \
                .select("user_id") \
                .eq("user_id", user_id) \
                .limit(1) \
                .execute()
            if student.data:
                return "STUDENT"
            
            employee = supabase.table("employee") \
                .select("user_id") \
                .eq("user_id", user_id) \
                .limit(1) \
                .execute()
            if employee.data:
                return "EMPLOYEE"
            
            return "STUDENT"  # Default to student
        except Exception as e:
            print(f"Error determining user type for {user_id}: {e}")
            return "STUDENT"
    
    def _calculate_avg_punctuality(self, attendance_records: List[Dict]) -> Dict[str, Any]:
        """Calculate average punctuality from session.punctuality."""
        if not attendance_records:
            return {'value': 0, 'label': 'No Data', 'trend': 'stable'}
        
        punctuality = [r.get('punctuality') for r in attendance_records if r.get('punctuality') is not None]
        if not punctuality:
            return {'value': 0, 'label': 'No Data', 'trend': 'stable'}
        
        avg_punctuality = sum(punctuality) / len(punctuality)
        
        if avg_punctuality < -5:
            label = f"{abs(int(avg_punctuality))} Minutes Early"
        elif avg_punctuality > 5:
            label = f"{int(avg_punctuality)} Minutes Late"
        else:
            label = "On Time"
        
        mid = len(punctuality) // 2
        if mid > 0:
            recent_avg = sum(punctuality[mid:]) / len(punctuality[mid:])
            older_avg = sum(punctuality[:mid]) / len(punctuality[:mid])
            if recent_avg < older_avg - 2:
                trend = 'improving'
            elif recent_avg > older_avg + 2:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        return {
            'value': round(avg_punctuality, 1),
            'label': label,
            'trend': trend
        }
    
    def _calculate_avg_time_balance(self, attendance_records: List[Dict]) -> Dict[str, Any]:
        """Calculate average time_balance from session.time_balance."""
        if not attendance_records:
            return {'value': 0, 'label': 'No Data', 'trend': 'stable'}
        
        total_time_balance = 0
        count = 0
        
        for record in attendance_records:
            time_balance = record.get('time_balance')
            if time_balance is not None:
                total_time_balance += time_balance
                count += 1
        
        avg_time_balance = total_time_balance / max(count, 1) if count > 0 else 0
        
        # Handle both positive (overtime) and negative (undertime) values
        abs_value = abs(avg_time_balance)
        hours = int(abs_value // 60)
        minutes = int(abs_value % 60)
        
        if avg_time_balance > 0:
            label = f"{hours}h {minutes}m Overtime" if hours > 0 else f"{minutes}m Overtime"
        elif avg_time_balance < 0:
            label = f"{hours}h {minutes}m Undertime" if hours > 0 else f"{minutes}m Undertime"
        else:
            label = "Balanced"
        
        mid = len(attendance_records) // 2
        if mid > 0:
            recent = attendance_records[mid:]
            older = attendance_records[:mid]
            recent_time_balance = self._calc_avg_time_balance_from_records(recent)
            older_time_balance = self._calc_avg_time_balance_from_records(older)
            if recent_time_balance < older_time_balance - 5:
                trend = 'improving'
            elif recent_time_balance > older_time_balance + 5:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        return {
            'value': round(avg_time_balance, 1),
            'label': label,
            'trend': trend
        }
    
    def _calc_avg_time_balance_from_records(self, attendance_records: List[Dict]) -> float:
        """Calculate average time_balance from time_balance."""
        total = 0
        count = 0
        for record in attendance_records:
            time_balance = record.get('time_balance')
            if time_balance is not None:
                total += time_balance
                count += 1
        return total / max(count, 1)
    
    async def _calculate_attendance_rate(self, user_id: str) -> Dict[str, Any]:
        """Calculate attendance rate from attendance_state records."""
        try:
            supabase = get_supabase()
            response = supabase.table("attendance_state") \
                .select("mark") \
                .eq("user_id", user_id) \
                .in_("mark", ["PRESENT", "ABSENT"]) \
                .execute()
            records = response.data if response.data else []
            if not records:
                return {
                    'rate': 0.0,
                    'label': 'No Data',
                    'present': 0,
                    'absent': 0,
                    'total': 0
                }
            present_count = sum(1 for record in records if record.get('mark') == 'PRESENT')
            absent_count = sum(1 for record in records if record.get('mark') == 'ABSENT')
            total_count = present_count + absent_count
            rate = (present_count / total_count * 100) if total_count > 0 else 0.0
            label = f"{rate:.1f}%"
            return {
                'rate': round(rate, 1),
                'label': label,
                'present': present_count,
                'absent': absent_count,
                'total': total_count
            }
        except Exception as e:
            print(f"Error calculating attendance rate: {e}")
            return {
                'rate': 0.0,
                'label': 'Error',
                'present': 0,
                'absent': 0,
                'total': 0
            }

    
    def _get_default_metrics(self) -> Dict[str, Any]:
        """Return default metrics when no data is available."""
        return {
            'averagePunctuality': {'value': None, 'label': 'No Data', 'trend': 'stable'},
            'averageTimeBalance': {'value': None, 'label': 'No Data', 'trend': 'stable'},
            'attendanceForecast': {
                'probability': None,
                'confidence': None,
                'factors': ['Insufficient data for analysis']
            },
            'attendanceRate': {
                'rate': None, 
                'label': 'No Data', 
                'present': None,  
                'absent': None,  
                'total': None     
            },
            'lastUpdated': datetime.now(timezone.utc).isoformat(),
            'dataPoints': None
        }

    async def compute_aggregate_metrics(
        self, 
        user_ids: List[str],
        user_type: str = "ALL"
    ) -> Dict[str, Any]:
        """
        Compute aggregate performance metrics for multiple users.
        
        Args:
            user_ids: List of user IDs to aggregate
            user_type: 'STUDENT', 'EMPLOYEE', or 'ALL'
            
        Returns:
            Dictionary with aggregate metrics and individual user records
        """
        if not user_ids:
            return self._get_default_aggregate_metrics(user_type)
        
        user_records = []
        punctuality_values = []
        time_balance_values = []
        attendance_rates = []
        forecast_probabilities = []
        at_risk_count = 0
        not_at_risk_count = 0
        
        for user_id in user_ids:
            try:
                metrics = await self.compute_performance_metrics(user_id)
                
                # Store individual user record
                user_type_label = await self._determine_user_type(user_id)
                
                user_record = {
                    'user_id': user_id,
                    'user_type': user_type_label,
                    'average_punctuality_value': metrics.get('averagePunctuality', {}).get('value'),
                    'average_punctuality_label': metrics.get('averagePunctuality', {}).get('label', 'No Data'),
                    'average_punctuality_trend': metrics.get('averagePunctuality', {}).get('trend', 'stable'),
                    'average_time_balance_value': metrics.get('averageTimeBalance', {}).get('value'),
                    'average_time_balance_label': metrics.get('averageTimeBalance', {}).get('label', 'No Data'),
                    'average_time_balance_trend': metrics.get('averageTimeBalance', {}).get('trend', 'stable'),
                    'attendance_rate_value': metrics.get('attendanceRate', {}).get('rate'),
                    'attendance_rate_label': metrics.get('attendanceRate', {}).get('label', 'No Data'),
                    'attendance_rate_present': metrics.get('attendanceRate', {}).get('present'),
                    'attendance_rate_absent': metrics.get('attendanceRate', {}).get('absent'),
                    'attendance_rate_total': metrics.get('attendanceRate', {}).get('total'),
                    'attendance_forecast_probability': metrics.get('attendanceForecast', {}).get('probability'),
                    'attendance_forecast_confidence': metrics.get('attendanceForecast', {}).get('confidence'),
                    'attendance_forecast_factors': metrics.get('attendanceForecast', {}).get('factors', []),
                    'data_points': metrics.get('dataPoints'),
                }
                user_records.append(user_record)
                
                # Aggregate punctuality
                punct_value = metrics.get('averagePunctuality', {}).get('value')
                if punct_value is not None:
                    punctuality_values.append(punct_value)
                
                # Aggregate time balance
                time_balance_value = metrics.get('averageTimeBalance', {}).get('value')
                if time_balance_value is not None:
                    time_balance_values.append(time_balance_value)
                
                # Aggregate attendance rate
                att_rate = metrics.get('attendanceRate', {}).get('rate')
                if att_rate is not None:
                    attendance_rates.append(att_rate)
                
                # Aggregate forecast probabilities
                forecast_prob = metrics.get('attendanceForecast', {}).get('probability')
                if forecast_prob is not None:
                    forecast_probabilities.append(forecast_prob)
                    # Count risk based on forecast probability (<0.5 = at risk)
                    if forecast_prob < 0.5:
                        at_risk_count += 1
                    else:
                        not_at_risk_count += 1
                    
            except Exception as e:
                print(f"Error computing metrics for user {user_id}: {e}")
                continue
        
        # Calculate aggregate averages
        avg_punctuality_value = sum(punctuality_values) / len(punctuality_values) if punctuality_values else None
        avg_time_balance_value = sum(time_balance_values) / len(time_balance_values) if time_balance_values else None
        avg_attendance_rate = sum(attendance_rates) / len(attendance_rates) if attendance_rates else None
        avg_forecast_probability = sum(forecast_probabilities) / len(forecast_probabilities) if forecast_probabilities else None
        
        # Format labels
        avg_punctuality_label = self._format_punctuality_label(avg_punctuality_value) if avg_punctuality_value is not None else 'No Data'
        avg_time_balance_label = self._format_time_balance_label(avg_time_balance_value) if avg_time_balance_value is not None else 'No Data'
        avg_attendance_rate_label = f"{avg_attendance_rate:.1f}%" if avg_attendance_rate is not None else 'No Data'
        
        # Calculate trends (comparing recent vs older records)
        avg_punctuality_trend = self._calculate_aggregate_trend(punctuality_values)
        avg_time_balance_trend = self._calculate_aggregate_trend(time_balance_values)
        
        return {
            'user_type': user_type,
            'average_punctuality': avg_punctuality_value,
            'average_punctuality_label': avg_punctuality_label,
            'average_punctuality_trend': avg_punctuality_trend,
            'average_time_balance': avg_time_balance_value,
            'average_time_balance_label': avg_time_balance_label,
            'average_time_balance_trend': avg_time_balance_trend,
            'attendance_rate': avg_attendance_rate,
            'attendance_rate_label': avg_attendance_rate_label,
            'average_forecast_probability': avg_forecast_probability,
            'total_users': len(user_records),
            'at_risk_count': at_risk_count,
            'not_at_risk_count': not_at_risk_count,
            'user_records': user_records
        }
    
    def _format_punctuality_label(self, value: float) -> str:
        """Format punctuality value as label."""
        if value < -5:
            return f"{abs(int(value))} Minutes Early"
        elif value > 5:
            return f"{int(value)} Minutes Late"
        else:
            return "On Time"
    
    def _format_time_balance_label(self, value: float) -> str:
        """Format time balance value as label."""
        abs_value = abs(value)
        hours = int(abs_value // 60)
        minutes = int(abs_value % 60)
        
        if value > 0:
            return f"{hours}h {minutes}m Overtime" if hours > 0 else f"{minutes}m Overtime"
        elif value < 0:
            return f"{hours}h {minutes}m Undertime" if hours > 0 else f"{minutes}m Undertime"
        else:
            return "Balanced"
    
    def _calculate_aggregate_trend(self, values: List[float]) -> str:
        """Calculate trend from list of values (simple heuristic: compare halves)."""
        if not values or len(values) < 2:
            return 'stable'
        
        mid = len(values) // 2
        recent_avg = sum(values[mid:]) / len(values[mid:])
        older_avg = sum(values[:mid]) / len(values[:mid])
        
        diff = recent_avg - older_avg
        if abs(diff) < 2:  # Threshold for stable
            return 'stable'
        elif diff < 0:
            return 'improving'
        else:
            return 'declining'
    
    def _get_default_aggregate_metrics(self, user_type: str) -> Dict[str, Any]:
        """Return default aggregate metrics when no data is available."""
        return {
            'user_type': user_type,
            'average_punctuality': None,
            'average_punctuality_label': 'No Data',
            'average_punctuality_trend': 'stable',
            'average_time_balance': None,
            'average_time_balance_label': 'No Data',
            'average_time_balance_trend': 'stable',
            'attendance_rate': None,
            'attendance_rate_label': 'No Data',
            'total_users': 0,
            'at_risk_count': 0,
            'not_at_risk_count': 0,
            'user_records': []
        }


# Global instance
_analytics = None

def get_analytics() -> PerformanceAnalytics:
    """Get or create analytics instance."""
    global _analytics
    if _analytics is None:
        _analytics = PerformanceAnalytics()
    return _analytics

