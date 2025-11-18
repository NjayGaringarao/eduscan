const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const chromiumPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@sparticuz",
  "chromium",
  "bin"
);
const publicPath = path.join(__dirname, "..", "public");
const tarPath = path.join(publicPath, "chromium-pack.tar");

// Only extract if chromium bin directory exists (i.e., full package is installed)
if (fs.existsSync(chromiumPath)) {
  try {
    // Create public directory if it doesn't exist
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    // Create tar file from chromium bin directory
    process.chdir(path.dirname(chromiumPath));
    execSync(`tar -cf "${tarPath}" -C bin .`, {
      stdio: "inherit",
    });

    console.log(`✅ Chromium binaries packaged to ${tarPath}`);
  } catch (error) {
    console.warn("⚠️  Failed to extract Chromium binaries:", error.message);
    console.warn("   This is expected if @sparticuz/chromium is not installed.");
  }
} else {
  console.log("ℹ️  @sparticuz/chromium not found, skipping extraction");
}

