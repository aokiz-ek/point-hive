-- 修复 RLS 策略递归问题

-- 删除有问题的群组成员策略
DROP POLICY IF EXISTS "群组成员可以查看成员信息" ON group_members;
DROP POLICY IF EXISTS "群组所有者可以管理群组" ON groups;

-- 简化的群组策略
CREATE POLICY "所有认证用户可以查看群组" ON groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "群组所有者可以管理" ON groups FOR ALL USING (auth.uid() = owner_id);

-- 简化的群组成员策略（避免递归）
CREATE POLICY "成员可以查看群组成员" ON group_members FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
        SELECT user_id FROM group_members WHERE group_id = group_members.group_id
    )
);

CREATE POLICY "用户可以加入群组" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以退出群组" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- 重新启用一些策略，但更简单
CREATE POLICY "所有认证用户可以查看交易" ON transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "用户创建交易" ON transactions FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 更新其他策略
DROP POLICY IF EXISTS "用户相关数据访问" ON credit_records;
DROP POLICY IF EXISTS "用户相关数据访问" ON user_ratings;

CREATE POLICY "用户查看信用记录" ON credit_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户查看评价" ON user_ratings FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 验证策略是否正常
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;