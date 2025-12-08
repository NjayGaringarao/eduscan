"use client";

import React, { useState } from "react";
import Box from "../container/Box";
import { cn } from "@/utils/style";
import { HelpCircle } from "lucide-react";
import ForecasterBox from "./attendance-forecaster/ForecasterBox";
import HelpModal from "./attendance-forecaster/HelpModal";

const AttendanceForecaster = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <Box containerClassName={cn("flex flex-col gap-4 p-6 h-full")}>
        <div className="flex items-center gap-2">
          <p className="text-primary text-xl">Attendance Forecaster</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ForecasterBox userType="STUDENT" />
          <ForecasterBox userType="EMPLOYEE" />
        </div>
      </Box>

      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
};

export default AttendanceForecaster;
