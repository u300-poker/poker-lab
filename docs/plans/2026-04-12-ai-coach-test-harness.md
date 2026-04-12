# AI 코칭 테스트 하네스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mock HandLog 데이터로 Gemini AI 코칭 파이프라인을 실행하고 프롬프트 품질을 검증하는 테스트 하네스 구축

**Architecture:** 8개의 포커 시나리오를 HandLog JSON으로 하드코딩 → `analyze_hand()` 호출 → 터미널에 피드백/EV 출력. 실수 감지 여부를 직접 확인하며 프롬프트를 반복 개선한다.

**Tech Stack:** Python, FastAPI (Pydantic HandLog 모델), Google Gemini 1.5 Pro, pytest

---

## File Map

| 파일 | 역할 |
|------|------|
| `tests/mock_hands/01_preflop_3bet_call.json` ~ `08_river_bluff_missed.json` | 신규: 시나리오별 HandLog JSON |
| `tests/test_ai_coach_quality.py` | 신규: 하네스 실행 스크립트 |
| `backend/services/ai_coach.py` | 수정: 프롬프트에 실수 감지 지시 추가 |

---

## Task 1: Mock HandLog JSON 파일 생성 (8개)

**Files:**
- Create: `tests/mock_hands/01_preflop_3bet_call.json`
- Create: `tests/mock_hands/02_preflop_squeeze_call.json`
- Create: `tests/mock_hands/03_flop_cbet_checkraise.json`
- Create: `tests/mock_hands/04_flop_oop_checkfold.json`
- Create: `tests/mock_hands/05_turn_double_barrel_fold.json`
- Create: `tests/mock_hands/06_turn_probe_check.json`
- Create: `tests/mock_hands/07_river_underbet_value.json`
- Create: `tests/mock_hands/08_river_bluff_missed.json`

> **주의:** 실제 `HandLog` 모델 스키마를 사용한다.
> `blinds`는 `"0.5/1"` 형식의 문자열, `actions`의 필드는 `action_type` (not `action`).

- [ ] **Step 1: mock_hands 디렉토리 생성 및 JSON 파일 작성**

```bash
mkdir -p /Users/jihun/workspace/PokerLab/tests/mock_hands
```

`tests/mock_hands/01_preflop_3bet_call.json` (심어둔 실수: AKo BTN에서 BB 3벳에 콜 → 폴드 or 4벳이 정답)
```json
{
  "hand_id": "mock_01",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 18.0,
  "board_cards": [],
  "hero_cards": ["Ah", "Kd"],
  "players": [
    { "position": "BTN", "stack": 100.0, "is_hero": true },
    { "position": "BB", "stack": 100.0, "is_hero": false }
  ],
  "actions": [
    { "player": "BTN", "action_type": "raise", "amount": 2.5 },
    { "player": "BB", "action_type": "raise", "amount": 9.0 },
    { "player": "BTN", "action_type": "call", "amount": 9.0 }
  ]
}
```

`tests/mock_hands/02_preflop_squeeze_call.json` (심어둔 실수: UTG 레이즈 + BTN 콜 후 BB 스퀴즈에 KQs로 콜 → 폴드가 정답)
```json
{
  "hand_id": "mock_02",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 30.0,
  "board_cards": [],
  "hero_cards": ["Ks", "Qd"],
  "players": [
    { "position": "UTG", "stack": 100.0, "is_hero": false },
    { "position": "BTN", "stack": 100.0, "is_hero": true },
    { "position": "BB", "stack": 100.0, "is_hero": false }
  ],
  "actions": [
    { "player": "UTG", "action_type": "raise", "amount": 3.0 },
    { "player": "BTN", "action_type": "call", "amount": 3.0 },
    { "player": "BB", "action_type": "raise", "amount": 13.0 },
    { "player": "UTG", "action_type": "call", "amount": 13.0 },
    { "player": "BTN", "action_type": "call", "amount": 13.0 }
  ]
}
```

`tests/mock_hands/03_flop_cbet_checkraise.json` (심어둔 실수: 드로우 헤비 보드에서 c-bet 후 체크레이즈에 중간 페어로 콜 → 폴드가 정답)
```json
{
  "hand_id": "mock_03",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 45.0,
  "board_cards": ["9h", "8s", "7h"],
  "hero_cards": ["Jd", "9c"],
  "players": [
    { "position": "BTN", "stack": 87.0, "is_hero": true },
    { "position": "BB", "stack": 85.0, "is_hero": false }
  ],
  "actions": [
    { "player": "BTN", "action_type": "bet", "amount": 12.0 },
    { "player": "BB", "action_type": "raise", "amount": 35.0 },
    { "player": "BTN", "action_type": "call", "amount": 35.0 }
  ]
}
```

`tests/mock_hands/04_flop_oop_checkfold.json` (심어둔 실수: OOP에서 탑페어 굿킥으로 체크 후 IP c-bet에 체크폴드 → 체크콜이 정답)
```json
{
  "hand_id": "mock_04",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 18.0,
  "board_cards": ["Ac", "7d", "2s"],
  "hero_cards": ["As", "Jh"],
  "players": [
    { "position": "BB", "stack": 91.0, "is_hero": true },
    { "position": "BTN", "stack": 91.0, "is_hero": false }
  ],
  "actions": [
    { "player": "BB", "action_type": "check", "amount": 0.0 },
    { "player": "BTN", "action_type": "bet", "amount": 9.0 },
    { "player": "BB", "action_type": "fold", "amount": 0.0 }
  ]
}
```

`tests/mock_hands/05_turn_double_barrel_fold.json` (심어둔 실수: 플러시 드로우 + 오버카드로 더블배럴에 폴드 → 히어로콜이 정답)
```json
{
  "hand_id": "mock_05",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 55.0,
  "board_cards": ["Kh", "8h", "3d", "2h"],
  "hero_cards": ["Ah", "Qc"],
  "players": [
    { "position": "BB", "stack": 70.0, "is_hero": true },
    { "position": "BTN", "stack": 68.0, "is_hero": false }
  ],
  "actions": [
    { "player": "BTN", "action_type": "bet", "amount": 28.0 },
    { "player": "BB", "action_type": "fold", "amount": 0.0 }
  ]
}
```

`tests/mock_hands/06_turn_probe_check.json` (심어둔 실수: IP에서 턴에 밸류 기회(탑투페어)를 체크로 넘김 → 벳이 정답)
```json
{
  "hand_id": "mock_06",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 22.0,
  "board_cards": ["Ks", "Qh", "4d", "Kd"],
  "hero_cards": ["Kc", "Qd"],
  "players": [
    { "position": "BTN", "stack": 89.0, "is_hero": true },
    { "position": "BB", "stack": 89.0, "is_hero": false }
  ],
  "actions": [
    { "player": "BB", "action_type": "check", "amount": 0.0 },
    { "player": "BTN", "action_type": "check", "amount": 0.0 }
  ]
}
```

`tests/mock_hands/07_river_underbet_value.json` (심어둔 실수: 넛 핸드로 리버에 과소벳(팟 25%) → 팟 사이즈 벳 or 오버벳이 정답)
```json
{
  "hand_id": "mock_07",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 60.0,
  "board_cards": ["As", "Kd", "7h", "2c", "Jd"],
  "hero_cards": ["Ac", "Ah"],
  "players": [
    { "position": "BTN", "stack": 70.0, "is_hero": true },
    { "position": "BB", "stack": 70.0, "is_hero": false }
  ],
  "actions": [
    { "player": "BB", "action_type": "check", "amount": 0.0 },
    { "player": "BTN", "action_type": "bet", "amount": 15.0 },
    { "player": "BB", "action_type": "call", "amount": 15.0 }
  ]
}
```

`tests/mock_hands/08_river_bluff_missed.json` (심어둔 실수: 블러프 기회(에어, 분극화된 레인지)에 체크 → 블러프가 정답)
```json
{
  "hand_id": "mock_08",
  "timestamp": 0.0,
  "blinds": "0.5/1",
  "pot_size": 40.0,
  "board_cards": ["Kh", "Qd", "Jc", "2s", "5d"],
  "hero_cards": ["7h", "6h"],
  "players": [
    { "position": "BTN", "stack": 80.0, "is_hero": true },
    { "position": "BB", "stack": 80.0, "is_hero": false }
  ],
  "actions": [
    { "player": "BB", "action_type": "check", "amount": 0.0 },
    { "player": "BTN", "action_type": "check", "amount": 0.0 }
  ]
}
```

- [ ] **Step 2: JSON 파일이 정상적으로 파싱되는지 확인**

```bash
cd /Users/jihun/workspace/PokerLab
python -c "
import json, glob
files = sorted(glob.glob('tests/mock_hands/*.json'))
for f in files:
    with open(f) as fp:
        data = json.load(fp)
    print(f'OK: {f} — hand_id={data[\"hand_id\"]}')
"
```

예상 출력:
```
OK: tests/mock_hands/01_preflop_3bet_call.json — hand_id=mock_01
...
OK: tests/mock_hands/08_river_bluff_missed.json — hand_id=mock_08
```

- [ ] **Step 3: Pydantic HandLog 파싱 테스트**

```bash
cd /Users/jihun/workspace/PokerLab
python -c "
import json, sys
sys.path.insert(0, '.')
from backend.models.game_data import HandLog
with open('tests/mock_hands/01_preflop_3bet_call.json') as f:
    data = json.load(f)
hand = HandLog(**data)
print('HandLog 파싱 성공:', hand.hand_id, '핸드:', hand.hero_cards)
"
```

예상 출력:
```
HandLog 파싱 성공: mock_01 핸드: ['Ah', 'Kd']
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/jihun/workspace/PokerLab
git add tests/mock_hands/
git commit -m "test: mock HandLog 시나리오 8개 추가"
```

---

## Task 2: ai_coach.py 프롬프트 개선

**Files:**
- Modify: `backend/services/ai_coach.py`

현재 프롬프트는 EV 비교만 요청한다. 실수 감지 지시를 명시적으로 추가한다.

- [ ] **Step 1: 프롬프트 수정**

`backend/services/ai_coach.py`의 `prompt` 변수에서 `분석할 때 고려할 사항` 섹션을 아래로 교체:

```python
    prompt = f"""
당신은 세계적인 포커 코치입니다. 다음 핸드 상황을 분석하고, 유저가 저지른 가장 큰 실수를 명확히 지적한 후, 최적의 선택(GTO)과 EV를 비교하여 피드백을 제공하세요.

핸드 정보:
{json.dumps(hand_description, ensure_ascii=False, indent=2)}

분석 지침:
1. 유저가 저지른 가장 큰 실수 1가지를 명확히 지적하세요.
2. 왜 그 선택이 나쁜지 EV 관점에서 설명하세요.
3. 대신 어떤 액션을 했어야 하는지 구체적으로 제시하세요.
4. 보드 텍스처, 포지션, 스택 사이즈를 고려하세요.
5. 상대방 레인지를 고려한 분석을 포함하세요.

응답은 반드시 아래와 같은 JSON 형식을 유지해야 하며, 모든 텍스트 설명은 한국어로 작성하세요:
{{
  "ai_feedback": "유저의 실수와 개선점에 대한 상세한 한국어 분석...",
  "ev_comparison": {{
    "user_action": {{
      "action": "유저가 실제로 취한 액션 (예: Call, Raise 3bb, Fold)",
      "ev": 유저 액션의 예상 EV (단위: BB, 실수값)
    }},
    "recommended_action": {{
      "action": "추천되는 가장 높은 EV를 가진 액션 (GTO 기반)",
      "ev": 추천 액션의 예상 EV (단위: BB, 실수값)
    }},
    "ev_diff": 유저 액션과 추천 액션 사이의 EV 차이 (손실액, 단위: BB, 절대값으로 표시)
  }}
}}
"""
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/jihun/workspace/PokerLab
git add backend/services/ai_coach.py
git commit -m "feat: ai_coach 프롬프트에 실수 감지 명시 지시 추가"
```

---

## Task 3: 테스트 하네스 스크립트 작성

**Files:**
- Create: `tests/test_ai_coach_quality.py`

- [ ] **Step 1: 하네스 스크립트 작성**

```python
"""
AI 코칭 품질 테스트 하네스

실행 방법:
    cd /Users/jihun/workspace/PokerLab
    python tests/test_ai_coach_quality.py

각 mock 시나리오를 Gemini API에 실행하고,
피드백과 EV 비교 결과를 터미널에 출력한다.
"""
import json
import sys
import glob
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models.game_data import HandLog
from backend.services.ai_coach import analyze_hand

# 시나리오별 심어둔 실수 메타데이터
SCENARIOS = {
    "mock_01": {"title": "프리플랍 3벳 콜", "planted_mistake": "AKo BTN에서 BB 3벳에 콜 → 폴드 or 4벳이 정답"},
    "mock_02": {"title": "프리플랍 스퀴즈 콜", "planted_mistake": "KQs BTN에서 UTG+BB 스퀴즈에 콜 → 폴드가 정답"},
    "mock_03": {"title": "플랍 c-bet 후 체크레이즈 콜", "planted_mistake": "드로우 보드에서 중간 페어로 체크레이즈 콜 → 폴드가 정답"},
    "mock_04": {"title": "플랍 OOP 탑페어 체크폴드", "planted_mistake": "탑페어 굿킥 OOP에서 체크 후 IP c-bet에 폴드 → 체크콜이 정답"},
    "mock_05": {"title": "턴 더블배럴 폴드", "planted_mistake": "플러시 드로우+오버카드로 더블배럴에 폴드 → 히어로콜이 정답"},
    "mock_06": {"title": "턴 밸류 체크", "planted_mistake": "풀하우스(트리플+탑킥)로 IP 체크 → 벳이 정답"},
    "mock_07": {"title": "리버 넛 과소벳", "planted_mistake": "넛 핸드(트리플 에이스)로 팟 25% 과소벳 → 팟 사이즈 or 오버벳이 정답"},
    "mock_08": {"title": "리버 블러프 미실행", "planted_mistake": "에어로 분극화된 보드에서 체크 → 블러프가 정답"},
}

def run_harness():
    mock_files = sorted(glob.glob("tests/mock_hands/*.json"))
    if not mock_files:
        print("ERROR: tests/mock_hands/ 에 JSON 파일이 없습니다.")
        sys.exit(1)

    results = {"success": 0, "fail": 0, "error": 0}

    for filepath in mock_files:
        with open(filepath) as f:
            data = json.load(f)

        hand = HandLog(**data)
        meta = SCENARIOS.get(hand.hand_id, {"title": hand.hand_id, "planted_mistake": "N/A"})

        print(f"\n{'='*60}")
        print(f"[{hand.hand_id}] {meta['title']}")
        print(f"심어둔 실수: {meta['planted_mistake']}")
        print(f"{'='*60}")

        result = analyze_hand(hand)

        if "Error" in result.get("ai_feedback", "") or "missing" in result.get("ai_feedback", ""):
            print(f"[ERROR] API 오류: {result['ai_feedback']}")
            results["error"] += 1
            continue

        print(f"\n[AI 피드백]\n{result['ai_feedback']}")

        ev = result.get("ev_comparison", {})
        user_action = ev.get("user_action", {})
        rec_action = ev.get("recommended_action", {})
        ev_diff = ev.get("ev_diff", 0)

        print(f"\n[EV 비교]")
        print(f"  유저 액션 ({user_action.get('action', 'N/A')}): {user_action.get('ev', 0):+.2f} BB")
        print(f"  추천 액션 ({rec_action.get('action', 'N/A')}): {rec_action.get('ev', 0):+.2f} BB")
        print(f"  EV 손실: -{abs(ev_diff):.2f} BB")

        # 실수 감지 판정: 피드백에 실수 관련 키워드 존재 여부
        feedback_lower = result.get("ai_feedback", "").lower()
        detected = any(kw in feedback_lower for kw in [
            "실수", "잘못", "폴드", "4벳", "콜해야", "벳해야", "블러프", "과소", "손실", "비추천"
        ])

        if detected and ev_diff > 0:
            print(f"\n[판정] ✅ 실수 감지 성공")
            results["success"] += 1
        else:
            print(f"\n[판정] ❌ 실수 감지 실패 (피드백에 실수 지적 없음 또는 EV 차이 0)")
            results["fail"] += 1

    print(f"\n{'='*60}")
    print(f"최종 결과: {results['success']}/8 성공 ({results['success']/8*100:.0f}%)")
    print(f"  ✅ 성공: {results['success']}, ❌ 실패: {results['fail']}, ⚠️  오류: {results['error']}")
    print(f"목표: 6/8 이상 (75%)")
    if results["success"] >= 6:
        print("🎉 목표 달성!")
    else:
        print("⚠️  프롬프트 개선 필요")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    run_harness()
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/jihun/workspace/PokerLab
git add tests/test_ai_coach_quality.py
git commit -m "test: AI 코칭 품질 테스트 하네스 추가"
```

---

## Task 4: 하네스 실행 및 결과 확인

**Files:**
- Read: `.env` (GEMINI_API_KEY 설정 확인)

- [ ] **Step 1: .env에 API 키 설정 확인**

```bash
cd /Users/jihun/workspace/PokerLab/backend
cat .env.example
```

`.env` 파일이 없으면:
```bash
cp .env.example .env
# .env 파일을 열고 GEMINI_API_KEY 값 입력
```

- [ ] **Step 2: 하네스 실행**

```bash
cd /Users/jihun/workspace/PokerLab
python tests/test_ai_coach_quality.py
```

- [ ] **Step 3: 결과 확인 및 프롬프트 이터레이션**

결과를 보고:
- 실수 감지 실패한 시나리오 → `backend/services/ai_coach.py` 프롬프트 수정
- EV 수치가 비합리적인 경우 (음수 or 10BB 초과) → 프롬프트에 "EV는 0~5 BB 범위로" 제약 추가
- 재실행 후 개선 확인

6/8 이상 달성 시 완료.

---

## 완료 기준 체크리스트

- [ ] `tests/mock_hands/` 에 JSON 8개 존재
- [ ] `python tests/test_ai_coach_quality.py` 에러 없이 실행
- [ ] 8개 중 6개 이상 실수 감지 성공 (75%+)
- [ ] EV 수치가 포커적으로 합리적인 범위 (0~5 BB)
