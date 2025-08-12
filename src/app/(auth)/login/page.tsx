'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthMutations } from '@/lib/hooks';

export default function LoginPage() {
  const router = useRouter();
  const { loginMutation } = useAuthMutations();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await loginMutation.mutateAsync(formData);
      router.push('/hall');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className="ak-p-6">
      <div className="ak-mb-6">
        <h2 className="ak-text-2xl ak-font-bold ak-text-center ak-text-gray-900">
          登录账户
        </h2>
        <p className="ak-text-center ak-text-gray-600 ak-mt-2">
          使用邮箱和密码登录您的账户
        </p>
      </div>

      <form onSubmit={handleSubmit} className="ak-space-y-4">
        <div>
          <label htmlFor="email" className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-1">
            邮箱地址
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="请输入邮箱地址"
            disabled={loginMutation.isPending}
          />
        </div>

        <div>
          <label htmlFor="password" className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-1">
            密码
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="请输入密码"
            disabled={loginMutation.isPending}
          />
        </div>

        {loginMutation.error && (
          <div className="ak-text-red-600 ak-text-sm ak-text-center">
            {(loginMutation.error as Error).message}
          </div>
        )}

        <Button
          type="submit"
          className="ak-w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? '登录中...' : '登录'}
        </Button>
      </form>

      <div className="ak-mt-6 ak-text-center">
        <p className="ak-text-sm ak-text-gray-600">
          还没有账户？{' '}
          <Link 
            href="/register" 
            className="ak-text-blue-600 hover:ak-text-blue-500 ak-font-medium"
          >
            立即注册
          </Link>
        </p>
      </div>
    </Card>
  );
}