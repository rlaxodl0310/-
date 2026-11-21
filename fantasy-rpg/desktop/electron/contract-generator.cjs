'use strict';
const World=require('./world-context.cjs');
const A=require('../ui/adventure/engine.js'),D=require('../ui/association/dynamic-contracts.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const prompt='당신은 탱탱과 협력하는 의뢰 기획 담당 ChatGPT다. 탱탱이 제공한 현재 상태와 candidates에 맞춰 새 계약을 유형마다 하나씩 제안한다. schema의 모든 필드를 반환한다. 제목과 purpose는 한국어, 숫자/금액/보상/경험치/고유 캐릭터 이름/특수 장비/정수/불법 의뢰를 넣지 않는다. purpose는 접수된 의뢰인의 전언이지 확정 세계 사건이 아니다. 실제 목적지/종/수량/기한/요청 보수/직업/용건/호위 조건을 다양하게 바꾸고 최근 계약을 반복하지 않는다. destination은 해당 유형의 candidates.destinations에서 선택, count/deadlineMinutes/reward는 해당 범위의 정수. hunt의species는 도감id, ecology는 도감id 또는null, 나머지는null. escort만variant를 archive/field/urgent 중 골라 그 조건의deadline과 같게 하고 나머지variant는null. profile은 제공 행동 유형 중 선택한다. clientLabel은 고유 이름 대신 직업·상황을 나타내는 호칭을 자유롭게 만들고 subject도 이번 운반 용건을 자유롭게 작성하되 호칭은30자,용건은36자 이하로 한다. 제공 호칭/용건은 예시일 뿐 고정 목록이 아니다. 기존 캐릭터의 이름을 도용하지 않고 새 전투 능력/장비/신분을 지급하지 않는다. surveyMinutes는10~30 정수. 개인 호위는 학자 전용이 아니다. 탱탱의 검토 오류를 받으면 해당 이유를 해결한 전체 plans를 다시 제출한다. 등록/보상 지급은 탱탱이 검증한 뒤만 가능하다.';
async function generate(state,bridge,{requestId='board-generation',localOnly=false}={}){
 const s=A.ensure(state);if(!D.due(s))throw Error('새 게시판은 세계 시간6시간마다 갱신됩니다. 수락한 계약은 유지됩니다.');
 const exchange=[{actor:'탱탱',stage:'context',text:'지도·도감·기존 계약·현장 기록·예산과 가능한 수행 유형을 정리했다.'}];
 let source='local',answer,connected=false;
 if(!localOnly&&D.candidates(s).length){const check=await bridge.check();connected=check.ready===true;}
 if(connected){const frame=D.frame(s),messages=[{role:'system',content:World.context('quest',{locationId:s.location})+'\n'+prompt+'\n탱탱의 상태 보고: '+JSON.stringify(frame)},{role:'user',content:'현재 접수소에 새로 게시할 계약들을 제안해 줘.'}];let lastError;
 for(let attempt=0;attempt<=D.policy.maxRepairs;attempt++){
  let proposal;try{proposal=await bridge.generateStructured(messages,D.schema);exchange.push({actor:'ChatGPT',stage:attempt?'revision':'proposal',text:attempt?'검토 이유를 반영한 수정 계약을 제안했다.':'현재 상황에 따른 계약안을 제안했다.'});D.validateBatch(s,proposal);D.commit(s,proposal,{source:'ai',requestId,exchange});answer=proposal;source='ai';exchange.push({actor:'탱탱',stage:'approved',text:'목표·장소·보호 조건·중복·예산·실제 수행 연결 검증을 통과했다.'});break;}
  catch(e){if(e?.name==='AbortError'||/cancelled|취소/i.test(e?.message||''))throw e;lastError=e;exchange.push({actor:'탱탱',stage:'rejected',text:e.message});if(attempt===D.policy.maxRepairs)throw Error('탱탱의 계약 검증을 통과하지 못해 기존 게시판을 보존했습니다: '+e.message);if(proposal)messages.push({role:'assistant',content:JSON.stringify(proposal)});messages.push({role:'user',content:'탱탱 검토 결과: '+e.message+' 이전 제안의 문제를 해결하여 같은 candidates에 맞는 전체 plans를 다시 반환해 줘.'});}
 }
 if(!answer)throw lastError||Error('계약 제안이 없습니다.');
 }else{answer=D.local(s);exchange.push({actor:'탱탱',stage:'local-generation',text:localOnly?'명시적으로 선택한 로컬 생성 시험으로 새 조건을 구성했다.':'ChatGPT 미연결 상태여서 지역·상태 기반 로컬 생성으로 대체했다.'});D.validateBatch(s,answer);exchange.push({actor:'탱탱',stage:'approved',text:'가능한 목표와 예산·중복 검사를 통과했다. 생성형 AI 응답으로 표시하지 않는다.'});}
 return A.ensure(D.commit(s,answer,{source,requestId,exchange}));
}
async function followup(before,staged,bridge){
 const s=clone(staged),q=s.adventure.quests.at(-1),spec=D.candidates(A.ensure(before)).find(x=>x.type==='escort');if(!spec||q.type!=='escort'||!q.personal.repeatContact)throw Error('후속 호위 생성 근거가 없습니다.');
 const client=clone(q.personal.client),exchange=[{actor:'탱탱',stage:'context',text:'같은 의뢰인의 재회·완료 기록을 유지하며 다음 이동 계약을 검토한다.'}];let source='local',plan=D.local(A.ensure(before)).plans.find(x=>x.type==='escort');plan.clientLabel=client.name;
 if((await bridge.check()).ready){const messages=[{role:'system',content:World.context('quest',{locationId:s.location})+'\n'+prompt+' 이번에는 같은 인물의 후속 개인 호위 계약 한 개만 반환한다. plans 배열이 아닌 단일 계약 객체다. clientLabel은 기존 의뢰인의 호칭을 그대로 유지한다. '+JSON.stringify({client,frame:D.frame(A.ensure(before)),candidate:spec})},{role:'user',content:'지난 계약의 완료 기록을 유지하며 새로운 이동 목적과 조건을 제안해 줘.'}];
 for(let i=0;i<=D.policy.maxRepairs;i++){let proposal;try{proposal=await bridge.generateStructured(messages,D.schema.properties.plans.items);D.checkPlan(A.ensure(before),proposal,spec);if(proposal.clientLabel!==client.name)throw Error('같은 의뢰인의 호칭과 식별자를 유지해야 합니다.');plan=proposal;source='ai';exchange.push({actor:'ChatGPT',stage:'proposal',text:'동일 인물의 새 용건과 조건을 제안했다.'});break;}catch(e){if(e?.name==='AbortError'||/cancelled|취소/i.test(e?.message||''))throw e;exchange.push({actor:'탱탱',stage:'rejected',text:e.message});if(i===D.policy.maxRepairs)throw Error('후속 계약 검증에 실패해 재회 상태를 보존했습니다: '+e.message);if(proposal)messages.push({role:'assistant',content:JSON.stringify(proposal)});messages.push({role:'user',content:'탱탱 검토: '+e.message+' 단일 수정 계약을 다시 제출해 줘.'});}}
 }
 D.checkPlan(A.ensure(before),plan,spec);const Money=require('../ui/association/economy.js');Money.release(s.adventure.economy,q.id);q.reward=plan.reward;if(!Money.reserve(s.adventure.economy,q.id,'association',q))throw Error('후속 의뢰 예치 예산이 부족합니다.');D.configure(s,q,plan,{source,serial:s.adventure.generation?.serial||0});q.personal.client.id=client.id;q.personal.client.name=client.name;q.personal.exchange=exchange.concat({actor:'탱탱',stage:'approved',text:'기존 인물과 새 계약의 수행 조건·예치금을 확인했다.'});return A.ensure(s);
}
module.exports={generate,followup,prompt};
