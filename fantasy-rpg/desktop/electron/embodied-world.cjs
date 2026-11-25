'use strict';
const C=require('../ui/skills/common.js'),Actions=require('./story-actions.cjs');
function settle(state,events,returnedBook,duration){
 if(!Array.isArray(events)||events.length>4096)throw Error('암석 작업 기록 한도를 벗어났습니다.');
 const next=JSON.parse(JSON.stringify(state)),objects=Actions.objects(next),seen=new Set(next.essenceWorkReceipts||[]),within=new Set(),counts=new Map(),changed=new Set();
 for(const e of events){
  if(!e||typeof e.id!=='string'||e.id.length>160||typeof e.castId!=='string'||typeof e.objectId!=='string'||!Number.isFinite(e.at)||e.at<0||e.at>duration||!Number.isFinite(e.distance)||e.distance<0||!Number.isFinite(e.work)||e.work<=0||e.actorId!=='taei')throw Error('암석 작업 기록 형식이 잘못되었습니다.');
  if(seen.has(e.id)||within.has(e.id))continue;within.add(e.id);
  const sk=returnedBook.skills.find(s=>s.id===e.skillId&&s.ownerId===e.actorId),def=C.get(sk?.commonId),m=def?.mechanic;
  if(m?.kind!=='contact_fracture'||!(state.player.essenceSpecies||[]).includes(def.essenceSpecies)||(!returnedBook.casts.some(c=>c.id===e.castId&&c.skillId===e.skillId)||(state.skillBook.casts||[]).some(c=>c.id===e.castId))||e.distance>m.range||e.work>m.workPerPulse)throw Error('실제 정수와 접촉 시전 근거가 없습니다.');
  const n=(counts.get(e.castId)||0)+1;counts.set(e.castId,n);if(n>m.pulses)throw Error('한 시전의 작업 횟수를 초과했습니다.');
  const object=objects.find(o=>o.id===e.objectId),check=C.Embodied.objectCheck({...object,distance:e.distance},m),before=object.fractureWork||0;
  object.fractureWork=Math.min(check.cap,before+e.work);object.condition=object.fractureWork>=check.limit?'broken':'cracked';object.fractured=true;seen.add(e.id);changed.add(object.id);
 }
 next.essenceWorkReceipts=[...seen].slice(-8192);next.ledger??=[];
 for(const id of changed){const o=objects.find(o=>o.id===id);next.ledger.push({id:'work-result-'+next.revision+'-'+id,turn:next.revision,text:o.name+'의 실제 암석 작업 결과: '+o.condition,evidence:'접촉 작업 판정',source:'engine-action',subject:id,predicate:'condition',value:o.condition,witnesses:['taei',...(next.present||[])]});}
 if(changed.size)next.continuity=require('./story-continuity.cjs').commit(next,{continuityUpdates:[]});return next;
}
module.exports={settle};
