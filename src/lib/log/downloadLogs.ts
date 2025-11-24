"use server";

import { SystemLog, AttendanceLog } from "@/models";
import puppeteer from "puppeteer-core";
import { SystemLogsPDF } from "@/template/pdf/SystemLogsPDF";
import { createLog } from "./createLog";
import { getChromiumExecutablePath, getPuppeteerArgs } from "@/utils/puppeteer";
import fs from "fs";
import path from "path";

interface DownloadLogsParams {
  logs: (SystemLog | AttendanceLog)[];
  fromDate: string;
  toDate: string;
  logType: string;
}

export const downloadLogs = async ({
  logs,
  fromDate,
  toDate,
  logType,
}: DownloadLogsParams): Promise<{ buffer?: Uint8Array; error?: string }> => {
  try {
    // Read and convert university logo to base64
    const universityLogoPath = path.join(
      process.cwd(),
      "public",
      "image",
      "prmsu.png"
    );
    let universityLogoDataUrl = "";
    try {
      const logoBuffer = fs.readFileSync(universityLogoPath);
      const logoBase64 = logoBuffer.toString("base64");
      universityLogoDataUrl = `data:image/png;base64,${logoBase64}`;
    } catch (err) {
      console.warn("Could not load PRMSU logo:", err);
    }

    // Read and convert Eduscan logo to base64
    const eduscanLogoPath = path.join(
      process.cwd(),
      "public",
      "image",
      "eduscan-logo.png"
    );
    let eduscanLogoDataUrl = "";
    try {
      const logoBuffer = fs.readFileSync(eduscanLogoPath);
      const logoBase64 = logoBuffer.toString("base64");
      eduscanLogoDataUrl = `data:image/png;base64,${logoBase64}`;
    } catch (err) {
      console.warn("Could not load Eduscan logo:", err);
    }

    // Build Tailwind-based HTML from your template
    const html = SystemLogsPDF({
      logs,
      fromDate,
      toDate,
      logType,
      universityLogoDataUrl,
      eduscanLogoDataUrl,
    });

    // Get Chromium executable path (handles both production and development)
    let executablePath: string;
    try {
      executablePath = await getChromiumExecutablePath();
    } catch (err: any) {
      return {
        error: err.message ?? "Failed to get Chromium executable path",
      };
    }

    const browser = await puppeteer.launch({
      args: getPuppeteerArgs(),
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(
      `
      <html>
        <head>
          <meta charset="utf-8" />
          <!-- ✅ Tailwind via CDN -->
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="font-sans text-[11px]">
          ${html}
        </body>
      </html>
      `,
      { waitUntil: "networkidle0" }
    );

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

    await browser.close();
    const dateRangeStr =
      fromDate && toDate
        ? `within the period of ${fromDate} to ${toDate}`
        : "for all dates";
    await createLog({
      type: "ADMIN.EXPORT",
      title: "System Logs has been exported",
      description: `Admin exports system logs with the filter of ${logType} ${dateRangeStr}.`,
    });
    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};
