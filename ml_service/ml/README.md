# ML Attendance Forecasting Module

This module provides **machine learning-powered attendance forecasting** for Eduscan, predicting next-day attendance probability (0-1) from historical attendance patterns. Supports multiple model types: LogisticRegression, RandomForest, or XGBoost (configurable via `MODEL` environment variable).

---

## 🚀 Features

- **Temporal Feature Engineering**: Extracts 10-day binary attendance sequences (PRESENT=1, ABSENT=0) using sliding windows.
- **Attendance Forecasting**: Separate models (LogisticRegression, RandomForest, or XGBoost) for students and employees, predicting next-day attendance probability (0-1 continuous value). Model type configurable via `MODEL` environment variable.
- **Attendance Insights**: Computes average punctuality, average time balance, and overall attendance rate from session data.
- **Rule-based Fallback**: Simple attendance rate estimation when a trained model is unavailable.

---

## 🧩 Architecture

```
ml/
├── __init__.py
├── attendance_feature.py          # Extracts 10-feature binary sequences from attendance_state
├── analytics.py                   # Main orchestrator (loads user-type-specific models)
├── train_forecast.py              # Training script for forecasting models (LogisticRegression, RandomForest, or XGBoost)
├── extract_samples.py             # Sliding window sample extraction
├── models/
│   ├── forecaster/
│   │   └── attendance_forecast.py  # Attendance forecast model with rule-based fallback
│   └── trained/                  # Serialized model files (.joblib)
└── data/
    └── README.md                  # Dataset creation guide
```

---

## ⚙️ Setup

### 1. Install Dependencies

Install Python dependencies:

```bash
pip install -r requirements.txt
```

**Required packages:**

- scikit-learn
- joblib
- scipy
- python-dateutil
- matplotlib
- seaborn
- xgboost (for XGBoost model support)

---

### 2. Create Training Dataset

#### Extract Sliding Window Samples

Extract samples separately for each user type:

```bash
python ml/extract_samples.py --user-type STUDENT --output ml/data/training_data_s.json
python ml/extract_samples.py --user-type EMPLOYEE --output ml/data/training_data_e.json
```

The extractor:

- Requires **≥11** attendance_state entries (PRESENT/ABSENT) per user (to create at least 1 sliding window sample).
- Filters users by the specified `--user-type` (STUDENT or EMPLOYEE).
- Generates **sliding window samples**: for each user with N records, creates (N-10) samples.
- Each sample: features = [day_i, day_i+1, ..., day_i+9], target = day_i+10 (0 or 1).
- Samples are automatically labeled with `attendance_probability` (0.0 = ABSENT, 1.0 = PRESENT).
- Each sample has a unique `sample_id` in format `{user_id}_w{window_index}` (e.g., "21-12345_w0", "21-12345_w1").

#### Train the Forecasting Models

Train separate models for each user type. The model type is determined by the `MODEL` environment variable:

```bash
# Default: LogisticRegression
python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json
python ml/train_forecast.py --user-type EMPLOYEE --data ml/data/training_data_e.json

# Or specify model type via environment variable
MODEL=random_forest python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json
MODEL=xgboost python ml/train_forecast.py --user-type EMPLOYEE --data ml/data/training_data_e.json
```

Trained models are stored in `ml/models/trained/`:

- Format: `attendance_forecast_{model_type}_{user_type}.joblib`
  - Examples: `attendance_forecast_logistic_regression_student.joblib`, `attendance_forecast_xgboost_employee.joblib`
- `training_metadata_{user_type}.json` (updated per training run)
- Evaluation plots: scatter plots, residuals, feature importance, learning curves

---

## 📡 Usage

### Via API Endpoint

```bash
POST /api/performance-analytics/aggregate
Headers:
  X-Service-Password: <SERVICE_PASSWORD>
Body:
  {
    "user_ids": ["user_id_1", "user_id_2"],
    "user_type": "ALL"
  }
```

**Returns:**

- `average_punctuality` (in minutes)
- `average_time_balance` (in minutes)
- `attendance_forecast` (probability 0-1, confidence, factors)
- `attendance_rate` (percentage)
- `average_forecast_probability` (aggregate)

### Programmatic Usage

```python
from ml.analytics import get_analytics

analytics = get_analytics()
metrics = await analytics.compute_performance_metrics(user_id)
# metrics['attendanceForecast'] contains probability, confidence, factors
```

---

## 🧠 Feature Extraction

### Temporal Binary Sequence (10 features)

| Feature            | Description             | Example |
| ------------------ | ----------------------- | ------- |
| `attendance_state` | 1 = Present, 0 = Absent | 1       |

**Vector layout (most recent → oldest):**

```
[state_1, state_2, ..., state_10]
```

Where each `state_i` is:

- `1.0` = PRESENT
- `0.0` = ABSENT

> ⚠️ Cancelled sessions are excluded. If fewer than 10 records exist, oldest positions are padded with `0.0`.  
> ⚠️ **User type is NOT included in the feature vector** - models are trained separately for students and employees.

### Sliding Window Generation

For forecasting, we use **sliding windows** to create multiple training samples per user:

- User with 15 attendance records → 5 training samples
- Sample 1: days 1-10 → day 11
- Sample 2: days 2-11 → day 12
- Sample 3: days 3-12 → day 13
- Sample 4: days 4-13 → day 14
- Sample 5: days 5-14 → day 15

This maximizes training data and helps the model learn temporal patterns.

---

## 🧮 Model Details

### Attendance Forecast Model

- **Algorithms:** LogisticRegression, RandomForest, or XGBoost (selectable via `MODEL` environment variable)
- **Default:** LogisticRegression (if `MODEL` not set)
- **Input:** 10 numerical features (binary attendance sequence)
- **Output:** Continuous probability (0-1) for next-day attendance
- **Model files:** Format: `attendance_forecast_{model_type}_{user_type}.joblib`
  - Examples: `attendance_forecast_logistic_regression_student.joblib`, `attendance_forecast_xgboost_employee.joblib`
  - Backward compatible with legacy format: `attendance_forecast_{user_type}.joblib`
- **Model Selection:** Set `MODEL` environment variable to one of:
  - `logistic_regression` (default)
  - `random_forest`
  - `xgboost`
- **Hyperparameters:**
  - **LogisticRegression:** `max_iter=1000`, `solver='lbfgs'`, `random_state=42`
  - **RandomForest:** `n_estimators=100`, `random_state=42`, `n_jobs=-1`
  - **XGBoost:** `objective='binary:logistic'`, `random_state=42`, `eval_metric='logloss'`

### Why Forecasting is Machine Learning

Even with binary (0/1) training labels, ML models learn **expected probabilities** from patterns:

- **Streaks**: Long absence streaks vs. isolated absences
- **Trends**: Improving or declining attendance patterns
- **Volatility**: Chaotic vs. consistent attendance patterns
- **Temporal dependencies**: Day-of-week effects, recent history importance

A simple attendance rate cannot capture these sequence patterns, making ML essential for accurate forecasting.

---

## 🔁 Retraining Schedule

Retrain periodically (monthly recommended):

```bash
0 0 1 * * cd /path/to/eduscan && \
python ml/extract_samples.py --user-type STUDENT --output ml/data/training_data_s.json && \
python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json && \
python ml/extract_samples.py --user-type EMPLOYEE --output ml/data/training_data_e.json && \
python ml/train_forecast.py --user-type EMPLOYEE --data ml/data/training_data_e.json
```

---

## ⚡ Performance Optimization

- **Caching:** Cache analytics per user (5-minute TTL suggested)
- **Database:** Ensure indexes on:

  - `session.user_id`
  - `session.arrival`
  - `attendance_forecast.user_id`
  - `attendance_forecast.forecast_date`

- **Query limits:** Only fetch the **15 most recent sessions** per user

---

## 🧭 Fallback Behavior

If models are missing or not yet trained:

| Metric              | Fallback Method                                                          |
| ------------------- | ------------------------------------------------------------------------ |
| Attendance Forecast | Rule-based: Uses simple attendance rate over last 10 days as probability |

**Rule-based logic:** Calculates mean attendance rate across the 10-day window and uses it as the probability estimate. Confidence is based on pattern consistency (variance).

This ensures Eduscan remains functional even without trained ML models.

---

## 📊 Metrics Returned

| Metric                     | Description                                        | Source                               |
| -------------------------- | -------------------------------------------------- | ------------------------------------ |
| **Average Arrival Offset** | Average lateness or earliness in minutes           | Computed from `session.punctuality`  |
| **Average Time Balance**   | Average undertime or overtime in minutes           | Computed from `session.time_balance` |
| **Attendance Forecast**    | ML-predicted next-day attendance probability (0-1) | ML model (LogisticRegression, RandomForest, or XGBoost) |
| **Attendance Rate**        | Lifetime PRESENT vs ABSENT percentage              | `attendance_state` aggregation       |

### Forecast Output Format

```json
{
  "attendanceForecast": {
    "probability": 0.75,
    "confidence": 82,
    "factors": [
      "Improving attendance trend",
      "Strong attendance record (8/10 present)",
      "High likelihood of attendance (75.0%)"
    ]
  }
}
```

---

## 🧰 Troubleshooting

### **Error:** `No training data available`

- Ensure each user has at least **11 attendance_state entries** (PRESENT/ABSENT) for sliding windows
- Verify Supabase connection

### **Error:** `Model not found`

- Retrain with appropriate user type:
  ```bash
  python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json
  python ml/train_forecast.py --user-type EMPLOYEE --data ml/data/training_data_e.json
  ```
- The system will automatically fall back to rule-based logic

### **Low prediction accuracy**

- Add more training samples (more users or longer history)
- Ensure diverse attendance patterns in training data
- Check data quality in `session` and `attendance_state`
- Review evaluation plots (scatter, residuals) for model diagnostics

---

## 📁 Data Management Workflow

### 1. Create Training Dataset

- Use [`ml/data/README.md`](./data/README.md) for the sliding window schema.
- Extract sliding window samples using `extract_samples.py` (automatically generates labeled samples with unique `sample_id`).
- Each sample has a unique `sample_id` in format `{user_id}_w{window_index}` to avoid confusion when multiple samples come from the same user.
- Save as separate files: `ml/data/training_data_s.json` (students) and `ml/data/training_data_e.json` (employees).

### 2. Train Models

```bash
python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json
python ml/train_forecast.py --user-type EMPLOYEE --data ml/data/training_data_e.json
```

### 3. Deploy and Test

```bash
uvicorn main:app --reload
curl -X POST "http://localhost:8000/api/performance-analytics/aggregate" \
  -H "X-Service-Password: YOUR_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["user_id"], "user_type": "ALL"}'
```

---

## ✅ Validation & Testing Checklist

1. **Dataset sanity check**
   - Run `python ml/extract_samples.py --user-type STUDENT` and verify sliding window samples are generated.
   - Confirm each sample has a unique `sample_id` in format `{user_id}_w{window_index}`.
   - Confirm each sample has 10 features and a target (0 or 1).
2. **Training pipeline**
   - Execute `python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json`.
   - Inspect `ml/models/trained/attendance_forecast_student_scatter.png` and `_residuals.png` for model quality.
   - Check MAE, RMSE, and R² metrics in console output.
   - Repeat for employees with `--user-type EMPLOYEE`.
3. **API verification**
   - Start the FastAPI server (`uvicorn main:app --reload`).
   - Call `POST /api/performance-analytics/aggregate` and ensure `attendanceForecast.probability` is in range [0, 1].
   - Verify the correct model (student/employee) is loaded based on user type.
4. **End-to-end UI**
   - Trigger the Supabase edge function via the Next.js frontend.
   - Confirm forecast probabilities are displayed correctly.
5. **Fallback mode**
   - Temporarily remove `ml/models/trained/attendance_forecast_student.joblib` and restart the backend.
   - Ensure rule-based outputs still return probabilities with explanatory factors.

---

## 🔮 Future Enhancements

- **Multi-day forecasting**: Predict attendance for next week/month
- Integration with **weather/events** as contextual features
- **Day-of-week features**: Capture weekly patterns
- **Intervention recommendations**: Suggest actions based on low forecast probability
- A/B testing for prediction model comparison
- **Ensemble methods**: Combine multiple models for better accuracy

---

✅ **This README matches the current Eduscan implementation**:

- Uses sliding window approach for training data generation.
- ML models (LogisticRegression, RandomForest, or XGBoost) predict continuous probabilities (0-1) for next-day attendance.
- All models use standardized `predict_proba()` interface for consistent probability outputs.
- `analytics.py` queries both `session` (stats) and `attendance_state` (sequences) tables.
- `attendance_feature.py` exposes `extract_binary_sequence` for inference.
- Rule-based fallbacks use simple attendance rate when models unavailable.
- Separate models for students and employees.
