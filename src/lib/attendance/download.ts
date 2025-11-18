"use server";

import { User } from "@/models";
import { DTRResult } from "@/types";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { EmployeeDTRTemplate } from "@/constants/pdf/EmployeeDTRTemplate";
import { createLog } from "../log";
import fs from "fs";
import path from "path";
import os from "os";

interface IDownload {
  user: User;
  dtr: DTRResult;
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
    const html = EmployeeDTRTemplate({ user, dtr, imageDataUrl });

    // Configure Chromium for serverless environment
    const isProduction = process.env.NODE_ENV === "production";

    let executablePath: string;
    if (isProduction) {
      executablePath = await chromium.executablePath();
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
