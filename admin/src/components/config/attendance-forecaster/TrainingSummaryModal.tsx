"use client";

import React from "react";
import Button from "../../Button";
import BaseModal from "../../container/BaseModal";
import { cn } from "@/utils/style";
import { FileText } from "lucide-react";
import { TrainingSummary, UserType } from "./types";

interface TrainingSummaryModalProps {
  summary: TrainingSummary | null;
  isOpen: boolean;
  onClose: () => void;
  userType: UserType;
  onDownloadPDF: () => void;
  isDownloadingPDF: boolean;
}

const TrainingSummaryModal = ({
  summary,
  isOpen,
  onClose,
  userType,
  onDownloadPDF,
  isDownloadingPDF,
}: TrainingSummaryModalProps) => {
  if (!summary) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Training Summary"
        panelClassName="max-w-4xl"
      >
        <div className="p-6 text-center text-textBody">
          No training summary available. Please train the model first.
        </div>
      </BaseModal>
    );
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

  const formatMetric = (value: number, decimals: number = 4): string => {
    return value.toFixed(decimals);
  };

  const { metadata, images } = summary;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Training Summary - ${metadata.user_type}`}
      panelClassName="max-w-8xl"
      footer={
        <div className="flex justify-end gap-3 p-4 border-t border-textBody/60">
          <Button
            title="Download PDF"
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className="flex items-center gap-2"
          >
            <FileText
              className={cn("w-4 h-4", isDownloadingPDF && "animate-bounce")}
            />
          </Button>
        </div>
      }
    >
      <div className="p-6 flex flex-col gap-6">
        {/* Metadata */}
        <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
          <h3 className="text-primary font-semibold text-lg mb-3">
            Training Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-textBody font-medium">Training Date:</p>
              <p className="text-primary">
                {formatDate(metadata.training_date)}
              </p>
            </div>
            <div>
              <p className="text-textBody font-medium">Algorithm:</p>
              <p className="text-primary">{metadata.algorithm}</p>
            </div>
            <div>
              <p className="text-textBody font-medium">Samples:</p>
              <p className="text-primary">
                {metadata.samples_count.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-textBody font-medium">Features:</p>
              <p className="text-primary">{metadata.features_per_sample}</p>
            </div>
          </div>

          {/* Test Metrics */}
          <div className="mt-4">
            <h4 className="text-primary font-semibold mb-2">Test Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-textBody">MAE:</p>
                <p className="text-primary font-semibold">
                  {formatMetric(metadata.test_metrics.mae)}
                </p>
              </div>
              <div>
                <p className="text-textBody">RMSE:</p>
                <p className="text-primary font-semibold">
                  {formatMetric(metadata.test_metrics.rmse)}
                </p>
              </div>
              <div>
                <p className="text-textBody">R²:</p>
                <p className="text-primary font-semibold">
                  {formatMetric(metadata.test_metrics.r2)}
                </p>
              </div>
              <div>
                <p className="text-textBody">ROC-AUC:</p>
                <p className="text-primary font-semibold">
                  {formatMetric(metadata.test_metrics.roc_auc)}
                </p>
              </div>
            </div>
          </div>

          {/* CV Metrics */}
          <div className="mt-4">
            <h4 className="text-primary font-semibold mb-2">
              Cross-Validation Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-textBody">MAE (Mean ± Std):</p>
                <p className="text-primary font-semibold">
                  {formatMetric(metadata.cv_metrics.mae.mean)} ±{" "}
                  {formatMetric(metadata.cv_metrics.mae.std)}
                </p>
              </div>
              <div>
                <p className="text-textBody">R² (Mean ± Std):</p>
                <p className="text-primary font-semibold">
                  {formatMetric(metadata.cv_metrics.r2.mean)} ±{" "}
                  {formatMetric(metadata.cv_metrics.r2.std)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Plots */}
        <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
          <h3 className="text-primary font-semibold text-lg mb-4">
            Evaluation Plots
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(images)
              .filter(([_, base64]) => base64)
              .map(([key, base64]) => {
                const titles: Record<string, string> = {
                  scatter: "Prediction vs Actual",
                  residuals: "Residuals Distribution",
                  feature_importance: "Feature Importance",
                  learning_curves: "Learning Curves",
                  distribution: "Prediction Distribution",
                  confusion_matrix: "Confusion Matrix",
                  roc_curve: "ROC Curve",
                };

                const isWidePlot = key === "distribution";

                return (
                  <div
                    key={key}
                    className={`flex flex-col gap-2 ${
                      isWidePlot ? "md:col-span-2" : ""
                    }`}
                  >
                    <p className="text-textBody font-medium text-sm">
                      {titles[key] || key}
                    </p>
                    <img
                      src={`data:image/png;base64,${base64}`}
                      alt={titles[key] || key}
                      className="w-full h-auto border border-primary/20 rounded"
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default TrainingSummaryModal;

