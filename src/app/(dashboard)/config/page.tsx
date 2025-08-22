'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LocalStorage } from '@/lib/utils/local-storage';

interface StorageStats {
  mode: string;
  autoCleanup: boolean;
  cleanupInterval: number;
  dataKeys: Array<{
    key: string;
    exists: boolean;
    expiresAt?: string;
    isExpired?: boolean;
  }>;
}

export default function ConfigPage() {
  const [storageMode, setStorageMode] = useState<'localStorage' | 'database'>('localStorage');
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [cleanupInterval, setCleanupInterval] = useState(12);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载当前配置
  useEffect(() => {
    const config = LocalStorage.getConfig();
    setStorageMode(config.mode);
    setAutoCleanup(config.autoCleanup);
    setCleanupInterval(config.cleanupInterval);
    updateStats();
  }, []);

  const updateStats = () => {
    const currentStats = LocalStorage.getStorageStats();
    setStats(currentStats);
  };

  const handleSaveConfig = () => {
    setLoading(true);
    
    try {
      LocalStorage.setConfig({
        mode: storageMode,
        autoCleanup,
        cleanupInterval,
      });
      
      // 如果切换到localStorage模式，初始化清理机制
      if (storageMode === 'localStorage') {
        LocalStorage.init();
      }
      
      updateStats();
      alert('配置已保存');
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCleanup = () => {
    LocalStorage.manualCleanup();
    updateStats();
    alert('清理完成');
  };

  const handleClearAllData = () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      LocalStorage.clearAll();
      updateStats();
      alert('所有数据已清空');
    }
  };

  const handleResetExpiration = (key: string) => {
    LocalStorage.resetExpiration(key);
    updateStats();
    alert(`已重置 ${key} 的过期时间`);
  };

  return (
    <div className="ak-space-y-6 ak-max-w-4xl ak-mx-auto">
      {/* 页面标题 */}
      <div className="ak-text-center">
        <h1 className="ak-text-3xl ak-font-bold ak-text-gray-900 ak-mb-2">⚙️ 存储配置</h1>
        <p className="ak-text-gray-600">管理数据存储方式和自动清理设置</p>
      </div>

      {/* 存储模式配置 */}
      <Card className="ak-p-6">
        <h2 className="ak-text-xl ak-font-semibold ak-mb-4">🗄️ 存储模式</h2>
        
        <div className="ak-space-y-4">
          <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 ak-gap-4">
            <div 
              className={`ak-p-4 ak-border ak-rounded-lg ak-cursor-pointer ak-transition-all ${
                storageMode === 'localStorage' 
                  ? 'ak-border-blue-500 ak-bg-blue-50' 
                  : 'ak-border-gray-200 ak-hover:border-gray-300'
              }`}
              onClick={() => setStorageMode('localStorage')}
            >
              <div className="ak-flex ak-items-center ak-space-x-3">
                <input 
                  type="radio" 
                  checked={storageMode === 'localStorage'}
                  onChange={() => setStorageMode('localStorage')}
                  className="ak-text-blue-600"
                />
                <div>
                  <h3 className="ak-font-semibold ak-text-gray-900">本地存储 (localStorage)</h3>
                  <p className="ak-text-sm ak-text-gray-600">数据存储在浏览器本地，支持自动清理</p>
                  <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
                    ✅ 无需网络连接<br/>
                    ✅ 支持自动清理<br/>
                    ⚠️ 数据仅在当前浏览器有效
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`ak-p-4 ak-border ak-rounded-lg ak-cursor-pointer ak-transition-all ${
                storageMode === 'database' 
                  ? 'ak-border-blue-500 ak-bg-blue-50' 
                  : 'ak-border-gray-200 ak-hover:border-gray-300'
              }`}
              onClick={() => setStorageMode('database')}
            >
              <div className="ak-flex ak-items-center ak-space-x-3">
                <input 
                  type="radio" 
                  checked={storageMode === 'database'}
                  onChange={() => setStorageMode('database')}
                  className="ak-text-blue-600"
                />
                <div>
                  <h3 className="ak-font-semibold ak-text-gray-900">数据库存储</h3>
                  <p className="ak-text-sm ak-text-gray-600">数据存储在服务器数据库，永久保存</p>
                  <div className="ak-text-xs ak-text-gray-500 ak-mt-1">
                    ✅ 数据永久保存<br/>
                    ✅ 跨设备同步<br/>
                    ⚠️ 需要网络连接
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 自动清理配置 */}
      {storageMode === 'localStorage' && (
        <Card className="ak-p-6">
          <h2 className="ak-text-xl ak-font-semibold ak-mb-4">🧹 自动清理设置</h2>
          
          <div className="ak-space-y-4">
            <div className="ak-flex ak-items-center ak-justify-between">
              <div>
                <h3 className="ak-font-medium ak-text-gray-900">启用自动清理</h3>
                <p className="ak-text-sm ak-text-gray-600">定期清理过期的本地数据</p>
              </div>
              <label className="ak-relative ak-inline-flex ak-items-center ak-cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoCleanup}
                  onChange={(e) => setAutoCleanup(e.target.checked)}
                  className="ak-sr-only ak-peer"
                />
                <div className="ak-w-11 ak-h-6 ak-bg-gray-200 ak-peer-focus:outline-none ak-peer-focus:ring-4 ak-peer-focus:ring-blue-300 ak-rounded-full ak-peer ak-peer-checked:after:translate-x-full ak-peer-checked:after:border-white ak-after:content-[''] ak-after:absolute ak-after:top-[2px] ak-after:left-[2px] ak-after:bg-white ak-after:border-gray-300 ak-after:border ak-after:rounded-full ak-after:h-5 ak-after:w-5 ak-after:transition-all ak-peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {autoCleanup && (
              <div>
                <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
                  清理间隔（小时）
                </label>
                <select
                  value={cleanupInterval}
                  onChange={(e) => setCleanupInterval(parseInt(e.target.value))}
                  className="ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500"
                >
                  <option value={1}>1小时</option>
                  <option value={6}>6小时</option>
                  <option value={12}>12小时</option>
                  <option value={24}>24小时</option>
                  <option value={72}>3天</option>
                  <option value={168}>7天</option>
                </select>
                <p className="ak-text-xs ak-text-gray-500 ak-mt-1">
                  数据将在设定时间后自动清理
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 存储统计 */}
      {stats && (
        <Card className="ak-p-6">
          <h2 className="ak-text-xl ak-font-semibold ak-mb-4">📊 存储统计</h2>
          
          <div className="ak-space-y-4">
            <div className="ak-grid ak-grid-cols-2 md:ak-grid-cols-4 ak-gap-4 ak-text-sm">
              <div className="ak-bg-blue-50 ak-p-3 ak-rounded-lg">
                <div className="ak-text-blue-600 ak-font-medium">当前模式</div>
                <div className="ak-text-lg ak-font-semibold ak-text-blue-800">
                  {stats.mode === 'localStorage' ? '本地存储' : '数据库'}
                </div>
              </div>
              
              <div className="ak-bg-green-50 ak-p-3 ak-rounded-lg">
                <div className="ak-text-green-600 ak-font-medium">自动清理</div>
                <div className="ak-text-lg ak-font-semibold ak-text-green-800">
                  {stats.autoCleanup ? '已启用' : '已禁用'}
                </div>
              </div>
              
              <div className="ak-bg-purple-50 ak-p-3 ak-rounded-lg">
                <div className="ak-text-purple-600 ak-font-medium">清理间隔</div>
                <div className="ak-text-lg ak-font-semibold ak-text-purple-800">
                  {stats.cleanupInterval}小时
                </div>
              </div>
              
              <div className="ak-bg-orange-50 ak-p-3 ak-rounded-lg">
                <div className="ak-text-orange-600 ak-font-medium">存储项目</div>
                <div className="ak-text-lg ak-font-semibold ak-text-orange-800">
                  {stats.dataKeys.filter(k => k.exists).length} / {stats.dataKeys.length}
                </div>
              </div>
            </div>

            <div className="ak-space-y-2">
              <h3 className="ak-font-medium ak-text-gray-900">数据项详情</h3>
              {stats.dataKeys.map((item) => (
                <div 
                  key={item.key}
                  className={`ak-flex ak-items-center ak-justify-between ak-p-3 ak-border ak-rounded-lg ${
                    !item.exists ? 'ak-border-gray-200 ak-bg-gray-50' :
                    item.isExpired ? 'ak-border-red-200 ak-bg-red-50' :
                    'ak-border-green-200 ak-bg-green-50'
                  }`}
                >
                  <div>
                    <div className="ak-font-medium ak-text-gray-900">{item.key}</div>
                    {item.exists && item.expiresAt && (
                      <div className="ak-text-sm ak-text-gray-600">
                        过期时间: {item.expiresAt}
                        {item.isExpired && <span className="ak-text-red-600 ak-ml-2">（已过期）</span>}
                      </div>
                    )}
                  </div>
                  <div className="ak-flex ak-items-center ak-space-x-2">
                    <span className={`ak-px-2 ak-py-1 ak-rounded ak-text-xs ak-font-medium ${
                      !item.exists ? 'ak-bg-gray-100 ak-text-gray-600' :
                      item.isExpired ? 'ak-bg-red-100 ak-text-red-700' :
                      'ak-bg-green-100 ak-text-green-700'
                    }`}>
                      {!item.exists ? '无数据' : item.isExpired ? '已过期' : '正常'}
                    </span>
                    {item.exists && !item.isExpired && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetExpiration(item.key)}
                        className="ak-text-xs"
                      >
                        重置过期时间
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="ak-flex ak-flex-wrap ak-gap-3 ak-justify-center">
        <Button 
          onClick={handleSaveConfig}
          disabled={loading}
          size="lg"
          className="ak-min-w-32"
        >
          {loading ? '保存中...' : '💾 保存配置'}
        </Button>
        
        {storageMode === 'localStorage' && (
          <>
            <Button 
              variant="outline"
              onClick={handleManualCleanup}
              size="lg"
            >
              🧹 手动清理
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => updateStats()}
              size="lg"
            >
              🔄 刷新统计
            </Button>
          </>
        )}
        
        <Button 
          variant="destructive"
          onClick={handleClearAllData}
          size="lg"
        >
          🗑️ 清空所有数据
        </Button>
      </div>

      {/* 使用说明 */}
      <Card className="ak-p-6 ak-bg-blue-50">
        <h3 className="ak-text-lg ak-font-semibold ak-text-blue-800 ak-mb-3">📖 使用说明</h3>
        <div className="ak-text-sm ak-text-blue-700 ak-space-y-2">
          <p><strong>本地存储模式：</strong> 数据保存在浏览器中，关闭浏览器后数据仍然存在，但只在当前设备有效。支持自动清理功能。</p>
          <p><strong>数据库模式：</strong> 数据保存在服务器上，可以跨设备访问，数据永久保存。</p>
          <p><strong>自动清理：</strong> 只在本地存储模式下生效，会定期删除过期的数据。</p>
          <p><strong>建议：</strong> 如果只是临时使用或测试，建议使用本地存储模式；如果需要长期使用，建议使用数据库模式。</p>
        </div>
      </Card>
    </div>
  );
}