"""
Enhanced ML Classifier Training Script
- 90/10 train-test split
- 5-fold cross-validation
- Feature importance + confusion matrix plots
"""

import argparse
import json
import os
import sys
import time
from typing import Any, Dict, List
from collections import Counter

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
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

    allowed_labels = {"AT_RISK", "NOT_AT_RISK"}

    for i, sample in enumerate(data["samples"]):
        features = sample.get("features", [])
        target = sample.get("targets", {}).get("dropout_risk")

        if len(features) != expected_features:
            raise ValueError(f"Sample {i}: Expected {expected_features} features, got {len(features)}")
        if not all(isinstance(f, (int, float)) for f in features):
            raise ValueError(f"Sample {i}: All features must be numeric")
        if target not in allowed_labels:
            raise ValueError(f"Sample {i}: Invalid dropout_risk label '{target}'")

    print(f"✓ Dataset validation passed: {len(data['samples'])} samples")
    return True


def plot_confusion_matrix(y_true, y_pred, classes, title, save_path):
    cm = confusion_matrix(y_true, y_pred, labels=classes)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=classes, yticklabels=classes)
    plt.title(title)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def plot_feature_importance(model, feature_count, title, save_path):
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:15]
    plt.figure(figsize=(8, 6))
    plt.barh(range(len(indices)), importances[indices][::-1])
    plt.yticks(range(len(indices)), [f"Feature {i}" for i in indices[::-1]])
    plt.title(title)
    plt.xlabel("Importance")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


# -------------------- Training pipeline --------------------

def train_classifier(data_file: str, user_type: str):
    print("=" * 70)
    print(f"DROP-OUT RISK CLASSIFIER TRAINING ({user_type.upper()})")
    print("90/10 Split + 5-Fold CV")
    print("=" * 70)

    if user_type.upper() not in ['STUDENT', 'EMPLOYEE']:
        raise ValueError(f"Invalid user_type: {user_type}. Must be 'STUDENT' or 'EMPLOYEE'")

    data = load_training_data(data_file)
    validate_dataset(data, expected_features=10)
    samples = data["samples"]

    X = np.array([s["features"] for s in samples], dtype=float)
    y = np.array([s["targets"]["dropout_risk"] for s in samples])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.1, random_state=42, stratify=y
    )

    print(f"✓ Training samples: {len(X_train)} | Test samples: {len(X_test)}")

    models_dir = "ml/models/trained"
    os.makedirs(models_dir, exist_ok=True)

    print("\n=== Training Dropout Risk Classifier ===")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=5,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        class_weight="balanced_subsample",
    )
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    acc = clf.score(X_test, y_test)

    print(f"✓ Test Accuracy: {acc:.3f}")
    print(classification_report(
        y_test,
        preds,
        labels=["AT_RISK", "NOT_AT_RISK"],
        target_names=["AT_RISK", "NOT_AT_RISK"],
        digits=3
    ))

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X_train, y_train, cv=cv)
    print(f"✓ 5-Fold CV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    user_type_lower = user_type.lower()
    model_filename = f"dropout_risk_{user_type_lower}.joblib"
    
    plot_confusion_matrix(
        y_test, preds, classes=["AT_RISK", "NOT_AT_RISK"],
        title=f"Dropout Risk Confusion Matrix ({user_type.upper()})",
        save_path=f"{models_dir}/dropout_risk_{user_type_lower}_cm.png"
    )
    plot_feature_importance(
        clf, X.shape[1],
        title=f"Dropout Risk Feature Importance ({user_type.upper()})",
        save_path=f"{models_dir}/dropout_risk_{user_type_lower}_fi.png"
    )

    joblib.dump(clf, f"{models_dir}/{model_filename}")

    metadata = {
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "user_type": user_type.upper(),
        "model_filename": model_filename,
        "samples_count": len(samples),
        "split": "90/10",
        "cross_validation": "5-fold",
        "test_accuracy": {
            "dropout_risk": float(acc)
        },
        "cv_accuracy": {
            "dropout_risk": {"mean": float(cv_scores.mean()), "std": float(cv_scores.std())},
        },
        "features_per_sample": 10,
        "note": f"Simplified temporal classifier for {user_type.upper()} (10 binary marks only)"
    }

    with open(f"{models_dir}/training_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("\nModel + evaluation plots saved in:", models_dir)
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train dropout risk classifier on 10-step sequences")
    parser.add_argument("--user-type", type=str, required=True, choices=['STUDENT', 'EMPLOYEE'],
                        help="User type for this model: STUDENT or EMPLOYEE")
    parser.add_argument("--data", type=str, required=True,
                        help="Path to training data JSON file")
    args = parser.parse_args()
    train_classifier(args.data, args.user_type)
