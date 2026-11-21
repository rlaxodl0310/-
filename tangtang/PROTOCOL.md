# JSON-lines 연결 규격 · 1

실행 예: `node bin/tangtang.cjs serve --config ./examples/projects.cjs`

호스트가 신뢰하는 설정 파일은 `{projects, provider?, store?, maxRepairs?}`를 내보낸다. projects는 `projectId → taskId → {instructions, schema, validate?, prepare?, local?, adapterVersion?}` 형태다. 설정 파일은 실행 가능한 호스트 코드이므로 요청 JSON에서 경로를 받아 동적으로 불러오지 않는다.

입력은 UTF-8 JSON 한 줄 한 건, 현재 CLI는 순차 처리한다. stdout에는 응답 JSON만 출력하며 각 줄을 대응시키는 requestId를 유지한다. 실제 앱의 상태 revision과 선택한 소스 검사 값은 context에 포함한다.

```json
{"method":"run","projectId":"sample-app","taskId":"next-task","requestId":"request-1","context":{"component":"설정 화면","revision":3},"input":"다음 작업","localOnly":true}
```

성공 응답은 `{requestId, ok:true, result}`다. result는 `proposal`, `prepared`, `source`, `exchange`, `signature`, `replayed`와 승인 시각을 포함한다. source는 `ai` 또는 `local`이며 모델 연결이 없는 시험을 실제 모델 응답으로 표시하지 않는다.

실패 응답은 `{requestId, ok:false, error:{code, message}}`다. 주요 code는 TASK_UNKNOWN, PROTOCOL_INVALID, PROVIDER_UNAVAILABLE, REVIEW_REJECTED, REQUEST_CONFLICT, PROJECT_BUSY, CONTEXT_LIMIT 등이다. 실패 응답은 외부 프로그램의 상태를 변경하는 명령이 아니다.

현재 방법은 run이다. 기억 읽기/쓰기와 취소 signal은 JS SDK에서 제공하며 CLI의 별도 네트워크 API/인증 서버는 제공하지 않는다. 단일 요청은1MiB 이하, 실제 모델 문맥은 코어의 더 작은 문자 한도도 적용한다. 바이너리/이미지/대형 프로젝트 전송은 호스트가 읽을 수 있는 텍스트나 별도 모델 어댑터로 준비한다.

다른 언어의 호스트는 자식 프로세스 stdin에 한 줄을 쓰고 stdout 한 줄을 읽으면 된다. C#/Python/C++ 코드를 코어에 내장하거나 게임 엔진을 바꿀 필요는 없다. 작업 규칙과 실제 결과 적용은 해당 호스트가 담당한다.
