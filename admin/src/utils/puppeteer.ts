import fs from "fs";
import os from "os";
import chromium from "@sparticuz/chromium-min";

/**
 * Find Chrome executable path for development
 * Searches common installation locations across Windows, macOS, and Linux
 */
export const findChromePath = (): string | null => {
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

/**
 * Get the Chromium executable path for Puppeteer
 * Handles both production (Vercel) and development environments
 *
 * @returns The executable path for Chromium/Chrome
 * @throws Error if Chrome is not found in development mode
 */
export const getChromiumExecutablePath = async (): Promise<string> => {
  const isProduction = process.env.NODE_ENV === "production";

  // @sparticuz/chromium ships a Linux-only binary; on Windows always use the
  // locally installed Chrome, even under `next start`.
  if (os.platform() === "win32") {
    const chromePath = findChromePath();
    if (!chromePath) {
      throw new Error(
        "Chrome not found. Please install Google Chrome or set CHROME_PATH environment variable."
      );
    }
    return chromePath;
  }

  if (isProduction) {
    // Use @sparticuz/chromium-min with URL to chromium-pack.tar
    // Follow Vercel template pattern: https://vercel.com/templates/template/puppeteer-on-vercel
    let chromiumTarUrl: string;

    // Try to use production domain first (publicly accessible)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      chromiumTarUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/chromium-pack.tar`;
    }
    // Fallback to GitHub releases (always publicly accessible)
    else {
      chromiumTarUrl =
        "https://github.com/Sparticuz/chromium/releases/download/v141.0.0/chromium-pack.x64.tar";
    }

    return await chromium.executablePath(chromiumTarUrl);
  } else {
    // Development: find Chrome on local machine
    const chromePath = findChromePath();
    if (!chromePath) {
      throw new Error(
        "Chrome not found. Please install Google Chrome or set CHROME_PATH environment variable."
      );
    }
    return chromePath;
  }
};

/**
 * Get Puppeteer launch arguments based on environment
 * @returns Array of arguments for puppeteer.launch()
 */
export const getPuppeteerArgs = (): string[] => {
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction && os.platform() !== "win32"
    ? chromium.args
    : ["--no-sandbox", "--disable-setuid-sandbox"];
};
