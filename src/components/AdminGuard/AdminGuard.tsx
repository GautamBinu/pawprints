'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { checkAdminAccess } from '@/app/actions';
import { toast } from "sonner";

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Component to protect admin-only pages
 * Checks database permissions via server action
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) {
        // Not logged in
        router.push('/login');
        return;
      }

      try {
        const hasAccess = await checkAdminAccess();
        if (hasAccess) {
          setIsAuthorized(true);
        } else {
          // Not authorized
          toast.error('Access denied. You must be an administrator to view this page.');
          router.push('/');
        }
      } catch (error) {
        console.error('Error verifying admin access:', error);
        toast.error('Error verifying permissions.');
        router.push('/');
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [user, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
