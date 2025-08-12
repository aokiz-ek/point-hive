'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="ak-min-h-screen ak-flex ak-items-center ak-justify-center ak-bg-slate-50">
        <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="ak-min-h-screen ak-bg-gradient-to-br ak-from-blue-50 ak-to-indigo-100 ak-flex ak-items-center ak-justify-center ak-p-4">
      <div className="ak-w-full ak-max-w-md">
        <div className="ak-text-center ak-mb-8">
          <h1 className="ak-text-3xl ak-font-bold ak-text-gray-900 ak-mb-2">
            Point-Hive
          </h1>
          <p className="ak-text-gray-600">积分蜂巢 - 智能积分管理平台</p>
        </div>
        {children}
      </div>
    </div>
  );
}