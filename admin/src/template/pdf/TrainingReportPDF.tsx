import { generateHeader } from "./Header";

interface TrainingSummary {
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

interface TemplateProps {
  summary: TrainingSummary;
  universityLogoDataUrl?: string;
  eduscanLogoDataUrl?: string;
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const formatMetric = (value: number | null | undefined, decimals: number = 4): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  // Ensure value is a number and not NaN
  const numValue = typeof value === "number" ? value : Number(value);
  if (isNaN(numValue) || !isFinite(numValue)) {
    return "N/A";
  }
  return numValue.toFixed(decimals);
};

const getUserTypeLabel = (userType: string): string => {
  if (userType === "STUDENT") return "Student";
  if (userType === "EMPLOYEE") return "Employee";
  return userType;
};

export const TrainingReportPDF = ({
  summary,
  universityLogoDataUrl,
  eduscanLogoDataUrl,
}: TemplateProps): string => {
  const { metadata, images } = summary;

  const imageElements = Object.entries(images)
    .filter(([, base64]) => base64) // Only include images that exist
    .map(([key, base64]) => {
      const titles: Record<string, string> = {
        scatter: "Prediction vs Actual Scatter Plot",
        residuals: "Residuals Distribution",
        feature_importance: "Feature Importance",
        learning_curves: "Learning Curves",
        distribution: "Prediction Distribution",
        confusion_matrix: "Confusion Matrix",
        roc_curve: "ROC Curve",
      };

      return `
        <div class="mb-6">
          <h3 class="text-[14px] font-semibold text-black mb-2">${titles[key] || key}</h3>
          <img src="data:image/png;base64,${base64}" alt="${titles[key]}" 
               style="max-width: 100%; height: auto; border: 1px solid #ccc;" />
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif;">
      ${
        universityLogoDataUrl && eduscanLogoDataUrl
          ? generateHeader(universityLogoDataUrl, eduscanLogoDataUrl)
          : ""
      }

      <div class="mb-6">
        <h1 class="text-[16px] font-bold text-center my-6">ATTENDANCE FORECASTING MODEL TRAINING REPORT</h1>
        <div class="text-start text-[11px] text-black w-full flex flex-col items-start gap-1">
          <p><strong>User Type:</strong> ${getUserTypeLabel(metadata.user_type)}</p>
          <p><strong>Training Date:</strong> ${formatDate(metadata.training_date)}</p>
          <p><strong>Algorithm:</strong> ${metadata.algorithm}</p>
          <p><strong>Model File:</strong> ${metadata.model_filename}</p>
          <p><strong>Training Samples:</strong> ${metadata.samples_count != null ? metadata.samples_count.toLocaleString() : "N/A"}</p>
          <p><strong>Features per Sample:</strong> ${metadata.features_per_sample != null ? metadata.features_per_sample : "N/A"}</p>
          <p><strong>Train/Test Split:</strong> ${metadata.split}</p>
          <p><strong>Cross-Validation:</strong> ${metadata.cross_validation}</p>
        </div>
      </div>

      <div class="mb-6">
        <h2 class="text-[14px] font-bold text-black mb-3">Test Set Metrics</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="border border-black rounded-md p-3">
            <p class="text-[11px] font-semibold text-black mb-1">Mean Absolute Error (MAE)</p>
            <p class="text-[16px] font-bold text-black">${formatMetric(metadata.test_metrics?.mae)}</p>
          </div>
          <div class="border border-black rounded-md p-3">
            <p class="text-[11px] font-semibold text-black mb-1">Root Mean Squared Error (RMSE)</p>
            <p class="text-[16px] font-bold text-black">${formatMetric(metadata.test_metrics?.rmse)}</p>
          </div>
          <div class="border border-black rounded-md p-3">
            <p class="text-[11px] font-semibold text-black mb-1">R² Score</p>
            <p class="text-[16px] font-bold text-black">${formatMetric(metadata.test_metrics?.r2)}</p>
          </div>
          <div class="border border-black rounded-md p-3">
            <p class="text-[11px] font-semibold text-black mb-1">ROC-AUC Score</p>
            <p class="text-[16px] font-bold text-black">${formatMetric(metadata.test_metrics?.roc_auc)}</p>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h2 class="text-[14px] font-bold text-black mb-3">Cross-Validation Metrics</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="border border-black rounded-md p-3">
            <p class="text-[11px] font-semibold text-black mb-1">MAE (Mean ± Std)</p>
            <p class="text-[16px] font-bold text-black">${metadata.cv_metrics?.mae?.mean != null && metadata.cv_metrics?.mae?.std != null ? `${formatMetric(metadata.cv_metrics.mae.mean)} ± ${formatMetric(metadata.cv_metrics.mae.std)}` : "N/A"}</p>
          </div>
          <div class="border border-black rounded-md p-3">
            <p class="text-[11px] font-semibold text-black mb-1">R² (Mean ± Std)</p>
            <p class="text-[16px] font-bold text-black">${metadata.cv_metrics?.r2?.mean != null && metadata.cv_metrics?.r2?.std != null ? `${formatMetric(metadata.cv_metrics.r2.mean)} ± ${formatMetric(metadata.cv_metrics.r2.std)}` : "N/A"}</p>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h2 class="text-[14px] font-bold text-black mb-3">Evaluation Plots</h2>
        ${imageElements}
      </div>

      ${metadata.note ? `
      <div class="mt-6 text-[10px] text-gray-600">
        <p><strong>Note:</strong> ${metadata.note}</p>
      </div>
      ` : ""}
    </div>
  `;
};

