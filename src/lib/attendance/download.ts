"use server";

import { User } from "@/models";
import { DTRResult } from "@/types";
import puppeteer from "puppeteer";
import { EmployeeDTRTemplate } from "@/constants/pdf/EmployeeDTRTemplate";
import { createLog } from "../log";
import fs from "fs";
import path from "path";

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
    const html = EmployeeDTRTemplate({ user, dtr, imageDataUrl });

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
