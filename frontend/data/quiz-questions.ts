export type Archetype = 'nit' | 'tag' | 'lag' | 'station'

export interface HandSituation {
  heroCards: [string, string]
  boardCards: string[]
  position: string
  potBB: number
  heroStackBB: number
  lastAction?: string
}

export interface Choice {
  label: string
  action: string
  scores: Partial<Record<Archetype, number>>
}

export interface QuizQuestion {
  id: number
  axis: string
  situation: string
  hand: HandSituation
  choices: Choice[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    axis: '프리플랍 참가 기준',
    situation: 'UTG (첫 번째 자리, 가장 불리). 아무도 아직 베팅하지 않았습니다. 어떻게 하겠습니까?',
    hand: {
      heroCards: ['Ks', '8d'],
      boardCards: [],
      position: 'UTG',
      potBB: 1.5,
      heroStackBB: 100,
    },
    choices: [
      { label: 'A', action: '폴드', scores: { nit: 2, tag: 1 } },
      { label: 'B', action: '레이즈 (3bb)', scores: { lag: 2 } },
      { label: 'C', action: '콜 (림프)', scores: { station: 2 } },
    ],
  },
  {
    id: 2,
    axis: '압박 상황 대응',
    situation: '버튼 자리에서 레이즈했더니 BB가 9bb로 3-Bet. 어떻게 하겠습니까?',
    hand: {
      heroCards: ['Jh', 'Th'],
      boardCards: [],
      position: 'BTN',
      potBB: 10,
      heroStackBB: 97,
      lastAction: 'BB가 9bb로 3-Bet',
    },
    choices: [
      { label: 'A', action: '폴드', scores: { nit: 2 } },
      { label: 'B', action: '콜', scores: { station: 2 } },
      { label: 'C', action: '4-Bet (25bb)', scores: { lag: 2, tag: 1 } },
    ],
  },
  {
    id: 3,
    axis: '포스트플랍 선제 공격성',
    situation: '버튼에서 레이즈, BB 콜. 플랍이 7-2-2 (내 패와 무관). 상대가 체크했습니다.',
    hand: {
      heroCards: ['As', 'Ks'],
      boardCards: ['7d', '2h', '2c'],
      position: 'BTN',
      potBB: 6,
      heroStackBB: 97,
      lastAction: 'BB가 체크',
    },
    choices: [
      { label: 'A', action: '체크', scores: { nit: 1, station: 1 } },
      { label: 'B', action: '소액 베팅 (2bb)', scores: { tag: 2 } },
      { label: 'C', action: '대형 베팅 (4bb)', scores: { lag: 2 } },
    ],
  },
  {
    id: 4,
    axis: '세미블러프 성향',
    situation: 'CO 자리. 플랍에서 스트레이트+플러시 동시 드로우 (지금은 약하지만 완성되면 강함). 상대가 4bb 베팅.',
    hand: {
      heroCards: ['9h', '8h'],
      boardCards: ['7h', '6s', '2h'],
      position: 'CO',
      potBB: 8,
      heroStackBB: 96,
      lastAction: '상대가 4bb 베팅',
    },
    choices: [
      { label: 'A', action: '폴드', scores: { nit: 2 } },
      { label: 'B', action: '콜', scores: { station: 2 } },
      { label: 'C', action: '레이즈 (12bb)', scores: { lag: 2, tag: 1 } },
    ],
  },
  {
    id: 5,
    axis: '리버 블러프 빈도',
    situation: 'BB 자리. 리버까지 왔는데 스트레이트 드로우가 완성 실패. 아무것도 없습니다. 상대가 체크.',
    hand: {
      heroCards: ['6d', '5d'],
      boardCards: ['8s', '7s', '3d', 'Kh', 'Ac'],
      position: 'BB',
      potBB: 12,
      heroStackBB: 94,
      lastAction: '상대가 체크',
    },
    choices: [
      { label: 'A', action: '체크 (포기)', scores: { nit: 1, station: 1 } },
      { label: 'B', action: '베팅 8bb (블러프)', scores: { lag: 2, tag: 1 } },
    ],
  },
  {
    id: 6,
    axis: '리버 콜오프 임계점',
    situation: 'HJ 자리. 투페어(Q-J)로 꽤 강한 패. 리버에서 상대가 40bb 올인 (팟의 2배). 어떻게 하겠습니까?',
    hand: {
      heroCards: ['Qs', 'Js'],
      boardCards: ['Qh', 'Jd', '4c', '8h', 'Ad'],
      position: 'HJ',
      potBB: 20,
      heroStackBB: 80,
      lastAction: '상대가 40bb 올인',
    },
    choices: [
      { label: 'A', action: '폴드', scores: { nit: 2 } },
      { label: 'B', action: '콜', scores: { station: 2, tag: 1 } },
    ],
  },
  {
    id: 7,
    axis: '포지션 불리 상황 판단',
    situation: 'SB 자리 (포지션 불리). BTN이 3bb 레이즈. 어떻게 하겠습니까?',
    hand: {
      heroCards: ['Ad', '9c'],
      boardCards: [],
      position: 'SB',
      potBB: 4.5,
      heroStackBB: 97,
      lastAction: 'BTN이 3bb 레이즈',
    },
    choices: [
      { label: 'A', action: '폴드', scores: { tag: 1, nit: 1 } },
      { label: 'B', action: '콜', scores: { station: 2 } },
      { label: 'C', action: '3-Bet (9bb)', scores: { lag: 2 } },
    ],
  },
]
