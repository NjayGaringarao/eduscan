export type UserType = "STUDENT" | "EMPLOYEE";

export interface TrainingSummary {
  success: boolean;
  metadata: {
    training_date: string;
    user_type: string;
    model_filename: string;
    algorithm: string;
    model_type?: string; // Added for multi-model support
    samples_count: number | null;
    split: string;
    cross_validation: string;
    test_metrics?: {
      mae?: number | null;
      rmse?: number | null;
      r2?: number | null;
      roc_auc?: number | null;
    };
    cv_metrics?: {
      mae?: { mean?: number | null; std?: number | null };
      r2?: { mean?: number | null; std?: number | null };
    };
    features_per_sample: number | null;
    note?: string;
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

