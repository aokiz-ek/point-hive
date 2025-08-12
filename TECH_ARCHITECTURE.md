# Point-Hive 技术架构方案

## 1. 整体技术栈方案

### 方案A：轻量版 (本地优先)
```
前端框架：Next.js 14 + TypeScript
样式方案：Tailwind CSS (前缀: ak-)
状态管理：Zustand + React Query
数据存储：IndexedDB + LocalStorage
实时通信：WebSocket (可选)
部署方式：静态部署 (Vercel/Netlify)
```
**适用场景**：快速原型、小团队使用、离线优先
**优势**：开发快速、部署简单、成本低
**劣势**：数据同步限制、扩展性有限

### 方案B：标准版 (混合架构)
```
前端框架：Next.js 14 + TypeScript
样式方案：Tailwind CSS (前缀: ak-)
状态管理：Zustand + React Query
数据存储：Supabase + IndexedDB (离线缓存)
实时通信：Supabase Realtime
身份验证：Supabase Auth
部署方式：Vercel + Supabase
```
**适用场景**：中小型团队、快速上线、成本控制
**优势**：开发效率高、实时同步、扩展性好
**劣势**：依赖第三方服务、定制化限制

### 方案C：企业版 (全栈架构)
```
前端框架：Next.js 14 + TypeScript
样式方案：Tailwind CSS (前缀: ak-)
状态管理：Zustand + React Query
后端API：Next.js API Routes + tRPC
数据存储：PostgreSQL + Redis
实时通信：Socket.io + Redis Adapter
身份验证：NextAuth.js
部署方式：Docker + Kubernetes/Railway
```
**适用场景**：大型企业、高并发、完全可控
**优势**：完全可控、高性能、高扩展性
**劣势**：开发复杂度高、运维成本高

## 2. 数据存储方案对比

### 方案对比表

| 特性 | IndexedDB | Supabase | PostgreSQL |
|------|-----------|----------|------------|
| **开发复杂度** | 低 | 中 | 高 |
| **实时同步** | ❌ | ✅ | ✅ |
| **多设备同步** | ❌ | ✅ | ✅ |
| **离线支持** | ✅ | 部分 | ❌ |
| **数据一致性** | 本地一致 | 最终一致 | 强一致 |
| **扩展性** | 有限 | 好 | 优秀 |
| **成本** | 免费 | 低-中 | 中-高 |
| **运维复杂度** | 无 | 低 | 高 |

### 推荐的混合存储策略

```typescript
// 数据分层存储策略
interface StorageStrategy {
  // 本地存储 (IndexedDB)
  local: {
    userPreferences: UserPreferences;
    offlineCache: CachedData;
    draftData: DraftTransactions;
  };
  
  // 云端存储 (Supabase/PostgreSQL)
  cloud: {
    userData: User;
    groupData: Group;
    transactions: Transaction[];
    creditHistory: CreditRecord[];
  };
  
  // 实时数据 (Memory + WebSocket)
  realtime: {
    activeUsers: OnlineUser[];
    pendingRequests: PendingRequest[];
    notifications: Notification[];
  };
}
```

## 3. 项目结构设计

```
point-hive/
├── 📁 src/
│   ├── 📁 app/                    # Next.js 13+ App Router
│   │   ├── 📁 (auth)/            # 认证相关页面组
│   │   │   ├── 📄 login/page.tsx
│   │   │   └── 📄 register/page.tsx
│   │   ├── 📁 (dashboard)/       # 主应用页面组
│   │   │   ├── 📄 page.tsx       # 积分大厅
│   │   │   ├── 📁 group/
│   │   │   │   ├── 📄 [id]/page.tsx
│   │   │   │   └── 📄 create/page.tsx
│   │   │   ├── 📁 transfer/
│   │   │   └── 📁 profile/
│   │   ├── 📁 api/               # API路由
│   │   │   ├── 📁 auth/
│   │   │   ├── 📁 groups/
│   │   │   ├── 📁 transactions/
│   │   │   └── 📁 users/
│   │   ├── 📄 layout.tsx         # 根布局
│   │   ├── 📄 loading.tsx        # 全局加载
│   │   ├── 📄 error.tsx          # 全局错误
│   │   └── 📄 not-found.tsx      # 404页面
│   │
│   ├── 📁 components/            # UI组件库
│   │   ├── 📁 ui/                # 基础UI组件
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 modal.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 forms/             # 表单组件
│   │   │   ├── 📄 transfer-form.tsx
│   │   │   ├── 📄 group-form.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 layout/            # 布局组件
│   │   │   ├── 📄 header.tsx
│   │   │   ├── 📄 sidebar.tsx
│   │   │   ├── 📄 bottom-nav.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 features/          # 功能组件
│   │   │   ├── 📁 group-management/
│   │   │   ├── 📁 point-transfer/
│   │   │   ├── 📁 credit-system/
│   │   │   └── 📁 data-analytics/
│   │   └── 📄 index.ts
│   │
│   ├── 📁 lib/                   # 核心库文件
│   │   ├── 📁 stores/            # 状态管理
│   │   │   ├── 📄 auth-store.ts
│   │   │   ├── 📄 group-store.ts
│   │   │   ├── 📄 transaction-store.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 services/          # 业务服务
│   │   │   ├── 📄 auth-service.ts
│   │   │   ├── 📄 group-service.ts
│   │   │   ├── 📄 transaction-service.ts
│   │   │   ├── 📄 storage-service.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 utils/             # 工具函数
│   │   │   ├── 📄 cn.ts          # className合并
│   │   │   ├── 📄 format.ts      # 格式化函数
│   │   │   ├── 📄 validation.ts  # 验证函数
│   │   │   └── 📄 index.ts
│   │   ├── 📁 hooks/             # 自定义Hooks
│   │   │   ├── 📄 use-auth.ts
│   │   │   ├── 📄 use-groups.ts
│   │   │   ├── 📄 use-transactions.ts
│   │   │   └── 📄 index.ts
│   │   └── 📁 types/             # TypeScript类型
│   │       ├── 📄 auth.ts
│   │       ├── 📄 group.ts
│   │       ├── 📄 transaction.ts
│   │       └── 📄 index.ts
│   │
│   └── 📁 styles/                # 样式文件
│       ├── 📄 globals.css        # 全局样式
│       └── 📄 components.css     # 组件样式
│
├── 📁 public/                    # 静态资源
│   ├── 📁 icons/
│   ├── 📁 images/
│   └── 📄 manifest.json
│
├── 📁 docs/                      # 文档
├── 📄 tailwind.config.js         # Tailwind配置
├── 📄 next.config.js             # Next.js配置
├── 📄 tsconfig.json              # TypeScript配置
├── 📄 package.json
└── 📄 README.md
```

## 4. 状态管理架构

### Zustand Store架构

```typescript
// 📄 lib/stores/auth-store.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

// 📄 lib/stores/group-store.ts
interface GroupState {
  groups: Group[];
  activeGroup: Group | null;
  members: User[];
  loading: boolean;
  createGroup: (groupData: CreateGroupData) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<void>;
  setActiveGroup: (groupId: string) => void;
}

// 📄 lib/stores/transaction-store.ts
interface TransactionState {
  transactions: Transaction[];
  pendingRequests: PendingRequest[];
  balance: number;
  loading: boolean;
  createTransfer: (transferData: TransferData) => Promise<void>;
  respondToRequest: (requestId: string, response: 'accept' | 'reject') => Promise<void>;
}
```

### React Query集成

```typescript
// 📄 lib/hooks/use-groups.ts
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => groupService.getGroups(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => groupService.getMembers(groupId),
    enabled: !!groupId,
  });
}
```

## 5. 组件架构设计

### 组件分层架构

```typescript
// 🎨 UI层 - 纯展示组件
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
}

// 🧩 复合层 - 业务组件
interface TransferCardProps {
  user: User;
  onTransferClick: (userId: string) => void;
}

// 🏗️ 容器层 - 页面组件
interface GroupPageProps {
  params: { id: string };
}
```

### 响应式设计组件

```typescript
// 📄 components/layout/responsive-layout.tsx
interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  mobileNav?: ReactNode;
}

export function ResponsiveLayout({ children, sidebar, mobileNav }: ResponsiveLayoutProps) {
  return (
    <div className="ak-min-h-screen ak-bg-gray-50">
      {/* 桌面端侧边栏 */}
      <aside className="ak-hidden lg:ak-block ak-fixed ak-inset-y-0 ak-left-0 ak-w-64 ak-bg-white ak-border-r">
        {sidebar}
      </aside>
      
      {/* 主内容区 */}
      <main className="lg:ak-pl-64">
        <div className="ak-px-4 sm:ak-px-6 lg:ak-px-8 ak-py-6">
          {children}
        </div>
      </main>
      
      {/* 移动端底部导航 */}
      <nav className="lg:ak-hidden ak-fixed ak-bottom-0 ak-inset-x-0 ak-bg-white ak-border-t">
        {mobileNav}
      </nav>
    </div>
  );
}
```

## 6. API设计方案

### RESTful API设计

```typescript
// 📄 app/api/groups/route.ts
export async function GET(request: Request) {
  const groups = await groupService.getGroups();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const data = await request.json();
  const group = await groupService.createGroup(data);
  return NextResponse.json(group);
}

// 📄 app/api/groups/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const group = await groupService.getGroupById(params.id);
  return NextResponse.json(group);
}
```

### tRPC API设计 (可选)

```typescript
// 📄 lib/trpc/router.ts
export const appRouter = router({
  groups: router({
    getAll: publicProcedure
      .query(() => groupService.getGroups()),
    
    create: protectedProcedure
      .input(createGroupSchema)
      .mutation(({ input }) => groupService.createGroup(input)),
    
    join: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(({ input }) => groupService.joinGroup(input.inviteCode)),
  }),
  
  transactions: router({
    create: protectedProcedure
      .input(createTransactionSchema)
      .mutation(({ input }) => transactionService.createTransfer(input)),
  }),
});
```

## 7. 实时通信架构

### WebSocket集成

```typescript
// 📄 lib/services/websocket-service.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  
  connect() {
    this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }
  
  private handleMessage(data: any) {
    switch (data.type) {
      case 'TRANSFER_REQUEST':
        // 更新pending requests
        break;
      case 'TRANSFER_RESPONSE':
        // 更新transaction状态
        break;
      case 'BALANCE_UPDATE':
        // 更新用户余额
        break;
    }
  }
  
  sendTransferRequest(data: TransferRequest) {
    this.ws?.send(JSON.stringify({
      type: 'TRANSFER_REQUEST',
      payload: data
    }));
  }
}
```

## 8. Tailwind CSS配置

```javascript
// 📄 tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色彩
        'ak-primary': '#4A90E2',
        'ak-success': '#7ED321',
        'ak-warning': '#F5A623',
        'ak-error': '#D0021B',
        
        // 积分状态色
        'ak-points-abundant': '#2ECC71',
        'ak-points-normal': '#F39C12',
        'ak-points-low': '#E67E22',
        'ak-points-critical': '#E74C3C',
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      animation: {
        'ak-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ak-bounce': 'bounce 1s infinite',
        'ak-spin': 'spin 1s linear infinite',
      },
      
      screens: {
        'ak-xs': '475px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  prefix: 'ak-',
}
```

## 9. 部署架构建议

### 方案A：Vercel部署 (推荐)
```yaml
# vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://point-hive.vercel.app"
  }
}
```

### 方案B：Docker部署
```dockerfile
# Dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## 10. 安全性考虑

### 身份验证与授权

```typescript
// 📄 lib/auth/auth-config.ts
export const authConfig = {
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  providers: [
    {
      id: 'credentials',
      name: 'credentials',
      authorize: async (credentials) => {
        // 验证用户凭据
        const user = await verifyCredentials(credentials);
        return user;
      },
    },
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7天
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
};
```

### 数据验证

```typescript
// 📄 lib/validation/schemas.ts
export const transferSchema = z.object({
  toUserId: z.string().uuid(),
  amount: z.number().min(1).max(10000),
  description: z.string().max(100).optional(),
  dueDate: z.date().optional(),
});

export const groupSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  maxMembers: z.number().min(2).max(100),
  rules: z.object({
    maxTransferAmount: z.number().min(1),
    defaultReturnPeriod: z.number().min(1).max(30),
  }),
});
```

### CSP和安全头

```javascript
// 📄 next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
```

## 11. 性能优化策略

### 代码分割和懒加载

```typescript
// 页面级代码分割
const GroupPage = dynamic(() => import('@/components/features/group-management'), {
  loading: () => <PageSkeleton />,
  ssr: false,
});

// 组件级懒加载
const TransferModal = lazy(() => import('@/components/forms/transfer-form'));
```

### 图片优化

```typescript
import Image from 'next/image';

<Image
  src="/icons/point-hive-logo.svg"
  alt="Point Hive"
  width={120}
  height={40}
  priority
  className="ak-w-auto ak-h-10"
/>
```

### 缓存策略

```typescript
// React Query缓存配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      refetchOnWindowFocus: false,
    },
  },
});
```

## 12. 开发工具配置

### ESLint配置

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    'prefer-const': 'error',
    'no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

### Prettier配置

```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 推荐方案总结

**🥇 推荐方案：方案B (标准版混合架构)**

**理由：**
1. **开发效率高** - Next.js + Supabase 快速上线
2. **功能完整** - 支持实时同步、用户认证、数据分析
3. **成本可控** - Supabase免费额度足够初期使用
4. **扩展性好** - 后续可平滑升级到企业版
5. **维护简单** - 第三方服务减少运维负担

**技术栈：**
```
✅ Next.js 14 + TypeScript
✅ Tailwind CSS (前缀 ak-)
✅ Zustand + React Query
✅ Supabase (数据库 + 实时通信 + 认证)
✅ IndexedDB (离线缓存)
✅ Vercel (部署)
```

**实施优先级：**
1. **Phase 1**: 核心UI组件 + 基础布局
2. **Phase 2**: 用户认证 + 群组管理  
3. **Phase 3**: 积分转移 + 实时通信
4. **Phase 4**: 信用系统 + 数据分析
5. **Phase 5**: 优化 + 测试 + 部署

您选择哪个方案？我将基于您的选择开始具体的代码实现。