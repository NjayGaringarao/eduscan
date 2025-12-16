"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CreateUserPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/user");
  }, [router]);
  return null;
};

export default CreateUserPage;
