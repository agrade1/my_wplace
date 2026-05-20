# prompt.md

이 문서는 여러 Codex 세션을 독립적으로 운영하기 위한 공통 프롬프트 인덱스다.
특정 제품, 도메인, 기술 스택에 의존하지 않는다.

## 사용 방법

새 Codex 세션을 열 때 아래 파일 중 하나를 선택해 전문을 붙여넣는다.

- 문서/설계 세션: `prompts/docs-planning-session.md`
- 기능 구현 세션: `prompts/feature-implementation-session.md`
- 버그 수정 세션: `prompts/bugfix-session.md`
- 테스트/품질 세션: `prompts/test-quality-session.md`
- 코드리뷰/푸시 세션: `prompts/code-review-push-session.md`

각 세션 프롬프트는 독립 실행을 전제로 작성되어 있다. 다른 프롬프트나 숨겨진 대화 맥락을 알고 있다고 가정하지 않는다.

## 도메인 문서 확장 방식

공통 문서는 그대로 두고 프로젝트별 정보는 별도 문서로 추가한다.

권장 파일:

- `project-context.md`: 프로젝트 개요, 목표, 사용자, 용어, 핵심 제약
- `docs/requirements.md`: 기능 요구사항과 비기능 요구사항
- `docs/architecture.md`: 구조, 데이터 흐름, 주요 의사결정
- `docs/testing.md`: 테스트 전략과 필수 검증 시나리오
- `docs/git-workflow.md`: 이슈, 브랜치, 커밋, PR 전략
- `docs/decisions/*.md`: 중요한 기술/제품 결정 기록

새 프로젝트에서는 `project-context.template.md`를 복사해 `project-context.md`를 만들고, 세션 프롬프트를 붙여넣을 때 해당 문서를 먼저 읽도록 지시한다.

## 공통 운영 원칙

- 각 세션은 부여받은 역할만 수행한다.
- 역할 밖 작업이 필요하면 직접 처리하지 말고 사용자에게 넘긴다.
- 같은 작업 트리에서 여러 세션이 동시에 파일을 수정하면 충돌 가능성이 있으므로, 가능하면 세션별 브랜치 또는 worktree를 사용한다.
- 세션 간 전달은 대화로 직접 연결하지 말고 커밋, PR, Markdown 작업 기록, 이슈, 테스트 결과 같은 명시적 산출물로 한다.
- 코드 변경 세션은 `agent.md`의 작업 순서와 보고 형식을 따른다.
- 프로젝트 도메인 내용은 공통 프롬프트에 직접 추가하지 않는다.
- 이슈, 브랜치, 커밋, PR은 `docs/git-workflow.md`의 규칙을 따른다.

## VS Code 내부 Codex 다중 세션 확인 결과

공식 문서 기준으로 확인한 내용은 다음과 같다.

- Codex IDE extension은 VS Code, Cursor 등 VS Code 계열 IDE 안에서 Codex가 열린 파일과 선택 영역 같은 IDE 컨텍스트를 활용해 작업할 수 있게 한다. 또한 IDE에서 cloud task를 만들고, 진행 중 작업을 추적하고, 완료된 작업을 검토할 수 있다. 근거: [OpenAI - Introducing upgrades to Codex](https://openai.com/index/introducing-upgrades-to-codex/)
- Codex에서는 여러 작업을 동시에 실행할 수 있고, 새 작업을 시작해도 기존 작업이 중단되지 않는다고 안내되어 있다. 근거: [OpenAI Academy - Working with Codex](https://openai.com/academy/working-with-codex/)
- Codex app은 여러 agent를 별도 thread로 실행하고, worktree를 사용해 같은 repo의 작업 충돌을 줄이는 구조를 제공한다고 설명한다. 근거: [OpenAI - Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- Codex web/cloud는 cloud 환경에서 background 작업과 parallel 작업을 지원한다. 근거: [OpenAI Developers - Codex web](https://developers.openai.com/codex/cloud)

결론:

- 여러 Codex 세션 또는 작업을 병렬로 여는 것은 가능하다.
- 다만 공식 문서에서 VS Code 내부의 여러 로컬 세션이 서로 직접 메시지를 주고받거나 자동으로 역할을 조율하는 기능은 확인되지 않았다.
- 실무적으로는 사용자가 coordinator 역할을 하고, 세션 간 상호작용은 브랜치, worktree, 커밋, PR, Markdown handoff 문서로 관리하는 방식이 안전하다.

## 권장 세션 분리

1. 문서/설계 세션
2. 기능 구현 세션
3. 버그 수정 세션
4. 테스트/품질 세션
5. 코드리뷰/푸시 세션

코드리뷰/푸시 세션은 코드 수정을 하지 않는다. 구현 또는 버그 수정이 필요하면 해당 세션에 넘긴다.

## 권장 handoff 형식

세션 간 전달이 필요할 때는 아래 형식으로 Markdown에 남긴다.

```md
## Handoff

담당 세션:
- 예: 버그 수정 세션

상황:
- 무엇을 하다가 넘기는지

근거:
- 파일/테스트/로그/PR 링크

요청:
- 다음 세션이 해야 할 일

주의:
- 건드리면 안 되는 파일 또는 리스크
```
