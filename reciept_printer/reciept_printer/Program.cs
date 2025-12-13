using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;

class RawPrinter
{
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true)]
    private static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true)]
    private static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    private static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    private static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true)]
    private static extern bool WritePrinter(
        IntPtr hPrinter,
        byte[] pBytes,
        int dwCount,
        out int dwWritten
    );

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    private struct DOCINFOA
    {
        [MarshalAs(UnmanagedType.LPStr)]
        public string pDocName;

        [MarshalAs(UnmanagedType.LPStr)]
        public string pOutputFile;

        [MarshalAs(UnmanagedType.LPStr)]
        public string pDataType;
    }

    public static bool PrintRaw(string printerName, byte[] data)
    {
        if (!OpenPrinter(printerName, out IntPtr hPrinter, IntPtr.Zero))
            throw new Exception("Cannot open printer: " + printerName);

        DOCINFOA di = new DOCINFOA
        {
            pDocName = "ESC/POS Receipt",
            pDataType = "RAW"
        };

        if (!StartDocPrinter(hPrinter, 1, ref di))
            throw new Exception("Cannot start document on printer.");

        if (!StartPagePrinter(hPrinter))
            throw new Exception("Cannot start page on printer.");

        bool success = WritePrinter(hPrinter, data, data.Length, out int written);

        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);

        return success && written == data.Length;
    }
}



class Program
{
    static void Main(string[] args)
    {
        string printerName = "EPSON TM-T82X Receipt";

        string reference_id = GetArg(args, "--reference_id");
        string activity = GetArg(args, "--activity");
        string userId = GetArg(args, "--user_id");
        string name = GetArg(args, "--name");
        string date = GetArg(args, "--date");
        string time = GetArg(args, "--time");

        MemoryStream ms = new MemoryStream();

        // ESC/POS initialize
        WriteBytes(ms, new byte[] { 0x1B, 0x40 });

        //-------------------------------------------------
        // PRINT EMBEDDED LOGO
        //-------------------------------------------------
        var assembly = Assembly.GetExecutingAssembly();
        string resourceName = "reciept_printer.eduscan_logo.png"; // <-- namespace.filename

        using Stream logoStream = assembly.GetManifestResourceStream(resourceName)!;
        byte[] imgBytes = BitmapToRasterEscPos(logoStream);
        WriteBytes(ms, imgBytes);



        //-------------------------------------------------
        // Text content
        //-------------------------------------------------
        WriteLine(ms, "");
        WriteLine(ms, "Below is your attendance logging information.");
        WriteLine(ms, "Please keep this for future references.");
        WriteLine(ms, "");
        WriteLine(ms, "------------------------------------------------");
        WriteLine(ms, " ");

        // Centered activity title in BIG FONT
        WriteBytes(ms, new byte[] { 0x1B, 0x61, 0x01 }); // Center
        WriteBytes(ms, new byte[] { 0x1D, 0x21, 0x11 }); // Double height+width
        WriteLine(ms, activity);
        WriteBytes(ms, new byte[] { 0x1D, 0x21, 0x00 }); // Normal font
        WriteBytes(ms, new byte[] { 0x1B, 0x61, 0x00 }); // Left align

        WriteLine(ms, " ");
        WriteLine(ms, "------------------------------------------------");
        WriteLine(ms, "");

        // Transaction Details
        WriteLine(ms, $"Reference : {reference_id}");
        WriteLine(ms, $"User ID   : {userId}");
        WriteLine(ms, $"Name      : {name}");
        WriteLine(ms, $"Date      : {date}");
        WriteLine(ms, $"Time      : {time}");
        WriteLine(ms, "");

        // FEED AND CUT
        WriteBytes(ms, new byte[] { 0x1B, 0x64, 0x05 }); // Feed
        WriteBytes(ms, new byte[] { 0x1D, 0x56, 0x00 }); // Cut

        byte[] finalData = ms.ToArray();

        try
        {
            RawPrinter.PrintRaw(printerName, finalData);
            Console.WriteLine("Printed successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine("PRINT ERROR: " + ex.Message);
        }
    }

    static string GetArg(string[] args, string key)
    {
        int idx = Array.IndexOf(args, key);
        return (idx >= 0 && idx < args.Length - 1) ? args[idx + 1] : "";
    }

    static void WriteLine(Stream s, string text)
    {
        byte[] data = Encoding.ASCII.GetBytes(text + "\r\n");
        s.Write(data, 0, data.Length);
    }

    static void WriteBytes(Stream s, byte[] data)
    {
        s.Write(data, 0, data.Length);
    }

    // Convert PNG Stream to ESC/POS Raster
    static byte[] BitmapToRasterEscPos(Stream stream)
    {
        using Image<Rgba32> img = Image.Load<Rgba32>(stream);

        int width = (img.Width + 7) / 8;
        int height = img.Height;
        byte[] bitmapData = new byte[width * height];

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < img.Width; x++)
            {
                Rgba32 pixel = img[x, y];
                bool black = pixel.R < 128 && pixel.G < 128 && pixel.B < 128;

                if (black)
                    bitmapData[y * width + (x / 8)] |= (byte)(0x80 >> (x % 8));
            }
        }

        using var ms = new MemoryStream();
        byte[] header = new byte[]
        {
            0x1D, 0x76, 0x30, 0x00,
            (byte)(width % 256),
            (byte)(width / 256),
            (byte)(height % 256),
            (byte)(height / 256)
        };
        ms.Write(header, 0, header.Length);
        ms.Write(bitmapData, 0, bitmapData.Length);

        return ms.ToArray();
    }
}


// NOTE: USE THIS SECTION IF IT IS REQUIRED TO USE EPSON TM-T82X Receipt Printer

//class Program
//{
//    static void Main(string[] args)
//    {
//        string printerName = "POS-58";

//        string reference_id = GetArg(args, "--reference_id");
//        string activity = GetArg(args, "--activity");
//        string userId = GetArg(args, "--user_id");
//        string name = GetArg(args, "--name");
//        string date = GetArg(args, "--date");
//        string time = GetArg(args, "--time");

//        MemoryStream ms = new MemoryStream();

//        // ESC/POS initialize
//        WriteBytes(ms, new byte[] { 0x1B, 0x40 });

//        //-------------------------------------------------
//        // PRINT EMBEDDED LOGO
//        //-------------------------------------------------
//        var assembly = Assembly.GetExecutingAssembly();
//        string resourceName = "reciept_printer.eduscan_logo_pos_58.png";

//        using Stream logoStream = assembly.GetManifestResourceStream(resourceName)!;
//        byte[] imgBytes = BitmapToRasterEscPos(logoStream);
//        WriteBytes(ms, imgBytes);



//        //-------------------------------------------------
//        // Text content
//        //-------------------------------------------------
//        WriteLine(ms, "");
//        WriteLine(ms, "Attendance Logging Information");
//        WriteLine(ms, "");
//        WriteLine(ms, "-------------------------------");
//        WriteLine(ms, " ");

//        // Centered activity title in BIG FONT
//        WriteBytes(ms, new byte[] { 0x1B, 0x61, 0x01 }); // Center
//        WriteBytes(ms, new byte[] { 0x1D, 0x21, 0x11 }); // Double height+width
//        WriteLine(ms, activity);
//        WriteBytes(ms, new byte[] { 0x1D, 0x21, 0x00 }); // Normal font
//        WriteBytes(ms, new byte[] { 0x1B, 0x61, 0x00 }); // Left align

//        WriteLine(ms, " ");
//        WriteLine(ms, "-------------------------------");
//        WriteLine(ms, "");

//        // Transaction Details
//        WriteLine(ms, $"Reference : {reference_id}");
//        WriteLine(ms, $"User ID   : {userId}");
//        WriteLine(ms, $"Name      : {name}");
//        WriteLine(ms, $"Date      : {date}");
//        WriteLine(ms, $"Time      : {time}");
//        WriteLine(ms, "");
//        WriteLine(ms, "");
//        WriteLine(ms, "Please keep this for references.");

//        // FEED AND CUT
//        WriteBytes(ms, new byte[] { 0x1B, 0x64, 0x05 }); // Feed
//        WriteBytes(ms, new byte[] { 0x1D, 0x56, 0x00 }); // Cut

//        byte[] finalData = ms.ToArray();

//        try
//        {
//            RawPrinter.PrintRaw(printerName, finalData);
//            Console.WriteLine("Printed successfully!");
//        }
//        catch (Exception ex)
//        {
//            Console.WriteLine("PRINT ERROR: " + ex.Message);
//        }
//    }

//    static string GetArg(string[] args, string key)
//    {
//        int idx = Array.IndexOf(args, key);
//        return (idx >= 0 && idx < args.Length - 1) ? args[idx + 1] : "";
//    }

//    static void WriteLine(Stream s, string text)
//    {
//        byte[] data = Encoding.ASCII.GetBytes(text + "\r\n");
//        s.Write(data, 0, data.Length);
//    }

//    static void WriteBytes(Stream s, byte[] data)
//    {
//        s.Write(data, 0, data.Length);
//    }

//    // Convert PNG Stream to ESC/POS Raster
//    static byte[] BitmapToRasterEscPos(Stream stream)
//    {
//        using Image<Rgba32> img = Image.Load<Rgba32>(stream);

//        int width = (img.Width + 7) / 8;
//        int height = img.Height;
//        byte[] bitmapData = new byte[width * height];

//        for (int y = 0; y < height; y++)
//        {
//            for (int x = 0; x < img.Width; x++)
//            {
//                Rgba32 pixel = img[x, y];
//                bool black = pixel.R < 128 && pixel.G < 128 && pixel.B < 128;

//                if (black)
//                    bitmapData[y * width + (x / 8)] |= (byte)(0x80 >> (x % 8));
//            }
//        }

//        using var ms = new MemoryStream();
//        byte[] header = new byte[]
//        {
//            0x1D, 0x76, 0x30, 0x00,
//            (byte)(width % 256),
//            (byte)(width / 256),
//            (byte)(height % 256),
//            (byte)(height / 256)
//        };
//        ms.Write(header, 0, header.Length);
//        ms.Write(bitmapData, 0, bitmapData.Length);

//        return ms.ToArray();
//    }
//}