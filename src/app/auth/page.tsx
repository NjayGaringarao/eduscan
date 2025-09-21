import Image from "next/image";
import Loading from "@/components/Loading";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStatus } from "@/lib/auth";
import { EmailUnverified, SignIn, SignUp } from "@/components/auth";
import { Logo } from "@/components/Logo";
import { cn } from "@/utils/style";
import Link from "next/link";

const Page = async () => {
  let isLoading = true;
  const user = await getCurrentUser();

  const { status, error } = await getStatus();

  if (error && !status) {
    console.warn(error);
    redirect(
      "/error?title=Server%20Error&subtitle=There%20was%20an%20error%20loading%20The%20page.%20if%20the%20issue%20persist,%20contact%20the%20developer,"
    );
  }

  if (user) {
    redirect("/dashboard");
  }
  isLoading = false;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background overflow-y-auto">
      <Image
        src={"/image/prmsu-foreground.png"}
        alt="PRMSU Logo"
        width={1281}
        height={669}
        className="w-full h-full opacity-70 dark:opacity-20"
        style={{ objectFit: "cover" }}
      />
      <div
        className={cn(
          "absolute w-full mx-8 md:mx-0 rounded-xl p-8 max-w-[53rem]",
          "bg-background/60 dark:bg-background/50 backdrop-blur-md",
          "flex flex-col gap-8"
        )}
      >
        <Link
          className={cn(
            "bg-background/50 rounded-md p-6",
            "flex flex-row justify-center items-center gap-4 md:gap-0"
          )}
          href={"/"}
        >
          <Logo className="w-28 md:w-52" />
          <h1 className="text-primary text-5xl md:text-7xl font-bold mb-2 -ml-2">
            EDUSCAN
          </h1>
        </Link>
        <div
          className={cn(
            "min-w-[11rem] h-auto w-full",
            "flex flex-col gap-4"
            // "border-t-2 pt-4 border-primary/50"
          )}
        >
          {isLoading ? (
            <Loading />
          ) : status?.isInitialized ? (
            status.isVerified ? (
              <SignIn />
            ) : (
              <EmailUnverified />
            )
          ) : (
            <SignUp />
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
