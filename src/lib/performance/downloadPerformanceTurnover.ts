"use server";

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { getChromiumExecutablePath, getPuppeteerArgs } from "@/utils/puppeteer";
import { getPerformanceSnapshotByDate } from "./getPerformanceSnapshotByDate";
import { getAtRiskUserDetails } from "./getAtRiskUserDetails";
import { PerformanceTurnoverTemplate } from "@/constants/pdf/PerformanceTurnoverTemplate";
import { createLog } from "../log";

interface DownloadParams {
  date: string;
  role: "ALL" | "STUDENT" | "EMPLOYEE";
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

export const downloadPerformanceTurnover = async ({
  date,
  role,
}: DownloadParams): Promise<{ buffer?: Uint8Array; error?: string }> => {
  try {
    const [{ data: snapshot, error: snapshotError }, { data: atRiskUsers, error: atRiskError }] =
      await Promise.all([
        getPerformanceSnapshotByDate(date, role),
        getAtRiskUserDetails({ date, role }),
      ]);

    if (snapshotError) {
      return { error: snapshotError };
    }
    if (atRiskError) {
      return { error: atRiskError };
    }

    const universityLogoDataUrl = loadLogo("prmsu.png");
    const eduscanLogoDataUrl = loadLogo("eduscan-logo.png");

    const html = PerformanceTurnoverTemplate({
      snapshot,
      atRiskUsers,
      date,
      role,
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

    await createLog({
      type: "ADMIN.EXPORT",
      title: "Performance Turnover report downloaded",
      description: `Performance turnover report for ${readableDate} (${role.toLowerCase()}) has been exported.`,
    });

    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("Performance turnover PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};


