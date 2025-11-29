"""
Predicted Trend Classification Model
Predicts performance trend using Random Forest.
"""

from typing import Dict, List, Tuple, Any
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os


class PredictedTrend:
    """Random Forest classifier for predicting performance trend."""
    
    TREND_LEVELS = ['NO_TREND', 'IMPROVING', 'DECLINING']
    MODEL_PATH = 'ml/models/trained/predicted_trend.joblib'
    
    def __init__(self):
        """Initialize classifier."""
        self.model = None
        self.is_trained = False
        
    def load_model(self) -> bool:
        """Load trained model from disk."""
        if os.path.exists(self.MODEL_PATH):
            try:
                self.model = joblib.load(self.MODEL_PATH)
                self.is_trained = True
                return True
            except Exception as e:
                print(f"Error loading predicted trend classifier: {e}")
                return False
        return False
    
    def predict(self, features: List[float]) -> Dict[str, Any]:
        """
        Predict trend for given features.
        
        Args:
            features: 45-feature vector [state_1, punctuality_1, time_balance_1, state_2, ...]
                      Where each session has: state (1=present, 0=absent), punctuality (minutes), time_balance (minutes)
            
        Returns:
            Dictionary with trend, confidence, and description
        """
        # If model not trained, use rule-based prediction
        if not self.is_trained or self.model is None:
            return self._rule_based_prediction(features)
        
        try:
            # Convert features to array
            X = np.array([features])
            
            # Predict
            prediction = self.model.predict(X)[0]
            probabilities = self.model.predict_proba(X)[0]
            confidence = int(max(probabilities) * 100)
            
            # Generate description
            description = self._generate_description(prediction)
            
            return {
                'trend': prediction,
                'confidence': confidence,
                'description': description
            }
            
        except Exception as e:
            print(f"Error in predicted trend prediction: {e}")
            return self._rule_based_prediction(features)
    
    def _rule_based_prediction(self, features: List[float]) -> Dict[str, Any]:
        """
        Fallback rule-based prediction when model is not available.
        Features format: [state_1, punctuality_1, time_balance_1, state_2, punctuality_2, time_balance_2, ...]
        where punctuality is positive for early, negative for late; time_balance is positive for overtime, negative for undertime.
        """

        print("Running rule-based prediction for predicted trend classifier")
        if len(features) != 45:
            return {
                'trend': 'NO_TREND',
                'confidence': 50,
                'description': 'Insufficient data for trend analysis'
            }
        
        # Extract features from 45-feature vector
        states = features[0::3]  # Attendance states (1=present, 0=absent)
        punctuality = features[1::3]  # Punctuality (positive=early, negative=late)
        time_balance = features[2::3]  # Time balance (positive=overtime, negative=undertime)
        
        # Analyze recent vs historical performance (first 5 vs last 5 sessions)
        recent_punctuality = punctuality[:5]
        historical_punctuality = punctuality[-5:]
        
        recent_time_balance = time_balance[:5]
        historical_time_balance = time_balance[-5:]
        
        # Calculate improvements/declines
        # For punctuality: improvement means recent is more positive (less negative) than historical
        # So if historical avg is -10 (10 min late) and recent is -5 (5 min late), that's improvement
        punct_improvement = np.mean(historical_punctuality) - np.mean(recent_punctuality)
        
        # For time_balance: improvement means recent is more positive (less negative) than historical
        # So if historical avg is -20 (20 min undertime) and recent is -10 (10 min undertime), that's improvement
        time_improvement = np.mean(historical_time_balance) - np.mean(recent_time_balance)
        
        # Check attendance consistency (recent vs historical)
        recent_states = states[:5]
        historical_states = states[-5:]
        recent_attendance_rate = sum(recent_states) / len(recent_states)
        historical_attendance_rate = sum(historical_states) / len(historical_states)
        attendance_change = recent_attendance_rate - historical_attendance_rate
        
        # Overall trend score (positive = improving)
        # Punctuality improvement: positive means better punctuality (less late)
        # Time balance improvement: positive means better time balance (less undertime)
        trend_score = punct_improvement + (time_improvement / 2) + (attendance_change * 10)
        
        # Check for randomness (high variance in patterns)
        punct_variance = np.var(punctuality)
        time_variance = np.var(time_balance)
        high_variance = punct_variance > 400 or time_variance > 400  # High variance threshold
        
        # Determine trend (3-class: NO_TREND, IMPROVING, DECLINING)
        if trend_score > 10 and attendance_change >= 0:
            trend = 'IMPROVING'
            description = 'Positive trajectory with improving punctuality and attendance patterns'
        elif trend_score > -15 or attendance_change < -0.2:
            trend = 'DECLINING'
            description = 'Worsening punctuality and attendance patterns detected'
        else:
            # Merge STABLE and RANDOM into NO_TREND
            trend = 'NO_TREND'
            if high_variance:
                description = 'Inconsistent performance patterns detected'
            else:
                description = 'Stable performance pattern maintained'
        
        return {
            'trend': trend,
            'confidence': 75,
            'description': description
        }

    def _generate_description(self, trend: str) -> str:
        """Provides a descriptive text for the predicted trend."""
        descriptions = {
            'NO_TREND': "Stable or inconsistent performance pattern.",
            'IMPROVING': "Positive trajectory with better performance over time.",
            'DECLINING': "Worsening punctuality and attendance patterns detected."
        }
    
        return descriptions.get(trend, "Performance trend analysis completed.")
