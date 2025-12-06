# ML Training Dataset Guide

## Overview

This directory hosts the dataset used for Eduscan's **attendance forecasting** models.  
Each row captures a **10-day binary attendance window** and a target label (`attendance_probability` = 0 or 1 for next day).  
**Note:** Datasets are separated by user type (one file for students, one for employees).

---

## Dataset Structure

### File: `training_data.json`

```json
{
  "metadata": {
    "created_date": "2025-02-18T10:00:00Z",
    "description": "Sliding window samples for attendance forecasting - 10 days → next day",
    "num_samples": 500,
    "features_per_sample": 10,
    "feature_description": "10 attendance marks (binary sequence only)",
    "session_ordering": "Most recent to oldest",
    "user_type": "STUDENT",
    "sliding_window": true,
    "version": "3.0"
  },
  "samples": [
    {
      "user_id": "21-12345",
      "features": [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
      "targets": {
        "attendance_probability": 1.0
      }
    }
  ]
}
```

- **Indices 0–9** → 10 most recent attendance marks (1 = PRESENT, 0 = ABSENT).
- **Target** → Next day attendance (1.0 = PRESENT, 0.0 = ABSENT).

---

## Feature Specification

| Feature # | Name/Meaning            | Encoding                    |
| --------- | ----------------------- | --------------------------- |
| 0 – 9     | Attendance mark per day | `1.0` PRESENT, `0.0` ABSENT |

Rules:

- Order window **most recent → oldest** to mirror inference pipeline.
- If fewer than 10 records exist, pad the **oldest positions** with `0`.
- CANCELLED or missing days are treated as ABSENT (`0`).
- **User type is NOT included in the feature vector** - datasets are separated by user type.

---

## Target Definition (`attendance_probability`)

| Label | Description                                    |
| ----- | ---------------------------------------------- |
| `1.0` | Next day attendance = PRESENT                 |
| `0.0` | Next day attendance = ABSENT                  |

**Target extraction:** For each sliding window, the 11th day's attendance mark becomes the target.

---

## Dataset Creation Process

### Sliding Window Generation

1. **Identify eligible users**

   - Require **≥11 attendance_state** entries (PRESENT or ABSENT).
   - Exclude CANCELLED marks.

2. **Extract sliding window samples**

   - For user with N records, create (N-10) samples.
   - Each sample: features = [day_i, day_i+1, ..., day_i+9], target = day_i+10
   - Example: User with 15 records → 5 samples:
     - Sample 1: days 1-10 → day 11
     - Sample 2: days 2-11 → day 12
     - Sample 3: days 3-12 → day 13
     - Sample 4: days 4-13 → day 14
     - Sample 5: days 5-14 → day 15

3. **Convert to binary**

   - Convert `PRESENT`→1.0, `ABSENT`→0.0 for both features and target.
   - **Note:** Filter users by type before extraction (use `--user-type` flag in extractor).

4. **Save dataset**

   - Ensure every sample contains exactly 10 features and an `attendance_probability` target (0.0 or 1.0).
   - Save separate files for students and employees (e.g., `training_data_s.json`, `training_data_e.json`).
   - Shuffle samples across all users before training for better generalization.

---

## Minimum Dataset Requirements

| Metric             | Requirement                             |
| ------------------ | --------------------------------------- |
| Total samples      | ≥ 100 samples per user type (more is better) |
| Sequence length    | Exactly 10 marks                        |
| Dataset separation | Separate files for STUDENT and EMPLOYEE |
| Target distribution | Balanced (40–60% in each class) preferred but not required |
| Feature integrity  | All numeric (floats/ints), no nulls     |

---

## Validation Checklist

- [ ] Each `features` array has **10** numeric entries.
- [ ] `attendance_probability` only uses `0.0` or `1.0`.
- [ ] Sliding windows are correctly generated (no overlapping targets).
- [ ] All samples in a dataset belong to the same user type.
- [ ] JSON schema matches the example above.

---

## Usage

### Option 1: Use the Extractor (Recommended)

1. Generate sliding window samples for each user type:

   ```bash
   python ml/extract_samples.py --user-type STUDENT --output ml/data/training_data_s.json
   python ml/extract_samples.py --user-type EMPLOYEE --output ml/data/training_data_e.json
   ```

   Options:

   - `--user-type`: Required. Filter by STUDENT or EMPLOYEE.
   - `--limit`: maximum number of users.
   - `--min-sessions`: default `11` (minimum for 1 sliding window sample).
   - `--user-ids`: comma-separated whitelist.

2. The extractor automatically:
   - Generates sliding window samples
   - Labels each sample with `attendance_probability` (0 or 1)
   - Outputs ready-to-train JSON files

3. Train the models:

   ```bash
   python ml/train_forecast.py --user-type STUDENT --data ml/data/training_data_s.json
   python ml/train_forecast.py --user-type EMPLOYEE --data ml/data/training_data_e.json
   ```

### Option 2: Manual Dataset Authoring

1. Compile attendance history via SQL or Supabase dashboard.
2. Generate sliding windows manually following the process above.
3. Apply the rules to craft separate files: `training_data_s.json` (students) and `training_data_e.json` (employees).
4. Train the models as shown above.

---

## Why Sliding Windows?

Sliding windows maximize training data and help models learn:

- **Temporal patterns**: How recent history affects future attendance
- **Streaks**: Long absence/presence streaks
- **Trends**: Improving or declining patterns
- **Volatility**: Consistent vs. erratic attendance

A single sample per user would waste valuable training data and limit model generalization.

---

This dataset specification is fully aligned with the attendance forecasting design using XGBoost regression models.
