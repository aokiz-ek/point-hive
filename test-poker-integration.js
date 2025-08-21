/**
 * Point-Hive 扑克游戏数据库集成测试脚本
 * 在浏览器控制台中运行此脚本来测试功能
 */

// 测试数据库集成是否正常工作
async function testPokerIntegration() {
  console.log('🎰 开始测试扑克游戏数据库集成...');
  
  try {
    // 检查是否在正确的页面
    if (!window.location.href.includes('localhost:3003')) {
      console.warn('⚠️ 请在 Point-Hive 应用页面运行此测试');
      return;
    }

    // 1. 测试创建扑克群组
    console.log('📋 1. 测试创建扑克群组功能...');
    
    // 导航到创建页面（如果不在的话）
    if (!window.location.pathname.includes('/groups/poker/create')) {
      console.log('🔀 正在导航到扑克群组创建页面...');
      window.location.href = '/groups/poker/create';
      console.log('✅ 请在页面加载后重新运行测试');
      return;
    }

    // 2. 检查扑克服务是否可用
    console.log('🔧 2. 检查扑克服务...');
    
    if (typeof window.pokerService !== 'undefined') {
      console.log('✅ 扑克服务已加载');
    } else {
      console.log('ℹ️ 扑克服务未在全局作用域，这是正常的（在 React 组件中使用）');
    }

    // 3. 验证数据库表结构
    console.log('🗄️ 3. 请手动验证数据库表结构...');
    console.log('请在 Supabase 控制台检查：');
    console.log('- groups 表是否有 metadata 列');
    console.log('- transactions 表是否有 metadata 列');
    console.log('- 是否支持 poker 群组类型');
    console.log('- 是否支持 system 交易类型');

    // 4. 提供测试步骤
    console.log('🎯 4. 手动测试步骤：');
    console.log('a) 创建一个新的扑克群组');
    console.log('b) 添加几个玩家');
    console.log('c) 设置初始筹码（如 2000）');
    console.log('d) 提交创建');
    console.log('e) 进入游戏页面进行筹码转移');
    console.log('f) 检查筹码守恒和排名计算');

    // 5. 数据库查询示例
    console.log('📊 5. Supabase 数据库查询示例：');
    console.log(`
-- 查看扑克群组
SELECT id, name, group_type, metadata->'pokerSettings' as poker_settings 
FROM groups 
WHERE group_type = 'poker';

-- 查看扑克交易
SELECT id, amount, type, status, metadata->'transferType' as transfer_type,
       metadata->'tags' as tags
FROM transactions 
WHERE metadata->'tags' ? 'poker';

-- 检查筹码守恒
SELECT 
  g.name,
  SUM(CASE WHEN t.type = 'system' THEN t.amount ELSE 0 END) as total_initial,
  SUM(CASE WHEN t.type = 'transfer' THEN t.amount ELSE 0 END) as total_transfers
FROM groups g
JOIN transactions t ON t.group_id = g.id
WHERE g.group_type = 'poker'
GROUP BY g.id, g.name;
    `);

    console.log('✅ 测试脚本执行完成！');
    console.log('💡 建议：创建一个测试扑克桌并进行几轮筹码转移来验证功能');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testPokerIntegration();

// 提供便捷的测试数据生成器
window.generateTestPokerData = function() {
  return {
    tableName: `测试桌${Date.now()}`,
    initialChips: 2000,
    smallBlind: 10,
    bigBlind: 20,
    maxPlayers: 6,
    gameType: 'cash',
    players: [
      { id: 'p1', name: 'Alice', isCreator: true },
      { id: 'p2', name: 'Bob', isCreator: false },
      { id: 'p3', name: 'Charlie', isCreator: false },
      { id: 'p4', name: 'David', isCreator: false }
    ]
  };
};

console.log('🎲 测试助手已加载！');
console.log('💡 使用 generateTestPokerData() 生成测试数据');