# Dashboard 설계 — PokerLab

**날짜:** 2026-05-01  
**대상:** 중급자 포커 플레이어  
**목표:** 누적된 핸드 히스토리에서 스트릿/액션별 플레이 패턴을 시각화하는 대시보드

---

## 범위

- `/dashboard` 신규 페이지
- `SavedHand` 데이터 모델 확장 (`decisions` 필드 추가)
- `storage.ts` 집계 함수 추가
- `/history` 페이지는 핸드 목록 역할만 유지 (변경 없음)

---

## 데이터 레이어

### SavedHand 확장

```ts
interface SavedHand {
  // 기존 필드 유지
  id, savedAt, imageFileName, hand_id, blinds,
  hero_cards, board_cards, severity, headline,
  mistake_summary, ev_comparison

  // 신규
  decisions?: {
    street: 'preflop' | 'flop' | 'turn' | 'river'
    hero_action: string   // "Call", "Raise", "Fold" 등
    severity: 'critical' | 'warning' | 'good'
    key_concept: string   // "팟 오즈", "블러프 타이밍" 등
  }[]
}
```

`saveHand()`에서 `result.decisions` 파싱해서 저장. 기존 핸드(decisions 없음)는 집계 시 skip.

### 집계 함수 (storage.ts 추가)

```ts
byStreet(history)   → { preflop, flop, turn, river } × { critical, warning, good }
byAction(history)   → { Call, Raise, Fold, ... } × { critical, warning, good }
byKeyword(history)  → [{ concept: string, count: number }]  // 빈도순 Top 10
```

---

## UI 설계 (`/dashboard`)

### ① 상단 요약 카드 (4개, 가로 배치)

| 카드 | 내용 |
|------|------|
| 총 분석 | N 핸드 |
| Good 비율 | N% |
| 최다 실수 스트릿 | 예: "리버" |
| 반복 실수 키워드 | 예: "팟 오즈 계산" |

### ② 중단 차트 (좌우 배치)

- **좌: 스트릿별 스택 바 차트** (recharts BarChart)
  - X축: preflop / flop / turn / river
  - Y축: 핸드 수
  - 색상: critical(빨강) / warning(노랑) / good(초록) 스택

- **우: 액션별 도넛 차트** (recharts PieChart)
  - Call / Raise / Fold / 기타 중 Critical 비율
  - 범례에 퍼센트 표시

### ③ 하단 반복 실수 태그

- key_concept 빈도순 태그 목록
- 빈도 높을수록 강조 (폰트 크기 or 배지 카운트)

### 빈 상태

데이터 없을 때: "아직 분석된 핸드가 없습니다. 이미지를 업로드해서 분석을 시작해보세요." + 홈으로 버튼

---

## 네비게이션

- 메인 홈 우상단에 "대시보드" 링크 추가 (히스토리 옆)
- 대시보드 내 "히스토리 보기" 링크

---

## 차트 라이브러리

기존 `recharts` 사용 (이미 설치됨). 신규 의존성 없음.

---

## 제외 범위

- 핸드 클릭 시 필터링 — 이후 단계
- 서버 사이드 집계 — localStorage로 충분
- 날짜 범위 필터 — 이후 단계
