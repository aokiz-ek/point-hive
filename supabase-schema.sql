-- Point-Hive 数据库表结构
-- 方案B: 混合架构 (Supabase + IndexedDB)

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    credit_score INTEGER DEFAULT 600 CHECK (credit_score >= 0 AND credit_score <= 1000),
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    is_online BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 群组表
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_type VARCHAR(20) NOT NULL DEFAULT 'custom', -- 'enterprise', 'community', 'event', 'custom'
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 50 CHECK (max_members >= 2 AND max_members <= 1000),
    current_members INTEGER DEFAULT 1,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 群组成员表
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_balance INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(group_id, user_id)
);

-- 积分转移记录表
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'rejected', 'cancelled'
    type VARCHAR(20) NOT NULL DEFAULT 'transfer', -- 'transfer', 'return', 'settlement'
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 信用记录表
CREATE TABLE credit_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'positive', 'negative'
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户评价表
CREATE TABLE user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id, transaction_id)
);

-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'transfer_request', 'transfer_response', 'group_invite', 'system'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 群组邀请码表
CREATE TABLE group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户偏好设置表
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
    language VARCHAR(10) DEFAULT 'zh-CN',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建索引优化查询性能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_credit_score ON users(credit_score DESC);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_credit_records_user_id ON credit_records(user_id);
CREATE INDEX idx_user_ratings_to_user ON user_ratings(to_user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_group_invites_code ON group_invites(invite_code);

-- 创建触发器函数：更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建函数：生成邀请码
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    WHILE attempts < max_attempts LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM groups WHERE invite_code = code) 
                  AND NOT EXISTS (SELECT 1 FROM group_invites WHERE invite_code = code);
        attempts := attempts + 1;
    END LOOP;
    
    IF attempts >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique invite code';
    END IF;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 创建视图：用户统计信息
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.credit_score,
    u.balance,
    COUNT(DISTINCT gm.group_id) as total_groups,
    COUNT(DISTINCT CASE WHEN t.from_user_id = u.id THEN t.id END) as transfers_sent,
    COUNT(DISTINCT CASE WHEN t.to_user_id = u.id THEN t.id END) as transfers_received,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_transactions,
    AVG(ur.rating) as average_rating,
    COUNT(ur.id) as total_ratings
FROM users u
LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.is_active = TRUE
LEFT JOIN transactions t ON (u.id = t.from_user_id OR u.id = t.to_user_id)
LEFT JOIN user_ratings ur ON u.id = ur.to_user_id
GROUP BY u.id, u.username, u.email, u.credit_score, u.balance;

-- 创建视图：群组统计信息
CREATE VIEW group_stats AS
SELECT 
    g.id,
    g.name,
    g.group_type,
    g.owner_id,
    u.username as owner_name,
    g.current_members,
    g.max_members,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as total_points_transferred,
    AVG(CASE WHEN t.status = 'completed' THEN t.amount ELSE NULL END) as average_transfer_amount,
    g.created_at
FROM groups g
JOIN users u ON g.owner_id = u.id
LEFT JOIN transactions t ON g.id = t.group_id
GROUP BY g.id, g.name, g.group_type, g.owner_id, u.username, g.current_members, g.max_members, g.created_at;

-- 启用行级安全性 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建基本的RLS策略 (实际应用中需要更详细的策略)
-- 用户只能查看自己的基本信息
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- 用户可以更新自己的信息
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 群组成员可以查看群组信息
CREATE POLICY "Group members can view group" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id = auth.uid()::text::uuid
            AND group_members.is_active = TRUE
        )
    );

-- 群组成员可以查看群组成员列表
CREATE POLICY "Group members can view members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members gm2 
            WHERE gm2.group_id = group_members.group_id 
            AND gm2.user_id = auth.uid()::text::uuid
            AND gm2.is_active = TRUE
        )
    );

-- 用户只能查看自己的通知
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- 用户只能更新自己的通知
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 插入默认数据示例
-- 注意：实际部署时应该通过应用层插入，而不是直接在SQL中插入
-- 这里仅作为数据结构参考