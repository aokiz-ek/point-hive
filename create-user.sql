-- 为当前用户创建 users 表记录
INSERT INTO users (id, email, username, full_name, credit_score, balance) 
VALUES (
    '79975aec-90ff-4987-b77a-c36d8f957c21', 
    'xigefe@gmail.com', 
    'wade', 
    'wade', 
    600, 
    1000
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();