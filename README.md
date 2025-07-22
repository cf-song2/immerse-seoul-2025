# Immerse Seoul 2025
- You only need Cloudflare resources to build an full-stack applications!

# System Architecture

┌─────────────────────────────────────────────────────────────────┐
│                         사용자 브라우저                             │
│                    React SPA (Pages/Worker)                     │
│                    [로그인/로그아웃 UI]                             │
└───────────────┬────────────────┬────────────┬───────────────────┘
                │ Auth Request   │ Generate   │ Gallery Request
                ▼                ▼            ▼
┌───────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers API                     │
│  /api/auth/register    /api/auth/login    /api/auth/logout    │
│  /api/auth/verify      /api/generate      /api/images         │
│  /api/image/:id        /api/user/images                       │
└──────┬──────────────┬──────────────────┬──────────────────────┘
       │              │                  │
       ▼              ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│ Workers AI   │ │   R2 Bucket  │ │    D1 Database       │
│              │ │              │ │                      │
│ Stable       │ │ Image Files  │ │ Tables:              │
│ Diffusion    │ │ (.png)       │ │ - users              │
│ XL           │ │              │ │ - sessions           │
│              │ │              │ │ - images             │
│              │ │              │ │ - user_images        │
└──────────────┘ └──────────────┘ └──────────────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ Workers KV   │
                                   │              │
                                   │ Session      │
                                   │ Storage      │
                                   └──────────────┘

# Project 구현 

1. 프로젝트 초기화
[ ] wrangler project 초기화
[ ] Git 리포 & 기본 디렉터리 구성
[ ] CF 리소스(D1/R2/KV/AI) 생성 및 wrangler.toml 바인딩

2. DB/스토리지 세팅
[ ] D1 스키마 확정 & 마이그레이션 적용
[ ] R2 버킷/폴더 구조 확정

3. 인증 기능 완성
[ ] 회원가입/로그인/로그아웃/검증 API 완료
[ ] 세션 쿠키/KV 연동 테스트

4. 이미지 생성 파이프라인 구축
[ ] Workers AI 호출 성공
[ ] 결과물 R2 업로드 & D1 기록
[ ] 기본 에러 핸들링

5. 갤러리/조회 API 완성
[ ] 리스트/단건/사용자별 조회 API
[ ] 권한 체크 로직 확정

6. 프런트엔드 MVP
[ ] 로그인/회원가입 UI
[ ] 이미지 생성 페이지
[ ] 갤러리 페이지

7. 배포/테스트
[ ] Workers/Pages 프로덕션 배포
[ ] e2e 테스트 / 기본 로드 테스트

8. 폴리싱 & 확장
[ ] 썸네일/리사이즈
[ ] Rate limit / Turnstile
[ ] UX 개선 및 성능 튜닝
