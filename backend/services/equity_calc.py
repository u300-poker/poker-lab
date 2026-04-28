"""
스트릿별 정확한 포커 에퀴티 계산 (treys 라이브러리 사용)
- 플랍/턴: 완전 열거 (정확)
- 프리플랍: 몬테카를로 샘플링 (빠르고 충분히 정확)
"""
import random
from itertools import combinations
from treys import Card, Evaluator, Deck


_SUIT_MAP = {
    '♠': 's', '♣': 'c', '♥': 'h', '♦': 'd',
    's': 's', 'c': 'c', 'h': 'h', 'd': 'd',
    'S': 's', 'C': 'c', 'H': 'h', 'D': 'd',
}

def _parse_card(card_str: str) -> int:
    """'9h', 'Ks', 'K♠', 'T♦' → treys int."""
    card_str = card_str.strip()
    if len(card_str) < 2:
        raise ValueError(f"Invalid card: {card_str}")
    rank = card_str[0].upper()
    suit_raw = card_str[1:]  # 수트 부분 (유니코드 포함 가능)
    suit = _SUIT_MAP.get(suit_raw) or _SUIT_MAP.get(suit_raw[0])
    if not suit:
        raise ValueError(f"Unknown suit: {suit_raw!r} in {card_str!r}")
    return Card.new(f"{rank}{suit}")


def _get_remaining_deck(used: list[int]) -> list[int]:
    used_set = set(used)
    return [c for c in Deck.GetFullDeck() if c not in used_set]


def _run_equity(player_cards: list[list[int]], board: list[int], remaining: list[int], samples: int) -> list[float]:
    evaluator = Evaluator()
    cards_needed = 5 - len(board)
    wins = [0.0] * len(player_cards)

    if cards_needed == 0:
        # 보드 완성 → 바로 계산
        scores = [evaluator.evaluate(board, hand) for hand in player_cards]
        min_score = min(scores)
        winners = [i for i, s in enumerate(scores) if s == min_score]
        share = 1.0 / len(winners)
        for w in winners:
            wins[w] += share
        return wins

    if cards_needed <= 2:
        combos = list(combinations(remaining, cards_needed))
    else:
        # 프리플랍: 몬테카를로
        combos = [tuple(random.sample(remaining, cards_needed)) for _ in range(samples)]

    for combo in combos:
        full_board = board + list(combo)
        scores = [evaluator.evaluate(full_board, hand) for hand in player_cards]
        min_score = min(scores)
        winners = [i for i, s in enumerate(scores) if s == min_score]
        share = 1.0 / len(winners)
        for w in winners:
            wins[w] += share

    total = len(combos)
    return [w / total for w in wins] if total > 0 else [1 / len(player_cards)] * len(player_cards)


def calculate_hero_equity_vs_random(
    hero_cards: list[str],
    board_cards: list[str],
    mc_samples: int = 2000,
) -> list[dict]:
    """
    히어로 카드 + 보드만 알 때, 상대방이 랜덤 핸드를 가진다고 가정하고
    각 스트릿별 히어로 에퀴티를 몬테카를로로 계산.
    """
    try:
        hero_int = [_parse_card(c) for c in hero_cards]
        board_int = [_parse_card(c) for c in board_cards]
    except Exception:
        return []

    evaluator = Evaluator()

    streets = [
        ("preflop", []),
        ("flop",    board_int[:3] if len(board_int) >= 3 else None),
        ("turn",    board_int[:4] if len(board_int) >= 4 else None),
        ("river",   board_int[:5] if len(board_int) >= 5 else None),
    ]

    results = []
    for street_name, street_board in streets:
        if street_board is None:
            continue

        used_base = hero_int + street_board
        remaining = _get_remaining_deck(used_base)
        cards_needed = 5 - len(street_board)

        wins = 0.0
        for _ in range(mc_samples):
            opp_hand = random.sample(remaining, 2)
            if cards_needed > 0:
                remaining2 = [c for c in remaining if c not in opp_hand]
                extra = random.sample(remaining2, cards_needed)
                full_board = street_board + extra
            else:
                full_board = street_board

            hero_score = evaluator.evaluate(full_board, hero_int)
            opp_score  = evaluator.evaluate(full_board, opp_hand)
            if hero_score < opp_score:
                wins += 1.0
            elif hero_score == opp_score:
                wins += 0.5

        hero_eq  = round(wins / mc_samples * 100, 1)
        villain_eq = round(100 - hero_eq, 1)

        results.append({
            "street": street_name,
            "board": board_cards[:len(street_board)],
            "equities": [
                {"position": "Hero",    "cards": hero_cards, "equity": hero_eq,    "is_hero": True},
                {"position": "상대(랜덤)", "cards": [],         "equity": villain_eq, "is_hero": False},
            ],
            "vs_random": True,
        })

    return results


def calculate_street_equities(
    players: list[dict],  # [{"position": "MP", "cards": ["9h", "9c"], "is_hero": True}, ...]
    board_cards: list[str],  # 최종 보드 5장
    mc_samples: int = 3000,
) -> list[dict]:
    """
    각 스트릿별 에퀴티를 계산해 반환.
    players 중 cards가 없는 플레이어는 제외.

    반환:
    [
      {"street": "preflop", "board": [], "equities": [{"position": "MP", "equity": 0.52, "is_hero": True}, ...]},
      {"street": "flop",    "board": ["Ks", "9h", "Kd"], ...},
      ...
    ]
    """
    valid_players = [p for p in players if p.get("cards") and len(p["cards"]) == 2]
    if len(valid_players) < 2:
        return []

    try:
        player_cards_int = [[_parse_card(c) for c in p["cards"]] for p in valid_players]
    except Exception:
        return []

    try:
        board_int = [_parse_card(c) for c in board_cards]
    except Exception:
        return []

    all_used = [c for hand in player_cards_int for c in hand] + board_int

    streets = [
        ("preflop", []),
        ("flop",    board_int[:3] if len(board_int) >= 3 else None),
        ("turn",    board_int[:4] if len(board_int) >= 4 else None),
        ("river",   board_int[:5] if len(board_int) >= 5 else None),
    ]

    results = []
    for street_name, street_board in streets:
        if street_board is None:
            continue

        used_in_this = [c for hand in player_cards_int for c in hand] + street_board
        remaining = _get_remaining_deck(used_in_this)

        equities = _run_equity(player_cards_int, street_board, remaining, mc_samples)

        results.append({
            "street": street_name,
            "board": board_cards[: len(street_board)],
            "equities": [
                {
                    "position": valid_players[i]["position"],
                    "cards": valid_players[i]["cards"],
                    "equity": round(equities[i] * 100, 1),
                    "is_hero": valid_players[i].get("is_hero", False),
                }
                for i in range(len(valid_players))
            ],
        })

    return results
