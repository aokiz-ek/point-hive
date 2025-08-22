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
      {/* PC端：flex布局 - 侧边栏+主内容区 */}
      <div className="lg:ak-flex lg:ak-min-h-screen">
        {/* 左侧边栏 - 仅在大屏幕显示 */}
        <div className="ak-hidden lg:ak-flex lg:ak-w-80 xl:ak-w-96 ak-flex-col ak-bg-gradient-to-b ak-from-gray-800/50 ak-to-gray-900/50 ak-border-r ak-border-gray-700/30 ak-backdrop-blur-sm">
          {/* 品牌区域 */}
          <div className="ak-p-8 ak-border-b ak-border-gray-700/30">
            <div className="ak-text-center ak-space-y-3">
              <div className="ak-relative">
                <h1 className="ak-text-2xl xl:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-via-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent">
                  🎯 Point-Hive
                </h1>
                <div className="ak-absolute ak-inset-0 ak-bg-amber-400 ak-opacity-10 ak-blur-xl ak-rounded-full"></div>
              </div>
              <p className="ak-text-sm ak-text-amber-200/80 ak-font-medium">专业的积分管理平台</p>
            </div>
          </div>

          {/* 统计数据区域 */}
          <div className="ak-p-6 ak-space-y-4">
            <h3 className="ak-text-sm ak-font-semibold ak-text-gray-300 ak-uppercase ak-tracking-wider ak-mb-4">实时统计</h3>
            <div className="ak-space-y-3">
              <div className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-green-500/10 ak-border ak-border-green-500/20 ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <Users className="ak-w-5 ak-h-5 ak-text-green-400" />
                  <span className="ak-text-sm ak-text-gray-300">总玩家</span>
                </div>
                <span className="ak-text-lg ak-font-bold ak-text-green-400">{stats.totalPlayers}</span>
              </div>
              
              <div className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-blue-500/10 ak-border ak-border-blue-500/20 ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <Gamepad2 className="ak-w-5 ak-h-5 ak-text-blue-400" />
                  <span className="ak-text-sm ak-text-gray-300">游戏场次</span>
                </div>
                <span className="ak-text-lg ak-font-bold ak-text-blue-400">{stats.totalGames}</span>
              </div>

              <div className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-orange-500/10 ak-border ak-border-orange-500/20 ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <Clock className="ak-w-5 ak-h-5 ak-text-orange-400" />
                  <span className="ak-text-sm ak-text-gray-300">进行中</span>
                </div>
                <span className="ak-text-lg ak-font-bold ak-text-orange-400">{stats.activeGames}</span>
              </div>

              <div className="ak-flex ak-items-center ak-justify-between ak-p-3 ak-bg-amber-500/10 ak-border ak-border-amber-500/20 ak-rounded-lg">
                <div className="ak-flex ak-items-center ak-space-x-3">
                  <Trophy className="ak-w-5 ak-h-5 ak-text-amber-400" />
                  <span className="ak-text-sm ak-text-gray-300">总积分</span>
                </div>
                <span className="ak-text-sm ak-font-bold ak-text-amber-400">{stats.totalChips.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 快速操作区域 */}
          <div className="ak-mt-auto ak-p-6 ak-border-t ak-border-gray-700/30">
            <Button 
              onClick={() => router.push('/groups/poker/create')}
              className="ak-w-full ak-bg-gradient-to-r ak-from-amber-500 ak-to-amber-600 ak-hover:ak-from-amber-600 ak-hover:ak-to-amber-700 ak-text-gray-900 ak-font-semibold ak-py-3 ak-rounded-lg ak-shadow-lg ak-shadow-amber-500/25"
            >
              <Plus className="ak-w-4 ak-h-4 ak-mr-2" />
              创建房间
            </Button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="ak-flex-1 lg:ak-overflow-y-auto">
          <div className="ak-max-w-5xl ak-mx-auto ak-px-4 sm:ak-px-6 lg:ak-px-8 ak-py-8">
            {/* 移动端标题 - 仅在小屏幕显示 */}
            <div className="lg:ak-hidden ak-text-center ak-space-y-4 ak-mb-8">
              <div className="ak-relative">
                <h1 className="ak-text-3xl sm:ak-text-4xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-via-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent ak-drop-shadow-2xl">
                  🎯 Point-Hive 积分蜂巢
                </h1>
                <div className="ak-absolute ak-inset-0 ak-bg-amber-400 ak-opacity-10 ak-blur-2xl ak-rounded-full ak-scale-150"></div>
              </div>
              <p className="ak-text-lg ak-text-amber-200 ak-font-medium">专业的积分管理平台</p>
              <p className="ak-text-sm ak-text-amber-600/80">轻松管理游戏，精确记录积分流动</p>
            </div>

            {/* PC端主内容布局 */}
            <div className="ak-space-y-8">
              {/* 欢迎区域和主要操作 */}
              <div className="lg:ak-grid lg:ak-grid-cols-5 lg:ak-gap-8 ak-space-y-6 lg:ak-space-y-0">
                {/* 主要创建卡片 - 占3列 */}
                <div className="lg:ak-col-span-3">
                  <Card className="ak-h-full ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-via-gray-700 ak-to-gray-800 ak-border ak-border-amber-500/30 ak-shadow-2xl ak-shadow-amber-500/20 ak-hover:shadow-amber-500/30 ak-transition-all ak-duration-500 ak-group">
                    <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent ak-opacity-80"></div>
                    
                    <div className="ak-p-6 lg:ak-p-8 ak-flex ak-flex-col ak-justify-center ak-h-full ak-min-h-[320px]">
                      <div className="ak-space-y-6">
                        <div className="ak-flex ak-items-center ak-space-x-4 lg:ak-justify-start ak-justify-center">
                          <div className="ak-w-16 ak-h-16 ak-bg-gradient-to-br ak-from-amber-400 ak-via-amber-500 ak-to-amber-600 ak-rounded-2xl ak-flex ak-items-center ak-justify-center ak-shadow-xl ak-shadow-amber-500/40 ak-group-hover:ak-scale-105 ak-transition-transform ak-duration-500">
                            <Gamepad2 className="ak-w-8 ak-h-8 ak-text-gray-900" />
                          </div>
                          <div className="ak-text-left lg:ak-block ak-hidden">
                            <h2 className="ak-text-2xl lg:ak-text-3xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-to-amber-500 ak-bg-clip-text ak-text-transparent">
                              创建游戏房间
                            </h2>
                            <p className="ak-text-amber-200/80 ak-mt-1">快速开始你的积分管理</p>
                          </div>
                        </div>
                        
                        <div className="lg:ak-hidden ak-text-center">
                          <h2 className="ak-text-2xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-to-amber-500 ak-bg-clip-text ak-text-transparent ak-mb-2">
                            创建游戏房间
                          </h2>
                          <p className="ak-text-amber-200/80">快速开始你的积分管理</p>
                        </div>

                        <div className="ak-grid ak-grid-cols-2 ak-gap-4">
                          <div className="ak-p-4 ak-bg-gradient-to-br ak-from-gray-700 ak-to-gray-800 ak-border ak-border-amber-500/20 ak-rounded-xl">
                            <div className="ak-text-2xl ak-font-bold ak-bg-gradient-to-r ak-from-amber-400 ak-to-amber-500 ak-bg-clip-text ak-text-transparent">2-10</div>
                            <div className="ak-text-sm ak-text-amber-300/80">支持玩家数</div>
                          </div>
                          <div className="ak-p-4 ak-bg-gradient-to-br ak-from-gray-700 ak-to-gray-800 ak-border ak-border-green-500/20 ak-rounded-xl">
                            <div className="ak-text-2xl ak-font-bold ak-bg-gradient-to-r ak-from-green-400 ak-to-green-500 ak-bg-clip-text ak-text-transparent">实时</div>
                            <div className="ak-text-sm ak-text-amber-300/80">积分记录</div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => router.push('/groups/poker/create')}
                          className="ak-w-full ak-bg-gradient-to-r ak-from-amber-500 ak-to-amber-600 ak-hover:ak-from-amber-600 ak-hover:ak-to-amber-700 ak-text-gray-900 ak-py-4 ak-text-lg ak-font-bold ak-rounded-xl ak-shadow-xl ak-shadow-amber-500/40 ak-hover:ak-shadow-amber-500/60 ak-border ak-border-amber-400 ak-transition-all ak-duration-300 ak-group/btn ak-flex ak-items-center ak-justify-center ak-space-x-3"
                          size="lg"
                        >
                          <Plus className="ak-w-5 ak-h-5 ak-group-hover/btn:ak-rotate-90 ak-transition-transform ak-duration-300" />
                          <span>立即创建房间</span>
                          <ArrowRight className="ak-w-5 ak-h-5 ak-group-hover/btn:ak-translate-x-1 ak-transition-transform ak-duration-300" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 右侧信息面板 - 占2列，仅在大屏幕显示 */}
                <div className="ak-hidden lg:ak-block lg:ak-col-span-2">
                  <div className="ak-space-y-4 ak-h-full">
                    <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-purple-500/30 ak-p-6 ak-shadow-xl ak-shadow-purple-500/10 ak-hover:ak-shadow-purple-500/20 ak-transition-all ak-duration-300">
                      <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-purple-400 ak-to-transparent"></div>
                      <h3 className="ak-text-lg ak-font-semibold ak-bg-gradient-to-r ak-from-purple-300 ak-to-purple-400 ak-bg-clip-text ak-text-transparent ak-mb-4 ak-flex ak-items-center">
                        <Gamepad2 className="ak-w-5 ak-h-5 ak-mr-2 ak-text-purple-400" />
                        快速上手
                      </h3>
                      <div className="ak-space-y-3 ak-text-sm ak-text-purple-200/80">
                        <div className="ak-flex ak-items-center ak-space-x-2">
                          <div className="ak-w-6 ak-h-6 ak-bg-gradient-to-br ak-from-purple-500 ak-to-purple-600 ak-rounded-full ak-flex ak-items-center ak-justify-center ak-text-xs ak-font-bold ak-text-white ak-shadow-lg">1</div>
                          <span>设置游戏参数</span>
                        </div>
                        <div className="ak-flex ak-items-center ak-space-x-2">
                          <div className="ak-w-6 ak-h-6 ak-bg-gradient-to-br ak-from-purple-500 ak-to-purple-600 ak-rounded-full ak-flex ak-items-center ak-justify-center ak-text-xs ak-font-bold ak-text-white ak-shadow-lg">2</div>
                          <span>添加玩家</span>
                        </div>
                        <div className="ak-flex ak-items-center ak-space-x-2">
                          <div className="ak-w-6 ak-h-6 ak-bg-gradient-to-br ak-from-purple-500 ak-to-purple-600 ak-rounded-full ak-flex ak-items-center ak-justify-center ak-text-xs ak-font-bold ak-text-white ak-shadow-lg">3</div>
                          <span>开始游戏</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-amber-500/30 ak-p-6 ak-shadow-xl ak-shadow-amber-500/10 ak-hover:ak-shadow-amber-500/20 ak-transition-all ak-duration-300">
                      <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent"></div>
                      <h3 className="ak-text-lg ak-font-semibold ak-bg-gradient-to-r ak-from-amber-300 ak-to-amber-400 ak-bg-clip-text ak-text-transparent ak-mb-3 ak-flex ak-items-center">
                        <Trophy className="ak-w-5 ak-h-5 ak-mr-2 ak-text-amber-400" />
                        今日亮点
                      </h3>
                      <div className="ak-text-sm ak-text-amber-200/80">
                        <p>已有 <span className="ak-font-semibold ak-text-amber-300">{stats.activeGames}</span> 场游戏正在进行中</p>
                        <p className="ak-mt-2">平均每场游戏 <span className="ak-font-semibold ak-text-amber-300">{Math.round(stats.totalChips / stats.totalGames).toLocaleString()}</span> 积分</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* 移动端统计数据 - 仅在小屏幕显示 */}
              <div className="lg:ak-hidden ak-grid ak-grid-cols-2 ak-gap-4">
                <Card className="ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-green-500/30 ak-p-4 ak-text-center">
                  <Users className="ak-w-6 ak-h-6 ak-text-green-400 ak-mx-auto ak-mb-2" />
                  <div className="ak-text-xl ak-font-bold ak-text-green-400">{stats.totalPlayers}</div>
                  <div className="ak-text-xs ak-text-green-300/80">总玩家数</div>
                </Card>
                <Card className="ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-blue-500/30 ak-p-4 ak-text-center">
                  <Gamepad2 className="ak-w-6 ak-h-6 ak-text-blue-400 ak-mx-auto ak-mb-2" />
                  <div className="ak-text-xl ak-font-bold ak-text-blue-400">{stats.totalGames}</div>
                  <div className="ak-text-xs ak-text-blue-300/80">游戏场次</div>
                </Card>
              </div>

              {/* 功能特色 */}
              <div className="ak-space-y-6">
                <h3 className="ak-text-xl ak-font-bold ak-text-center ak-bg-gradient-to-r ak-from-gray-200 ak-to-gray-400 ak-bg-clip-text ak-text-transparent">平台优势</h3>
                
                <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-3 ak-gap-6">
                  <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-blue-500/30 ak-shadow-xl ak-hover:shadow-blue-500/20 ak-transition-all ak-duration-300 ak-group/feature">
                    <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-blue-400 ak-to-transparent"></div>
                    <div className="ak-p-6 ak-text-center">
                      <div className="ak-w-14 ak-h-14 ak-bg-gradient-to-br ak-from-blue-500 ak-to-blue-600 ak-rounded-xl ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4 ak-shadow-lg ak-shadow-blue-500/30 ak-group-hover/feature:ak-scale-110 ak-transition-transform ak-duration-300">
                        <Gamepad2 className="ak-w-7 ak-h-7 ak-text-white" />
                      </div>
                      <h3 className="ak-text-lg ak-font-bold ak-bg-gradient-to-r ak-from-blue-300 ak-to-blue-400 ak-bg-clip-text ak-text-transparent ak-mb-3">简单易用</h3>
                      <p className="ak-text-blue-200/70 ak-text-sm ak-leading-relaxed">直观的界面设计，无需复杂操作即可快速创建和管理游戏房间</p>
                    </div>
                  </Card>

                  <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-amber-500/30 ak-shadow-xl ak-hover:shadow-amber-500/20 ak-transition-all ak-duration-300 ak-group/feature">
                    <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-amber-400 ak-to-transparent"></div>
                    <div className="ak-p-6 ak-text-center">
                      <div className="ak-w-14 ak-h-14 ak-bg-gradient-to-br ak-from-amber-500 ak-to-amber-600 ak-rounded-xl ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4 ak-shadow-lg ak-shadow-amber-500/30 ak-group-hover/feature:ak-scale-110 ak-transition-transform ak-duration-300">
                        <Trophy className="ak-w-7 ak-h-7 ak-text-gray-900" />
                      </div>
                      <h3 className="ak-text-lg ak-font-bold ak-bg-gradient-to-r ak-from-amber-300 ak-to-amber-400 ak-bg-clip-text ak-text-transparent ak-mb-3">精确记录</h3>
                      <p className="ak-text-amber-200/70 ak-text-sm ak-leading-relaxed">实时记录每次积分转移，自动计算玩家净收益和游戏统计</p>
                    </div>
                  </Card>

                  <Card className="ak-relative ak-overflow-hidden ak-bg-gradient-to-br ak-from-gray-800 ak-to-gray-700 ak-border ak-border-purple-500/30 ak-shadow-xl ak-hover:shadow-purple-500/20 ak-transition-all ak-duration-300 ak-group/feature md:ak-col-span-1">
                    <div className="ak-absolute ak-top-0 ak-left-0 ak-right-0 ak-h-0.5 ak-bg-gradient-to-r ak-from-transparent ak-via-purple-400 ak-to-transparent"></div>
                    <div className="ak-p-6 ak-text-center">
                      <div className="ak-w-14 ak-h-14 ak-bg-gradient-to-br ak-from-purple-500 ak-to-purple-600 ak-rounded-xl ak-flex ak-items-center ak-justify-center ak-mx-auto ak-mb-4 ak-shadow-lg ak-shadow-purple-500/30 ak-group-hover/feature:ak-scale-110 ak-transition-transform ak-duration-300">
                        <Users className="ak-w-7 ak-h-7 ak-text-white" />
                      </div>
                      <h3 className="ak-text-lg ak-font-bold ak-bg-gradient-to-r ak-from-purple-300 ak-to-purple-400 ak-bg-clip-text ak-text-transparent ak-mb-3">多人协作</h3>
                      <p className="ak-text-purple-200/70 ak-text-sm ak-leading-relaxed">支持2-10人同时游戏，提供完整的游戏历史和结算报告</p>
                    </div>
                  </Card>
                </div>
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
        </div>
      </div>
    </div>
  );
}