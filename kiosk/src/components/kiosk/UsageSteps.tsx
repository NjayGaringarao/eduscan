import { Smile, X } from "lucide-react";
import { Logo } from "../Logo";
import { cn } from "@/utils/style";

const UsageSteps = () => (
  <>
    <div
      className={cn(
        "hidden lg:flex flex-col flex-1 gap-3",
        "w-full rounded-xl py-4 overflow-hidden",
        "bg-background ",
        "text-textBody text-sm md:text-base"
      )}
    >
      <h2 className="text-xl font-semibold text-primary px-4">Instruction</h2>
      <ol className="list-decimal list-inside space-y-4 flex flex-col flex-1 overflow-y-auto px-4">
        <li>
          Stand or sit in front of the camera. Make sure your face is well-lit,
          clearly visible, and centered.
        </li>
        <li>
          Wait for the camera to detect your face. When ready, a green box will
          appear around your face indicating you're at the correct distance.
          {/** Dummy Bounding Box */}
          <div className="mt-2 p-3 bg-muted rounded-lg shadow flex items-start gap-4 bg-textBody">
            <div className="w-24 h-24 relative overflow-hidden p-4">
              <div className="absolute inset-0 mt-3 border border-green-500" />
              <div
                className="absolute top-0 left-0 bg-green-600 text-white"
                style={{ fontSize: 8 }}
              >
                PRESS FOR OPTIONS
              </div>
            </div>
            <div className="flex-1 text-xs md:text-sm text-background">
              This green box means your face is clearly detected and at a good
              distance. Tap or click inside it to continue.
            </div>
          </div>
        </li>
        <li>Click or tap on the green box to capture your face.</li>
        <li>
          Wait for the system to verify your identity. If recognized, your
          profile will appear along with your current status.
          {/** Dummy User Modal */}
          <div className="mt-2 bg-background border border-border rounded-lg shadow p-1 flex flex-col gap-2 text-sm w-full max-w-lg">
            <div className="flex flex-row gap-1">
              <div className="h-32 w-20 border bg-primary flex flex-col items-center justify-center rounded">
                <Smile className="text-background h-12 w-12" />
              </div>
              <div className="flex flex-col flex-1">
                <div className="text-textBody/50 text-xs w-full justify-between items-center flex flex-row pt-1 pr-1">
                  <div className="flex flex-row">
                    <Logo className="w-4 h-4" />
                    EDUSCAN
                  </div>
                  <X className="text-primary w-3 h-3" />
                </div>

                <div className="flex flex-1 justify-center flex-col gap-1">
                  <p className="text-base font-semibold text-primary -mb-1">
                    Juan Dela Cruz
                  </p>
                  <div
                    className="flex flex-row text-textBody"
                    style={{ fontSize: 9 }}
                  >
                    <div className="bg-muted rounded text-primary flex flex-row">
                      <p className="bg-primary px-0.5 mr-1 rounded-0.5 text-background">
                        STUDENT
                      </p>
                      - CCIT - BSCS
                    </div>
                  </div>
                </div>

                <div className="bg-textBody/20 p-1 rounded flex justify-between items-center text-xs text-textBody">
                  <div>
                    <p className="font-medium" style={{ fontSize: 10 }}>
                      CURRENTLY TIMED OUT
                    </p>
                    <p style={{ fontSize: 8 }}>Since May 12, 2025 at 5:30PM</p>
                  </div>
                  <button
                    className="bg-primary text-background px-3 py-1 rounded font-semibold hover:opacity-90 transition"
                    style={{ fontSize: 9 }}
                  >
                    TIME IN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li>
          Tap <strong>TIME IN</strong> or <strong>TIME OUT</strong> to log your
          attendance.
        </li>
        <li>
          If you're not recognized, follow the suggestions on screen (e.g.
          remove accessories or adjust lighting), then try again.
        </li>
      </ol>
    </div>

    <div className="w-full p-4 rounded-lg block lg:hidden bg-background/50">
      <h2 className="text-xl font-semibold text-primary mb-2">
        ⚠️ Screen Too Small
      </h2>
      <p className="text-sm md:text-base text-textBody mb-2">
        The kiosk interface is optimized for larger window and not available in
        small window.
      </p>
      <ul className="list-disc list-inside text-sm text-textBody space-y-1">
        <li>Please maximize the window for the designed functionality.</li>
        <li>
          For best user experience, use a touchscreen monitor with 1080p
          resolution
        </li>
        <li>Kiosk access is disabled on small screens.</li>
      </ul>
    </div>
  </>
);

export default UsageSteps;
