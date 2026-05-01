import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from ..models.game_data import HandLog, Decision

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

PROMPT_TEMPLATE = """
당신은 세계적인 포커 코치예요. 아래 핸드 정보를 보고 분석해주세요.

핸드 정보:
- 블라인드: {blinds}
- 포지션: {position}
- 히어로 카드: {hero_cards}
- 보드 카드: {board_cards}
- 팟 크기: {pot_size}
- 스택: {stack}
- 액션 기록: {actions}
- 추가 메모: {notes}

아래 JSON으로 응답해주세요 (모든 텍스트는 한국어):
{{
  "hand_id": "manual",
  "blinds": "{blinds}",
  "pot_size": {pot_size_num},
  "hero_cards": {hero_cards_json},
  "board_cards": {board_cards_json},
  "severity": "critical/warning/good 중 하나",
  "headline": "핵심 요약 15자 이내",
  "mistake_summary": "전체 평가 2문장",
  "why_bad": ["이유1", "이유2"],
  "what_to_do": "어떻게 했어야 했는지 2문장",
  "key_concept": "핵심 포커 개념",
  "detail": "보드 텍스처·레인지·스택·포지션 고려한 깊은 분석 4~6문장",
  "decisions": [
    {{
      "street": "preflop/flop/turn/river 중 하나",
      "hero_action": "히어로가 한 액션",
      "severity": "critical/warning/good",
      "headline": "이 결정의 핵심 10자 이내",
      "mistake_summary": "이 결정 평가 2문장",
      "why_bad": ["이유1"],
      "what_to_do": "했어야 할 것",
      "key_concept": "핵심 개념",
      "ev_comparison": {{
        "options": [
          {{"action": "Fold", "is_hero_choice": false, "rating": "best", "ev": 2.5, "reason": "한 문장"}},
          {{"action": "Call", "is_hero_choice": true, "rating": "bad", "ev": -1.2, "reason": "한 문장"}}
        ]
      }}
    }}
  ]
}}
"""


def parse_manual_hand(
    blinds: str,
    position: str,
    hero_cards: list[str],
    board_cards: list[str],
    pot_size: float,
    stack: str,
    actions: str,
    notes: str,
) -> HandLog:
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")

    prompt = PROMPT_TEMPLATE.format(
        blinds=blinds,
        position=position,
        hero_cards=" ".join(hero_cards),
        board_cards=" ".join(board_cards) if board_cards else "없음",
        pot_size=pot_size,
        pot_size_num=pot_size,
        stack=stack,
        actions=actions or "없음",
        notes=notes or "없음",
        hero_cards_json=json.dumps(hero_cards, ensure_ascii=False),
        board_cards_json=json.dumps(board_cards, ensure_ascii=False),
    )

    model = genai.GenerativeModel(
        "gemini-2.5-pro",
        generation_config={"response_mime_type": "application/json", "temperature": 0},
    )
    response = model.generate_content(prompt, request_options={"timeout": 120})
    raw = json.loads(response.text)

    rating_score = {"best": 4, "good": 3, "okay": 2, "bad": 1}
    decisions = []
    for d in raw.get("decisions", []):
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
            severity=d.get("severity", "warning"),
            headline=d.get("headline"),
            mistake_summary=d.get("mistake_summary"),
            why_bad=d.get("why_bad"),
            what_to_do=d.get("what_to_do"),
            key_concept=d.get("key_concept"),
            ev_comparison=dec_ev,
        ))

    return HandLog(
        hand_id=raw.get("hand_id", "manual"),
        blinds=raw.get("blinds", blinds),
        pot_size=raw.get("pot_size", pot_size),
        hero_cards=raw.get("hero_cards", hero_cards),
        board_cards=raw.get("board_cards", board_cards),
        severity=raw.get("severity", "warning"),
        headline=raw.get("headline"),
        mistake_summary=raw.get("mistake_summary"),
        why_bad=raw.get("why_bad"),
        what_to_do=raw.get("what_to_do"),
        key_concept=raw.get("key_concept"),
        detail=raw.get("detail"),
        decisions=decisions if decisions else None,
    )
