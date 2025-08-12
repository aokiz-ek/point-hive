import { z } from 'zod';

// 基础验证规则
const phoneRegex = /^1[3-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * 用户注册验证模式
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .regex(emailRegex, '请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(passwordRegex, '密码必须包含字母和数字'),
  confirmPassword: z.string().min(1, '请确认密码'),
  nickname: z
    .string()
    .min(2, '昵称至少2个字符')
    .max(20, '昵称最多20个字符'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), '请输入有效的手机号'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

/**
 * 用户登录验证模式
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .regex(emailRegex, '请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
  rememberMe: z.boolean().optional(),
});

/**
 * 创建群组验证模式
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, '请输入群组名称')
    .max(50, '群组名称最多50个字符'),
  description: z
    .string()
    .max(200, '群组描述最多200个字符')
    .optional(),
  maxMembers: z
    .number()
    .min(2, '群组至少需要2个成员')
    .max(100, '群组最多100个成员'),
  initialPoints: z
    .number()
    .min(0, '初始积分不能为负数')
    .max(100000, '初始积分不能超过10万'),
  rules: z.object({
    maxTransferAmount: z
      .number()
      .min(1, '单次转移上限至少为1')
      .max(50000, '单次转移上限不能超过5万'),
    defaultReturnPeriod: z
      .number()
      .min(1, '归还期限至少1天')
      .max(30, '归还期限最多30天'),
    creditScoreThreshold: z
      .number()
      .min(0, '信用门槛最低为0')
      .max(1000, '信用门槛最高为1000'),
    allowAnonymousTransfer: z.boolean(),
    requireApproval: z.boolean(),
    autoReminderEnabled: z.boolean(),
  }),
});

/**
 * 加入群组验证模式
 */
export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .min(6, '邀请码为6位数字')
    .max(6, '邀请码为6位数字')
    .regex(/^\d{6}$/, '邀请码只能包含数字'),
});

/**
 * 积分转移验证模式
 */
export const transferSchema = z.object({
  toUserId: z.string().uuid('无效的用户ID'),
  amount: z
    .number()
    .min(1, '转移金额至少为1')
    .max(50000, '转移金额不能超过5万'),
  description: z
    .string()
    .max(100, '转移说明最多100个字符')
    .optional(),
  dueDate: z.date().optional(),
  groupId: z.string().uuid('无效的群组ID'),
});

/**
 * 积分归还验证模式
 */
export const returnSchema = z.object({
  transactionId: z.string().uuid('无效的交易ID'),
  amount: z
    .number()
    .min(1, '归还金额至少为1')
    .optional(), // 可选，支持部分归还
  description: z
    .string()
    .max(100, '归还说明最多100个字符')
    .optional(),
});

/**
 * 用户个人信息更新验证模式
 */
export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, '昵称至少2个字符')
    .max(20, '昵称最多20个字符'),
  avatar: z.string().url('请输入有效的头像URL').optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), '请输入有效的手机号'),
  bio: z
    .string()
    .max(200, '个人简介最多200个字符')
    .optional(),
});

/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否有效
 */
export function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

/**
 * 验证手机号格式
 * @param phone - 手机号
 * @returns 是否有效
 */
export function validatePhone(phone: string): boolean {
  return phoneRegex.test(phone);
}

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 强度等级 (weak | medium | strong)
 */
export function validatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';
  
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  
  const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (score >= 3) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
}

/**
 * 验证邀请码格式
 * @param code - 邀请码
 * @returns 是否有效
 */
export function validateInviteCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * 验证群组ID格式
 * @param groupId - 群组ID
 * @returns 是否有效
 */
export function validateGroupId(groupId: string): boolean {
  return /^[A-Z0-9]{8}$/.test(groupId);
}

/**
 * 验证积分数量
 * @param points - 积分数量
 * @param max - 最大值
 * @returns 验证结果
 */
export function validatePoints(points: number, max: number = 50000): { 
  valid: boolean; 
  error?: string; 
} {
  if (points < 0) {
    return { valid: false, error: '积分不能为负数' };
  }
  
  if (points > max) {
    return { valid: false, error: `积分不能超过${max}` };
  }
  
  if (!Number.isInteger(points)) {
    return { valid: false, error: '积分必须为整数' };
  }
  
  return { valid: true };
}

/**
 * 验证用户权限
 * @param userRole - 用户角色
 * @param requiredRole - 需要的角色
 * @returns 是否有权限
 */
export function validatePermission(
  userRole: 'owner' | 'admin' | 'member' | 'guest',
  requiredRole: 'owner' | 'admin' | 'member' | 'guest'
): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    guest: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// 导出验证模式类型
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
export type JoinGroupFormData = z.infer<typeof joinGroupSchema>;
export type TransferFormData = z.infer<typeof transferSchema>;
export type ReturnFormData = z.infer<typeof returnSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;