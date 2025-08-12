'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthMutations } from '@/lib/hooks';
import type { RegisterFormData } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const { registerMutation } = useAuthMutations();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基础验证
    const newErrors: Record<string, string> = {};
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (formData.password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await registerMutation.mutateAsync(registerData);
      router.push('/hall');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // 清除相应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <Card className="ak-p-6">
      <div className="ak-mb-6">
        <h2 className="ak-text-2xl ak-font-bold ak-text-center ak-text-gray-900">
          创建账户
        </h2>
        <p className="ak-text-center ak-text-gray-600 ak-mt-2">
          加入Point-Hive，开始管理您的积分
        </p>
      </div>

      <form onSubmit={handleSubmit} className="ak-space-y-4">
        <div>
          <label htmlFor="email" className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-1">
            邮箱地址 *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="请输入邮箱地址"
            disabled={registerMutation.isPending}
          />
          {errors.email && (
            <p className="ak-text-red-600 ak-text-sm ak-mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="nickname" className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-1">
            昵称 *
          </label>
          <Input
            id="nickname"
            name="nickname"
            type="text"
            required
            value={formData.nickname}
            onChange={handleChange}
            placeholder="请输入昵称"
            disabled={registerMutation.isPending}
          />
          {errors.nickname && (
            <p className="ak-text-red-600 ak-text-sm ak-mt-1">{errors.nickname}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-1">
            手机号码
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="请输入手机号码（可选）"
            disabled={registerMutation.isPending}
          />
        </div>

        <div>
          <label htmlFor="password" className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-1">
            密码 *
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="请输入密码（至少6位）"
            disabled={registerMutation.isPending}
          />
          {errors.password && (
            <p className="ak-text-red-600 ak-text-sm ak-mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-1">
            确认密码 *
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="请再次输入密码"
            disabled={registerMutation.isPending}
          />
          {errors.confirmPassword && (
            <p className="ak-text-red-600 ak-text-sm ak-mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {registerMutation.error && (
          <div className="ak-text-red-600 ak-text-sm ak-text-center">
            {(registerMutation.error as Error).message}
          </div>
        )}

        <Button
          type="submit"
          className="ak-w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? '注册中...' : '注册账户'}
        </Button>
      </form>

      <div className="ak-mt-6 ak-text-center">
        <p className="ak-text-sm ak-text-gray-600">
          已有账户？{' '}
          <Link 
            href="/login" 
            className="ak-text-blue-600 hover:ak-text-blue-500 ak-font-medium"
          >
            立即登录
          </Link>
        </p>
      </div>
    </Card>
  );
}