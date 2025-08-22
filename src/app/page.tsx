'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Gamepad2, 
  Users, 
  Trophy, 
  Clock,
  Plus,
  ArrowRight 
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalGames: 12,
    activeGames: 3,
    totalPlayers: 28,
    totalChips: 156000,
  });

  return (
    <div className="ak-space-y-8 ak-max-w-6xl ak-mx-auto">
      {/* 欢迎标题 */}
      <div className="ak-text-center ak-space-y-4">
        <h1 className="ak-text-4xl ak-font-bold ak-text-gray-900">🎯 Point-Hive 积分管理</h1>
        <p className="ak-text-xl ak-text-gray-600">专业的积分管理平台</p>
        <p className="ak-text-gray-500">轻松管理游戏，精确记录积分流动</p>
      </div>

      {/* 创建游戏房间卡片 */}
      <div className="ak-flex ak-justify-center">
        <Card className="ak-w-full ak-max-w-2xl ak-p-8 ak-bg-gradient-to-br ak-from-blue-50 ak-to-purple-50 ak-border-blue-200 ak-shadow-lg ak-hover:shadow-xl ak-transition-all ak-duration-300">
          <div className="ak-text-center ak-space-y-6">
            <div className="ak-mx-auto ak-w-20 ak-h-20 ak-bg-blue-600 ak-rounded-full ak-flex ak-items-center ak-justify-center">
              <Gamepad2 className="ak-w-10 ak-h-10 ak-text-white" />
            </div>
            
            <div>
              <h2 className="ak-text-2xl ak-font-bold ak-text-gray-900 ak-mb-2">创建新的游戏房间</h2>
              <p className="ak-text-gray-600">设置游戏参数，邀请朋友，开始你的积分管理之旅</p>
            </div>

            <div className="ak-grid ak-grid-cols-2 ak-gap-4 ak-py-4">
              <div className="ak-text-center">
                <div className="ak-text-2xl ak-font-bold ak-text-blue-600">2-10</div>
                <div className="ak-text-sm ak-text-gray-500">支持玩家数</div>
              </div>
              <div className="ak-text-center">
                <div className="ak-text-2xl ak-font-bold ak-text-green-600">实时</div>
                <div className="ak-text-sm ak-text-gray-500">积分记录</div>
              </div>
            </div>

            <Button 
              onClick={() => router.push('/groups/poker/create')}
              className="ak-w-full ak-bg-blue-600 ak-hover:bg-blue-700 ak-text-white ak-py-3 ak-text-lg ak-font-semibold ak-flex ak-items-center ak-justify-center ak-space-x-2"
              size="lg"
            >
              <Plus className="ak-w-5 ak-h-5" />
              <span>立即创建游戏房间</span>
              <ArrowRight className="ak-w-5 ak-h-5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* 统计数据 */}
      <div className="ak-grid ak-grid-cols-2 lg:ak-grid-cols-4 ak-gap-6">
        <Card className="ak-p-6 ak-text-center ak-border-green-200 ak-bg-green-50">
          <Users className="ak-w-8 ak-h-8 ak-text-green-600 ak-mx-auto ak-mb-2" />
          <div className="ak-text-2xl ak-font-bold ak-text-green-700">{stats.totalPlayers}</div>
          <div className="ak-text-sm ak-text-green-600">总玩家数</div>
        </Card>

        <Card className="ak-p-6 ak-text-center ak-border-blue-200 ak-bg-blue-50">
          <Gamepad2 className="ak-w-8 ak-h-8 ak-text-blue-600 ak-mx-auto ak-mb-2" />
          <div className="ak-text-2xl ak-font-bold ak-text-blue-700">{stats.totalGames}</div>
          <div className="ak-text-sm ak-text-blue-600">总游戏场次</div>
        </Card>

        <Card className="ak-p-6 ak-text-center ak-border-orange-200 ak-bg-orange-50">
          <Clock className="ak-w-8 ak-h-8 ak-text-orange-600 ak-mx-auto ak-mb-2" />
          <div className="ak-text-2xl ak-font-bold ak-text-orange-700">{stats.activeGames}</div>
          <div className="ak-text-sm ak-text-orange-600">进行中游戏</div>
        </Card>

        <Card className="ak-p-6 ak-text-center ak-border-purple-200 ak-bg-purple-50">
          <Trophy className="ak-w-8 ak-h-8 ak-text-purple-600 ak-mx-auto ak-mb-2" />
          <div className="ak-text-2xl ak-font-bold ak-text-purple-700">{stats.totalChips.toLocaleString()}</div>
          <div className="ak-text-sm ak-text-purple-600">总积分数</div>
        </Card>
      </div>

      {/* 功能特色 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-6">
        <Card className="ak-p-6 ak-text-center">
          <div className="ak-w-12 ak-h-12 ak-bg-blue-100 ak-rounded-lg ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4">
            <Gamepad2 className="ak-w-6 ak-h-6 ak-text-blue-600" />
          </div>
          <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">简单易用</h3>
          <p className="ak-text-gray-600 ak-text-sm">直观的界面设计，无需复杂操作即可快速创建和管理游戏房间</p>
        </Card>

        <Card className="ak-p-6 ak-text-center">
          <div className="ak-w-12 ak-h-12 ak-bg-green-100 ak-rounded-lg ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4">
            <Trophy className="ak-w-6 ak-h-6 ak-text-green-600" />
          </div>
          <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">精确记录</h3>
          <p className="ak-text-gray-600 ak-text-sm">实时记录每次积分转移，自动计算玩家净收益和游戏统计</p>
        </Card>

        <Card className="ak-p-6 ak-text-center">
          <div className="ak-w-12 ak-h-12 ak-bg-purple-100 ak-rounded-lg ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4">
            <Users className="ak-w-6 ak-h-6 ak-text-purple-600" />
          </div>
          <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">多人协作</h3>
          <p className="ak-text-gray-600 ak-text-sm">支持2-10人同时游戏，提供完整的游戏历史和结算报告</p>
        </Card>
      </div>
    </div>
  );
}