-- 验证数据库表是否创建成功
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 验证用户数据
SELECT id, email, username, full_name, credit_score, balance, created_at
FROM users 
WHERE id = '79975aec-90ff-4987-b77a-c36d8f957c21';

-- 检查表结构
\d users