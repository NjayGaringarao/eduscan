"""
Dropout Risk Classification Model
Predicts dropout risk level using Random Forest.
"""

from typing import Dict, List, Tuple, Any
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os


class DropoutRisk:
    """Random Forest classifier for predicting user risk levels."""
    
    RISK_LEVELS = ['NOT_AT_RISK', 'AT_RISK']
    
    def __init__(self, user_type: str = 'STUDENT'):
        """
        Initialize classifier.
        
        Args:
            user_type: 'STUDENT' or 'EMPLOYEE' - determines which model to load and threshold to use
        """
        if user_type.upper() not in ['STUDENT', 'EMPLOYEE']:
            raise ValueError(f"Invalid user_type: {user_type}. Must be 'STUDENT' or 'EMPLOYEE'")
        
        self.user_type = user_type.upper()
        self.model = None
        self.is_trained = False
        self.feature_names = []
        self.MODEL_PATH = f'ml/models/trained/dropout_risk_{self.user_type.lower()}.joblib'
        
        # Set threshold based on user type
        if self.user_type == 'STUDENT':
            self.threshold = 0.7
        else:  # EMPLOYEE
            self.threshold = 0.9
        
    def load_model(self) -> bool:
        """Load trained model from disk."""
        if os.path.exists(self.MODEL_PATH):
            try:
                self.model = joblib.load(self.MODEL_PATH)
                self.is_trained = True
                return True
            except Exception as e:
                print(f"Error loading dropout risk classifier for {self.user_type}: {e}")
                return False
        return False
    
    def predict(self, features: List[float]) -> Dict[str, Any]:
        """
        Predict risk level for given features.
        
        Args:
            features: 10-feature vector [state_1 ... state_10]
                      where each state is 1=present / 0=absent
            
        Returns:
            Dictionary with risk level, confidence, and contributing factors
        """
        # If model not trained, use rule-based prediction
        if not self.is_trained or self.model is None:
            return self._rule_based_prediction(features)
        
        try:
            X = np.array([features])
            
            prediction = self.model.predict(X)[0]
            probabilities = self.model.predict_proba(X)[0]
            confidence = int(max(probabilities) * 100)
            
            risk_percentage = self._estimate_risk_percentage(features, prediction)
            factors = self._get_risk_factors(features, prediction)
            
            return {
                'level': prediction,
                'percentage': risk_percentage,
                'confidence': confidence,
                'factors': factors
            }
            
        except Exception as e:
            print(f"Error in dropout risk prediction: {e}")
            return self._rule_based_prediction(features)
    
    def _rule_based_prediction(self, features: List[float]) -> Dict[str, Any]:
        """
        Fallback rule-based prediction when model is not available.
        
        Uses attendance-rate thresholds over the last 10 binary marks.
        Threshold is hardcoded based on user_type (STUDENT=70%, EMPLOYEE=90%).
        """

        print(f"Running rule-based prediction for {self.user_type} dropout risk classifier")
        
        if len(features) != 10:
            return {
                'level': 'NOT_AT_RISK',
                'percentage': 25,
                'confidence': 50,
                'factors': ['Insufficient data for analysis']
            }
        
        marks = features
        attendance_rate = float(np.mean(marks)) if marks else 0.0
        threshold = self.threshold
        level = 'AT_RISK' if attendance_rate < threshold else 'NOT_AT_RISK'
        
        gap = max(0.0, threshold - attendance_rate)
        risk_percentage = int(min(100, gap / threshold * 100)) if level == 'AT_RISK' else int((1 - gap) * 50)
        
        factors = []
        absences = len([m for m in marks if m < 0.5])
        if absences >= 5:
            factors.append(f"Frequent absences ({absences}/10)")
        elif absences >= 3:
            factors.append(f"Some absences ({absences}/10)")
        else:
            factors.append("Consistent attendance pattern")
        
        if self.user_type == 'STUDENT':
            factors.append("Student threshold applied (70%)")
        else:
            factors.append("Employee threshold applied (90%)")
        
        if level == 'NOT_AT_RISK' and absences <= 1:
            factors.append("High reliability over last 10 days")
        
        return {
            'level': level,
            'percentage': max(risk_percentage, 5 if level == 'AT_RISK' else 10),
            'confidence': 70,
            'factors': factors[:3]
        }
    
    def _estimate_risk_percentage(self, features: List[float], prediction: str) -> int:
        """Estimate a user-friendly percentage score."""
        if len(features) != 10:
            return 50
        
        marks = features
        attendance_rate = float(np.mean(marks)) if marks else 0.0
        threshold = self.threshold
        
        if prediction == 'AT_RISK':
            gap = max(0.0, threshold - attendance_rate)
            return int(min(100, 50 + gap * 100))
        else:
            buffer = max(0.0, attendance_rate - threshold)
            return int(max(50, min(95, 70 + buffer * 100)))
    
    def _get_risk_factors(self, features: List[float], risk_level: str) -> List[str]:
        """Extract top risk factors based on feature values."""
        if len(features) != 10:
            return ["Insufficient data for detailed analysis"]
        
        marks = features
        attendance_rate = float(np.mean(marks)) if marks else 0.0
        absences = len([m for m in marks if m < 0.5])
        
        factors = []
        threshold = self.threshold
        audience = self.user_type.capitalize()
        
        factors.append(f"{audience} expected attendance ≥ {int(threshold * 100)}%")
        factors.append(f"10-day attendance rate: {attendance_rate * 100:.1f}%")
        factors.append(f"Absences in window: {absences}")
        
        if risk_level == 'NOT_AT_RISK':
            factors.append("Meets expectation during recent window")
        
        return factors[:3]
