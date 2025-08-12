'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CreditLevel {
  name: string;
  stars: string;
  score: number;
  color: string;
  requirements: string;
}

export const creditLevels: CreditLevel[] = [
  {
    name: '钻石信用',
    stars: '🌟🌟🌟🌟🌟',
    score: 950,
    color: 'ak-text-purple-600 ak-bg-purple-50',
    requirements: '按时归还率100%, 历史>50次'
  },
  {
    name: '金牌信用',
    stars: '🌟🌟🌟🌟',
    score: 850,
    color: 'ak-text-yellow-600 ak-bg-yellow-50',
    requirements: '按时归还率95%+, 历史>20次'
  },
  {
    name: '银牌信用',
    stars: '🌟🌟🌟',
    score: 750,
    color: 'ak-text-gray-600 ak-bg-gray-50',
    requirements: '按时归还率90%+, 历史>10次'
  },
  {
    name: '铜牌信用',
    stars: '🌟🌟',
    score: 650,
    color: 'ak-text-orange-600 ak-bg-orange-50',
    requirements: '按时归还率80%+, 历史>5次'
  },
  {
    name: '新手信用',
    stars: '🌟',
    score: 600,
    color: 'ak-text-blue-600 ak-bg-blue-50',
    requirements: '历史<5次'
  },
  {
    name: '风险用户',
    stars: '⚠️',
    score: 0,
    color: 'ak-text-red-600 ak-bg-red-50',
    requirements: '逾期率>20%'
  }
];

export function getCreditLevel(score: number): CreditLevel {
  for (let i = 0; i < creditLevels.length - 1; i++) {
    const level = creditLevels[i];
    if (level && score >= level.score) {
      return level;
    }
  }
  // 确保返回最后一个等级（风险用户）
  const lastLevel = creditLevels[creditLevels.length - 1];
  if (lastLevel) {
    return lastLevel;
  }
  // 如果数组为空，返回默认的风险用户等级
  return {
    name: '风险用户',
    stars: '⚠️',
    score: 0,
    color: 'ak-text-red-600 ak-bg-red-50',
    requirements: '逾期率>20%'
  };
}

interface CreditScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export const CreditScore: React.FC<CreditScoreProps> = ({
  score,
  size = 'md',
  showDetails = false,
  className
}) => {
  const creditLevel = getCreditLevel(score);
  
  const sizeClasses = {
    sm: 'ak-text-sm',
    md: 'ak-text-base',
    lg: 'ak-text-lg'
  };

  if (showDetails) {
    return (
      <div className={cn('ak-space-y-3', className)}>
        {/* 信用等级显示 */}
        <div className="ak-text-center">
          <div className="ak-text-4xl ak-mb-2">{creditLevel.stars}</div>
          <div className={cn('ak-font-semibold', sizeClasses[size])}>
            {creditLevel.name} ({score}分)
          </div>
          <div className="ak-w-full ak-bg-gray-200 ak-rounded-full ak-h-2 ak-mt-2">
            <div 
              className="ak-bg-blue-600 ak-h-2 ak-rounded-full ak-transition-all ak-duration-300"
              style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }}
            />
          </div>
          <div className="ak-text-sm ak-text-gray-600 ak-mt-1">
            {score}/1000
          </div>
        </div>

        {/* 下一等级提示 */}
        {score < 1000 && (
          <div className="ak-text-center ak-text-sm ak-text-gray-600">
            {(() => {
              const nextLevel = creditLevels.find(level => level.score > score);
              if (nextLevel) {
                const diff = nextLevel.score - score;
                return `距离${nextLevel.name}还差${diff}分`;
              }
              return null;
            })()}
          </div>
        )}

        {/* 评分构成 */}
        <div className="ak-space-y-2">
          <div className="ak-text-sm ak-font-medium ak-text-gray-900">信用构成:</div>
          {[
            { name: '按时归还率', value: 94, weight: 50 },
            { name: '交易活跃度', value: 85, weight: 20 },
            { name: '群组贡献度', value: 91, weight: 20 },
            { name: '用户评价', value: 88, weight: 10 }
          ].map((factor, index) => (
            <div key={index} className="ak-flex ak-items-center ak-justify-between ak-text-sm">
              <span className="ak-text-gray-700">• {factor.name} {factor.value}%</span>
              <div className="ak-flex ak-items-center ak-space-x-2">
                <div className="ak-w-16 ak-bg-gray-200 ak-rounded-full ak-h-1.5">
                  <div 
                    className="ak-bg-blue-600 ak-h-1.5 ak-rounded-full"
                    style={{ width: `${factor.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 等级权益 */}
        <div className="ak-space-y-2">
          <div className="ak-text-sm ak-font-medium ak-text-gray-900">等级权益:</div>
          <div className="ak-text-sm ak-space-y-1">
            {score >= 850 && (
              <>
                <div className="ak-text-green-600">✅ 高额转移权限 (无限制)</div>
                <div className="ak-text-green-600">✅ 智能推荐加权</div>
                <div className="ak-text-green-600">✅ 优先展示位置</div>
              </>
            )}
            {score >= 750 && score < 850 && (
              <>
                <div className="ak-text-green-600">✅ 正常转移权限</div>
                <div className="ak-text-green-600">✅ 标准推荐权重</div>
              </>
            )}
            {score < 600 && (
              <div className="ak-text-red-600">❌ 禁止新转入申请</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 简化显示
  return (
    <div className={cn('ak-inline-flex ak-items-center ak-space-x-1', className)}>
      <span className="ak-text-base">{creditLevel.stars}</span>
      <span className={cn('ak-font-medium', sizeClasses[size])}>
        {creditLevel.name}
      </span>
      {size !== 'sm' && (
        <span className="ak-text-sm ak-text-gray-600">({score})</span>
      )}
    </div>
  );
};

interface CreditBadgeProps {
  score: number;
  className?: string;
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({ score, className }) => {
  const creditLevel = getCreditLevel(score);
  
  return (
    <span className={cn(
      'ak-inline-flex ak-items-center ak-px-2 ak-py-1 ak-rounded-full ak-text-xs ak-font-medium',
      creditLevel.color,
      className
    )}>
      <span className="ak-mr-1">{creditLevel.stars}</span>
      {creditLevel.name}
    </span>
  );
};