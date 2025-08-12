# Supabase 项目设置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **项目名称**: `point-hive`
   - **数据库密码**: 设置强密码
   - **区域**: 选择离用户最近的区域
   - **组织**: 选择或创建组织

## 2. 运行数据库迁移

1. 在 Supabase Dashboard 中，点击 "SQL Editor"
2. 复制 `supabase-schema.sql` 文件的内容
3. 粘贴到 SQL Editor 中并运行

## 3. 获取项目配置信息

在 Supabase Dashboard 的 "Settings" → "API" 中获取：

- **Project URL**: `https://xxxxxxxx.supabase.co`
- **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 4. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
SUPABASE_SERVICE_ROLE_KEY=你的service role key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. 验证设置

运行以下命令验证配置：

```bash
npm run dev
```

访问 `http://localhost:3000` 确保应用正常运行。

## 6. 数据库表结构说明

### 核心表
- `users` - 用户信息
- `groups` - 群组信息
- `group_members` - 群组成员关系
- `transactions` - 积分转移记录
- `credit_records` - 信用记录

### 功能表
- `user_ratings` - 用户评价
- `notifications` - 通知系统
- `group_invites` - 群组邀请
- `user_preferences` - 用户偏好设置

### 视图
- `user_stats` - 用户统计信息
- `group_stats` - 群组统计信息

## 7. 安全性配置

### 行级安全性 (RLS)
已启用 RLS 策略，确保：
- 用户只能访问自己的数据
- 群组成员只能访问所属群组的数据
- 敏感操作需要适当的权限

### 数据验证
- 所有表都有适当的约束
- 外键关系确保数据完整性
- 触发器自动更新时间戳

## 8. 下一步

数据库设置完成后，继续进行：
1. 配置 Supabase 客户端
2. 实现认证系统
3. 创建数据服务层
4. 添加实时功能

## 故障排除

### 常见问题
1. **连接错误**: 检查环境变量是否正确
2. **权限错误**: 确认 RLS 策略配置
3. **表不存在**: 重新运行数据库迁移

### 调试工具
- 使用 Supabase Dashboard 的 "Table Editor" 查看数据
- 使用 "Logs" 查看错误日志
- 使用 "Auth" 查看用户认证状态