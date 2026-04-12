"""
AI 코칭 품질 테스트 하네스

실행 방법:
    cd /Users/jihun/workspace/PokerLab
    python tests/test_ai_coach_quality.py

각 mock 시나리오를 Gemini API에 실행하고,
피드백과 EV 비교 결과를 터미널에 출력한다.
"""
import json
import sys
import glob
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models.game_data import HandLog
from backend.services.ai_coach import analyze_hand

# 시나리오별 심어둔 실수 메타데이터
SCENARIOS = {
    "mock_01": {"title": "프리플랍 3벳 콜", "planted_mistake": "AKo BTN에서 BB 3벳에 콜 → 폴드 or 4벳이 정답"},
    "mock_02": {"title": "프리플랍 스퀴즈 콜", "planted_mistake": "KQs BTN에서 UTG+BB 스퀴즈에 콜 → 폴드가 정답"},
    "mock_03": {"title": "플랍 c-bet 후 체크레이즈 콜", "planted_mistake": "드로우 보드에서 중간 페어로 체크레이즈 콜 → 폴드가 정답"},
    "mock_04": {"title": "플랍 OOP 탑페어 체크폴드", "planted_mistake": "탑페어 굿킥 OOP에서 체크 후 IP c-bet에 폴드 → 체크콜이 정답"},
    "mock_05": {"title": "턴 더블배럴 폴드", "planted_mistake": "플러시 드로우+오버카드로 더블배럴에 폴드 → 히어로콜이 정답"},
    "mock_06": {"title": "턴 밸류 체크", "planted_mistake": "풀하우스(트리플+탑킥)로 IP 체크 → 벳이 정답"},
    "mock_07": {"title": "리버 넛 과소벳", "planted_mistake": "넛 핸드(트리플 에이스)로 팟 25% 과소벳 → 팟 사이즈 or 오버벳이 정답"},
    "mock_08": {"title": "리버 블러프 미실행", "planted_mistake": "에어로 분극화된 보드에서 체크 → 블러프가 정답"},
}

def run_harness():
    mock_files = sorted(glob.glob("tests/mock_hands/*.json"))
    if not mock_files:
        print("ERROR: tests/mock_hands/ 에 JSON 파일이 없습니다.")
        sys.exit(1)

    results = {"success": 0, "fail": 0, "error": 0}

    for filepath in mock_files:
        with open(filepath) as f:
            data = json.load(f)

        hand = HandLog(**data)
        meta = SCENARIOS.get(hand.hand_id, {"title": hand.hand_id, "planted_mistake": "N/A"})

        print(f"\n{'='*60}")
        print(f"[{hand.hand_id}] {meta['title']}")
        print(f"심어둔 실수: {meta['planted_mistake']}")
        print(f"{'='*60}")

        result = analyze_hand(hand)

        if "Error" in result.get("ai_feedback", "") or "missing" in result.get("ai_feedback", ""):
            print(f"[ERROR] API 오류: {result['ai_feedback']}")
            results["error"] += 1
            continue

        print(f"\n[AI 피드백]\n{result['ai_feedback']}")

        ev = result.get("ev_comparison", {})
        user_action = ev.get("user_action", {})
        rec_action = ev.get("recommended_action", {})
        ev_diff = ev.get("ev_diff", 0)

        print(f"\n[EV 비교]")
        print(f"  유저 액션 ({user_action.get('action', 'N/A')}): {user_action.get('ev', 0):+.2f} BB")
        print(f"  추천 액션 ({rec_action.get('action', 'N/A')}): {rec_action.get('ev', 0):+.2f} BB")
        print(f"  EV 손실: -{abs(ev_diff):.2f} BB")

        # 실수 감지 판정: 피드백에 실수 관련 키워드 존재 여부
        feedback_lower = result.get("ai_feedback", "").lower()
        detected = any(kw in feedback_lower for kw in [
            "실수", "잘못", "폴드", "4벳", "콜해야", "벳해야", "블러프", "과소", "손실", "비추천"
        ])

        if detected and ev_diff > 0:
            print(f"\n[판정] ✅ 실수 감지 성공")
            results["success"] += 1
        else:
            print(f"\n[판정] ❌ 실수 감지 실패 (피드백에 실수 지적 없음 또는 EV 차이 0)")
            results["fail"] += 1

    print(f"\n{'='*60}")
    print(f"최종 결과: {results['success']}/8 성공 ({results['success']/8*100:.0f}%)")
    print(f"  ✅ 성공: {results['success']}, ❌ 실패: {results['fail']}, ⚠️  오류: {results['error']}")
    print(f"목표: 6/8 이상 (75%)")
    if results["success"] >= 6:
        print("🎉 목표 달성!")
    else:
        print("⚠️  프롬프트 개선 필요")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    run_harness()
