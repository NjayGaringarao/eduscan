"use server";

import { SystemLog, AttendanceLog } from "@/models";
import puppeteer from "puppeteer";
import SystemLogsTemplate from "@/constants/pdf/SystemLogsTemplate";
import { createLog } from "./createLog";

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
    // Build Tailwind-based HTML from your template
    const html = SystemLogsTemplate({ logs, fromDate, toDate, logType });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
    await createLog({
      type: "ADMIN.EXPORT",
      title: "System Logs has been exported",
      description: `Admin exports system logs with the filter of ${logType} within the period of ${fromDate} to ${toDate}.`,
    });
    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};
