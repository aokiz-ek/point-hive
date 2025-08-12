import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名，支持条件类名和重复类名去重
 * @param inputs - 要合并的类名
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 根据积分数量获取对应的状态类名
 * @param points - 积分数量
 * @returns 状态类名
 */
export function getPointsStatusClass(points: number): string {
  if (points >= 1000) return 'ak-points-abundant';
  if (points >= 200) return 'ak-points-normal';
  if (points >= 50) return 'ak-points-low';
  return 'ak-points-critical';
}

/**
 * 根据信用分数获取对应的等级类名
 * @param creditScore - 信用分数 (0-1000)
 * @returns 信用等级类名
 */
export function getCreditLevelClass(creditScore: number): string {
  if (creditScore >= 950) return 'ak-credit-diamond';
  if (creditScore >= 850) return 'ak-credit-gold';
  if (creditScore >= 750) return 'ak-credit-silver';
  if (creditScore >= 650) return 'ak-credit-bronze';
  if (creditScore >= 600) return 'ak-credit-newbie';
  return 'ak-credit-risk';
}

/**
 * 根据信用分数获取星级数量
 * @param creditScore - 信用分数 (0-1000)
 * @returns 星级数量 (1-5)
 */
export function getCreditStars(creditScore: number): number {
  if (creditScore >= 950) return 5; // 钻石
  if (creditScore >= 850) return 4; // 金牌
  if (creditScore >= 750) return 3; // 银牌
  if (creditScore >= 650) return 2; // 铜牌
  return 1; // 新手/风险
}