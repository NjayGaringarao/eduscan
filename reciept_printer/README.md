# 📄 Receipt Printer

A C# (.NET 8.0) console application that generates and prints attendance receipts on ESC/POS-compatible thermal printers. This application is used as a **sidecar executable** by the [EduScan Kiosk](../kiosk/) application.

## 📋 Overview

The receipt printer generates formatted receipts containing:

- **EduScan logo** (embedded PNG image)
- **Activity type** (e.g., "TIME-IN", "TIME-OUT")
- **User information** (User ID, Name, Date, Time)

The application communicates directly with thermal printers via raw ESC/POS commands through the Windows print spooler API.

## 🎯 Purpose

This project is a subset of the [EduScan Kiosk](../kiosk/) project. The compiled binary (`reciept_printer-x86_64-pc-windows-msvc.exe`) is bundled as a Tauri sidecar executable, allowing the kiosk application to print attendance receipts without requiring separate printer drivers or additional software on the target machine.

## ✅ Requirements

- **Windows** (x64)
- **.NET 8.0 SDK (LTS)**
- **Visual Studio 2022** or **VS Code** with C# extension
- **ESC/POS-compatible** thermal printer (e.g., EPSON TM-T82X, POS-58)
- Appropriate Windows printer driver installed

### NuGet Packages

- `SixLabors.ImageSharp` (v3.1.12) - For rasterizing PNG logos to ESC/POS format

## 🏗️ Project Structure

```
reciept_printer/
├── reciept_printer/
│   ├── Program.cs                          # Main application logic
│   ├── reciept_printer.csproj              # Project file
│   └── eduscan_logo_pos_58.png             # Embedded logo resource (58mm)
├── reciept_printer.sln         # Visual Studio solution
└── README.md                   # This file
```

## 🛠️ Building the Project

### 1. Restore Dependencies

```bash
dotnet restore
```

### 2. Build for Development

```bash
dotnet build
```

This creates a debug executable in `reciept_printer/bin/Debug/net8.0/`.

### 3. Build for Production (Tauri Sidecar)

To create a self-contained, single-file executable for use with Tauri:

```powershell
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:PublishTrimmed=true
```

The output will be located at:

```
reciept_printer/bin/Release/net8.0/win-x64/publish/reciept_printer.exe
```

### 4. Prepare for Tauri Integration

For Tauri v2 sidecar integration, rename the executable:

```powershell
Rename-Item -Path "reciept_printer/bin/Release/net8.0/win-x64/publish/reciept_printer.exe" -NewName "reciept_printer-x86_64-pc-windows-msvc.exe"
```

Then copy it to the kiosk binaries directory:

```
kiosk/src-tauri/binaries/
```

> **Note:** For detailed Tauri integration instructions, see [kiosk/src-tauri/binaries/README.md](../kiosk/src-tauri/binaries/README.md)

## 🚀 Usage

### Command-Line Arguments

The application accepts the following command-line arguments:

| Argument         | Description                                       | Example                     |
| ---------------- | ------------------------------------------------- | --------------------------- |
| `--reference_id` | Reference ID for the attendance log (database ID) | `"12345"`                   |
| `--activity`     | Activity type (e.g., "TIME-IN", "TIME-OUT")       | `"TIME-OUT"`                |
| `--user_id`      | User identification number                        | `"22-0-0-0000"`             |
| `--name`         | Full name of the user                             | `"JUAN S. DELA CRUZ"`       |
| `--date`         | Date of attendance                                | `"NOVEMBER 22, 2025 (SAT)"` |
| `--time`         | Time of attendance                                | `"4:45 PM"`                 |

### Example Usage

**PowerShell:**

```powershell
.\reciept_printer.exe `
  --reference_id "12345" `
  --activity "TIME-OUT" `
  --user_id "22-0-0-0000" `
  --name "JUAN SANTOS DELA CRUZ" `
  --date "NOVEMBER 22, 2025 (SAT)" `
  --time "4:45 PM"
```

**Command Prompt:**

```cmd
reciept_printer.exe ^
  --reference_id "12345" ^
  --activity "TIME-OUT" ^
  --user_id "22-0-0-0000" ^
  --name "JUAN SANTOS DELA CRUZ" ^
  --date "NOVEMBER 22, 2025 (SAT)" ^
  --time "4:45 PM"
```

### Expected Output

On success:

```
Printed successfully!
```

On error:

```
PRINT ERROR: [error message]
```

## 🔧 Configuration

### Printer Name

The default printer name is hardcoded in `Program.cs`:

```csharp
string printerName = "POS-58";
```

To use a different printer (e.g., `EPSON TM-T82X Receipt`), modify this value to match your printer's name in Windows.

### Logo Resource

The logo is embedded as a resource. Ensure:

1. `eduscan_logo_pos_58.png` is included in the project
2. **Build Action** is set to **Embedded Resource**
3. The resource name matches: `reciept_printer.eduscan_logo_pos_58.png`

If you change the project namespace, update the resource name in `Program.cs`:

```csharp
string resourceName = "reciept_printer.eduscan_logo_pos_58.png";
```

## 📦 Integration with EduScan Kiosk

The receipt printer is called from the Tauri kiosk application using the sidecar command:

```typescript
import { Command } from "@tauri-apps/plugin-shell";

await Command.sidecar("reciept_printer", [
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

For complete integration details, refer to the [Tauri binaries README](../kiosk/src-tauri/binaries/README.md).

## 🐛 Troubleshooting

### Printer Not Found

**Error:** `Cannot open printer: EPSON TM-T82X Receipt`

**Solution:**

1. Verify the printer is installed in Windows
2. Check the printer name matches exactly (case-sensitive)
3. Ensure the printer is set as default or update the `printerName` variable

### Logo Not Displaying

**Issue:** Receipt prints without logo

**Solution:**

1. Verify `eduscan_logo.png` exists in the project
2. Check the Build Action is set to "Embedded Resource"
3. Ensure the resource name matches the namespace: `reciept_printer.eduscan_logo.png`

### Build Errors

**Error:** Package restore fails

**Solution:**

```bash
dotnet restore
dotnet clean
dotnet build
```

## 📝 License

This project is part of the Eduscan system. See the main repository license for details.

## 🔗 Related Documentation

- [EduScan Kiosk](../kiosk/README.md) - Main kiosk application
- [Tauri Binaries README](../kiosk/src-tauri/binaries/README.md) - Detailed build instructions for Tauri integration
