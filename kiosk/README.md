# Eduscan Kiosk Application

The kiosk application is a desktop application built with Tauri that runs on face recognition terminals. It provides a full-screen interface for students and employees to log their attendance using facial recognition technology.

## 🛠️ Tech Stack

- **Framework:** Tauri 2 (Rust + Web)
- **Frontend:** React 19, TypeScript, Vite
- **UI:** TailwindCSS 4, Headless UI
- **Face Recognition:** face-api.js (client-side detection)
- **Database:** Supabase (for attendance logging)
- **Platform:** Cross-platform desktop application (Windows, macOS, Linux)

## 📁 Project Structure

```
kiosk/
├── src/
│   ├── pages/                  # Application pages
│   │   ├── auth.tsx           # Authentication page
│   │   └── kiosk.tsx          # Main kiosk interface
│   ├── components/
│   │   ├── face-id/           # Face recognition components
│   │   │   ├── RecognitionCamera.tsx
│   │   │   ├── StudentStatus.tsx
│   │   │   ├── EmployeeStatus.tsx
│   │   │   └── FailedStatus.tsx
│   │   └── kiosk/             # Kiosk UI components
│   ├── lib/
│   │   ├── faceid/            # Face recognition utilities
│   │   └── printer/           # Receipt printing
│   ├── context/               # React contexts (auth, dialog)
│   ├── hooks/                 # Custom React hooks
│   └── models/                # TypeScript models
├── src-tauri/                 # Tauri backend (Rust)
│   ├── src/                   # Rust source files
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── public/
│   ├── models/               # face-api.js model files
│   └── image/                # Static images
└── dist/                     # Build output
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (latest stable version) - [Install Rust](https://www.rust-lang.org/tools/install)
- **System Dependencies:**
  - **Windows:** Visual Studio C++ Build Tools
  - **macOS:** Xcode Command Line Tools
  - **Linux:** Build essentials (gcc, libssl-dev, etc.)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Update `src/constant/env.ts` with your Supabase credentials:

```typescript
export const SUPABASE_URL = "your_supabase_url";
export const SUPABASE_ANON_KEY = "your_supabase_anon_key";
```

Alternatively, use environment variables by modifying the code to read from `process.env`.

3. Ensure face recognition models are available:

The face-api.js models should be in `public/models/`. These are required for face detection:
- `tiny_face_detector_model-*`
- `face_landmark_68_model-*`
- `face_recognition_model-*`
- `face_expression_model-*`

4. Run in development mode:

```bash
npm run dev
```

This will start the Vite dev server and launch the Tauri application.

## 🔑 Key Features

### Facial Recognition
- **Real-time face detection** using webcam
- **Face distance validation** to ensure optimal capture distance
- **Automatic face capture** when face is properly positioned
- **Face matching** via Supabase Edge Functions

### Attendance Logging
- **Automatic attendance recording** upon successful face recognition
- **User status display** (Student/Employee with session information)
- **Failed recognition handling** with user feedback
- **Session validation** to ensure users log in at correct times

### Receipt Printing
- **Attendance receipt generation** for confirmation
- **Tauri-native printing** via external binary (`reciept_printer`)
- **Print confirmation** to physical receipt printers

### Kiosk Mode
- **Full-screen interface** optimized for touch screens
- **Session timer** to prevent unauthorized access
- **Kiosk authentication** for device management
- **Usage instructions** displayed on side panel

## 🎯 User Flow

1. **Camera Initialization** - Webcam starts and loads face detection models
2. **Face Detection** - Continuously detects faces in camera feed
3. **Distance Validation** - Ensures face is at optimal distance (30-60% of frame)
4. **Face Capture** - Captures face image when conditions are met
5. **Face Matching** - Sends captured image to ML service for matching
6. **Status Display** - Shows recognition result:
   - **Student Status** - Displays student info and session details
   - **Employee Status** - Displays employee info and session details
   - **Failed Status** - Shows error message if recognition fails
7. **Attendance Logging** - Records attendance in Supabase
8. **Receipt Printing** - Optionally prints attendance receipt

## 📡 API Integration

### Supabase Integration

- **Authentication** - Kiosk device authentication
- **Attendance Logging** - Records attendance via Edge Functions
- **Face Matching** - Communicates with ML service through Supabase

### ML Service Integration

The kiosk communicates with the ML service (through Supabase Edge Functions) for:
- Face encoding and matching
- User identification
- Session validation

## 🖨️ Receipt Printing

The kiosk includes a native receipt printer integration:

- Uses external binary: `reciept_printer.exe` (Windows)
- Print attendance confirmation receipts
- Configurable receipt format and content

The printer binary is located in `src-tauri/binaries/` and is bundled with the application.

## 🧪 Available Scripts

```bash
npm run dev        # Start development server with Tauri
npm run build      # Build for production
npm run preview    # Preview web build (without Tauri)
npm run tauri      # Run Tauri CLI commands
```

### Tauri CLI Commands

```bash
npm run tauri dev          # Run in development mode
npm run tauri build        # Build executable for current platform
npm run tauri build -- --target x86_64-pc-windows-msvc  # Build for specific target
```

## 🎨 UI/UX Features

- **Responsive Design** - Adapts to different screen sizes
- **Dark Mode Support** - Toggle between light/dark themes
- **Touch-Friendly** - Optimized for touch screen interactions
- **Visual Feedback** - Clear status indicators and animations
- **Error Handling** - User-friendly error messages

## 🔒 Security

- **Kiosk Authentication** - Requires authentication to manage device
- **Session Timeout** - Automatic logout after inactivity
- **Secure API Communication** - All API calls authenticated
- **Face Data** - Images processed but not permanently stored on device

## 📦 Building for Production

### Build Executables

```bash
npm run tauri build
```

This will create platform-specific executables in `src-tauri/target/release/bundle/`:

- **Windows:** `.msi` installer or `.exe`
- **macOS:** `.dmg` or `.app`
- **Linux:** `.deb`, `.AppImage`, or `.rpm`

### Distribution

1. Build for target platform
2. Test the executable thoroughly
3. Package installer if needed
4. Deploy to kiosk devices

## 🔧 Configuration

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to configure:
- Application metadata (name, version, identifier)
- Window settings (size, title, decorations)
- Build settings (icon, external binaries)
- Security policies (CSP)

### Environment Variables

Currently, Supabase credentials are hardcoded in `src/constant/env.ts`. For production:
- Consider using Tauri's environment variable system
- Or use a configuration file loaded at runtime
- Or inject during build time

## 🐛 Troubleshooting

### Common Issues

1. **Camera not working:**
   - Check browser/kiosk permissions for camera access
   - Ensure camera is not being used by another application

2. **Face detection not loading:**
   - Verify model files are in `public/models/`
   - Check network connectivity for model downloads

3. **Build errors:**
   - Ensure Rust is properly installed: `rustc --version`
   - Install Tauri CLI: `cargo install tauri-cli`
   - Check system dependencies are installed

4. **Receipt printer not working:**
   - Verify printer binary is present
   - Check printer connection and drivers
   - Review Tauri capabilities configuration

## 📝 Development Notes

- Uses Tauri 2.x with the new architecture
- React 19 with modern hooks and patterns
- face-api.js runs entirely client-side (no server needed for detection)
- Models are loaded from local files (not CDN)

## 🔗 Related Documentation

- [Root README](../README.md) - General project overview
- [Admin Web App README](../admin/README.md) - Admin dashboard details
- [ML Service README](../ml_service/README.md) - Backend service details
- [Tauri Documentation](https://tauri.app/) - Tauri framework docs

## 📄 License

[Add your license information here]
