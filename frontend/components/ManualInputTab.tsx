'use client'

import { useState } from 'react'
import { Brain } from 'lucide-react'
import { motion } from 'framer-motion'

const POSITIONS = ['UTG', 'UTG+1', 'HJ', 'CO', 'BTN', 'SB', 'BB']
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const SUITS = [
  { value: 's', label: '♠' },
  { value: 'h', label: '♥' },
  { value: 'd', label: '♦' },
  { value: 'c', label: '♣' },
]

function CardPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const rank = value.slice(0, -1)
  const suit = value.slice(-1)
  return (
    <div className="space-y-1">
      <p className="text-zinc-500 text-xs">{label}</p>
      <div className="flex gap-1">
        <select
          value={rank}
          onChange={e => onChange(e.target.value + suit)}
          className="bg-zinc-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm outline-none flex-1"
        >
          <option value="">랭크</option>
          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={suit}
          onChange={e => onChange(rank + e.target.value)}
          className="bg-zinc-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm outline-none"
        >
          <option value="">수트</option>
          {SUITS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  )
}

interface Props {
  onResult: (result: any) => void
}

export default function ManualInputTab({ onResult }: Props) {
  const [blinds, setBlinds] = useState('100/200')
  const [position, setPosition] = useState('BTN')
  const [hero1, setHero1] = useState('')
  const [hero2, setHero2] = useState('')
  const [board, setBoard] = useState(['', '', '', '', ''])
  const [potSize, setPotSize] = useState('')
  const [stack, setStack] = useState('')
  const [actions, setActions] = useState('')
  const [notes, setNotes] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const setBoard$ = (i: number, v: string) => setBoard(prev => prev.map((c, idx) => idx === i ? v : c))

  const isReady = hero1.length === 2 && hero2.length === 2

  const handleAnalyze = async () => {
    if (!isReady) return
    setIsAnalyzing(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analyze-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blinds,
          position,
          hero_cards: [hero1, hero2],
          board_cards: board.filter(c => c.length === 2),
          pot_size: parseFloat(potSize) || 0,
          stack,
          actions,
          notes,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      onResult(data)
    } catch (e: any) {
      alert('분석 실패: ' + (e.message ?? '서버 오류'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div key="manual-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-6">

      <div className="grid grid-cols-2 gap-4">
        {/* 블라인드 */}
        <div className="space-y-1">
          <label className="text-zinc-500 text-xs">블라인드</label>
          <input value={blinds} onChange={e => setBlinds(e.target.value)} placeholder="100/200"
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
        </div>
        {/* 포지션 */}
        <div className="space-y-1">
          <label className="text-zinc-500 text-xs">내 포지션</label>
          <select value={position} onChange={e => setPosition(e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors">
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* 히어로 카드 */}
      <div>
        <p className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">내 패 (히어로)</p>
        <div className="flex gap-3">
          <CardPicker label="카드 1" value={hero1} onChange={setHero1} />
          <CardPicker label="카드 2" value={hero2} onChange={setHero2} />
        </div>
      </div>

      {/* 보드 카드 */}
      <div>
        <p className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">보드 카드 (선택)</p>
        <div className="flex gap-2 flex-wrap">
          {['플랍1', '플랍2', '플랍3', '턴', '리버'].map((label, i) => (
            <CardPicker key={i} label={label} value={board[i]} onChange={v => setBoard$(i, v)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 팟 크기 */}
        <div className="space-y-1">
          <label className="text-zinc-500 text-xs">팟 크기 (칩)</label>
          <input value={potSize} onChange={e => setPotSize(e.target.value)} placeholder="예: 2400" type="number"
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
        </div>
        {/* 스택 */}
        <div className="space-y-1">
          <label className="text-zinc-500 text-xs">내 스택 (칩)</label>
          <input value={stack} onChange={e => setStack(e.target.value)} placeholder="예: 15000"
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
        </div>
      </div>

      {/* 액션 기록 */}
      <div className="space-y-1">
        <label className="text-zinc-500 text-xs">액션 기록</label>
        <textarea value={actions} onChange={e => setActions(e.target.value)} rows={3}
          placeholder="예: 프리플랍 BTN raise 600, BB call. 플랍 BB check, BTN bet 800, BB call. 턴 BB check, BTN all-in, BB call."
          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors resize-none" />
      </div>

      {/* 메모 */}
      <div className="space-y-1">
        <label className="text-zinc-500 text-xs">추가 메모 (선택)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="예: 상대가 타이트한 플레이어였음, 버블 상황이었음"
          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors resize-none" />
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleAnalyze} disabled={!isReady || isAnalyzing}
        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-base">
        {isAnalyzing ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 분석 중...</>
        ) : (
          <><Brain size={20} /> AI 분석 시작</>
        )}
      </motion.button>
    </motion.div>
  )
}
