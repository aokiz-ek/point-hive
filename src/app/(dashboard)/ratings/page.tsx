'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks';
import { LocalStorage, generateId, formatDate } from '@/lib/utils/local-storage';
import type { Rating, Transaction } from '@/lib/types';

export default function RatingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [receivedRatings, setReceivedRatings] = useState<Rating[]>([]);
  const [givenRatings, setGivenRatings] = useState<Rating[]>([]);
  const [pendingRatings, setPendingRatings] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'given' | 'received'>('pending');

  useEffect(() => {
    loadRatingsData();
  }, [user]);

  const loadRatingsData = () => {
    if (!user) return;

    setLoading(true);
    try {
      const allTransactions = LocalStorage.getTransactions();
      const allRatings = LocalStorage.getItem<Rating[]>('point-hive-ratings') || [];

      // 获取用户相关的已完成交易
      const userTransactions = allTransactions.filter(t => 
        (t.fromUserId === user.id || t.toUserId === user.id) &&
        t.status === 'completed' &&
        t.type === 'transfer' &&
        !t.metadata?.isReturn
      );

      // 获取待评价的交易
      const pending = userTransactions.filter(transaction => {
        const existingRating = allRatings.find(r => r.transactionId === transaction.id);
        return !existingRating && new Date(transaction.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000);
      });

      // 获取用户相关的评价
      const userRatings = allRatings.filter(r => 
        r.fromUserId === user.id || r.toUserId === user.id
      );

      setTransactions(userTransactions);
      setRatings(userRatings);
      setPendingRatings(pending);
      setGivenRatings(userRatings.filter(r => r.fromUserId === user.id));
      setReceivedRatings(userRatings.filter(r => r.toUserId === user.id));

    } catch (error) {
      console.error('加载评价数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (transaction: Transaction, score: number, comment: string, tags: string[]) => {
    if (!user) return;

    try {
      const rating: Rating = {
        id: generateId(),
        fromUserId: user.id,
        toUserId: transaction.fromUserId === user.id ? transaction.toUserId : transaction.fromUserId,
        transactionId: transaction.id,
        score,
        comment,
        tags,
        createdAt: new Date().toISOString()
      };

      const allRatings = LocalStorage.getItem<Rating[]>('point-hive-ratings') || [];
      allRatings.push(rating);
      LocalStorage.setItem('point-hive-ratings', allRatings);

      // 发送通知给对方
      const notification = {
        id: generateId(),
        type: 'rating_received' as const,
        title: '收到新评价',
        message: `${user.nickname || user.name} 给您评价了 ${score} 星`,
        userId: rating.toUserId,
        read: false,
        createdAt: new Date().toISOString(),
        metadata: {
          ratingId: rating.id,
          score: rating.score,
          transactionId: transaction.id
        }
      };
      LocalStorage.addNotification(notification);

      // 重新加载数据
      loadRatingsData();

    } catch (error) {
      console.error('提交评价失败:', error);
      alert('评价失败，请重试');
    }
  };

  const getAverageScore = (ratingsList: Rating[]) => {
    if (ratingsList.length === 0) return 0;
    const sum = ratingsList.reduce((acc, r) => acc + r.score, 0);
    return Math.round((sum / ratingsList.length) * 10) / 10;
  };

  const getScoreDistribution = (ratingsList: Rating[]) => {
    const distribution = [0, 0, 0, 0, 0];
    ratingsList.forEach(r => {
      distribution[r.score - 1]++;
    });
    return distribution;
  };

  const renderStars = (score: number, interactive = false, onScoreChange?: (score: number) => void) => {
    return (
      <div className="ak-flex ak-space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onScoreChange && onScoreChange(star)}
            className={`ak-text-2xl ak-transition-colors ${
              !interactive ? 'ak-cursor-default' : 'ak-cursor-pointer hover:ak-scale-110'
            }`}
          >
            {star <= score ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ak-flex ak-items-center ak-justify-center ak-py-12">
        <div className="ak-animate-spin ak-rounded-full ak-h-8 ak-w-8 ak-border-b-2 ak-border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="ak-space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="ak-text-2xl ak-font-bold ak-text-gray-900">用户评价</h1>
        <p className="ak-text-gray-600">查看和管理您的交易评价</p>
      </div>

      {/* 评价统计 */}
      <div className="ak-grid ak-grid-cols-1 md:ak-grid-cols-4 ak-gap-6">
        <Card className="ak-p-4 ak-bg-blue-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">待评价</p>
            <p className="ak-text-2xl ak-font-bold ak-text-blue-600">
              {pendingRatings.length}
            </p>
          </div>
        </Card>
        <Card className="ak-p-4 ak-bg-green-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">已评价</p>
            <p className="ak-text-2xl ak-font-bold ak-text-green-600">
              {givenRatings.length}
            </p>
          </div>
        </Card>
        <Card className="ak-p-4 ak-bg-purple-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">收到评价</p>
            <p className="ak-text-2xl ak-font-bold ak-text-purple-600">
              {receivedRatings.length}
            </p>
          </div>
        </Card>
        <Card className="ak-p-4 ak-bg-orange-50">
          <div className="ak-text-center">
            <p className="ak-text-sm ak-text-gray-600">平均评分</p>
            <p className="ak-text-2xl ak-font-bold ak-text-orange-600">
              {getAverageScore(receivedRatings)}
            </p>
          </div>
        </Card>
      </div>

      {/* 选项卡 */}
      <div className="ak-border-b">
        <div className="ak-flex ak-space-x-8">
          {[
            { id: 'pending', name: '待评价', count: pendingRatings.length },
            { id: 'given', name: '我评价的', count: givenRatings.length },
            { id: 'received', name: '收到的评价', count: receivedRatings.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`ak-py-2 ak-px-1 ak-border-b-2 ak-font-medium ak-text-sm ak-flex ak-items-center ak-space-x-2 ${
                activeTab === tab.id
                  ? 'ak-border-blue-500 ak-text-blue-600'
                  : 'ak-border-transparent ak-text-gray-500 hover:ak-text-gray-700 hover:ak-border-gray-300'
              }`}
            >
              <span>{tab.name}</span>
              <span className="ak-bg-gray-100 ak-text-gray-600 ak-text-xs ak-px-2 ak-py-1 ak-rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 选项卡内容 */}
      {activeTab === 'pending' && (
        <div className="ak-space-y-4">
          {pendingRatings.length > 0 ? (
            pendingRatings.map((transaction) => (
              <RatingCard
                key={transaction.id}
                transaction={transaction}
                onSubmit={submitRating}
              />
            ))
          ) : (
            <Card className="ak-p-12 ak-text-center">
              <div className="ak-text-gray-400 ak-mb-4">
                <span className="ak-text-6xl">⭐</span>
              </div>
              <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
                暂无待评价的交易
              </h3>
              <p className="ak-text-gray-600">
                完成交易24小时后即可评价对方
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'given' && (
        <div className="ak-space-y-4">
          {givenRatings.length > 0 ? (
            givenRatings.map((rating) => (
              <RatingItem
                key={rating.id}
                rating={rating}
                type="given"
              />
            ))
          ) : (
            <Card className="ak-p-12 ak-text-center">
              <div className="ak-text-gray-400 ak-mb-4">
                <span className="ak-text-6xl">📝</span>
              </div>
              <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
                您还没有评价过任何人
              </h3>
              <p className="ak-text-gray-600">
                完成交易后记得给对方评价哦
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'received' && (
        <div className="ak-space-y-6">
          {/* 评分分布 */}
          {receivedRatings.length > 0 && (
            <Card className="ak-p-6">
              <h3 className="ak-text-lg ak-font-semibold ak-mb-4">评分分布</h3>
              <div className="ak-space-y-3">
                {getScoreDistribution(receivedRatings).map((count, index) => (
                  <div key={index} className="ak-flex ak-items-center ak-space-x-3">
                    <span className="ak-text-sm ak-w-8">{index + 1}星</span>
                    <div className="ak-flex-1 ak-bg-gray-200 ak-rounded-full ak-h-3">
                      <div
                        className="ak-bg-yellow-400 ak-h-3 ak-rounded-full ak-transition-all"
                        style={{ 
                          width: `${receivedRatings.length > 0 ? (count / receivedRatings.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="ak-text-sm ak-w-8 ak-text-right">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 收到的评价列表 */}
          <div className="ak-space-y-4">
            {receivedRatings.length > 0 ? (
              receivedRatings.map((rating) => (
                <RatingItem
                  key={rating.id}
                  rating={rating}
                  type="received"
                />
              ))
            ) : (
              <Card className="ak-p-12 ak-text-center">
                <div className="ak-text-gray-400 ak-mb-4">
                  <span className="ak-text-6xl">📊</span>
                </div>
                <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-mb-2">
                  您还没有收到评价
                </h3>
                <p className="ak-text-gray-600">
                  完成交易后，对方会给您评价
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 评价卡片组件
interface RatingCardProps {
  transaction: Transaction;
  onSubmit: (transaction: Transaction, score: number, comment: string, tags: string[]) => void;
}

function RatingCard({ transaction, onSubmit }: RatingCardProps) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const predefinedTags = ['信用良好', '回复及时', '交易顺利', '值得信赖', '态度友好'];

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(transaction, score, comment, tags);
    } finally {
      setSubmitting(false);
    }
  };

  const otherUserId = transaction.fromUserId === '1' ? transaction.toUserId : transaction.fromUserId;

  return (
    <Card className="ak-p-6">
      <div className="ak-flex ak-items-start ak-justify-between ak-mb-4">
        <div>
          <h3 className="ak-font-semibold ak-text-gray-900 ak-mb-1">
            评价用户 {otherUserId}
          </h3>
          <p className="ak-text-sm ak-text-gray-600">
            交易: {transaction.description} · {formatDate(transaction.createdAt)}
          </p>
        </div>
        <div className="ak-text-right">
          <p className="ak-text-sm ak-text-gray-600">交易金额</p>
          <p className="ak-font-bold ak-text-lg ak-text-blue-600">
            {transaction.amount.toLocaleString()} 积分
          </p>
        </div>
      </div>

      <div className="ak-space-y-4">
        {/* 评分 */}
        <div>
          <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
            评分 <span className="ak-text-red-500">*</span>
          </label>
          {renderStars(score, true, setScore)}
        </div>

        {/* 标签 */}
        <div>
          <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
            标签
          </label>
          <div className="ak-flex ak-flex-wrap ak-gap-2 ak-mb-2">
            {predefinedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={`ak-px-3 ak-py-1 ak-text-sm ak-rounded-full ak-border ak-transition-colors ${
                  tags.includes(tag)
                    ? 'ak-bg-blue-100 ak-text-blue-800 ak-border-blue-300'
                    : 'ak-bg-white ak-text-gray-700 ak-border-gray-300 hover:ak-bg-gray-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {tags.length > 0 && (
            <div className="ak-flex ak-flex-wrap ak-gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="ak-inline-flex ak-items-center ak-px-3 ak-py-1 ak-rounded-full ak-text-sm ak-bg-blue-100 ak-text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ak-ml-2 ak-text-blue-600 hover:ak-text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 评论 */}
        <div>
          <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
            评论 (可选)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="分享您的交易体验..."
            rows={3}
            className="ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500 ak-focus:border-transparent"
          />
        </div>

        {/* 提交按钮 */}
        <div className="ak-flex ak-justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="ak-bg-blue-600 hover:ak-bg-blue-700"
          >
            {submitting ? '提交中...' : '提交评价'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// 评价项组件
interface RatingItemProps {
  rating: Rating;
  type: 'given' | 'received';
}

function RatingItem({ rating, type }: RatingItemProps) {
  const otherUserId = type === 'given' ? rating.toUserId : rating.fromUserId;

  return (
    <Card className="ak-p-6">
      <div className="ak-flex ak-items-start ak-justify-between ak-mb-4">
        <div className="ak-flex ak-items-start ak-space-x-3">
          <div className="ak-text-lg">
            {renderStars(rating.score)}
          </div>
          <div>
            <h3 className="ak-font-semibold ak-text-gray-900 ak-mb-1">
              {type === 'given' ? '您评价了' : '您收到了来自'} 用户 {otherUserId} 的评价
            </h3>
            <p className="ak-text-sm ak-text-gray-600">
              {formatDate(rating.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {rating.comment && (
        <div className="ak-mb-4">
          <p className="ak-text-gray-900">{rating.comment}</p>
        </div>
      )}

      {rating.tags && rating.tags.length > 0 && (
        <div className="ak-flex ak-flex-wrap ak-gap-2">
          {rating.tags.map((tag) => (
            <span
              key={tag}
              className="ak-bg-gray-100 ak-text-gray-700 ak-text-xs ak-px-2 ak-py-1 ak-rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}