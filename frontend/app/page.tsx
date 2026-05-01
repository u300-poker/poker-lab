"use client";
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Search, BarChart2, Zap, Brain, Target, Image as ImageIcon, Plus, X, History, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import VideoPlayer from '../components/VideoPlayer';
import CoachSidebar from '../components/CoachSidebar';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import { saveHand } from '../lib/storage';
import { getUser, logout, DummyUser } from '../lib/auth';

type TabType = 'video' | 'image';

interface QueuedImage {
  file: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  result?: any;
  errorMsg?: string;
}

const SEVERITY_DOT: Record<string, string> = {
  critical: '🔴',
  warning: '🟡',
  good: '🟢',
};

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [user, setUser] = useState<DummyUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => { setUser(getUser()) }, []);

  // Video tab state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[] | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeHand, setActiveHand] = useState<any>(null);

  // Image session state
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [isAnalyzingSession, setIsAnalyzingSession] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [activeDecisionIdx, setActiveDecisionIdx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isAnalysisView = analysisResults !== null || sessionDone;

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'image' || isAnalysisView) return;
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (file) addImages([file]);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, isAnalysisView, queue]);

  // Video handlers
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
  };

  const startVideoAnalysis = async () => {
    if (!videoFile) return;
    setIsAnalyzingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const uploadRes = await axios.post(`${API}/upload`, formData);
      setVideoUrl(URL.createObjectURL(videoFile));
      const analyzeRes = await axios.post(`${API}/analyze`, { file_path: uploadRes.data.file_path });
      setAnalysisResults(analyzeRes.data);
      if (analyzeRes.data.length > 0) setActiveHand(analyzeRes.data[0]);
    } catch (err) {
      console.error(err);
      alert("분석에 실패했습니다.");
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const loadDemoData = () => {
    const mockHands = [
      {
        hand_id: "hand_1", timestamp: 5,
        ai_feedback: "플랍에서 상대의 첵에 대해 33% 팟 베팅은 표준적입니다. 하지만 이 보드는 더 큰 사이즈로 압박을 줄 수 있었습니다.",
        ev_comparison: { user_action: { action: "Bet 33%", ev: 1.2 }, recommended_action: { action: "Bet 60%", ev: 1.8 }, ev_diff: 0.6 }
      },
      {
        hand_id: "hand_2", timestamp: 45,
        ai_feedback: "턴에서 체크-레이즈에 올인은 위험했습니다. 폴드가 더 높은 EV를 가집니다.",
        ev_comparison: { user_action: { action: "All-in", ev: -15.5 }, recommended_action: { action: "Fold", ev: 0.0 }, ev_diff: 15.5 }
      }
    ];
    setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
    setAnalysisResults(mockHands);
    setActiveHand(mockHands[0]);
  };

  // Image session handlers
  const addImages = (files: File[]) => {
    const newItems: QueuedImage[] = files
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ file: f, previewUrl: URL.createObjectURL(f), status: 'pending' }));
    setQueue(prev => [...prev, ...newItems]);
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(Array.from(e.target.files));
  };

  const removeImage = (idx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addImages(Array.from(e.dataTransfer.files));
  };

  const startSessionAnalysis = async () => {
    if (queue.length === 0) return;
    setIsAnalyzingSession(true);
    setSessionDone(false);
    setActiveIdx(0);

    for (let i = 0; i < queue.length; i++) {
      setQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'analyzing' } : item));
      try {
        const formData = new FormData();
        formData.append('image', queue[i].file);
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analyze-image`, formData);
        saveHand(res.data, queue[i].file.name);
        setQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'done', result: res.data } : item));
      } catch (err: any) {
        const detail = err?.response?.data?.detail ?? '서버 오류';
        setQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', errorMsg: detail } : item));
      }
    }

    setIsAnalyzingSession(false);
    setSessionDone(true);
  };

  const activeItem = queue[activeIdx];
  const doneCount = queue.filter(q => q.status === 'done').length;

  return (
    <div className="flex flex-col min-h-screen bg-black relative overflow-hidden text-white">
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={setUser} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.5 }}
        className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Top nav */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors">
            <BarChart2 size={15} /> 대시보드
          </button>
          <button onClick={() => router.push('/history')} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors">
            <History size={15} /> 히스토리
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-zinc-400 text-sm"><User size={14} />{user.name}</span>
              <button onClick={() => { logout(); setUser(null); }} className="flex items-center gap-1 text-zinc-600 hover:text-red-400 text-sm transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors">
              <LogIn size={15} /> 로그인
            </button>
          )}
        </div>

        <header className="mb-20 text-center pt-12">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-7xl font-black bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-6 tracking-tighter">
            PokerLab
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-zinc-400 text-xl font-light mb-8 max-w-2xl mx-auto leading-relaxed tracking-tight">
            당신의 포커 실력을 연구하고 교정하는 <span className="text-white font-semibold">AI 퍼스널 코치</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}>
            <a href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-400/50 text-indigo-300 font-semibold rounded-2xl transition-all text-sm">
              🎯 내 포커 성향 테스트하기
            </a>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {!isAnalysisView ? (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="space-y-40">
              <div className="max-w-3xl mx-auto">
                <motion.div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-16 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                  {/* Tabs */}
                  <div className="flex gap-2 mb-10 bg-black/30 p-1.5 rounded-2xl">
                    {(['video', 'image'] as TabType[]).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-black shadow' : 'text-zinc-500 hover:text-white'}`}>
                        {tab === 'video' ? <><Upload size={16} strokeWidth={2.5} />영상 분석</> : <><ImageIcon size={16} strokeWidth={2.5} />이미지 분석</>}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'video' ? (
                      <motion.div key="video-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="text-center">
                        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-blue-500/10 rounded-3xl text-blue-400 border border-blue-500/20">
                          <Upload size={40} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-white tracking-tight">세션 영상 업로드</h2>
                        <p className="text-zinc-500 mb-10 text-lg font-light">WPL 등 단일 테이블 녹화본을 업로드하세요.</p>
                        <div className="space-y-6">
                          <input type="file" accept="video/*" onChange={handleVideoFileChange}
                            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-4 file:px-8 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-black hover:file:bg-zinc-200 transition-all cursor-pointer border border-white/5 bg-black/20 p-4 rounded-[24px]" />
                          <div className="flex gap-4">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={startVideoAnalysis} disabled={!videoFile || isAnalyzingVideo}
                              className="flex-grow py-5 px-8 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-lg">
                              {isAnalyzingVideo ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />분석 중...</> : <><Search size={22} strokeWidth={2.5} />AI 분석 시작</>}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={loadDemoData}
                              className="py-5 px-8 bg-zinc-800/50 text-zinc-300 font-bold rounded-2xl border border-white/5 hover:text-white transition-all">
                              데모 보기
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="image-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                        <h2 className="text-3xl font-bold mb-2 text-white tracking-tight text-center">세션 이미지 분석</h2>
                        <p className="text-zinc-500 mb-8 text-base font-light text-center">
                          핸드 이미지를 여러 장 추가하면 세션 전체를 한 번에 분석합니다.
                        </p>

                        {/* Drop Zone */}
                        <div onClick={() => imageInputRef.current?.click()} onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave} onDrop={handleDrop}
                          className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-6 transition-all mb-4 ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-black/20'}`}>
                          <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageInputChange} className="hidden" />
                          <div className="flex items-center justify-center gap-3 py-4">
                            <Plus size={20} className="text-zinc-500" />
                            <p className="text-zinc-400 font-medium">이미지 추가 (여러 장 선택 가능)</p>
                          </div>
                          <p className="text-center text-zinc-600 text-xs">
                            PNG, JPG, WEBP · <kbd className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-xs">⌘V</kbd> 붙여넣기
                          </p>
                        </div>

                        {/* Queue Preview */}
                        {queue.length > 0 && (
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {queue.map((item, i) => (
                              <div key={i} className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 aspect-video">
                                <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  {item.status === 'analyzing' && (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  )}
                                  {item.status === 'done' && (
                                    <span className="text-xl">{SEVERITY_DOT[item.result?.severity ?? 'warning']}</span>
                                  )}
                                  {item.status === 'error' && <span className="text-red-400 text-xs font-bold">오류</span>}
                                </div>
                                {item.status === 'pending' && (
                                  <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors">
                                    <X size={10} className="text-white" />
                                  </button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                  <p className="text-zinc-300 text-xs truncate">#{i + 1}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={startSessionAnalysis} disabled={queue.length === 0 || isAnalyzingSession}
                          className="w-full py-5 px-8 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-lg shadow-[0_10px_20px_-10px_rgba(99,102,241,0.5)]">
                          {isAnalyzingSession ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              분석 중 ({queue.filter(q => q.status === 'done').length}/{queue.length})</>
                          ) : (
                            <><Search size={22} strokeWidth={2.5} />
                              {queue.length > 0 ? `${queue.length}개 핸드 분석 시작` : '이미지를 추가하세요'}</>
                          )}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { icon: Brain, title: "AI 맞춤형 코칭", desc: "Gemini 2.5 Pro 기반의 코치가 각 상황에서의 실수를 정확하게 찾아내고 전략적 조언을 드립니다." },
                  { icon: Zap, title: "세션 전체 분석", desc: "한 세션의 핸드 이미지를 여러 장 올리면 모든 핸드를 순서대로 분석해 드립니다." },
                  { icon: Target, title: "선택지별 비교", desc: "각 상황에서 가능했던 모든 선택(Fold/Call/Raise)을 최선/나쁨으로 평가해 직관적으로 보여줍니다." }
                ].map((feat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="group bg-zinc-900/20 backdrop-blur-sm p-10 rounded-[32px] border border-white/5 hover:bg-zinc-900/40 transition-all duration-500">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-white/10 transition-colors">
                      <feat.icon size={28} strokeWidth={1.5} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white tracking-tight">{feat.title}</h3>
                    <p className="text-zinc-500 leading-relaxed font-light">{feat.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          ) : sessionDone ? (
            /* Image session result view */
            <motion.div key="image-session" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                {/* Active image preview */}
                {activeItem && (
                  <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
                    <img src={activeItem.previewUrl} alt="핸드 이미지"
                      className="w-full object-contain max-h-[420px]" />
                  </div>
                )}

                {/* Hand selector */}
                <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                  <h3 className="text-zinc-400 font-semibold mb-4 flex items-center gap-2 uppercase tracking-tighter text-xs">
                    <BarChart2 size={16} className="text-indigo-500" />
                    세션 핸드 ({doneCount}/{queue.length}개 분석 완료)
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {queue.map((item, i) => (
                      <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { if (item.status === 'done') { setActiveIdx(i); setActiveDecisionIdx(0); } }}
                        disabled={item.status !== 'done'}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                          activeIdx === i && item.status === 'done'
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.6)]'
                            : item.status === 'done'
                              ? 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                              : 'bg-zinc-900/20 border-white/5 text-zinc-700 cursor-not-allowed'
                        }`}>
                        <span>{SEVERITY_DOT[item.result?.severity ?? ''] ?? (item.status === 'analyzing' ? '⏳' : '○')}</span>
                        <span>#{i + 1}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Hand info */}
                {activeItem?.result && (
                  <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Hand ID', value: activeItem.result.hand_id?.replace(/^#/, '') },
                        { label: '블라인드', value: activeItem.result.blinds },
                        { label: '히어로 카드', value: activeItem.result.hero_cards?.join(' ') || '-' },
                        { label: '보드 카드', value: activeItem.result.board_cards?.join(' ') || '-' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-black/20 rounded-2xl p-4">
                          <p className="text-zinc-500 mb-1">{label}</p>
                          <p className="font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Street decision tabs */}
                {activeItem?.result?.decisions && activeItem.result.decisions.length > 0 && (() => {
                  const STREET_LABEL: Record<string, string> = { preflop: '프리플랍', flop: '플랍', turn: '턴', river: '리버' };
                  const decisions = activeItem.result.decisions;
                  return (
                    <div className="bg-zinc-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/5">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-4">결정 시점별 분석</p>
                      <div className="flex gap-2 flex-wrap">
                        {decisions.map((dec: any, i: number) => (
                          <motion.button key={i} whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveDecisionIdx(i)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                              activeDecisionIdx === i
                                ? 'bg-indigo-600 border-indigo-400 text-white'
                                : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                            }`}>
                            <span>{SEVERITY_DOT[dec.severity] ?? '○'}</span>
                            <span>{STREET_LABEL[dec.street] ?? dec.street}</span>
                            <span className="text-xs opacity-70">{dec.hero_action}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setQueue([]); setSessionDone(false); setActiveIdx(0); setActiveDecisionIdx(0); setActiveTab('image'); }}
                  className="w-full py-4 bg-zinc-800/50 text-zinc-300 font-bold rounded-2xl border border-white/5 hover:text-white transition-all">
                  새 세션 분석하기
                </motion.button>
              </div>

              <div className="lg:col-span-1 h-[calc(100vh-160px)] sticky top-8">
                {activeItem?.status === 'error' ? (
                  <div className="h-full bg-zinc-950 flex flex-col items-center justify-center px-6 gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-red-400 font-semibold text-center">분석 실패</p>
                    <p className="text-zinc-500 text-sm text-center leading-relaxed">
                      이미지 파싱 중 오류가 발생했습니다.<br />
                      WPL 핸드 히스토리 이미지인지 확인해 주세요.
                    </p>
                    {activeItem.errorMsg && (
                      <div className="w-full bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3">
                        <p className="text-red-400/70 text-xs font-mono break-all">{activeItem.errorMsg}</p>
                      </div>
                    )}
                  </div>
                ) : activeItem?.result && (() => {
                  const decisions = activeItem.result.decisions;
                  if (decisions && decisions.length > 0) {
                    const dec = decisions[activeDecisionIdx] ?? decisions[0];
                    const STREET_LABEL: Record<string, string> = { preflop: '프리플랍', flop: '플랍', turn: '턴', river: '리버' };
                    const sidebarHand = {
                      hand_id: `${activeItem.result.hand_id} · ${STREET_LABEL[dec.street] ?? dec.street}`,
                      blinds: activeItem.result.blinds,
                      severity: dec.severity,
                      headline: dec.headline,
                      mistake_summary: dec.mistake_summary,
                      why_bad: dec.why_bad,
                      what_to_do: dec.what_to_do,
                      key_concept: dec.key_concept,
                      ev_comparison: dec.ev_comparison,
                      street_equities: activeItem.result.street_equities,
                    };
                    return <CoachSidebar hand={sidebarHand} />;
                  }
                  return <CoachSidebar hand={activeItem.result} />;
                })()}
              </div>
            </motion.div>

          ) : (
            /* Video result view */
            <motion.div key="video-analysis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                {videoUrl && <VideoPlayer videoUrl={videoUrl} hands={analysisResults!} onHandChange={setActiveHand} />}
                <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                  <h3 className="text-zinc-400 font-semibold mb-6 flex items-center gap-2 uppercase tracking-tighter text-xs">
                    <BarChart2 size={16} className="text-blue-500" />감지된 핸드 ({analysisResults!.length}개)
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {analysisResults!.map((h, i) => (
                      <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveHand(h)}
                        className={`py-3 rounded-2xl text-sm font-bold transition-all border ${
                          activeHand?.hand_id === h.hand_id
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white'
                        }`}>
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
