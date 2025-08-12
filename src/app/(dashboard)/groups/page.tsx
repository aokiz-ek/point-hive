'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGroups } from '@/lib/hooks';

export default function GroupsPage() {
  const { groups, loading, error } = useGroups();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'owned' | 'member'>('all');

  const filteredGroups = groups?.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'owned') {
      return matchesSearch && group.ownerId === '1'; // 当前用户ID
    }
    if (filter === 'member') {
      return matchesSearch && group.ownerId !== '1' && group.memberIds.includes('1');
    }
    
    return matchesSearch;
  }) || [];

  if (loading) {
    return (
      <div className="ak-flex ak-items-center ak-justify-center ak-py-12">
        <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ak-text-center ak-py-12">
        <p className="ak-text-red-600">{error}</p>
        <Button className="ak-mt-4" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="ak-space-y-6">
      {/* 页面标题和操作 */}
      <div className="ak-flex ak-flex-col sm:ak-flex-row ak-items-start sm:ak-items-center ak-justify-between ak-gap-4">
        <div>
          <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">我的群组</h1>
          <p className="ak-text-gray-600">管理您参与的积分群组</p>
        </div>
        <div className="ak-flex ak-space-x-3">
          <Button variant="outline" asChild>
            <Link href="/groups/join">加入群组</Link>
          </Button>
          <Button asChild>
            <Link href="/groups/create">创建群组</Link>
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="ak-p-4">
        <div className="ak-flex ak-flex-col sm:ak-flex-row ak-gap-4">
          <div className="ak-flex-1">
            <Input
              placeholder="搜索群组名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ak-flex ak-space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              全部
            </Button>
            <Button
              variant={filter === 'owned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('owned')}
            >
              我创建的
            </Button>
            <Button
              variant={filter === 'member' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('member')}
            >
              我参与的
            </Button>
          </div>
        </div>
      </Card>

      {/* 群组列表 */}
      {filteredGroups.length > 0 ? (
        <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-2 lg:ak-grid-cols-3 ak-gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="ak-p-6 ak-hover:shadow-lg ak-transition-shadow">
              <div className="ak-flex ak-items-start ak-justify-between ak-mb-4">
                <div className="ak-flex-1">
                  <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
                    {group.name}
                  </h3>
                  <p className="ak-text-gray-600 ak-text-sm ak-line-clamp-2">
                    {group.description}
                  </p>
                </div>
                <div className="ak-flex ak-items-center ak-space-x-1">
                  {group.ownerId === '1' && (
                    <span className="ak-bg-blue-100 ak-text-blue-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                      群主
                    </span>
                  )}
                  {group.adminIds.includes('1') && group.ownerId !== '1' && (
                    <span className="ak-bg-purple-100 ak-text-purple-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                      管理员
                    </span>
                  )}
                  {group.isPublic && (
                    <span className="ak-bg-green-100 ak-text-green-800 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                      公开
                    </span>
                  )}
                </div>
              </div>

              <div className="ak-grid ak-grid-cols-2 ak-gap-4 ak-mb-4 ak-text-sm">
                <div>
                  <p className="ak-text-gray-500">成员数量</p>
                  <p className="ak-font-semibold">
                    {group.memberIds.length}/{group.maxMembers}
                  </p>
                </div>
                <div>
                  <p className="ak-text-gray-500">总积分</p>
                  <p className="ak-font-semibold ak-text-green-600">
                    {group.totalPoints.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mb-4">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="ak-bg-gray-100 ak-text-gray-700 ak-text-xs ak-px-2 ak-py-1 ak-rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="ak-flex ak-space-x-2">
                <Button asChild size="sm" className="ak-flex-1">
                  <Link href={`/groups/${group.id}`}>查看详情</Link>
                </Button>
                {group.ownerId === '1' && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/groups/${group.id}/manage`}>管理</Link>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="ak-p-12 ak-text-center">
          <div className="ak-text-gray-400 ak-mb-4">
            <span className="ak-text-6xl">👥</span>
          </div>
          <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
            {searchTerm ? '未找到匹配的群组' : '暂无群组'}
          </h3>
          <p className="ak-text-gray-600 ak-mb-6">
            {searchTerm 
              ? '请尝试调整搜索条件或创建新群组'
              : '创建或加入群组来开始管理积分'
            }
          </p>
          <div className="ak-flex ak-justify-center ak-space-x-3">
            <Button variant="outline" asChild>
              <Link href="/groups/join">加入群组</Link>
            </Button>
            <Button asChild>
              <Link href="/groups/create">创建群组</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}