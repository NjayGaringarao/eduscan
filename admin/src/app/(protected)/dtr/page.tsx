import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import DTRManagement from "@/components/dtr/DTRManagement";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import React from "react";
import fs from "fs";
import path from "path";
import { downloadMultiple } from "@/lib/attendance/downloadMultiple";

// Server action: generate combined PDF and return base64-encoded PDF (no external storage required)
async function exportDtrAction(userIds: string[], month: string) {
  "use server";

  const {
    buffer,
    path: outPath,
    error,
  } = await downloadMultiple({ userIds, month });
  if (error || !buffer) return { error: error ?? "Failed to generate PDF" };

  try {
    // Convert server-side buffer to base64 string to send to client without using storage
    const base64 = Buffer.from(buffer as any).toString("base64");
    return { base64, path: outPath };
  } catch (err: any) {
    console.error("exportDtrAction failed to encode buffer", err);
    return { error: err?.message ?? "Failed to encode PDF" };
  }
}

// Server action: securely delete a temporary file from the tmp directory
async function deleteTmpFileAction(filePath: string) {
  "use server";

  try {
    const tmpDir = path.join(process.cwd(), "tmp");
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(tmpDir)) {
      return { error: "Invalid path" };
    }

    fs.unlinkSync(resolved);
    return { ok: true };
  } catch (err: any) {
    console.error("deleteTmpFileAction failed", err);
    return { error: err?.message ?? "Failed to delete file" };
  }
}

const dtrPage = () => {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Daily Time Record" />
      <Backdrop containerClassName={cn("flex flex-col gap-4 h-full")}>
        <DTRManagement
          exportDtr={exportDtrAction}
          deleteTmpFile={deleteTmpFileAction}
        />
      </Backdrop>
    </PageBox>
  );
};

export default dtrPage;
