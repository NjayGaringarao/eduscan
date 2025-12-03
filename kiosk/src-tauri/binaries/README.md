# 📄 Receipt Printer — Build Instructions

This document explains how to compile the **receipt_printer-x86_64-pc-windows-msvc.exe** binary used as a **sidecar executable** in the EduScan Kiosk (Tauri v2).

The executable is written in **C# (.NET 8.0 LTS)** and outputs ESC/POS commands directly to a compatible thermal printer (e.g., EPSON TM-T82X, POS-58).

---

## ✅ Requirements

- **Windows** (x64)
- **.NET 8.0 SDK (LTS)**
- **Visual Studio 2022** or VS Code
- **EPSON TM-T82X** thermal printer driver installed
- NuGet package:

  ```
  SixLabors.ImageSharp (3.1.12)
  ```

---

## 🛠️ How to Build the Sidecar Binary

### 1. Create a New Project

Create a new **Console App** project in Visual Studio:

- Project name must be: **reciept_printer**
- Target framework: **.NET 8.0 (Long Term Support)**
- Output type: **Console Application**

---

### 2. Add Dependencies

Install ImageSharp (required to rasterize PNG logos for ESC/POS):

```bash
dotnet add package SixLabors.ImageSharp --version 3.1.12
```

---

### 3. Add/Replace the Source Code

Replace your `Program.cs` with the full implementation below.

> Your complete `Program.cs` is already valid — just paste it as-is into the project:

```csharp
// (full code here — unchanged for brevity)
```

---

### 4. Embed the Logo

Place your PNG logo inside the project and set:

- **Build Action:** Embedded Resource

Namespace-based resource path must match (for the 58mm logo):

```
reciept_printer.eduscan_logo_pos_58.png
```

If your project namespace changes, update this line:

```csharp
string resourceName = "reciept_printer.eduscan_logo_pos_58.png";
```

---

### 5. Publish a Self-Contained Single Executable

To create a Tauri-compatible sidecar binary, publish it as a **trimmed, self-contained, single-file** executable:

```bash
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:PublishTrimmed=true
```

This will generate:

```
bin/Release/net8.0/win-x64/publish/reciept_printer.exe
```

---

### 6. Rename the Binary for Tauri Sidecar

Tauri v2 requires naming sidecar binaries with the **target triple** suffix:

Rename:

```
reciept_printer.exe
```

to:

```
reciept_printer-x86_64-pc-windows-msvc.exe
```

Then place it into:

```
src-tauri/binaries/
```

so Tauri can bundle it automatically.

---

## ▶️ Running the Executable Manually

You can test your receipt printer via terminal:

```powershell
.\reciept_printer.exe `
  --reference_id "12345" `
  --activity "TIME-OUT" `
  --user_id "22-0-0-0000" `
  --name "JUAN S. DELA CRUZ" `
  --date "NOVEMBER 22, 2025 (SAT)" `
  --time "4:45 PM"
```

---

## 📦 How Tauri Uses the Sidecar

Inside the Tauri app, you call this executable via:

```ts
Command.sidecar("receipt_printer", [
  "--reference_id",
  referenceId,
  "--activity",
  activity,
  "--user_id",
  userId,
  "--name",
  name,
  "--date",
  date,
  "--time",
  time,
]);
```

After bundling, Tauri will automatically ship the Windows executable.
