"""
Attendance Forecasting Model
Predicts next-day attendance probability using models selected via MODEL environment variable.
Supports: LogisticRegression, RandomForest, XGBoost
"""

from typing import Dict, List, Any
import numpy as np
import joblib
import os

from .model_factory import get_model_type


class AttendanceForecast:
    """Multi-model classifier for predicting next-day attendance probability."""
    
    def __init__(self, user_type: str = 'STUDENT'):
        """
        Initialize forecast model.
        
        Args:
            user_type: 'STUDENT' or 'EMPLOYEE' - determines which model to load
        """
        if user_type.upper() not in ['STUDENT', 'EMPLOYEE']:
            raise ValueError(f"Invalid user_type: {user_type}. Must be 'STUDENT' or 'EMPLOYEE'")
        
        self.user_type = user_type.upper()
        self.model = None
        self.is_trained = False
        self.model_type = get_model_type()
        
        # New format: attendance_forecast_{model_type}_{user_type}.joblib
        # Old format (backward compatibility): attendance_forecast_{user_type}.joblib
        user_type_lower = self.user_type.lower()
        self.MODEL_PATH = f'ml/models/trained/attendance_forecast_{self.model_type}_{user_type_lower}.joblib'
        self.MODEL_PATH_LEGACY = f'ml/models/trained/attendance_forecast_{user_type_lower}.joblib'
        
    def load_model(self) -> bool:
        """Load trained model from disk with backward compatibility."""
        # Try new format first (with model type)
        if os.path.exists(self.MODEL_PATH):
            try:
                self.model = joblib.load(self.MODEL_PATH)
                self.is_trained = True
                return True
            except Exception as e:
                print(f"Error loading attendance forecast model for {self.user_type}: {e}")
                return False
        
        # Fall back to legacy format (backward compatibility)
        if os.path.exists(self.MODEL_PATH_LEGACY):
            try:
                self.model = joblib.load(self.MODEL_PATH_LEGACY)
                self.is_trained = True
                print(f"Loaded legacy model file for {self.user_type} (backward compatibility)")
                return True
            except Exception as e:
                print(f"Error loading legacy attendance forecast model for {self.user_type}: {e}")
                return False
        
        return False
    
    def predict(self, features: List[float]) -> Dict[str, Any]:
        """
        Predict next-day attendance probability for given features.
        
        Args:
            features: 10-feature vector [state_1 ... state_10]
                      where each state is 1=present / 0=absent
                      ordered most recent to oldest
            
        Returns:
            Dictionary with probability, confidence, and explanatory factors
        """
        # If model not trained, use rule-based prediction
        if not self.is_trained or self.model is None:
            return self._rule_based_prediction(features)
        
        try:
            X = np.array([features])
            
            # All models use predict_proba() (standardized interface)
            # predict_proba returns [P(class_0), P(class_1)], we need index 1
            probability = float(self.model.predict_proba(X)[0, 1])
            
            # Clamp probability to valid range [0, 1]
            probability = max(0.0, min(1.0, probability))
            
            # Calculate confidence based on how certain the model is
            # Higher confidence when probability is closer to 0 or 1
            confidence = self._calculate_confidence(probability)
            
            factors = self._get_forecast_factors(features, probability)
            
            return {
                'probability': round(probability, 3),
                'confidence': confidence,
                'factors': factors
            }
            
        except Exception as e:
            print(f"Error in attendance forecast prediction: {e}")
            return self._rule_based_prediction(features)
    
    def _rule_based_prediction(self, features: List[float]) -> Dict[str, Any]:
        """
        Fallback rule-based prediction when model is not available.
        
        Uses simple attendance rate over the last 10 binary marks as probability.
        """
        print(f"Running rule-based prediction for {self.user_type} attendance forecast")
        
        if len(features) != 10:
            return {
                'probability': 0.5,
                'confidence': 50,
                'factors': ['Insufficient data for analysis']
            }
        
        marks = features
        attendance_rate = float(np.mean(marks)) if marks else 0.5
        
        # Use attendance rate as probability estimate
        probability = max(0.0, min(1.0, attendance_rate))
        
        # Confidence based on how consistent the pattern is
        variance = np.var(marks)
        confidence = int(max(50, 100 - variance * 100))
        
        factors = self._get_forecast_factors(features, probability)
        
        return {
            'probability': round(probability, 3),
            'confidence': confidence,
            'factors': factors
        }
    
    def _calculate_confidence(self, probability: float) -> int:
        """
        Calculate confidence score based on probability.
        
        Higher confidence when probability is closer to 0 or 1 (more certain).
        Lower confidence when probability is around 0.5 (uncertain).
        """
        # Distance from 0.5 indicates certainty
        distance_from_center = abs(probability - 0.5)
        # Scale to 0-100 range, with minimum of 50
        confidence = int(50 + distance_from_center * 100)
        return max(50, min(100, confidence))
    
    def _get_forecast_factors(self, features: List[float], probability: float) -> List[str]:
        """Extract explanatory factors based on feature values and predicted probability."""
        if len(features) != 10:
            return ["Insufficient data for detailed analysis"]
        
        marks = features
        attendance_rate = float(np.mean(marks))
        absences = len([m for m in marks if m < 0.5])
        presents = len([m for m in marks if m >= 0.5])
        
        factors = []
        
        # Recent trend analysis (last 5 vs first 5)
        recent_5 = marks[:5] if len(marks) >= 5 else marks
        older_5 = marks[5:10] if len(marks) >= 10 else []
        
        if len(older_5) > 0:
            recent_rate = np.mean(recent_5)
            older_rate = np.mean(older_5)
            
            if recent_rate > older_rate + 0.2:
                factors.append("Improving attendance trend")
            elif recent_rate < older_rate - 0.2:
                factors.append("Declining attendance trend")
            else:
                factors.append("Stable attendance pattern")
        
        # Streak analysis
        if presents >= 8:
            factors.append(f"Strong attendance record ({presents}/10 present)")
        elif absences >= 5:
            factors.append(f"Frequent absences ({absences}/10 absent)")
        else:
            factors.append(f"Mixed attendance pattern ({presents} present, {absences} absent)")
        
        # Probability interpretation
        if probability >= 0.7:
            factors.append(f"High likelihood of attendance ({probability*100:.1f}%)")
        elif probability <= 0.3:
            factors.append(f"Low likelihood of attendance ({probability*100:.1f}%)")
        else:
            factors.append(f"Moderate likelihood of attendance ({probability*100:.1f}%)")
        
        return factors[:3]


