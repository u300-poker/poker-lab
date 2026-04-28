import os
import json
import google.generativeai as genai
from ..models.game_data import HandLog
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize Gemini API
# Note: The user needs to provide the GEMINI_API_KEY in their environment.
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def analyze_hand(hand_log: HandLog) -> dict:
    """
    Analyze the poker hand using Google Gemini and provide coaching feedback.
    """
    # Prepare the hand description for Gemini
    # We include fields that are essential for poker analysis.
    hand_description = {
        "hand_id": hand_log.hand_id,
        "blinds": hand_log.blinds,
        "pot_size": hand_log.pot_size,
        "board_cards": hand_log.board_cards,
        "hero_cards": hand_log.hero_cards,
        "players": [p.model_dump() for p in hand_log.players],
        "actions": [a.model_dump() for a in hand_log.actions]
    }

    prompt = f"""
당신은 세계적인 포커 코치예요. 아래 핸드를 분석해서 JSON으로만 응답해주세요. 말투는 간결하고 직설적으로, 코치가 제자한테 말하듯이 써주세요.

핸드 정보:
{json.dumps(hand_description, ensure_ascii=False, indent=2)}

응답 JSON 형식 (모든 텍스트는 한국어):
{{
  "severity": "critical 또는 warning 또는 good 중 하나 — critical: 스택에 큰 손실을 준 명백한 실수, warning: 더 나은 선택이 있었던 아쉬운 플레이, good: 최적에 가까운 좋은 플레이",
  "headline": "핵심 실수를 15자 이내로 — 임팩트 있게 (예: '너츠 아닌 풀하우스로 올인')",
  "mistake_summary": "유저가 저지른 가장 큰 실수 1가지를 2문장 이내로",
  "why_bad": [
    "나쁜 이유 1 (상대 레인지 관점)",
    "나쁜 이유 2 (EV 관점)",
    "나쁜 이유 3 (보드 텍스처/포지션 관점)"
  ],
  "what_to_do": "대신 했어야 할 액션과 이유를 2문장으로",
  "key_concept": "이 핸드의 핵심 포커 개념 이름을 반드시 한국어로 (예: 리버스 임플라이드 오즈, 밸류 베팅 사이징, 너츠 핸드 플레이)",
  "detail": "상세 분석 — 보드 텍스처, 상대 레인지, 스택 사이즈까지 포함한 깊은 설명 (4~6문장)",
  "ev_comparison": {{
    "user_action": {{
      "action": "유저가 실제로 취한 액션 (예: All-in, Call, Fold)",
      "ev": 유저 액션의 예상 EV (단위: BB, 숫자)
    }},
    "recommended_action": {{
      "action": "추천 액션 (GTO 기반)",
      "ev": 추천 액션의 예상 EV (단위: BB, 숫자)
    }},
    "ev_diff": EV 차이 절대값 (단위: BB, 숫자)
  }}
}}
"""

    try:
        if not os.getenv("GEMINI_API_KEY"):
             return {
                "ai_feedback": "Gemini API Key is missing. Please set GEMINI_API_KEY in .env",
                "ev_comparison": {
                    "user_action": {"action": "N/A", "ev": 0.0},
                    "recommended_action": {"action": "N/A", "ev": 0.0},
                    "ev_diff": 0.0
                }
            }

        # Use gemini-1.5-pro or gemini-1.5-flash for faster results
        model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json", "temperature": 0})
        
        response = model.generate_content(prompt)
        
        # Extract content from response
        content = response.text
        analysis_result = json.loads(content)
        # 구조화 필드를 최상위로 노출
        return {
            "severity": analysis_result.get("severity", "warning"),
            "headline": analysis_result.get("headline"),
            "mistake_summary": analysis_result.get("mistake_summary"),
            "why_bad": analysis_result.get("why_bad"),
            "what_to_do": analysis_result.get("what_to_do"),
            "key_concept": analysis_result.get("key_concept"),
            "detail": analysis_result.get("detail"),
            "ai_feedback": analysis_result.get("detail"),  # 레거시 호환
            "ev_comparison": analysis_result.get("ev_comparison"),
        }

    except Exception as e:
        # In case of API errors, return a graceful fallback
        return {
            "ai_feedback": f"Error during AI analysis with Gemini: {str(e)}",
            "ev_comparison": {
                "user_action": {"action": "Error", "ev": 0.0},
                "recommended_action": {"action": "Error", "ev": 0.0},
                "ev_diff": 0.0
            }
        }
