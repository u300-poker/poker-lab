from pydantic import BaseModel, Field
from typing import List, Optional

class Action(BaseModel):
    player: str
    action_type: str  # fold, call, raise, check, bet
    amount: Optional[float] = 0.0

class PlayerInfo(BaseModel):
    position: str
    stack: Optional[float] = None
    is_hero: bool = False

class Decision(BaseModel):
    """스트릿별 히어로 결정 분석"""
    street: str  # preflop, flop, turn, river
    hero_action: str
    amount: Optional[float] = None
    severity: str = "warning"
    headline: Optional[str] = None
    mistake_summary: Optional[str] = None
    why_bad: Optional[List[str]] = None
    what_to_do: Optional[str] = None
    key_concept: Optional[str] = None
    ev_comparison: Optional[dict] = None

class HandLog(BaseModel):
    hand_id: str
    timestamp: float
    blinds: str
    pot_size: float
    board_cards: List[str] = Field(default_factory=list)
    hero_cards: List[str] = Field(default_factory=list)
    players: List[PlayerInfo] = Field(default_factory=list)
    actions: List[Action] = Field(default_factory=list)
    winner: Optional[str] = None
    winning_pot: Optional[float] = None
    # legacy
    ai_feedback: Optional[str] = None
    # structured coaching fields (overall hand summary)
    severity: Optional[str] = None  # "critical" | "warning" | "good"
    headline: Optional[str] = None
    mistake_summary: Optional[str] = None
    why_bad: Optional[List[str]] = None
    what_to_do: Optional[str] = None
    key_concept: Optional[str] = None
    detail: Optional[str] = None
    ev_comparison: Optional[dict] = None
    # per-street decisions
    decisions: Optional[List[Decision]] = None
    # 스트릿별 에퀴티 (treys 계산)
    street_equities: Optional[List[dict]] = None
