'use client'

import { HandSituation } from '../../data/quiz-questions'

const SUIT_COLOR: Record<string, string> = {
  h: 'text-red-400',
  d: 'text-red-400',
  s: 'text-zinc-900',
  c: 'text-zinc-900',
}

const SUIT_SYMBOL: Record<string, string> = {
  h: '♥',
  d: '♦',
  s: '♠',
  c: '♣',
}

function Card({ code = '', faceDown = false }: { code?: string; faceDown?: boolean }) {
  if (faceDown) {
    return (
      <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-blue-900 to-blue-700 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xl font-bold shadow-md">
        ?
      </div>
    )
  }
  const rank = code.slice(0, -1)
  const suit = code.slice(-1)
  return (
    <div className="w-10 h-14 rounded-lg bg-zinc-100 border border-white/20 flex flex-col items-center justify-center shadow-md gap-0.5">
      <span className={`text-sm font-black leading-none ${SUIT_COLOR[suit]}`}>{rank}</span>
      <span className={`text-base leading-none ${SUIT_COLOR[suit]}`}>{SUIT_SYMBOL[suit]}</span>
    </div>
  )
}

const POSITION_LABEL: Record<string, string> = {
  UTG: 'UTG (언더더건)',
  CO: 'CO (컷오프)',
  BTN: 'BTN (버튼)',
  SB: 'SB (스몰블라인드)',
  BB: 'BB (빅블라인드)',
  HJ: 'HJ (하이잭)',
}

export default function HandDisplay({ hand }: { hand: HandSituation }) {
  const isPreflop = hand.boardCards.length === 0

  return (
    <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 space-y-5">
      {/* Position + Stack info */}
      <div className="flex items-center justify-between text-sm">
        <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold">
          {POSITION_LABEL[hand.position] ?? hand.position}
        </span>
        <div className="flex gap-4 text-zinc-400">
          <span>팟 <b className="text-white">{hand.potBB}bb</b></span>
          <span>내 스택 <b className="text-white">{hand.heroStackBB}bb</b></span>
        </div>
      </div>

      {/* Last action */}
      {hand.lastAction && (
        <div className="text-center text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl py-2 px-4">
          {hand.lastAction}
        </div>
      )}

      {/* Board */}
      {!isPreflop && (
        <div>
          <p className="text-zinc-500 text-xs mb-2 uppercase tracking-wider">보드</p>
          <div className="flex gap-2">
            {hand.boardCards.map((c, i) => <Card key={i} code={c} />)}
          </div>
        </div>
      )}

      {/* Hero hand */}
      <div>
        <p className="text-zinc-500 text-xs mb-2 uppercase tracking-wider">내 패 (히어로)</p>
        <div className="flex gap-2">
          {hand.heroCards.map((c, i) => <Card key={i} code={c} />)}
          {/* Villain cards always face down */}
          <div className="ml-4 flex gap-2 opacity-40">
            <Card faceDown />
            <Card faceDown />
          </div>
        </div>
      </div>
    </div>
  )
}
