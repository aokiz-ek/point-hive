import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化积分数量，添加千分位分隔符
 * @param points - 积分数量
 * @returns 格式化后的积分字符串
 */
export function formatPoints(points: number): string {
  return new Intl.NumberFormat('zh-CN').format(points);
}

/**
 * 格式化积分数量为简短形式 (1.2K, 1.5M)
 * @param points - 积分数量
 * @returns 简短格式的积分字符串
 */
export function formatPointsShort(points: number): string {
  const formatter = new Intl.NumberFormat('zh-CN', {
    notation: 'compact',
    compactDisplay: 'short',
  });
  return formatter.format(points);
}

/**
 * 格式化百分比
 * @param value - 数值 (0-1)
 * @param decimals - 小数位数
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化时间为相对时间 (2分钟前, 3小时前)
 * @param date - 日期
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(targetDate, { 
    addSuffix: true, 
    locale: zhCN 
  });
}

/**
 * 格式化日期为友好格式
 * @param date - 日期
 * @returns 格式化后的日期字符串
 */
export function formatFriendlyDate(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(targetDate)) {
    return `今天 ${format(targetDate, 'HH:mm')}`;
  }
  
  if (isYesterday(targetDate)) {
    return `昨天 ${format(targetDate, 'HH:mm')}`;
  }
  
  return format(targetDate, 'MM月dd日 HH:mm', { locale: zhCN });
}

/**
 * 格式化完整日期时间
 * @param date - 日期
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return format(targetDate, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN });
}

/**
 * 格式化信用分数
 * @param score - 信用分数 (0-1000)
 * @returns 格式化后的信用分数字符串
 */
export function formatCreditScore(score: number): string {
  return score.toFixed(0);
}

/**
 * 获取信用等级文字描述
 * @param creditScore - 信用分数 (0-1000)
 * @returns 信用等级文字
 */
export function getCreditLevelText(creditScore: number): string {
  if (creditScore >= 950) return '钻石信用';
  if (creditScore >= 850) return '金牌信用';
  if (creditScore >= 750) return '银牌信用';
  if (creditScore >= 650) return '铜牌信用';
  if (creditScore >= 600) return '新手信用';
  return '风险用户';
}

/**
 * 获取积分状态文字描述
 * @param points - 积分数量
 * @returns 状态文字
 */
export function getPointsStatusText(points: number): string {
  if (points >= 1000) return '充足';
  if (points >= 200) return '一般';
  if (points >= 50) return '紧张';
  return '急需';
}

/**
 * 格式化交易类型
 * @param type - 交易类型
 * @returns 格式化后的交易类型文字
 */
export function formatTransactionType(type: 'transfer_out' | 'transfer_in' | 'return_out' | 'return_in'): string {
  const typeMap = {
    transfer_out: '转出',
    transfer_in: '转入',
    return_out: '归还给他人',
    return_in: '收到归还',
  };
  return typeMap[type] || type;
}

/**
 * 格式化交易状态
 * @param status - 交易状态
 * @returns 格式化后的状态文字
 */
export function formatTransactionStatus(
  status: 'pending' | 'completed' | 'rejected' | 'expired'
): string {
  const statusMap = {
    pending: '处理中',
    completed: '已完成',
    rejected: '已拒绝',
    expired: '已过期',
  };
  return statusMap[status] || status;
}

/**
 * 生成随机的邀请码 (6位数字)
 * @returns 6位数字邀请码
 */
export function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 生成随机的群组ID (8位字母数字)
 * @returns 8位字母数字群组ID
 */
export function generateGroupId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}