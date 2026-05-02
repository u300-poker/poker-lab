'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QUIZ_QUESTIONS } from '../../data/quiz-questions'
import { scoreQuiz, QuizResult } from '../../lib/quiz-scorer'
import QuizQuestionView from '../../components/quiz/QuizQuestion'
import ResultCard from '../../components/quiz/ResultCard'

type Stage = 'intro' | 'questions' | 'result'

export default function QuizPage() {
  const [stage, setStage] = useState<Stage>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)

  const handleAnswer = (label: string) => {
    const question = QUIZ_QUESTIONS[currentIdx]
    const newAnswers = { ...answers, [question.id]: label }
    setAnswers(newAnswers)

    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1)
    } else {
      setResult(scoreQuiz(newAnswers))
      setStage('result')
    }
  }

  const handleRetry = () => {
    setStage('intro')
    setCurrentIdx(0)
    setAnswers({})
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {stage === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-8"
              >
                <div className="space-y-3">
                  <p className="text-indigo-400 text-sm uppercase tracking-widest font-semibold">PokerLab</p>
                  <h1 className="text-4xl font-black tracking-tighter">포커 성향 테스트</h1>
                  <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    7가지 실제 포커 상황에 대한 당신의 선택으로 플레이 스타일을 진단합니다.
                    솔직하게 답할수록 정확합니다.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-left">
                  {[
                    { icon: '🎯', text: '7가지 실제 핸드 상황' },
                    { icon: '⚡', text: '약 3분 소요' },
                    { icon: '🔍', text: '4가지 성향 중 진단' },
                    { icon: '📋', text: '개인 Leak 2가지 분석' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3">
                      <span>{item.icon}</span>
                      <span className="text-zinc-400">{item.text}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStage('questions')}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-lg transition-all shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)]"
                >
                  테스트 시작하기
                </motion.button>
              </motion.div>
            )}

            {stage === 'questions' && (
              <motion.div key={`q-${currentIdx}`} className="space-y-0">
                <QuizQuestionView
                  question={QUIZ_QUESTIONS[currentIdx]}
                  questionNumber={currentIdx + 1}
                  totalQuestions={QUIZ_QUESTIONS.length}
                  onAnswer={handleAnswer}
                />
              </motion.div>
            )}

            {stage === 'result' && result && (
              <motion.div key="result">
                <ResultCard result={result} onRetry={handleRetry} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
