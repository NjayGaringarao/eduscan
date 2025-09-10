"use client";

import { cn } from "@/utils/style";
import React, { useState } from "react";
import TextBox from "../TextBox";
import Select from "../Select";
import { set } from "date-fns";
import ParagraphBox from "../ParagraphBox";
import Button from "../Button";

type AnnouncementForm = {
  title: string;
  message: string;
  recipient: string;
};

const DEFAULT_ANNOUNCEMENT = {
  title: "",
  message: "",
  recipient: "ALL",
};

const Compose = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(DEFAULT_ANNOUNCEMENT);

  const handleClear = () => {
    setForm(DEFAULT_ANNOUNCEMENT);
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-xl p-6",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col md:grid md:grid-cols-3 gap-6 justify-end"
      )}
    >
      <TextBox
        title="Title"
        placeHolder="10 characters max"
        value={form.title}
        setValue={(e) => setForm((prev) => ({ ...prev, title: e }))}
        containerClassName="col-span-2"
        disabled={isLoading}
        maxLength={10}
      />
      <div className="flex flex-col">
        <p className="text-base text-textBody">Recipient</p>
        <Select
          value={form.recipient}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, recipient: e.target.value }))
          }
          className="text-lg text-primary bg-background/50"
          title="Recipient"
          disabled={isLoading}
        >
          <option value="ALL">ALL USER</option>
          <option value="STUDENT">STUDENT</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </Select>
      </div>
      <ParagraphBox
        title="Message"
        placeholder="50 characters max"
        value={form.message}
        setValue={(e) => setForm((prev) => ({ ...prev, message: e }))}
        containerClassName="col-span-3"
        inputClassName="h-32"
        disabled={isLoading}
        maxLength={50}
      />
      <div className="col-span-3 flex flex-row gap-4 justify-end">
        <Button
          title="Send"
          className="w-28"
          disabled={isLoading || !form.message.length || !form.title.length}
        />
        <Button
          title="Clear"
          onClick={handleClear}
          secondary
          className="w-28"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default Compose;
