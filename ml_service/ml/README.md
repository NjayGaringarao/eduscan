# ML Performance Analytics Module

This module provides **machine learning-powered analytics** for Eduscan’s attendance data, enabling dropout risk and performance trend prediction from user session logs.

---

## 🚀 Features

- **Temporal Feature Engineering**: Extracts 10-day binary attendance sequences (PRESENT=1, ABSENT=0).
- **Dropout Risk Classification**: Separate Random Forest classifiers for students and employees, predicting `AT_RISK` vs `NOT_AT_RISK` with literature-backed thresholds (70% for students, 90% for employees).
- **Attendance Insights**: Computes average punctuality, average time balance, and overall attendance rate from session data.
- **Rule-based Fallback**: Deterministic logic that mirrors the same thresholds when a trained model is unavailable.

---

## 🧩 Architecture

```
ml/
├── __init__.py
├── attendance_feature.py          # Extracts 10-feature binary sequences from attendance_state
├── analytics.py                   # Main orchestrator (loads user-type-specific models)
├── train_classifier.py            # Training script (requires --user-type flag)
├── models/
│   ├── classifier/
│   │   └── dropout_risk.py       # Dropout risk classifier with rule-based fallback
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

---

### 2. Create Training Dataset

#### Option A: Extract Unlabeled Samples (Recommended)

Extract samples separately for each user type:

```bash
python ml/extract_samples.py --user-type STUDENT --output ml/data/unlabeled_samples_s.json
python ml/extract_samples.py --user-type EMPLOYEE --output ml/data/unlabeled_samples_e.json
```

The extractor:

- Requires **≥10** attendance_state entries (PRESENT/ABSENT) per user.
- Filters users by the specified `--user-type` (STUDENT or EMPLOYEE).
- Builds a **10-value binary sequence** (most recent → oldest).
- Writes metadata + samples without targets so you can apply the 70% / 90% rule manually.

#### Option B: Manual Dataset Creation

1. Follow [`ml/data/README.md`](./data/README.md) for the 10-feature schema.
2. Create separate datasets for students and employees.
3. Label `dropout_risk` as:
   - `AT_RISK` if student attendance <70% or employee attendance <90%.
   - `NOT_AT_RISK` otherwise.

#### Train the Classifiers

Train separate models for each user type:

```bash
python ml/train_classifier.py --user-type STUDENT --data ml/data/training_data_s.json
python ml/train_classifier.py --user-type EMPLOYEE --data ml/data/training_data_e.json
```

Trained models are stored in `ml/models/trained/`:

- `dropout_risk_student.joblib`
- `dropout_risk_employee.joblib`
- `training_metadata.json` (updated per training run)

---

## 📡 Usage

### Via API Endpoint

```bash
GET /api/performance-analytics/{user_id}
Headers:
  x-service-password: <SERVICE_PASSWORD>
```

**Returns:**

- `average_punctuality` (in minutes)
- `average_time_balance` (in minutes)
- `dropout_risk` (AT_RISK/NOT_AT_RISK)
- `attendance_rate` (percentage)

### Programmatic Usage

```python
from ml.analytics import get_analytics

analytics = get_analytics()
metrics = await analytics.compute_performance_metrics(user_id)
```

---

## 🧠 Feature Extraction

### Temporal Binary Sequence (10 features)

| Feature            | Description                    | Example |
| ------------------ | ------------------------------ | ------- |
| `attendance_state` | 1 = Present, 0 = Absent        | 1       |

**Vector layout (most recent → oldest):**

```
[state_1, state_2, ..., state_10]
```

Where each `state_i` is:
- `1.0` = PRESENT
- `0.0` = ABSENT

> ⚠️ Cancelled sessions are excluded. If fewer than 10 records exist, oldest positions are padded with `0.0`.  
> ⚠️ **User type is NOT included in the feature vector** - models are trained separately for students and employees.

---

## 🧮 Model Details

### Dropout Risk Classifier

- **Algorithm:** Random Forest (200 estimators, shallow depth for interpretability)
- **Input:** 10 numerical features (binary attendance sequence only)
- **Output:** `AT_RISK` or `NOT_AT_RISK` + confidence score
- **Model files:** Separate models for students (`dropout_risk_student.joblib`) and employees (`dropout_risk_employee.joblib`)
- **Target meaning:** Aligns with literature-backed attendance thresholds (70% for students, 90% for employees)

---

## 🔁 Retraining Schedule

Retrain periodically (monthly recommended):

```bash
0 0 1 * * cd /path/to/eduscan-faceid && \
python ml/train_classifier.py --user-type STUDENT --data ml/data/training_data_s.json && \
python ml/train_classifier.py --user-type EMPLOYEE --data ml/data/training_data_e.json
```

---

## ⚡ Performance Optimization

- **Caching:** Cache analytics per user (5-minute TTL suggested)
- **Database:** Ensure indexes on:

  - `session.user_id`
  - `session.arrival`

- **Query limits:** Only fetch the **15 most recent sessions** per user

---

## 🧭 Fallback Behavior

If models are missing or not yet trained:

| Metric       | Fallback Method                                                                 |
| ------------ | ------------------------------------------------------------------------------- |
| Dropout Risk | Rule-based thresholding on the 10-step binary sequence using hardcoded thresholds (70% for students, 90% for employees) |

**Rule-based logic:** Attendance rate across the 10-day window is compared to the appropriate threshold based on the loaded model's user type, ensuring parity with the trained model even without serialized weights.

This ensures Eduscan remains functional even without trained ML models.

---

## 📊 Metrics Returned

| Metric                     | Description                              | Source                               |
| -------------------------- | ---------------------------------------- | ------------------------------------ |
| **Average Arrival Offset** | Average lateness or earliness in minutes | Computed from `session.punctuality`  |
| **Average Time Balance**   | Average undertime or overtime in minutes | Computed from `session.time_balance` |
| **Dropout Risk**           | ML-predicted disengagement likelihood    | ML model                             |
| **Attendance Rate**        | Lifetime PRESENT vs ABSENT percentage    | `attendance_state` aggregation       |

---

## 🧰 Troubleshooting

### **Error:** `No training data available`

- Ensure each user has at least **10 attendance_state entries** (PRESENT/ABSENT)
- Verify Supabase connection

### **Error:** `Model not found`

- Retrain with appropriate user type:
  ```bash
  python ml/train_classifier.py --user-type STUDENT --data ml/data/training_data_s.json
  python ml/train_classifier.py --user-type EMPLOYEE --data ml/data/training_data_e.json
  ```
- The system will automatically fall back to rule-based logic

### **Low prediction accuracy**

- Add more labeled samples (diverse behaviors)
- Keep class balance near 25% per label
- Check data quality in `session` and `attendance_state`

---

## 📁 Data Management Workflow

### 1. Create Training Dataset

- Use [`ml/data/README.md`](./data/README.md) for the 10-feature schema (binary sequence only).
- Extract the **10 most recent** `attendance_state` rows (PRESENT/ABSENT) per user, separated by user type.
- Calculate lifetime attendance percentage and apply the 70% (students) / 90% (employees) rule to label `dropout_risk`.
- Save as separate files: `ml/data/training_data_s.json` (students) and `ml/data/training_data_e.json` (employees).

### 2. Train Models

```bash
python ml/train_classifier.py --user-type STUDENT --data ml/data/training_data_s.json
python ml/train_classifier.py --user-type EMPLOYEE --data ml/data/training_data_e.json
```

### 3. Deploy and Test

```bash
uvicorn main:app --reload
curl -X GET "http://localhost:8000/api/performance-analytics/{user_id}" \
  -H "x-service-password: YOUR_PASSWORD"
```

---

## ✅ Validation & Testing Checklist

1. **Dataset sanity check**
   - Run `python ml/extract_samples.py --user-type STUDENT` and verify each sample has 10 features.
   - Confirm manual labels follow the 70% / 90% rule before training.
2. **Training pipeline**
   - Execute `python ml/train_classifier.py --user-type STUDENT --data ml/data/training_data_s.json`.
   - Inspect `ml/models/trained/dropout_risk_student_cm.png` and `_fi.png` for class balance and feature weights.
   - Repeat for employees with `--user-type EMPLOYEE`.
3. **API verification**
   - Start the FastAPI server (`uvicorn main:app --reload`).
   - Call `GET /api/performance-analytics/{user_id}` and ensure `dropoutRisk.level` matches expectations for known cases.
   - Verify the correct model (student/employee) is loaded based on user type.
4. **End-to-end UI**
   - Trigger the Supabase edge function via the Next.js frontend (`UserPerformance` dropdown).
   - Confirm refresh button updates risk/confidence and that predicted trend card is removed.
5. **Fallback mode**
   - Temporarily remove `ml/models/trained/dropout_risk_student.joblib` and restart the backend.
   - Ensure rule-based outputs still return `AT_RISK/NOT_AT_RISK` with explanatory factors using the correct threshold.

---

## 🔮 Future Enhancements

- **LSTM**-based deep learning for temporal sequence prediction
- Integration with **weather/events** as contextual features
- Personalized thresholds per department or user type
- **Intervention recommendations** (e.g., notify advisers)
- A/B testing for prediction model comparison

---

✅ **This README matches the current Eduscan implementation**:

- Uses the simplified 10-step binary sequence + user_type flag.
- Documents the 70% (students) / 90% (employees) attendance thresholds.
- `analytics.py` now queries both `session` (stats) and `attendance_state` (sequences) tables.
- `attendance_feature.py` exposes `extract_binary_sequence` for both training and inference.
- Rule-based fallbacks rely on the same 10-day window, so behavior stays consistent without a trained model.
