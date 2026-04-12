# [설계서] AI 코칭 테스트 하네스 (Mock 데이터 파이프라인)

- **작성일:** 2026-04-12
- **상태:** 초안 (Draft)
- **주제:** 실제 영상 없이 Mock HandLog로 Gemini AI 코칭 품질 검증

---

## 1. 개요

WPL 영상이 없는 상황에서 AI 코칭 파이프라인의 핵심 가치(프롬프트 품질, EV 계산 신뢰도, 한국어 피드백)를 조기 검증하기 위한 테스트 하네스.

목표: 하드코딩된 HandLog 시나리오 8개를 실행하면 각 핸드의 AI 피드백과 EV 비교 결과가 터미널에 출력되고, 프롬프트를 반복 개선할 수 있는 루프를 만든다.

---

## 2. 아키텍처

### 2.1 디렉토리 구조

```
backend/
├── services/
│   └── ai_coach.py              # 프롬프트 개선 대상
└── tests/
    ├── mock_hands/              # 신규: 시나리오별 HandLog JSON
    │   ├── 01_preflop_3bet_call.json
    │   ├── 02_preflop_squeeze_call.json
    │   ├── 03_flop_cbet_checkraise.json
    │   ├── 04_flop_oop_checkfold.json
    │   ├── 05_turn_double_barrel_fold.json
    │   ├── 06_turn_probe_check.json
    │   ├── 07_river_overbet_value.json
    │   └── 08_river_bluff_missed.json
    └── test_ai_coach_quality.py # 신규: 결과 출력 하네스
```

### 2.2 데이터 흐름

```
mock_hands/*.json
      ↓
HandLog 파싱
      ↓
ai_coach.analyze_hand()
      ↓
{ ai_feedback, ev_comparison } 출력
```

---

## 3. Mock HandLog 시나리오

각 시나리오에는 유저가 저지른 **의도적 실수**가 1개씩 포함된다. AI가 이를 잡아내는지로 프롬프트 품질을 평가한다.

| # | 스트리트 | 상황 | 심어둔 실수 |
|---|---------|------|------------|
| 1 | 프리플랍 | BTN vs BB 3벳 직면 | 3벳에 콜 (폴드 or 4벳이 정답) |
| 2 | 프리플랍 | EP 레이즈 후 스퀴즈 | 스퀴즈에 콜 (폴드가 정답) |
| 3 | 플랍 | c-bet 후 체크레이즈 직면 | 드로우 보드에서 콜 (폴드가 정답) |
| 4 | 플랍 | OOP 체크 후 IP c-bet | 체크폴드 (체크콜이 정답) |
| 5 | 턴 | 더블배럴 직면 | 폴드 (히어로콜이 정답) |
| 6 | 턴 | 프로브벳 기회 | 체크 (벳이 정답) |
| 7 | 리버 | 밸류벳 상황 | 과소벳 (팟 사이즈 벳이 정답) |
| 8 | 리버 | 블러프 기회 | 체크 (블러프가 정답) |

### HandLog JSON 스키마

기존 `models/game_data.py`의 HandLog 모델을 그대로 사용.

```json
{
  "hand_id": "mock_01",
  "positions": {
    "hero": "BTN",
    "villain": "BB"
  },
  "stacks": {
    "hero": 100,
    "villain": 100
  },
  "blinds": { "sb": 0.5, "bb": 1 },
  "hero_cards": ["Ah", "Kd"],
  "community_cards": [],
  "actions": [
    { "street": "preflop", "player": "hero", "action": "raise", "amount": 2.5 },
    { "street": "preflop", "player": "villain", "action": "3bet", "amount": 9 },
    { "street": "preflop", "player": "hero", "action": "call", "amount": 9 }
  ],
  "pot": 18,
  "result": null
}
```

---

## 4. 테스트 하네스 (`test_ai_coach_quality.py`)

### 4.1 실행 방식

```bash
cd backend
python -m pytest tests/test_ai_coach_quality.py -v -s
```

또는 단독 실행:

```bash
python tests/test_ai_coach_quality.py
```

### 4.2 출력 형식

각 시나리오마다:

```
=== [01] 프리플랍 3벳 콜 ===
심어둔 실수: 3벳에 콜 (폴드 or 4벳이 정답)

[AI 피드백]
AKo로 BTN에서 BB의 3벳을 맞이했을 때, 콜은 포지션 열위로 인해 장기적으로 EV 손실입니다...

[EV 비교]
유저 액션 (콜):     +0.3 BB
추천 액션 (폴드):   +1.2 BB
EV 손실:            -0.9 BB

[판정] ✅ 실수 감지 성공 / ❌ 실수 감지 실패
----------------------------------------------
```

### 4.3 판정 기준

- **성공**: AI 피드백이 심어둔 실수를 명시적으로 언급하고 대안을 제시한 경우
- **실패**: 실수를 언급하지 않거나 반대 방향의 피드백을 준 경우

---

## 5. 프롬프트 개선 루프

1. 하네스 실행 → 8개 시나리오 결과 확인
2. 실수 감지 실패한 케이스 → `ai_coach.py` 프롬프트 수정
3. 재실행 → 개선 여부 확인
4. 반복

---

## 6. 완료 기준

- [ ] 8개 시나리오 JSON 작성 완료
- [ ] 하네스 스크립트 실행 시 에러 없이 결과 출력
- [ ] 8개 중 6개 이상 실수 감지 성공 (75% 이상)
- [ ] EV 수치가 포커적으로 합리적인 범위 (±0~5 BB)

---

## 7. 범위 외 (Out of Scope)

- 실제 WPL 영상 처리
- OCR 파이프라인
- 프론트엔드 연동
- DB 저장

이 설계서는 AI 코칭 품질 검증에만 집중한다.
