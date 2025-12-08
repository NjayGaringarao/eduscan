export type UserType = "STUDENT" | "EMPLOYEE";

export interface TrainingSummary {
  success: boolean;
  metadata: {
    training_date: string;
    user_type: string;
    model_filename: string;
    algorithm: string;
    samples_count: number;
    split: string;
    cross_validation: string;
    test_metrics: {
      mae: number;
      rmse: number;
      r2: number;
      roc_auc: number;
    };
    cv_metrics: {
      mae: { mean: number; std: number };
      r2: { mean: number; std: number };
    };
    features_per_sample: number;
    note: string;
  };
  images: {
    scatter: string;
    residuals: string;
    feature_importance: string;
    learning_curves: string;
    distribution: string;
    confusion_matrix: string;
    roc_curve: string;
  };
}

