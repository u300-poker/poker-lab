# AI 포커 세션 분석 도구 구현 계획 (Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 테이블 포커 세션 영상을 업로드하여 핸드별로 분할하고, OCR로 데이터를 추출하여 AI 코칭 피드백을 제공하는 웹 서비스 구축.

**Architecture:**
1. **Frontend:** Next.js (App Router) 기반의 영상 플레이어 및 코칭 UI.
2. **Backend:** FastAPI (Python) 기반의 비디오 처리(OpenCV) 및 AI 분석 엔진.
3. **Data Flow:** 영상 업로드 -> 핸드 분할 -> 프레임 OCR -> 게임 로그 생성 -> AI 분석 -> 결과 표출.

**Tech Stack:** Next.js, FastAPI, OpenCV, FFmpeg, Google Cloud Vision (OCR), Google Gemini 1.5 Pro, PostgreSQL.

---

## 1. 프로젝트 구조 및 파일 맵

### Backend (Python/FastAPI)
- `backend/main.py`: API 엔드포인트 및 서버 설정.
- `backend/services/video_processor.py`: OpenCV/FFmpeg 기반 영상 분할 로직.
- `backend/services/ocr_engine.py`: Google Vision API 연동 및 텍스트 추출.
- `backend/services/ai_coach.py`: Gemini API 연동 및 포커 상황 분석.
- `backend/models/game_data.py`: 정형화된 게임 로그 및 피드백 데이터 모델.

### Frontend (Next.js/React)
- `frontend/app/page.tsx`: 메인 업로드 및 대시보드 화면.
- `frontend/app/analysis/[id]/page.tsx`: 영상 플레이어 및 코칭 상세 화면.
- `frontend/components/VideoPlayer.tsx`: 타임라인 동기화 기능이 포함된 플레이어.
- `frontend/components/CoachSidebar.tsx`: AI 피드백 및 비교 차트 표시.

---

## Task 1: 백엔드 기초 설정 및 비디오 업로드 API

**Files:**
- Create: `backend/main.py`, `backend/requirements.txt`
- Test: `tests/test_main.py`

- [ ] **Step 1: 환경 설정 및 의존성 정의**
    - `requirements.txt`에 `fastapi`, `uvicorn`, `python-multipart` 등 추가.
- [ ] **Step 2: 기본 FastAPI 서버 및 업로드 엔드포인트 작성**
    - `/upload` POST 엔드포인트 구현 (영상 파일 수신 및 임시 저장).
- [ ] **Step 3: 업로드 테스트 코드 작성 및 실행**
    - `pytest`를 사용하여 파일 업로드 성공 여부 확인.
- [ ] **Step 4: Commit**

## Task 2: OpenCV 기반 핸드 분할 (Video Splitting)

**Files:**
- Create: `backend/services/video_processor.py`
- Test: `tests/test_video_processor.py`

- [ ] **Step 1: 프레임 분석 기초 로직 구현**
    - 특정 영역(예: 팟 금액 영역)의 픽셀 변화를 감지하여 '새로운 핸드 시작' 지점 찾기.
- [ ] **Step 2: FFmpeg을 이용한 영상 분할 기능 구현**
    - 감지된 타임스탬프를 기준으로 영상을 작은 클립으로 쪼개거나 타임라인 정보 생성.
- [ ] **Step 3: 테스트 영상으로 분할 정확도 검증**
- [ ] **Step 4: Commit**

## Task 3: OCR 엔진 구축 및 데이터 추출

**Files:**
- Create: `backend/services/ocr_engine.py`
- Modify: `backend/main.py` (분석 파이프라인 연결)
- Test: `tests/test_ocr_engine.py`

- [ ] **Step 1: Google Cloud Vision API 연동**
    - 이미지 프레임에서 텍스트(금액, 포지션) 추출 기능 구현.
- [ ] **Step 2: 카드 이미지 인식 로직 구현**
    - 템플릿 매칭이나 전용 모델을 사용하여 카드 무늬와 숫자 인식.
- [ ] **Step 3: 게임 로그(JSON) 생성기 구현**
    - 추출된 데이터를 시간 순으로 엮어 포커 액션 로그 생성.
- [ ] **Step 4: Commit**

## Task 4: AI 코칭 엔진 (Gemini API) 연동

**Files:**
- Create: `backend/services/ai_coach.py`
- Modify: `backend/models/game_data.py`

- [ ] **Step 1: 프롬프트 엔지니어링**
    - 포커 전문가 페르소나를 부여하고, GTO 관점에서 실수를 지적하는 프롬프트 작성.
- [ ] **Step 2: 선택지 비교 및 EV 차이 분석 로직**
    - 유저의 액션과 AI 추천 액션을 비교하여 피드백 생성.
- [ ] **Step 3: Gemini SDK 연동 및 결과 반환**
- [ ] **Step 4: Commit**

## Task 5: 프론트엔드 - 영상 플레이어 및 분석 UI

**Files:**
- Create: `frontend/components/VideoPlayer.tsx`, `frontend/app/analysis/[id]/page.tsx`

- [ ] **Step 1: 타임라인 동기화 플레이어 구현**
    - 영상 하단에 분석된 액션 시점을 마킹하고, 클릭 시 해당 시간으로 jump 기능.
- [ ] **Step 2: 코칭 사이드바 구현**
    - 현재 시점에 맞는 AI 피드백과 비교 차트 노출.
- [ ] **Step 3: 백엔드 API 연결 및 데이터 렌더링**
- [ ] **Step 4: Commit**

---
**자기 검토(Self-Review):**
- **Spec Coverage:** 영상 업로드부터 자동 분할, OCR 추출, AI 코칭까지 전 과정을 Task로 분해함.
- **TDD:** 각 단계마다 테스트 및 검증 단계를 포함하여 안정성 확보.
- **Granularity:** 각 Task가 독립적으로 동작하고 커밋될 수 있는 크기로 나눔.