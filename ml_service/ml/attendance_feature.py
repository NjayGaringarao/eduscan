"""
Session Feature Extractor Module
Extracts temporal session features for ML models.

This module provides a streamlined Session Feature Extractor class that extracts
either 45-feature session triples or 10-step binary sequences from attendance_state data.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional


class AttendanceFeature:
    """Extract temporal attendance features for ML models."""
    
    def __init__(self, attendance_records: List[Dict[str, Any]], user_data: Dict[str, Any]):
        """
        Initialize feature engineer with attendance_state records.
        
        Args:
            attendance_records: List of attendance_state records with joined session data
            user_data: User information (kept for compatibility, not used in current implementation)
        """
        # Attendance records are already sorted by marked_at time from the database query
        self.attendance_records = attendance_records
        self.user_data = user_data  # Kept for compatibility
        
    def extract_triples(self, n_records: int = 15) -> List[float]:
        """
        Extract temporal attendance features as a flat array.
        
        Returns [state_1, punctuality_1, time_balance_1, state_2, punctuality_2, time_balance_2, ...]
        where 1 is the most recent attendance record and n_records is the oldest.
        Supports both attendance_state records (with mark field) and session records.
        Null values for punctuality and time_balance are converted to 0.
        If fewer than n_records are available, pads with 0s at the beginning.
        
        Args:
            n_records: Number of attendance records to include in feature vector (default: 15)
            
        Returns:
            List of 45 floats: [state_1, punctuality_1, time_balance_1, ..., state_15, punctuality_15, time_balance_15]
        """
        features = []
        
        # Check if we have attendance_state records (with mark field) or session records
        has_mark_field = any('mark' in record for record in self.attendance_records)
        
        if has_mark_field:
            # Filter out CANCELLED records, only keep PRESENT and ABSENT
            valid_records = [record for record in self.attendance_records 
                            if record.get('mark') in ['PRESENT', 'ABSENT']]
            
            # Get the most recent n_records, ensuring chronological order (oldest to newest)
            records_to_use = valid_records[-n_records:] if len(valid_records) >= n_records else valid_records
            
            # Pad if needed (add 0s for older, missing records)
            padded_records = [{'mark': 'ABSENT', 'session': {'punctuality': 0, 'time_balance': None}}] * (n_records - len(records_to_use)) + records_to_use
            
            # Reverse for most-recent-first order in the feature vector
            for record in reversed(padded_records):
                # State: 1 if PRESENT, 0 if ABSENT
                state = 1.0 if record.get('mark') == 'PRESENT' else 0.0
                
                # Get session data if available
                session_data = record.get('session', {})
                # Add null safety check
                if session_data is None:
                    session_data = {}
                    
                punctuality = session_data.get('punctuality') or 0
                time_balance = session_data.get('time_balance')
                # Use time_balance directly as integer (no parsing needed)
                # If null, default to 0
                time_balance_value = float(time_balance) if time_balance is not None else 0.0
                
                features.extend([float(state), float(punctuality), float(time_balance_value)])  # Ensure float for consistency
        else:
            # Handle session-only records (from analytics.py)
            # analytics.py returns records ordered by arrival desc=True (most recent first)
            # Get the most recent n_records (already in most-recent-first order from DB)
            records_to_use = self.attendance_records[:n_records] if len(self.attendance_records) >= n_records else self.attendance_records
            
            # Pad if needed (add 0s for older, missing records at the end)
            # Feature vector should be: [most_recent, ..., oldest], so pad oldest (missing) sessions at end
            padded_records = records_to_use + [{'punctuality': 0, 'time_balance': None}] * (n_records - len(records_to_use))
            
            # Process records in most-recent-first order (already correct from DB)
            for record in padded_records:
                # For session records, assume state=1 (PRESENT) since we only fetch completed sessions
                state = 1.0
                
                punctuality = record.get('punctuality') or 0
                time_balance = record.get('time_balance')
                # Use time_balance directly as integer (no parsing needed)
                # If null, default to 0
                time_balance_value = float(time_balance) if time_balance is not None else 0.0
                
                features.extend([float(state), float(punctuality), float(time_balance_value)])  # Ensure float for consistency
        
        return features
    

    def extract_binary_sequence(self, n_records: int = 10) -> List[float]:
        """
        Extract binary attendance sequence for simplified temporal models.

        Args:
            n_records: Number of most recent attendance marks to include (default: 10)

        Returns:
            List[float]: 10-feature sequence ordered most-recent-first where PRESENT=1.0, ABSENT=0.0.
                         Pads oldest positions with 0 when fewer than n_records available.
                         Note: user_type is NOT included in this feature vector.
        """
        sequence: List[float] = []

        if not self.attendance_records:
            return [0.0] * n_records

        # Determine if mark field is available (attendance_state records)
        has_mark_field = any('mark' in record for record in self.attendance_records)

        if has_mark_field:
            valid_marks = [
                record.get('mark')
                for record in self.attendance_records
                if record.get('mark') in ['PRESENT', 'ABSENT']
            ]
        else:
            # Treat session-only records as PRESENT by default
            valid_marks = ['PRESENT'] * len(self.attendance_records)

        # Get the most recent window from chronological list (records are oldest-first)
        records_to_use = valid_marks[-n_records:] if len(valid_marks) >= n_records else valid_marks

        # Pad missing oldest entries with ABSENT (0)
        padded_records = ['ABSENT'] * (n_records - len(records_to_use)) + records_to_use

        # Convert to floats, reversing to most-recent-first order
        for mark in reversed(padded_records):
            sequence.append(1.0 if mark == 'PRESENT' else 0.0)

        return sequence

    