"""
Attendance Forecasting Training Script
Trains XGBoost models to predict next-day attendance probability.
- 90/10 train-test split
- 5-fold cross-validation
- Regression metrics (MAE, RMSE, R²)
- Prediction vs actual scatter plots
"""

import argparse
import json
import os
import sys
import time
from typing import Any, Dict, List
import random

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import xgboost as xgb
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# -------------------- Utility functions --------------------

def load_training_data(file_path: str) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Training data file not found: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_dataset(data: Dict[str, Any], expected_features: int = 10) -> bool:
    if "samples" not in data or not data["samples"]:
        raise ValueError("Missing or empty 'samples' section")

    for i, sample in enumerate(data["samples"]):
        sample_id = sample.get("sample_id", f"sample_{i}")
        features = sample.get("features", [])
        target = sample.get("targets", {}).get("attendance_probability")

        if not sample.get("sample_id"):
            raise ValueError(f"Sample {i}: Missing sample_id field")
        if len(features) != expected_features:
            raise ValueError(f"Sample {sample_id}: Expected {expected_features} features, got {len(features)}")
        if not all(isinstance(f, (int, float)) for f in features):
            raise ValueError(f"Sample {sample_id}: All features must be numeric")
        if target is None:
            raise ValueError(f"Sample {sample_id}: Missing attendance_probability target")
        if not isinstance(target, (int, float)) or target < 0 or target > 1:
            raise ValueError(f"Sample {sample_id}: Invalid attendance_probability '{target}' (must be 0-1)")

    print(f"✓ Dataset validation passed: {len(data['samples'])} samples")
    return True


def plot_prediction_scatter(y_true, y_pred, title, save_path):
    """Plot predicted vs actual attendance probabilities."""
    plt.figure(figsize=(8, 6))
    plt.scatter(y_true, y_pred, alpha=0.5, s=20)
    plt.plot([0, 1], [0, 1], 'r--', lw=2, label='Perfect prediction')
    plt.xlabel('Actual Attendance Probability')
    plt.ylabel('Predicted Attendance Probability')
    plt.title(title)
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def plot_residuals(y_true, y_pred, title, save_path):
    """Plot residuals (errors) distribution."""
    residuals = y_true - y_pred
    plt.figure(figsize=(8, 6))
    plt.hist(residuals, bins=30, edgecolor='black', alpha=0.7)
    plt.xlabel('Residual (Actual - Predicted)')
    plt.ylabel('Frequency')
    plt.title(title)
    plt.axvline(x=0, color='r', linestyle='--', lw=2, label='Zero error')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def plot_feature_importance(model, feature_count, title, save_path):
    """Plot XGBoost feature importance."""
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:feature_count]
    plt.figure(figsize=(8, 6))
    plt.barh(range(len(indices)), importances[indices][::-1])
    plt.yticks(range(len(indices)), [f"Day {i}" for i in indices[::-1]])
    plt.xlabel("Importance")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


# -------------------- Training pipeline --------------------

def train_forecast_model(data_file: str, user_type: str):
    print("=" * 70)
    print(f"ATTENDANCE FORECASTING MODEL TRAINING ({user_type.upper()})")
    print("XGBoost Regression - 90/10 Split + 5-Fold CV")
    print("=" * 70)

    if user_type.upper() not in ['STUDENT', 'EMPLOYEE']:
        raise ValueError(f"Invalid user_type: {user_type}. Must be 'STUDENT' or 'EMPLOYEE'")

    data = load_training_data(data_file)
    validate_dataset(data, expected_features=10)
    samples = data["samples"]

    # Shuffle samples across all users for better generalization
    random.shuffle(samples)

    X = np.array([s["features"] for s in samples], dtype=float)
    y = np.array([s["targets"]["attendance_probability"] for s in samples], dtype=float)

    # 90/10 train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.1, random_state=42
    )

    print(f"✓ Training samples: {len(X_train)} | Test samples: {len(X_test)}")
    print(f"✓ Target distribution - Train: {np.mean(y_train):.3f} mean, Test: {np.mean(y_test):.3f} mean")

    models_dir = "ml/models/trained"
    os.makedirs(models_dir, exist_ok=True)

    print("\n=== Training Attendance Forecast Model (XGBoost) ===")
    
    # XGBoost with binary:logistic objective for probability output
    model = xgb.XGBRegressor(
        objective='binary:logistic',
        n_estimators=300,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss'
    )
    
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Clamp predictions to [0, 1]
    y_pred_train = np.clip(y_pred_train, 0, 1)
    y_pred_test = np.clip(y_pred_test, 0, 1)
    
    # Calculate metrics
    train_mae = mean_absolute_error(y_train, y_pred_train)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    train_r2 = r2_score(y_train, y_pred_train)
    
    test_mae = mean_absolute_error(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    test_r2 = r2_score(y_test, y_pred_test)
    
    print(f"\n=== Training Set Metrics ===")
    print(f"MAE:  {train_mae:.4f}")
    print(f"RMSE: {train_rmse:.4f}")
    print(f"R²:   {train_r2:.4f}")
    
    print(f"\n=== Test Set Metrics ===")
    print(f"MAE:  {test_mae:.4f}")
    print(f"RMSE: {test_rmse:.4f}")
    print(f"R²:   {test_r2:.4f}")
    
    # 5-fold cross-validation
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores_mae = -cross_val_score(model, X_train, y_train, cv=cv, scoring='neg_mean_absolute_error')
    cv_scores_r2 = cross_val_score(model, X_train, y_train, cv=cv, scoring='r2')
    
    print(f"\n=== 5-Fold Cross-Validation ===")
    print(f"MAE: {cv_scores_mae.mean():.4f} ± {cv_scores_mae.std():.4f}")
    print(f"R²:  {cv_scores_r2.mean():.4f} ± {cv_scores_r2.std():.4f}")

    user_type_lower = user_type.lower()
    model_filename = f"attendance_forecast_{user_type_lower}.joblib"
    
    # Generate plots
    plot_prediction_scatter(
        y_test, y_pred_test,
        title=f"Prediction vs Actual ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_scatter.png"
    )
    plot_residuals(
        y_test, y_pred_test,
        title=f"Residuals Distribution ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_residuals.png"
    )
    plot_feature_importance(
        model, X.shape[1],
        title=f"Feature Importance ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_fi.png"
    )

    # Save model
    joblib.dump(model, f"{models_dir}/{model_filename}")

    # Save metadata
    metadata = {
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "user_type": user_type.upper(),
        "model_filename": model_filename,
        "algorithm": "XGBoost",
        "objective": "binary:logistic",
        "samples_count": len(samples),
        "split": "90/10",
        "cross_validation": "5-fold",
        "test_metrics": {
            "mae": float(test_mae),
            "rmse": float(test_rmse),
            "r2": float(test_r2)
        },
        "cv_metrics": {
            "mae": {"mean": float(cv_scores_mae.mean()), "std": float(cv_scores_mae.std())},
            "r2": {"mean": float(cv_scores_r2.mean()), "std": float(cv_scores_r2.std())}
        },
        "features_per_sample": 10,
        "note": f"Attendance forecasting model for {user_type.upper()} (10-day binary sequence → next-day probability)"
    }

    with open(f"{models_dir}/training_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("\nModel + evaluation plots saved in:", models_dir)
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train attendance forecast model on 10-step sequences")
    parser.add_argument("--user-type", type=str, required=True, choices=['STUDENT', 'EMPLOYEE'],
                        help="User type for this model: STUDENT or EMPLOYEE")
    parser.add_argument("--data", type=str, required=True,
                        help="Path to training data JSON file")
    args = parser.parse_args()
    train_forecast_model(args.data, args.user_type)

