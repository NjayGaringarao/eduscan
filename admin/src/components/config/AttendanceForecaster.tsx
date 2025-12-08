"use client";

import React, { useState } from "react";
import Button from "../Button";
import Box from "../container/Box";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import {
  downloadDataset,
  trainModel,
  getTrainingSummary,
  downloadTrainingReport,
} from "@/lib/config";
import { Download, Play, FileText, FileUp, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { downloadPdfBlob, convertBufferToArrayBuffer } from "@/utils/blob";
import BaseModal from "../container/BaseModal";

type UserType = "STUDENT" | "EMPLOYEE";

interface TrainingSummary {
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

const TrainingSummaryModal = ({
  summary,
  isOpen,
  onClose,
  userType,
  onDownloadPDF,
  isDownloadingPDF,
}: {
  summary: TrainingSummary | null;
  isOpen: boolean;
  onClose: () => void;
  userType: UserType;
  onDownloadPDF: () => void;
  isDownloadingPDF: boolean;
}) => {
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

const ForecasterBox = ({ userType }: { userType: UserType }) => {
  const [isDownloadingDataset, setIsDownloadingDataset] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [trainingSummary, setTrainingSummary] =
    useState<TrainingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showTrainingSummaryModal, setShowTrainingSummaryModal] =
    useState(false);
  const [showPostTrainingModal, setShowPostTrainingModal] = useState(false);
  const [showStartTrainingModal, setShowStartTrainingModal] = useState(false);

  const userTypeLabel = userType === "STUDENT" ? "Student" : "Employee";
  const userTypeSuffix = userType === "STUDENT" ? "s" : "e";

  const handleDownloadDataset = async (
    balanceDistribution: boolean = false
  ) => {
    setIsDownloadingDataset(true);
    setError(null);
    try {
      const { buffer, error: downloadError } = await downloadDataset({
        user_type: userType,
        balance_distribution: balanceDistribution,
      });

      if (downloadError || !buffer) {
        setError(downloadError ?? "Failed to download dataset");
        return;
      }

      // Create blob and download
      const arrayBuffer = convertBufferToArrayBuffer(buffer);
      const blob = new Blob([arrayBuffer], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `training_data_${userTypeSuffix}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download dataset failed:", err);
      setError(err.message ?? "Failed to download dataset");
    } finally {
      setIsDownloadingDataset(false);
    }
  };

  const handleTrain = async () => {
    if (!selectedFile) {
      setError("Please upload a dataset file first");
      return;
    }

    setIsTraining(true);
    setError(null);
    // Close the start training modal
    setShowStartTrainingModal(false);

    try {
      const { success, error: trainError } = await trainModel({
        user_type: userType,
        dataset_file: selectedFile,
      });

      if (trainError || !success) {
        setError(trainError ?? "Failed to train model");
        return;
      }

      // After successful training, fetch the summary and show modal
      await handleLoadSummary();
      if (trainingSummary) {
        setShowPostTrainingModal(true);
      }

      // Clear selected file after successful training
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Train model failed:", err);
      setError(err.message ?? "Failed to train model");
    } finally {
      setIsTraining(false);
    }
  };

  const handleLoadSummary = async () => {
    setIsLoadingSummary(true);
    setError(null);
    try {
      const { summary, error: summaryError } = await getTrainingSummary({
        user_type: userType,
      });

      if (summaryError || !summary) {
        setError(summaryError ?? "Training summary not found");
        setTrainingSummary(null);
        return;
      }

      setTrainingSummary(summary);
    } catch (err: any) {
      console.error("Get training summary failed:", err);
      setError(err.message ?? "Failed to get training summary");
      setTrainingSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleShowTrainingSummary = async () => {
    if (!trainingSummary) {
      await handleLoadSummary();
    }
    setShowTrainingSummaryModal(true);
  };

  const handleDownloadReport = async () => {
    setIsDownloadingReport(true);
    setError(null);
    try {
      const { buffer, error: reportError } = await downloadTrainingReport({
        user_type: userType,
      });

      if (reportError || !buffer) {
        setError(reportError ?? "Failed to generate PDF");
        return;
      }

      const filename = `Training-Report-${userType}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      downloadPdfBlob(buffer, filename, (err) => {
        setError(`Download failed: ${err}`);
      });
    } catch (err: any) {
      console.error("Download training report failed:", err);
      setError(err.message ?? "Failed to download report");
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".json")) {
        setError("Please select a JSON file");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 border border-primary/20 rounded-lg p-4">
        <p className="text-primary text-xl">{userTypeLabel} Model</p>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={isDownloadingDataset || isTraining}
                    className={cn(
                      "p-1 md:px-4 rounded-lg shadow-lg",
                      "transition-all transform duration-200",
                      "text-base font-semibold",
                      "flex flex-row gap-2 items-center justify-center w-full",
                      "border border-primary",
                      "bg-primary text-background",
                      isDownloadingDataset || isTraining
                        ? "opacity-50 cursor-not-allowed"
                        : "opacity-100 hover:shadow-[0_0_4px_1px_var(--tw-shadow-color)] hover:shadow-primary/70 hover:scale-102"
                    )}
                  >
                    <Download
                      className={cn(
                        "w-4 h-4",
                        isDownloadingDataset && "animate-bounce"
                      )}
                    />
                    Generate Dataset
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-primary mb-1">
                      Select Distribution:
                    </p>
                    <button
                      onClick={() => handleDownloadDataset(true)}
                      disabled={isDownloadingDataset || isTraining}
                      className={cn(
                        "px-3 py-2 text-sm text-left rounded-lg border transition-colors",
                        "hover:bg-primary/10 border-primary/30",
                        (isDownloadingDataset || isTraining) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="font-medium text-primary">
                        50/50 Balanced
                      </div>
                      <div className="text-xs text-textBody/70 mt-0.5">
                        Equal PRESENT/ABSENT samples
                      </div>
                    </button>
                    <button
                      onClick={() => handleDownloadDataset(false)}
                      disabled={isDownloadingDataset || isTraining}
                      className={cn(
                        "px-3 py-2 text-sm text-left rounded-lg border transition-colors",
                        "hover:bg-primary/10 border-primary/30",
                        (isDownloadingDataset || isTraining) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="font-medium text-primary">
                        Raw (All Data)
                      </div>
                      <div className="text-xs text-textBody/70 mt-0.5">
                        All extracted samples
                      </div>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                title="Start Training"
                onClick={() => setShowStartTrainingModal(true)}
                disabled={isTraining || isDownloadingDataset}
                className="flex items-center gap-2 w-full"
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="px-4 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Loading States */}
            {isTraining && (
              <div className="flex items-center justify-center py-4">
                <Loading prompt="Training model..." size="medium" />
              </div>
            )}
          </div>

          {/* Right Column - Training Summary */}
          <div className="flex flex-col gap-4">
            <Button
              title="Training Summary"
              onClick={handleShowTrainingSummary}
              disabled={isLoadingSummary}
              secondary
              className="flex items-center gap-2 w-full"
            >
              <FileText className="w-4 h-4" />
            </Button>

            {isLoadingSummary && (
              <div className="flex items-center justify-center py-4">
                <Loading prompt="Loading..." size="medium" />
              </div>
            )}

            {trainingSummary && !isLoadingSummary && (
              <div className="text-sm text-textBody">
                <p className="font-semibold mb-1">Last Training:</p>
                <p className="text-xs">
                  {new Date(
                    trainingSummary.metadata.training_date
                  ).toLocaleDateString()}
                </p>
                <p className="text-xs mt-1">
                  {trainingSummary.metadata.samples_count.toLocaleString()}{" "}
                  samples
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Training Modal */}
      <BaseModal
        isOpen={showStartTrainingModal}
        onClose={() => {
          setShowStartTrainingModal(false);
          setSelectedFile(null);
          setError(null);
        }}
        title={`Start Training - ${userTypeLabel}`}
        panelClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-3 p-4 border-t border-textBody/60">
            <Button
              title="Cancel"
              onClick={() => {
                setShowStartTrainingModal(false);
                setSelectedFile(null);
                setError(null);
              }}
              secondary
              disabled={isTraining}
            />
            <Button
              title="Train Model"
              onClick={handleTrain}
              disabled={isTraining || !selectedFile}
              className="flex items-center gap-2"
            >
              <Play className={cn("w-4 h-4", isTraining && "animate-spin")} />
            </Button>
          </div>
        }
      >
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-textBody font-medium text-sm">
              Upload Dataset File:
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`modal-dataset-upload-${userType}`}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isTraining}
                className="hidden"
              />
              <label
                htmlFor={`modal-dataset-upload-${userType}`}
                className="flex-1 px-4 py-2 text-sm border border-primary rounded-lg cursor-pointer hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
              >
                <FileUp className="w-4 h-4" />
                {selectedFile ? selectedFile.name : "Choose Dataset File"}
              </label>
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 text-sm hover:text-red-700 px-2"
                  disabled={isTraining}
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-textBody/70 text-xs">
              {selectedFile
                ? "Dataset file selected. Click 'Train Model' to begin training."
                : "Please select a JSON dataset file to begin training."}
            </p>
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {isTraining && (
            <div className="flex items-center justify-center py-4">
              <Loading prompt="Training model..." size="medium" />
            </div>
          )}
        </div>
      </BaseModal>

      {/* Training Summary Modal */}
      <TrainingSummaryModal
        summary={trainingSummary}
        isOpen={showTrainingSummaryModal || showPostTrainingModal}
        onClose={() => {
          setShowTrainingSummaryModal(false);
          setShowPostTrainingModal(false);
        }}
        userType={userType}
        onDownloadPDF={handleDownloadReport}
        isDownloadingPDF={isDownloadingReport}
      />
    </>
  );
};

const AttendanceForecaster = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <Box containerClassName={cn("flex flex-col gap-4 p-6 h-full")}>
        <div className="flex items-center gap-2">
          <p className="text-primary font-semibold text-xl">
            Attendance Forecaster
          </p>
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1 rounded-md hover:bg-primary/10 transition-colors"
            title="Training Instructions"
          >
            <HelpCircle className="w-5 h-5 text-primary" />
          </button>
        </div>
        <p className="text-textBody text-base">
          Manage Machine Learning models for predicting attendance of students
          and employees based on their historical 10-day attendance data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ForecasterBox userType="STUDENT" />
          <ForecasterBox userType="EMPLOYEE" />
        </div>
      </Box>

      {/* Help Modal */}
      <BaseModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Training Instructions"
        panelClassName="max-w-4xl"
      >
        <div className="p-6 flex flex-col gap-4 text-sm text-textBody">
          <div>
            <h3 className="text-primary font-semibold text-base mb-2">
              Overview
            </h3>
            <p>
              This system uses attendance forecasting models that predict
              next-day attendance using 10-day binary attendance sequences. Each
              sample captures a 10-day window and predicts attendance
              probability (0 or 1) for the next day.
            </p>
          </div>

          <div>
            <h3 className="text-primary font-semibold text-base mb-2">
              Dataset Structure
            </h3>
            <p className="mb-2">Each dataset file contains:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Features:</strong> 10 binary values (1 = PRESENT, 0 =
                ABSENT) representing the most recent 10 days
              </li>
              <li>
                <strong>Target:</strong> Next day attendance (1.0 = PRESENT, 0.0
                = ABSENT)
              </li>
              <li>
                <strong>Sample ID:</strong> Unique identifier in format{" "}
                <code className="bg-background/50 px-1 rounded">
                  {"{user_id}_w{window_index}"}
                </code>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-primary font-semibold text-base mb-2">
              Training Workflow
            </h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>Generate Dataset:</strong> Click "Generate Dataset" to
                create a training dataset from your attendance records. This
                extracts sliding window samples automatically.
              </li>
              <li>
                <strong>Review & Modify (Optional):</strong> Download the
                generated JSON file, review it, and make any necessary
                modifications to the dataset.
              </li>
              <li>
                <strong>Start Training:</strong> Click "Start Training", upload
                your dataset file (generated or modified), then click "Train
                Model" to begin training.
              </li>
              <li>
                <strong>View Results:</strong> After training completes, review
                the training summary with metrics and evaluation plots. Export
                to PDF if needed.
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-primary font-semibold text-base mb-2">
              Requirements
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Minimum 11 attendance records per user to generate at least 1
                sample
              </li>
              <li>Separate datasets for STUDENT and EMPLOYEE user types</li>
              <li>
                JSON file format with proper structure (see dataset schema)
              </li>
              <li className="font-semibold text-primary">
                <strong>Recommended: ≥1,000 samples per user type</strong> for
                optimal model performance
              </li>
              <li className="font-semibold text-primary">
                <strong>Target distribution: 50/50</strong> (balanced
                PRESENT/ABSENT classes) preferred
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-primary font-semibold text-base mb-2">
              Dataset Format
            </h3>
            <pre className="bg-background/50 p-3 rounded text-xs overflow-x-auto">
              {`{
  "metadata": {
    "user_type": "STUDENT",
    "num_samples": 500,
    "features_per_sample": 10
  },
  "samples": [
    {
      "sample_id": "user_id_w0",
      "features": [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
      "targets": {
        "attendance_probability": 1.0
      }
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default AttendanceForecaster;
