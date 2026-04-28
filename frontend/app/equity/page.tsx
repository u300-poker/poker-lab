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

type SlotType = 'hero1' | 'hero2' | 'board' | 'opponent';

export default function EquityPage() {
  const [heroCards, setHeroCards] = useState<[string | null, string | null]>([null, null]);
  const [boardCards, setBoardCards] = useState<(string | null)[]>([null, null, null, null, null]);
  const [opponents, setOpponents] = useState<Array<[string | null, string | null]>>([
    [null, null],
  ]);
  const [activeSlot, setActiveSlot] = useState<{
    type: SlotType;
    index?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StreetEquity[]>([]);

  const handleCardSelect = (card: string) => {
    if (!activeSlot) return;

    if (activeSlot.type === 'hero1') {
      setHeroCards([card, heroCards[1]]);
    } else if (activeSlot.type === 'hero2') {
      setHeroCards([heroCards[0], card]);
    } else if (activeSlot.type === 'board') {
      const newBoard = [...boardCards];
      newBoard[activeSlot.index!] = card;
      setBoardCards(newBoard);
    } else if (activeSlot.type === 'opponent') {
      const newOpponents = [...opponents];
      const idx = activeSlot.index!;
      const slotIndex = activeSlot.index! % 2;
      if (slotIndex === 0) {
        newOpponents[Math.floor(idx / 2)] = [card, newOpponents[Math.floor(idx / 2)][1]];
      } else {
        newOpponents[Math.floor(idx / 2)] = [newOpponents[Math.floor(idx / 2)][0], card];
      }
      setOpponents(newOpponents);
    }
    setActiveSlot(null);
  };

  const handleAddOpponent = () => {
    setOpponents([...opponents, [null, null]]);
  };

  const handleRemoveOpponent = (idx: number) => {
    setOpponents(opponents.filter((_, i) => i !== idx));
  };

  const handleCalculate = async () => {
    setError('');
    setResult([]);
    setLoading(true);

    try {
      const hero = heroCards.filter((c) => c !== null) as string[];
      const board = boardCards.filter((c) => c !== null) as string[];
      const opps = opponents.filter((o) => o[0] && o[1]).map((o) => o as [string, string]);

      if (hero.length !== 2) {
        throw new Error('내 카드는 정확히 2장이어야 합니다');
      }

      if (opps.length === 0) {
        throw new Error('최소 1명의 상대가 필요합니다');
      }

      const response = await fetch('http://localhost:8000/calculate-equity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_cards: hero,
          board_cards: board,
          opponent_cards: opps.length === 1 ? opps[0] : opps,
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
    setHeroCards([null, null]);
    setBoardCards([null, null, null, null, null]);
    setOpponents([[null, null]]);
    setError('');
    setResult([]);
    setActiveSlot(null);
  };

  const CardSlot = ({
    card,
    onClick,
    isActive,
    label,
  }: {
    card: string | null;
    onClick: () => void;
    isActive: boolean;
    label?: string;
  }) => (
    <button
      onClick={onClick}
      className={`w-20 h-28 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${
        isActive
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-zinc-500 bg-zinc-800/30 hover:border-zinc-400'
      }`}
    >
      {card ? (
        <>
          <div className="text-2xl font-bold">{card[0]}</div>
          <div className="text-lg">{card[1]}</div>
        </>
      ) : (
        <div className="text-zinc-600 text-2xl">+</div>
      )}
      {label && <div className="text-xs text-zinc-500 mt-1">{label}</div>}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* 헤더 */}
      <div className="border-b border-white/10 px-6 py-6">
        <h1 className="text-2xl font-bold">Odds Calculator</h1>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto px-6 py-8">
        {/* 내 카드 */}
        <div className="mb-8">
          <p className="text-sm text-zinc-400 mb-3 font-semibold">내 카드</p>
          <div className="flex justify-center gap-3">
            <CardSlot
              card={heroCards[0]}
              onClick={() => setActiveSlot({ type: 'hero1' })}
              isActive={activeSlot?.type === 'hero1'}
            />
            <CardSlot
              card={heroCards[1]}
              onClick={() => setActiveSlot({ type: 'hero2' })}
              isActive={activeSlot?.type === 'hero2'}
            />
          </div>
        </div>

        {/* 보드 */}
        <div className="mb-8">
          <p className="text-sm text-zinc-400 mb-3 font-semibold">보드</p>
          <div className="flex justify-center gap-2">
            {boardCards.map((card, idx) => (
              <CardSlot
                key={idx}
                card={card}
                onClick={() => setActiveSlot({ type: 'board', index: idx })}
                isActive={activeSlot?.type === 'board' && activeSlot?.index === idx}
              />
            ))}
          </div>
        </div>

        {/* 상대들 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-zinc-400 font-semibold">상대</p>
            <button
              onClick={handleAddOpponent}
              className="text-xs px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-colors"
            >
              + Hand
            </button>
          </div>

          <div className="space-y-4">
            {opponents.map((opp, oppIdx) => (
              <div key={oppIdx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500">
                    상대 {oppIdx + 1}
                  </span>
                  {opponents.length > 1 && (
                    <button
                      onClick={() => handleRemoveOpponent(oppIdx)}
                      className="text-xs px-2 py-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="flex justify-center gap-3">
                  <CardSlot
                    card={opp[0]}
                    onClick={() =>
                      setActiveSlot({ type: 'opponent', index: oppIdx * 2 })
                    }
                    isActive={
                      activeSlot?.type === 'opponent' &&
                      activeSlot?.index === oppIdx * 2
                    }
                  />
                  <CardSlot
                    card={opp[1]}
                    onClick={() =>
                      setActiveSlot({ type: 'opponent', index: oppIdx * 2 + 1 })
                    }
                    isActive={
                      activeSlot?.type === 'opponent' &&
                      activeSlot?.index === oppIdx * 2 + 1
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 text-center">
            <p className="text-red-300 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* 카드 선택 패널 */}
        {activeSlot && (
          <div className="mb-8 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
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
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-center gap-4 fixed bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={handleCalculate}
            disabled={
              loading ||
              !heroCards[0] ||
              !heroCards[1] ||
              !opponents.some((o) => o[0] && o[1])
            }
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
          <div className="space-y-6 mb-40">
            <h2 className="text-xl font-bold">에퀴티 분석</h2>
            <EquityChart streetEquities={result} />
          </div>
        )}
      </div>
    </div>
  );
}
