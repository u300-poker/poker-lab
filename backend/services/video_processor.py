import cv2
import numpy as np
import os

def extract_hand_timestamps(video_path):
    """
    Extracts timestamps where a new hand starts or ends in a WPL poker video.
    This is a simplified version that detects significant pixel changes in the center (pot area).
    """
    if not os.path.exists(video_path):
        return []

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30 # Default to 30 if cannot detect

    hand_timestamps = []
    prev_roi_mean = None
    threshold = 20  # Threshold for change detection
    
    frame_count = 0
    
    # We'll check every 1 second (approximate) to save processing time
    check_interval = int(fps) 
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % check_interval == 0:
            # Assuming the pot area is in the center
            # Let's take a 200x200 ROI in the middle for simplicity
            h, w, _ = frame.shape
            roi = frame[h//2 - 100:h//2 + 100, w//2 - 100:w//2 + 100]
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            current_roi_mean = np.mean(roi_gray)
            
            if prev_roi_mean is not None:
                diff = abs(current_roi_mean - prev_roi_mean)
                if diff > threshold:
                    timestamp = frame_count / fps
                    hand_timestamps.append(timestamp)
            
            prev_roi_mean = current_roi_mean
            
        frame_count += 1

    cap.release()
    return hand_timestamps

def extract_frame(video_path, timestamp):
    """
    Extracts a frame from a video at a given timestamp.
    """
    if not os.path.exists(video_path):
        return None

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30

    frame_index = int(timestamp * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
    
    ret, frame = cap.read()
    cap.release()
    
    if ret:
        return frame
    return None
