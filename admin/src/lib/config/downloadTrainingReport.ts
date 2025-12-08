"use server";

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { getChromiumExecutablePath, getPuppeteerArgs } from "@/utils/puppeteer";
import { TrainingReportPDF } from "@/template/pdf/TrainingReportPDF";
import { createLog } from "../log";
import { getTrainingSummary } from "./getTrainingSummary";

interface DownloadTrainingReportParams {
  user_type: "STUDENT" | "EMPLOYEE";
}

const loadLogo = (fileName: string) => {
  try {
    const logoPath = path.join(process.cwd(), "public", "image", fileName);
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.warn(`Failed to load logo ${fileName}`, error);
    return "";
  }
};

export const downloadTrainingReport = async ({
  user_type,
}: DownloadTrainingReportParams): Promise<{
  buffer?: Uint8Array;
  error?: string;
}> => {
  try {
    // Get training summary
    const { summary, error: summaryError } = await getTrainingSummary({
      user_type,
    });

    if (summaryError || !summary) {
      return { error: summaryError ?? "Training summary not found" };
    }

    const universityLogoDataUrl = loadLogo("prmsu.png");
    const eduscanLogoDataUrl = loadLogo("eduscan-logo.png");

    const html = TrainingReportPDF({
      summary,
      universityLogoDataUrl,
      eduscanLogoDataUrl,
    });

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
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="font-sans text-sm">
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
        top: "1.27cm",
        bottom: "1.27cm",
        left: "1.78cm",
        right: "1.78cm",
      },
    });

    await browser.close();

    const userTypeLabel = user_type === "STUDENT" ? "Student" : "Employee";

    await createLog({
      type: "ADMIN.EXPORT",
      title: "Training report downloaded",
      description: `Attendance forecasting training report for ${userTypeLabel} has been exported.`,
    });

    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("Training report PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};

