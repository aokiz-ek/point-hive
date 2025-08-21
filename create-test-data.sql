-- 创建多人游戏积分管理测试数据
-- 为支持6+人的积分管理场景

-- 1. 创建测试用户（多人游戏参与者）
INSERT INTO users (id, email, username, full_name, balance, credit_score, is_online) VALUES
('test-user-01', 'player1@game.com', 'GameMaster', '游戏主持人', 5000, 920, true),
('test-user-02', 'player2@game.com', 'ProGamer', '职业玩家', 3200, 850, true),
('test-user-03', 'player3@game.com', 'CasualPlayer', '休闲玩家', 1800, 750, true),
('test-user-04', 'player4@game.com', 'TeamLeader', '队伍队长', 4100, 880, false),
('test-user-05', 'player5@game.com', 'Strategist', '策略专家', 2600, 800, true),
('test-user-06', 'player6@game.com', 'RookiePlayer', '新手玩家', 900, 650, false),
('test-user-07', 'player7@game.com', 'VeteranGamer', '老玩家', 6800, 950, true),
('test-user-08', 'player8@game.com', 'StreamGamer', '直播玩家', 3900, 820, true)
ON CONFLICT (id) DO UPDATE SET
balance = EXCLUDED.balance,
credit_score = EXCLUDED.credit_score,
is_online = EXCLUDED.is_online;

-- 2. 创建多人游戏群组
INSERT INTO groups (id, name, description, group_type, owner_id, max_members, current_members, invite_code, is_active) VALUES
('game-group-01', '王者荣耀积分赛', '王者荣耀排位赛积分管理，支持快速结算', 'activity', '79975aec-90ff-4987-b77a-c36d8f957c21', 8, 6, 'GAME01', true),
('game-group-02', '英雄联盟战队', '英雄联盟职业战队积分池管理', 'enterprise', 'test-user-01', 10, 8, 'LOL888', true),
('game-group-03', '休闲桌游社', '线下桌游活动积分结算系统', 'community', 'test-user-02', 12, 7, 'TABLE1', true),
('game-group-04', '电竞俱乐部', '电竞俱乐部多项目积分管理', 'enterprise', 'test-user-04', 15, 10, 'ESPORT', true)
ON CONFLICT (id) DO UPDATE SET
current_members = EXCLUDED.current_members,
is_active = EXCLUDED.is_active;

-- 3. 创建群组成员关系（支持多人场景）
INSERT INTO group_members (group_id, user_id, role, points_balance, is_active) VALUES
-- 王者荣耀积分赛 (6人)
('game-group-01', '79975aec-90ff-4987-b77a-c36d8f957c21', 'owner', 1000, true),
('game-group-01', 'test-user-01', 'admin', 5000, true),
('game-group-01', 'test-user-02', 'member', 3200, true),
('game-group-01', 'test-user-03', 'member', 1800, true),
('game-group-01', 'test-user-05', 'member', 2600, true),
('game-group-01', 'test-user-07', 'member', 6800, true),

-- 英雄联盟战队 (8人)
('game-group-02', 'test-user-01', 'owner', 5000, true),
('game-group-02', '79975aec-90ff-4987-b77a-c36d8f957c21', 'admin', 1000, true),
('game-group-02', 'test-user-02', 'member', 3200, true),
('game-group-02', 'test-user-03', 'member', 1800, true),
('game-group-02', 'test-user-04', 'member', 4100, true),
('game-group-02', 'test-user-05', 'member', 2600, true),
('game-group-02', 'test-user-06', 'member', 900, true),
('game-group-02', 'test-user-08', 'member', 3900, true),

-- 休闲桌游社 (7人)
('game-group-03', 'test-user-02', 'owner', 3200, true),
('game-group-03', '79975aec-90ff-4987-b77a-c36d8f957c21', 'member', 1000, true),
('game-group-03', 'test-user-03', 'member', 1800, true),
('game-group-03', 'test-user-04', 'admin', 4100, true),
('game-group-03', 'test-user-06', 'member', 900, true),
('game-group-03', 'test-user-07', 'member', 6800, true),
('game-group-03', 'test-user-08', 'member', 3900, true)

ON CONFLICT (group_id, user_id) DO UPDATE SET
points_balance = EXCLUDED.points_balance,
is_active = EXCLUDED.is_active;

-- 4. 创建积分转移交易记录（快速转移场景）
INSERT INTO transactions (id, from_user_id, to_user_id, group_id, amount, description, status, type, created_at, updated_at) VALUES
('txn-game-001', '79975aec-90ff-4987-b77a-c36d8f957c21', 'test-user-01', 'game-group-01', 500, '游戏胜利奖励', 'completed', 'transfer', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('txn-game-002', 'test-user-01', 'test-user-02', 'game-group-01', 300, '技能指导费', 'completed', 'transfer', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
('txn-game-003', 'test-user-02', 'test-user-03', 'game-group-01', 200, '装备借用', 'pending', 'transfer', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
('txn-game-004', 'test-user-05', '79975aec-90ff-4987-b77a-c36d8f957c21', 'game-group-01', 150, '策略分析奖励', 'completed', 'transfer', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
('txn-game-005', 'test-user-07', 'test-user-06', 'game-group-02', 800, '新手指导', 'completed', 'transfer', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
('txn-game-006', 'test-user-04', 'test-user-08', 'game-group-02', 600, '直播分成', 'pending', 'transfer', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO UPDATE SET
status = EXCLUDED.status,
updated_at = NOW();

-- 5. 创建用户偏好设置
INSERT INTO user_preferences (user_id, theme, language, notifications_enabled, email_notifications, push_notifications) VALUES
('test-user-01', 'dark', 'zh-CN', true, true, true),
('test-user-02', 'light', 'zh-CN', true, false, true),
('test-user-03', 'light', 'zh-CN', true, true, false),
('test-user-04', 'dark', 'zh-CN', true, true, true),
('test-user-05', 'light', 'zh-CN', false, false, false),
('test-user-06', 'light', 'zh-CN', true, true, true),
('test-user-07', 'dark', 'zh-CN', true, false, true),
('test-user-08', 'light', 'zh-CN', true, true, true)
ON CONFLICT (user_id) DO UPDATE SET
theme = EXCLUDED.theme,
notifications_enabled = EXCLUDED.notifications_enabled;