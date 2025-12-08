# ML Algorithm Parameter Tuning Guide

This guide explains how to tune hyperparameters for the attendance forecasting models (LogisticRegression, RandomForest, and XGBoost) to improve prediction accuracy.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Parameter Tuning Workflow](#parameter-tuning-workflow)
3. [LogisticRegression Parameters](#logisticregression-parameters)
4. [RandomForest Parameters](#randomforest-parameters)
5. [XGBoost Parameters](#xgboost-parameters)
6. [How to Modify Parameters](#how-to-modify-parameters)
7. [Evaluation Metrics](#evaluation-metrics)
8. [Best Practices](#best-practices)
9. [Example Tuning Scenarios](#example-tuning-scenarios)

---

## Overview

Parameter tuning (hyperparameter optimization) is the process of finding the best combination of model parameters that maximize prediction performance. Each algorithm has different parameters that control its learning behavior.

### Current Default Parameters

- **LogisticRegression**: `max_iter=1000`, `solver='lbfgs'`, `random_state=42`
- **RandomForest**: `n_estimators=100`, `random_state=42`, `n_jobs=-1`
- **XGBoost**: `objective='binary:logistic'`, `random_state=42`, `eval_metric='logloss'`

---

## Parameter Tuning Workflow

1. **Baseline**: Train with default parameters and record metrics
2. **Identify Issues**: Analyze evaluation plots (scatter, residuals, learning curves)
3. **Tune Parameters**: Modify parameters based on observed issues
4. **Re-train**: Train with new parameters
5. **Compare**: Compare metrics with baseline
6. **Iterate**: Repeat until satisfactory performance

---

## LogisticRegression Parameters

### Key Parameters

| Parameter      | Default | Description                        | Tuning Strategy                                                                 |
| -------------- | ------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `max_iter`     | 1000    | Maximum iterations for convergence | Increase if convergence warning appears                                         |
| `solver`       | 'lbfgs' | Optimization algorithm             | Try 'liblinear' for small datasets, 'saga' for large                            |
| `C`            | 1.0     | Inverse regularization strength    | Lower = more regularization (prevent overfitting), Higher = less regularization |
| `penalty`      | 'l2'    | Regularization type                | 'l1' for feature selection, 'l2' for general regularization                     |
| `random_state` | 42      | Random seed                        | Keep fixed for reproducibility                                                  |

### When to Tune

- **High variance (overfitting)**: Increase `C` or add regularization
- **High bias (underfitting)**: Decrease `C` or change solver
- **Convergence warnings**: Increase `max_iter`
- **Slow training**: Try different solver (e.g., 'liblinear' for small datasets)

### Example Tuning

```python
# In ml/models/forecaster/model_factory.py

if model_type == 'logistic_regression':
    return LogisticRegression(
        max_iter=2000,        # Increased from 1000
        random_state=42,
        solver='lbfgs',
        C=0.1,                 # Added: stronger regularization
        penalty='l2'          # Explicit regularization
    )
```

### Parameter Ranges to Try

- `C`: [0.001, 0.01, 0.1, 1.0, 10.0, 100.0]
- `max_iter`: [1000, 2000, 5000]
- `solver`: ['lbfgs', 'liblinear', 'saga'] (depends on dataset size)

---

## RandomForest Parameters

### Key Parameters

| Parameter           | Default | Description                   | Tuning Strategy                                          |
| ------------------- | ------- | ----------------------------- | -------------------------------------------------------- |
| `n_estimators`      | 100     | Number of trees in forest     | More trees = better performance but slower (try 100-500) |
| `max_depth`         | None    | Maximum tree depth            | Limit to prevent overfitting (try 5-20)                  |
| `min_samples_split` | 2       | Minimum samples to split node | Increase to reduce overfitting (try 2-10)                |
| `min_samples_leaf`  | 1       | Minimum samples in leaf       | Increase to reduce overfitting (try 1-5)                 |
| `max_features`      | 'sqrt'  | Features considered per split | 'sqrt', 'log2', or number (try 'sqrt', 'log2', 0.5)      |
| `n_jobs`            | -1      | Parallel jobs                 | Keep -1 for all CPU cores                                |
| `random_state`      | 42      | Random seed                   | Keep fixed for reproducibility                           |

### When to Tune

- **Overfitting**: Increase `min_samples_split`, `min_samples_leaf`, or limit `max_depth`
- **Underfitting**: Increase `n_estimators`, remove `max_depth` limit, decrease `min_samples_split`
- **Slow training**: Decrease `n_estimators` or `max_features`
- **Low feature importance**: Try different `max_features` values

### Example Tuning

```python
# In ml/models/forecaster/model_factory.py

elif model_type == 'random_forest':
    return RandomForestClassifier(
        n_estimators=200,           # Increased from 100
        max_depth=10,                # Added: limit depth to prevent overfitting
        min_samples_split=5,        # Added: require more samples to split
        min_samples_leaf=2,         # Added: require more samples in leaves
        max_features='sqrt',         # Default: good for most cases
        random_state=42,
        n_jobs=-1
    )
```

### Parameter Ranges to Try

- `n_estimators`: [50, 100, 200, 300, 500]
- `max_depth`: [5, 10, 15, 20, None]
- `min_samples_split`: [2, 5, 10, 20]
- `min_samples_leaf`: [1, 2, 4, 8]
- `max_features`: ['sqrt', 'log2', 0.5, 0.7]

---

## XGBoost Parameters

### Key Parameters

| Parameter          | Default           | Description               | Tuning Strategy                                   |
| ------------------ | ----------------- | ------------------------- | ------------------------------------------------- |
| `objective`        | 'binary:logistic' | Loss function             | Keep for binary classification                    |
| `n_estimators`     | 100               | Number of boosting rounds | Increase for better performance (try 100-500)     |
| `max_depth`        | 6                 | Maximum tree depth        | Lower = less overfitting (try 3-10)               |
| `learning_rate`    | 0.3               | Step size shrinkage       | Lower = more conservative (try 0.01-0.3)          |
| `subsample`        | 1.0               | Row sampling ratio        | <1.0 prevents overfitting (try 0.6-1.0)           |
| `colsample_bytree` | 1.0               | Column sampling ratio     | <1.0 prevents overfitting (try 0.6-1.0)           |
| `reg_alpha`        | 0                 | L1 regularization         | Increase to prevent overfitting (try 0, 0.1, 1.0) |
| `reg_lambda`       | 1                 | L2 regularization         | Increase to prevent overfitting (try 1, 10, 100)  |
| `eval_metric`      | 'logloss'         | Evaluation metric         | Keep for binary classification                    |
| `random_state`     | 42                | Random seed               | Keep fixed for reproducibility                    |

### When to Tune

- **Overfitting**: Increase `reg_alpha`, `reg_lambda`, decrease `max_depth`, reduce `subsample`/`colsample_bytree`
- **Underfitting**: Increase `n_estimators`, `max_depth`, `learning_rate`
- **Slow training**: Decrease `n_estimators`, increase `learning_rate`
- **Poor generalization**: Tune `subsample` and `colsample_bytree`

### Example Tuning

```python
# In ml/models/forecaster/model_factory.py

elif model_type == 'xgboost':
    try:
        import xgboost as xgb
        return xgb.XGBClassifier(
            objective='binary:logistic',
            n_estimators=300,           # Increased from default 100
            max_depth=4,                # Added: limit depth
            learning_rate=0.1,          # Added: lower learning rate
            subsample=0.8,               # Added: row sampling
            colsample_bytree=0.8,       # Added: column sampling
            reg_alpha=0.1,              # Added: L1 regularization
            reg_lambda=1.0,             # Added: L2 regularization
            random_state=42,
            eval_metric='logloss'
        )
```

### Parameter Ranges to Try

- `n_estimators`: [100, 200, 300, 500]
- `max_depth`: [3, 4, 5, 6, 7, 10]
- `learning_rate`: [0.01, 0.05, 0.1, 0.2, 0.3]
- `subsample`: [0.6, 0.7, 0.8, 0.9, 1.0]
- `colsample_bytree`: [0.6, 0.7, 0.8, 0.9, 1.0]
- `reg_alpha`: [0, 0.1, 1.0, 10.0]
- `reg_lambda`: [1, 10, 100]

---

## How to Modify Parameters

### Step 1: Edit Model Factory

Open `ml/models/forecaster/model_factory.py` and modify the `create_model()` function:

```python
def create_model(model_type: str = None) -> Any:
    # ... existing code ...

    if model_type == 'logistic_regression':
        return LogisticRegression(
            # Add or modify parameters here
            max_iter=2000,
            C=0.1,
            # ... etc
        )
```

### Step 2: Re-train Model

After modifying parameters, re-train the model:

```bash
# Set model type (if not using default)
export MODEL=random_forest  # or logistic_regression, xgboost

# Re-train for students
python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json

# Re-train for employees
python ml/train_forecast.py --user-type EMPLOYEE --data ml/data/training_data_e.json
```

### Step 3: Compare Results

Compare evaluation metrics from the training output:

- **MAE** (Mean Absolute Error): Lower is better
- **RMSE** (Root Mean Squared Error): Lower is better
- **R²** (R-squared): Higher is better (closer to 1.0)
- **ROC-AUC**: Higher is better (closer to 1.0)

Check the evaluation plots in `ml/models/trained/`:

- `*_scatter.png`: Should show points close to diagonal line
- `*_residuals.png`: Should be centered around zero
- `*_learning_curves.png`: Should show convergence (XGBoost only)

---

## Evaluation Metrics

### Understanding Metrics

| Metric      | Range   | Ideal Value | Interpretation                   |
| ----------- | ------- | ----------- | -------------------------------- |
| **MAE**     | 0 to 1  | < 0.3       | Average prediction error         |
| **RMSE**    | 0 to 1  | < 0.35      | Penalizes large errors more      |
| **R²**      | -∞ to 1 | > 0.5       | Proportion of variance explained |
| **ROC-AUC** | 0 to 1  | > 0.7       | Classification performance       |

### What Good Performance Looks Like

- **MAE < 0.25**: Predictions are within 25% on average
- **R² > 0.6**: Model explains >60% of variance
- **ROC-AUC > 0.75**: Good discrimination between classes
- **Scatter plot**: Points clustered near diagonal line
- **Residuals**: Centered around zero, no clear patterns

---

## Best Practices

### 1. Start with Defaults

Always establish a baseline with default parameters before tuning.

### 2. Tune One Parameter at a Time

Change one parameter, observe results, then move to the next. This helps identify which parameters matter most.

### 3. Use Cross-Validation

The training script uses 5-fold cross-validation. Pay attention to CV metrics (mean ± std) to assess stability.

### 4. Watch for Overfitting

Signs of overfitting:

- Large gap between training and test metrics
- Test metrics worse than training metrics
- Learning curves diverge (XGBoost)

Solutions:

- Increase regularization
- Reduce model complexity (lower `max_depth`, fewer `n_estimators`)
- Increase `min_samples_split`/`min_samples_leaf` (RandomForest)

### 5. Watch for Underfitting

Signs of underfitting:

- Poor performance on both training and test sets
- High bias (predictions consistently off)
- Learning curves plateau at high error (XGBoost)

Solutions:

- Increase model complexity
- Decrease regularization
- Increase `n_estimators` or `max_depth`

### 6. Consider Dataset Size

- **Small datasets (< 1000 samples)**: Prefer simpler models (LogisticRegression) or strong regularization
- **Medium datasets (1000-10000)**: RandomForest or XGBoost with moderate complexity
- **Large datasets (> 10000)**: XGBoost with more trees, deeper trees

### 7. Balance Training Time vs. Performance

- More `n_estimators` = better performance but slower training
- Deeper trees = better performance but risk of overfitting
- Find the sweet spot for your use case

---

## Example Tuning Scenarios

### Scenario 1: Overfitting with RandomForest

**Symptoms**: High training R² (>0.9) but low test R² (<0.5)

**Solution**:

```python
return RandomForestClassifier(
    n_estimators=200,
    max_depth=8,              # Limit depth
    min_samples_split=10,     # Require more samples
    min_samples_leaf=4,       # Require more in leaves
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)
```

### Scenario 2: Underfitting with XGBoost

**Symptoms**: Low R² on both training and test (<0.4)

**Solution**:

```python
return xgb.XGBClassifier(
    objective='binary:logistic',
    n_estimators=500,         # More trees
    max_depth=6,              # Deeper trees
    learning_rate=0.1,        # Moderate learning rate
    subsample=0.9,            # Use most data
    colsample_bytree=0.9,
    reg_alpha=0,              # Less regularization
    reg_lambda=1,
    random_state=42,
    eval_metric='logloss'
)
```

### Scenario 3: Slow Convergence with LogisticRegression

**Symptoms**: Convergence warnings during training

**Solution**:

```python
return LogisticRegression(
    max_iter=5000,            # More iterations
    solver='lbfgs',           # Or try 'saga' for large datasets
    C=1.0,                     # Default regularization
    random_state=42
)
```

### Scenario 4: Poor Feature Importance (RandomForest)

**Symptoms**: All features have similar importance, model not learning patterns

**Solution**:

```python
return RandomForestClassifier(
    n_estimators=300,         # More trees for stability
    max_depth=12,             # Allow deeper splits
    min_samples_split=2,      # Allow more splits
    max_features='log2',       # Try different feature sampling
    random_state=42,
    n_jobs=-1
)
```

---

## Advanced: Grid Search (Future Enhancement)

For systematic parameter tuning, consider implementing grid search:

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [5, 10, 15],
    'min_samples_split': [2, 5, 10]
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='neg_mean_absolute_error',
    n_jobs=-1
)
grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_
```

---

## Troubleshooting

### Issue: Model takes too long to train

**Solutions**:

- Reduce `n_estimators` (RandomForest/XGBoost)
- Limit `max_depth`
- Use fewer features (`max_features` for RandomForest)
- Try LogisticRegression for faster training

### Issue: Memory errors

**Solutions**:

- Reduce `n_estimators`
- Use `n_jobs=1` instead of `-1` (less parallelization)
- Process smaller batches of data

### Issue: Inconsistent results between runs

**Solutions**:

- Ensure `random_state` is set (default: 42)
- Check that data is shuffled consistently
- Verify same train/test split (random_state=42 in train_test_split)

---

## Summary

1. **Start simple**: Use default parameters as baseline
2. **Identify problem**: Overfitting vs. underfitting
3. **Tune systematically**: One parameter at a time
4. **Evaluate properly**: Use cross-validation metrics
5. **Document changes**: Keep track of what works
6. **Balance trade-offs**: Performance vs. training time vs. complexity

For questions or issues, refer to:

- [ML Module README](./README.md)
- [Scikit-learn Documentation](https://scikit-learn.org/stable/)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
