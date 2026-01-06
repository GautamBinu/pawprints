"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { useRouter } from "next/navigation";
import { checkAdminAccess } from "@/app/actions";
import { toast } from "sonner";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) {
        // Not logged in
        router.push("/login");
        return;
      }

      try {
        const hasAccess = await checkAdminAccess();
        if (hasAccess) {
          setIsAuthorized(true);
        } else {
          // Not authorized
          // toast.error(
          //   "Access denied. You must be an administrator to view this page.",
          // );
          // Let's not notify and all, just smoothly navigate back
          router.push("/");
        }
      } catch (error) {
        console.error("Error verifying admin access:", error);
        toast.error("Error verifying permissions.");
        router.push("/");
      }
    };

    verifyAccess();
  }, [user, router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
