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
    <div className="ak-min-h-screen ak-bg-gradient-to-br ak-from-gray-900 ak-via-gray-800 ak-to-gray-900">
      <div className="ak-space-y-6 sm:ak-space-y-8 ak-max-w-6xl ak-mx-auto ak-px-4 sm:ak-px-6 lg:ak-px-8 ak-pt-8">
        {/* 欢迎标题 */}
        <div className="ak-text-center ak-space-y-4 sm:ak-space-y-6 ak-pt-4 sm:ak-pt-6">
          <div className="ak-relative">
            <h1 className="ak-text-3xl sm:ak-text-4xl lg:ak-text-5xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-via-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent ak-drop-shadow-2xl">
              🎯 Point-Hive 积分蜂巢
            </h1>
            <div className="ak-absolute ak-inset-0 ak-bg-amber-400 ak-opacity-10 ak-blur-2xl ak-rounded-full ak-scale-150"></div>
          </div>
          <p className="ak-text-lg sm:ak-text-xl ak-text-amber-200 ak-font-medium">专业的积分管理平台</p>
          <p className="ak-text-sm sm:ak-text-base ak-text-amber-600/80">轻松管理游戏，精确记录积分流动</p>
        </div>

        {/* 创建游戏房间卡片 */}
        <div className="ak-flex ak-justify-center">
          <Card className="ak-w-full ak-max-w-2xl ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-via-gray-700 ak-to-gray-800 ak-border ak-border-amber-500/30 ak-shadow-2xl ak-shadow-amber-500/20 ak-hover:shadow-amber-500/30 ak-transition-all ak-duration-500 ak-group">
            {/* 装饰性光效 */}
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent ak-opacity-80"></div>
            <div className="ak-absolute ak-bottom-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent ak-opacity-80"></div>
            
            <div className="ak-p-6 sm:ak-p-8 lg:ak-p-10">
              <div className="ak-text-center ak-space-y-6 sm:ak-space-y-8">
                {/* 游戏图标 */}
                <div className="ak-relative ak-mx-auto">
                  <div className="ak-w-20 ak-h-20 sm:ak-w-24 sm:ak-h-24 ak-bg-gradient-to-br ak-from-amber-400 ak-via-amber-500 ak-to-amber-600 ak-rounded-full ak-flex ak-items-center ak-justify-center ak-shadow-2xl ak-shadow-amber-500/40 ak-group-hover:ak-scale-110 ak-transition-transform ak-duration-500">
                    <Gamepad2 className="ak-w-10 ak-h-10 sm:ak-w-12 sm:ak-h-12 ak-text-gray-900" />
                  </div>
                  <div className="ak-absolute ak-inset-0 ak-bg-amber-400 ak-opacity-20 ak-blur-xl ak-rounded-full ak-scale-150 ak-group-hover:ak-opacity-30 ak-transition-opacity ak-duration-500"></div>
                </div>
                
                <div className="ak-space-y-3">
                  <h2 className="ak-text-xl sm:ak-text-2xl lg:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-via-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent">
                    创建新的游戏房间
                  </h2>
                  <p className="ak-text-sm sm:ak-text-base ak-text-amber-200/80 ak-px-2 ak-leading-relaxed">
                    设置游戏参数，邀请朋友，开始你的积分管理之旅
                  </p>
                </div>

                {/* 游戏特性 */}
                <div className="ak-grid ak-grid-cols-2 ak-gap-4 sm:ak-gap-6 ak-py-4">
                  <div className="ak-text-center ak-p-3 sm:ak-p-4 ak-bg-gradient-to-br ak-from-gray-700 ak-to-gray-800 ak-border ak-border-amber-500/20 ak-rounded-xl ak-shadow-lg ak-hover:ak-shadow-amber-500/10 ak-transition-all">
                    <div className="ak-text-2xl sm:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent">2-10</div>
                    <div className="ak-text-xs sm:ak-text-sm ak-text-amber-300/80 ak-font-medium">支持玩家数</div>
                  </div>
                  <div className="ak-text-center ak-p-3 sm:ak-p-4 ak-bg-gradient-to-br ak-from-gray-700 ak-to-gray-800 ak-border ak-border-amber-500/20 ak-rounded-xl ak-shadow-lg ak-hover:ak-shadow-amber-500/10 ak-transition-all">
                    <div className="ak-text-2xl sm:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-green-400 ak-to-green-500 ak-bg-clip-text ak-text-transparent">实时</div>
                    <div className="ak-text-xs sm:ak-text-sm ak-text-amber-300/80 ak-font-medium">积分记录</div>
                  </div>
                </div>

                {/* 创建按钮 */}
                <Button 
                  onClick={() => router.push('/groups/poker/create')}
                  className="ak-w-full ak-bg-gradient-to-r ak-from-amber-500 ak-via-amber-400 ak-to-amber-500 ak-hover:ak-from-amber-600 ak-hover:ak-via-amber-500 ak-hover:ak-to-amber-600 ak-text-gray-900 ak-py-4 sm:ak-py-5 ak-text-base sm:ak-text-lg ak-font-bold ak-flex ak-items-center ak-justify-center ak-space-x-3 ak-min-h-[52px] ak-rounded-xl ak-shadow-2xl ak-shadow-amber-500/40 ak-hover:ak-shadow-amber-500/60 ak-border ak-border-amber-400 ak-transition-all ak-duration-300 ak-group/btn"
                  size="lg"
                >
                  <Plus className="ak-w-5 ak-h-5 sm:ak-w-6 sm:ak-h-6 ak-group-hover/btn:ak-rotate-90 ak-transition-transform ak-duration-300" />
                  <span className="ak-hidden sm:ak-inline">立即创建游戏房间</span>
                  <span className="sm:ak-hidden ak-font-bold">创建房间</span>
                  <ArrowRight className="ak-w-5 ak-h-5 sm:ak-w-6 sm:ak-h-6 ak-group-hover/btn:ak-translate-x-1 ak-transition-transform ak-duration-300" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 统计数据 */}
        <div className="ak-grid ak-grid-cols-2 lg:ak-grid-cols-4 ak-gap-4 sm:ak-gap-6">
          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-green-500/30 ak-shadow-xl ak-shadow-green-500/20 ak-hover:shadow-green-500/30 ak-transition-all ak-duration-300 ak-group/card">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-green-400 ak-to-transparent"></div>
            <div className="ak-p-4 sm:ak-p-5 lg:ak-p-6 ak-text-center">
              <Users className="ak-w-8 ak-h-8 sm:ak-w-10 sm:ak-h-10 ak-text-green-400 ak-mx-auto ak-mb-3 ak-group-hover/card:ak-scale-110 ak-transition-transform ak-duration-300" />
              <div className="ak-text-2xl sm:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-green-400 ak-to-green-500 ak-bg-clip-text ak-text-transparent">{stats.totalPlayers}</div>
              <div className="ak-text-xs sm:ak-text-sm ak-text-green-300/80 ak-font-medium">总玩家数</div>
            </div>
          </Card>

          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-blue-500/30 ak-shadow-xl ak-shadow-blue-500/20 ak-hover:shadow-blue-500/30 ak-transition-all ak-duration-300 ak-group/card">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-blue-400 ak-to-transparent"></div>
            <div className="ak-p-4 sm:ak-p-5 lg:ak-p-6 ak-text-center">
              <Gamepad2 className="ak-w-8 ak-h-8 sm:ak-w-10 sm:ak-h-10 ak-text-blue-400 ak-mx-auto ak-mb-3 ak-group-hover/card:ak-scale-110 ak-transition-transform ak-duration-300" />
              <div className="ak-text-2xl sm:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-blue-400 ak-to-blue-500 ak-bg-clip-text ak-text-transparent">{stats.totalGames}</div>
              <div className="ak-text-xs sm:ak-text-sm ak-text-blue-300/80 ak-font-medium">总游戏场次</div>
            </div>
          </Card>

          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-orange-500/30 ak-shadow-xl ak-shadow-orange-500/20 ak-hover:shadow-orange-500/30 ak-transition-all ak-duration-300 ak-group/card">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-orange-400 ak-to-transparent"></div>
            <div className="ak-p-4 sm:ak-p-5 lg:ak-p-6 ak-text-center">
              <Clock className="ak-w-8 ak-h-8 sm:ak-w-10 sm:ak-h-10 ak-text-orange-400 ak-mx-auto ak-mb-3 ak-group-hover/card:ak-scale-110 ak-transition-transform ak-duration-300" />
              <div className="ak-text-2xl sm:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-orange-400 ak-to-orange-500 ak-bg-clip-text ak-text-transparent">{stats.activeGames}</div>
              <div className="ak-text-xs sm:ak-text-sm ak-text-orange-300/80 ak-font-medium">进行中游戏</div>
            </div>
          </Card>

          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-amber-500/30 ak-shadow-xl ak-shadow-amber-500/20 ak-hover:shadow-amber-500/30 ak-transition-all ak-duration-300 ak-group/card">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent"></div>
            <div className="ak-p-4 sm:ak-p-5 lg:ak-p-6 ak-text-center">
              <Trophy className="ak-w-8 ak-h-8 sm:ak-w-10 sm:ak-h-10 ak-text-amber-400 ak-mx-auto ak-mb-3 ak-group-hover/card:ak-scale-110 ak-transition-transform ak-duration-300" />
              <div className="ak-text-2xl sm:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent">{stats.totalChips.toLocaleString()}</div>
              <div className="ak-text-xs sm:ak-text-sm ak-text-amber-300/80 ak-font-medium">总积分数</div>
            </div>
          </Card>
        </div>

        {/* 功能特色 */}
        <div className="ak-grid ak-grid-cols-1 sm:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-4 sm:ak-gap-6">
          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-blue-500/30 ak-shadow-xl ak-shadow-blue-500/10 ak-hover:shadow-blue-500/20 ak-transition-all ak-duration-300 ak-group/feature">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-blue-400 ak-to-transparent"></div>
            <div className="ak-p-5 sm:ak-p-6 ak-text-center">
              <div className="ak-w-12 ak-h-12 sm:ak-w-14 sm:ak-h-14 ak-bg-gradient-to-br ak-from-blue-500 ak-to-blue-600 ak-rounded-xl ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4 ak-shadow-lg ak-shadow-blue-500/30 ak-group-hover/feature:ak-scale-110 ak-transition-transform ak-duration-300">
                <Gamepad2 className="ak-w-6 ak-h-6 sm:ak-w-7 sm:ak-h-7 ak-text-white" />
              </div>
              <h3 className="ak-text-base sm:ak-text-lg ak-font-bold ak-bg-gradient-to-r ak-from-blue-300 ak-to-blue-400 ak-bg-clip-text ak-text-transparent ak-mb-3">简单易用</h3>
              <p className="ak-text-blue-200/70 ak-text-xs sm:ak-text-sm ak-leading-relaxed">直观的界面设计，无需复杂操作即可快速创建和管理游戏房间</p>
            </div>
          </Card>

          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-amber-500/30 ak-shadow-xl ak-shadow-amber-500/10 ak-hover:shadow-amber-500/20 ak-transition-all ak-duration-300 ak-group/feature">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent"></div>
            <div className="ak-p-5 sm:ak-p-6 ak-text-center">
              <div className="ak-w-12 ak-h-12 sm:ak-w-14 sm:ak-h-14 ak-bg-gradient-to-br ak-from-amber-500 ak-to-amber-600 ak-rounded-xl ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4 ak-shadow-lg ak-shadow-amber-500/30 ak-group-hover/feature:ak-scale-110 ak-transition-transform ak-duration-300">
                <Trophy className="ak-w-6 ak-h-6 sm:ak-w-7 sm:ak-h-7 ak-text-gray-900" />
              </div>
              <h3 className="ak-text-base sm:ak-text-lg ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-to-amber-400 ak-bg-clip-text ak-text-transparent ak-mb-3">精确记录</h3>
              <p className="ak-text-amber-200/70 ak-text-xs sm:ak-text-sm ak-leading-relaxed">实时记录每次积分转移，自动计算玩家净收益和游戏统计</p>
            </div>
          </Card>

          <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-purple-500/30 ak-shadow-xl ak-shadow-purple-500/10 ak-hover:shadow-purple-500/20 ak-transition-all ak-duration-300 ak-group/feature sm:ak-col-span-2 lg:ak-col-span-1">
            <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-purple-400 ak-to-transparent"></div>
            <div className="ak-p-5 sm:ak-p-6 ak-text-center">
              <div className="ak-w-12 ak-h-12 sm:ak-w-14 sm:ak-h-14 ak-bg-gradient-to-br ak-from-purple-500 ak-to-purple-600 ak-rounded-xl ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4 ak-shadow-lg ak-shadow-purple-500/30 ak-group-hover/feature:ak-scale-110 ak-transition-transform ak-duration-300">
                <Users className="ak-w-6 ak-h-6 sm:ak-w-7 sm:ak-h-7 ak-text-white" />
              </div>
              <h3 className="ak-text-base sm:ak-text-lg ak-font-bold ak-bg-gradient-to-r ak-from-purple-300 ak-to-purple-400 ak-bg-clip-text ak-text-transparent ak-mb-3">多人协作</h3>
              <p className="ak-text-purple-200/70 ak-text-xs sm:ak-text-sm ak-leading-relaxed">支持2-10人同时游戏，提供完整的游戏历史和结算报告</p>
            </div>
          </Card>
        </div>

        {/* 底部装饰 */}
        <div className="ak-text-center ak-py-8 sm:ak-py-12">
          <div className="ak-w-32 ak-h-px ak-bg-gradient-to-r ak-from-transparent ak-via-amber-500/50 ak-to-transparent ak-mx-auto ak-mb-4"></div>
          <p className="ak-text-sm ak-text-amber-600/60 ak-font-medium">
            Point-Hive · 专业积分管理平台
          </p>
        </div>
      </div>
    </div>
  );
}