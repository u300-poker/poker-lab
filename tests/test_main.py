from fastapi.testclient import TestClient
import os
import pytest
import cv2
import numpy as np
from backend.main import app

@pytest.fixture
def client():
    return TestClient(app)

def create_temp_video(video_path, frames=100, fps=10):
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, fps, (640, 480))
    for i in range(frames):
        frame = np.ones((480, 640, 3), dtype=np.uint8) * 128
        if i >= 50:
            frame[480//2 - 100:480//2 + 100, 640//2 - 100:640//2 + 100] = 0
        out.write(frame)
    out.release()

def test_upload_video(client):
    temp_dir = "temp_videos"
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
        
    test_file_content = b"fake video content"
    test_file_name = "test_video_upload.mp4"
    
    files = {"file": (test_file_name, test_file_content, "video/mp4")}
    response = client.post("/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "file_path" in data
    assert data["file_path"].endswith(test_file_name)
    assert os.path.exists(data["file_path"])
    
    if os.path.exists(data["file_path"]):
        os.remove(data["file_path"])

def test_analyze_video(client):
    video_path = "temp_videos/test_analyze.mp4"
    if not os.path.exists("temp_videos"):
        os.makedirs("temp_videos")
    create_temp_video(video_path)
    
    try:
        response = client.post("/analyze", json={"file_path": video_path})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # In our create_temp_video, we expect at least one timestamp to be detected
        # at the frame where the center square changes color.
        assert len(data) > 0
        assert "hand_id" in data[0]
        assert "timestamp" in data[0]
        assert "ai_feedback" in data[0]
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)
