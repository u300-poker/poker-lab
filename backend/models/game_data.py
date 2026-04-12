from pydantic import BaseModel, Field
from typing import List, Optional

class Action(BaseModel):
    player: str
    action_type: str  # fold, call, raise, check, bet
    amount: Optional[float] = 0.0

class PlayerInfo(BaseModel):
    position: str
    stack: float
    is_hero: bool = False

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
    ai_feedback: Optional[str] = None
    ev_comparison: Optional[dict] = None
