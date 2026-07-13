# 와일드콕 — 배포·운영 가이드

배드민턴 클럽 매치 관리 PWA. GitHub Pages 정적 배포, 서버·빌드 도구 없음.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 진입점 — 로드 순서·버전·PWA 등록 관리 |
| `support.js` | DC Runtime (JSX 즉석 변환·마운트) — 수정하지 않음 |
| `wildcock-core.js` | 순수 로직: 조편성·대진·슬롯 스케줄러·ELO (UI 비의존, 테스트 대상) |
| `app.jsx` | UI 전체: 탭·수동 편성·명부·기록실·GitHub 연동 |
| `manifest.json` | PWA 설치 정보 (홈 화면 추가) |
| `sw.js` | Service Worker — network-first 캐싱, 오프라인 지원 |
| `.github/workflows/history-index.yml` | history 폴더 변경 시 index.json 목차 자동 재생성 |
| `tests/core.test.js` | 코어 로직 테스트 28개 (배포와 무관) |
| `history/` | 매치 기록 json + index.json(자동 생성) |
| `uploads/` | favicon·로고 (192/512는 PWA 아이콘 겸용) |
| `roster.json` | 공유 클럽원 명부 (토큰 있는 폰에서 첫 저장 시 자동 생성) |

## 배포 방법

1. 위 파일들을 repo root에 배치 (`.github/workflows/` 경로 정확히)
2. **버전 올리기: `index.html` 안의 `?v=` 세 곳을 같은 값으로** (wildcock-core.js, sw.js, app.jsx)
   - sw.js가 자기 URL의 `?v=`를 읽어 캐시 버전·프리캐시를 스스로 갱신하므로 다른 파일은 손댈 필요 없음
3. 커밋 & 푸시 → GitHub Pages 반영 (수 분)

## 코드 수정 시

1. 알고리즘(`wildcock-core.js`)을 고쳤다면 배포 전 반드시:
   ```bash
   node tests/core.test.js   # 28개 전부 ✓ 확인
   ```
2. `index.html`의 `?v=`를 새 값(보통 날짜)으로 올려서 배포

## 관리자 토큰 (기록·명부 업로드용)

- GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate
- Repository access: 이 repo만 / Permissions: **Contents: Read and write**만 / 만료 1년
- 앱의 토큰 입력란에 등록. **만료되면 저장 실패가 시작되니 재발급 후 교체**

## 운영 시 알아둘 것

- **이름 = 신원**: 기록·명부·레이팅 모두 이름 문자열로 사람을 식별. 표기를 통일하고, 동명이인은 "김철수B"처럼 구분해 등록
- **명부 충돌**: 두 운영자가 거의 동시에 명부를 고치면 나중에 올린 쪽이 이김 (드문 일, 재저장으로 해결)
- **오프라인**: 두 번째 방문부터 오프라인 동작. 경기 진행·점수 입력은 오프라인 가능, GitHub 전송만 온라인 필요
- **추천 Lv**: 전체 기록 소급 ELO 기반 (성별 구성 보정 포함). 3경기 미만은 저장된 Lv 사용

## 추후 확장 여지 (현재는 의도적 보류)

- ELO·구성 보정치를 기록실에 표시 (계산은 이미 `eloData`에 있음)
- 기록 파일이 수십 개 이상 쌓이면 연 단위 통합 파일로 묶어 로딩 최적화
- 상성 통계 (파트너 케미·상대 전적)
