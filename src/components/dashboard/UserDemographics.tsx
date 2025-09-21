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
import { ComparisonMode, ComparisonValue } from "@/lib/dashboard/types";
import Button from "../Button";
import { getUserDemographics } from "@/lib/dashboard/getUserDemographics";
import Loading from "../Loading";

const UserDemographics = () => {
  const [pieChartData, setPieChartData] = useState<ComparisonValue[]>([]);
  const [comparison, setComparison] = useState<ComparisonMode>(
    "EMPLOYEE_VS_STUDENT"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDemographicsData = async (comparisonMode: ComparisonMode) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserDemographics(comparisonMode);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemographicsData(comparison);
  }, [comparison]);

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
    name,
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
    <Box containerClassName="flex flex-col gap-6 md:flex-row md:justify-around items-center">
      <div className="w-full md:w-1/2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loading prompt="Please wait..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : pieChartData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No data available</div>
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
                fill="#8884d8"
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
      <div className="flex flex-col gap-4 items-center w-full md:w-auto">
        <Button
          title="Employee vs Student"
          className="w-full md:w-56 lg:text-lg lg:p-2"
          secondary={comparison !== "EMPLOYEE_VS_STUDENT"}
          onClick={() => handleComparisonChange("EMPLOYEE_VS_STUDENT")}
        />
        <Button
          title="Male vs Female"
          className="w-full md:w-56 lg:text-lg lg:p-2"
          secondary={comparison !== "MALE_VS_FEMALE"}
          onClick={() => handleComparisonChange("MALE_VS_FEMALE")}
        />
        <Button
          title="Age Groups"
          className="w-full md:w-56 lg:text-lg lg:p-2"
          secondary={comparison !== "AGE_GROUPS"}
          onClick={() => handleComparisonChange("AGE_GROUPS")}
        />
      </div>
    </Box>
  );
};

export default UserDemographics;
