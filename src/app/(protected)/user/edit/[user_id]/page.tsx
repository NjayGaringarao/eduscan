import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import PageHeader from "@/components/PageHeader";
import EditUser from "@/components/user/EditUser";
import { cn } from "@/utils/style";

interface PageProps {
  params: { user_id: string };
}

const EditUserPage = async ({ params }: PageProps) => {
  const { user_id } = await params;

  return (
    <PageBox className={cn("flex flex-col gap-6 h-full overflow-hidden")}>
      <PageHeader title="Edit User" allowBack isSticky={false} />

      {/* Pass user_id into your form */}
      <Backdrop containerClassName="overflow-y-auto">
        <EditUser userId={user_id} />
      </Backdrop>
    </PageBox>
  );
};

export default EditUserPage;
