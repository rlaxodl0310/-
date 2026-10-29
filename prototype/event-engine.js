import {usesSupplyStory} from './supply-story.js';
import {noteNpcExperience} from './npc-state.js';
import {changeRelationship,relationship} from './dialogue.js';
import {contact} from './identity.js';
import {socialIntent} from './social-reasoning.js';
import {eventKey,learnEvent,scheduledEvent} from './event-view.js';

export const eventKinds={scheduled:'scheduled',conditional:'conditional',situational:'situational'};
export function prepareEvents(s){
 s.world??={stage:'campus'};
 s.eventState??={flags:{},plans:{},knowledge:{}};
 s.eventState.flags??={};s.eventState.plans??={};s.eventState.knowledge??={};
 return s;
}
export function recordEvent(s,event){
 prepareEvents(s);
 const full={stage:s.world.stage,day:s.day,phase:s.phase,kind:'conditional',participants:[],...event};
 const key=eventKey(full),existing=s.events.find(e=>eventKey(e)===key);
 if(existing)return {event:existing,created:false};
 if(!Object.values(eventKinds).includes(full.kind))throw new Error('지원하지 않는 이벤트 유형입니다.');
 s.events.push(full);return {event:full,created:true};
}
// Shared rule contract for campus, outbreak and survival content. Effects run exactly once.
export function evaluateEvents(state,context,rules){
 const s=prepareEvents(structuredClone(state));
 for(const rule of rules){
  if(!rule.stages.includes(s.world.stage)||rule.trigger!==context.trigger||!rule.when(s,context))continue;
  const id=typeof rule.id==='function'?rule.id(s,context):rule.id;
  const registered=recordEvent(s,{id,kind:rule.kind,participants:typeof rule.participants==='function'?rule.participants(s,context):rule.participants??[],status:'resolved'});
  if(!registered.created)continue;
  Object.assign(registered.event,rule.effect(s,context,registered.event)??{});
  const outcome=registered.event.outcome;
  const emotion=['separate','unspoken','separate-display','unfinished-caption'].includes(outcome)?{stress:18,warmth:-4}:['joint','reconciled','joint-display','cross-checked','sorted-first'].includes(outcome)?{stress:-12,warmth:10}:null;
  if(emotion)for(const person of registered.event.participants)if(s.npcs[person])noteNpcExperience(s,person,'event:'+outcome,emotion,`world:${id}`);
 }
 return s;
}
export function eventApproaches(s,choice){
 if((s.world?.stage??'campus')!=='campus')return [];
 if(choice==='volunteer')return [
  {id:'listen',label:'각자 확인한 수량을 먼저 듣는다.'},
  {id:'organize',label:'물품부터 분류하고 부족한 것만 다시 확인한다.'}];
 if(choice==='review')return [
  {id:'listen',label:'고른 사진의 이유를 들으며 같이 정한다.'},
  {id:'organize',label:'전시에 필요한 수량과 형식부터 맞춘다.'},
  {id:'stepBack',label:'옆에서 작업하며 두 사람이 직접 조율하게 둔다.'}];
 if(choice==='exhibit')return [
  {id:'listen',label:'각자 붙이고 싶은 사진부터 확인한다.'},
  {id:'organize',label:'우선 게시 순서와 동선을 맞춘다.'},
  {id:'stepBack',label:'맡은 부분을 도우며 다른 사람의 결정을 지켜본다.'}];
 return [];
}
export function planEvent(state,choice,approach){
 if(!eventApproaches(state,choice).some(o=>o.id===approach))throw new Error('이 활동에서 선택할 수 없는 방식입니다.');
 const s=prepareEvents(structuredClone(state));s.eventState.plans[`${s.day}:${choice}`]=approach;return s;
}
const pairTrust=s=>Math.min(relationship(s,'yeogyeong','soyul').trust,relationship(s,'soyul','yeogyeong').trust);
const pairTension=s=>Math.max(relationship(s,'yeogyeong','soyul').tension,relationship(s,'soyul','yeogyeong').tension);
const pairChange=(s,delta)=>{changeRelationship(s,'yeogyeong','soyul',delta);changeRelationship(s,'soyul','yeogyeong',delta);};
const campusRules=[
 {id:'friend-check-in',kind:'conditional',stages:['campus'],trigger:'phase-start',participants:['seoyeon','soyul'],
  when:s=>s.day===2&&relationship(s,'soyul','seoyeon').trust>=10&&relationship(s,'soyul','seoyeon').tension<3,
  effect:s=>{s.eventState.flags.photoConfidence=true;return {outcome:'encouraged',result:'서연이 소율에게 사진을 고른 이유도 함께 적어보라고 연락했다.',visibility:'private'};}},
 {id:'supplies',kind:'scheduled',stages:['campus'],trigger:'activity-end',participants:['yeogyeong','seoyeon','soyul'],
  when:s=>s.day===1&&!usesSupplyStory(s),
  effect:(s,c)=>{
   const organized=c.choice==='volunteer'&&c.approach==='organize';
   pairChange(s,organized?{familiarity:1}:{trust:1,familiarity:1});
   changeRelationship(s,'seoyeon','soyul',{trust:1});
   s.eventState.flags.logisticsReady=organized;
   return {outcome:organized?'sorted-first':'cross-checked',result:organized?'물품을 종류별로 먼저 나누고 누락된 묶음을 찾아냈다. 다음 준비에 쓸 분류표도 남겼다.':'서로 센 수량을 맞춰보며 포장 누락을 확인하고 진행 순서를 조정했다.',visibility:'participants'};
  }},
 {id:'photo-selection',kind:'scheduled',stages:['campus'],trigger:'activity-end',participants:['yeogyeong','soyul'],
  when:s=>s.day===2,
  effect:(s,c)=>{
   const present=c.choice==='review',listening=present&&c.approach==='listen',organizing=present&&c.approach==='organize';
   const trusted=pairTrust(s)>=2,confident=!!s.eventState.flags.photoConfidence;
   const strained=pairTension(s)>=3;
   const outcome=strained&&!listening?'separate':organizing?'practical':listening||trusted||confident?'joint':'practical';
   pairChange(s,outcome==='joint'?{trust:listening?2:1,familiarity:1}:outcome==='separate'?{tension:1,familiarity:1}:{familiarity:1});
   s.eventState.flags.photoStyle=outcome;
   return {outcome,approach:present?c.approach:'npc-decision',result:{joint:'소율이 고른 사진의 이유를 이야기하고 여경과 함께 전시 순서를 정했다.',practical:'여경과 소율이 수량과 형식에 맞춰 사진을 먼저 골랐다. 설명 문구는 각자 더 생각하기로 했다.',separate:'두 사람이 서로 다른 기준을 고집해 사진을 따로 준비하기로 했다.'}[outcome],visibility:'participants'};
  }},
 {id:'creative-friction',kind:'conditional',stages:['campus'],trigger:'activity-end',participants:['yeogyeong','soyul'],
  when:s=>s.day===2&&s.eventState.flags.photoStyle==='practical'&&pairTrust(s)<3,
  effect:s=>{pairChange(s,{tension:1});s.eventState.flags.unspokenPreference=true;return {outcome:'unspoken',result:'소율은 넣고 싶은 사진을 말하지 못했고, 여경은 형식 합의가 끝난 것으로 생각했다.',visibility:'private'};}},
 {id:'caption-request',kind:'conditional',stages:['campus'],trigger:'activity-end',participants:['soyul'],
  when:(s,c)=>s.day===2&&s.eventState.flags.photoStyle!=='separate'&&contact(s,'soyul').introduced&&socialIntent(s,'soyul').feelsSafe&&(c.choice==='review'||!!s.dialogue.facts?.soyul?.photo),
  effect:(s,c,e)=>{
   s.eventState.flags.captionRequested=true;
   s.messages.push({day:s.day,from:'박소율',eventKey:eventKey(e),read:false,text:'전시에 붙일 글을 조금 썼어요. 내일 자료실에서 인쇄하려고요. 혹시 마주치면 한 번 봐주실래요? 지금 당장 말고요.'});
   return {outcome:'requested',result:'소율이 설명 문구를 읽어봐 달라는 메시지를 보냈다.',visibility:'message'};
  }},
 {id:'peer-adjustment',kind:'conditional',stages:['campus'],trigger:'phase-start',participants:['yeogyeong','soyul'],
  when:s=>s.day===3&&s.eventState.flags.unspokenPreference&&pairTrust(s)>=2&&pairTension(s)<3,
  effect:s=>{s.eventState.flags.preferenceReconciled=true;pairChange(s,{trust:1,tension:-1});return {outcome:'reconciled',result:'여경과 소율이 전시 전에 다시 연락해 각자 남기고 싶은 사진을 함께 넣기로 했다.',visibility:'private'};}},
 {id:'caption-reviewed',kind:'conditional',stages:['campus'],trigger:'activity-end',participants:['soyul','taei'],when:s=>s.day===3&&s.eventState.flags.captionReviewed,effect:(s,c,e)=>{learnEvent(s,e,'participated');return {outcome:'discussed',result:'소율과 설명 문구를 함께 읽으며 전시에 담을 내용을 정리했다.',visibility:'participants'};}},
 {id:'campus-showcase',kind:'scheduled',stages:['campus'],trigger:'activity-end',participants:['yeogyeong','seoyeon','soyul'],
  when:s=>s.day===3,
  effect:(s,c)=>{
   const listened=c.choice==='exhibit'&&c.approach==='listen';
   const reconciled=listened||s.eventState.flags.preferenceReconciled||s.eventState.flags.captionReviewed;
   const joint=s.eventState.flags.photoStyle==='joint'||reconciled;
   const separate=s.eventState.flags.photoStyle==='separate'&&!reconciled;
   const organized=c.choice==='exhibit'&&c.approach==='organize'||s.eventState.flags.logisticsReady||c.choice==='shortcut';
   const outcome=separate?'separate-display':joint?'joint-display':organized?'practical-display':'unfinished-caption';
   if(listened||reconciled&&s.eventState.flags.unspokenPreference){pairChange(s,{trust:1,tension:-1});s.eventState.flags.preferenceReconciled=true;}
   changeRelationship(s,'seoyeon','soyul',{trust:1});
   return {outcome,result:{'joint-display':'사진마다 고른 이유와 설명을 붙이고 두 사람이 함께 전시 구성을 마쳤다.','practical-display':'동선과 사진 크기를 먼저 맞춰 전시를 마쳤다. 개인적인 설명은 다음에 보완하기로 했다.','separate-display':'여경과 소율이 각자 맡은 구역을 따로 꾸몄다. 전시는 열렸지만 둘의 기준은 아직 맞춰지지 않았다.','unfinished-caption':'사진 전시는 열렸지만 일부 설명 문구는 비워뒀다. 다음 활동에서 다시 정리하기로 했다.'}[outcome],visibility:'participants'};
  }}
];
export function phaseEvents(state){return evaluateEvents(state,{trigger:'phase-start'},campusRules);}
export function activityEvents(state,choice,approach){
 const selected=approach??state.eventState?.plans?.[`${state.day}:${choice}`]??'listen';
 const options=eventApproaches(state,choice);
 if(options.length&&!options.some(o=>o.id===selected))throw new Error('알 수 없는 활동 방식입니다.');
 let s=evaluateEvents(state,{trigger:'activity-end',choice,approach:selected},campusRules);
 const relevant={volunteer:'supplies',review:'photo-selection',exhibit:'campus-showcase'}[choice];
 const event=relevant?scheduledEvent(s,relevant):null;
 if(event){const known=!!s.eventState.knowledge[eventKey(event)];learnEvent(s,event,'participated');if(!known){s.lastResult+=' '+event.result;s.memory.push(`[${s.day}일차] ${event.result}`);}}
 return s;
}
export function observeSituation(s,encounter){
 const r=recordEvent(s,{id:'encounter:'+encounter.key,kind:'situational',participants:encounter.group?['seoyeon','soyul']:[encounter.person],outcome:'noticed',result:encounter.text,status:'pending'});
 learnEvent(s,r.event,'observed');return s;
}
export function finishSituation(s,encounter,engage){
 const event=s.events.find(e=>e.id==='encounter:'+encounter.key);
 if(event){event.status='resolved';event.outcome=engage?'joined':'passed';if(engage&&!event.participants.includes('taei'))event.participants.push('taei');}
 if(engage&&encounter.person==='soyul'&&s.day===3&&s.location==='library'){
  s.eventState.flags.captionEncountered=true;
 }
 return s;
}
