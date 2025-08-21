'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditScore, PointsDisplay } from '@/components/ui';
import { useAuth } from '@/lib/hooks';

interface GamePlayer {
  id: string;
  name: string;
  avatar?: string;
  balance: number;
  creditScore: number;
  isOnline: boolean;
  gameScore?: number;
  finalBalance?: number;
}

interface GameSession {
  id: string;
  name: string;
  players: GamePlayer[];
  status: 'preparing' | 'active' | 'settling' | 'completed';
  createdAt: string;
  completedAt?: string;
  totalPool: number;
}

export default function MultiplayerGamingPage() {
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [gameType, setGameType] = useState<'王者荣耀' | '英雄联盟' | '桌游' | '电竞'>('王者荣耀');
  const [betAmount, setBetAmount] = useState(100);
  const [gameResults, setGameResults] = useState<{[playerId: string]: number}>({});

  const { user } = useAuth();

  // 模拟多人游戏成员数据
  const availablePlayers: GamePlayer[] = [
    {
      id: 'test-user-01',
      name: '游戏主持人',
      balance: 5000,
      creditScore: 920,
      isOnline: true
    },
    {
      id: 'test-user-02',
      name: '职业玩家',
      balance: 3200,
      creditScore: 850,
      isOnline: true
    },
    {
      id: 'test-user-03',
      name: '休闲玩家',
      balance: 1800,
      creditScore: 750,
      isOnline: true
    },
    {
      id: 'test-user-04',
      name: '队伍队长',
      balance: 4100,
      creditScore: 880,
      isOnline: false
    },
    {
      id: 'test-user-05',
      name: '策略专家',
      balance: 2600,
      creditScore: 800,
      isOnline: true
    },
    {
      id: 'test-user-06',
      name: '新手玩家',
      balance: 900,
      creditScore: 650,
      isOnline: false
    },
    {
      id: 'test-user-07',
      name: '老玩家',
      balance: 6800,
      creditScore: 950,
      isOnline: true
    },
    {
      id: 'test-user-08',
      name: '直播玩家',
      balance: 3900,
      creditScore: 820,
      isOnline: true
    }
  ];

  // 创建游戏会话
  const createGameSession = () => {
    if (selectedPlayers.length < 4) {
      alert('至少需要4名玩家才能开始游戏');
      return;
    }

    const sessionPlayers: GamePlayer[] = selectedPlayers
      .map(playerId => {
        const player = availablePlayers.find(p => p.id === playerId);
        if (!player) return null;
        return {
          ...player,
          gameScore: 0,
          finalBalance: player.balance
        } as GamePlayer;
      })
      .filter((player): player is GamePlayer => player !== null);

    const newSession: GameSession = {
      id: `game-${Date.now()}`,
      name: `${gameType}积分赛 - ${new Date().toLocaleTimeString()}`,
      players: sessionPlayers,
      status: 'preparing',
      createdAt: new Date().toISOString(),
      totalPool: betAmount * sessionPlayers.length
    };

    setActiveSession(newSession);
  };

  // 开始游戏
  const startGame = () => {
    if (!activeSession) return;
    
    setActiveSession({
      ...activeSession,
      status: 'active'
    });

    // 模拟游戏进行（5秒后自动结束进入结算阶段）
    setTimeout(() => {
      setActiveSession(prev => prev ? {
        ...prev,
        status: 'settling'
      } : null);
    }, 5000);
  };

  // 输入游戏结果
  const handleGameResult = (playerId: string, score: number) => {
    setGameResults(prev => ({
      ...prev,
      [playerId]: score
    }));
  };

  // 快速结算
  const quickSettle = async () => {
    if (!activeSession) return;

    // 计算积分分配
    const sortedResults = activeSession.players
      .map(player => ({
        ...player,
        gameScore: gameResults[player.id] || 0
      }))
      .sort((a, b) => b.gameScore - a.gameScore);

    const totalPool = activeSession.totalPool;
    const distribution = [
      totalPool * 0.5, // 第1名
      totalPool * 0.3, // 第2名  
      totalPool * 0.2, // 第3名
      0, 0, 0, 0, 0    // 其他名次
    ];

    // 执行积分转移
    for (let i = 0; i < sortedResults.length; i++) {
      const player = sortedResults[i];
      if (!player) continue; // 空值检查
      
      const winAmount = distribution[i] || 0;
      
      if (winAmount > 0) {
        player.finalBalance = player.balance + winAmount - betAmount;
      } else {
        player.finalBalance = player.balance - betAmount;
      }
    }

    setActiveSession({
      ...activeSession,
      players: sortedResults,
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  };

  // 重置游戏
  const resetGame = () => {
    setActiveSession(null);
    setSelectedPlayers([]);
    setGameResults({});
  };

  if (!activeSession) {
    return (
      <div className="ak-space-y-6 ak-p-4">
        {/* 页面标题 */}
        <div className="ak-text-center ak-py-6">
          <h1 className="ak-text-3xl ak-font-bold ak-text-gray-900 ak-mb-2">
            🎮 多人游戏积分管理
          </h1>
          <p className="ak-text-gray-600">支持6+人的实时积分管理和快速结算</p>
        </div>

        {/* 游戏类型选择 */}
        <Card className="ak-p-6">
          <h2 className="ak-text-lg ak-font-semibold ak-mb-4">选择游戏类型</h2>
          <div className="ak-grid ak-grid-cols-2 md:ak-grid-cols-4 ak-gap-4">
            {(['王者荣耀', '英雄联盟', '桌游', '电竞'] as const).map((type) => (
              <Button
                key={type}
                variant={gameType === type ? 'default' : 'outline'}
                onClick={() => setGameType(type)}
                className="ak-h-20 ak-flex ak-flex-col"
              >
                <span className="ak-text-2xl ak-mb-1">
                  {type === '王者荣耀' ? '⚔️' : type === '英雄联盟' ? '🏆' : type === '桌游' ? '🎲' : '🎯'}
                </span>
                <span>{type}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* 下注金额设置 */}
        <Card className="ak-p-6">
          <h2 className="ak-text-lg ak-font-semibold ak-mb-4">设置下注金额</h2>
          <div className="ak-flex ak-items-center ak-space-x-4">
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value) || 100)}
              className="ak-w-32"
              min="50"
              max="1000"
            />
            <span className="ak-text-gray-600">积分/人</span>
            <div className="ak-flex ak-space-x-2">
              {[50, 100, 200, 500].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>
          <p className="ak-text-sm ak-text-gray-500 ak-mt-2">
            总奖金池：{(betAmount * selectedPlayers.length).toLocaleString()} 积分
          </p>
        </Card>

        {/* 玩家选择 */}
        <Card className="ak-p-6">
          <h2 className="ak-text-lg ak-font-semibold ak-mb-4">
            选择参与玩家 ({selectedPlayers.length}/8)
          </h2>
          <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 ak-gap-4">
            {availablePlayers.map((player) => (
              <div
                key={player.id}
                className={`ak-p-4 ak-border ak-rounded-lg ak-cursor-pointer ak-transition-all ${
                  selectedPlayers.includes(player.id)
                    ? 'ak-border-blue-500 ak-bg-blue-50'
                    : player.isOnline 
                    ? 'ak-border-gray-200 hover:ak-border-gray-300'
                    : 'ak-border-gray-100 ak-bg-gray-50 ak-opacity-60'
                }`}
                onClick={() => {
                  if (!player.isOnline) return;
                  
                  if (selectedPlayers.includes(player.id)) {
                    setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                  } else if (selectedPlayers.length < 8) {
                    setSelectedPlayers([...selectedPlayers, player.id]);
                  }
                }}
              >
                <div className="ak-flex ak-items-center ak-justify-between">
                  <div className="ak-flex ak-items-center ak-space-x-3">
                    <div className="ak-w-10 ak-h-10 ak-bg-gray-200 ak-rounded-full ak-flex ak-items-center ak-justify-center ak-relative">
                      {player.isOnline && (
                        <div className="ak-absolute ak-w-3 ak-h-3 ak-bg-green-500 ak-rounded-full ak-border-2 ak-border-white -ak-top-1 -ak-right-1"></div>
                      )}
                      <span className="ak-font-semibold ak-text-gray-700">
                        {player.name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="ak-font-medium ak-text-gray-900">{player.name}</h3>
                      <div className="ak-flex ak-items-center ak-space-x-2 ak-text-sm">
                        <PointsDisplay balance={player.balance} size="sm" />
                        <CreditScore score={player.creditScore} size="sm" />
                      </div>
                    </div>
                  </div>
                  
                  {selectedPlayers.includes(player.id) && (
                    <div className="ak-w-6 ak-h-6 ak-bg-blue-500 ak-text-white ak-rounded-full ak-flex ak-items-center ak-justify-center">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="ak-mt-6 ak-flex ak-justify-between ak-items-center">
            <div className="ak-text-sm ak-text-gray-600">
              已选择 {selectedPlayers.length} 名玩家 · 需要至少4人开始游戏
            </div>
            <Button
              onClick={createGameSession}
              disabled={selectedPlayers.length < 4}
              className="ak-px-8"
            >
              创建游戏会话
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="ak-space-y-6 ak-p-4">
      {/* 游戏会话状态 */}
      <Card className="ak-p-6 ak-bg-gradient-to-r ak-from-purple-50 ak-to-pink-50">
        <div className="ak-flex ak-items-center ak-justify-between ak-mb-4">
          <div>
            <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">
              {activeSession.name}
            </h1>
            <p className="ak-text-gray-600">
              {activeSession.status === 'preparing' && '🎮 准备中 - 等待开始'}
              {activeSession.status === 'active' && '⚡ 游戏进行中 - 实时对战'}
              {activeSession.status === 'settling' && '💰 结算中 - 输入成绩'}
              {activeSession.status === 'completed' && '✅ 已完成 - 结算完毕'}
            </p>
          </div>
          
          <div className="ak-text-right">
            <div className="ak-text-sm ak-text-gray-600">总奖金池</div>
            <div className="ak-text-2xl ak-font-bold ak-text-purple-600">
              {(activeSession.totalPool || 0).toLocaleString()} 积分
            </div>
          </div>
        </div>

        {/* 游戏控制按钮 */}
        <div className="ak-flex ak-space-x-3">
          {activeSession.status === 'preparing' && (
            <Button onClick={startGame} size="lg" className="ak-px-8">
              🚀 开始游戏
            </Button>
          )}
          
          {activeSession.status === 'settling' && (
            <Button onClick={quickSettle} size="lg" className="ak-px-8">
              ⚡ 快速结算 (&lt; 30秒)
            </Button>
          )}
          
          {activeSession.status === 'completed' && (
            <Button onClick={resetGame} size="lg" className="ak-px-8">
              🔄 开始新游戏
            </Button>
          )}
          
          <Button variant="outline" onClick={resetGame}>
            取消游戏
          </Button>
        </div>
      </Card>

      {/* 玩家实时状态 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-4">
        {activeSession.players.map((player) => (
          <Card key={player.id} className="ak-p-4">
            <div className="ak-flex ak-items-center ak-space-x-3 ak-mb-3">
              <div className="ak-w-12 ak-h-12 ak-bg-gray-200 ak-rounded-full ak-flex ak-items-center ak-justify-center">
                <span className="ak-font-semibold ak-text-gray-700">
                  {player.name[0]}
                </span>
              </div>
              <div>
                <h3 className="ak-font-medium ak-text-gray-900">{player.name}</h3>
                <div className="ak-flex ak-items-center ak-space-x-2">
                  <CreditScore score={player.creditScore} size="sm" />
                  {player.isOnline && (
                    <span className="ak-bg-green-100 ak-text-green-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                      在线
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="ak-space-y-2">
              <div className="ak-flex ak-justify-between ak-text-sm">
                <span className="ak-text-gray-600">初始余额</span>
                <PointsDisplay balance={player.balance} size="sm" />
              </div>
              
              <div className="ak-flex ak-justify-between ak-text-sm">
                <span className="ak-text-gray-600">下注金额</span>
                <span className="ak-text-red-600">-{betAmount}</span>
              </div>

              {activeSession.status === 'settling' && (
                <div className="ak-flex ak-justify-between ak-items-center ak-text-sm">
                  <span className="ak-text-gray-600">游戏得分</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="ak-w-20 ak-h-8 ak-text-right"
                    value={gameResults[player.id] || ''}
                    onChange={(e) => handleGameResult(player.id, parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              {activeSession.status === 'completed' && (
                <>
                  <div className="ak-flex ak-justify-between ak-text-sm">
                    <span className="ak-text-gray-600">游戏得分</span>
                    <span className="ak-font-bold">{player.gameScore || 0}</span>
                  </div>
                  <div className="ak-flex ak-justify-between ak-text-sm ak-font-bold">
                    <span className="ak-text-gray-600">最终余额</span>
                    <span className={player.finalBalance! > player.balance ? 'ak-text-green-600' : 'ak-text-red-600'}>
                      {player.finalBalance?.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 实时进度显示 */}
      {activeSession.status === 'active' && (
        <Card className="ak-p-6 ak-text-center">
          <div className="ak-text-6xl ak-mb-4">🎮</div>
          <h2 className="ak-text-xl ak-font-bold ak-text-gray-900 ak-mb-2">
            游戏进行中...
          </h2>
          <p className="ak-text-gray-600">
            玩家正在激烈对战，系统将自动监控游戏状态
          </p>
          <div className="ak-w-full ak-bg-gray-200 ak-rounded-full ak-h-2 ak-mt-4">
            <div className="ak-bg-blue-600 ak-h-2 ak-rounded-full ak-animate-pulse" style={{width: '60%'}}></div>
          </div>
        </Card>
      )}
    </div>
  );
}