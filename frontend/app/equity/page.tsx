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

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['h', 'd', 'c', 's'];

export default function EquityPage() {
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StreetEquity[]>([]);

  const handleCardSelect = (card: string) => {
    if (activeSlot !== null) {
      const newSlots = [...slots];
      newSlots[activeSlot] = card;
      setSlots(newSlots);
      setActiveSlot(null);
    }
  };

  const handleClearSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const handleCalculate = async () => {
    setError('');
    setResult([]);
    setLoading(true);

    try {
      const cards = slots.filter((c) => c !== null) as string[];

      if (cards.length < 2) {
        throw new Error('최소 2장의 카드가 필요합니다');
      }

      // 처음 2장 = 히어로, 나머지 = 보드/상대
      const heroCards = cards.slice(0, 2);
      const restCards = cards.slice(2);

      let boardCards: string[] = [];
      let opponentCards: string[] = [];

      // 보드 먼저 (최대 5장 중 3~5장)
      if (restCards.length >= 3) {
        boardCards = restCards.slice(0, Math.min(5 - 2, 5)); // 최대 5장 중 히어로 2 제외
        opponentCards = restCards.slice(boardCards.length);
      }

      const response = await fetch('http://localhost:8000/calculate-equity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_cards: heroCards,
          board_cards: boardCards,
          opponent_cards: opponentCards,
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

  const handleClear = () => {
    setSlots([null, null, null, null, null]);
    setError('');
    setResult([]);
    setActiveSlot(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* 헤더 */}
      <div className="border-b border-white/10 px-6 py-6">
        <h1 className="text-2xl font-bold">Odds Calculator</h1>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* 카드 슬롯 */}
        <div className="flex justify-center gap-3 mb-12">
          {slots.map((card, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlot(idx)}
              className={`w-20 h-28 rounded-3xl border-2 transition-all ${
                activeSlot === idx
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-500 bg-zinc-800/30'
              } flex items-center justify-center`}
            >
              {card ? (
                <div className="text-center">
                  <div className="text-2xl font-bold">{card[0]}</div>
                  <div className="text-lg">{card[1]}</div>
                </div>
              ) : (
                <div className="text-zinc-600">+</div>
              )}
            </button>
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 text-center">
            <p className="text-red-300 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* 카드 선택 패널 */}
        {activeSlot !== null && (
          <div className="mb-8 p-6 bg-zinc-900/50 rounded-3xl border border-white/5">
            <p className="text-zinc-400 text-sm mb-4">슬롯 {activeSlot + 1} - 카드 선택</p>
            <div className="grid grid-cols-7 gap-2">
              {RANKS.map((rank) =>
                SUITS.map((suit) => {
                  const card = `${rank}${suit}`;
                  return (
                    <button
                      key={card}
                      onClick={() => handleCardSelect(card)}
                      className="py-2 px-1 bg-zinc-800 hover:bg-indigo-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {rank}
                      <span className="text-xxs">{suit}</span>
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={() => {
                handleClearSlot(activeSlot);
                setActiveSlot(null);
              }}
              className="mt-4 w-full py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-300 transition-colors"
            >
              삭제
            </button>
          </div>
        )}

        {/* 버튼 그룹 */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={handleCalculate}
            disabled={loading || slots.filter((c) => c).length < 2}
            className="px-8 py-3 rounded-full border-2 border-white/20 hover:border-white/40 disabled:opacity-50 font-semibold transition-colors"
          >
            {loading ? '계산 중...' : '계산'}
          </button>
          <button
            onClick={handleClear}
            className="px-8 py-3 rounded-full border-2 border-white/20 hover:border-white/40 font-semibold transition-colors"
          >
            초기화
          </button>
        </div>

        {/* 결과 */}
        {result.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">에퀴티 분석</h2>
            <EquityChart streetEquities={result} />
          </div>
        )}
      </div>
    </div>
  );
}
