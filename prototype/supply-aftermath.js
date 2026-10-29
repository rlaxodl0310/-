import {contact,displayName} from './identity.js';
import {npcNow,noteNpcExperience} from './npc-state.js';
import {schoolLocation,preparationLocation,timetable} from './timetable.js';
function aftermathRelation(s,from,to,delta){const key=from+'>'+to,r={familiarity:0,affection:0,trust:0,tension:0,...s.relations[key]};for(const [k,v] of Object.entries(delta))r[k]=Math.max(0,Math.min(100,r[k]+v));s.relations[key]=r;}
function witnessedSupply(s,id){return s.supplyStory?.witnesses?.[id]??[];}
function aftermathOtherCommitment(s,id,minute,except=null){
 const at={...s,clock:{minute}};if(schoolLocation(at,id)||preparationLocation(at,id))return true;
 return (s.appointments??[]).some(a=>a.id!==except&&a.person===id&&a.day===s.day&&a.status==='pending'&&Math.abs((a.minute??900)-minute)<=30);
}
export function prepareSupplyAftermath(s){
 const g=s.supplyStory;if((s.world?.stage??'campus')!=='campus'||s.day!==2||g?.status!=='resolved'||s.supplyAftermath)return;
 const f=s.supplyAftermath={day:2,reactions:{},peer:null,records:{},completed:{},active:null,settled:false};
 const ids=g.actualParticipants??[],pairs=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j];if(!(g.attendanceSlots?.[a]??[]).some(t=>g.attendanceSlots[b]?.includes(t)))continue;
  const tension=Math.max(s.relations[a+'>'+b]?.tension??0,s.relations[b+'>'+a]?.tension??0),trust=Math.min(s.relations[a+'>'+b]?.trust??0,s.relations[b+'>'+a]?.trust??0);
  if(tension>=4||trust>=3)pairs.push({people:[a,b],mode:tension>=4?'distance':'together',weight:tension>=4?100+tension:trust,start:790,end:840,effected:false});
 }
 f.peer=s.clock.minute>=840?null:pairs.sort((a,b)=>b.weight-a.weight)[0]??null;if(f.peer)f.peer.start=Math.max(f.peer.start,s.clock.minute);
 let offered=false;
 for(const id of Object.keys(s.npcs)){
  const own=witnessedSupply(s,id);if(!own.length)continue;
  const r=s.relations[id+'>taei']??{},overloaded=own.some(w=>['carry','selfFinish'].includes(w.choice));
  const mode=(r.tension??0)>=2?'repair':overloaded?'rest':'work';
  f.reactions[id]={mode,source:own.map(w=>w.choice),greeting:(r.tension??0)>=4?'distant':overloaded?'concerned':'warm'};
  if(s.clock.minute>825||offered||!contact(s,id).introduced||(r.trust??0)<1||(r.tension??0)>=4||aftermathOtherCommitment(s,id,810))continue;
  const location=mode==='rest'?'cafe':mode==='repair'?'hall':'library';
  const opening=overloaded?'어제 상자 옮기면서 많이 움직였잖아요.':own.some(w=>w.choice==='roles')?'어제 가능한 시간부터 물어봐 줬잖아요.':'어제 같이 물품 확인했잖아요.';
  const text=opening+' '+(mode==='rest'?'오늘 13:30쯤 카페에서 20분만 쉬었다 갈래요? 또 일을 부탁하려는 건 아니에요.':mode==='repair'?'오늘 13:30쯤 자유관에서 20분 정도, 다음에 일 나눌 방법만 맞춰볼래요?':'오늘 13:30쯤 도서관에서 20분만 정리 메모를 같이 볼래요? 어려우면 괜찮아요.');
  const idKey='supply-followup:'+id+':2';
  s.appointments.push({id:idKey,kind:'supply-followup',proposer:'npc',person:id,day:2,phase:'afternoon',minute:810,location,label:mode==='rest'?'잠깐 함께 쉬기':mode==='repair'?'다음 협력 방식 맞추기':'함께 정리 메모 확인',status:'offered',text});
  s.messages.push({day:2,from:s.npcs[id].name,text,read:false});f.reactions[id].offer=idKey;offered=true;
 }
}
function aftermathOffer(s,id){return (s.appointments??[]).find(a=>a.kind==='supply-followup'&&a.person===id&&a.day===s.day&&a.status==='pending');}
export function aftermathPosition(s,id){
 const f=s.supplyAftermath;if(!f||(s.world?.stage??'campus')!=='campus')return null;
 const active=f.records[f.active];if(active?.person===id&&active.day===s.day&&active.status==='active'&&s.clock.minute<=(active.reservedUntil??active.startedAt+20)&&!aftermathOtherCommitment(s,id,s.clock.minute,active.offer))return active.location;
 if(s.day!==2)return null;
 const offer=aftermathOffer(s,id);if(offer&&s.clock.minute>=offer.minute-15&&s.clock.minute<=offer.minute+40&&!aftermathOtherCommitment(s,id,s.clock.minute,offer.id))return offer.location;
 const pair=f.peer;if(!pair?.people.includes(id)||s.clock.minute<pair.start||s.clock.minute>=pair.end||aftermathOtherCommitment(s,id,s.clock.minute))return null;
 return pair.mode==='together'?'library':pair.people[0]===id?'hall':'library';
}
function aftermathPeerFree(s,id,minute){const r=s.supplyAftermath?.records[id];return !aftermathOtherCommitment(s,id,minute)&&!(r?.day===s.day&&(r.segments??[]).some(x=>x.start<=minute&&minute<x.end));}
export function aftermathObservation(s,location){
 const pair=s.supplyAftermath?.peer;if(s.day!==2||pair?.mode!=='together'||!pair.people.every(id=>aftermathPeerFree(s,id,s.clock.minute)&&aftermathPosition(s,id)===location))return '';
 return pair.people.map(id=>displayName(s,id)).join('과 ')+'이 같은 자료를 사이에 놓고 작은 목소리로 의견을 나눈다. 한 사람이 짚은 곳을 다른 사람이 자기 메모에 적는다.';
}
export function aftermathGreeting(s,id){
 const reaction=s.supplyAftermath?.reactions[id];if(s.day<2||!reaction||!contact(s,id).introduced)return '';
 const now=npcNow(s,id);if(now.rushed)return ' 서로 얼굴을 알아보고 짧게 인사하지만 상대는 수업 시간을 다시 확인한다.';
 const text=reaction.greeting==='distant'?' 태이를 알아보고 눈인사만 한 뒤 자기 쪽 자료를 정리한다.':reaction.greeting==='concerned'?' 먼저 태이를 알아보고 가볍게 인사한다. “어제 많이 움직였는데 오늘은 좀 어때요?”':' 먼저 태이를 알아보고 손을 작게 든다. “어제 같이 하던 건 좀 쉬고 나서 생각나더라고요.”';return s.day>2?text.replaceAll('어제','지난번'):text;
}
export function advanceSupplyAftermath(s,before,end){
 if(s.day!==2||!s.supplyAftermath)return;
 const f=s.supplyAftermath,pair=f.peer;
 if(pair&&!pair.effected&&end>=pair.end){
  let together=0;for(let t=pair.start;t<pair.end;t+=10)if(pair.mode==='together'&&pair.people.every(id=>aftermathPeerFree(s,id,t)&&aftermathPosition({...s,clock:{minute:t}},id)==='library'))together+=10;
  if(together>=20){aftermathRelation(s,pair.people[0],pair.people[1],{familiarity:1,trust:1});aftermathRelation(s,pair.people[1],pair.people[0],{familiarity:1,trust:1});}pair.effected=true;pair.sharedMinutes=together;
 }
 for(const a of s.appointments??[]){
  if(a.kind!=='supply-followup'||a.day!==2)continue;
  if(a.status==='offered'&&end>a.minute+15)a.status='expired';
  if(a.status==='pending'&&end>a.minute+40){a.status='broken';aftermathRelation(s,a.person,'taei',{trust:-1,tension:1});s.memory.push('[2일차] '+displayName(s,a.person)+'과 짧게 만나기로 한 약속을 지키지 못했다.');const record=f.records[a.person];if(record&&record.status!=='completed')record.status='missed';if(f.active===a.person)f.active=null;}
 }
}
export function canDiscussSupplyAftermath(s,id){return (s.world?.stage??'campus')==='campus'&&s.day>=2&&!!s.supplyAftermath?.reactions[id]&&contact(s,id).introduced&&!s.supplyAftermath.completed[id];}
export function activeSupplyAftermath(s){const f=s.supplyAftermath;return f?.records[f.active]??null;}
export function pauseSupplyAftermath(s){const r=activeSupplyAftermath(s);if(r?.status==='active')r.status='paused';if(s.supplyAftermath)s.supplyAftermath.active=null;}
export function beginSupplyAftermath(state,id){
 if(!canDiscussSupplyAftermath(state,id)||state.npcs[id]?.location!==state.location)throw new Error('실제로 마주친 동료와 이야기할 수 있습니다.');
 const s=structuredClone(state),f=s.supplyAftermath,offer=aftermathOffer(s,id),now=npcNow(s,id);let old=f.records[id];if(old&&old.day!==s.day){delete f.records[id];old=null;}const remaining=20-(old?.spent??0);
 const playerSoon=timetable(s).some(c=>c.end>s.clock.minute&&c.start<s.clock.minute+remaining);
 const playerMeeting=(s.appointments??[]).some(a=>a.status==='pending'&&a.day===s.day&&a.id!==offer?.id&&a.minute&&a.minute>=s.clock.minute&&a.minute<s.clock.minute+remaining);
 const willing=s.clock.minute+remaining<=1320&&!now.rushed&&now.bandwidth!=='limited'&&(s.relations[id+'>taei']?.tension??0)<6&&!aftermathOtherCommitment(s,id,s.clock.minute+remaining,offer?.id)&&!playerSoon&&!playerMeeting;
 if(offer&&(s.clock.minute<offer.minute-15||s.clock.minute>offer.minute+15)&&!old)throw new Error('약속 시각 가까이에 만나 20분 정도 여유를 확인할 수 있습니다.');
 if(!willing)return {state:s,ok:false,text:'지금은 길게 같이 하기 어렵네요. 여유 있을 때 다시 이야기해요.'};
 const missed=(s.appointments??[]).find(a=>a.kind==='supply-followup'&&a.person===id&&a.status==='broken'&&!a.repairedAt);
 if(old?.status==='missed'){f.archived??=[];f.archived.push(structuredClone(old));delete f.records[id];old=null;}
 pauseSupplyAftermath(s);f.records[id]??={person:id,day:s.day,kind:missed?'repair':f.reactions[id].mode,missedPromise:missed?.id??null,location:s.location,startedAt:s.clock.minute,step:0,spent:0,segments:[],choices:[],last:null,status:'active',offer:offer?.id??null};f.active=id;f.records[id].status='active';f.records[id].location=s.location;f.records[id].reservedUntil=s.clock.minute+remaining;return {state:s,ok:true};
}
export function supplyAftermathScene(s){
 const r=activeSupplyAftermath(s);if(!r)return null;const name=displayName(s,r.person),kind=r.kind;
 const prompt=r.missedPromise&&r.step===0?'약속 시각에 만나지 못했던 일을 먼저 확인한다. 기다리게 한 부분과 다음에 연락할 방법을 이야기할 수 있다.':r.step===0?(kind==='rest'?name+'이 가방을 내려놓고 잠깐 기대 앉는다. “오늘은 뭘 더 하자는 게 아니라 그냥 쉬어도 돼요.”':kind==='repair'?name+'과 다음에 일을 나눌 방식을 이야기한다. 지난번 무슨 일이 있었는지는 서로 본 부분부터 확인한다.':name+'과 짧은 정리 메모를 펼친다. 이번에는 누가 어느 부분을 볼지부터 정할 수 있다.'):'이야기를 듣고 다음에 함께할 때의 방식을 정한다. 모든 문제를 지금 해결해야 하는 것은 아니다.';
 const choices=r.step===0?(kind==='rest'?[['admit','어제는 혼자 맡은 일이 많았다고 솔직하게 말하고 잠깐 쉰다.'],['light','무거운 이야기를 꺼내지 않고 가볍게 근황을 나눈다.']]:kind==='repair'?[['own',r.missedPromise?'기다리게 한 점을 인정하고 먼저 사과한 뒤 상대의 이야기를 듣는다.':'의견을 듣지 못한 부분을 인정하고 상대가 본 상황부터 듣는다.'],['explain','내가 서둘렀던 이유를 설명하고 다른 쪽 이야기도 묻는다.']]:[['listen','각자 먼저 확인할 부분을 정하고 서로의 메모를 읽는다.'],['takeover','빨리 끝내기 위해 내가 한 번에 정리해주겠다고 한다.']]):kind==='rest'?[['share','다음에는 도울 수 있는 범위를 먼저 서로 말하기로 한다.'],['keep','오늘은 함께 쉰 것으로 충분하다고 말한다.']]:kind==='repair'?[['boundary','다음에는 역할과 마감 시간을 먼저 확인하기로 합의한다.'],['later','의견이 다르다는 점을 남겨두고 다음 기회에 다시 맞추기로 한다.']]:[['share','서로 고친 부분을 확인하고 남은 일은 나눠 적는다.'],['fast','마무리는 내가 맡아 끝내고 정리한 내용만 건넨다.']];
 return {prompt,choices:choices.map(([id,label])=>({id,label})),last:r.last,kind,completed:r.status==='completed'};
}
export function progressSupplyAftermath(s,choice){
 const r=activeSupplyAftermath(s),scene=supplyAftermathScene(s);if(!r||r.status!=='active'||r.day!==s.day||r.location!==s.location||s.npcs[r.person]?.location!==s.location)throw new Error('함께 있던 자리에서 이어갈 수 있습니다.');
 const selected=scene.choices.find(c=>c.id===choice);if(!selected)throw new Error('지금 고를 수 없는 행동입니다.');
 if(s.clock.minute+10>1320)throw new Error('오늘은 여기까지 쉬고 다음에 이어갈 수 있습니다.');
 const now=npcNow(s,r.person);if(now.rushed)throw new Error('상대의 수업 준비 시간이 됐습니다. 다음에 이어갈 수 있습니다.');
 r.segments??=[];r.segments.push({start:s.clock.minute,end:s.clock.minute+10});r.choices.push(choice);r.step++;r.spent+=10;
 const ownVoice={yeogyeong:'“확인하는 사람이 따로 있어도 못 믿는다는 뜻은 아니었으면 좋겠어요.”',seoyeon:'“고맙다고 느끼는 것하고, 제가 어디까지 할 수 있는지는 따로 말해도 되죠.”',soyul:'“생각이 조금 늦게 정리돼도, 제 얘기를 끝까지 할 수 있으면 좋겠어요.”'}[r.person];
 r.last={player:selected.label,text:r.step===1?ownVoice:'오늘 이야기한 방식으로 메모를 정리하고 서로의 다음 일정 전에 자리를 마무리한다.'};
 if(r.step===2){
  const coordinated=['share','boundary'].includes(choice),honest=r.choices[0]==='own',fast=choice==='fast';
  const delta=coordinated?{familiarity:1,trust:1,tension:r.kind==='repair'?(honest?-2:-1):-1}:fast?{familiarity:1,trust:1,tension:1}:{familiarity:1};
  aftermathRelation(s,r.person,'taei',delta);noteNpcExperience(s,r.person,'supply-followup',{stress:coordinated?-6:fast?4:-2,warmth:coordinated?4:2},'followup-once');
  r.outcome=coordinated?'shared':fast?'efficient-distance':r.kind==='repair'?'unresolved':'easy-company';r.status='completed';s.supplyAftermath.completed[r.person]={kind:r.kind,outcome:r.outcome,choices:[...r.choices],day:s.day};
  if(r.missedPromise&&honest&&choice==='boundary'){const missed=(s.appointments??[]).find(a=>a.id===r.missedPromise);if(missed)missed.repairedAt={day:s.day,minute:s.clock.minute+10};}
  const a=(s.appointments??[]).find(a=>a.id===r.offer);if(a&&a.status==='pending')a.status='kept';
  s.memory.push(`[${s.day}일차] ${displayName(s,r.person)}과 20분을 함께 보냈다. `+(coordinated?'다음에는 역할과 가능한 범위를 먼저 맞추기로 했다.':fast?'일은 빠르게 마쳤지만 다음에 함께 나눌 방식은 충분히 맞추지 못했다.':'지금 나눈 이야기만 남기고 다음 일정으로 돌아갔다.'));
 }
 return 10;
}
export function supplyAftermathMemory(s,id){const r=s.supplyAftermath?.completed[id];if(!r)return null;return r.outcome==='shared'?'다음에는 역할과 가능한 시간을 먼저 맞추자고 했잖아요. 그 말은 기억하고 있어요.':r.outcome==='efficient-distance'?'메모는 빨리 정리됐는데, 다음에는 제가 할 부분도 남겨주면 좋겠어요.':r.outcome==='unresolved'?'지난번 이야기를 그날 다 풀지는 못했죠. 제 생각도 조금 더 정리해봤어요.':'같이 잠깐 쉬었던 건 편했어요. 매번 뭘 해결하지 않아도 괜찮겠더라고요.';}
