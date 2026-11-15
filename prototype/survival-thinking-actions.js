import {survivalCondition} from './survival-health.js';
import {survivalAction,launchSurvivalSortie,finishSurvivalDay,assignSurvivalJob} from './survival-base.js';
import {careSurvivalMember,memberSurvivalCareOptions,survivalPackView} from './survival-pack.js';
import {thinkingAvailable,thinkingConsent,markThinkingPrepared} from './survival-thinking.js';
import {currentSurvivalMembers} from './survival-parties.js';
export function thinkingStepBlocked(state,plan){
 const r=state.survivalRun,q=plan.steps.find(q=>q.status==='pending'),speaker=r?.members.find(m=>m.key===plan.speaker);
 if(!r||r.status!=='active'||r.activeSortie||r.kit?.pending)return '진행 중인 원정과 발견 물자를 먼저 정리하세요.';
 if(plan.status!=='accepted'||!q)return '먼저 계획을 함께 진행하기로 정하세요.';
 if(!thinkingAvailable(speaker))return '제안자가 지금 함께 판단할 상태가 아니에요.';
 if(['prepare','sortie'].includes(q.kind)){
  if(!currentSurvivalMembers(r).some(m=>m.key===plan.speaker))return '제안자를 태이 파티로 편성하고 다시 준비하세요.';
  if(plan.steps.some(s=>s.kind==='sortie')&&currentSurvivalMembers(r).some(m=>survivalCondition(m).critical))return '원정 인원은 먼저 치료와 회복이 필요해요.';
  const refusal=thinkingConsent(state,plan).find(v=>!v.agrees);if(refusal)return refusal.name+': '+refusal.line;
 }
 if(['drink','eat','treat'].includes(q.kind)){const care={drink:'water',eat:'food',treat:'treat'}[q.kind],option=memberSurvivalCareOptions(state,q.target).find(c=>c.action===care);if(!option||option.blocked)return '실제로 사용할 물품과 대상의 상태를 확인하세요.';}
 if(q.kind==='watch'&&(survivalCondition(speaker).critical||speaker.fatigue>=80||speaker.nutrition<=15||speaker.hydration<=15))return '감시를 맡기 전에 치료하고 먹거나 쉬어야 해요.';
 if(['sortie','rest','treat','search'].includes(q.kind)&&r.actions<1)return '오늘 행동 여력이 부족해요.';
 if(q.kind==='search'&&r.searchDay===r.day)return '오늘 주변 수색은 이미 마쳤어요.';
 if(q.kind==='sortie'&&q.site==='partyRescue'&&r.parties?.delays?.find(e=>e.id===q.target)?.status!=='pending')return '구조 요청 상황이 달라졌어요. 현장 무전을 확인하세요.';
 if(q.kind==='sortie'&&['kiosk','convenience'].includes(q.site)&&r.shopVisits?.[q.site]===r.day)return '오늘은 이미 이 장소로 출발했어요. 다음 날 다시 준비하세요.';
 if(q.kind==='sortie'&&q.site==='clinic'&&r.clinicOutcome?.rescued)return '보건실 원정은 이미 완료됐어요. 다른 치료 물자 확보 방법을 정하세요.';
 return null;
}
export function executeSurvivalThinking(state,id){
 const plan=state.survivalRun?.thinking?.plans.find(p=>p.id===id);if(!plan)throw new Error('진행할 계획을 확인하세요.');const blocked=thinkingStepBlocked(state,plan);if(blocked)throw new Error(blocked);const q=plan.steps.find(q=>q.status==='pending');
 if(q.kind==='prepare'){const pack=survivalPackView(state);if(!pack)throw new Error('가방 준비를 먼저 확인하세요.');return markThinkingPrepared(state,id);}
 if(['drink','eat','treat'].includes(q.kind))return careSurvivalMember(state,q.target,{drink:'water',eat:'food',treat:'treat'}[q.kind]);
 if(q.kind==='search')return survivalAction(state,'search');
 if(q.kind==='rest')return survivalAction(state,'hide');
 if(q.kind==='watch')return assignSurvivalJob(state,q.target,'watch');
 if(q.kind==='night')return finishSurvivalDay(state);
 if(q.kind==='sortie')return launchSurvivalSortie(state,q.site,q.target??undefined);
 throw new Error('실행할 수 있는 계획 단계를 확인하세요.');
}
