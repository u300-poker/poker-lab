# [설계서] AI 포커 세션 분석 도구 (MVP+)

- **작성일:** 2026-04-12
- **상태:** 초안 (Draft)
- **주제:** 전체 세션 영상 분석을 통한 포커 사후 복기 및 코칭 시스템

## 1. 개요 (Overview)
본 시스템은 유저가 플레이한 포커 세션 전체 녹화본을 업로드하면, AI가 자동으로 각 판(Hand)을 분리하고 분석하여 유저의 실수를 찾아내고 최적의 전략(GTO)과 비교해주는 웹 서비스입니다. 텍스트나 스크린샷 기반의 기존 도구들과 달리, 영상의 흐름을 파악하여 입체적인 코칭을 제공하는 것을 목표로 합니다.

## 2. 핵심 아키텍처 (Architecture)

### 2.1 데이터 파이프라인 (Video Analysis Pipeline)
1.  **Video Ingest:** 유저가 단일 테이블 녹화 영상(MP4/AVI 등) 업로드.
2.  **Scene Detection & Hand Splitting:** 프레임 분석을 통해 팟(Pot)이 형성되고 사라지는 지점, 카드가 배분되는 지점을 감지하여 전체 영상을 '핸드(Hand)' 단위로 분할.
3.  **Frame OCR & Vision Processing:**
    - 각 핸드의 중요 프레임(베팅 시점, 스트릿 전환 시점)에서 텍스트 및 이미지 데이터 추출.
    - 추출 데이터: 포지션, 칩 스택, 블라인드 규모, 커뮤니티 카드, 유저 카드, 상대방의 베팅 사이즈 및 액션.
4.  **Game Logic Parsing:** 추출된 파편화된 데이터를 시간 순서대로 정렬하여 하나의 완전한 게임 로그(JSON) 생성.
5.  **AI Analysis (GTO Solver / LLM):**
    - 생성된 로그를 분석 엔진에 입력.
    - 유저의 실제 선택(Action)과 이론적 최적 선택(Optimal)의 기대 수익(EV) 차이 계산.
    - 실수(Blunder, Mistake, Inaccuracy) 등급 분류 및 텍스트 피드백 생성.

### 2.2 기술 스택 (Proposed)
-   **Frontend:** React.js / Next.js (대시보드 및 비디오 플레이어 통합 UI)
-   **Backend:** Python (FastAPI/Django) - 비디오 처리 및 AI 로직 연동에 유리
-   **Video Processing:** OpenCV, FFmpeg
-   **OCR/Vision:** Google Cloud Vision API 또는 맞춤형 YOLO/OpenCV 모델
-   **Analysis AI:** Google Gemini 1.5 Pro (상황 설명) + 전용 포커 엔진/솔버 연동
-   **Database:** PostgreSQL (유저 데이터 및 세션 리포트 저장)

## 3. 주요 기능 및 UI/UX (Key Features)

### 3.1 세션 종합 대시보드 (Session Dashboard)
-   **종합 리포트:** 총 플레이 시간, 핸드 수, 수익(bb), VPIP/PFR 등 주요 통계.
-   **실수 하이라이트:** AI가 찾아낸 가장 치명적인 실수(Blunders) TOP 5를 썸네일과 함께 상단 노출.

### 3.2 영상 통합 분석 뷰 (Video-Integrated View)
-   **동기화된 비디오 플레이어:** 영상 하단 타임라인에 액션 지점이 표시되며, 클릭 시 해당 장면으로 즉시 이동.
-   **비교 차트 (Comparison Chart):** 
    - 특정 시점에서 유저가 한 액션과 AI 추천 액션을 나란히 배치.
    - 각 액션의 기대 수익(EV)을 막대그래프로 시각화하여 실수의 크기를 직관적으로 인지.
-   **AI 코칭 사이드바:** "여기서의 체크-레이즈는 상대의 레인지에 비해 너무 과감했습니다. 최적의 선택은 체크-콜입니다."와 같은 사람 형태의 피드백 제공.

## 4. 데이터 스키마 (Data Schema - 핵심 요소)
-   **Sessions:** 유저ID, 영상 경로, 업로드 일시, 요약 통계.
-   **Hands:** 세션ID, 시작/종료 시간(영상 내), 핸드 고유번호, 최종 결과.
-   **Actions:** 핸드ID, 스트릿(Pre, Flop, Turn, River), 액션 주체, 액션 종류, 금액, **AI 추천 액션**, **EV 차이**.
-   **Feedbacks:** 액션ID 또는 핸드ID 연동, AI 생성 코칭 텍스트.

## 5. 단계별 로드맵 (Roadmap)
1.  **Phase 1 (MVP):** 단일 테이블 영상 업로드 -> 수동 핸드 선택 -> AI 분석 및 텍스트 피드백 제공.
2.  **Phase 2 (Automation):** 영상 자동 분할(Splitting) 및 OCR 정확도 고도화, 비교 차트 UI 도입.
3.  **Phase 3 (Education):** 분석된 실수 데이터를 기반으로 한 '복습 퀴즈' 생성 및 취약점 분석 리포트.

---
**자기 검토(Self-Review):**
- **모호성 제거:** '실수 구분'을 영상 타임라인 동기화와 EV 비교 차트로 구체화함.
- **범위 설정:** 초기에는 단일 테이블 집중으로 한정하여 구현 가능성 높임.
- **데이터 활용:** 익명화된 이미지 보관 정책을 통해 OCR 모델 개선 기반 마련.