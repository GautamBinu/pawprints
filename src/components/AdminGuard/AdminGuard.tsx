'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/config/admin-config';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Component to protect admin-only pages
 * Checks custom claims and email whitelist from admin-config.ts
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      // Not logged in
      router.push('/login');
      return;
    }

    // Check if user is admin using the centralized config
    if (isAdmin(user)) {
      setIsAuthorized(true);
    } else {
      // Not authorized
      alert('Access denied. You must be an administrator to view this page.');
      router.push('/');
    }
    
    setIsChecking(false);
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
