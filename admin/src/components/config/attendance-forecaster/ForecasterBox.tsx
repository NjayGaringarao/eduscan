"use client";

import React, { useState, useEffect } from "react";
import Button from "../../Button";
import Loading from "../../Loading";
import BaseModal from "../../container/BaseModal";
import { cn } from "@/utils/style";
import {
  downloadDataset,
  trainModel,
  getTrainingSummary,
  downloadTrainingReport,
} from "@/lib/config";
import { Download, Play, FileUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { downloadPdfBlob, convertBufferToArrayBuffer } from "@/utils/blob";
import TrainingSummaryModal from "./TrainingSummaryModal";
import { TrainingSummary, UserType } from "./types";

interface ForecasterBoxProps {
  userType: UserType;
}

const ForecasterBox = ({ userType }: ForecasterBoxProps) => {
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

  // Load last training summary on mount
  useEffect(() => {
    handleLoadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <p className="text-primary text-lg">{userTypeLabel} Model</p>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-row gap-6">
          {/* Left Column - Actions */}
          <div className="flex flex-col gap-4 flex-1">
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
                      "bg-background text-primary",
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
              <div className="flex items-center justify-center py-4 w-full">
                <Loading prompt="Training model..." size="medium" />
              </div>
            )}
          </div>

          {/* Right Column - Training Summary */}
          <div className="flex flex-col gap-4">
            {isLoadingSummary && (
              <div className="flex items-center justify-center py-4">
                <Loading prompt="Loading..." size="medium" />
              </div>
            )}

            {trainingSummary && !isLoadingSummary && (
              <div className="text-textBody flex flex-col">
                <p className="font-semibold">Last Training:</p>
                <p className="text-sm">
                  {new Date(
                    trainingSummary.metadata.training_date
                  ).toLocaleDateString()}
                </p>
                <p className="text-sm -mt-1">
                  {trainingSummary.metadata.samples_count.toLocaleString()}{" "}
                  samples
                </p>
                <button
                  onClick={handleShowTrainingSummary}
                  disabled={isLoadingSummary}
                  className="text-sm flex items-center gap-2 w-full underline -mt-1"
                >
                  More Details
                </button>
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

export default ForecasterBox;

