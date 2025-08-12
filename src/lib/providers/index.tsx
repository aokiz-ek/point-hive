'use client';

import * as React from 'react';
import { ReactQueryProvider } from './react-query-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      {children}
    </ReactQueryProvider>
  );
}

// 导出其他providers
export { ReactQueryProvider } from './react-query-provider';