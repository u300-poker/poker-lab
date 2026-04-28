'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EquityPlayer {
  position: string;
  cards: string[];
  equity: number;
  is_hero: boolean;
}

interface StreetEquity {
  street: string;
  board: string[];
  equities: EquityPlayer[];
  vs_random?: boolean;
}

interface EquityChartProps {
  streetEquities: StreetEquity[];
}

const STREET_LABEL: Record<string, string> = {
  preflop: '프리플랍',
  flop: '플랍',
  turn: '턴',
  river: '리버',
};

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-zinc-400 text-xs mb-2">{STREET_LABEL[label] ?? label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-zinc-300">{p.name}</span>
          <span className="font-bold text-white ml-auto pl-4">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function EquityChart({ streetEquities }: EquityChartProps) {
  if (!streetEquities || streetEquities.length === 0) return null;

  // 플레이어 목록 (첫 스트릿 기준)
  const allPlayers = streetEquities[0].equities;

  // recharts용 데이터 변환
  const chartData = streetEquities.map((se) => {
    const row: Record<string, any> = { street: se.street };
    se.equities.forEach((p) => {
      row[p.position] = p.equity;
    });
    return row;
  });

  const isVsRandom = streetEquities[0]?.vs_random === true;

  return (
    <div className="bg-zinc-900/60 rounded-2xl p-5 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">스트릿별 승률</p>
        {isVsRandom && (
          <span className="text-zinc-600 text-xs bg-zinc-800/60 border border-white/5 px-2 py-0.5 rounded-full">
            vs 랜덤 핸드 기준
          </span>
        )}
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
            <XAxis
              dataKey="street"
              tickFormatter={(v) => STREET_LABEL[v] ?? v}
              stroke="#3f3f46"
              tick={{ fill: '#71717a', fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke="#3f3f46"
              tick={{ fill: '#71717a', fontSize: 11 }}
              width={38}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="#27272a" strokeDasharray="3 3" />
            {allPlayers.map((p, i) => (
              <Line
                key={p.position}
                type="monotone"
                dataKey={p.position}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={p.is_hero ? 2.5 : 1.5}
                dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                strokeDasharray={p.is_hero ? undefined : '4 3'}
                name={p.is_hero ? `${p.position} (나)` : p.position}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 최종 에퀴티 뱃지 */}
      <div className="flex flex-wrap gap-2 mt-4">
        {streetEquities[streetEquities.length - 1].equities.map((p, i) => (
          <div key={p.position}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              p.is_hero ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' : 'border-white/5 bg-zinc-800/60 text-zinc-400'
            }`}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span>{p.is_hero ? '나' : p.position}</span>
            <span className="text-white font-bold">{p.equity}%</span>
            <span className="text-zinc-600">{p.cards?.join(' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
