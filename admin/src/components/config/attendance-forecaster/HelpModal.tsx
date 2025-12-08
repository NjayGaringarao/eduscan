"use client";

import React from "react";
import BaseModal from "../../container/BaseModal";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Training Instructions"
      panelClassName="max-w-4xl"
    >
      <div className="p-6 flex flex-col gap-4 text-sm text-textBody">
        <div>
          <h3 className="text-primary font-semibold text-base mb-2">
            Overview
          </h3>
          <p>
            This system uses attendance forecasting models that predict next-day
            attendance using 10-day binary attendance sequences. Each sample
            captures a 10-day window and predicts attendance probability (0 or
            1) for the next day.
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
              <strong>Target:</strong> Next day attendance (1.0 = PRESENT, 0.0 =
              ABSENT)
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
              <strong>Generate Dataset:</strong> Click &quot;Generate
              Dataset&quot; to create a training dataset from your attendance
              records. This extracts sliding window samples automatically.
            </li>
            <li>
              <strong>Review & Modify (Optional):</strong> Download the
              generated JSON file, review it, and make any necessary
              modifications to the dataset.
            </li>
            <li>
              <strong>Start Training:</strong> Click &quot;Start Training&quot;,
              upload your dataset file (generated or modified), then click
              &quot;Train Model&quot; to begin training.
            </li>
            <li>
              <strong>View Results:</strong> After training completes, review
              the training summary with metrics and evaluation plots. Export to
              PDF if needed.
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
            <li>JSON file format with proper structure (see dataset schema)</li>
            <li className="font-semibold text-primary">
              <strong>Recommended: ≥1,000 samples per user type</strong> for
              optimal model performance
            </li>
            <li>
              <strong>Target distribution:</strong> Use the distribution slider
              (0-100%) to control the PRESENT/ABSENT ratio. Choose &quot;Raw
              (All Data)&quot; to use all samples, or &quot;Custom
              Distribution&quot; to specify the percentage of PRESENT samples.
              50% is commonly used for balanced datasets. All generated datasets
              are automatically shuffled.
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
  );
};

export default HelpModal;
