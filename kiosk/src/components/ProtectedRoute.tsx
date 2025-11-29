import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: string;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isLoading, setPage } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setPage("auth");
      } else if (
        allowedRole &&
        user.user_metadata.account_type !== allowedRole
      ) {
        setPage("auth");
        alert("Unauthorized: invalid account type.");
      }
    }
  }, [user, isLoading, allowedRole, setPage]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // render nothing while redirecting to auth
  }

  if (allowedRole && user.user_metadata.account_type !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
