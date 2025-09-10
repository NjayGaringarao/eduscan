"use client";

import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/Button";

function EmailChangedContent() {
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();
  const searchParams = useSearchParams();

  const confirmedEmail = searchParams.get("confirmed_email");

  useEffect(() => {
    if (countdown <= 0) {
      router.replace("/security");
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background">
      <Image
        src={"/image/prmsu-foreground.png"}
        alt="PRMSU Logo"
        width={1281}
        height={669}
        className="w-full h-full opacity-50 dark:opacity-20"
        style={{ objectFit: "cover" }}
      />
      <div className="absolute bg-background/30 dark:bg-background/50 backdrop-blur-md max-w-[40rem] w-full mx-8 md:mx-0 rounded-xl p-8 flex flex-col gap-4 items-center text-center">
        <CheckCircle2 className="text-success w-16 h-16 mb-2" />
        <h2 className="text-primary text-3xl font-bold mb-2">
          Email Confirmed Successfully
        </h2>

        <p className="text-textBody">
          The confirmation sent to{" "}
          <span className="font-semibold">{confirmedEmail}</span> was received.
          To finalize the change, please also confirm the request sent to your{" "}
          <span className="font-semibold">other email address</span>.
        </p>

        <p className="text-sm text-textBody mt-4">
          Redirecting to <span className="font-semibold">Security</span> in{" "}
          <span className="font-bold">{countdown}</span> seconds...
        </p>

        <Button
          title="Go to Security Now"
          onClick={() => router.replace("/security")}
        />
      </div>
    </div>
  );
}

export default function EmailChangedPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <EmailChangedContent />
    </Suspense>
  );
}
