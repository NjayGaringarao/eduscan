import { downloadPdfBlob } from "./blob";

/**
 * Convert ArrayBuffer to Uint8Array for compatibility with downloadPdfBlob
 */
const toUint8Array = (buf: ArrayBuffer | Uint8Array): Uint8Array => {
  if (buf instanceof Uint8Array) return buf;
  return new Uint8Array(buf);
};

/**
 * Synchronously download a PDF buffer (ArrayBuffer or Uint8Array)
 */
export const downloadBufferAsPdf = (
  buffer: ArrayBuffer | Uint8Array,
  filename: string,
  onError?: (error: string) => void
): void => {
  try {
    const uint8 = toUint8Array(buffer);
    // downloadPdfBlob expects Uint8Array
    downloadPdfBlob(uint8, filename, onError);
  } catch (err: any) {
    console.error("downloadBufferAsPdf failed", err);
    onError?.(err?.message ?? "Failed to download PDF");
  }
};

/**
 * Fetch a signed URL or file URL and download as PDF using the same blob utility
 */
export const downloadUrlAsPdf = async (
  url: string,
  filename: string,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      const errMsg = `Failed to fetch PDF file: ${resp.status} ${resp.statusText} ${text}`;
      console.error(errMsg);
      onError?.(errMsg);
      return;
    }

    const arrayBuffer = await resp.arrayBuffer();
    downloadBufferAsPdf(arrayBuffer, filename, onError);
  } catch (err: any) {
    console.error("downloadUrlAsPdf failed", err);
    onError?.(err?.message ?? "Failed to download PDF from URL");
  }
};

/**
 * Convenience handler for server results that may contain a buffer or a signed URL.
 * If both are present, buffer is preferred.
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  // atob + charCode processing
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const handlePdfDownloadResult = async (
  result: {
    buffer?: ArrayBuffer | Uint8Array;
    url?: string;
    base64?: string;
    error?: string;
  },
  filename: string,
  onError?: (error: string) => void
): Promise<void> => {
  if (result.error) {
    onError?.(result.error);
    return;
  }
  if (result.buffer) {
    downloadBufferAsPdf(result.buffer, filename, onError);
    return;
  }
  if (result.base64) {
    try {
      const arrayBuffer = base64ToArrayBuffer(result.base64);
      downloadBufferAsPdf(arrayBuffer, filename, onError);
      return;
    } catch (err: any) {
      console.error("Failed to decode base64 PDF", err);
      onError?.(err?.message ?? "Failed to decode PDF");
      // fallback to URL if available
    }
  }
  if (result.url) {
    await downloadUrlAsPdf(result.url, filename, onError);
    return;
  }

  onError?.("No buffer, base64, or URL provided for download");
};
