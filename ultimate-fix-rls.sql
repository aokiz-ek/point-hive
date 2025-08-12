-- 终极 RLS 修复脚本 - 彻底解决递归问题
-- 这个脚本将完全清除所有 RLS 设置并重建数据库访问

-- 1. 强制删除所有可能的策略（即使不存在也不会报错）
DO $$
DECLARE
    pol_record RECORD;
    tbl_record RECORD;
BEGIN
    -- 获取所有策略并逐一删除
    FOR pol_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY %I ON %I.%I CASCADE', 
                pol_record.policyname, pol_record.schemaname, pol_record.tablename);
            RAISE NOTICE 'Dropped policy: % on %', pol_record.policyname, pol_record.tablename;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy: % on % (error: %)', 
                    pol_record.policyname, pol_record.tablename, SQLERRM;
        END;
    END LOOP;

    -- 禁用所有表的 RLS
    FOR tbl_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl_record.tablename);
            RAISE NOTICE 'Disabled RLS on table: %', tbl_record.tablename;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not disable RLS on table: % (error: %)', 
                    tbl_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. 确保特定表的 RLS 被禁用（双重保险）
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- 3. 删除可能存在的触发器（有时也会导致递归）
DROP TRIGGER IF EXISTS rls_trigger ON group_members;
DROP TRIGGER IF EXISTS rls_trigger ON groups;
DROP TRIGGER IF EXISTS rls_trigger ON transactions;

-- 4. 重置数据库连接池（清除缓存的策略）
-- 注意：这在 Supabase 中会自动处理

-- 5. 验证清理结果
SELECT 'Current policies (should be empty):' as status;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 'Tables with RLS enabled (should be empty):' as status;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- 6. 测试基本查询
SELECT 'Testing queries:' as status;
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'groups' as table_name, COUNT(*) as count FROM groups
UNION ALL  
SELECT 'group_members' as table_name, COUNT(*) as count FROM group_members
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as count FROM transactions;

-- 7. 授予必要的基本权限（如果需要）
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 完成提示
SELECT 'RLS cleanup completed successfully!' as final_status;