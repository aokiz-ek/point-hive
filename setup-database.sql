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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户偏好设置表
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'zh-CN',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引以提升查询性能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_group ON transactions(group_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_credit_records_user ON credit_records(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全性 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用户表的RLS策略
CREATE POLICY "用户可以查看自己的信息" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可以更新自己的信息" ON users FOR UPDATE USING (auth.uid() = id);

-- 群组表的RLS策略
CREATE POLICY "用户可以查看公开群组" ON groups FOR SELECT USING (true);
CREATE POLICY "群组所有者可以管理群组" ON groups FOR ALL USING (auth.uid() = owner_id);

-- 群组成员表的RLS策略  
CREATE POLICY "群组成员可以查看成员信息" ON group_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.group_id = group_members.group_id 
        AND gm.user_id = auth.uid()
    )
);

-- 交易表的RLS策略
CREATE POLICY "用户可以查看相关交易" ON transactions FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "用户可以创建交易" ON transactions FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
);

-- 通知表的RLS策略
CREATE POLICY "用户只能查看自己的通知" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的通知" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 其他表的基本RLS策略
CREATE POLICY "用户相关数据访问" ON credit_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户相关数据访问" ON user_ratings FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "用户偏好访问控制" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- 插入测试数据（可选）
-- 注意：这里使用的UUID需要与实际注册的用户匹配
-- INSERT INTO users (id, email, username, full_name, credit_score, balance) 
-- VALUES ('79975aec-90ff-4987-b77a-c36d8f957c21', 'xigefe@gmail.com', 'wade', 'wade', 600, 1000);

COMMIT;