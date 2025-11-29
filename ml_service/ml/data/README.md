# ML Training Dataset Guide

## Overview

This directory now hosts the simplified dataset used for Eduscan's literature-aligned **temporal attendance classifier**.  
Each row captures a **10-day binary attendance window** and a single target label (`dropout_risk`).  
**Note:** Datasets are separated by user type (one file for students, one for employees).

---

## Dataset Structure

### File: `training_data.json`

```json
{
  "metadata": {
    "created_date": "2025-11-17T10:00:00Z",
    "description": "10-step attendance sequences for dropout-risk classification",
    "num_samples": 100,
    "features_per_sample": 10,
    "feature_description": "10 attendance marks (binary sequence only)",
    "session_ordering": "Most recent to oldest",
    "user_type": "STUDENT",
    "version": "5.0"
  },
  "samples": [
    {
      "user_id": "21-12345",
      "features": [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
      "targets": {
        "dropout_risk": "NOT_AT_RISK"
      }
    }
  ]
}
```

- **Indices 0–9** → 10 most recent attendance marks (1 = PRESENT, 0 = ABSENT).

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

## Target Definition (`dropout_risk`)

| Label         | Attendance Rule                                                              |
| ------------- | ---------------------------------------------------------------------------- |
| `AT_RISK`     | Students with overall PRESENT rate **< 70%**. Employees with rate **< 90%**. |
| `NOT_AT_RISK` | Students ≥ 70% attendance **and** employees ≥ 90% attendance.                |

**Overall attendance rate** = `#PRESENT / (#PRESENT + #ABSENT)` using all lifetime records, excluding CANCELLED.

These thresholds mirror published studies that differentiate expectations for students vs. employees.

---

## Dataset Creation Process

1. **Identify eligible users**

   - Require **≥10 attendance_state** entries (PRESENT or ABSENT).
   - Exclude CANCELLED marks.

2. **Extract attendance marks**

   - Query `attendance_state` ordered by `marked_at DESC`.
   - Keep the most recent 10 records, then reverse to produce `[most_recent ... oldest]`.
   - Convert `PRESENT`→1, `ABSENT`→0 and pad as needed.
   - **Note:** Filter users by type before extraction (use `--user-type` flag in extractor).

3. **Assign target label**

   - Compute lifetime attendance rate for the same user.
   - Apply thresholds: `<70%` students ⇒ `AT_RISK`, `<90%` employees ⇒ `AT_RISK`, else `NOT_AT_RISK`.

4. **Save dataset**
   - Ensure every sample contains exactly 10 features and a `dropout_risk` label.
   - Save separate files for students and employees (e.g., `training_data_s.json`, `training_data_e.json`).
   - Validate JSON structure before feeding into `ml/train_classifier.py`.

---

## Minimum Dataset Requirements

| Metric             | Requirement                             |
| ------------------ | --------------------------------------- |
| Total samples      | ≥ 50 users per user type                |
| Sequence length    | Exactly 10 marks                        |
| Dataset separation | Separate files for STUDENT and EMPLOYEE |
| Class balance      | Aim for 40–60% in each class            |
| Feature integrity  | All numeric (floats/ints), no nulls     |

---

## Validation Checklist

- [ ] Each `features` array has **10** numeric entries.
- [ ] `dropout_risk` only uses `AT_RISK` or `NOT_AT_RISK`.
- [ ] Attendance thresholds follow the 70% / 90% rule.
- [ ] All samples in a dataset belong to the same user type.
- [ ] JSON schema matches the example above.

---

## Usage

### Option 1: Manual Dataset Authoring

1. Compile attendance history via SQL or Supabase dashboard.
2. Apply the rules above to craft separate files: `training_data_s.json` (students) and `training_data_e.json` (employees).
3. Train the classifiers:

   ```bash
   python ml/train_classifier.py --user-type STUDENT --data ml/data/training_data_s.json
   python ml/train_classifier.py --user-type EMPLOYEE --data ml/data/training_data_e.json
   ```

### Option 2: Use the Extractor

1. Generate unlabeled samples for each user type:

   ```bash
   python ml/extract_samples.py --user-type STUDENT --output ml/data/unlabeled_samples_s.json
   python ml/extract_samples.py --user-type EMPLOYEE --output ml/data/unlabeled_samples_e.json
   ```

   Options:

   - `--user-type`: Required. Filter by STUDENT or EMPLOYEE.
   - `--limit`: maximum number of users.
   - `--min-sessions`: default `10`.
   - `--user-ids`: comma-separated whitelist.

2. The extractor outputs the 10-step binary features (no user_type in features).  
   Add the `targets.dropout_risk` field manually using the 70% / 90% rule.

3. Rename (or pass path) to `training_data_s.json` / `training_data_e.json` and run the trainer with the appropriate `--user-type` flag.

---

This simplified dataset specification is fully aligned with the new temporal-model design and the supporting literature on attendance-sequence risk prediction.
