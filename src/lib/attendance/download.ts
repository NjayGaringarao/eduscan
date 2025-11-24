"use server";

import { User } from "@/models";
import { DTRResult, UserAttendanceShift } from "@/types";
import puppeteer from "puppeteer-core";
import { DailyTimeRecordPDF } from "@/template/pdf/DailyTimeRecordPDF";
import { AttendancePDF } from "@/template/pdf/AttendancePDF";
import { createLog } from "../log";
import fs from "fs";
import path from "path";
import { getChromiumExecutablePath, getPuppeteerArgs } from "@/utils/puppeteer";

interface IDownload {
  user: User;
  dtr: DTRResult;
}

export const download = async ({
  user,
  dtr,
}: IDownload): Promise<{ buffer?: Uint8Array; error?: string }> => {
  try {
    // Read and convert image to base64
    const imagePath = path.join(
      process.cwd(),
      "public",
      "image",
      "csc_dtr_instruction.png"
    );
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    // Build Tailwind-based HTML from your template
    const html = DailyTimeRecordPDF({ user, dtr, imageDataUrl });

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

    // Format month for log message
    const [year, monthNum] = dtr.month.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(monthNum) - 1
    ).toLocaleString("default", { month: "long" });

    await createLog({
      type: "ADMIN.EXPORT",
      title: `DTR of ${user.first_name} ${user.last_name} has been Exported`,
      description: `The DTR of ${user.first_name} ${user.last_name} with the user id of '${user.id}' for ${monthName} ${year} has been exported.`,
    });
    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};

interface IDownloadAttendance {
  user: User;
  attendance: UserAttendanceShift[];
  fromDate: string;
  toDate: string;
}

export const downloadAttendance = async ({
  user,
  attendance,
  fromDate,
  toDate,
}: IDownloadAttendance): Promise<{ buffer?: Uint8Array; error?: string }> => {
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
    const html = AttendancePDF({
      user,
      attendance,
      fromDate,
      toDate,
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

    // Format dates for log message
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    const fromDateStr = fromDateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const toDateStr = toDateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    await createLog({
      type: "ADMIN.EXPORT",
      title: `Attendance Record of ${user.first_name} ${user.last_name} has been Exported`,
      description: `The Attendance Record of ${user.first_name} ${user.last_name} with the user id of '${user.id}' for ${fromDateStr} to ${toDateStr} has been exported.`,
    });
    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};
