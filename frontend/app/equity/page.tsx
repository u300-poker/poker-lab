'use client';
import React, { useState, useEffect } from 'react';

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
  const [opponents, setOpponents] = useState<Array<{
    cards: [string | null, string | null];
    equity?: number;
    expanded: boolean;
  }>>([]);
  const [activeSlot, setActiveSlot] = useState<{
    type: SlotType;
    index?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 자동 계산
  useEffect(() => {
    if (heroCards[0] && heroCards[1] && opponents.some(o => o.cards[0] && o.cards[1])) {
      calculateEquity();
    }
  }, [heroCards, boardCards, opponents.map(o => o.cards).flat()]);

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
      const oppIdx = Math.floor(activeSlot.index! / 2);
      const slotIdx = activeSlot.index! % 2;
      const newCards: [string | null, string | null] = [...newOpponents[oppIdx].cards] as any;
      newCards[slotIdx] = card;
      newOpponents[oppIdx].cards = newCards;
      setOpponents(newOpponents);
    }
    setActiveSlot(null);
  };

  const handleAddOpponent = () => {
    setOpponents([...opponents, { cards: [null, null], expanded: true }]);
  };

  const handleRemoveOpponent = (idx: number) => {
    setOpponents(opponents.filter((_, i) => i !== idx));
  };

  const handleToggleExpand = (idx: number) => {
    const newOpponents = [...opponents];
    newOpponents[idx].expanded = !newOpponents[idx].expanded;
    setOpponents(newOpponents);
  };

  const calculateEquity = async () => {
    const hero = heroCards.filter((c) => c !== null) as string[];
    const board = boardCards.filter((c) => c !== null) as string[];
    const opps = opponents
      .filter((o) => o.cards[0] && o.cards[1])
      .map((o) => o.cards as [string, string]);

    if (hero.length !== 2 || opps.length === 0) return;

    setLoading(true);
    try {
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
        setError(errorData.detail || '계산 실패');
        return;
      }

      const data: StreetEquity[] = await response.json();

      // 마지막 스트릿의 에퀀티 추출
      if (data.length > 0) {
        const lastStreet = data[data.length - 1];
        const newOpponents = opponents.map((opp, idx) => {
          const equityData = lastStreet.equities.find(
            (eq) => eq.position.includes('Opponent') && !eq.is_hero
          );
          return { ...opp, equity: equityData?.equity };
        });
        setOpponents(newOpponents);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '에러 발생');
    } finally {
      setLoading(false);
    }
  };

  const CardSlot = ({
    card,
    onClick,
    isActive,
  }: {
    card: string | null;
    onClick: () => void;
    isActive: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-16 h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-sm ${
        isActive
          ? 'border-blue-400 bg-blue-400/10'
          : 'border-zinc-600 bg-zinc-800/30 hover:border-zinc-500'
      }`}
    >
      {card ? (
        <>
          <div className="font-bold">{card[0]}</div>
          <div>{card[1]}</div>
        </>
      ) : (
        <div className="text-zinc-600">+</div>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* 헤더 */}
      <div className="border-b border-zinc-700 px-6 py-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-wide">Odds Calculator</h1>
        <button className="text-2xl">⋮</button>
      </div>

      {/* 메인 */}
      <div className="flex-1 overflow-y-auto">
        {/* 보드 */}
        <div className="px-6 py-6 border-b border-zinc-700">
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

        {/* 내 카드 */}
        <div className="px-6 py-6 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
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
            <div className="flex-1 text-right">
              <div className="text-4xl font-light tracking-wide text-blue-300">
                {loading ? '-' : '100.0'}%
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <button className="text-xl text-zinc-500 hover:text-white">✕</button>
              <button className="text-sm text-zinc-500 hover:text-white">▼</button>
            </div>
          </div>
        </div>

        {/* 상대들 */}
        <div className="px-6 py-6">
          {opponents.map((opp, idx) => (
            <div key={idx} className={`border-b border-zinc-700 pb-6 ${idx === opponents.length - 1 ? 'border-b-0' : ''}`}>
              {/* 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-2">
                  <CardSlot
                    card={opp.cards[0]}
                    onClick={() => setActiveSlot({ type: 'opponent', index: idx * 2 })}
                    isActive={activeSlot?.type === 'opponent' && activeSlot?.index === idx * 2}
                  />
                  <CardSlot
                    card={opp.cards[1]}
                    onClick={() => setActiveSlot({ type: 'opponent', index: idx * 2 + 1 })}
                    isActive={activeSlot?.type === 'opponent' && activeSlot?.index === idx * 2 + 1}
                  />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-3xl font-light tracking-wide text-blue-300">
                    {opp.equity !== undefined ? opp.equity.toFixed(1) : '-'}%
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleRemoveOpponent(idx)}
                    className="text-xl text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => handleToggleExpand(idx)}
                    className="text-sm text-zinc-500 hover:text-white"
                  >
                    {opp.expanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* 상세 정보 (expanded) */}
              {opp.expanded && (
                <div className="ml-2 text-xs text-zinc-500 space-y-1">
                  <p>Opponent {idx + 1}</p>
                  <p>{opp.cards[0]} {opp.cards[1]}</p>
                </div>
              )}
            </div>
          ))}

          {/* 빈 상태 */}
          {opponents.length === 0 && (
            <div className="text-center text-zinc-600 py-8">
              상대를 추가하세요
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="px-6 py-8 flex gap-4 justify-center">
          <button
            onClick={() => {
              setHeroCards([null, null]);
              setBoardCards([null, null, null, null, null]);
              setOpponents([]);
              setError('');
            }}
            className="px-6 py-2 rounded-full border border-zinc-600 hover:border-zinc-400 text-sm font-semibold transition-colors"
          >
            + Range
          </button>
          <button
            onClick={handleAddOpponent}
            className="px-6 py-2 rounded-full border border-zinc-600 hover:border-zinc-400 text-sm font-semibold transition-colors"
          >
            + Hand
          </button>
        </div>

        {/* 에러 */}
        {error && (
          <div className="mx-6 mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        {/* 광고 섹션 */}
        <div className="mt-12 px-6 py-6 border-t border-zinc-700">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-orange-500 rounded text-xs font-bold">Ad</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">포커 가이드</p>
              <p className="text-xs text-zinc-400">더 나은 의사결정</p>
            </div>
            <button className="px-4 py-1.5 border border-zinc-500 rounded-full text-xs">
              더보기
            </button>
          </div>
        </div>

        {/* 설정 버튼 */}
        <button className="fixed bottom-6 right-6 w-8 h-8 rounded-full border border-blue-400 flex items-center justify-center text-blue-400 text-sm">
          ⓘ
        </button>
      </div>

      {/* 카드 선택 패널 */}
      {activeSlot && (
        <div className="border-t border-zinc-700 bg-zinc-900/80 backdrop-blur px-6 py-4">
          <div className="grid grid-cols-7 gap-2">
            {RANKS.map((rank) =>
              SUITS.map((suit) => {
                const card = `${rank}${suit}`;
                return (
                  <button
                    key={card}
                    onClick={() => handleCardSelect(card)}
                    className="py-2 px-1 bg-zinc-800 hover:bg-blue-600 rounded-lg text-xs font-semibold transition-colors"
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
    </div>
  );
}
