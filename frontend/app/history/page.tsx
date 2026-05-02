'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, XCircle, BarChart2, Sparkles } from 'lucide-react'
import { loadHistory, clearHistory, importHistory, summarizeHistory, SavedHand, byStreet, byAction, byKeyword } from '../../lib/storage'
import { DEMO_HANDS } from '../../lib/demo-seed'
import { motion } from 'framer-motion'
import CoachSidebar from '../../components/CoachSidebar'

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  warning:  { label: 'Warning',  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle },
  good:     { label: 'Good',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<SavedHand[]>([])
  const [tab, setTab] = useState<'overview' | 'street' | 'mistake' | 'stack'>('overview')
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null)
  const [selectedHand, setSelectedHand] = useState<SavedHand | null>(null)
  const [activeDecisionIdx, setActiveDecisionIdx] = useState<number>(0)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const summary = summarizeHistory(history)

  const handleClear = () => {
    if (!confirm('전체 히스토리를 삭제할까요?')) return
    clearHistory()
    setHistory([])
  }

  const handleLoadDemo = () => {
    const added = importHistory(DEMO_HANDS)
    setHistory(loadHistory())
    alert(`데모 데이터 ${added}개 추가됨`)
  }

  if (selectedHand) {
    const STREET_LABEL: Record<string, string> = { preflop: '프리플랍', flop: '플랍', turn: '턴', river: '리버' }
    const SEVERITY_DOT: Record<string, string> = { critical: '🔴', warning: '🟡', good: '🟢' }
    const decisions = selectedHand.decisions ?? []

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <button onClick={() => setSelectedHand(null)} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} /> 돌아가기
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              {selectedHand.imageData && (
                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
                  <img src={selectedHand.imageData} alt="핸드 이미지" className="w-full object-contain max-h-[420px]" />
                </div>
              )}

              {/* Hand Info */}
              <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Hand ID', value: selectedHand.hand_id?.replace(/^#/, '') },
                    { label: '블라인드', value: selectedHand.blinds },
                    { label: '히어로 카드', value: selectedHand.hero_cards?.join(' ') || '-' },
                    { label: '보드 카드', value: selectedHand.board_cards?.join(' ') || '-' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-black/20 rounded-2xl p-4">
                      <p className="text-zinc-500 mb-1">{label}</p>
                      <p className="font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Street Decision Tabs */}
              {decisions.length > 0 && (
                <div className="bg-zinc-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/5">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-4">결정 시점별 분석</p>
                  <div className="flex gap-2 flex-wrap">
                    {decisions.map((dec: any, i: number) => (
                      <motion.button key={i} whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveDecisionIdx(i)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                          activeDecisionIdx === i
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                        }`}>
                        <span>{SEVERITY_DOT[dec.severity] ?? '○'}</span>
                        <span>{STREET_LABEL[dec.street] ?? dec.street}</span>
                        <span className="text-xs opacity-70">{dec.hero_action}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 h-[calc(100vh-160px)] sticky top-8">
              {(() => {
                const dec = decisions[activeDecisionIdx] ?? decisions[0]
                if (!dec) return <div className="text-zinc-500">분석 데이터가 없습니다</div>

                const STREET_LABEL: Record<string, string> = { preflop: '프리플랍', flop: '플랍', turn: '턴', river: '리버' }
                const sidebarHand = {
                  hand_id: `${selectedHand.hand_id} · ${STREET_LABEL[dec.street] ?? dec.street}`,
                  blinds: selectedHand.blinds,
                  severity: dec.severity,
                  headline: dec.headline,
                  mistake_summary: dec.mistake_summary,
                  why_bad: dec.why_bad,
                  what_to_do: dec.what_to_do,
                  key_concept: dec.key_concept,
                  ev_comparison: dec.ev_comparison,
                  street_equities: selectedHand.street_equities,
                }
                return <CoachSidebar hand={sidebarHand} />
              })()}
            </div>
          </motion.div>
        </div>
      </div>
    )
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
          <div className="flex items-center gap-3">
            <button onClick={handleLoadDemo} className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              <Sparkles size={14} />
              데모 데이터 로드
            </button>
            {history.length > 0 && (
              <button onClick={handleClear} className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-sm transition-colors">
                <Trash2 size={14} />
                전체 삭제
              </button>
            )}
          </div>
        </div>

        {/* Analysis Tabs */}
        {history.length > 0 && (
          <div className="flex gap-2 mb-6 bg-zinc-900/30 p-1 rounded-xl border border-white/5">
            {[
              { id: 'overview', label: '요약' },
              { id: 'street', label: '스트릿별' },
              { id: 'mistake', label: '약점별' },
              { id: 'stack', label: '스택별' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Summary */}
        {summary && tab === 'overview' && (
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

        {/* Street Analysis */}
        {tab === 'street' && history.length > 0 && (() => {
          const streetData = byStreet(history)
          const STREET_NAMES: Record<string, string> = { preflop: '프리플랍', flop: '플랍', turn: '턴', river: '리버' }

          if (selectedStreet) {
            const mistakes = history.flatMap(hand =>
              (hand.decisions ?? [])
                .filter(d => d.street === selectedStreet)
                .map(d => ({ hand, decision: d }))
            )

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setSelectedStreet(null)} className="text-indigo-400 hover:text-indigo-300 text-sm">
                    ← 돌아가기
                  </button>
                  <h2 className="text-sm font-semibold text-zinc-300">{STREET_NAMES[selectedStreet]} 상세 분석</h2>
                </div>

                {mistakes.map((m, i) => {
                  const sev = SEVERITY_CONFIG[m.decision.severity]
                  const SevIcon = sev.icon
                  const date = new Date(m.hand.savedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

                  return (
                    <div key={i} className={`${sev.bg} border ${sev.border} rounded-xl p-4`}>
                      <div className="flex items-start gap-3 mb-2">
                        <SevIcon size={16} className={sev.color} />
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">{m.hand.headline || m.hand.hand_id}</p>
                          <p className="text-zinc-500 text-xs mt-0.5">{date} · {m.hand.blinds} · {m.hand.hero_cards.join(' ')}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.color}`}>{sev.label}</span>
                      </div>

                      <div className="space-y-2 text-xs mt-3 pl-5">
                        <div>
                          <p className="text-zinc-400">액션: <span className="text-white font-semibold">{m.decision.hero_action}</span></p>
                        </div>
                        {m.decision.why_bad && m.decision.why_bad.length > 0 && (
                          <div>
                            <p className="text-zinc-400 mb-1">문제점:</p>
                            <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                              {m.decision.why_bad.map((w, j) => <li key={j}>{w}</li>)}
                            </ul>
                          </div>
                        )}
                        {m.decision.what_to_do && (
                          <div>
                            <p className="text-emerald-400">개선 방법: <span className="text-zinc-300">{m.decision.what_to_do}</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {mistakes.length === 0 && (
                  <p className="text-zinc-500 text-sm text-center py-8">해당 스트릿의 데이터가 없습니다</p>
                )}
              </div>
            )
          }

          return (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">스트릿별 약점 분석 (클릭하면 상세 보기)</h2>
              {streetData.map(s => {
                const total = s.critical + s.warning + s.good
                if (total === 0) return null
                const critRate = Math.round((s.critical / total) * 100)
                const warnRate = Math.round((s.warning / total) * 100)
                const goodRate = Math.round((s.good / total) * 100)
                return (
                  <button key={s.street} onClick={() => setSelectedStreet(s.street)}
                    className="w-full text-left bg-zinc-900/40 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-zinc-200">{STREET_NAMES[s.street] || s.street}</span>
                      <span className="text-xs text-zinc-500">{total}회</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${goodRate}%` }} />
                      <div className="h-full bg-orange-500" style={{ width: `${warnRate}%` }} />
                      <div className="h-full bg-red-500" style={{ width: `${critRate}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-emerald-400">✓ {s.good}</span>
                      <span className="text-orange-400">⚠ {s.warning}</span>
                      <span className="text-red-400">✕ {s.critical}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })()}

        {/* Mistake Type Analysis */}
        {tab === 'mistake' && history.length > 0 && (() => {
          const MISTAKES = [
            '팟 오즈 계산 미숙',
            'SPR(Stack-to-Pot Ratio) 판단 미스',
            '포지션 활용 부족',
            '오버폴드',
            '무리한 블러핑',
            '밸류 추출 실패',
            '사이징 텔',
            '보드 텍스처 변화 간과',
          ]

          const mistakeCounts: Record<string, number> = {}
          MISTAKES.forEach(m => mistakeCounts[m] = 0)

          history.forEach(hand => {
            ;(hand.decisions ?? []).forEach(d => {
              if (d.why_bad) {
                MISTAKES.forEach(mistake => {
                  if (d.why_bad?.some(w => w.includes(mistake) || mistake.includes(w?.split(' ')[0]))) {
                    mistakeCounts[mistake]++
                  }
                })
              }
            })
          })

          const sorted = MISTAKES.filter(m => mistakeCounts[m] > 0)
            .sort((a, b) => mistakeCounts[b] - mistakeCounts[a])

          return (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">주요 약점</h2>
              {sorted.length === 0 ? (
                <p className="text-zinc-500 text-sm">분석된 약점이 없습니다</p>
              ) : (
                sorted.map(m => (
                  <div key={m} className="flex items-center justify-between bg-zinc-900/40 border border-red-500/20 rounded-lg px-4 py-3">
                    <span className="text-sm text-zinc-300">{m}</span>
                    <span className="text-xs font-semibold bg-red-600/30 text-red-300 px-2.5 py-1 rounded-full">{mistakeCounts[m]}회</span>
                  </div>
                ))
              )}
            </div>
          )
        })()}

        {/* Stack Size Analysis */}
        {tab === 'stack' && history.length > 0 && (() => {
          const calculateSPR = (hand: SavedHand) => {
            const players = hand.players ?? []
            const hero = players.find(p => p.is_hero)
            if (!hero || !hand.pot_size) return null
            return hero.stack ? hero.stack / hand.pot_size : null
          }

          const stacks = { short: [] as SavedHand[], mid: [] as SavedHand[], deep: [] as SavedHand[] }

          history.forEach(hand => {
            const spr = calculateSPR(hand)
            if (spr === null) return
            if (spr <= 6) stacks.short.push(hand)
            else if (spr <= 20) stacks.mid.push(hand)
            else stacks.deep.push(hand)
          })

          const STACK_TYPES = [
            { key: 'short', label: '숏스텍 (SPR ≤ 6)', count: stacks.short.length },
            { key: 'mid', label: '미들스텍 (SPR 6~20)', count: stacks.mid.length },
            { key: 'deep', label: '딥스텍 (SPR > 20)', count: stacks.deep.length },
          ]

          return (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">스택 규모별 분석</h2>
              {STACK_TYPES.map(st => {
                const hands = stacks[st.key as keyof typeof stacks]
                const critical = hands.filter(h => h.severity === 'critical').length
                const warning = hands.filter(h => h.severity === 'warning').length
                const good = hands.filter(h => h.severity === 'good').length
                const total = hands.length

                if (total === 0) return null

                const critRate = Math.round((critical / total) * 100)
                const warnRate = Math.round((warning / total) * 100)
                const goodRate = Math.round((good / total) * 100)

                return (
                  <button key={st.key} className="w-full text-left bg-zinc-900/40 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-zinc-200">{st.label}</span>
                      <span className="text-xs text-zinc-500">{total}회</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${goodRate}%` }} />
                      <div className="h-full bg-orange-500" style={{ width: `${warnRate}%` }} />
                      <div className="h-full bg-red-500" style={{ width: `${critRate}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-emerald-400">✓ {good}</span>
                      <span className="text-orange-400">⚠ {warning}</span>
                      <span className="text-red-400">✕ {critical}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })()}

        {/* Hand list */}
        {tab === 'overview' && history.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-lg">분석된 핸드가 없습니다</p>
            <p className="text-sm mt-2">이미지를 업로드해서 분석을 시작해보세요</p>
            <button onClick={() => router.push('/')} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              분석하러 가기
            </button>
          </div>
        ) : tab === 'overview' ? (
          <div className="space-y-4">
            {history.map((hand) => {
              const sev = SEVERITY_CONFIG[hand.severity]
              const SevIcon = sev.icon
              const date = new Date(hand.savedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              return (
                <button key={hand.id} onClick={() => { setSelectedHand(hand); setActiveDecisionIdx(0); }}
                  className={`w-full text-left ${sev.bg} border ${sev.border} rounded-2xl overflow-hidden hover:bg-opacity-80 transition-all`}>
                  {hand.imageData && (
                    <div className="bg-black/50">
                      <img src={hand.imageData} alt={hand.imageFileName} className="w-full max-h-96 object-contain" />
                    </div>
                  )}
                  <div className="px-5 py-4">
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
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
