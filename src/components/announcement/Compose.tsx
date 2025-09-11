"use client";

import { cn } from "@/utils/style";
import React, { useState } from "react";
import TextBox from "../TextBox";
import Select from "../Select";
import ParagraphBox from "../ParagraphBox";
import Button from "../Button";
import * as announcement from "@/lib/announcement";

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

  const handleClear = () => setForm(DEFAULT_ANNOUNCEMENT);

  const handleSend = async () => {
    if (!form.title || !form.message) return;

    const confirmSend = window.confirm(
      `Send this announcement to ${form.recipient}?`
    );
    if (!confirmSend) return;

    setIsLoading(true);
    const { error } = await announcement.create(form);

    if (error) {
      alert(error);
    } else {
      alert("Announcement sent successfully!");
      window.location.reload();
    }

    setIsLoading(false);
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
        placeHolder="25 characters max"
        value={form.title}
        setValue={(e) => setForm((prev) => ({ ...prev, title: e }))}
        containerClassName="col-span-2"
        disabled={isLoading}
        maxLength={25}
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
          <option value="GUARDIAN">GUARDIAN</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </Select>
      </div>
      <ParagraphBox
        title="Message"
        placeholder="480 characters max"
        value={form.message}
        setValue={(e) => setForm((prev) => ({ ...prev, message: e }))}
        containerClassName="col-span-3"
        inputClassName="h-32"
        disabled={isLoading}
        maxLength={480}
      />
      <div className="col-span-3 flex flex-row gap-4 justify-end">
        <Button
          title={isLoading ? "Sending..." : "Send"}
          className="w-28"
          disabled={isLoading || !form.message.length || !form.title.length}
          onClick={handleSend}
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
