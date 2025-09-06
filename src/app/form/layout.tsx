import { redirect } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth";
import Image from "next/image";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }
  if (!user.user_metadata.email_verified) {
    await signOut();
    alert("EMAIL NOT VERIFIED: Verify it first.");
  }

  if (user.user_metadata.account_type !== "ADMIN") {
    await signOut();
    alert("ACCOUNT TYPE INVALID.");
    redirect("/auth");
  }

  return (
    <>
      <Image
        src={"/image/prmsu-foreground.png"}
        alt="PRMSU Logo"
        width={1281}
        height={669}
        className="absolute w-full h-full opacity-50 dark:opacity-20"
        style={{ objectFit: "cover" }}
      />
      <div className="absolute flex h-screen w-screen">
        <main className="flex flex-1 flex-col overflow-y-auto mb-24 md:mb-0 items-center">
          {children}
        </main>
      </div>
    </>
  );
}
