'use strict';

const Journey=require('./journey-actions.cjs');
const Risk=require('./npc-risk-actions.cjs');
const Geography=require('../ui/map/geography.js');

const accept=/^(?:그 길로 (?:가자|가요|간다)|우회 제안 수락)[.!。！]?$/u;
const explicit=/^우회 제안 (수락|보류|거절)(?:\s+([-a-zA-Z0-9]{1,84}))?[.!。！]?$/u;

function intent(text){
 if(typeof text!=='string'||text.length>1000)return null;
 const match=explicit.exec(text.trim());
 if(match)return {decision:{수락:'accept',보류:'hold',거절:'decline'}[match[1]],id:match[2]||null};
 if(accept.test(text.trim()))return {decision:'accept',id:null};
 return null;
}

function options(state){
 return (state.npcActionProposals||[]).filter(row=>
  ['offered','held'].includes(row.status)&&row.location===state.location&&Risk.available(state,row.actorId));
}

async function apply(state,text,bridge,requestId){
 const decision=intent(text);
 if(!decision)throw Error('제안에 답할 행동을 확인해 주세요.');
 if(state.combat?.status==='playing')throw Error('조우가 끝난 뒤 제안에 답할 수 있어요.');
 const candidates=options(state).filter(row=>!decision.id||row.id===decision.id);
 if(!candidates.length)throw Error('현재 응답할 수 있는 제안이 없어요.');
 if(candidates.length!==1){
  const choices=candidates.map(row=>Geography.records.find(p=>p.id===row.target)?.name||row.target);
  throw Error('어느 제안인지 골라 주세요. '+choices.join(', ')+' · 채팅창 위 추천에서 선택할 수 있어요.');
 }
 const [candidate]=candidates;
 let next=structuredClone(state);
 if(decision.decision==='accept'){
  if(candidate.kind!=='detour')throw Error('이 제안을 실행할 행동을 확인할 수 없어요.');
  const route=Risk.detour(next,candidate.eventId,candidate.actorId,candidate.target);
  if(JSON.stringify(route.legs.map(leg=>leg.edgeId))!==JSON.stringify(candidate.edges))
   throw Error('검토했던 경로가 바뀌었어요. 우회로를 다시 확인해 주세요.');
  next=await Journey.apply(next,{type:'journeyStart',destination:candidate.target,mode:'safe'},bridge,requestId);
 }
 const status={accept:'accepted',hold:'held',decline:'declined'}[decision.decision];
 next.npcActionProposals=next.npcActionProposals.map(row=>row.id===candidate.id?{...row,status}:row);
 const messages={accepted:'우회 제안을 받아들였다. 검토한 여정을 시작했다.',held:'우회 제안을 보류했다.',declined:'우회 제안을 거절했다.'};
 return {state:next,text:messages[status]};
}

module.exports={intent,options,apply};
