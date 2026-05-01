import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle, BookOpen, XCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import EquityChart from './EquityChart';

interface EVComparison {
  user_action: { action: string; ev: number };
  recommended_action: { action: string; ev: number };
  ev_diff: number;
}

interface CoachSidebarProps {
  hand: {
    hand_id?: string;
    blinds?: string;
    severity?: 'critical' | 'warning' | 'good';
    headline?: string;
    mistake_summary?: string;
    why_bad?: string[];
    what_to_do?: string;
    key_concept?: string;
    detail?: string;
    ai_feedback?: string;
    ev_comparison?: EVComparison;
    street_equities?: any[];
  };
}

// blinds 문자열("1/2", "5/10")에서 빅블라인드 금액 파싱
function parseBigBlind(blinds?: string): number | null {
  if (!blinds) return null;
  const parts = blinds.split('/');
  if (parts.length < 2) return null;
  const bb = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
  return isNaN(bb) ? null : bb;
}

const SEVERITY_CONFIG = {
  critical: {
    label: '큰 실수',
    sublabel: '스택에 심각한 손실',
    dot: '🔴',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    text: 'text-red-400',
    icon: XCircle,
  },
  warning: {
    label: '아쉬운 선택',
    sublabel: '더 나은 옵션이 있었어요',
    dot: '🟡',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/25',
    text: 'text-yellow-400',
    icon: AlertCircle,
  },
  good: {
    label: '좋은 플레이',
    sublabel: '최적에 가까운 선택이에요',
    dot: '🟢',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-400',
    icon: CheckCircle,
  },
};

const CoachSidebar: React.FC<CoachSidebarProps> = ({ hand }) => {
  const [detailOpen, setDetailOpen] = useState(false);

  const isStructured = !!hand.headline;
  const severity = hand.severity ?? 'warning';
  const sev = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.warning;
  const SevIcon = sev.icon;

  const bb = parseBigBlind(hand.blinds);
  const evDiff = hand.ev_comparison?.ev_diff ?? 0;
  const moneyLoss = bb !== null ? evDiff * bb : null;

  const chartData = hand.ev_comparison?.user_action ? [
    { name: 'User', ev: hand.ev_comparison.user_action.ev, action: hand.ev_comparison.user_action.action },
    { name: 'GTO', ev: hand.ev_comparison.recommended_action.ev, action: hand.ev_comparison.recommended_action.action },
  ] : [];

  const isLoss = (hand.ev_comparison?.user_action?.ev ?? 0) < (hand.ev_comparison?.recommended_action?.ev ?? 0);

  return (
    <div className="h-full bg-zinc-950 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">AI 코치 피드백</p>
        {hand.hand_id && <p className="text-zinc-500 text-xs">{hand.hand_id.startsWith('#') ? hand.hand_id : `Hand ${hand.hand_id}`}</p>}
      </div>

      {isStructured ? (
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* Severity Banner */}
          <div className={`${sev.bg} border ${sev.border} rounded-2xl px-5 py-4`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{sev.dot}</span>
              <div>
                <p className={`font-bold text-base ${sev.text}`}>{sev.label}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{sev.sublabel}</p>
              </div>
            </div>
          </div>

          {/* Money Loss Card */}
          {isLoss && evDiff > 0 && (
            <div className="bg-zinc-900/80 border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">이 선택으로 인한 손실</p>
                <p className="text-white font-bold text-2xl">
                  -{evDiff.toFixed(1)} <span className="text-zinc-500 text-sm font-normal">BB</span>
                </p>
                {moneyLoss !== null && (
                  <p className="text-zinc-500 text-xs mt-1">
                    ≈ 약 <span className="text-red-400 font-semibold">{moneyLoss.toLocaleString('ko-KR')}원</span> 손해
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-xs mb-1">최선의 선택이었다면</p>
                <p className="text-emerald-400 font-bold text-lg">
                  {hand.ev_comparison?.recommended_action?.action}
                </p>
              </div>
            </div>
          )}

          {/* Headline */}
          {hand.headline && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={13} className="text-zinc-500" />
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  {severity === 'good' ? '핸드 요약' : '핵심 실수'}
                </span>
              </div>
              <p className="text-white font-bold text-lg leading-tight">{hand.headline}</p>
            </div>
          )}

          {/* Key Concept Badge */}
          {hand.key_concept && (
            <div className="flex items-center gap-2">
              <BookOpen size={13} className="text-indigo-400" />
              <span className="text-indigo-300 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                {hand.key_concept}
              </span>
            </div>
          )}

          {/* Mistake Summary */}
          {hand.mistake_summary && (
            <p className="text-zinc-300 text-sm leading-relaxed">{hand.mistake_summary}</p>
          )}

          {/* Equity Chart */}
          {hand.street_equities && hand.street_equities.length > 0 && (
            <EquityChart streetEquities={hand.street_equities} />
          )}

          {/* Why Bad — good play일 때는 숨김 */}
          {severity !== 'good' && hand.why_bad && hand.why_bad.length > 0 && (
            <div className="space-y-2">
              <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">왜 나쁜가</p>
              {hand.why_bad.map((reason, i) => (
                <div key={i} className="flex gap-3 items-start bg-zinc-900/60 rounded-xl px-4 py-3">
                  <span className="text-red-400 font-bold text-xs mt-0.5 shrink-0">{i + 1}</span>
                  <p className="text-zinc-300 text-sm leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* What To Do — good play일 때는 "잘 하신 이유"로 변경 */}
          {hand.what_to_do && (
            <div className={`${severity === 'good' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-2xl px-5 py-4`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  {severity === 'good' ? '잘 하신 이유' : '이렇게 했어야'}
                </span>
              </div>
              <p className="text-zinc-200 text-sm leading-relaxed">{hand.what_to_do}</p>
            </div>
          )}

          {/* Action Comparison — rating 기반 */}
          {hand.ev_comparison && (() => {
            const options: {action: string; rating: string; reason: string; is_hero_choice: boolean; score: number; ev?: number}[] =
              (hand.ev_comparison as any).options ?? [];
            if (options.length === 0) return null;

            const ratingConfig: Record<string, {label: string; color: string; bg: string; bar: string}> = {
              best:  { label: '최선', color: 'text-emerald-400', bg: 'bg-emerald-500/15', bar: '#10b981' },
              good:  { label: '괜찮음', color: 'text-blue-400',    bg: 'bg-blue-500/15',    bar: '#3b82f6' },
              okay:  { label: '보통',  color: 'text-zinc-400',    bg: 'bg-zinc-700/40',    bar: '#52525b' },
              bad:   { label: '나쁨',  color: 'text-red-400',     bg: 'bg-red-500/15',     bar: '#ef4444' },
            };
            const maxScore = 4;

            return (
              <div className="bg-zinc-900/60 rounded-2xl px-5 py-4 space-y-3">
                <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">선택지 비교</p>
                {options.map((o, i) => {
                  const rc = ratingConfig[o.rating] ?? ratingConfig.okay;
                  const pct = (o.score / maxScore) * 100;
                  return (
                    <div key={i} className={`rounded-xl p-3 border ${o.is_hero_choice ? 'border-white/10' : 'border-transparent'} bg-zinc-900/40`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{o.action}</span>
                          {o.is_hero_choice && (
                            <span className="text-xs bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full">내 선택</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {o.ev != null && (
                            <span className={`text-xs font-mono font-bold ${o.ev >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {o.ev >= 0 ? '+' : ''}{o.ev.toFixed(1)} BB
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rc.bg} ${rc.color}`}>
                            {rc.label}
                          </span>
                        </div>
                      </div>
                      {/* 비율 바 */}
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: rc.bar }}
                        />
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{o.reason}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Detail Accordion */}
          {hand.detail && (
            <div className="bg-zinc-900/40 rounded-2xl overflow-hidden border border-white/5">
              <button
                onClick={() => setDetailOpen(!detailOpen)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb size={14} className="text-yellow-400" />
                  <span className="text-zinc-300 text-sm font-semibold">상세 분석</span>
                </div>
                {detailOpen
                  ? <ChevronUp size={16} className="text-zinc-500" />
                  : <ChevronDown size={16} className="text-zinc-500" />}
              </button>
              <AnimatePresence>
                {detailOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-white/5">
                      <p className="text-zinc-400 text-sm leading-relaxed">{hand.detail}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        // Legacy fallback
        <div className="flex-1 px-6 py-5 space-y-5">
          {hand.ai_feedback ? (
            <>
              <div className="bg-zinc-900/60 rounded-2xl px-5 py-4">
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{hand.ai_feedback}</p>
              </div>
              {hand.ev_comparison && (
                <div className="bg-zinc-900/60 rounded-2xl px-5 py-4 space-y-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">EV 비교 (BB)</p>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 36, top: 4, bottom: 4 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={11} width={52}
                          tickFormatter={(v) => v === 'User' ? '내 선택' : 'AI 추천'} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                          itemStyle={{ color: '#f4f4f5', fontSize: 12 }}
                          formatter={(value: number) => [`${value.toFixed(2)} BB`, 'EV']}
                        />
                        <Bar dataKey="ev" radius={[0, 6, 6, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={index} fill={entry.name === 'GTO' ? '#3b82f6' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>내 선택: {hand.ev_comparison?.user_action?.action}</span>
                    <span className="text-red-400">손실: {hand.ev_comparison?.ev_diff?.toFixed(2)} BB</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
              <p className="text-sm">분석 결과가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoachSidebar;
