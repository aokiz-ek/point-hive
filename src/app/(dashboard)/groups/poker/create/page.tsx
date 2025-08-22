'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { useAuth } from '@/lib/hooks';
import { localPokerService } from '@/lib/services/local-poker-service';
import { generateId } from '@/lib/utils/local-storage';

interface PokerPlayer {
  id: string;
  name: string;
  isCreator: boolean;
  userId?: string;
  fullName?: string;
  creditScore?: number;
}

export default function CreatePokerGroupPage() {
  const router = useRouter();
  // Mock用户，避免登录依赖
  const user = { 
    id: 'mock-user-' + generateId(), 
    nickname: 'Wade'
  };
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 游戏专用表单状态
  const [formData, setFormData] = useState({
    tableName: '',
    initialChips: 2000,
    smallBlind: 10,
    bigBlind: 20,
    maxPlayers: 9,
    gameType: 'points' as 'points' | 'tournament'
  });

  // 玩家管理
  const [players, setPlayers] = useState<PokerPlayer[]>([
    {
      id: generateId(),
      name: user.nickname || '我',
      isCreator: true,
      userId: user.id
    }
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [showNameSuggestion, setShowNameSuggestion] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // 当游戏设置改变时，提示用户可以重新生成名称
    if (['gameType', 'smallBlind', 'bigBlind', 'initialChips', 'maxPlayers'].includes(field) && formData.tableName) {
      setShowNameSuggestion(true);
      // 3秒后自动隐藏提示
      setTimeout(() => setShowNameSuggestion(false), 3000);
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < formData.maxPlayers) {
      const newPlayer: PokerPlayer = {
        id: generateId(),
        name: newPlayerName.trim(),
        isCreator: false
      };
      
      // 检查是否重名
      const exists = players.some(p => p.name.toLowerCase() === newPlayer.name.toLowerCase());
      if (exists) {
        setErrors({ player: '玩家姓名不能重复' });
        return;
      }
      
      setPlayers(prev => [...prev, newPlayer]);
      setNewPlayerName('');
      setErrors(prev => ({ ...prev, player: '' }));
    }
  };

  const removePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => {
      // 保留创建者，不允许删除
      if (p.isCreator) return true;
      // 删除指定的非创建者玩家
      return p.id !== playerId;
    }));
  };

  const updatePlayerName = (playerId: string, newName: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, name: newName } : p
    ));
  };

  // 页面加载时自动生成AI名称
  useEffect(() => {
    // 延迟1秒后自动生成AI名称，给用户一个启动的感觉
    const timer = setTimeout(() => {
      if (!formData.tableName) { // 只有当名称为空时才自动生成
        generateAITableName();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 快速添加预设玩家
  const addPresetPlayers = () => {
    // 使用Mock数据，不调用接口
    const presetNames = ['Tomas', 'Sean', 'Iolo', 'Flynn', 'Jeff', 'David', 'Ray', 'GOGO', 'Yang'];
    const currentCount = players.length;
    const maxToAdd = Math.min(presetNames.length, formData.maxPlayers - currentCount);
    
    const newPlayers: PokerPlayer[] = presetNames.slice(0, maxToAdd).map(name => ({
      id: generateId(),
      name,
      isCreator: false
    }));
    
    setPlayers(prev => [...prev, ...newPlayers]);
  };

  // AI自动命名函数
  const generateAITableName = () => {
    setIsGeneratingName(true);
    setShowNameSuggestion(false); // 隐藏建议提示
    
    // 模拟AI思考时间
    setTimeout(() => {
      const generatedName = generateSmartTableName();
      handleInputChange('tableName', generatedName);
      setIsGeneratingName(false);
    }, 800);
  };

  const generateSmartTableName = () => {
    // 时间段
    const hour = new Date().getHours();
    const timeOfDay = hour < 6 ? '深夜' : 
                      hour < 12 ? '晨光' : 
                      hour < 18 ? '午后' : '夜幕';
    
    // 游戏强度（基于盲注与初始筹码比例）
    const intensity = formData.bigBlind / formData.initialChips;
    const gameIntensity = intensity > 0.05 ? '激战' :
                         intensity > 0.025 ? '对决' : '温和';
    
    // 房间规模
    const tableSize = formData.maxPlayers <= 4 ? '小房间' :
                      formData.maxPlayers <= 6 ? '标准' :
                      formData.maxPlayers <= 8 ? '大房间' : '超级';
    
    // 游戏类型风格
    const gameStyle = formData.gameType === 'points' ? '积分' : '锦标赛';
    
    // 创意名称模板库
    const nameTemplates = [
      // 经典风格
      `${timeOfDay}${gameIntensity}场`,
      `${tableSize}${gameStyle}局`,
      `${formData.smallBlind}/${formData.bigBlind}赛场`,
      
      // 文艺风格
      `${timeOfDay}积分传说`,
      `${gameIntensity}者联盟`,
      `${tableSize}玩家聚会`,
      
      // 趣味风格
      `${timeOfDay}猎鲨行动`,
      `${gameIntensity}积分工厂`,
      `${tableSize}积分风云`,
      
      // 专业风格
      `${formData.initialChips}积分战局`,
      `${formData.maxPlayers}人精英赛`,
      `盲注${formData.bigBlind}竞技场`,
      
      // 创意组合
      `${timeOfDay}${tableSize}传奇`,
      `${gameIntensity}积分帝国`,
      `${gameStyle}王者之战`,
      
      // 特色名称
      '积分梦工厂',
      '积分收割机',
      '积分风暴',
      '积分传说',
      '积分英雄',
      '积分猎人',
      '积分大师',
      '积分战神',
      '积分魔术师',
      '积分骑士团',
      
      // 时间特色
      `${timeOfDay}积分猎手`,
      `${timeOfDay}积分征服者`,
      `${timeOfDay}积分风暴`,
      
      // 盲注特色
      `${formData.smallBlind}起步传奇`,
      `${formData.bigBlind}大盲战场`,
      `盲注${formData.smallBlind}风云`,
      
      // 人数特色
      `${formData.maxPlayers}剑客决斗`,
      `${formData.maxPlayers}王者争霸`,
      `${formData.maxPlayers}人积分大战`,
      
      // 筹码特色
      `${formData.initialChips}起家致富`,
      `${formData.initialChips}积分帝国`,
      `${formData.initialChips}传奇之路`
    ];
    
    // 随机选择一个名称
    const randomIndex = Math.floor(Math.random() * nameTemplates.length);
    return nameTemplates[randomIndex];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tableName.trim()) {
      newErrors.tableName = '房间名称不能为空';
    }

    if (formData.initialChips < 100 || formData.initialChips > 100000) {
      newErrors.initialChips = '初始积分必须在100-100000之间';
    }

    if (formData.smallBlind < 1 || formData.smallBlind >= formData.bigBlind) {
      newErrors.smallBlind = '小盲必须小于大盲且大于0';
    }

    if (formData.bigBlind <= formData.smallBlind || formData.bigBlind > formData.initialChips / 10) {
      newErrors.bigBlind = '大盲设置不合理';
    }

    if (players.length < 2) {
      newErrors.players = '至少需要2个玩家';
    }

    if (players.length > formData.maxPlayers) {
      newErrors.players = `玩家数量不能超过${formData.maxPlayers}人`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);

    try {
      // 使用 localStorage 创建扑克群组
      const result = await localPokerService.createPokerGroup(user.id, formData, players);
      
      if (!result.success) {
        setErrors({ submit: result.error || '创建失败，请重试' });
        return;
      }

      // 跳转到DZ扑克专用管理页面
      router.push(`/groups/poker/${result.data.id}`);
      
    } catch (error) {
      console.error('创建积分游戏失败:', error);
      setErrors({ submit: '创建失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ak-space-y-4 sm:ak-space-y-6 ak-max-w-6xl ak-mx-auto ak-px-4 sm:ak-px-6 lg:ak-px-8">
      {/* 页面标题 */}
      <div className="ak-text-center ak-py-2 sm:ak-py-4">
        <h1 className="ak-text-2xl sm:ak-text-3xl ak-font-bold ak-text-gray-900 ak-mb-2">🎯 创建游戏房间</h1>
        <p className="ak-text-sm sm:ak-text-base ak-text-gray-600">快速设置积分游戏，管理玩家积分</p>
      </div>

      <form onSubmit={handleSubmit} className="ak-space-y-4 sm:ak-space-y-6">
        {/* 基本设置 */}
        <Card className="ak-p-4 sm:ak-p-6">
          <h2 className="ak-text-lg sm:ak-text-xl ak-font-semibold ak-mb-3 sm:ak-mb-4">🎯 游戏设置</h2>
          
          <div className="ak-grid ak-grid-cols-1 lg:ak-grid-cols-2 ak-gap-4 sm:ak-gap-6">
            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                房间名称 <span className="ak-text-red-500">*</span>
              </label>
              <div className="ak-flex ak-flex-col sm:ak-flex-row ak-gap-2 sm:ak-space-x-0">
                <Input
                  value={formData.tableName}
                  onChange={(e) => handleInputChange('tableName', e.target.value)}
                  placeholder="例如：周五夜战"
                  maxLength={30}
                  className="ak-flex-1"
                />
                <Button
                  type="button"
                  onClick={generateAITableName}
                  disabled={isGeneratingName}
                  size="sm"
                  variant="outline"
                  className="ak-min-w-[100px] sm:ak-min-w-[80px] ak-flex ak-items-center ak-justify-center ak-space-x-1 ak-min-h-[40px]"
                >
                  {isGeneratingName ? (
                    <>
                      <div className="ak-w-4 ak-h-4 ak-border-2 ak-border-blue-500 ak-border-t-transparent ak-rounded-full ak-animate-spin"></div>
                      <span className="ak-hidden sm:ak-inline">思考中</span>
                      <span className="sm:ak-hidden">AI思考中</span>
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      <span className="ak-hidden sm:ak-inline">AI命名</span>
                      <span className="sm:ak-hidden">AI生成</span>
                    </>
                  )}
                </Button>
              </div>
              {isGeneratingName && (
                <p className="ak-text-xs ak-text-blue-600 ak-mt-1 ak-flex ak-items-center ak-space-x-1">
                  <span>AI正在基于游戏设置生成创意名称...</span>
                </p>
              )}
              {!isGeneratingName && formData.tableName && !showNameSuggestion && (
                <p className="ak-text-xs ak-text-gray-500 ak-mt-1">
                  💡 不满意？可以多次点击AI命名获得更多创意，或手动编辑
                </p>
              )}
              {showNameSuggestion && (
                <p className="ak-text-xs ak-text-amber-600 ak-mt-1 ak-flex ak-items-center ak-space-x-1 ak-animate-pulse">
                  <span>⚡</span>
                  <span>游戏设置已更改，点击AI命名获取更匹配的名称</span>
                </p>
              )}
              {errors.tableName && (
                <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.tableName}</p>
              )}
            </div>

            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                游戏类型
              </label>
              <select
                value={formData.gameType}
                onChange={(e) => handleInputChange('gameType', e.target.value)}
                className="ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500"
              >
                <option value="points">积分模式</option>
                <option value="tournament">锦标赛</option>
              </select>
            </div>

            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                初始积分 <span className="ak-text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.initialChips}
                onChange={(e) => handleInputChange('initialChips', parseInt(e.target.value))}
                min={100}
                max={100000}
                step={50}
              />
              {errors.initialChips && (
                <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.initialChips}</p>
              )}
            </div>

            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                最大玩家数
              </label>
              <select
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
                className="ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}人游戏</option>
                ))}
              </select>
            </div>

            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                小盲注 <span className="ak-text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.smallBlind}
                onChange={(e) => handleInputChange('smallBlind', parseInt(e.target.value))}
                min={1}
                max={formData.initialChips / 20}
              />
              {errors.smallBlind && (
                <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.smallBlind}</p>
              )}
            </div>

            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                大盲注 <span className="ak-text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.bigBlind}
                onChange={(e) => handleInputChange('bigBlind', parseInt(e.target.value))}
                min={formData.smallBlind + 1}
                max={formData.initialChips / 10}
              />
              {errors.bigBlind && (
                <p className="ak-text-sm ak-text-red-500 ak-mt-1">{errors.bigBlind}</p>
              )}
            </div>
          </div>
        </Card>

        {/* 玩家管理 */}
        <Card className="ak-p-4 sm:ak-p-6">
          <div className="ak-flex ak-items-center ak-justify-between ak-mb-3 sm:ak-mb-4">
            <h2 className="ak-text-lg sm:ak-text-xl ak-font-semibold">👥 玩家管理</h2>
            <div className="ak-text-xs sm:ak-text-sm ak-text-gray-500 ak-bg-gray-100 ak-px-2 ak-py-1 ak-rounded">
              {players.length} / {formData.maxPlayers} 人
            </div>
          </div>

          {/* 添加玩家 */}
          <div className="ak-flex ak-flex-col sm:ak-flex-row ak-gap-2 sm:ak-space-x-3 sm:ak-space-y-0 ak-mb-4">
            <Input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="输入玩家姓名"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlayer())}
              maxLength={20}
              className="ak-flex-1"
            />
            <div className="ak-flex ak-gap-2 sm:ak-gap-3">
              <Button 
                type="button" 
                onClick={addPlayer} 
                size="sm" 
                disabled={players.length >= formData.maxPlayers}
                className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px]"
              >
                <span className="ak-hidden sm:ak-inline">添加玩家</span>
                <span className="sm:ak-hidden">添加</span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={addPresetPlayers} 
                size="sm"
                className="ak-flex-1 sm:ak-flex-none ak-min-h-[40px]"
              >
                <span className="ak-hidden sm:ak-inline">快速填充</span>
                <span className="sm:ak-hidden">填充</span>
              </Button>
            </div>
          </div>

          {errors.player && (
            <p className="ak-text-sm ak-text-red-500 ak-mb-3">{errors.player}</p>
          )}

          {/* 玩家列表 */}
          <div className="ak-grid ak-grid-cols-1 sm:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-2 sm:ak-gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`ak-flex ak-items-center ak-justify-between ak-p-2 sm:ak-p-3 ak-rounded-lg ak-border ak-transition-colors ${
                  player.isCreator 
                    ? 'ak-border-blue-200 ak-bg-blue-50' 
                    : 'ak-border-gray-200 ak-bg-gray-50 ak-hover:bg-gray-100'
                }`}
              >
                <div className="ak-flex ak-items-center ak-space-x-2 ak-min-w-0 ak-flex-1">
                  <span className="ak-text-sm ak-font-medium ak-flex-shrink-0">
                    {player.isCreator ? '👑' : '🎭'}
                  </span>
                  {player.isCreator ? (
                    <span className="ak-text-xs sm:ak-text-sm ak-font-medium ak-text-blue-700 ak-truncate">
                      {player.name} (你)
                    </span>
                  ) : (
                    <Input
                      value={player.name}
                      onChange={(e) => updatePlayerName(player.id, e.target.value)}
                      className="ak-text-xs sm:ak-text-sm ak-border-0 ak-bg-transparent ak-p-1 ak-focus:bg-white ak-focus:border ak-focus:border-gray-300 ak-min-w-0"
                      maxLength={20}
                    />
                  )}
                </div>
                
                <div className="ak-flex ak-items-center ak-space-x-1 sm:ak-space-x-2 ak-flex-shrink-0">
                  <span className="ak-text-xs ak-text-gray-500 ak-whitespace-nowrap">
                    <span className="ak-hidden sm:ak-inline">{formData.initialChips} 积分</span>
                    <span className="sm:ak-hidden">{formData.initialChips}</span>
                  </span>
                  {!player.isCreator && (
                    <button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      className="ak-text-red-500 hover:ak-text-red-700 ak-text-sm ak-p-1 ak-min-h-[24px] ak-min-w-[24px] ak-flex ak-items-center ak-justify-center ak-rounded hover:ak-bg-red-50 ak-transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {errors.players && (
            <p className="ak-text-sm ak-text-red-500 ak-mt-3">{errors.players}</p>
          )}
        </Card>

        {/* 游戏信息摘要 */}
        <Card className="ak-p-4 sm:ak-p-6 ak-bg-blue-50 ak-border-blue-200">
          <h3 className="ak-text-base sm:ak-text-lg ak-font-semibold ak-text-blue-800 ak-mb-3">📊 游戏摘要</h3>
          <div className="ak-grid ak-grid-cols-2 lg:ak-grid-cols-4 ak-gap-3 sm:ak-gap-4 ak-text-xs sm:ak-text-sm">
            <div className="ak-text-center sm:ak-text-left ak-p-2 sm:ak-p-3 ak-bg-white/50 ak-rounded-lg">
              <div className="ak-text-gray-600 ak-mb-1">总玩家</div>
              <div className="ak-text-base sm:ak-text-lg ak-font-semibold ak-text-blue-700">{players.length}人</div>
            </div>
            <div className="ak-text-center sm:ak-text-left ak-p-2 sm:ak-p-3 ak-bg-white/50 ak-rounded-lg">
              <div className="ak-text-gray-600 ak-mb-1">总积分池</div>
              <div className="ak-text-base sm:ak-text-lg ak-font-semibold ak-text-blue-700">
                {(formData.initialChips * players.length).toLocaleString()}
              </div>
            </div>
            <div className="ak-text-center sm:ak-text-left ak-p-2 sm:ak-p-3 ak-bg-white/50 ak-rounded-lg">
              <div className="ak-text-gray-600 ak-mb-1">盲注结构</div>
              <div className="ak-text-base sm:ak-text-lg ak-font-semibold ak-text-blue-700">
                {formData.smallBlind}/{formData.bigBlind}
              </div>
            </div>
            <div className="ak-text-center sm:ak-text-left ak-p-2 sm:ak-p-3 ak-bg-white/50 ak-rounded-lg">
              <div className="ak-text-gray-600 ak-mb-1">买入倍数</div>
              <div className="ak-text-base sm:ak-text-lg ak-font-semibold ak-text-blue-700">
                {Math.floor(formData.initialChips / formData.bigBlind)}BB
              </div>
            </div>
          </div>
        </Card>

        {/* 错误信息 */}
        {errors.submit && (
          <div className="ak-bg-red-50 ak-border ak-border-red-200 ak-rounded-md ak-p-3">
            <p className="ak-text-sm ak-text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="ak-flex ak-flex-col sm:ak-flex-row ak-justify-center ak-gap-3 sm:ak-space-x-4 sm:ak-space-y-0 ak-pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            size="lg"
            className="ak-w-full sm:ak-w-auto ak-min-w-[120px] ak-min-h-[48px]"
          >
            取消
          </Button>
          <Button 
            type="submit" 
            disabled={loading} 
            size="lg" 
            className="ak-w-full sm:ak-w-auto ak-min-w-[140px] ak-min-h-[48px] ak-bg-blue-600 ak-hover:bg-blue-700"
          >
            {loading ? (
              <div className="ak-flex ak-items-center ak-space-x-2">
                <div className="ak-w-4 ak-h-4 ak-border-2 ak-border-white ak-border-t-transparent ak-rounded-full ak-animate-spin"></div>
                <span>创建中...</span>
              </div>
            ) : (
              <>
                <span className="ak-hidden sm:ak-inline">🚀 开始游戏</span>
                <span className="sm:ak-hidden">🚀 开始</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}