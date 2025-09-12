"use server";

import { User } from "@/models";
import { UserAttendanceShift } from "@/types";
import puppeteer from "puppeteer";
import { EmployeeDTRTemplate } from "@/constants/pdf/EmployeeDTRTemplate";

interface IDownload {
  user: User;
  data: UserAttendanceShift[];
  fromDate: string;
  toDate: string;
}

export const download = async ({
  user,
  data,
  fromDate,
  toDate,
}: IDownload): Promise<{ buffer?: Uint8Array; error?: string }> => {
  try {
    // Build Tailwind-based HTML from your template
    const html = EmployeeDTRTemplate({ user, data, fromDate, toDate });

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
    return { buffer: pdfBuffer };
  } catch (err: any) {
    console.error("PDF generation failed", err);
    return { error: err.message ?? "Failed to generate PDF" };
  }
};
