import cv2
import numpy as np
import os
import pytest
from backend.services.video_processor import extract_hand_timestamps

def create_test_video(video_path, frames=100, fps=10):
    """
    Creates a test video with changing central area.
    """
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, fps, (640, 480))
    
    for i in range(frames):
        # Create a basic gray frame
        frame = np.ones((480, 640, 3), dtype=np.uint8) * 128
        
        # At frame 50, change the central area to black (signifying a change)
        if i >= 50:
            frame[480//2 - 100:480//2 + 100, 640//2 - 100:640//2 + 100] = 0
            
        out.write(frame)
    
    out.release()

def test_extract_hand_timestamps():
    video_path = "test_video.mp4"
    create_test_video(video_path, frames=100, fps=10)
    
    try:
        timestamps = extract_hand_timestamps(video_path)
        # We expect a change at frame 50. Since we check every fps (10) frames,
        # it will be checked at frame 0, 10, 20, 30, 40, 50...
        # The change occurs at frame 50, which is timestamp 50/10 = 5.0
        assert len(timestamps) > 0
        assert 5.0 in timestamps
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)

def test_extract_hand_timestamps_no_file():
    timestamps = extract_hand_timestamps("non_existent.mp4")
    assert timestamps == []
