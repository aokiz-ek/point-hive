'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PointsStatus {
  level: 'abundant' | 'normal' | 'low' | 'critical' | 'risk';
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

export const pointsStatuses: PointsStatus[] = [
  {
    level: 'abundant',
    name: '充足',
    icon: '🟢',
    color: 'ak-text-green-600',
    bgColor: 'ak-bg-green-50',
    description: '余额充足，可以安心使用'
  },
  {
    level: 'normal',
    name: '一般',
    icon: '🟡',
    color: 'ak-text-yellow-600',
    bgColor: 'ak-bg-yellow-50',
    description: '余额正常，建议适度使用'
  },
  {
    level: 'low',
    name: '紧张',
    icon: '🟠',
    color: 'ak-text-orange-600',
    bgColor: 'ak-bg-orange-50',
    description: '余额紧张，考虑申请转入'
  },
  {
    level: 'critical',
    name: '急需',
    icon: '🔴',
    color: 'ak-text-red-600',
    bgColor: 'ak-bg-red-50',
    description: '余额不足，急需补充积分'
  },
  {
    level: 'risk',
    name: '风险',
    icon: '⚠️',
    color: 'ak-text-red-600',
    bgColor: 'ak-bg-red-50',
    description: '存在逾期记录，需要注意'
  }
];

export function getPointsStatus(balance: number, hasOverdue = false): PointsStatus {
  if (hasOverdue) {
    return pointsStatuses.find(s => s.level === 'risk')!;
  }
  
  if (balance >= 1000) {
    return pointsStatuses.find(s => s.level === 'abundant')!;
  } else if (balance >= 200) {
    return pointsStatuses.find(s => s.level === 'normal')!;
  } else if (balance >= 50) {
    return pointsStatuses.find(s => s.level === 'low')!;
  } else {
    return pointsStatuses.find(s => s.level === 'critical')!;
  }
}

interface PointsDisplayProps {
  balance: number;
  hasOverdue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDescription?: boolean;
  animated?: boolean;
  className?: string;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({
  balance,
  hasOverdue = false,
  size = 'md',
  showIcon = true,
  showDescription = false,
  animated = false,
  className
}) => {
  const status = getPointsStatus(balance, hasOverdue);
  
  const sizeClasses = {
    sm: 'ak-text-sm',
    md: 'ak-text-base',
    lg: 'ak-text-xl ak-font-bold'
  };

  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('zh-CN').format(value);
  };

  return (
    <div className={cn('ak-inline-flex ak-items-center ak-space-x-2', className)}>
      {showIcon && (
        <span 
          className={cn(
            'ak-inline-flex ak-items-center ak-justify-center',
            animated && 'ak-animate-pulse'
          )}
        >
          {status.icon}
        </span>
      )}
      
      <div className="ak-flex ak-items-center ak-space-x-1">
        <span className={cn('ak-font-mono ak-font-semibold', status.color, sizeClasses[size])}>
          {formatBalance(balance)}
        </span>
        <span className={cn('ak-text-gray-600', sizeClasses[size])}>
          积分
        </span>
      </div>

      {showDescription && (
        <span className={cn('ak-text-xs', status.color)}>
          ({status.description})
        </span>
      )}
    </div>
  );
};

interface PointsCardProps {
  balance: number;
  hasOverdue?: boolean;
  label?: string;
  showTrend?: boolean;
  trendValue?: number;
  className?: string;
}

export const PointsCard: React.FC<PointsCardProps> = ({
  balance,
  hasOverdue = false,
  label = '当前余额',
  showTrend = false,
  trendValue = 0,
  className
}) => {
  const status = getPointsStatus(balance, hasOverdue);

  return (
    <div className={cn(
      'ak-rounded-lg ak-border ak-p-4 ak-transition-all ak-duration-200',
      status.bgColor,
      'hover:ak-shadow-md',
      className
    )}>
      <div className="ak-flex ak-items-center ak-justify-between ak-mb-2">
        <span className="ak-text-sm ak-text-gray-600">{label}</span>
        <div className="ak-flex ak-items-center ak-space-x-1">
          <span>{status.icon}</span>
          <span className={cn('ak-text-xs ak-font-medium', status.color)}>
            {status.name}
          </span>
        </div>
      </div>

      <div className="ak-flex ak-items-end ak-justify-between">
        <div>
          <div className="ak-text-2xl ak-font-bold ak-font-mono ak-text-gray-900">
            {new Intl.NumberFormat('zh-CN').format(balance)}
          </div>
          <div className="ak-text-xs ak-text-gray-500">积分</div>
        </div>

        {showTrend && trendValue !== 0 && (
          <div className={cn(
            'ak-flex ak-items-center ak-text-xs ak-font-medium',
            trendValue > 0 ? 'ak-text-green-600' : 'ak-text-red-600'
          )}>
            <span className="ak-mr-1">
              {trendValue > 0 ? '↗️' : '↘️'}
            </span>
            {trendValue > 0 ? '+' : ''}{trendValue}
          </div>
        )}
      </div>

      {status.level === 'critical' || status.level === 'risk' ? (
        <div className="ak-mt-3 ak-text-xs ak-text-gray-600">
          {status.description}
        </div>
      ) : null}
    </div>
  );
};

interface PointsProgressProps {
  current: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const PointsProgress: React.FC<PointsProgressProps> = ({
  current,
  max = 2000,
  label = '积分使用进度',
  showPercentage = true,
  className
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  const status = getPointsStatus(current);

  const getProgressColor = () => {
    if (percentage >= 80) return 'ak-bg-green-500';
    if (percentage >= 60) return 'ak-bg-yellow-500';
    if (percentage >= 30) return 'ak-bg-orange-500';
    return 'ak-bg-red-500';
  };

  return (
    <div className={cn('ak-space-y-2', className)}>
      <div className="ak-flex ak-items-center ak-justify-between ak-text-sm">
        <span className="ak-text-gray-700">{label}</span>
        {showPercentage && (
          <span className={cn('ak-font-medium', status.color)}>
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>
      
      <div className="ak-w-full ak-bg-gray-200 ak-rounded-full ak-h-2">
        <div
          className={cn(
            'ak-h-2 ak-rounded-full ak-transition-all ak-duration-300',
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="ak-flex ak-items-center ak-justify-between ak-text-xs ak-text-gray-500">
        <span>{new Intl.NumberFormat('zh-CN').format(current)}</span>
        <span>{new Intl.NumberFormat('zh-CN').format(max)}</span>
      </div>
    </div>
  );
};