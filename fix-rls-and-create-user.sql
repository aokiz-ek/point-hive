-- 临时禁用 users 表的 RLS 以便创建记录
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 插入用户记录
INSERT INTO users (id, email, username, full_name, credit_score, balance, is_online) 
VALUES (
    '79975aec-90ff-4987-b77a-c36d8f957c21',
    'xigefe@gmail.com',
    'wade', 
    'wade',
    600,
    1000,
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    is_online = EXCLUDED.is_online,
    updated_at = NOW();

-- 重新启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 删除旧的策略
DROP POLICY IF EXISTS "用户可以查看自己的信息" ON users;
DROP POLICY IF EXISTS "用户可以更新自己的信息" ON users;

-- 创建更完整的 RLS 策略
CREATE POLICY "用户可以查看自己的信息" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可以更新自己的信息" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户可以插入自己的记录" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建用户偏好设置记录
INSERT INTO user_preferences (user_id, theme, language, notifications_enabled, email_notifications, push_notifications)
VALUES (
    '79975aec-90ff-4987-b77a-c36d8f957c21',
    'light',
    'zh-CN', 
    true,
    true,
    true
) ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

-- 验证记录创建成功
SELECT id, email, username, full_name, credit_score, balance, is_online, created_at
FROM users 
WHERE id = '79975aec-90ff-4987-b77a-c36d8f957c21';