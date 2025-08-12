-- 临时禁用有问题的表的 RLS，让应用先能运行
-- 等后续再完善安全策略

-- 删除所有可能导致递归的策略
DROP POLICY IF EXISTS "成员可以查看群组成员" ON group_members;
DROP POLICY IF EXISTS "群组成员可以查看成员信息" ON group_members;
DROP POLICY IF EXISTS "所有认证用户可以查看群组" ON groups;
DROP POLICY IF EXISTS "群组所有者可以管理" ON groups;

-- 暂时禁用这些表的 RLS（开发测试阶段）
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 保持 users 和 user_preferences 的 RLS（因为它们工作正常）
-- users 表保持现有策略
-- user_preferences 表保持现有策略

-- 验证哪些表还启用了 RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;