"use client";
import React, { useEffect, useState } from "react";
import TextBox from "../TextBox";
import Button from "../Button";
import * as configDB from "@/database/config";
import { updateAdminName } from "@/lib/config/updateAdminName";
import { cn } from "@/utils/style";
import Box from "../container/Box";

// error helpers
interface FormError {
  type: string | null;
  message: string | null;
}
const defaultFormError: FormError = { type: null, message: null };

const validateName = (name: string): FormError | null => {
  if (!name.trim()) {
    return {
      type: "admin.name",
      message: "* Admin name is required.",
    };
  }
  if (name.trim().length < 2) {
    return {
      type: "admin.name",
      message: "* Admin name must be at least 2 characters.",
    };
  }
  return null;
};

const AdminName = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<FormError>(defaultFormError);

  // Load current name
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await configDB.get(["admin.name"]);
        const nameConfig = res.configs.find((c) => c.key === "admin.name");
        setName(nameConfig?.value || "");
      } catch {
        alert("Failed to load admin name.");
      }
    };

    loadConfig();
  }, []);

  // Validate on input change
  useEffect(() => {
    setError(defaultFormError); // reset
    const formError = validateName(name);
    if (formError) {
      setError(formError);
    }
  }, [name]);

  const handleNameChange = async () => {
    // if error already exists, stop
    if (error.type) return;

    setIsLoading(true);

    try {
      const { error: updateError } = await updateAdminName(name.trim());

      if (updateError) {
        setError({ type: "admin.name", message: updateError });
      } else {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch {
      setError({ type: "admin.name", message: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box containerClassName={cn("flex flex-col gap-4 p-6")}>
      <div className="flex-1 flex flex-col">
        <p className="text-primary font-semibold text-xl">Admin Name</p>
        <p className="text-textBody text-base mt-2">
          Update the administrator&apos;s display name. This will be shown
          throughout the system.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <TextBox
          title="Admin Name"
          value={name}
          setValue={(e) => setName(e)}
          containerClassName="w-full"
          isValueInvalid={error.type === "admin.name"}
          disabled={isLoading}
        />
        {error.type === "admin.name" && (
          <div className="text-error text-sm font-light">{error.message}</div>
        )}
        {isSuccess && (
          <div className="text-green-500 text-sm font-light">
            Admin name updated successfully!
          </div>
        )}
      </div>

      <Button
        title={isLoading ? "Updating..." : "Update Name"}
        onClick={handleNameChange}
        className="self-end w-36"
        disabled={!!error.type || isLoading}
      />
    </Box>
  );
};

export default AdminName;
