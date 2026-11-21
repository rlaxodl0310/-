# 탱탱 독립 코어 · 0.1.0

탱탱은 프로젝트의 문맥과 규칙을 정리하고 연결된 모델의 제안·검토·수정·승인 기록을 관리하는 공통 런타임이다. 게임의 지도·의뢰·전투·캐릭터는 이 패키지에 들어 있지 않다. 현재 자체 학습한 별도 언어 모델은 아니며, 문장/코드 의미의 생성·해석은 연결된 모델이 담당한다. 로컬 대안은 프로젝트가 명시적으로 제공한 함수만 사용한다.

새 게임, 웹앱, 도구마다 코어를 수정하는 대신 `projectId`, 문맥, 출력 schema, 검증 규칙과 준비 함수를 연결한다. 자유로운 코드 파일을 입력할 수도 있지만 실행 의미/업무 규칙을 자동으로 완전히 이해하거나 검증한 것으로 간주하지 않는다. 새로운 기능은 어댑터로 확장하고 모델 제안을 실제로 적용하는 권한은 호스트 프로그램이 갖는다.

## 실행과 설치

Node.js20 이상, 추가 런타임 의존성 없음. 저장소/소스 ZIP에서는 다음을 실행한다.

```sh
npm test
npm run demo
node bin/tangtang.cjs serve --config ./examples/projects.cjs
```

다른 Node 프로젝트에는 제공된 개발용 tarball을 설치한다. npm 공개 배포는 하지 않는다.

```sh
npm install /path/to/tangtang-core-0.1.0.tgz
```

브라우저는 `src/core.js`를 일반 script로 읽으면 `TangTangCore`를 제공한다. 검사 값은 Web Crypto를 사용하므로 HTTPS/localhost 등 보안 실행 환경이 필요하다. 브라우저에 Node 파일 저장소·파일 읽기·CLI 기능을 가져오지 않는다.

## 공통 흐름

`프로젝트 문맥 → 모델 제안 → schema/프로젝트 규칙 검토 → 준비 가능 여부 검토 → 수정 요청 → 승인 영수증`이다. 기본 수정 요청은1회, 설정 가능한 상한은3회다. 반려 이유와 이전 제안을 함께 모델에 돌려준다. 로컬 대안도 같은 검사를 통과해야 하며 `source: local`로 구분한다.

모델 호출 자체가 실패하면 `PROVIDER_FAILED`로 즉시 중단한다. 권한·연결·시간 초과 같은 실행 오류를 내용 반려로 취급하거나 모델에 수정 요청으로 보내지 않으며, 로컬 결과로 자동 대체하지 않는다. 승인 영수증을 저장하지 않아 같은 요청을 다시 시도할 수 있다. 취소는 기존 취소 오류를 유지한다. 모델이 데이터를 반환한 뒤 형식·프로젝트 규칙 검증에서 반려된 경우에만 내용 수정을 요청한다.

```js
const { TangTang, createBridgeProvider } = require('@tangtang/core');
const { FileStore } = require('@tangtang/core/node');

function coordinator(hostBridge) {
  return new TangTang({
    provider: createBridgeProvider(hostBridge),
    store: new FileStore('./tangtang-data'),
    maxRepairs: 1,
  });
}

async function suggest(core, context, requestId) {
  return core.run({
    projectId: 'my-new-project',
    taskId: 'next-task',
    adapterVersion: '1',
    requestId,
    instructions: '현재 프로젝트에 맞는 다음 작업을 제안한다.',
    context,
    input: '다음 작업을 정리해 줘.',
    schema: {
      type: 'object', additionalProperties: false, required: ['title'],
      properties: { title: { type: 'string', minLength: 1, maxLength: 80 } },
    },
    validate(proposal) {
      if (/배포 완료/.test(proposal.title)) throw Error('실행 결과를 미리 확정하지 않는다.');
    },
    prepare(proposal) { return { kind: 'task-proposal', ...proposal }; },
  });
}
```

`hostBridge`는 `check()`와 `generateStructured(messages, schema, {signal})`를 제공한다. 기존ChatGPT 연결을 주입할 수 있고, 다른 제공자는 `check`/`generate` 인터페이스로 연결할 수 있다. 로그인·API 키·요금제·모델 다운로드를 코어가 새로 만들지 않는다. 호스트의 인증과 연결을 재사용한다.

## 새 코드·다른 언어 연결

`readProjectContext(root, {files})`는 호스트가 선택한 상대 경로의 UTF-8 파일을 읽어 경로·원문·SHA256을 반환한다. JS/C#/Python/C++ 등 확장자에 묶이지 않는다. 경로 이탈과 외부 심볼릭 링크·바이너리·크기 초과를 거절한다. 전체 디렉터리를 자동 업로드하거나 코드를 실행하지 않는다. 큰 프로젝트는 필요한 파일/구간을 선택해 단계적으로 전달한다.

`examples/code-review.cjs`는 어떤 프로젝트의 선택 소스든 같은 코어로 검토하는 어댑터다. 모델이 제공되지 않은 파일/줄을 인용하면 반려하고 수정받는다. 실제 컴파일/실행/파일 쓰기를 한 것으로 표시하지 않는다. 해당 언어의 컴파일러·테스트 러너까지 확인하려면 호스트가 그 도구를 별도 어댑터로 연결해야 한다.

C#/C++/Python 등 다른 언어는 CLI를 자식 프로세스로 실행하고 표준입출력에 JSON 한 줄씩 주고받을 수 있다. `src/protocol.cjs`도 Node 호스트에서 직접 사용할 수 있다. 자세한 형식은 [PROTOCOL.md](PROTOCOL.md)를 따른다. 새 프로젝트/작업을 신뢰하는 설정에 등록하며 요청에서 실행 함수나 모듈 경로를 직접 지정하지 않는다.

## 기억과 프로젝트 분리

`projectId`별 승인 영수증·기억·잠금·재요청을 분리한다. 같은 요청 식별자와 같은 문맥은 기존 제안을 재사용하지만 검증/준비는 다시 수행한다. 입력·schema·규칙 버전이 달라지면 같은 요청 식별자를 거절한다. 어댑터 규칙을 바꿀 때는 `adapterVersion`도 올린다.

`remember`는 원문과 출처가 있는 `fact`, `claim`, `decision`을 구분한다. 모델 출처는 `claim`만 저장할 수 있으며 자동으로 사실/결정으로 승격하지 않는다. 동일 기억 식별자의 원문을 덮어쓰지 않는다. `recall`은 해당 프로젝트 안에서 검색어 관련도·최근 기록과 직렬화 크기 한도로 선별한다. 출처 분류의 권한은 호스트에게 있으며 이 API가 외부 사실의 진실을 독립적으로 증명하는 것은 아니다.

공통 코드 개선은 모든 프로젝트가 공유하지만 게임 세계관/개인 데이터는 자동 혼합하지 않는다. 공유 자료가 필요하면 호스트가 별도 공통 프로젝트를 명시적으로 읽게 구성한다. 이 네임스페이스 분리는 사용자 인증/다중 사용자 권한 시스템을 대신하지 않는다.

## 저장·취소·실행 책임

기본 `MemoryStore`는 프로세스 메모리 전용이다. Node의 `FileStore`는 프로젝트별 잠금·검사·임시 파일+동기화+교체를 쓴다. 손상 저장은 원본을 보존하고 실패한다. 다른 프로세스의 같은 프로젝트 작업과 살아 있는 잠금 소유자를 가로채지 않는다. 비정상 종료 후에는 호스트가 `recoverLock(projectId)`를 호출해 같은 머신에서 소유 프로세스가 종료됐음을 확인할 수 있다. 분산 DB가 필요하면 같은 Store 인터페이스의 별도 어댑터를 구현한다.

`AbortSignal`을 전달하면 대기 중인 응답을 취소하고 늦은 응답을 승인하지 않는다. 실제 모델 요청 중단은 제공자도 signal/cancel을 지원해야 한다. 승인 영수증을 원자 저장하기 시작한 이후의 취소는 이미 저장된 승인을 소급 취소하는 기능이 아니다.

검증과 `prepare`는 외부 효과 없는 준비/계산 함수로 작성한다. 코어 승인은 검증을 통과한 제안이라는 뜻이며 배포·파일 변경·결제·게임 보상 지급의 실행 권한이 아니다. 실제 적용과 중복 방지는 호스트의 상태 버전·트랜잭션에서 담당한다. 현재 게임도 기존 원자 저장/요청 이력을 마지막 적용 경계로 유지한다.

기본 schema 검증기는 명시적 type, object/array, required, additionalProperties, enum/const, 숫자·문자열·배열 한도, pattern, uniqueItems를 지원한다. `$ref`/조합 schema 등은 조용히 무시하지 않고 거절한다. 더 넓은 schema가 필요하면 `schemaValidator`에 검증기를 주입한다. 검증기는 오류를 throw하거나 false를 반환해 반려하며, 문맥/제안 크기를 조용히 잘라 규칙을 잃지 않는다.

## 현재 연결 범위

이 저장소의 판타지 게임 의뢰 생성·후속 호위는 이 코어의 소비자다. 게임에 복사한 코어는 `scripts/sync-tangtang.cjs`와 원본 일치 테스트로 관리하며 게임 빌드가 저장소 바깥 파일을 참조하지 않는다. 다른 기존 프로젝트를 자동으로 변경하거나 통합한 버전은 아니다.

0.1.0은 SDK/CLI 기반이다. 별도 GUI 앱, 자체 언어 모델 훈련, 임의 코드의 무검증 실행, 모든 언어 전용 SDK·컴파일러는 포함하지 않는다. 프로젝트 어댑터·제공자·저장소·통신 계층을 확장해 같은 코어를 재사용하도록 설계했다.
