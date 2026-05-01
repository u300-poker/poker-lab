import { Archetype, QUIZ_QUESTIONS } from '../data/quiz-questions'

export interface QuizResult {
  archetype: Archetype
  scores: Record<Archetype, number>
  leaks: [string, string]
  description: string
  strengths: string
}

const ARCHETYPE_META: Record<Archetype, {
  label: string
  emoji: string
  description: string
  strengths: string
  leaks: [string, string]
}> = {
  nit: {
    label: 'Nit (Passive, Tight)',
    emoji: '🐢',
    description: '최고의 패만 들고 싸우는 초보수적 스타일. 손실은 적지만 기회도 놓칩니다.',
    strengths: '나쁜 패에 돈을 잃는 경우가 거의 없음. 상대에게 쉽게 읽히지 않는 패만 플레이.',
    leaks: ['리버 폴드 과다 — 좋은 패도 겁먹고 포기하는 경향', '프리플랍 참가 범위(VPIP)가 너무 좁아 블라인드 손실 누적'],
  },
  tag: {
    label: 'TAG (Aggressive, Tight)',
    emoji: '📖',
    description: '좋은 패만 들되 들면 공격적으로 베팅. 이론적으로 가장 이상적인 스타일.',
    strengths: '밸류 추출 효율이 높고, 상대가 레인지를 읽기 어려움.',
    leaks: ['블러프 빈도 부족으로 예측 가능해질 수 있음', '포지션 불리 상황에서의 참가 범위(VPIP) 조정 필요'],
  },
  lag: {
    label: 'LAG (Aggressive, Loose)',
    emoji: '🦁',
    description: '많은 판에 참여하고 블러프도 적극 활용. 고수라면 최강이지만 리스크가 높습니다.',
    strengths: '상대가 레인지를 읽기 어렵고, 팟 컨트롤 능력 우수.',
    leaks: ['블러프 빈도 과도로 EV 손실 발생 가능', '프리플랍 참가 범위(VPIP)가 너무 넓어 포스트플랍 어려운 상황 자초'],
  },
  station: {
    label: 'Calling Station (Passive, Loose)',
    emoji: '📞',
    description: '뭐든 따라가는 콜러. 블러프에 자주 걸리며 폴드를 잘 못합니다.',
    strengths: '상대 밸류벳에 지속적으로 콜해주는 특성으로 가끔 블러프 catch.',
    leaks: ['블러프 콜오프 과다 — 가장 큰 EV 손실 원인', '폴드 빈도가 낮아 약한 패로 리버까지 가는 경향'],
  },
}

export function scoreQuiz(answers: Record<number, string>): QuizResult {
  const totals: Record<Archetype, number> = { nit: 0, tag: 0, lag: 0, station: 0 }

  for (const question of QUIZ_QUESTIONS) {
    const chosenLabel = answers[question.id]
    if (!chosenLabel) continue
    const choice = question.choices.find(c => c.label === chosenLabel)
    if (!choice) continue
    for (const [archetype, score] of Object.entries(choice.scores) as [Archetype, number][]) {
      totals[archetype] += score
    }
  }

  const archetype = (Object.entries(totals) as [Archetype, number][])
    .sort((a, b) => b[1] - a[1])[0][0]

  const meta = ARCHETYPE_META[archetype]

  return {
    archetype,
    scores: totals,
    leaks: meta.leaks,
    description: meta.description,
    strengths: meta.strengths,
  }
}

export { ARCHETYPE_META }
