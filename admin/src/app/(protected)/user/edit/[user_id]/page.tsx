"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: { user_id: string };
}

const EditUserPage = ({ params }: PageProps) => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/user");
  }, [router]);
  return null;
};

export default EditUserPage;
