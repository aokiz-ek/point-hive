# Point-Hive (积分蜂巢)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-blue?style=for-the-badge&logo=vercel)](https://point-hive-9149.vercel.app/)

[English](#english) | [中文](#中文)

---

## 中文

### 项目介绍

**Point-Hive**（积分蜂巢）是一个现代化的基于积分的借还管理系统，专为多人协作场景设计。系统支持实时积分转移、智能信用评分、群组管理等功能，特别适用于扑克游戏积分管理、团队协作积分分配等场景。

### 🌐 在线演示

🚀 **访问地址**: [https://point-hive-9149.vercel.app/](https://point-hive-9149.vercel.app/)

> 💡 **提示**: 系统支持本地模式运行，无需任何配置即可体验所有功能。您可以直接创建扑克游戏房间并邀请朋友参与！

### 🎯 核心特性

- **🎮 扑克游戏积分管理** - 专业的扑克游戏积分分配、转移和结算系统
- **⚡ 实时数据同步** - 基于现代化架构的实时数据更新
- **🏆 智能信用评分** - 基于历史行为的多维度信用评估系统
- **👥 群组协作管理** - 支持多人群组创建、成员管理和权限控制
- **📊 数据分析统计** - 详细的交易记录和数据可视化分析
- **🔒 安全可靠** - 完善的权限控制和数据安全保障
- **📱 响应式设计** - 适配桌面端和移动端的现代化UI界面

### 🛠️ 技术栈

- **前端框架**: Next.js 14 + TypeScript
- **状态管理**: Zustand + React Query
- **UI组件库**: 自定义组件 + Lucide React图标
- **样式解决方案**: Tailwind CSS + CSS模块
- **数据库**: Supabase（云端）+ LocalStorage（本地）
- **实时通信**: Supabase Realtime
- **表单处理**: React Hook Form + Zod验证
- **动画**: Framer Motion
- **开发工具**: ESLint + Prettier + Husky

### 🚀 快速开始

#### 环境要求

- Node.js >= 18.0.0
- pnpm 或 npm 或 yarn

#### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

#### 环境配置

1. 复制环境变量模板文件：
```bash
cp .env.example .env.local
```

2. 配置Supabase连接信息（可选，系统支持本地模式）：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 启动开发服务器

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

#### 其他命令

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 代码格式化
pnpm format
```

### 📁 项目结构

```
point-hive/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── (dashboard)/        # 仪表板页面组
│   │   │   ├── groups/         # 群组管理
│   │   │   │   └── poker/      # 扑克游戏相关页面
│   │   │   └── config/         # 配置页面
│   │   ├── api/                # API路由
│   │   ├── layout.tsx          # 根布局组件
│   │   └── page.tsx            # 首页
│   ├── components/             # React组件
│   │   ├── auth/               # 认证相关组件
│   │   ├── features/           # 功能组件
│   │   ├── forms/              # 表单组件
│   │   ├── layout/             # 布局组件
│   │   └── ui/                 # 基础UI组件
│   ├── lib/                    # 工具库和配置
│   │   ├── hooks/              # 自定义React Hooks
│   │   ├── services/           # 业务服务层
│   │   ├── stores/             # 状态管理
│   │   ├── supabase/           # Supabase配置
│   │   ├── types/              # TypeScript类型定义
│   │   └── utils/              # 工具函数
│   └── styles/                 # 样式文件
├── public/                     # 静态资源
├── docx/                       # 项目文档
│   ├── PRODUCT_SUMMARY.md      # 产品需求文档
│   ├── TECH_ARCHITECTURE.md    # 技术架构文档
│   └── ...                     # 其他技术文档
└── sqlx/                       # 数据库脚本
    ├── setup-database.sql      # 数据库初始化
    └── ...                     # 其他SQL脚本
```

### 🎮 主要功能模块

#### 1. 扑克游戏积分管理
- **群组创建**: 支持快速创建扑克游戏房间，设置初始积分和游戏规则
- **积分分配**: 自动为每个玩家分配初始积分，记录完整的交易历史
- **实时转移**: 玩家间可以实时进行积分转移，支持借出和赢取两种类型
- **游戏结算**: 游戏结束后自动计算每个玩家的净收益和最终排名

#### 2. 群组协作管理
- **权限控制**: 支持群主、管理员、普通成员等多级权限管理
- **成员邀请**: 多种邀请方式，包括邀请码、二维码、链接分享
- **规则自定义**: 灵活的群组规则配置，包括转移限额、归还期限等

#### 3. 信用评分系统
- **多维度评估**: 基于按时归还率、交易活跃度、群组贡献度等指标
- **动态调整**: 实时更新用户信用等级，影响转移权限和推荐排序
- **信用恢复**: 提供多种信用恢复机制，鼓励良好行为

#### 4. 数据统计分析
- **个人统计**: 积分流转趋势、交易历史、信用变化等
- **群组统计**: 成员活跃度、交易热力图、风险监控等
- **实时报表**: 支持数据导出和多维度分析

### 🏗️ 架构设计

#### 数据存储
系统支持两种存储模式：
- **云端模式**: 使用Supabase作为后端，支持实时同步和多设备访问
- **本地模式**: 使用LocalStorage本地存储，适用于离线场景或隐私敏感环境

#### 状态管理
- **Zustand**: 轻量级状态管理，处理全局应用状态
- **React Query**: 服务端状态管理，提供缓存、同步和错误处理
- **Context API**: 处理主题、认证等上下文状态

#### 组件架构
- **原子化设计**: 基于原子设计理论构建可复用组件库
- **类型安全**: 完整的TypeScript类型定义，确保编译时类型检查
- **响应式布局**: 基于Tailwind CSS的响应式设计系统

### 📋 开发规范

#### 代码风格
- 使用ESLint和Prettier确保代码风格一致
- 遵循TypeScript严格模式
- 组件和函数使用描述性命名
- 优先使用函数式组件和Hooks

#### Git提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

#### 分支管理
- `main`: 生产环境分支
- `develop`: 开发环境分支
- `feature/*`: 功能开发分支
- `fix/*`: 修复bug分支

### 🤝 贡献指南

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

### 📄 许可证

本项目采用MIT许可证。详情请参阅 [LICENSE](LICENSE) 文件。

### 👥 作者

- **开发团队** - YYB.R&D团队

### 🙏 致谢

感谢所有为此项目做出贡献的开发者和用户。

---

## English

### Project Introduction

**Point-Hive** is a modern point-based lending and borrowing management system designed for multi-user collaborative scenarios. The system supports real-time point transfers, intelligent credit scoring, group management, and is particularly suitable for poker game point management and team collaboration scenarios.

### 🌐 Live Demo

🚀 **Visit**: [https://point-hive-9149.vercel.app/](https://point-hive-9149.vercel.app/)

> 💡 **Tip**: The system supports local mode operation, allowing you to experience all features without any configuration. You can directly create poker game rooms and invite friends to join!

### 🎯 Core Features

- **🎮 Poker Game Point Management** - Professional poker game point allocation, transfer, and settlement system
- **⚡ Real-time Data Synchronization** - Real-time data updates based on modern architecture
- **🏆 Intelligent Credit Scoring** - Multi-dimensional credit assessment system based on historical behavior
- **👥 Group Collaboration Management** - Support for multi-user group creation, member management, and permission control
- **📊 Data Analysis & Statistics** - Detailed transaction records and data visualization analysis
- **🔒 Secure & Reliable** - Comprehensive permission control and data security guarantee
- **📱 Responsive Design** - Modern UI interface adapted for desktop and mobile

### 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14 + TypeScript
- **State Management**: Zustand + React Query
- **UI Components**: Custom Components + Lucide React Icons
- **Styling Solution**: Tailwind CSS + CSS Modules
- **Database**: Supabase (Cloud) + LocalStorage (Local)
- **Real-time Communication**: Supabase Realtime
- **Form Handling**: React Hook Form + Zod Validation
- **Animation**: Framer Motion
- **Development Tools**: ESLint + Prettier + Husky

### 🚀 Quick Start

#### Prerequisites

- Node.js >= 18.0.0
- pnpm or npm or yarn

#### Installation

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

#### Environment Configuration

1. Copy the environment template file:
```bash
cp .env.example .env.local
```

2. Configure Supabase connection (optional, system supports local mode):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

#### Other Commands

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type checking
pnpm type-check

# Format code
pnpm format
```

### 📁 Project Structure

```
point-hive/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── (dashboard)/        # Dashboard page group
│   │   │   ├── groups/         # Group management
│   │   │   │   └── poker/      # Poker game related pages
│   │   │   └── config/         # Configuration pages
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout component
│   │   └── page.tsx            # Homepage
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   ├── features/           # Feature components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # Basic UI components
│   ├── lib/                    # Utilities and configurations
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── services/           # Business service layer
│   │   ├── stores/             # State management
│   │   ├── supabase/           # Supabase configuration
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   └── styles/                 # Style files
├── public/                     # Static assets
├── docx/                       # Project documentation
│   ├── PRODUCT_SUMMARY.md      # Product requirements document
│   ├── TECH_ARCHITECTURE.md    # Technical architecture document
│   └── ...                     # Other technical documents
└── sqlx/                       # Database scripts
    ├── setup-database.sql      # Database initialization
    └── ...                     # Other SQL scripts
```

### 🎮 Main Feature Modules

#### 1. Poker Game Point Management
- **Group Creation**: Support for quickly creating poker game rooms with initial points and game rules
- **Point Allocation**: Automatically allocate initial points to each player with complete transaction history
- **Real-time Transfer**: Real-time point transfers between players, supporting both loan and win types
- **Game Settlement**: Automatic calculation of each player's net profit and final ranking after game completion

#### 2. Group Collaboration Management
- **Permission Control**: Multi-level permission management including group owner, administrator, and regular members
- **Member Invitation**: Multiple invitation methods including invitation codes, QR codes, and link sharing
- **Custom Rules**: Flexible group rule configuration including transfer limits and return deadlines

#### 3. Credit Scoring System
- **Multi-dimensional Assessment**: Based on on-time return rate, transaction activity, group contribution, etc.
- **Dynamic Adjustment**: Real-time updates to user credit levels affecting transfer permissions and recommendation sorting
- **Credit Recovery**: Multiple credit recovery mechanisms to encourage good behavior

#### 4. Data Statistics & Analysis
- **Personal Statistics**: Point flow trends, transaction history, credit changes, etc.
- **Group Statistics**: Member activity, transaction heat maps, risk monitoring, etc.
- **Real-time Reports**: Support for data export and multi-dimensional analysis

### 🏗️ Architecture Design

#### Data Storage
The system supports two storage modes:
- **Cloud Mode**: Uses Supabase as backend, supporting real-time sync and multi-device access
- **Local Mode**: Uses LocalStorage for local storage, suitable for offline scenarios or privacy-sensitive environments

#### State Management
- **Zustand**: Lightweight state management for global application state
- **React Query**: Server-side state management with caching, synchronization, and error handling
- **Context API**: Handles theme, authentication, and other contextual states

#### Component Architecture
- **Atomic Design**: Build reusable component library based on atomic design principles
- **Type Safety**: Complete TypeScript type definitions ensuring compile-time type checking
- **Responsive Layout**: Responsive design system based on Tailwind CSS

### 📋 Development Standards

#### Code Style
- Use ESLint and Prettier to ensure consistent code style
- Follow TypeScript strict mode
- Use descriptive naming for components and functions
- Prioritize functional components and Hooks

#### Git Commit Standards
```bash
feat: new feature
fix: bug fix
docs: documentation update
style: code format adjustment
refactor: refactoring
test: test related
chore: build process or auxiliary tool changes
```

#### Branch Management
- `main`: production branch
- `develop`: development branch
- `feature/*`: feature development branch
- `fix/*`: bug fix branch

### 🤝 Contributing

1. Fork this project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Submit a Pull Request

### 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### 👥 Authors

- **Development Team** - YYB.R&D Team

### 🙏 Acknowledgments

Thanks to all developers and users who have contributed to this project.

---

**Point-Hive** - Making point management simple, secure, and collaborative! 🚀