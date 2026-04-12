import pytest
import os
import json
from unittest.mock import MagicMock, patch
from backend.models.game_data import HandLog, PlayerInfo, Action
from backend.services.ai_coach import analyze_hand

def test_analyze_hand_format():
    """
    Test that analyze_hand returns the correct JSON structure.
    """
    # Mock hand data
    hand_log = HandLog(
        hand_id="test_hand_1",
        timestamp=123.45,
        blinds="1/2",
        pot_size=10.0,
        board_cards=["Ah", "Ks", "2d"],
        hero_cards=["As", "Qh"],
        players=[
            PlayerInfo(position="BTN", stack=200.0, is_hero=True),
            PlayerInfo(position="BB", stack=180.0, is_hero=False)
        ],
        actions=[
            Action(player="BTN", action_type="raise", amount=6.0)
        ]
    )

    # Mock response from GPT-4o
    mock_json_response = {
        "ai_feedback": "훌륭한 프리플랍 레이즈입니다. 보드가 당신에게 유리합니다.",
        "ev_comparison": {
            "user_action": {"action": "Raise 3bb", "ev": 2.5},
            "recommended_action": {"action": "Raise 3bb", "ev": 2.5},
            "ev_diff": 0.0
        }
    }

    # Patch the OpenAI client's chat completions create method
    with patch('backend.services.ai_coach.client.chat.completions.create') as mock_create, \
         patch('os.getenv', return_value="fake_api_key"):
        
        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps(mock_json_response)
        mock_response.choices = [mock_choice]
        mock_create.return_value = mock_response

        result = analyze_hand(hand_log)

        # Verify the structure and content
        assert "ai_feedback" in result
        assert "ev_comparison" in result
        assert result["ev_comparison"]["ev_diff"] == 0.0
        assert result["ev_comparison"]["user_action"]["action"] == "Raise 3bb"
        assert result["ai_feedback"] == "훌륭한 프리플랍 레이즈입니다. 보드가 당신에게 유리합니다."

def test_analyze_hand_missing_api_key():
    """
    Test the behavior when the API key is missing.
    """
    hand_log = HandLog(
        hand_id="test_hand_2",
        timestamp=123.45,
        blinds="1/2",
        pot_size=10.0
    )

    with patch('os.getenv', return_value=None):
        result = analyze_hand(hand_log)
        assert "OpenAI API Key is missing" in result["ai_feedback"]
        assert result["ev_comparison"]["ev_diff"] == 0.0

def test_analyze_hand_api_error():
    """
    Test the behavior when an API error occurs.
    """
    hand_log = HandLog(
        hand_id="test_hand_3",
        timestamp=123.45,
        blinds="1/2",
        pot_size=10.0
    )

    with patch('backend.services.ai_coach.client.chat.completions.create') as mock_create, \
         patch('os.getenv', return_value="fake_api_key"):
        
        mock_create.side_effect = Exception("API connection failed")

        result = analyze_hand(hand_log)
        assert "Error during AI analysis" in result["ai_feedback"]
        assert "API connection failed" in result["ai_feedback"]
