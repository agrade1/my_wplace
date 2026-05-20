# Git Workflow

이 문서는 이슈, 브랜치, 커밋, PR 작성 규칙을 정의한다.

## 기본 원칙

- 모든 코드 변경은 이슈를 기준으로 추적한다.
- 브랜치는 하나의 이슈 또는 하나의 명확한 작업 단위만 다룬다.
- PR은 이슈의 완료 조건과 테스트 결과를 검증할 수 있어야 한다.
- 코드리뷰/푸시 세션은 코드를 수정하지 않고 리뷰, stage, commit, push만 담당한다.

## 이슈 전략

이슈는 GitHub Issue Form을 사용한다.

- 버그: `.github/ISSUE_TEMPLATE/bug_report.yml`
- 기능: `.github/ISSUE_TEMPLATE/feature_request.yml`
- 작업: `.github/ISSUE_TEMPLATE/task.yml`

이슈 작성 기준:

- 문제 또는 목표가 한 문장으로 요약되어야 한다.
- 포함 범위와 제외 범위가 분리되어야 한다.
- 완료 조건이 체크리스트로 있어야 한다.
- 테스트 또는 검증 방법이 있어야 한다.
- 자동화가 읽을 수 있도록 제목, 라벨, acceptance criteria를 비워두지 않는다.

## 브랜치 네이밍

형식:

```text
<scope>/<issue-number>-<work-summary>
```

규칙:

- `scope`는 작업 성격을 나타낸다.
- `issue-number`는 GitHub 이슈 번호를 사용한다.
- `work-summary`는 영어 소문자 kebab-case를 권장한다.
- 공백, 한글, 특수문자는 브랜치명에 사용하지 않는다.
- 하나의 브랜치는 하나의 이슈를 기준으로 한다.

권장 scope:

- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `test`: 테스트 추가/수정
- `refactor`: 동작 변경 없는 구조 개선
- `chore`: 설정, 의존성, 기타 유지보수
- `ci`: CI/CD 변경
- `perf`: 성능 개선

예시:

```text
feat/99-mypage-profile-api
fix/104-pixel-selection-drag
docs/12-project-context
test/31-map-zoom-threshold
chore/7-github-templates
```

## 커밋 메시지

형식:

```text
<type>: <short summary>

<optional body>
```

규칙:

- `type`은 브랜치 scope와 같은 목록을 사용한다.
- 제목은 변경 의도를 짧게 적는다.
- 제목 끝에 마침표를 붙이지 않는다.
- 상세 설명이 필요하면 한 줄을 비우고 본문에 적는다.
- 본문에는 왜 바꿨는지, 어떤 리스크가 있는지, 검증 방법을 적는다.

예시:

```text
feat: 읍면동 전체 필터 추가

지역 필터에서 전체 옵션을 선택할 수 있도록 기본 상태를 추가했다.
기존 단일 지역 선택 흐름은 유지한다.
```

```text
fix: 드래그 선택 해제 누락 수정

우클릭 드래그 중 이미 선택된 셀을 지나갈 때 선택 해제가 누락되는 문제를 수정했다.
회귀 테스트로 연속 포인터 이동 케이스를 추가했다.
```

## PR 전략

PR은 `.github/pull_request_template.md`를 사용한다.

PR 필수 항목:

- 연결 이슈
- 변경 요약
- 테스트/린트 실행 결과
- 리스크
- 롤백 방법
- 관련 없는 변경이 없다는 체크

PR 제목 권장 형식:

```text
<type>: <short summary>
```

예시:

```text
feat: 픽셀 레이어 줌 임계값 적용
```

## 자동화 확장 포인트

나중에 자동화를 붙일 때 사용할 수 있는 기준:

- 이슈 제목의 `[Bug]`, `[Feat]`, `[Task]` prefix
- 이슈 라벨: `bug`, `feature`, `task`, `needs-triage`
- 브랜치명: `<scope>/<issue-number>-<work-summary>`
- PR 본문의 `Closes #`
- PR 체크리스트의 검증 상태

가능한 자동화:

- 이슈 생성 시 라벨 자동 부여
- 이슈 번호 기반 브랜치 생성
- PR 생성 시 이슈 자동 연결
- PR 제목/브랜치명 규칙 검사
- PR 체크리스트 미완료 시 merge 차단
- 테스트/린트 CI 실패 시 merge 차단
