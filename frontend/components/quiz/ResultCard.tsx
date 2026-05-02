'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { QuizResult, ARCHETYPE_META } from '../../lib/quiz-scorer'

export default function ResultCard({ result, onRetry }: { result: QuizResult; onRetry: () => void }) {
  const router = useRouter()
  const meta = ARCHETYPE_META[result.archetype]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Main card */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-8 text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-6xl"
        >
          {meta.emoji}
        </motion.div>

        <div>
          <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">당신의 포커 성향</p>
          <h2 className="text-3xl font-black text-white tracking-tight">{meta.label}</h2>
        </div>

        <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">{meta.description}</p>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 text-left">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">강점</p>
          <p className="text-zinc-300 text-sm">{meta.strengths}</p>
        </div>
      </div>

      {/* Leaks */}
      <div className="space-y-3">
        <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">예상 Leak (약점)</p>
        {result.leaks.map((leak, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex gap-3 items-start bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4"
          >
            <span className="text-red-400 font-black shrink-0 mt-0.5">#{i + 1}</span>
            <p className="text-zinc-300 text-sm leading-relaxed">{leak}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/')}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_10px_20px_-10px_rgba(99,102,241,0.5)]"
        >
          세션 올려서 실제 성향 검증하기 →
        </motion.button>
        <button
          onClick={onRetry}
          className="w-full py-3 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          다시 테스트하기
        </button>
      </div>
    </motion.div>
  )
}
