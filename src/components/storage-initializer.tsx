'use client';

import { useEffect } from 'react';
import { LocalStorage } from '@/lib/utils/local-storage';

export function StorageInitializer() {
  useEffect(() => {
    // 初始化localStorage系统
    LocalStorage.init();
  }, []);

  return null; // 这个组件不渲染任何内容
}