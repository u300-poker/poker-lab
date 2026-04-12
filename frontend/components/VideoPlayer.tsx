import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface HandLog {
  timestamp: number;
  ai_feedback?: string;
  ev_comparison?: { user: number; optimal: number };
}

interface VideoPlayerProps {
  videoUrl: string;
  hands: HandLog[];
  onHandChange: (hand: HandLog) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, hands, onHandChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const activeHand = hands.findLast(h => h.timestamp <= video.currentTime);
      if (activeHand) onHandChange(activeHand);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [hands, onHandChange]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden shadow-2xl">
      <video ref={videoRef} src={videoUrl} className="w-full h-auto" />
      
      {/* 커스텀 타임라인 마커 */}
      <div className="relative h-2 bg-zinc-800 cursor-pointer">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500" 
          style={{ width: `${(currentTime / (videoRef.current?.duration || 1)) * 100}%` }}
        />
        {hands.map((hand, i) => (
          <div 
            key={i}
            className="absolute top-0 w-1 h-full bg-red-400 opacity-70 hover:opacity-100 transition-opacity"
            style={{ left: `${(hand.timestamp / (videoRef.current?.duration || 1)) * 100}%` }}
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = hand.timestamp; }}
          />
        ))}
      </div>

      {/* 컨트롤 바 */}
      <div className="p-4 flex items-center justify-between gap-4">
        <button onClick={togglePlay} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          {isPlaying ? <Pause className="text-white" /> : <Play className="text-white" />}
        </button>
        <span className="text-zinc-400 text-sm font-mono">
          {Math.floor(currentTime)}s / {Math.floor(videoRef.current?.duration || 0)}s
        </span>
      </div>
    </div>
  );
};

export default VideoPlayer;