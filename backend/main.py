from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from typing import List
from .services.video_processor import extract_hand_timestamps, extract_frame
from .services.ocr_engine import OCREngine
from .services.ai_coach import analyze_hand
from .services.image_parser import parse_hand_image
from .models.game_data import HandLog

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_videos"

class AnalyzeRequest(BaseModel):
    file_path: str

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)
    
    file_path = os.path.join(TEMP_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"file_path": file_path}

@app.post("/analyze", response_model=List[HandLog])
async def analyze_video(request: AnalyzeRequest):
    timestamps = extract_hand_timestamps(request.file_path)
    ocr_engine = OCREngine()
    
    hand_logs = []
    for i, ts in enumerate(timestamps):
        frame = extract_frame(request.file_path, ts)
        if frame is not None:
            # Extract basic game data
            game_data = ocr_engine.extract_game_data(frame)
            
            # Recognize cards (using default regions)
            board_img = ocr_engine.crop_region(frame, "board")
            hole_img = ocr_engine.crop_region(frame, "hero_cards")
            cards_data = ocr_engine.recognize_cards(board_img, hole_img)
            
            # Create a HandLog object
            log = HandLog(
                hand_id=f"hand_{i+1}",
                timestamp=ts,
                blinds="unknown", # Would be extracted by OCR normally
                pot_size=game_data["pot_size"],
                board_cards=cards_data["board_cards"],
                hero_cards=cards_data["hero_cards"]
            )
            
            # Analyze hand using AI Coach
            ai_result = analyze_hand(log)
            log.ai_feedback = ai_result.get("ai_feedback")
            log.ev_comparison = ai_result.get("ev_comparison")
            
            hand_logs.append(log)
            
    return hand_logs


@app.post("/analyze-image", response_model=HandLog)
async def analyze_image(image: UploadFile = File(...)):
    import traceback
    image_bytes = await image.read()
    try:
        hand_log = parse_hand_image(image_bytes)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    return hand_log
