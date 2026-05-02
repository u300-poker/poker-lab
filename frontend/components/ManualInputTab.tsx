'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Search } from 'lucide-react'

const GAME_TYPES = ['cEV', 'HU', 'ICM']
const PLAYER_COUNTS_PRE = ['2', '3', '4', '5', '6', '9']
const PLAYER_COUNTS_POST = ['2', '3']
const STRATEGIES_PRE = ['RFI', 'LMP']
const STRATEGIES_POST = ['SRP', '3BET', '4BET', 'LMP']
const STACK_DIST = ['EVEN', 'MIX']
const STACK_SIZES_PRE = ['2','3','5','6','7','8','9','10','11','12','13','15','16','17','20','25','30','35','40','45','50','60','75','100']
const STACK_SIZES_POST = ['7','10','12','15','16','20','25','30','40','45','50','60','75','100']
const POSITIONS = ['UTG','UTG1','UTG2','LJ','HJ','CO','BTN','SB','BB']

const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2']
const SUITS = [
  { v: 's', label: '♠' },
  { v: 'h', label: '♥' },
  { v: 'd', label: '♦' },
  { v: 'c', label: '♣' },
]

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-2 mt-4">
      {label}
    </p>
  )
}

function PillGroup({ options, value, onChange }: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
            ${value === opt
              ? 'bg-white text-black border-white'
              : 'bg-black/20 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
            }`}>
          {opt}
        </button>
      ))}
    </div>
  )
}

function CardSelect({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const rank = value.length >= 2 ? value.slice(0, -1) : ''
  const suit = value.length >= 2 ? value.slice(-1) : 's'
  const isRed = suit === 'h' || suit === 'd'
  return (
    <div className="flex flex-col gap-1.5 items-center">
      {placeholder && <span className="text-zinc-600 text-[10px] uppercase tracking-wider">{placeholder}</span>}
      <div className="flex flex-col gap-1.5">
        <select value={rank} onChange={e => onChange(e.target.value + suit)}
          className="bg-black/30 border border-white/10 rounded-xl px-1 py-2 text-white text-sm font-bold outline-none w-14 text-center hover:border-white/20 focus:border-indigo-500 transition-colors cursor-pointer">
          <option value="">-</option>
          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={suit} onChange={e => onChange((rank || 'A') + e.target.value)}
          className={`bg-black/30 border border-white/10 rounded-xl px-1 py-2 text-base font-bold outline-none w-14 text-center hover:border-white/20 focus:border-indigo-500 transition-colors cursor-pointer ${isRed ? 'text-red-400' : 'text-white'}`}>
          {SUITS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
      </div>
    </div>
  )
}

interface Props {
  onResult: (result: any) => void
}

export default function ManualInputTab({ onResult }: Props) {
  const [phase, setPhase] = useState<'PREFLOP' | 'POSTFLOP'>('PREFLOP')

  // 공통
  const [gameType, setGameType] = useState('cEV')
  const [players, setPlayers] = useState('6')
  const [strategy, setStrategy] = useState('RFI')
  const [stackDist, setStackDist] = useState('EVEN')
  const [stackBB, setStackBB] = useState('100')
  const [position, setPosition] = useState('BTN')
  const [oppPosition, setOppPosition] = useState('BB')

  // 카드
  const [hero1, setHero1] = useState('As')
  const [hero2, setHero2] = useState('Kh')
  const [board, setBoard] = useState(['','','','',''])
  const setBoard$ = (i: number, v: string) => setBoard(p => p.map((c, idx) => idx === i ? v : c))

  const [potBB, setPotBB] = useState('')
  const [actions, setActions] = useState('')
  const [notes, setNotes] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const boardCount = phase === 'POSTFLOP' ? 5 : 0
  const boardLabels = ['Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River']

  const handlePhaseChange = (p: 'PREFLOP' | 'POSTFLOP') => {
    setPhase(p)
    if (p === 'POSTFLOP' && !['2','3'].includes(players)) setPlayers('2')
    setStrategy(p === 'PREFLOP' ? 'RFI' : 'SRP')
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analyze-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blinds: `${stackBB}BB`,
          position,
          hero_cards: [hero1, hero2].filter(c => c.length >= 2),
          board_cards: board.filter(c => c.length >= 2),
          pot_size: parseFloat(potBB) || 0,
          stack: `${stackBB}BB`,
          actions: `${players}명 테이블 ${phase}, ${strategy}, ${position} vs ${phase === 'POSTFLOP' ? oppPosition : ''}. ${actions}`,
          notes: `Format: ${gameType}, Stack dist: ${stackDist}. ${notes}`,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      onResult(await res.json())
    } catch (e: any) {
      alert('분석 실패: ' + (e.message ?? '서버 오류'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div key="manual-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}>
      {/* PREFLOP / POSTFLOP 탭 */}
      <div className="flex gap-2 mb-6 bg-black/30 p-1.5 rounded-2xl">
        {(['PREFLOP', 'POSTFLOP'] as const).map(p => (
          <button key={p} onClick={() => handlePhaseChange(p)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all
              ${phase === p
                ? 'bg-white text-black shadow'
                : 'text-zinc-500 hover:text-white'
              }`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 좌: 필터 패널 ── */}
        <div className="bg-black/20 border border-white/5 rounded-3xl p-5">
          <SectionHeader label="Players" />
          <PillGroup options={phase === 'PREFLOP' ? PLAYER_COUNTS_PRE : PLAYER_COUNTS_POST}
            value={players} onChange={setPlayers} />

          <SectionHeader label="Format" />
          <PillGroup options={GAME_TYPES} value={gameType} onChange={setGameType} />

          <SectionHeader label="Strategy" />
          <PillGroup options={phase === 'PREFLOP' ? STRATEGIES_PRE : STRATEGIES_POST}
            value={strategy} onChange={setStrategy} />

          <SectionHeader label="Stack Distribution" />
          <PillGroup options={STACK_DIST} value={stackDist} onChange={setStackDist} />

          <SectionHeader label="Effective Stacksize" />
          <PillGroup options={phase === 'PREFLOP' ? STACK_SIZES_PRE : STACK_SIZES_POST}
            value={stackBB} onChange={setStackBB} />

          {phase === 'POSTFLOP' && (
            <>
              <SectionHeader label="Positions" />
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1.5">IP (나)</p>
              <PillGroup options={POSITIONS} value={position} onChange={setPosition} />
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1.5 mt-3">OOP (상대)</p>
              <PillGroup options={POSITIONS} value={oppPosition} onChange={setOppPosition} />
            </>
          )}

          {phase === 'PREFLOP' && (
            <>
              <SectionHeader label="Position" />
              <PillGroup options={POSITIONS} value={position} onChange={setPosition} />
            </>
          )}
        </div>

        {/* ── 우: 입력 패널 ── */}
        <div className="lg:col-span-2 bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
          {/* 헤더 */}
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">상황 요약</span>
            <span className="text-zinc-600">·</span>
            <span className="text-white text-xs font-bold tracking-wide">
              {players}P · {stackBB}BB · {strategy} · {position}{phase === 'POSTFLOP' ? ` vs ${oppPosition}` : ''}
            </span>
          </div>

          {/* 히어로 카드 */}
          <div>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-3">Hero Cards</p>
            <div className="flex gap-3">
              <CardSelect value={hero1} onChange={setHero1} placeholder="Card 1" />
              <CardSelect value={hero2} onChange={setHero2} placeholder="Card 2" />
            </div>
          </div>

          {/* 보드 카드 (포스트플랍) */}
          {phase === 'POSTFLOP' && (
            <div>
              <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-3">Board Cards</p>
              <div className="flex gap-2.5 flex-wrap">
                {boardLabels.slice(0, boardCount).map((label, i) => (
                  <CardSelect key={i} value={board[i]} onChange={v => setBoard$(i, v)} placeholder={label} />
                ))}
              </div>
            </div>
          )}

          {/* 팟 + 액션 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-2">Pot (BB)</p>
              <input value={potBB} onChange={e => setPotBB(e.target.value)} placeholder="예: 12" type="number"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500 hover:border-white/20 transition-colors" />
            </div>
            <div>
              <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-2">Action History</p>
              <input value={actions} onChange={e => setActions(e.target.value)}
                placeholder="예: raise 3BB, call"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500 hover:border-white/20 transition-colors" />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-2">Notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="예: 상대가 타이트한 레귤러, 버블 상황"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500 hover:border-white/20 transition-colors resize-none" />
          </div>

          {/* 분석 버튼 */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze} disabled={isAnalyzing}
            className="mt-auto w-full py-4 px-8 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-base shadow-[0_10px_20px_-10px_rgba(99,102,241,0.5)]">
            {isAnalyzing
              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />분석 중...</>
              : <><Search size={20} strokeWidth={2.5} />AI 분석 시작</>}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
