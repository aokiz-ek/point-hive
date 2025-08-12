'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveLayout } from '@/components/layout';
import { useAuth } from '@/lib/hooks';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="ak-min-h-screen ak-flex ak-items-center ak-justify-center ak-bg-slate-50">
        <div className="ak-text-center">
          <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600 ak-mx-auto"></div>
          <p className="ak-mt-4 ak-text-slate-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <ResponsiveLayout>{children}</ResponsiveLayout>;
}