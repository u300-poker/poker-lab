'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

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
    <div className="flex items-center gap-2 mb-2 mt-3">
      <span className="text-[#a09070] text-xs">←</span>
      <span className="text-[#c8b89a] text-[11px] font-bold tracking-widest uppercase">{label}</span>
      <span className="text-[#a09070] text-xs">→</span>
    </div>
  )
}

function PillGroup({ options, value, onChange }: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-1">
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all
            ${value === opt
              ? 'bg-[#c8b89a] text-[#1a1f2e] border-[#c8b89a]'
              : 'bg-transparent text-[#8a8a9a] border-[#3a3f5a] hover:border-[#c8b89a] hover:text-[#c8b89a]'
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
  return (
    <div className="flex flex-col gap-1 items-center">
      {placeholder && <span className="text-[#6a6a7a] text-[10px]">{placeholder}</span>}
      <select value={rank} onChange={e => onChange(e.target.value + suit)}
        className="bg-[#252a3a] border border-[#3a3f5a] rounded-lg px-1 py-1.5 text-[#c8b89a] text-xs outline-none w-14 text-center">
        <option value="">-</option>
        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={suit} onChange={e => onChange((rank || 'A') + e.target.value)}
        className="bg-[#252a3a] border border-[#3a3f5a] rounded-lg px-1 py-1.5 text-[#c8b89a] text-xs outline-none w-14 text-center">
        {SUITS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
      </select>
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
      transition={{ duration: 0.2 }}
      className="rounded-2xl overflow-hidden border border-[#2a2f45]"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #1e2438 100%)' }}>

      {/* PREFLOP / POSTFLOP 탭 */}
      <div className="flex p-4 gap-2 border-b border-[#2a2f45]">
        {(['PREFLOP', 'POSTFLOP'] as const).map(p => (
          <button key={p} onClick={() => handlePhaseChange(p)}
            className={`px-6 py-2 rounded-lg text-xs font-bold tracking-widest border transition-all
              ${phase === p
                ? 'bg-[#c8b89a] text-[#1a1f2e] border-[#c8b89a]'
                : 'bg-transparent text-[#8a8a9a] border-[#3a3f5a] hover:border-[#c8b89a]'
              }`}>
            {p}
          </button>
        ))}
      </div>

      <div className="flex">
        {/* ── 좌: 필터 패널 ── */}
        <div className="w-52 border-r border-[#2a2f45] p-4 flex flex-col overflow-y-auto max-h-[520px]">

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
              <div className="mb-1">
                <p className="text-[#6a6a7a] text-[10px] mb-1">IP (나)</p>
                <PillGroup options={POSITIONS} value={position} onChange={setPosition} />
                <p className="text-[#6a6a7a] text-[10px] mb-1 mt-1">OOP (상대)</p>
                <PillGroup options={POSITIONS} value={oppPosition} onChange={setOppPosition} />
              </div>
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
        <div className="flex-1 p-5 flex flex-col gap-4">
          {/* 헤더 */}
          <div className="flex items-center gap-2 border-b border-[#2a2f45] pb-3">
            <span className="text-[#a09070] text-xs">←</span>
            <span className="text-[#c8b89a] text-xs font-bold tracking-wider uppercase">
              {players}P · {stackBB}BB · {strategy} · {position}{phase === 'POSTFLOP' ? ` vs ${oppPosition}` : ''}
            </span>
            <span className="text-[#a09070] text-xs">→</span>
          </div>

          {/* 히어로 카드 */}
          <div>
            <p className="text-[#8a8a9a] text-[11px] uppercase tracking-wider mb-2">Hero Cards</p>
            <div className="flex gap-3">
              <CardSelect value={hero1} onChange={setHero1} placeholder="Card 1" />
              <CardSelect value={hero2} onChange={setHero2} placeholder="Card 2" />
            </div>
          </div>

          {/* 보드 카드 (포스트플랍) */}
          {phase === 'POSTFLOP' && (
            <div>
              <p className="text-[#8a8a9a] text-[11px] uppercase tracking-wider mb-2">Board Cards</p>
              <div className="flex gap-2 flex-wrap">
                {boardLabels.slice(0, boardCount).map((label, i) => (
                  <CardSelect key={i} value={board[i]} onChange={v => setBoard$(i, v)} placeholder={label} />
                ))}
              </div>
            </div>
          )}

          {/* 팟 + 액션 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[#8a8a9a] text-[11px] uppercase tracking-wider mb-1">Pot (BB)</p>
              <input value={potBB} onChange={e => setPotBB(e.target.value)} placeholder="예: 12" type="number"
                className="w-full bg-[#252a3a] border border-[#3a3f5a] rounded-lg px-3 py-2 text-[#c8b89a] text-sm outline-none focus:border-[#c8b89a] transition-colors" />
            </div>
            <div>
              <p className="text-[#8a8a9a] text-[11px] uppercase tracking-wider mb-1">Action History</p>
              <input value={actions} onChange={e => setActions(e.target.value)}
                placeholder="예: raise 3BB, call"
                className="w-full bg-[#252a3a] border border-[#3a3f5a] rounded-lg px-3 py-2 text-[#c8b89a] text-sm outline-none focus:border-[#c8b89a] transition-colors" />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p className="text-[#8a8a9a] text-[11px] uppercase tracking-wider mb-1">Notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="예: 상대가 타이트한 레귤러, 버블 상황"
              className="w-full bg-[#252a3a] border border-[#3a3f5a] rounded-lg px-3 py-2 text-[#c8b89a] text-sm outline-none focus:border-[#c8b89a] transition-colors resize-none" />
          </div>

          {/* 분석 버튼 */}
          <button onClick={handleAnalyze} disabled={isAnalyzing}
            className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all
              bg-[#c8b89a] text-[#1a1f2e] hover:bg-[#d8c8aa] disabled:opacity-40 disabled:cursor-not-allowed">
            {isAnalyzing
              ? <><div className="w-4 h-4 border-2 border-[#1a1f2e]/30 border-t-[#1a1f2e] rounded-full animate-spin" />분석 중...</>
              : <><Brain size={16} />AI 분석 시작</>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
