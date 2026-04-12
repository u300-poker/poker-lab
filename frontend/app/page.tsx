"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Search, BarChart2, Zap, Brain, Target, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '../components/VideoPlayer';
import CoachSidebar from '../components/CoachSidebar';
import Footer from '../components/Footer';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[] | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeHand, setActiveHand] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await axios.post('http://localhost:8000/upload', formData);
      const filePath = uploadRes.data.file_path;
      setVideoUrl(URL.createObjectURL(file));
      const analyzeRes = await axios.post('http://localhost:8000/analyze', { file_path: filePath });
      setAnalysisResults(analyzeRes.data);
      if (analyzeRes.data.length > 0) setActiveHand(analyzeRes.data[0]);
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("분석에 실패했습니다. 백엔드가 실행 중이고 API 키가 설정되어 있는지 확인해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoData = () => {
    const mockHands = [
      {
        hand_id: "hand_1",
        timestamp: 5,
        ai_feedback: "플랍에서 상대의 첵에 대해 33% 팟 베팅은 매우 표준적입니다. 하지만 이 보드(A-7-2)는 당신의 레인지에 매우 유리하므로, 조금 더 큰 사이즈(50-60%)로 압박을 주어 상대의 약한 페어나 드로우로부터 더 많은 밸류를 얻어낼 수도 있었습니다.",
        ev_comparison: {
          user_action: { action: "Bet 33% Pot", ev: 1.2 },
          recommended_action: { action: "Bet 60% Pot", ev: 1.8 },
          ev_diff: 0.6
        }
      },
      {
        hand_id: "hand_2",
        timestamp: 45,
        ai_feedback: "턴에서 상대의 체크-레이즈에 대해 올인(Shove)을 선택한 것은 위험한 결정이었습니다. 상대는 여기서 셋(Set)이나 투페어 이상의 강한 핸드를 가지고 있을 확률이 높습니다. 여기서는 폴드가 가장 높은 EV를 가지며, 올인은 장기적으로 큰 손실을 초래합니다.",
        ev_comparison: {
          user_action: { action: "All-in", ev: -15.5 },
          recommended_action: { action: "Fold", ev: 0.0 },
          ev_diff: 15.5
        }
      }
    ];
    setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
    setAnalysisResults(mockHands);
    setActiveHand(mockHands[0]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black relative overflow-hidden text-white">
      {/* Background Glows */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5 }}
        className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" 
      />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <header className="mb-20 text-center pt-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-7xl font-black bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-6 tracking-tighter"
          >
            PokerLab
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-zinc-400 text-xl font-light mb-8 max-w-2xl mx-auto leading-relaxed tracking-tight"
          >
            당신의 포커 실력을 연구하고 교정하는 <span className="text-white font-semibold">AI 퍼스널 코치</span>
          </motion.p>
        </header>

        <AnimatePresence mode="wait">
          {!analysisResults ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-40"
            >
              {/* Hero Section */}
              <div className="max-w-3xl mx-auto">
                <motion.div 
                  whileHover={{ y: -5, borderColor: "rgba(59, 130, 246, 0.2)" }}
                  className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-16 text-center shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-colors duration-500"
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                  
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-blue-500/10 rounded-3xl text-blue-400 border border-blue-500/20 transform group-hover:scale-110 transition-transform duration-700"
                  >
                    <Upload size={40} strokeWidth={1.5} />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4 text-white tracking-tight">세션 영상 업로드</h2>
                  <p className="text-zinc-500 mb-10 text-lg font-light">WPL 등 단일 테이블 녹화본을 드래그하여 분석을 시작하세요.</p>
                  
                  <div className="space-y-6">
                    <div className="relative group/input">
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleFileChange} 
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-4 file:px-8 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-black hover:file:bg-zinc-200 transition-all cursor-pointer border border-white/5 bg-black/20 p-4 rounded-[24px] focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startAnalysis}
                        disabled={!file || isAnalyzing}
                        className="flex-grow py-5 px-8 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-lg shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)]"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            프레임 분석 중...
                          </>
                        ) : (
                          <>
                            <Search size={22} strokeWidth={2.5} />
                            AI 분석 시작하기
                          </>
                        )}
                      </motion.button>
                      <motion.button 
                        whileHover={{ backgroundColor: "rgba(39, 39, 42, 0.8)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={loadDemoData}
                        className="py-5 px-8 bg-zinc-800/50 backdrop-blur-md text-zinc-300 font-bold rounded-2xl border border-white/5 hover:text-white transition-all"
                      >
                        데모 보기
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Features Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { icon: Brain, title: "AI 맞춤형 코칭", desc: "Gemini 1.5 Pro 기반의 지능형 코치가 각 상황에서의 실수를 정확하게 찾아내고 전략적 조언을 드립니다.", color: "blue" },
                  { icon: Zap, title: "영상 동기화 복기", desc: "분석된 데이터와 실제 플레이 영상을 동기화하여, 실수가 발생한 시점을 즉각적으로 확인하고 복기하세요.", color: "indigo" },
                  { icon: Target, title: "데이터 기반 교정", desc: "유저의 선택과 최적의 GTO 선택지 간의 EV 차이를 수치로 시각화하여 가장 큰 손실을 주는 습관을 교정합니다.", color: "emerald" }
                ].map((feat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`group bg-zinc-900/20 backdrop-blur-sm p-10 rounded-[32px] border border-white/5 hover:bg-zinc-900/40 transition-all duration-500`}
                  >
                    <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-white/10 transition-colors`}>
                      <feat.icon size={28} strokeWidth={1.5} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white tracking-tight">{feat.title}</h3>
                    <p className="text-zinc-500 leading-relaxed font-light">{feat.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              {/* Video Section */}
              <div className="lg:col-span-2 space-y-6">
                {videoUrl && (
                  <VideoPlayer 
                    videoUrl={videoUrl} 
                    hands={analysisResults} 
                    onHandChange={setActiveHand} 
                  />
                )}
                <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                  <h3 className="text-zinc-400 font-semibold mb-6 flex items-center gap-2 uppercase tracking-tighter text-xs">
                    <BarChart2 size={16} className="text-blue-500" />
                    감지된 핸드 ({analysisResults.length}개)
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {analysisResults.map((h, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveHand(h)}
                        className={`py-3 rounded-2xl text-sm font-bold transition-all border ${
                          activeHand?.hand_id === h.hand_id 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.6)]' 
                            : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        #{i + 1}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 h-[calc(100vh-160px)] sticky top-8">
                {activeHand && <CoachSidebar hand={activeHand} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
