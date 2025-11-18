"use server";

import { SystemLog, AttendanceLog } from "@/models";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import SystemLogsTemplate from "@/constants/pdf/SystemLogsTemplate";
import { createLog } from "./createLog";
import fs from "fs";
import os from "os";

interface DownloadLogsParams {
  logs: (SystemLog | AttendanceLog)[];
  fromDate: string;
  toDate: string;
  logType: string;
}

/**
 * Find Chrome executable path for development
 */
const findChromePath = (): string | null => {
  // Check for CHROME_PATH environment variable first
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const platform = os.platform();

  if (platform === "win32") {
    // Common Chrome installation paths on Windows
    const possiblePaths = [
      process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env.PROGRAMFILES + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env["PROGRAMFILES(X86)"] +
        "\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];

    for (const chromePath of possiblePaths) {
      if (chromePath && fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  } else if (platform === "darwin") {
    // macOS
    const chromePath =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  } else {
    // Linux
    const possiblePaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  }

  return null;
};

export const downloadLogs = async ({
  logs,
  fromDate,
  toDate,
  logType,
}: DownloadLogsParams): Promise<{ buffer?: Uint8Array; error?: string }> => {
  try {
    // Build Tailwind-based HTML from your template
    const html = SystemLogsTemplate({ logs, fromDate, toDate, logType });

    // Configure Chromium for serverless environment
    const isProduction = process.env.NODE_ENV === "production";

    let executablePath: string;
    if (isProduction) {
      // In production, use chromium-min to download from official GitHub releases
      // This avoids the need to host the tar file ourselves
      const chromiumVersion = "141.0.0";
      const chromiumTarUrl =
        process.env.CHROMIUM_TAR_URL ||
        `https://github.com/Sparticuz/chromium/releases/download/v${chromiumVersion}/chromium-v${chromiumVersion}-pack.tar`;
      executablePath = await chromium.executablePath(chromiumTarUrl);
    } else {
      // Development: find Chrome on local machine
      const chromePath = findChromePath();
      if (!chromePath) {
        return {
          error:
            "Chrome not found. Please install Google Chrome or set CHROME_PATH environment variable.",
        };
      }
      executablePath = chromePath;
    }

    const browser = await puppeteer.launch({
      args: isProduction
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
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
        <body class="p-6 font-sans text-sm">
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
