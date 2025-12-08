"""
Attendance Forecasting Training Script
Trains models (LogisticRegression, RandomForest, or XGBoost) to predict next-day attendance probability.
Model selection via MODEL environment variable (default: logistic_regression).
- 90/10 train-test split
- 5-fold cross-validation
- Regression metrics (MAE, RMSE, R², ROC-AUC)
- Comprehensive evaluation plots:
  * Prediction vs actual scatter plot
  * Residuals distribution
  * Feature importance
  * Learning curves (XGBoost shows real curves, others use placeholder)
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
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    confusion_matrix, roc_curve, auc, classification_report
)
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.models.forecaster.model_factory import get_model_type, create_model


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


def plot_feature_importance(model, model_type, feature_count, title, save_path):
    """Plot feature importance for different model types."""
    # Get importances based on model type
    if model_type == 'logistic_regression':
        importances = np.abs(model.coef_[0])
        xlabel = "Coefficient Magnitude (Importance)"
    elif model_type in ['random_forest', 'xgboost']:
        importances = model.feature_importances_
        xlabel = "Feature Importance"
    else:
        raise ValueError(f"Unknown model type for feature importance: {model_type}")
    
    indices = np.argsort(importances)[::-1][:feature_count]
    plt.figure(figsize=(8, 6))
    plt.barh(range(len(indices)), importances[indices][::-1])
    plt.yticks(range(len(indices)), [f"Day {i}" for i in indices[::-1]])
    plt.xlabel(xlabel)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def plot_learning_curves(model, model_type, eval_result, X_train, y_train, X_val, y_val, title, save_path):
    """Plot learning curves based on model type.
    
    - XGBoost: Real learning curves from eval_result
    - RandomForest/LogisticRegression: Placeholder explaining training method
    """
    if model_type == 'xgboost' and eval_result is not None:
        # Plot real XGBoost learning curves
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
    else:
        # Placeholder for models without iterative training
        if model_type == 'logistic_regression':
            message = ('LogisticRegression uses direct optimization\n'
                      '(not iterative training like tree-based models).\n\n'
                      'The model is trained using maximum likelihood estimation\n'
                      'with LBFGS solver, which converges in a single optimization run.')
        elif model_type == 'random_forest':
            message = ('RandomForest uses ensemble of decision trees\n'
                      '(not iterative training like gradient boosting).\n\n'
                      'The model trains multiple trees independently\n'
                      'and aggregates their predictions.')
        else:
            message = ('This model type does not support iterative training curves.')
        
        plt.figure(figsize=(10, 6))
        plt.text(0.5, 0.5, message,
                ha='center', va='center', fontsize=12,
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        plt.xlim(0, 1)
        plt.ylim(0, 1)
        plt.axis('off')
        plt.title(title)
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
    
    # Get unique classes present
    unique_true = np.unique(y_true_binary)
    unique_pred = np.unique(y_pred_binary)
    unique_classes = np.unique(np.concatenate([unique_true, unique_pred]))
    
    # Create confusion matrix with labels to ensure 2x2 even if only one class present
    cm = confusion_matrix(y_true_binary, y_pred_binary, labels=[0, 1])
    
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
    
    # Print classification report only if both classes are present
    print(f"\n=== Classification Report (Threshold: {threshold}) ===")
    if len(unique_classes) >= 2:
        print(classification_report(y_true_binary, y_pred_binary, 
                                    target_names=['Absent', 'Present'],
                                    zero_division=0))
    else:
        # Only one class present - can't compute standard classification metrics
        if 0 in unique_classes:
            print("All samples are classified as ABSENT (0).")
            print("Cannot compute classification metrics with only one class.")
        else:
            print("All samples are classified as PRESENT (1).")
            print("Cannot compute classification metrics with only one class.")


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
    # Get model type from environment variable
    model_type = get_model_type()
    model_type_display = model_type.replace('_', ' ').title()
    
    print("=" * 70)
    print(f"ATTENDANCE FORECASTING MODEL TRAINING ({user_type.upper()})")
    print(f"{model_type_display} - 90/10 Split + 5-Fold CV")
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

    print(f"\n=== Training Attendance Forecast Model ({model_type_display}) ===")
    
    # Split training data further for validation set (for learning curves)
    X_train_fit, X_val, y_train_fit, y_val = train_test_split(
        X_train, y_train, test_size=0.1, random_state=42
    )
    
    # Create model based on type
    model = create_model(model_type)
    
    # Fit the model (XGBoost needs eval_set for learning curves)
    eval_result = None
    if model_type == 'xgboost':
        eval_set = [(X_train_fit, y_train_fit), (X_val, y_val)]
        model.fit(
            X_train_fit, y_train_fit,
            eval_set=eval_set,
            verbose=False
        )
        eval_result = model.evals_result()
    else:
        model.fit(X_train_fit, y_train_fit)
    
    # Predictions (use full training set for final metrics)
    # Use predict_proba for probability output (standardized interface)
    y_pred_train = model.predict_proba(X_train)[:, 1]
    y_pred_test = model.predict_proba(X_test)[:, 1]
    
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
    # Manual cross-validation to use predict_proba (probabilities) instead of predict() (class labels)
    # This ensures regression metrics (MAE, R²) use probabilities
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    
    cv_scores_mae_list = []
    cv_scores_r2_list = []
    
    for train_idx, val_idx in cv.split(X_train):
        X_cv_train, X_cv_val = X_train[train_idx], X_train[val_idx]
        y_cv_train, y_cv_val = y_train[train_idx], y_train[val_idx]
        
        # Create a new model for this fold
        cv_model = create_model(model_type)
        if model_type == 'xgboost':
            cv_model.fit(X_cv_train, y_cv_train, verbose=False)
        else:
            cv_model.fit(X_cv_train, y_cv_train)
        
        # Get probabilities (predict_proba returns [P(class_0), P(class_1)])
        y_cv_pred_proba = cv_model.predict_proba(X_cv_val)[:, 1]
        
        # Calculate metrics using probabilities
        cv_scores_mae_list.append(mean_absolute_error(y_cv_val, y_cv_pred_proba))
        cv_scores_r2_list.append(r2_score(y_cv_val, y_cv_pred_proba))
    
    cv_scores_mae = np.array(cv_scores_mae_list)
    cv_scores_r2 = np.array(cv_scores_r2_list)
    
    print(f"\n=== 5-Fold Cross-Validation ===")
    print(f"MAE: {cv_scores_mae.mean():.4f} ± {cv_scores_mae.std():.4f}")
    print(f"R²:  {cv_scores_r2.mean():.4f} ± {cv_scores_r2.std():.4f}")

    user_type_lower = user_type.lower()
    model_filename = f"attendance_forecast_{model_type}_{user_type_lower}.joblib"
    
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
        model, model_type, X.shape[1],
        title=f"Feature Importance ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_fi.png"
    )
    print("✓ Feature importance plot saved")
    
    # Learning curves (XGBoost shows real curves, others use placeholder)
    plot_learning_curves(
        model, model_type, eval_result, X_train_fit, y_train_fit, X_val, y_val,
        title=f"Learning Curves ({user_type.upper()})",
        save_path=f"{models_dir}/attendance_forecast_{user_type_lower}_learning_curves.png"
    )
    if model_type == 'xgboost':
        print("✓ Learning curves saved")
    else:
        print("✓ Learning curves placeholder saved")
    
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
        "model_type": model_type,
        "algorithm": model_type_display,
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

    # Save metadata per user type to avoid overwriting between STUDENT/EMPLOYEE runs
    metadata_filename = f"training_metadata_{user_type_lower}.json"
    with open(f"{models_dir}/{metadata_filename}", "w") as f:
        json.dump(metadata, f, indent=2)

    # Backward compatibility: also write the generic file
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

