"""
Attendance Forecasting Training Script
Trains XGBoost models to predict next-day attendance probability.
- 90/10 train-test split
- 5-fold cross-validation
- Regression metrics (MAE, RMSE, R², ROC-AUC)
- Comprehensive evaluation plots:
  * Prediction vs actual scatter plot
  * Residuals distribution
  * Feature importance
  * Learning curves (train vs validation loss)
  * Prediction distribution histogram
  * Confusion matrix (binary classification)
  * ROC curve (binary classification)
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
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    confusion_matrix, roc_curve, auc, classification_report
)
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


def plot_learning_curves(eval_result, title, save_path):
    """Plot XGBoost learning curves (train vs validation loss over iterations)."""
    epochs = len(eval_result['validation_0']['logloss'])
    x_axis = range(0, epochs)
    
    plt.figure(figsize=(10, 6))
    plt.plot(x_axis, eval_result['validation_0']['logloss'], label='Train Loss', color='blue')
    plt.plot(x_axis, eval_result['validation_1']['logloss'], label='Validation Loss', color='red')
    plt.xlabel('Iteration (Boosting Round)')
    plt.ylabel('Log Loss')
    plt.title(title)
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def plot_prediction_distribution(y_true, y_pred, title, save_path):
    """Plot distribution of actual vs predicted values."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Actual distribution
    axes[0].hist(y_true, bins=20, edgecolor='black', alpha=0.7, color='blue', label='Actual')
    axes[0].set_xlabel('Attendance Probability')
    axes[0].set_ylabel('Frequency')
    axes[0].set_title('Actual Distribution')
    axes[0].set_xlim(0, 1)
    axes[0].grid(True, alpha=0.3)
    axes[0].legend()
    
    # Predicted distribution
    axes[1].hist(y_pred, bins=20, edgecolor='black', alpha=0.7, color='green', label='Predicted')
    axes[1].set_xlabel('Attendance Probability')
    axes[1].set_ylabel('Frequency')
    axes[1].set_title('Predicted Distribution')
    axes[1].set_xlim(0, 1)
    axes[1].grid(True, alpha=0.3)
    axes[1].legend()
    
    plt.suptitle(title, fontsize=14, y=1.02)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def plot_confusion_matrix(y_true, y_pred, title, save_path, threshold=0.5):
    """Plot confusion matrix by thresholding predictions."""
    # Convert probabilities to binary predictions
    y_pred_binary = (y_pred >= threshold).astype(int)
    y_true_binary = (y_true >= threshold).astype(int)
    
    cm = confusion_matrix(y_true_binary, y_pred_binary)
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True,
                xticklabels=['Absent (0)', 'Present (1)'],
                yticklabels=['Absent (0)', 'Present (1)'])
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title(f"{title}\n(Threshold: {threshold})")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    
    # Print classification report
    print(f"\n=== Classification Report (Threshold: {threshold}) ===")
    print(classification_report(y_true_binary, y_pred_binary, 
                                target_names=['Absent', 'Present']))


def plot_roc_curve(y_true, y_pred, title, save_path):
    """Plot ROC curve for binary classification."""
    # Convert actual values to binary (they should already be 0 or 1, but ensure)
    y_true_binary = (y_true >= 0.5).astype(int)
    
    # Calculate ROC curve
    fpr, tpr, thresholds = roc_curve(y_true_binary, y_pred)
    roc_auc = auc(fpr, tpr)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, 
             label=f'ROC curve (AUC = {roc_auc:.3f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random (AUC = 0.500)')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(title)
    plt.legend(loc="lower right")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    
    return roc_auc


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
    
    # Split training data further for validation set (for learning curves)
    X_train_fit, X_val, y_train_fit, y_val = train_test_split(
        X_train, y_train, test_size=0.1, random_state=42
    )
    
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
    
    # Fit with evaluation set to capture learning curves
    eval_set = [(X_train_fit, y_train_fit), (X_val, y_val)]
    model.fit(
        X_train_fit, y_train_fit,
        eval_set=eval_set,
        verbose=False
    )
    
    # Get evaluation results for learning curves
    eval_result = model.evals_result()
    
    # Predictions (use full training set for final metrics)
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
    
    print("\n=== Generating Evaluation Plots ===")
    
    # Essential regression plots
    plot_prediction_scatter(
        y_test, y_pred_test,
        title=f"Prediction vs Actual ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_scatter.png"
    )
    print("✓ Scatter plot saved")
    
    plot_residuals(
        y_test, y_pred_test,
        title=f"Residuals Distribution ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_residuals.png"
    )
    print("✓ Residuals plot saved")
    
    plot_feature_importance(
        model, X.shape[1],
        title=f"Feature Importance ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_fi.png"
    )
    print("✓ Feature importance plot saved")
    
    # Learning curves (train vs validation loss)
    plot_learning_curves(
        eval_result,
        title=f"Learning Curves ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_learning_curves.png"
    )
    print("✓ Learning curves saved")
    
    # Prediction distribution
    plot_prediction_distribution(
        y_test, y_pred_test,
        title=f"Prediction Distribution ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_distribution.png"
    )
    print("✓ Prediction distribution plot saved")
    
    # Binary classification metrics (threshold at 0.5)
    plot_confusion_matrix(
        y_test, y_pred_test,
        title=f"Confusion Matrix ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_confusion_matrix.png",
        threshold=0.5
    )
    print("✓ Confusion matrix saved")
    
    roc_auc = plot_roc_curve(
        y_test, y_pred_test,
        title=f"ROC Curve ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_roc_curve.png"
    )
    print(f"✓ ROC curve saved (AUC: {roc_auc:.3f})")

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
            "r2": float(test_r2),
            "roc_auc": float(roc_auc)
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

