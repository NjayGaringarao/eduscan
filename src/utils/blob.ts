/**
 * Utility functions for handling PDF buffer conversion and blob creation
 */

/**
 * Converts a PDF buffer to a proper ArrayBuffer for blob creation
 * This handles the type compatibility issues between Node.js Buffer and browser ArrayBuffer
 */
export const convertBufferToArrayBuffer = (buffer: Uint8Array): ArrayBuffer => {
  // Ensure we have a Uint8Array instance (Buffer from Node is a Uint8Array subclass)
  const uint8 =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as any);

  // Create a plain ArrayBuffer copy (this avoids SharedArrayBuffer / ArrayBufferLike issues)
  const arrayBuffer = new ArrayBuffer(uint8.byteLength);
  const view = new Uint8Array(arrayBuffer);
  view.set(uint8);

  return arrayBuffer;
};

/**
 * Creates a PDF blob from a buffer and triggers download
 */
export const downloadPdfBlob = (
  buffer: Uint8Array,
  filename: string,
  onError?: (error: string) => void
): void => {
  try {
    // Convert buffer to proper ArrayBuffer
    const arrayBuffer = convertBufferToArrayBuffer(buffer);

    // Build Blob from ArrayBuffer (now definitely a standard ArrayBuffer)
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("PDF download failed", err);
    onError?.(err.message || "Failed to download PDF");
  }
};

/**
 * Sanitizes a string for use in filenames
 */
export const sanitizeFilename = (str: string | undefined): string => {
  return (str ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9-_]/g, "");
};
