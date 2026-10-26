import {noteNpcExperience} from './npc-state.js';
import {recordMissedLessons} from './timetable.js';
import {applyCampusMoments} from './campus-moments.js';
import {availableRoutes,currentSchedule} from './days.js';
import {activityEvents} from './event-engine.js';
import {warningActivity} from './warnings.js';
import {introduce,contact,identities} from './identity.js';
import {changeRelationship} from './dialogue.js';
import {weatherAdjustAppointments} from './weather.js';
export function freeDay(s){s.freeDay??={completed:[],settled:false};return s.freeDay;}
export function settleFreeWorld(state,activeChoice=null){
 let s=structuredClone(state),d=freeDay(s);
 if(d.settled)return s;
 if((s.clock?.minute??780)<1080)return s;
 const participation=d.completed.find(x=>({1:'volunteer',2:'review',3:'exhibit'})[s.day]===x.id)?.id;
 s=activityEvents(s,participation??activeChoice??'absent');
 for(const [id,status] of Object.entries(s.dialogue.promises))if(status==='pending'){
  const kept=d.completed.some(x=>x.id==='volunteer')||activeChoice==='volunteer';s.dialogue.promises[id]=kept?'kept':'broken';changeRelationship(s,id,'taei',kept?{trust:2}:{trust:-2,tension:2});
 }
 for(const a of s.appointments.filter(a=>a.day===s.day&&a.status==='pending')){
  if(a.activity===activeChoice)continue;
  const kept=!!a.activity&&d.completed.some(x=>x.id===a.activity);a.status=kept?'kept':'broken';if(a.person)changeRelationship(s,a.person,'taei',kept?{trust:2}:{trust:-1,tension:1});
  s.memory.push(`[${s.day}일차] ${a.label} 약속을 ${kept?'지켰다.':'지키지 못했다.'}`);
 }
 for(const a of s.appointments)if(a.day===s.day&&a.status==='offered')a.status='expired';
 freeDay(s).settled=true;return s;
}
export function advanceFreeTime(state,minutes,{activeChoice=null,travelling=false}={}){
 if(!Number.isInteger(minutes)||minutes<0)throw new Error('올바르지 않은 소요 시간입니다.');
 let s=structuredClone(state);const end=(s.clock?.minute??780)+minutes;
 if(end>1320)throw new Error('오늘은 너무 늦어집니다. 짧은 행동을 하거나 귀가할 수 있습니다.');
 const before=s.clock?.minute??780;s.clock={minute:end};recordMissedLessons(s,before,end);applyCampusMoments(s,before,end,{travelling});s.phase=end>=1080?'evening':'afternoon';
 s=settleFreeWorld(s,activeChoice);
 for(const [id,place] of Object.entries(currentSchedule(s)))s.npcs[id].location=place;
 return s;
}
export function freeActivity(state,id){
 if(state.phase!=='afternoon'&&!['rehearsal','work','explore','walk'].includes(id))throw new Error('이 준비 활동은 마무리됐습니다. 주변을 둘러보거나 사람들과 이야기할 수 있습니다.');
 const d=freeDay(structuredClone(state));if(d.completed.some(x=>x.id===id)&&!['rehearsal','work','explore','walk'].includes(id))throw new Error('오늘 이미 마친 일입니다. 다른 자유행동을 할 수 있습니다.');
 const route=availableRoutes(state).find(r=>r.id===id);if(!route||route.locked)throw new Error(route?.lockReason??'지금 할 수 없는 일입니다.');
 let s=weatherAdjustAppointments(state,availableRoutes(state));const start=s.clock.minute;
 s=advanceFreeTime(s,route.duration,{activeChoice:id,travelling:['explore','walk','shortcut','checkCampus'].includes(id)});
 return finishFreeActivity(s,id,route,{start});
}
// Shared completion effects for ordinary activities and timed, multi-step community events.
export function finishFreeActivity(state,id,route,{start,activeMinutes=null}={}){
 let s=structuredClone(state);
 if(!availableRoutes(s).some(r=>r.id===id)||route.id!==id)throw new Error('올바른 활동이 아닙니다.');
 if(!['rehearsal','work','explore','walk'].includes(id)&&freeDay(s).completed.some(x=>x.id===id))throw new Error('이미 완료한 활동입니다.');
 if(!Number.isInteger(start)||start>s.clock.minute)throw new Error('활동 시작 시각을 확인해 주세요.');
 s.choice=id;s.minutes=activeMinutes??route.duration;s.lastResult=route.memory;
 freeDay(s).completed.push({id,start,end:s.clock.minute,...(activeMinutes===null?{}:{activeMinutes})});
 for(const fact of route.knowledge)if(!s.known.includes(fact))s.known.push(fact);
 const participants=['volunteer','exhibit'].includes(id)?(activeMinutes!==null&&id==='volunteer'?['yeogyeong']:Object.keys(s.npcs).filter(person=>!s.academics?.enabled||currentSchedule(s)[person]==='hall')):id==='review'?['soyul']:id==='backstage'?['seoyeon']:[];
 for(const person of participants)noteNpcExperience(s,person,'shared-work',{fatigue:activeMinutes===null?route.duration/8:0,stress:-8,warmth:8},`activity:${id}`);
 for(const person of participants)if(!contact(s,person).introduced){introduce(s,person,'shared-activity');if(s.academics?.enabled)s.lastResult+=` 함께 준비하던 학생과 인사를 나눈다. “저는 ${identities[person].name}이에요.”`;s.memory.push(`[${s.day}일차] ${identities[person].name}과 준비를 함께하며 인사를 나눴다.`);}
 if(['volunteer','exhibit','review'].includes(id)){for(const person of participants)changeRelationship(s,person,'taei',{familiarity:1,trust:1});s=activityEvents(s,id);}
 if(id==='volunteer')for(const [person,status] of Object.entries(s.dialogue.promises))if(status==='pending'){s.dialogue.promises[person]='kept';changeRelationship(s,person,'taei',{trust:2});}
 for(const a of s.appointments)if(a.day===s.day&&a.status==='pending'&&a.activity===id){a.status='kept';if(a.person)changeRelationship(s,a.person,'taei',{trust:2});}
 if(id==='work'&&s.dayHistory.some(h=>h.choice==='rehearsal'||h.activities?.some(a=>a.id==='rehearsal')))s.lastResult+=' 이전에 합주에서 확인한 부분을 데모에 반영했다.';
 if(id==='volunteer'&&s.contacts?.yeogyeong?.introduced){s.dialogue.threads??={};s.dialogue.threads.yeogyeong??={episode:0,day:s.day,minute:s.clock.minute,origin:'volunteer'};}
 s=warningActivity(s,id);s.memory.push(`[${s.day}일차] ${s.lastResult}`);return s;
}
export function goHome(state){
 let s=structuredClone(state);s.clock={minute:Math.max(s.clock?.minute??780,1080)};recordMissedLessons(s,state.clock.minute,s.clock.minute);applyCampusMoments(s,state.clock?.minute??780,s.clock.minute,{travelling:true});s.phase='evening';s=settleFreeWorld(s);freeDay(s).home=true;return s;
}
