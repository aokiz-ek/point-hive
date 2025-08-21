'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, generateId } from '@/lib/utils/local-storage';
import type { Group } from '@/lib/types';

interface PokerPlayer {
  id: string;
  name: string;
  isCreator?: boolean;
}

export default function CreatePokerGroupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // DZ扑克专用表单状态
  const [formData, setFormData] = useState({
    tableName: '',
    initialChips: 2000,
    smallBlind: 10,
    bigBlind: 20,
    maxPlayers: 9,
    gameType: 'cash' as 'cash' | 'tournament'
  });

  // 玩家管理
  const [players, setPlayers] = useState<PokerPlayer[]>([
    {
      id: generateId(),
      name: user?.nickname || '我',
      isCreator: true
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
    setPlayers(prev => prev.filter(p => p.id !== playerId && !p.isCreator));
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
    
    // 桌子规模
    const tableSize = formData.maxPlayers <= 4 ? '紧桌' :
                      formData.maxPlayers <= 6 ? '标准' :
                      formData.maxPlayers <= 8 ? '大桌' : '超级';
    
    // 游戏类型风格
    const gameStyle = formData.gameType === 'cash' ? '现金' : '锦标赛';
    
    // 创意名称模板库
    const nameTemplates = [
      // 经典风格
      `${timeOfDay}${gameIntensity}桌`,
      `${tableSize}${gameStyle}局`,
      `${formData.smallBlind}/${formData.bigBlind}赛场`,
      
      // 文艺风格
      `${timeOfDay}筹码传说`,
      `${gameIntensity}者联盟`,
      `${tableSize}牌手聚会`,
      
      // 趣味风格
      `${timeOfDay}猎鲨行动`,
      `${gameIntensity}筹码工厂`,
      `${tableSize}德扑风云`,
      
      // 专业风格
      `${formData.initialChips}筹码战局`,
      `${formData.maxPlayers}人精英赛`,
      `盲注${formData.bigBlind}竞技场`,
      
      // 创意组合
      `${timeOfDay}${tableSize}传奇`,
      `${gameIntensity}筹码帝国`,
      `${gameStyle}王者之战`,
      
      // 特色名称
      '德扑梦工厂',
      '筹码收割机',
      '牌桌风暴',
      '全压传说',
      '河牌英雄',
      '底牌猎人',
      '翻牌大师',
      '转牌战神',
      '筹码魔术师',
      '德扑骑士团',
      
      // 时间特色
      `${timeOfDay}筹码猎手`,
      `${timeOfDay}牌桌征服者`,
      `${timeOfDay}德扑风暴`,
      
      // 盲注特色
      `${formData.smallBlind}起步传奇`,
      `${formData.bigBlind}大盲战场`,
      `盲注${formData.smallBlind}风云`,
      
      // 人数特色
      `${formData.maxPlayers}剑客决斗`,
      `${formData.maxPlayers}王者争霸`,
      `${formData.maxPlayers}人筹码大战`,
      
      // 筹码特色
      `${formData.initialChips}起家致富`,
      `${formData.initialChips}筹码帝国`,
      `${formData.initialChips}传奇之路`
    ];
    
    // 随机选择一个名称
    const randomIndex = Math.floor(Math.random() * nameTemplates.length);
    return nameTemplates[randomIndex];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tableName.trim()) {
      newErrors.tableName = '牌桌名称不能为空';
    }

    if (formData.initialChips < 100 || formData.initialChips > 100000) {
      newErrors.initialChips = '初始筹码必须在100-100000之间';
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
      const pokerGroup: Group = {
        id: generateId(),
        name: `🃏 ${formData.tableName}`,
        description: `DZ扑克 ${formData.gameType === 'cash' ? '现金桌' : '锦标赛'} - ${formData.smallBlind}/${formData.bigBlind} 盲注`,
        ownerId: user.id,
        adminIds: [user.id],
        memberIds: players.map(p => p.isCreator ? user.id : p.id),
        maxMembers: formData.maxPlayers,
        totalPoints: formData.initialChips * players.length,
        isPublic: false,
        tags: ['DZ扑克', formData.gameType, '筹码管理'],
        inviteCode: generateId().slice(0, 6).toUpperCase(),
        status: 'active' as const,
        rules: {
          maxTransferAmount: formData.initialChips * 2, // 最大转移金额为初始筹码2倍
          maxPendingAmount: formData.initialChips * 3,
          defaultReturnPeriod: 1, // DZ扑克场景，1天内结算
          creditScoreThreshold: 500, // 降低信用门槛
          allowAnonymousTransfer: true, // 允许匿名转移
          requireApproval: false, // 不需要审批
          autoReminderEnabled: true,
          allowPartialReturn: true,
          dailyTransferLimit: formData.initialChips * 10,
          memberJoinApproval: false
        },
        settings: {
          autoAcceptTransfers: true, // 自动接受转移
          notificationSound: true,
          showMemberActivity: true,
          allowMemberInvite: false, // 不允许成员邀请
          requireVerifiedEmail: false,
          requireVerifiedPhone: false,
          enableCreditLimit: false, // 禁用信用限制
          enableTimeLimit: false,
          pointsPerMember: formData.initialChips
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 添加DZ扑克专用元数据
      (pokerGroup as any).pokerSettings = {
        gameType: formData.gameType,
        smallBlind: formData.smallBlind,
        bigBlind: formData.bigBlind,
        initialChips: formData.initialChips,
        playerNames: players.map(p => ({ id: p.id, name: p.name, isCreator: p.isCreator })),
        sessionStartTime: new Date().toISOString(),
        gameStatus: 'active'
      };

      // 保存群组到本地存储
      LocalStorage.addGroup(pokerGroup);

      // 为每个玩家创建初始筹码记录
      players.forEach(player => {
        const initialTransaction = {
          id: generateId(),
          type: 'system' as const,
          fromUserId: 'system',
          toUserId: player.isCreator ? user.id : player.id,
          amount: formData.initialChips,
          status: 'completed' as const,
          description: `DZ扑克初始筹码 - 玩家: ${player.name}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          groupId: pokerGroup.id,
          metadata: {
            tags: ['poker', 'initial_chips', formData.gameType],
            priority: 'normal' as const,
            playerName: player.name,
            isCreator: player.isCreator || false
          }
        };
        LocalStorage.addTransaction(initialTransaction);
      });

      // 跳转到DZ扑克专用管理页面
      router.push(`/groups/poker/${pokerGroup.id}`);
      
    } catch (error) {
      console.error('创建DZ扑克桌失败:', error);
      setErrors({ submit: '创建失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ak-space-y-6 ak-max-w-4xl ak-mx-auto">
      {/* 页面标题 */}
      <div className="ak-text-center">
        <h1 className="ak-text-3xl ak-font-bold ak-text-gray-900 ak-mb-2">🃏 创建DZ扑克桌</h1>
        <p className="ak-text-gray-600">快速设置DZ扑克游戏，管理玩家筹码</p>
      </div>

      <form onSubmit={handleSubmit} className="ak-space-y-6">
        {/* 基本设置 */}
        <Card className="ak-p-6">
          <h2 className="ak-text-xl ak-font-semibold ak-mb-4">🎯 游戏设置</h2>
          
          <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 ak-gap-6">
            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                牌桌名称 <span className="ak-text-red-500">*</span>
              </label>
              <div className="ak-flex ak-space-x-2">
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
                  className="ak-min-w-[100px] ak-flex ak-items-center ak-space-x-1"
                >
                  {isGeneratingName ? (
                    <>
                      <div className="ak-w-4 ak-h-4 ak-border-2 ak-border-blue-500 ak-border-t-transparent ak-rounded-full ak-animate-spin"></div>
                      <span>思考中</span>
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      <span>AI命名</span>
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
                <option value="cash">现金桌</option>
                <option value="tournament">锦标赛</option>
              </select>
            </div>

            <div>
              <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                初始筹码 <span className="ak-text-red-500">*</span>
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
                  <option key={num} value={num}>{num}人桌</option>
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
        <Card className="ak-p-6">
          <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
            <h2 className="ak-text-xl ak-font-semibold">👥 玩家管理</h2>
            <div className="ak-text-sm ak-text-gray-500">
              {players.length} / {formData.maxPlayers} 人
            </div>
          </div>

          {/* 添加玩家 */}
          <div className="ak-flex ak-items-center ak-space-x-3 ak-mb-4">
            <Input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="输入玩家姓名"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlayer())}
              maxLength={20}
            />
            <Button type="button" onClick={addPlayer} size="sm" disabled={players.length >= formData.maxPlayers}>
              添加玩家
            </Button>
            <Button type="button" variant="outline" onClick={addPresetPlayers} size="sm">
              快速填充
            </Button>
          </div>

          {errors.player && (
            <p className="ak-text-sm ak-text-red-500 ak-mb-3">{errors.player}</p>
          )}

          {/* 玩家列表 */}
          <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`ak-flex ak-items-center ak-justify-between ak-p-3 ak-rounded-lg ak-border ${
                  player.isCreator 
                    ? 'ak-border-blue-200 ak-bg-blue-50' 
                    : 'ak-border-gray-200 ak-bg-gray-50'
                }`}
              >
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <span className="ak-text-sm ak-font-medium">
                    {player.isCreator ? '👑' : '🎭'}
                  </span>
                  {player.isCreator ? (
                    <span className="ak-text-sm ak-font-medium ak-text-blue-700">
                      {player.name} (你)
                    </span>
                  ) : (
                    <Input
                      value={player.name}
                      onChange={(e) => updatePlayerName(player.id, e.target.value)}
                      className="ak-text-sm ak-border-0 ak-bg-transparent ak-p-1 ak-focus:bg-white ak-focus:border ak-focus:border-gray-300"
                      maxLength={20}
                    />
                  )}
                </div>
                
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <span className="ak-text-xs ak-text-gray-500">
                    {formData.initialChips} 筹码
                  </span>
                  {!player.isCreator && (
                    <button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      className="ak-text-red-500 hover:ak-text-red-700 ak-text-sm"
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
        <Card className="ak-p-6 ak-bg-blue-50">
          <h3 className="ak-text-lg ak-font-semibold ak-text-blue-800 ak-mb-3">📊 游戏摘要</h3>
          <div className="ak-grid ak-grid-cols-2 md:ak-grid-cols-4 ak-gap-4 ak-text-sm">
            <div>
              <div className="ak-text-gray-600">总玩家</div>
              <div className="ak-text-lg ak-font-semibold ak-text-blue-700">{players.length}人</div>
            </div>
            <div>
              <div className="ak-text-gray-600">总筹码池</div>
              <div className="ak-text-lg ak-font-semibold ak-text-blue-700">
                {(formData.initialChips * players.length).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="ak-text-gray-600">盲注结构</div>
              <div className="ak-text-lg ak-font-semibold ak-text-blue-700">
                {formData.smallBlind}/{formData.bigBlind}
              </div>
            </div>
            <div>
              <div className="ak-text-gray-600">买入倍数</div>
              <div className="ak-text-lg ak-font-semibold ak-text-blue-700">
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
        <div className="ak-flex ak-justify-center ak-space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            size="lg"
          >
            取消
          </Button>
          <Button type="submit" disabled={loading} size="lg" className="ak-min-w-32">
            {loading ? '创建中...' : '🚀 开始游戏'}
          </Button>
        </div>
      </form>
    </div>
  );
}