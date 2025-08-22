import type { Group, User, Transaction, Notification } from '@/lib/types';

// 存储配置
interface StorageConfig {
  mode: 'localStorage' | 'database';
  autoCleanup: boolean;
  cleanupInterval: number; // 小时
}

// 存储元数据
interface StorageMetadata {
  timestamp: number;
  expiresAt: number;
}

// 带元数据的存储项
interface StorageItem<T> {
  data: T;
  metadata: StorageMetadata;
}

// 本地存储工具函数
export class LocalStorage {
  private static readonly CONFIG_KEY = 'point-hive-config';
  private static readonly CLEANUP_INTERVAL = 12; // 12小时

  // 获取存储配置
  static getConfig(): StorageConfig {
    const config = this.getItem<StorageConfig>(this.CONFIG_KEY);
    return config || {
      mode: 'localStorage',
      autoCleanup: true,
      cleanupInterval: this.CLEANUP_INTERVAL,
    };
  }

  // 设置存储配置
  static setConfig(config: Partial<StorageConfig>): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, ...config };
    this.setItem(this.CONFIG_KEY, newConfig);
  }

  // 检查是否启用localStorage模式
  static isLocalStorageMode(): boolean {
    return this.getConfig().mode === 'localStorage';
  }

  // 创建存储元数据
  private static createMetadata(): StorageMetadata {
    const now = Date.now();
    const config = this.getConfig();
    return {
      timestamp: now,
      expiresAt: now + (config.cleanupInterval * 60 * 60 * 1000), // 转换为毫秒
    };
  }

  // 检查数据是否过期
  private static isExpired(metadata: StorageMetadata): boolean {
    const config = this.getConfig();
    if (!config.autoCleanup) return false;
    return Date.now() > metadata.expiresAt;
  }

  // 清理过期数据
  static cleanupExpiredData(): void {
    if (typeof window === 'undefined') return;
    
    const config = this.getConfig();
    if (!config.autoCleanup || config.mode !== 'localStorage') return;

    const keys = [
      'point-hive-groups',
      'point-hive-transactions',
      'point-hive-user',
      'point-hive-notifications',
    ];

    keys.forEach(key => {
      const stored = this.getRawItem<StorageItem<any>>(key);
      if (stored && stored.metadata && this.isExpired(stored.metadata)) {
        localStorage.removeItem(key);
        console.log(`已清理过期数据: ${key}`);
      }
    });
  }

  // 获取原始存储项（不解包元数据）
  private static getRawItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting raw item from localStorage:`, error);
      return null;
    }
  }
  static getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    // 如果是配置键，直接获取不带元数据
    if (key === this.CONFIG_KEY) {
      return this.getRawItem<T>(key);
    }

    try {
      const stored = this.getRawItem<StorageItem<T>>(key);
      if (!stored) return null;

      // 如果没有元数据，说明是旧数据，直接返回
      if (!stored.metadata) {
        return stored as T;
      }

      // 检查是否过期
      if (this.isExpired(stored.metadata)) {
        localStorage.removeItem(key);
        console.log(`数据已过期并清理: ${key}`);
        return null;
      }

      return stored.data;
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error);
      return null;
    }
  }

  static setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      // 如果是配置键，直接存储不带元数据
      if (key === this.CONFIG_KEY) {
        localStorage.setItem(key, JSON.stringify(value));
        return;
      }

      const config = this.getConfig();
      
      // 如果不是localStorage模式，不存储到localStorage
      if (config.mode !== 'localStorage') {
        return;
      }

      // 创建带元数据的存储项
      const storageItem: StorageItem<T> = {
        data: value,
        metadata: this.createMetadata(),
      };

      localStorage.setItem(key, JSON.stringify(storageItem));
    } catch (error) {
      console.error(`Error setting item to localStorage:`, error);
    }
  }

  // 群组相关
  static getGroups(): Group[] {
    const groups = this.getItem<Group[]>('point-hive-groups') || [];
    // Ensure all groups have proper array defaults
    return groups.map(group => ({
      ...group,
      adminIds: group.adminIds || [],
      memberIds: group.memberIds || [],
      tags: group.tags || []
    }));
  }

  static setGroups(groups: Group[]): void {
    this.setItem('point-hive-groups', groups);
  }

  static addGroup(group: Group): void {
    const groups = this.getGroups();
    // Ensure all array properties have defaults
    const safeGroup = {
      ...group,
      adminIds: group.adminIds || [],
      memberIds: group.memberIds || [],
      tags: group.tags || []
    };
    groups.push(safeGroup);
    this.setGroups(groups);
  }

  static updateGroup(groupId: string, updates: Partial<Group>): void {
    const groups = this.getGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates } as Group;
      this.setGroups(groups);
    }
  }

  static deleteGroup(groupId: string): void {
    const groups = this.getGroups().filter(g => g.id !== groupId);
    this.setGroups(groups);
  }

  // 交易相关
  static getTransactions(): Transaction[] {
    return this.getItem<Transaction[]>('point-hive-transactions') || [];
  }

  static setTransactions(transactions: Transaction[]): void {
    this.setItem('point-hive-transactions', transactions);
  }

  static addTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    this.setTransactions(transactions);
  }

  static updateTransaction(transactionId: string, updates: Partial<Transaction>): void {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates } as Transaction;
      this.setTransactions(transactions);
    }
  }

  // 用户相关
  static getUser(): User | null {
    return this.getItem<User>('point-hive-user');
  }

  static setUser(user: User): void {
    this.setItem('point-hive-user', user);
  }

  // 通知相关
  static getNotifications(): Notification[] {
    return this.getItem<Notification[]>('point-hive-notifications') || [];
  }

  static setNotifications(notifications: Notification[]): void {
    this.setItem('point-hive-notifications', notifications);
  }

  static addNotification(notification: Notification): void {
    const notifications = this.getNotifications();
    notifications.unshift(notification); // 添加到开头
    this.setNotifications(notifications.slice(0, 100)); // 最多保留100条
  }

  static markNotificationRead(notificationId: string): void {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.setNotifications(notifications);
    }
  }

  // 清空数据
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('point-hive-groups');
    localStorage.removeItem('point-hive-transactions');
    localStorage.removeItem('point-hive-user');
    localStorage.removeItem('point-hive-notifications');
  }

  // 初始化存储系统
  static init(): void {
    if (typeof window === 'undefined') return;

    // 清理过期数据
    this.cleanupExpiredData();

    // 设置定期清理
    const config = this.getConfig();
    if (config.autoCleanup && config.mode === 'localStorage') {
      // 每小时检查一次过期数据
      setInterval(() => {
        this.cleanupExpiredData();
      }, 60 * 60 * 1000); // 1小时
    }
  }

  // 获取存储统计信息
  static getStorageStats(): {
    mode: string;
    autoCleanup: boolean;
    cleanupInterval: number;
    dataKeys: Array<{
      key: string;
      exists: boolean;
      expiresAt?: string;
      isExpired?: boolean;
    }>;
  } {
    const config = this.getConfig();
    const keys = [
      'point-hive-groups',
      'point-hive-transactions', 
      'point-hive-user',
      'point-hive-notifications',
    ];

    const dataKeys = keys.map(key => {
      const stored = this.getRawItem<StorageItem<any>>(key);
      const exists = !!stored;
      
      if (exists && stored?.metadata) {
        return {
          key,
          exists,
          expiresAt: new Date(stored.metadata.expiresAt).toLocaleString('zh-CN'),
          isExpired: this.isExpired(stored.metadata),
        };
      }
      
      return { key, exists };
    });

    return {
      mode: config.mode,
      autoCleanup: config.autoCleanup,
      cleanupInterval: config.cleanupInterval,
      dataKeys,
    };
  }

  // 手动触发清理
  static manualCleanup(): void {
    this.cleanupExpiredData();
  }

  // 重置过期时间
  static resetExpiration(key: string): void {
    const stored = this.getRawItem<StorageItem<any>>(key);
    if (stored && stored.metadata) {
      stored.metadata = this.createMetadata();
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(stored));
      }
    }
  }
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化日期
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN');
}

// 格式化时间
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('zh-CN');
}