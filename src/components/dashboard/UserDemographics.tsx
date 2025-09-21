"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import Box from "../container/Box";
import {
  ComparisonMode,
  ComparisonValue,
  UserSet,
} from "@/lib/dashboard/types";
import Button from "../Button";
import { getUserDemographics } from "@/lib/dashboard/getUserDemographics";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import { RefreshCcw } from "lucide-react";

const UserDemographics = () => {
  const [pieChartData, setPieChartData] = useState<ComparisonValue[]>([]);
  const [userSet, setUserSet] = useState<UserSet>("TOTAL");
  const [comparison, setComparison] = useState<ComparisonMode>(
    "EMPLOYEE_VS_STUDENT"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDemographicsData = async (
    userSet: UserSet,
    comparisonMode: ComparisonMode
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserDemographics(userSet, comparisonMode);
      if (result.error) {
        setError(result.error);
        setPieChartData([]);
      } else {
        setPieChartData(result.data);
      }
    } catch (err) {
      setError("Failed to fetch demographics data");
      setPieChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemographicsData(userSet, comparison);
  }, [comparison, userSet]);

  const handleComparisonChange = (newComparison: ComparisonMode) => {
    setComparison(newComparison);
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box containerClassName="flex flex-col gap-6 p-0 overflow-hidden">
      <div className="flex flex-row justify-between items-center bg-textBody w-full px-6 py-4">
        <p className="text-background text-xl font-bold">User Composition</p>
        <Button
          onClick={() => fetchDemographicsData(userSet, comparison)}
          disabled={isLoading}
          secondary
        >
          <RefreshCcw
            className={cn(
              "w-5 h-5 text-background",
              isLoading && "animate-spin"
            )}
            strokeWidth={3}
          />
        </Button>
      </div>
      <div
        className={cn(
          "flex flex-col xl:flex-row lg:justify-around items-center gap-6",
          "flex-1 p-6"
        )}
      >
        <div className="w-full flex flex-col gap-6">
          <div className="rounded-xl shadow-xl">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loading prompt="Please wait..." />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-uRed">Error: {error}</div>
              </div>
            ) : pieChartData.length === 0 ||
              pieChartData.every((item) => item.value === 0) ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-primary text-lg font-medium">
                  No data available
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={150}
                    fill="#8884d"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center w-full md:w-auto">
          <div className="w-full flex flex-row gap-4 border-b-4 border-primary/50 pb-4">
            <Button
              title="Total"
              className="w-full lg:text-lg lg:p-2"
              secondary={userSet !== "TOTAL"}
              onClick={() => setUserSet("TOTAL")}
              disabled={isLoading}
            />
            <Button
              title="Present"
              className="w-full lg:text-lg lg:p-2"
              secondary={userSet !== "PRESENT"}
              onClick={() => setUserSet("PRESENT")}
              disabled={isLoading}
            />
          </div>
          <Button
            title="Employee vs Student"
            className="w-full md:w-56 lg:text-lg lg:p-2"
            secondary={comparison !== "EMPLOYEE_VS_STUDENT"}
            onClick={() => handleComparisonChange("EMPLOYEE_VS_STUDENT")}
            disabled={isLoading}
          />
          <Button
            title="Male vs Female"
            className="w-full md:w-56 lg:text-lg lg:p-2"
            secondary={comparison !== "MALE_VS_FEMALE"}
            onClick={() => handleComparisonChange("MALE_VS_FEMALE")}
            disabled={isLoading}
          />
          <Button
            title="Age Groups"
            className="w-full md:w-56 lg:text-lg lg:p-2"
            secondary={comparison !== "AGE_GROUPS"}
            onClick={() => handleComparisonChange("AGE_GROUPS")}
            disabled={isLoading}
          />
        </div>
      </div>
    </Box>
  );
};

export default UserDemographics;
