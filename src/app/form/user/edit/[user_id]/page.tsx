import PageHeader from "@/components/PageHeader";
import EditUser from "@/components/user/EditUser";
import { cn } from "@/utils/style";

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
      <PageHeader title="Edit User" allowBack />

      {/* Pass user_id into your form */}
      <div className="flex-1 overflow-hidden">
        <EditUser userId={user_id} />
      </div>
    </div>
  );
};

export default EditUserPage;
