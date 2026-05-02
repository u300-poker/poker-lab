'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { loadHistory, clearHistory, summarizeHistory, SavedHand } from '../../lib/storage'

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  warning:  { label: 'Warning',  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle },
  good:     { label: 'Good',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<SavedHand[]>([])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const summary = summarizeHistory(history)

  const handleClear = () => {
    if (!confirm('전체 히스토리를 삭제할까요?')) return
    clearHistory()
    setHistory([])
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">게임 히스토리</h1>
          </div>
          {history.length > 0 && (
            <button onClick={handleClear} className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-sm transition-colors">
              <Trash2 size={14} />
              전체 삭제
            </button>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-indigo-400" />
              <p className="text-sm font-semibold text-zinc-300">세션 요약 — {summary.total}핸드 분석</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{summary.counts.good}</p>
                <p className="text-xs text-zinc-500 mt-1">Good</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{summary.counts.warning}</p>
                <p className="text-xs text-zinc-500 mt-1">Warning</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{summary.counts.critical}</p>
                <p className="text-xs text-zinc-500 mt-1">Critical</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${summary.goodRate}%` }} />
              <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.round(summary.counts.warning / summary.total * 100)}%` }} />
              <div className="h-full bg-red-500 transition-all" style={{ width: `${summary.criticalRate}%` }} />
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              {summary.criticalRate > 30
                ? '⚠ Critical 비율이 높습니다. 의사결정 패턴 점검이 필요해요.'
                : summary.goodRate > 60
                ? '✅ 전반적으로 좋은 플레이를 하고 있습니다.'
                : '📊 꾸준히 분석하면 패턴이 보입니다.'}
            </p>
          </div>
        )}

        {/* Hand list */}
        {history.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-lg">분석된 핸드가 없습니다</p>
            <p className="text-sm mt-2">이미지를 업로드해서 분석을 시작해보세요</p>
            <button onClick={() => router.push('/')} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              분석하러 가기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((hand) => {
              const sev = SEVERITY_CONFIG[hand.severity]
              const SevIcon = sev.icon
              const date = new Date(hand.savedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              return (
                <div key={hand.id} className={`${sev.bg} border ${sev.border} rounded-2xl px-5 py-4`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <SevIcon size={16} className={sev.color} />
                      <div>
                        <p className="text-white font-semibold text-sm">{hand.headline || hand.hand_id}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{date} · {hand.blinds} · {hand.hero_cards.join(' ')}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${sev.bg} ${sev.color}`}>
                      {sev.label}
                    </span>
                  </div>
                  {hand.mistake_summary && (
                    <p className="text-zinc-400 text-xs mt-3 leading-relaxed">{hand.mistake_summary}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
