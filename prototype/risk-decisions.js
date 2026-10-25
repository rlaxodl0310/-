import {currentSchedule,presentPeople} from './days.js';
import {contact,identities,displayName} from './identity.js';
import {socialIntent} from './social-reasoning.js';

export function riskState(s){s.risk??={knowledge:{},decisions:{},positions:{},actions:[],sent:{},requests:{}};return s.risk;}
function riskRelation(s,id,source){return {trust:0,tension:0,...s.relations[`${id}>${source}`]};}
function riskTopic(e){if(e.id.startsWith('street')||e.label.includes('구급차')||e.label.includes('응급 이송'))return 'ambulance';if(e.id.startsWith('sidegate')||e.label.includes('출입구'))return 'gate';if(e.id.startsWith('entrance')||e.label.includes('도서관'))return 'library';return 'staff';}
export function rememberRisk(s,id,fact){
 const r=riskState(s);r.knowledge[id]??=[];
 const key=`${fact.topic}:${fact.source}:${fact.kind}`;
 if(!r.knowledge[id].some(f=>f.key===key))r.knowledge[id].push({...fact,key,day:s.day});
}
export function initializeRisk(state){
 const s=structuredClone(state);riskState(s);
 if(s.day!==3||(s.world?.stage??'campus')!=='campus')return s;
 rememberRisk(s,'yeogyeong',{topic:'staff',kind:'direct',source:'self',label:'행사 지원 인력 지연'});
 rememberRisk(s,'soyul',{topic:'ambulance',kind:'direct',source:'self',label:'학교 앞 구급차'});
 rememberRisk(s,'seoyeon',{topic:'gate',kind:'report',source:'unknown',originKind:'report',label:'출입구 통제 전언'});
 return s;
}
export function tellRiskEvidence(state,id,evidenceKey){
 const s=structuredClone(state),e=s.warnings?.evidence?.find(e=>e.key===evidenceKey);
 if(!e||!contact(s,id).introduced)throw new Error('실제로 접한 내용만 이야기할 수 있습니다.');
 rememberRisk(s,id,{topic:riskTopic(e),kind:'report',source:'taei',originKind:e.kind,label:e.label});return s;
}
export function riskAssessment(s,id){
 const byTopic={};
 for(const f of s.risk?.knowledge?.[id]??[]){
  const trust=f.source==='self'?100:riskRelation(s,id,f.source).trust;
  const weight=f.kind==='direct'||f.kind==='notice'?2:trust>=3&&['direct','notice'].includes(f.originKind)?1.25:.25;
  byTopic[f.topic]=Math.max(byTopic[f.topic]??0,weight);
 }
 return {score:Object.values(byTopic).reduce((a,b)=>a+b,0),topics:Object.keys(byTopic)};
}
function riskObligation(s,id){
 const promise=s.appointments.find(a=>a.person===id&&a.day===s.day&&a.status==='pending'&&(a.phase??'afternoon')===s.phase&&a.activity!=='checkCampus');
 if(promise)return {blocked:true,reason:`이미 ${promise.label} 약속이 있어요. 먼저 그 일정부터 정리해야 해요.`};
 if(s.phase!=='afternoon')return {blocked:true,reason:'오늘 준비는 마쳤어요. 지금은 각자 돌아갈 일정을 먼저 확인하려고요.'};
 if(id==='yeogyeong'&&!s.freeDay?.completed?.some(x=>x.id==='exhibit'))return {blocked:true,reason:'지금은 남은 물품과 참석 인원을 제가 확인해야 해요. 여기 비우고 같이 나가기는 어려워요. 확인한 내용은 연락해줄래요?'};
 if(id==='soyul'&&!s.eventState?.flags?.captionReviewed)return {blocked:true,reason:'인쇄한 설명부터 마무리해야 해요. 이대로 두고 같이 나가기는 어려워요. 먼저 정리하고 생각해볼게요.'};
 return {blocked:false};
}
export function escortOpinion(s,id){
 const assessment=riskAssessment(s,id),duty=riskObligation(s,id),intent=socialIntent(s,id);
 if(duty.blocked)return {willing:false,reason:duty.reason};
 if(!contact(s,id).introduced||!intent.feelsSafe)return {willing:false,reason:'지금 같이 움직일 약속까지 잡기는 어려워요. 저는 여기서 확인할 수 있는 것부터 볼게요.'};
 if(assessment.score<(id==='soyul'?3:2))return {willing:false,reason:'아직은 전해 들은 이야기뿐이라서요. 바로 움직이기보다 안내부터 확인하고 싶어요.'};
 return {willing:true,reason:id==='soyul'?'설명은 정리했어요. 확인할 거면 같이 가도 돼요. 대신 모르는 내용을 사진부터 찍어 올리지는 말아요.':'일정은 비워둘 수 있어요. 같이 안내부터 확인해봐요. 무슨 일인지는 보고 판단하고요.'};
}
export function evolveRisk(state,{allowMove=false}={}){
 let s=initializeRisk(state);const r=riskState(s);
 if(s.day!==3||(s.world?.stage??'campus')!=='campus')return s;
 // Close friends compare limited reports privately; no global broadcast of player knowledge.
 for(const [source,listener] of [['soyul','seoyeon'],['seoyeon','soyul']]){
  if(riskRelation(s,listener,source).trust<8)continue;
  for(const fact of [...(r.knowledge[source]??[])].filter(f=>f.source==='self'||f.source==='unknown')){
   const key=`friend:${source}:${listener}:${fact.topic}`;
   if(!r.sent[key]){rememberRisk(s,listener,{topic:fact.topic,kind:'report',source,originKind:fact.kind,label:fact.label});r.sent[key]=true;r.actions.push({id:key,day:s.day,actor:source,recipient:listener,kind:'private-check-in'});}
  }
 }
 for(const id of Object.keys(s.npcs)){
  const a=riskAssessment(s,id),duty=riskObligation(s,id);
  const mode=s.phase==='evening'?'wrap-up':id==='yeogyeong'?(duty.blocked?'coordinate':'ready-to-check'):id==='soyul'?(a.score>=3&&!duty.blocked?'regroup':'finish-and-verify'):(a.score>=2?'verify-route':'check-sources');
  r.decisions[id]={mode,obligation:duty.blocked,topics:a.topics};
  const actionId=`decision:${id}:${mode}`;if(!r.actions.some(a=>a.id===actionId))r.actions.push({id:actionId,day:s.day,phase:s.phase,actor:id,kind:mode});
  const meeting=s.appointments.some(x=>x.person===id&&x.day===s.day&&x.status==='pending'&&x.kind==='meeting');
  if(allowMove&&s.phase==='afternoon'&&!meeting){const old=r.positions[id];if(id==='soyul'&&mode==='regroup')r.positions[id]='hall';else delete r.positions[id];if(old!==r.positions[id])r.revision=(r.revision??0)+1;}
  const key=`risk-contact:${id}:${mode}`;
  if(!r.sent[key]&&s.phase==='afternoon'&&contact(s,id).introduced&&socialIntent(s,id).feelsSafe){
   const text=id==='yeogyeong'?(duty.blocked?'저는 남은 물품이랑 참석 인원부터 다시 확인할게요. 다른 곳 확인하러 가면 일정 바뀐 것만 먼저 알려주세요.':'맡은 전시 준비는 마쳤어요. 더 확인할 일이 있으면 지금은 같이 움직일 수 있어요.'):id==='soyul'?(mode==='regroup'?'설명 정리했어요. 혼자 확인하러 다니기보다는 학생회관에서 같이 이야기해요.':(r.sent['friend:soyul:seoyeon:ambulance']?'서연이한테도 직접 본 게 있는지 물어봤어요. 저는 일단 출력물 마무리하고 있을게요. 확인 안 된 내용은 따로 올리지 않으려고요.':'저는 직접 본 것부터 확인하고 출력물을 마무리할게요. 확인 안 된 내용은 따로 올리지 않으려고요.')):(mode==='verify-route'?'전해 들은 내용이 몇 개 있어서 동선부터 확인하려고요. 이동할 거면 도착한 뒤에 한 번 연락해줄래요?':'저는 직접 본 게 없어서 다른 사람한테 확인부터 해볼게요. 급하게 결론내리지는 말아요.');
   s.messages.push({day:s.day,from:s.npcs[id].name,text});r.sent[key]=true;
  }
  const opinion=escortOpinion(s,id),offerId=`risk-escort:${id}`;
  const previous=s.appointments.find(a=>a.id===offerId);
  if(s.phase==='afternoon'&&opinion.willing&&!previous){
   for(const old of s.appointments.filter(a=>a.person===id&&a.day===3&&a.status==='offered'&&a.activity!=='checkCampus'))old.status='withdrawn';
   s.appointments.push({id:offerId,kind:'activity',proposer:'npc',person:id,day:3,phase:'afternoon',activity:'checkCampus',location:'hall',label:'교내 안내 함께 확인',status:'offered',text:opinion.reason});
   s.messages.push({day:3,from:s.npcs[id].name,text:opinion.reason,appointmentId:offerId});
  }
  if(previous?.status==='offered'&&!opinion.willing)previous.status='withdrawn';
 }
 if(allowMove)for(const [id,location] of Object.entries(currentSchedule(s)))s.npcs[id].location=location;
 return s;
}
export function requestEscort(state,id){
 const s=evolveRisk(state),r=riskState(s),opinion=escortOpinion(s,id),offerId=`risk-escort:${id}`;
 let offer=s.appointments.find(a=>a.id===offerId);
 if(opinion.willing){
  if(offer&&['declined','cancelled','withdrawn','broken'].includes(offer.status))return {state:s,result:{riskEscort:true,willing:false,text:'오늘은 그 일정은 다시 잡지 않기로 했잖아요. 다음에 이야기해요.',playerLine:'교내 안내 확인하러 같이 갈래요?',stage:'상대의 이전 의사를 존중한다.'}};
  if(!offer){offer={id:offerId,person:id,kind:'activity',proposer:'player',day:3,phase:'afternoon',activity:'checkCampus',label:'교내 안내 함께 확인',status:'pending'};s.appointments.push(offer);}else if(offer.status==='offered')offer.status='pending';
 }
 const signature=JSON.stringify([s.risk.knowledge[id],riskObligation(s,id),opinion.willing]);
 if(r.requests[id]?.signature!==signature){r.requests[id]={signature,willing:opinion.willing};s.memory.push(`[3일차] ${identities[id].name}에게 동행을 물었고 ${opinion.willing?'함께 안내를 확인하기로 했다.':'상대가 자기 일정과 판단을 설명하며 거절했다.'}`);}
 return {state:s,result:{riskEscort:true,willing:opinion.willing,text:opinion.reason,playerLine:'교내 안내 확인하러 같이 갈래요?',stage:opinion.willing?'동행 약속을 잡았다. 다른 일정과 겹치는지 확인할 수 있다.':'상대는 호감과 별개로 자신의 일정과 판단을 설명한다.'}};
}
export function riskScene(s,location){
 if(s.day!==3||s.phase!=='afternoon')return '';
 const descriptions={yeogyeong:'전화 화면과 참석 명단을 번갈아 확인하고 있다.',soyul:s.risk?.decisions?.soyul?.mode==='regroup'?'정리한 출력물을 챙겨 학생회관 쪽에서 연락을 확인하고 있다.':'출력물을 맞춰놓고 가까운 사람에게 짧은 메시지를 보내고 있다.',seoyeon:'휴대폰의 안내와 이동 동선을 다시 대조하고 있다.'};
 return Object.keys(s.risk?.decisions??{}).filter(id=>presentPeople(s,location).includes(id)).map(id=>`${displayName(s,id)}은 ${descriptions[id]}`).join(' ');
}
