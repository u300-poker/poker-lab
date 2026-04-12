import pytest
import numpy as np
from unittest.mock import MagicMock, patch
from backend.services.ocr_engine import OCREngine

@pytest.fixture
def mock_vision_client():
    with patch('google.cloud.vision.ImageAnnotatorClient') as mock:
        yield mock

def test_extract_game_data_mock(mock_vision_client):
    # Setup mock response
    mock_client_instance = mock_vision_client.return_value
    mock_response = MagicMock()
    mock_annotation = MagicMock()
    mock_annotation.description = "Pot: 1500"
    mock_response.text_annotations = [mock_annotation]
    mock_client_instance.text_detection.return_value = mock_response
    
    # Create engine and test
    engine = OCREngine()
    # Force client to be the mock
    engine.client = mock_client_instance
    
    # Create a dummy image
    dummy_frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
    
    result = engine.extract_game_data(dummy_frame)
    
    assert result["pot_size"] == 1500.0
    assert "Pot: 1500" in result["raw_text"]

def test_recognize_cards_mock(mock_vision_client):
    # Setup mock response
    mock_client_instance = mock_vision_client.return_value
    
    def side_effect(image):
        mock_response = MagicMock()
        mock_annotation = MagicMock()
        # We'll return different text based on a very simplified logic or just one
        mock_annotation.description = "Ah Ks 2d"
        mock_response.text_annotations = [mock_annotation]
        return mock_response
        
    mock_client_instance.text_detection.side_effect = side_effect
    
    engine = OCREngine()
    engine.client = mock_client_instance
    
    dummy_board = np.zeros((200, 600, 3), dtype=np.uint8)
    dummy_hole = np.zeros((150, 300, 3), dtype=np.uint8)
    
    result = engine.recognize_cards(dummy_board, dummy_hole)
    
    assert "Ah" in result["board_cards"]
    assert "Ks" in result["board_cards"]
    assert "2d" in result["board_cards"]
    # Since we used the same mock response for both:
    assert "Ah" in result["hero_cards"]

def test_parse_cards():
    engine = OCREngine()
    
    test_cases = [
        ("Ah Ks 2d", ["Ah", "Ks", "2d"]),
        ("10c Jd Qs", ["10c", "Jd", "Qs"]),
        ("No cards here", []),
        ("AH ks", ["AH", "ks"]), # Case insensitive
    ]
    
    for input_text, expected in test_cases:
        assert engine._parse_cards(input_text) == expected
