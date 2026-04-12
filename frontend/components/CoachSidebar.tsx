import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface EVComparison {
  user_action: { action: string; ev: number };
  recommended_action: { action: string; ev: number };
  ev_diff: number;
}

interface CoachSidebarProps {
  hand: {
    hand_id: string;
    ai_feedback?: string;
    ev_comparison?: EVComparison;
  };
}

const CoachSidebar: React.FC<CoachSidebarProps> = ({ hand }) => {
  const chartData = hand.ev_comparison ? [
    { name: 'User', ev: hand.ev_comparison.user_action.ev, action: hand.ev_comparison.user_action.action },
    { name: 'GTO', ev: hand.ev_comparison.recommended_action.ev, action: hand.ev_comparison.recommended_action.action }
  ] : [];

  return (
    <div className="h-full bg-zinc-900 p-6 overflow-y-auto border-l border-zinc-800">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <AlertCircle className="text-blue-500" />
        PokerLab AI 코칭 분석
      </h2>

      {hand.ai_feedback ? (
        <div className="space-y-8">
          {/* AI Feedback Text */}
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">전략적 조언</h3>
            <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{hand.ai_feedback}</p>
          </div>

          {/* EV Comparison Chart */}
          {hand.ev_comparison && (
            <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">기대 수익(EV) 비교 (단위: BB)</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={12} tickFormatter={(val) => val === 'User' ? '플레이어' : 'AI 추천'} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                      itemStyle={{ color: '#f4f4f5' }}
                      formatter={(value: number) => [`${value.toFixed(2)} BB`, '기대 수익']}
                    />
                    <Bar dataKey="ev" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'GTO' ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-between text-xs text-zinc-500">
                <span>내 선택: {hand.ev_comparison.user_action.action}</span>
                <span className="text-red-400">손실액: {hand.ev_comparison.ev_diff.toFixed(2)} BB</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <p>핸드 마커를 선택하여 분석 내용을 확인하세요</p>
        </div>
      )}
    </div>
  );
};

export default CoachSidebar;