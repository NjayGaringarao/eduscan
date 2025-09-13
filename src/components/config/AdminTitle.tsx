"use client";

import { cn } from "@/utils/style";
import React, { useEffect, useState } from "react";
import TextBox from "../TextBox";
import Button from "../Button";
import * as configDB from "@/database/config";
import { updateAdminTitle } from "@/lib/config/updateAdminTitle";

// error helpers
interface FormError {
  type: string | null;
  message: string | null;
}
const defaultFormError: FormError = { type: null, message: null };

const validateTitle = (title: string): FormError | null => {
  if (!title.trim()) {
    return {
      type: "admin.title",
      message: "* Job title is required.",
    };
  }
  if (title.trim().length < 2) {
    return {
      type: "admin.title",
      message: "* Job title must be at least 2 characters.",
    };
  }
  return null;
};

const AdminTitle = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<FormError>(defaultFormError);

  // Load current title
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await configDB.get(["admin.title"]);
        const titleConfig = res.configs.find((c) => c.key === "admin.title");
        setTitle(titleConfig?.value || "");
      } catch {
        alert("Failed to load admin title.");
      }
    };

    loadConfig();
  }, []);

  // Validate on input change
  useEffect(() => {
    setError(defaultFormError); // reset
    const formError = validateTitle(title);
    if (formError) {
      setError(formError);
    }
  }, [title]);

  const handleTitleChange = async () => {
    // if error already exists, stop
    if (error.type) return;

    setIsLoading(true);

    try {
      const { error: updateError } = await updateAdminTitle(title.trim());

      if (updateError) {
        setError({ type: "admin.title", message: updateError });
      } else {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err) {
      setError({
        type: "admin.title",
        message: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-xl p-6",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col gap-4"
      )}
    >
      <div className="flex-1 flex flex-col">
        <p className="text-primary font-semibold text-xl">Job Title</p>
        <p className="text-textBody text-base mt-2">
          Update the administrator's job title. This will be displayed alongside
          the admin name expecially on output documents such as Employee's DTR
          and etc.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <TextBox
          title="Job Title"
          value={title}
          setValue={(e) => setTitle(e)}
          containerClassName="w-full"
          isValueInvalid={error.type === "admin.title"}
          disabled={isLoading}
        />
        {error.type === "admin.title" && (
          <div className="text-error text-sm font-light">{error.message}</div>
        )}
        {isSuccess && (
          <div className="text-green-500 text-sm font-light">
            Job title updated successfully!
          </div>
        )}
      </div>

      <Button
        title={isLoading ? "Updating..." : "Update Title"}
        onClick={handleTitleChange}
        className="self-end w-36"
        disabled={!!error.type || isLoading}
      />
    </div>
  );
};

export default AdminTitle;
