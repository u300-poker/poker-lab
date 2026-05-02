import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv
from ..models.game_data import HandLog, Action, PlayerInfo, Decision
from .equity_calc import calculate_street_equities, calculate_hero_equity_vs_random

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

PROMPT = """
당신은 세계적인 포커 코치예요. 아래 WPL 핸드 히스토리 이미지를 보고,
이미지에서 직접 모든 정보를 읽어서 JSON 하나로 응답해주세요.

분석 방식:
1. 이미지에서 히어로(나)가 각 스트릿(프리플랍/플랍/턴/리버)에서 한 액션을 찾아요
2. 각 결정 시점마다: 가능했던 선택지들을 평가하고, 히어로의 선택이 최선이었는지 판단해요
3. 코치가 제자에게 말하듯 간결하고 직설적으로 한국어로 써주세요

응답 JSON (모든 텍스트는 한국어):
{
  "hand_id": "이미지에서 읽은 Hand ID (없으면 unknown)",
  "blinds": "블라인드 (예: 250/500)",
  "pot_size": 최종 팟 크기 숫자,
  "hero_cards": ["카드1", "카드2"],
  "board_cards": ["카드1", ...],
  "players": [{"position": "포지션", "stack": 스택숫자, "is_hero": true/false, "cards": ["카드1","카드2"] 또는 null}],
  "actions": [{"player": "포지션", "action_type": "fold/call/raise/check/bet/all-in", "amount": 금액}],
  "winner": "승자 또는 null",
  "winning_pot": 승자 팟 또는 null,

  "severity": "핸드 전체를 대표하는 심각도: critical/warning/good",
  "headline": "핸드 전체 핵심 요약 15자 이내",
  "mistake_summary": "핸드 전체 평가 2문장",
  "why_bad": ["이유1", "이유2", "이유3"],
  "what_to_do": "전체적으로 어떻게 했어야 했는지 2문장",
  "key_concept": "이 핸드의 핵심 포커 개념 (한국어)",
  "detail": "보드 텍스처·상대 레인지·스택·포지션 모두 고려한 깊은 분석 4~6문장",

  "decisions": [
    {
      "street": "preflop",
      "hero_action": "히어로가 한 액션 (예: Call, Raise, Fold)",
      "amount": 금액숫자또는null,
      "severity": "critical/warning/good",
      "headline": "이 결정의 핵심을 10자 이내로",
      "mistake_summary": "이 결정이 좋았는지 나빴는지 2문장",
      "why_bad": ["이유1", "이유2"],
      "what_to_do": "good이면 잘 한 이유, 아니면 했어야 할 액션",
      "key_concept": "이 결정의 핵심 포커 개념",
      "ev_comparison": {
        "options": [
          {"action": "Fold", "is_hero_choice": false, "rating": "best", "ev": 2.5, "reason": "한 문장"},
          {"action": "Call", "is_hero_choice": true, "rating": "bad", "ev": -1.2, "reason": "한 문장"}
        ]
      }
    }
  ]
}

규칙:
- decisions 배열에는 히어로가 실제로 결정을 내린 스트릿만 포함 (액션 없으면 생략)
- street 값: "preflop", "flop", "turn", "river" 중 하나
- ev_comparison.options: 해당 시점에서 가능한 모든 선택지 포함, rating은 best/good/okay/bad, ev는 BB 단위 예상 EV (숫자, 양수/음수 가능)
- 카드 표기: 숫자(2~9,T,J,Q,K,A) + 수트(h=하트,d=다이아,c=클럽,s=스페이드)
- players[].cards: 쇼다운에서 공개된 홀카드는 반드시 채워줘 (공개 안된 플레이어는 null)
"""


def _detect_mime_type(image_bytes: bytes) -> str:
    if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return "image/png"
    if image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
        return "image/webp"
    return "image/jpeg"


def parse_hand_image(image_bytes: bytes) -> HandLog:
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")

    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        generation_config={"response_mime_type": "application/json", "temperature": 0},
    )

    mime_type = _detect_mime_type(image_bytes)
    image_part = {"mime_type": mime_type, "data": image_bytes}

    response = model.generate_content(
        [PROMPT, image_part],
        request_options={"timeout": 120},
    )
    raw = json.loads(response.text)

    players = [PlayerInfo(**p) for p in raw.get("players", []) if isinstance(p, dict)]
    actions = [Action(**a) for a in raw.get("actions", []) if isinstance(a, dict)]

    # action_comparison → ev_comparison 포맷으로 변환 (프론트 호환)
    ev_comparison = None
    options = raw.get("action_comparison", {}).get("options", [])
    if options:
        rating_score = {"best": 4, "good": 3, "okay": 2, "bad": 1}
        hero_option = next((o for o in options if o.get("is_hero_choice")), options[0])
        best_option = next((o for o in options if o.get("rating") == "best"), options[0])
        ev_comparison = {
            "user_action": {"action": hero_option["action"], "ev": 0},
            "recommended_action": {"action": best_option["action"], "ev": 0},
            "ev_diff": 0,
            "options": [
                {
                    "action": o["action"],
                    "rating": o.get("rating", "okay"),
                    "reason": o.get("reason", ""),
                    "is_hero_choice": o.get("is_hero_choice", False),
                    "score": rating_score.get(o.get("rating", "okay"), 2),
                    "ev": o.get("ev"),
                }
                for o in options
            ],
        }

    # decisions 파싱
    decisions = None
    raw_decisions = raw.get("decisions", [])
    if raw_decisions:
        rating_score = {"best": 4, "good": 3, "okay": 2, "bad": 1}
        decisions = []
        for d in raw_decisions:
            raw_opts = d.get("ev_comparison", {}).get("options", [])
            dec_ev = None
            if raw_opts:
                dec_ev = {
                    "options": [
                        {
                            "action": o["action"],
                            "rating": o.get("rating", "okay"),
                            "reason": o.get("reason", ""),
                            "is_hero_choice": o.get("is_hero_choice", False),
                            "score": rating_score.get(o.get("rating", "okay"), 2),
                            "ev": o.get("ev"),
                        }
                        for o in raw_opts
                    ]
                }
            decisions.append(Decision(
                street=d.get("street", "unknown"),
                hero_action=d.get("hero_action", ""),
                amount=d.get("amount"),
                severity=d.get("severity", "warning"),
                headline=d.get("headline"),
                mistake_summary=d.get("mistake_summary"),
                why_bad=d.get("why_bad"),
                what_to_do=d.get("what_to_do"),
                key_concept=d.get("key_concept"),
                ev_comparison=dec_ev,
            ))

    # 스트릿별 에퀴티 계산
    street_equities = None
    try:
        board = raw.get("board_cards", [])
        hero_cards_list = raw.get("hero_cards", [])
        equity_players = [
            {
                "position": p.get("position", "?"),
                "cards": p.get("cards"),
                "is_hero": p.get("is_hero", False),
            }
            for p in raw.get("players", [])
            if p.get("cards") and len(p.get("cards", [])) == 2
        ]
        if len(equity_players) >= 2 and len(board) >= 3:
            # 쇼다운 카드 공개 → 정확한 계산
            street_equities = calculate_street_equities(equity_players, board)
        elif len(hero_cards_list) == 2:
            # 히어로 카드만 있음 → 상대 랜덤 핸드 가정 Monte Carlo
            street_equities = calculate_hero_equity_vs_random(hero_cards_list, board)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[equity_calc] 계산 실패: {type(e).__name__}: {e}")

    hand_log = HandLog(
        hand_id=raw.get("hand_id", "unknown"),
        timestamp=time.time(),
        blinds=raw.get("blinds", "unknown"),
        pot_size=float(raw.get("pot_size") or 0),
        hero_cards=raw.get("hero_cards", []),
        board_cards=raw.get("board_cards", []),
        players=players,
        actions=actions,
        winner=raw.get("winner"),
        winning_pot=raw.get("winning_pot"),
        severity=raw.get("severity", "warning"),
        headline=raw.get("headline"),
        mistake_summary=raw.get("mistake_summary"),
        why_bad=raw.get("why_bad"),
        what_to_do=raw.get("what_to_do"),
        key_concept=raw.get("key_concept"),
        detail=raw.get("detail"),
        ai_feedback=raw.get("detail"),
        ev_comparison=ev_comparison,
        decisions=decisions,
        street_equities=street_equities,
    )

    return hand_log
