import cv2
import numpy as np
from typing import List, Dict, Any
from google.cloud import vision
import io

class OCREngine:
    def __init__(self):
        # In a real environment, you would set GOOGLE_APPLICATION_CREDENTIALS
        # as an environment variable or pass a service account file here.
        # client = vision.ImageAnnotatorClient()
        self.client = None # vision.ImageAnnotatorClient()

    def _get_client(self):
        if self.client is None:
            try:
                self.client = vision.ImageAnnotatorClient()
            except Exception:
                # Fallback or mock for development
                pass
        return self.client

    def crop_region(self, image: np.ndarray, region: str) -> np.ndarray:
        """
        Crop specific regions from a WPL poker frame.
        Placeholder coordinates are used here.
        """
        h, w = image.shape[:2]
        
        # Mapping regions to crop coordinates (ymin, ymax, xmin, xmax)
        # These are just examples and need to be calibrated for WPL.
        regions = {
            "pot": (h // 2 - 50, h // 2 + 50, w // 2 - 100, w // 2 + 100),
            "hero_cards": (int(h * 0.75), int(h * 0.95), int(w * 0.4), int(w * 0.6)),
            "board": (int(h * 0.35), int(h * 0.55), int(w * 0.25), int(w * 0.75)),
            "player_stack": (int(h * 0.6), int(h * 0.75), int(w * 0.1), int(w * 0.3)),
        }
        
        if region in regions:
            y1, y2, x1, x2 = regions[region]
            return image[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        return image

    def extract_text(self, image: np.ndarray) -> str:
        """
        Use Google Cloud Vision to extract text from an image.
        """
        client = self._get_client()
        if client is None:
            return "MOCK_TEXT"

        # Convert OpenCV image to bytes
        success, encoded_image = cv2.imencode('.jpg', image)
        if not success:
            return ""
        
        content = encoded_image.tobytes()
        image_vision = vision.Image(content=content)
        
        response = client.text_detection(image=image_vision)
        texts = response.text_annotations
        
        if texts:
            return texts[0].description
        return ""

    def extract_game_data(self, frame_image: np.ndarray) -> Dict[str, Any]:
        """
        Extract key game data (pot, blinds, stacks) from a frame.
        """
        pot_img = self.crop_region(frame_image, "pot")
        pot_text = self.extract_text(pot_img)
        
        # Simple extraction logic for pot size (assuming it's a number)
        pot_size = 0.0
        try:
            # Clean text to keep only numbers and decimals
            cleaned_pot = "".join(filter(lambda x: x.isdigit() or x == '.', pot_text))
            if cleaned_pot:
                pot_size = float(cleaned_pot)
        except ValueError:
            pass
            
        return {
            "pot_size": pot_size,
            "raw_text": pot_text # For debugging
        }

    def recognize_cards(self, board_image: np.ndarray, hole_image: np.ndarray) -> Dict[str, List[str]]:
        """
        Recognize community cards and hero cards.
        Placeholder logic for template matching or simple text recognition.
        """
        # For now, we'll try to extract text from these regions
        # Real-world card recognition often uses template matching for suits and OCR/CNN for ranks.
        board_text = self.extract_text(board_image)
        hero_text = self.extract_text(hole_image)
        
        # Example output: ["Ah", "Ks", "2d"]
        # Simplified parsing for demonstration
        board_cards = self._parse_cards(board_text)
        hero_cards = self._parse_cards(hero_text)
        
        return {
            "board_cards": board_cards,
            "hero_cards": hero_cards
        }

    def _parse_cards(self, text: str) -> List[str]:
        """
        Helper to parse recognized card text like 'Ah Ks' into list ['Ah', 'Ks'].
        """
        # A real implementation would be much more robust.
        # This is a placeholder.
        if not text or text == "MOCK_TEXT":
            return []
        
        import re
        # Look for patterns like Ah, Kd, 10c, 2s
        card_pattern = r'[2-9TJQKA][hsdc]|10[hsdc]'
        return re.findall(card_pattern, text, re.IGNORECASE)

def extract_game_data(frame_image: np.ndarray) -> Dict[str, Any]:
    engine = OCREngine()
    return engine.extract_game_data(frame_image)

def recognize_cards(board_image: np.ndarray, hole_image: np.ndarray) -> Dict[str, List[str]]:
    engine = OCREngine()
    return engine.recognize_cards(board_image, hole_image)
