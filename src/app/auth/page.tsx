import Image from "next/image";
import { SignUp } from "@/components/auth/SignUp";
import Loading from "@/components/Loading";
import { redirect } from "next/navigation";
import { getAdminStatus, getCurrentUser } from "@/lib/auth";
import { EmailUnverified, SignIn } from "@/components/auth";
import { Logo } from "@/components/Logo";

const Page = async () => {
  let isLoading = true;
  const user = await getCurrentUser();

  const { status, error } = await getAdminStatus();

  if (error && !status) {
    redirect(
      "/error?title=Server%20Error&subtitle=There%20was%20an%20error%20loading%20The%20page.%20if%20the%20issue%20persist,%20contact%20the%20developer,"
    );
  }

  if (user) {
    redirect("/home");
  }
  isLoading = false;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background overflow-y-auto">
      <Image
        src={"/image/prmsu-foreground.png"}
        alt="PRMSU Logo"
        width={1281}
        height={669}
        className="w-full h-full opacity-50 dark:opacity-20"
        style={{ objectFit: "cover" }}
      />
      <div className="absolute bg-background/30 dark:bg-background/50 backdrop-blur-md max-w-[53rem] w-full mx-8 md:mx-0 rounded-xl p-8">
        <div className="flex flex-row justify-center items-center p-6 gap-4 md:gap-0">
          <Logo className="w-28 md:w-80" />
          <h1 className="text-primary text-4xl md:text-8xl font-bold mb-2 -ml-2">
            EDUSCAN
          </h1>
        </div>
        <div className="flex flex-row w-full items-center gap-8">
          <div className="flex flex-col gap-4 min-w-[11rem] flex-1">
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

          {!status?.isInitialized ? (
            <div className="flex-col max-w-48 max-h-[30vh] flex-1 hidden md:block items-center">
              <div className="flex flex-col gap-2 shrink items-center">
                <Image
                  src={"/image/prmsu.png"}
                  alt="PRMSU Logo"
                  width={128}
                  height={128}
                  className="object-contain w-26"
                />
                <Image
                  src={"/image/ccit.png"}
                  alt="PRMSU Logo"
                  width={128}
                  height={128}
                  className="object-contain w-28"
                />
              </div>
              <div className="flex-1">
                <p className=" text-xs text-textBody mt-2">
                  EDUSCAN IS SMART FACIAL RECOGNITION FOR STUDENT AND EMPLOYEE
                  TRACKING SYSTEM OF PRMSU CASTILLEJOS CAMPUS
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-col max-w-72 max-h-52 flex-1 hidden md:block">
              <div className="flex flex-row gap-4">
                <Image
                  src={"/image/prmsu.png"}
                  alt="PRMSU Logo"
                  width={512}
                  height={512}
                  className="w-28 contain-content"
                />
                <Image
                  src={"/image/ccit.png"}
                  alt="PRMSU Logo"
                  width={512}
                  height={512}
                  className="w-28 contain-content"
                />
              </div>
              <p className="text-xs text-textBody mt-2">
                EDUSCAN IS SMART FACIAL RECOGNITION FOR STUDENT AND EMPLOYEE
                TRACKING SYSTEM OF PRMSU CASTILLEJOS CAMPUS
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
