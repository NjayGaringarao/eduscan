"use server";

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { getChromiumExecutablePath, getPuppeteerArgs } from "@/utils/puppeteer";
import { getSessionLog } from "./getSessionLog";
import { SessionLogPDF } from "@/template/pdf/SessionLogPDF";
import { createLog } from "../log";

interface DownloadSessionLogParams {
  date: string;
  userType?: string;
  studentDepartment?: string;
  studentProgram?: string;
  employeeType?: string;
  employeeDivision?: string;
  employeeTitle?: string;
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

export const downloadSessionLog = async ({
  date,
  userType,
  studentDepartment,
  studentProgram,
  employeeType,
  employeeDivision,
  employeeTitle,
}: DownloadSessionLogParams): Promise<{
  buffer?: Uint8Array;
  error?: string;
}> => {
  try {
    const { sessions, error } = await getSessionLog({
      date,
      userType,
      studentDepartment,
      studentProgram,
      employeeType,
      employeeDivision,
      employeeTitle,
    });

    if (error) {
      return { error };
    }

    const universityLogoDataUrl = loadLogo("prmsu.png");
    const eduscanLogoDataUrl = loadLogo("eduscan-logo.png");

    const html = SessionLogPDF({
      sessions,
      date,
      userType: userType || "ALL",
      studentDepartment,
      studentProgram,
      employeeType,
      employeeDivision,
      employeeTitle,
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

    const readableDate = new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Build filter description for log
    const filterParts: string[] = [];
    if (userType && userType !== "ALL") {
      filterParts.push(userType.toLowerCase());
    }
    if (studentDepartment && studentDepartment !== "ALL") {
      filterParts.push(studentDepartment);
    }
    if (studentProgram && studentProgram !== "ALL") {
      filterParts.push(studentProgram);
    }
    if (employeeType && employeeType !== "ALL") {
      filterParts.push(employeeType);
    }
    if (employeeDivision && employeeDivision !== "ALL") {
      filterParts.push(employeeDivision);
    }
    if (employeeTitle && employeeTitle !== "ALL") {
      filterParts.push(employeeTitle);
    }
    const filterStr = filterParts.length > 0 ? ` (${filterParts.join(", ")})` : "";

    await createLog({
      type: "ADMIN.EXPORT",
      title: "Session Log report downloaded",
      description: `Session Log report for ${readableDate}${filterStr} has been exported.`,
    });

    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("Session Log PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};

