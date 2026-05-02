'use client'

import { SavedHand, SavedDecision } from '../lib/storage'

function formatCard(card: string): string {
  if (!card || card.length < 2) return card || ''
  const rank = card.slice(0, -1).toUpperCase()
  const suit = card.slice(-1).toLowerCase()
  const suits: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }
  return rank + (suits[suit] ?? suit)
}

function formatCards(cards: string[]): string {
  return cards.map(formatCard).join(' ')
}

function heroActionText(decision: SavedDecision): string {
  const action = decision.hero_action || ''
  const amt = decision.amount
  const amtStr = amt && amt > 0 ? ` $${Number(amt).toFixed(2)}` : ''

  const lower = action.toLowerCase().replace(/[-\s]/g, '')
  if (lower === 'fold' || lower === 'folded') return 'folds'
  if (lower === 'call' || lower === 'called') return `calls${amtStr}`
  if (lower === 'raise' || lower === 'raised') return `raises to${amtStr}`
  if (lower === 'bet' || lower === 'bets') return `bets${amtStr}`
  if (lower === 'check' || lower === 'checked') return 'checks'
  if (lower.includes('allin') || lower.includes('allIn')) return `goes all-in${amtStr}`
  return action + amtStr
}

const POSITION_ORDER = ['UTG', 'UTG+1', 'MP', 'MP+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']

interface Props {
  hand: SavedHand
}

export default function HandHistoryText({ hand }: Props) {
  const { blinds, hero_cards, board_cards, players, decisions, winner, winning_pot, pot_size } = hand

  const parts = (blinds || '').split('/')
  const sbStr = parts[0]?.replace(/[^0-9.]/g, '') || '?'
  const bbStr = parts[1]?.replace(/[^0-9.]/g, '') || '?'

  const heroPlayer = players?.find(p => p.is_hero)
  const heroPos = heroPlayer?.position || 'Hero'

  const sorted = players
    ? [...players].sort((a, b) => {
        const ai = POSITION_ORDER.findIndex(p => p === a.position.toUpperCase())
        const bi = POSITION_ORDER.findIndex(p => p === b.position.toUpperCase())
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
      })
    : []

  const flop = board_cards.slice(0, 3)
  const turn = board_cards.slice(3, 4)
  const river = board_cards.slice(4, 5)

  const byStreet: Record<string, SavedDecision> = {}
  for (const d of decisions || []) byStreet[d.street] = d

  const hasAnyStreetData = Object.keys(byStreet).length > 0

  return (
    <div className="font-mono text-[11px] leading-[1.7] text-zinc-400 select-text">

      {/* Header */}
      <span className="text-zinc-200 font-semibold">
        ${sbStr}/${bbStr} No-Limit Hold'em
      </span>
      {players?.length ? <span> · {players.length} Players</span> : null}

      {/* Players */}
      {sorted.length > 0 && (
        <div className="mt-2.5 space-y-0.5">
          {sorted.map(p => (
            <div key={p.position} className={p.is_hero ? 'text-indigo-300' : ''}>
              <span>{p.is_hero ? '→ ' : '  '}</span>
              <span className="font-semibold">{p.is_hero ? `Hero (${p.position})` : p.position}</span>
              {p.stack != null && (
                <span className="text-zinc-500"> (${p.stack.toFixed(2)})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pre Flop */}
      <div className="mt-3">
        <span className="text-zinc-200 font-semibold">Pre Flop: </span>
        <span>Hero is {heroPos} with </span>
        <span className="text-white font-bold">{formatCards(hero_cards)}</span>
      </div>
      {byStreet.preflop && (
        <div className="pl-2">Hero {heroActionText(byStreet.preflop)}</div>
      )}

      {/* Flop */}
      {flop.length === 3 && (
        <div className="mt-2">
          <span className="text-zinc-200 font-semibold">Flop: </span>
          <span className="text-white">{formatCards(flop)}</span>
          {byStreet.flop && (
            <div className="pl-2">Hero {heroActionText(byStreet.flop)}</div>
          )}
        </div>
      )}

      {/* Turn */}
      {turn.length === 1 && (
        <div className="mt-2">
          <span className="text-zinc-200 font-semibold">Turn: </span>
          <span className="text-white">{formatCard(turn[0])}</span>
          {byStreet.turn && (
            <div className="pl-2">Hero {heroActionText(byStreet.turn)}</div>
          )}
        </div>
      )}

      {/* River */}
      {river.length === 1 && (
        <div className="mt-2">
          <span className="text-zinc-200 font-semibold">River: </span>
          <span className="text-white">{formatCard(river[0])}</span>
          {byStreet.river && (
            <div className="pl-2">Hero {heroActionText(byStreet.river)}</div>
          )}
        </div>
      )}

      {/* Placeholder when no data yet */}
      {!hasAnyStreetData && hero_cards.length === 0 && (
        <div className="mt-2 text-zinc-600 italic">핸드 데이터 없음</div>
      )}

      {/* Result */}
      {(winner || winning_pot || pot_size) && (
        <div className="mt-3">
          <span className="text-zinc-200 font-semibold">Result: </span>
          {(winning_pot ?? pot_size) ? (
            <span>Total Pot ${(winning_pot ?? pot_size ?? 0).toFixed(2)} · </span>
          ) : null}
          {winner && <span className="text-emerald-400 font-semibold">{winner} wins</span>}
        </div>
      )}
    </div>
  )
}
