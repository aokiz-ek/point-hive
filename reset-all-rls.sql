-- 完全重置所有 RLS 策略和设置
-- 这将让应用能够正常运行，用于开发测试

-- 1. 查看当前所有策略
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- 2. 删除所有现有策略
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 删除所有 public schema 中的策略
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. 禁用所有表的 RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 4. 验证所有策略已删除
SELECT 'Remaining policies:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. 验证所有表的 RLS 状态
SELECT 'Tables with RLS enabled:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- 6. 测试查询权限
SELECT 'Testing basic queries:' as info;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as group_count FROM groups;
SELECT COUNT(*) as transaction_count FROM transactions;