// app/user/edit/[user_id]/page.tsx
import EditUser from "@/components/user/EditUser";
import { cn } from "@/utils/style";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { user_id: string };
}

const EditUserPage = async ({ params }: PageProps) => {
  const { user_id } = await params;

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        "h-full w-full max-w-7xl pt-4 md:p-6"
      )}
    >
      {/* Header */}
      <div className="flex flex-row gap-4 items-center">
        <Link
          className={cn(
            "rounded-lg",
            "hover:shadow-[0_0_4px_1px_var(--tw-shadow-color)] hover:shadow-primary/70 hover:scale-102 ",
            "transition-all transform duration-200",
            "text-base font-semibold",
            "flex flex-row gap-2 items-center justify-center"
          )}
          href="/user"
        >
          <ArrowLeft strokeWidth={3} className="text-primary h-10 w-10" />
        </Link>

        <p
          className={cn(
            "text-primary text-4xl font-bold text-shadow-background text-shadow-lg "
          )}
        >
          Edit User
        </p>
      </div>

      {/* Pass user_id into your form */}
      <div className="flex-1 overflow-hidden">
        <EditUser userId={user_id} />
      </div>
    </div>
  );
};

export default EditUserPage;
