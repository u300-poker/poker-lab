import os
import json
import google.generativeai as genai
from ..models.game_data import HandLog
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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
당신은 세계적인 포커 코치입니다. 다음 핸드 상황을 분석하고, 유저의 선택과 최적의 선택(GTO)을 비교하여 BB 단위의 손실액(EV)과 구체적인 피드백을 제공하세요.

핸드 정보:
{json.dumps(hand_description, ensure_ascii=False, indent=2)}

분석할 때 고려할 사항:
1. 보드 텍스처와 히어로의 핸드 레인지.
2. 상대방의 액션과 스택 사이즈 (제공된 경우).
3. 현재 포지션에서의 최적 전략.

응답은 반드시 아래와 같은 JSON 형식을 유지해야 하며, 모든 텍스트 설명은 한국어로 작성하세요:
{{
  "ai_feedback": "상황에 대한 상세한 전략적 분석과 개선점 제안...",
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
        model = genai.GenerativeModel('gemini-1.5-pro', generation_config={"response_mime_type": "application/json"})
        
        response = model.generate_content(prompt)
        
        # Extract content from response
        content = response.text
        analysis_result = json.loads(content)
        return analysis_result

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
