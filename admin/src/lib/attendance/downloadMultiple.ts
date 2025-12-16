"use server";

import { createClient } from "@/utils/supabase/server";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { DailyTimeRecordPDF } from "@/template/pdf/DailyTimeRecordPDF";
import { getChromiumExecutablePath, getPuppeteerArgs } from "@/utils/puppeteer";
import { createLog } from "../log";
import { getDTR } from "./get";

interface IDownloadMultiple {
  userIds: string[];
  month: string; // YYYY-MM
}

export const downloadMultiple = async ({
  userIds,
  month,
}: IDownloadMultiple): Promise<{
  buffer?: Uint8Array;
  path?: string;
  error?: string;
}> => {
  try {
    if (!userIds || userIds.length === 0) {
      return { error: "No users provided." };
    }

    const supabase = await createClient();

    // Fetch users in one query
    const { data: usersData, error: usersErr } = await supabase
      .from("user")
      .select("id, first_name, last_name, picture_id")
      .in("id", userIds);

    if (usersErr) return { error: usersErr.message };

    if (!Array.isArray(usersData) || usersData.length === 0) {
      return { error: "No matching users found." };
    }

    // Ensure we preserve the provided order
    const usersById: Record<string, any> = {};
    for (const u of usersData) usersById[String(u.id)] = u;
    const orderedUsers = userIds.map((id) => usersById[id]).filter(Boolean);

    // Load instruction image
    const imagePath = path.join(
      process.cwd(),
      "public",
      "image",
      "csc_dtr_instruction.png"
    );
    let imageDataUrl = "";
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString("base64");
      imageDataUrl = `data:image/png;base64,${imageBase64}`;
    } catch (err) {
      // proceed without image
      console.warn("Could not load DTR instruction image:", err);
    }

    // Build HTML parts per user
    const htmlParts: string[] = [];

    for (const user of orderedUsers) {
      const { dtr } = await getDTR(user.id, month);
      // Build a safe DTRResult when none is returned
      const safeDtr = dtr ?? {
        rows: [],
        summary: {
          regularDaysSchedule: "",
          saturdaysSchedule: "",
          totalUndertimeHours: 0,
          totalUndertimeMinutes: 0,
        },
        month,
        year: parseInt(
          (month || "").split("-")[0] || new Date().getFullYear().toString(),
          10
        ),
      };

      const part = DailyTimeRecordPDF({
        user,
        dtr: safeDtr,
        imageDataUrl,
      });
      htmlParts.push(part);
    }

    // Concatenate into a single HTML with page breaks
    const concatenatedHtml = htmlParts.join(
      `<div style="page-break-after: always;"></div>`
    );

    const fullHtml = `
      <html>
        <head>
          <meta charset="utf-8" />
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="font-sans text-sm">
          ${concatenatedHtml}
        </body>
      </html>
    `;

    // Get Chromium
    let executablePath: string;
    try {
      executablePath = await getChromiumExecutablePath();
    } catch (err: any) {
      return { error: err.message ?? "Failed to get Chromium executable path" };
    }

    const browser = await puppeteer.launch({
      args: getPuppeteerArgs(),
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1.27cm",
        bottom: "1.27cm",
        left: "1.78cm",
        right: "1.78cm",
      },
    });

    await browser.close();

    // Save to temp file to avoid large memory retention on client
    const tmpDir = path.join(process.cwd(), "tmp");
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
    } catch (err) {
      console.warn("Could not create tmp dir", err);
    }

    const outPath = path.join(tmpDir, `dtr-multiple-${Date.now()}.pdf`);
    try {
      fs.writeFileSync(outPath, pdfBuffer);
    } catch (err) {
      console.warn("Failed to write PDF to tmp file:", err);
    }

    await createLog({
      type: "ADMIN.EXPORT",
      title: `DTRs for ${orderedUsers.length} user(s) exported`,
      description: `Combined DTR export for ${orderedUsers.length} user(s) for ${month} was generated.`,
    });

    return { buffer: pdfBuffer, path: outPath };
  } catch (err: any) {
    console.error("downloadMultiple failed", err);
    return { error: err?.message ?? String(err) };
  }
};
