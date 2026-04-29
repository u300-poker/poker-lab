'use client'

import { motion } from 'framer-motion'
import { QuizQuestion } from '../../data/quiz-questions'
import HandDisplay from './HandDisplay'

interface Props {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer: (label: string) => void
}

export default function QuizQuestionView({ question, questionNumber, totalQuestions, onAnswer }: Props) {
  const progress = ((questionNumber - 1) / totalQuestions) * 100

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{questionNumber} / {totalQuestions}</span>
          <span>{question.axis}</span>
        </div>
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${((questionNumber) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Situation */}
      <p className="text-zinc-300 text-base leading-relaxed">{question.situation}</p>

      {/* Hand visual */}
      <HandDisplay hand={question.hand} />

      {/* Choices */}
      <div className="space-y-3">
        {question.choices.map((choice) => (
          <motion.button
            key={choice.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAnswer(choice.label)}
            className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-900/50 border border-white/8 rounded-2xl text-left hover:bg-zinc-800/60 hover:border-indigo-500/40 transition-all group"
          >
            <span className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-indigo-600 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-400 group-hover:text-white transition-colors shrink-0">
              {choice.label}
            </span>
            <span className="text-zinc-200 font-medium">{choice.action}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
