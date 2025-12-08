"""
Model Factory
Creates model instances based on environment variable configuration.
"""

import os
from typing import Any
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier


def get_model_type() -> str:
    """
    Get model type from environment variable.
    
    Returns:
        Model type string: 'logistic_regression', 'random_forest', or 'xgboost'
        Defaults to 'logistic_regression' if not set
    """
    model_type = os.getenv('MODEL', 'logistic_regression').lower().strip()
    
    valid_types = ['logistic_regression', 'random_forest', 'xgboost']
    if model_type not in valid_types:
        raise ValueError(
            f"Invalid MODEL environment variable: '{model_type}'. "
            f"Must be one of: {valid_types}"
        )
    
    return model_type


def create_model(model_type: str = None) -> Any:
    """
    Create a model instance based on model type.
    
    Args:
        model_type: Model type string. If None, reads from MODEL env var.
        
    Returns:
        Model instance (LogisticRegression, RandomForestClassifier, or XGBClassifier)
    """
    if model_type is None:
        model_type = get_model_type()
    else:
        model_type = model_type.lower().strip()
    
    if model_type == 'logistic_regression':
        return LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='lbfgs'
        )
    elif model_type == 'random_forest':
        return RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
    elif model_type == 'xgboost':
        try:
            import xgboost as xgb
            return xgb.XGBClassifier(
                objective='binary:logistic',
                random_state=42,
                eval_metric='logloss'
            )
        except ImportError:
            raise ImportError(
                "XGBoost is not installed. Please install it with: pip install xgboost"
            )
    else:
        raise ValueError(f"Unknown model type: {model_type}")

