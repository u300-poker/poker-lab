'use client';
import React, { useState } from 'react';
import EquityChart from '@/components/EquityChart';

interface StreetEquity {
  street: string;
  board: string[];
  equities: Array<{
    position: string;
    cards: string[];
    equity: number;
    is_hero: boolean;
  }>;
  vs_random?: boolean;
}

export default function EquityPage() {
  const [heroCards, setHeroCards] = useState('Ah Kh');
  const [boardCards, setBoardCards] = useState('2h 7d 9c');
  const [opponentCards, setOpponentCards] = useState('Qd Jd');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StreetEquity[]>([]);

  const parseCards = (input: string): string[] => {
    return input
      .trim()
      .split(/\s+/)
      .filter((c) => c.length >= 2);
  };

  const handleCalculate = async () => {
    setError('');
    setResult([]);
    setLoading(true);

    try {
      const hero = parseCards(heroCards);
      const board = parseCards(boardCards);
      const opponent = parseCards(opponentCards);

      if (hero.length !== 2) {
        throw new Error('히어로 카드는 정확히 2장이어야 합니다');
      }

      if (board.length > 0 && (board.length < 3 || board.length > 5)) {
        throw new Error('보드 카드는 3~5장이어야 합니다');
      }

      if (opponent.length > 0 && opponent.length !== 2) {
        throw new Error('상대 카드는 0장 또는 2장이어야 합니다');
      }

      const response = await fetch('http://localhost:8000/calculate-equity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_cards: hero,
          board_cards: board,
          opponent_cards: opponent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '계산 실패');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 에러');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Equity Calculator</h1>
          <p className="text-zinc-400">
            포커 핸드의 스트릿별 승률을 계산해보세요
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 히어로 카드 */}
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">
              내 카드 (필수)
            </label>
            <input
              type="text"
              value={heroCards}
              onChange={(e) => setHeroCards(e.target.value)}
              placeholder="예: Ah Kh"
              className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
            <p className="text-xs text-zinc-500 mt-2">
              2장을 입력하세요 (예: Ah, Kd, 9h, Ts)
            </p>
          </div>

          {/* 상대 카드 */}
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">
              상대 카드 (선택)
            </label>
            <input
              type="text"
              value={opponentCards}
              onChange={(e) => setOpponentCards(e.target.value)}
              placeholder="예: Qd Jd"
              className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
            <p className="text-xs text-zinc-500 mt-2">
              입력 안 하면 랜덤 핸드 기준으로 계산
            </p>
          </div>

          {/* 보드 카드 */}
          <div className="md:col-span-2 bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">
              보드 카드 (선택)
            </label>
            <input
              type="text"
              value={boardCards}
              onChange={(e) => setBoardCards(e.target.value)}
              placeholder="예: 2h 7d 9c"
              className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
            <p className="text-xs text-zinc-500 mt-2">
              3~5장 입력 (Flop 3장, Turn 4장, River 5장)
            </p>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8">
            <p className="text-red-300 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* 계산 버튼 */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-2xl py-3 px-8 font-semibold transition-colors"
          >
            {loading ? '계산 중...' : '에퀴티 계산'}
          </button>
          <button
            onClick={() => {
              setHeroCards('Ah Kh');
              setBoardCards('2h 7d 9c');
              setOpponentCards('Qd Jd');
              setError('');
              setResult([]);
            }}
            className="bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 rounded-2xl py-3 px-8 font-semibold transition-colors"
          >
            초기화
          </button>
        </div>

        {/* 결과 */}
        {result.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">에퀴티 분석</h2>
            <EquityChart streetEquities={result} />
          </div>
        )}

        {/* 안내 */}
        {result.length === 0 && !loading && !error && (
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-zinc-400">
              카드를 입력하고 "에퀴티 계산" 버튼을 클릭하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
