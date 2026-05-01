'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart2, Target, TrendingUp, Zap } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { loadHistory, summarizeHistory, byStreet, byAction, byKeyword, SavedHand } from '../../lib/storage'

const STREET_LABEL: Record<string, string> = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning: '#eab308',
  good: '#10b981',
}

const PIE_COLORS = ['#ef4444', '#eab308', '#10b981', '#6366f1', '#f97316', '#06b6d4']

export default function DashboardPage() {
  const router = useRouter()
  const [history, setHistory] = useState<SavedHand[]>([])

  useEffect(() => { setHistory(loadHistory()) }, [])

  const summary = summarizeHistory(history)
  const streetData = byStreet(history).map(s => ({ ...s, street: STREET_LABEL[s.street] ?? s.street }))
  const actionData = byAction(history)
  const keywords = byKeyword(history)

  const worstStreet = byStreet(history).reduce((prev, cur) =>
    cur.critical > prev.critical ? cur : prev,
    { street: '-', critical: -1, warning: 0, good: 0 }
  )
  const topKeyword = keywords[0]?.concept ?? '-'

  const isEmpty = history.length === 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">플레이 패턴 대시보드</h1>
        </div>

        {isEmpty ? (
          <div className="text-center py-32 text-zinc-600">
            <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">아직 분석된 핸드가 없습니다</p>
            <p className="text-sm mt-2">이미지를 업로드해서 분석을 시작해보세요</p>
            <button onClick={() => router.push('/')}
              className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              분석하러 가기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<BarChart2 size={16} />} label="총 분석 핸드" value={`${summary?.total ?? 0}개`} />
              <StatCard icon={<TrendingUp size={16} />} label="Good 비율" value={`${summary?.goodRate ?? 0}%`} color="text-emerald-400" />
              <StatCard icon={<Target size={16} />} label="최다 실수 스트릿"
                value={worstStreet.critical > 0 ? (STREET_LABEL[worstStreet.street] ?? worstStreet.street) : '-'}
                color="text-red-400" />
              <StatCard icon={<Zap size={16} />} label="반복 실수 키워드" value={topKeyword} color="text-yellow-400" small />
            </div>

            {/* 차트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 스트릿별 바 차트 */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
                <p className="text-zinc-400 text-sm font-semibold mb-4">스트릿별 결정 분포</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={streetData} margin={{ left: -20 }}>
                    <XAxis dataKey="street" stroke="#52525b" fontSize={11} />
                    <YAxis stroke="#52525b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="critical" name="Critical" stackId="a" fill={SEVERITY_COLORS.critical} radius={[0,0,0,0]} />
                    <Bar dataKey="warning" name="Warning" stackId="a" fill={SEVERITY_COLORS.warning} />
                    <Bar dataKey="good" name="Good" stackId="a" fill={SEVERITY_COLORS.good} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 액션별 도넛 차트 */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
                <p className="text-zinc-400 text-sm font-semibold mb-4">액션별 Critical 비율</p>
                {actionData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">
                    decisions 데이터 없음
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={actionData.map(a => ({ name: a.action, value: a.critical }))}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {actionData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                        formatter={(v: number) => [`${v}회`, 'Critical']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 키워드 태그 */}
            {keywords.length > 0 && (
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
                <p className="text-zinc-400 text-sm font-semibold mb-4">반복 실수 패턴</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(({ concept, count }) => (
                    <span key={concept}
                      className="flex items-center gap-1.5 bg-zinc-800 border border-white/10 rounded-full px-3 py-1.5 text-sm text-zinc-300">
                      {concept}
                      <span className="bg-red-500/20 text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 히스토리 링크 */}
            <div className="text-center">
              <button onClick={() => router.push('/history')}
                className="text-zinc-500 hover:text-white text-sm transition-colors underline underline-offset-4">
                전체 핸드 히스토리 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color = 'text-white', small = false }: {
  icon: React.ReactNode
  label: string
  value: string
  color?: string
  small?: boolean
}) {
  return (
    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-2">
        {icon}
        {label}
      </div>
      <p className={`font-bold ${small ? 'text-sm' : 'text-2xl'} ${color} truncate`}>{value}</p>
    </div>
  )
}
