import type { Group, User, Transaction, Notification } from '@/lib/types';

// 本地存储工具函数
export class LocalStorage {
  static getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error);
      return null;
    }
  }

  static setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
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
      groups[index] = { ...groups[index], ...updates };
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
      transactions[index] = { ...transactions[index], ...updates };
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
    this.setGroups(notifications.slice(0, 100)); // 最多保留100条
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