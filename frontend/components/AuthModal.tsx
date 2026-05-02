'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { login, DummyUser } from '../lib/auth'

interface Props {
  onClose: () => void
  onLogin: (user: DummyUser) => void
}

export default function AuthModal({ onClose, onLogin }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    const user = login(name.trim(), email.trim())
    onLogin(user)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X size={18} />
        </button>
        <h2 className="text-white font-bold text-xl mb-1">시작하기</h2>
        <p className="text-zinc-500 text-sm mb-6">히스토리 저장을 위해 닉네임을 입력하세요</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">닉네임</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: PokerKing"
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">이메일 (선택)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="예: poker@example.com"
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            시작
          </button>
        </form>
        <p className="text-zinc-600 text-xs text-center mt-4">데이터는 이 기기에만 저장됩니다</p>
      </div>
    </div>
  )
}
