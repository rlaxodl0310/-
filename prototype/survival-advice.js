import {survivalCondition} from './survival-health.js';
import {displayName} from './identity.js';
// Deterministic party deliberation: only observed shared supplies/health are used.
const advicePreferences={yeogyeong:{care:14,clinic:12,kiosk:8},seoyeon:{care:10,rest:10},soyul:{rest:16,kiosk:12,convenience:-16},iseo:{convenience:10},dogyeom:{convenience:16,kiosk:-4}};
export const survivalAdviceLabels={clinic:'보건실에서 치료 물자 찾기',kiosk:'교내 매점에서 식량·물 보급',convenience:'편의점에서 식량·물 보급',care:'부상자부터 치료하기',eat:'가진 음식부터 나누기',drink:'가진 물부터 마시기',rest:'몸을 숨기고 쉬기',search:'주변 물자부터 살펴보기'};
export function survivalAdviceName(state,member){return member?.label??(member?.character==='student'?'함께 있는 학생':displayName(state,member?.character));}
function advicePresent(r){return r.members.filter(m=>!['away','departed'].includes(m.mind?.state));}
function adviceContext(r){return JSON.stringify({day:r.day,actions:r.actions,resources:r.resources,items:r.kit?.items,stock:r.kit?.stock,pending:!!r.kit?.pending,stage:r.stage,base:r.base,visits:r.shopVisits,clinic:r.clinicOutcome,search:r.searchDay,sorties:r.sortieSequence,active:!!r.activeSortie,members:r.members.map(m=>({key:m.key,character:m.character,injury:m.injury,woundRisk:m.woundRisk,nutrition:m.nutrition,hydration:m.hydration,fatigue:m.fatigue,stress:m.stress,mind:m.mind?.state}))});}
function adviceSupply(r,id){return (r.resources[id]??0)+(r.kit?.items[id]??0)+(r.kit?.stock[id]??0);}
export function survivalAdviceOptions(state){
 const r=state.survivalRun;if(!r||r.status!=='active'||r.activeSortie||r.kit?.pending||r.actions<1||r.advice?.pause===adviceContext(r))return [];
 const people=advicePresent(r),n=people.length,food=adviceSupply(r,'food')+adviceSupply(r,'canned'),water=adviceSupply(r,'water'),meds=adviceSupply(r,'bandage')+adviceSupply(r,'firstaid');
 const speakers=people.filter(m=>m.key!=='taei'&&m.mind?.state!=='panic');if(!speakers.length)return [];
 const party=r.members.filter(m=>['taei','ally'].includes(m.key)&&m.mind?.state!=='departed'),unready=party.some(m=>survivalCondition(m).critical||m.fatigue>=80||['panic','away'].includes(m.mind?.state)),options=[];
 const add=(kind,need,level,score,reason,target)=>options.push({kind,need,level,score,reason,target:target?.key??null,label:survivalAdviceLabels[kind]});
 const injured=people.filter(m=>m.injury>0).sort((a,b)=>(b.woundRisk??0)-(a.woundRisk??0)||b.injury-a.injury),patient=injured[0];
 if(patient){const c=survivalCondition(patient),name=survivalAdviceName(state,patient),level=c.critical?3:c.woundRisk>=50||patient.injury>=2?2:1;
  if(meds>0)add('care','wounds',level,150+level*12,`${name}의 부상 ${patient.injury}단계${c.woundRisk?' · 상처 악화 위험 '+c.woundRisk+'/100':''}. 가진 붕대·구급 물품이 ${meds}개 있으니, 밖에 나가기 전에 치료하자.`,patient);
  else if(r.base&&!r.clinicOutcome?.rescued&&!unready)add('clinic','wounds',level,105+level*12,`${name}의 부상을 돌봐야 하는데 붕대와 구급 물품이 하나도 없어. 보건실에서 치료 물자를 먼저 찾아보자.`,patient);
  else if(!meds&&r.searchDay!==r.day)add('search','wounds',level,110+level*10,`${name}의 상처를 돌볼 물품이 없어. ${unready?'지금 상태로 먼 원정을 떠나기는 어려워. ':''}주변에 남은 물자부터 살펴보자. 치료 물자가 있을지는 확인해야 해.`,patient);
 }
 const thirsty=people.filter(m=>survivalCondition(m).hydration<=35).sort((a,b)=>a.hydration-b.hydration)[0],hungry=people.filter(m=>survivalCondition(m).nutrition<=35).sort((a,b)=>a.nutrition-b.nutrition)[0];
 if(thirsty&&water>0)add('drink','thirst',thirsty.hydration<=15?3:2,175,`${survivalAdviceName(state,thirsty)}의 수분이 ${thirsty.hydration}/100이야. 물이 ${water}개 있으니, 먼저 마시고 움직이자.`,thirsty);
 if(hungry&&(food>0||adviceSupply(r,'energybar')>0))add('eat','hunger',hungry.nutrition<=15?3:2,165,`${survivalAdviceName(state,hungry)}의 포만감이 ${hungry.nutrition}/100이야. 가진 음식부터 먹고 다음 일을 정하자.`,hungry);
 const tired=party.find(m=>m.fatigue>=65||m.stress>=75||m.mind?.state==='panic');
 if(tired)add('rest','exhaustion',unready?3:1,unready?180:75,`${survivalAdviceName(state,tired)}의 피로 ${tired.fatigue}/100 · 부담 ${tired.stress}/100. 잠깐 몸을 숨기고 쉬고 나서 움직이자.`,tired);
 if((food<n*2||water<n*2)&&!unready){
  const level=food<n||water<n?3:1,reason=`${n}명이 나눌 식량이 ${food}인분, 물이 ${water}개 남았어. ${level===3?'오늘 배급부터 모자라.':'이대로면 이틀치 배급이 부족해.'}`;
  if(r.base){for(const kind of ['kiosk','convenience'])if(r.shopVisits?.[kind]!==r.day)add(kind,'rations',level,80+level*10+(kind==='convenience'&&level===3?8:kind==='kiosk'?7:0),reason+(kind==='kiosk'?' 교내 매점에서 필요한 만큼 챙기자.':' 편의점은 더 위험하지만 물과 통조림을 더 살펴볼 수 있어.'));}
  if((!r.base||['kiosk','convenience'].every(k=>r.shopVisits?.[k]===r.day))&&r.searchDay!==r.day)add('search','rations',level,90+level*10,reason+' 오늘 갈 수 있는 곳부터 생각하면, 주변 물자를 확인하는 게 좋겠어.');
 }
 if(unready&&(food<n||water<n)&&r.searchDay!==r.day)add('search','rations',3,160,`${n}명이 나눌 식량 ${food}인분 · 물 ${water}개. 먼 원정은 무리지만, 가까이 남은 물자가 있는지부터 살펴보자.`);
 if(unready&&!tired&&!options.length)add('rest','exhaustion',3,180,'지금 원정 인원의 몸 상태로는 먼 길을 나서기 어려워. 안전한 곳에 머물며 회복할 방법부터 찾자.');
 const heard=(r.advice?.history??[]).filter(h=>['accepted','deferred'].includes(h.status)&&h.day===r.day);
 return speakers.flatMap(speaker=>options.map(o=>{
  const phase=o.kind==='care'?'treat':o.need==='wounds'?'medicine':o.need;
  const key=`${r.day}:${o.need}:${phase}:${o.target??'party'}:${o.level}`;
  const risk=speaker.stress>=55?{rest:12,kiosk:8,convenience:-18}:{};
  const score=o.score+(advicePreferences[speaker.character]?.[o.kind]??0)+(risk[o.kind]??0)+(speaker.key===o.target?8:0);
  const relation=state.relations?.[speaker.character+'>taei'],opening=(relation?.tension??0)>=4?'의견이 다를 수 있지만, 이건 확인했으면 해. ':speaker.character==='soyul'?'내 생각에는… ':speaker.character==='yeogyeong'?'남은 것부터 확인해봤어. ':speaker.character==='dogyeom'?'다음에 뭘 할지 생각해봤는데, ':'';
  return {...o,key,phase,score,speaker:speaker.key,text:opening+o.reason};
 })).filter(o=>!heard.some(h=>h.need===o.need&&h.phase===o.phase&&h.target===o.target&&h.level>=o.level)).sort((a,b)=>b.score-a.score||a.speaker.localeCompare(b.speaker)||a.kind.localeCompare(b.kind));
}
export function refreshSurvivalAdvice(state){
 const r=state.survivalRun;if(!r)return state;
 const options=survivalAdviceOptions(state),best=options[0]??null,s=structuredClone(state),a=s.survivalRun.advice??={version:1,sequence:0,current:null,history:[]};
 if(!best){a.current=null;return s;}
 if(a.current?.key===best.key&&a.current.speaker===best.speaker&&a.current.kind===best.kind){a.current={...a.current,...best,alternatives:[...new Set(options.filter(o=>o.kind!==best.kind).map(o=>o.label))].slice(0,2)};return s;}
 a.sequence++;a.current={...best,id:String(a.sequence),day:r.day,alternatives:[...new Set(options.filter(o=>o.kind!==best.kind).map(o=>o.label))].slice(0,2)};
 return s;
}
export function survivalAdviceView(state){
 const r=state.survivalRun;if(!r?.advice?.current)return null;
 const current=r.advice.current,match=survivalAdviceOptions(state).find(o=>o.key===current.key&&o.kind===current.kind&&o.speaker===current.speaker);
 return match?{...current,...match}:null;
}
export function respondSurvivalAdvice(state,id,decision){
 if(!['accept','defer'].includes(decision))throw new Error('제안에 답할 방법을 확인하세요.');
 const current=survivalAdviceView(state);if(!current||current.id!==String(id))throw new Error('상황이 달라졌어요. 지금 동료의 제안을 다시 확인하세요.');
 const s=structuredClone(state),r=s.survivalRun,a=r.advice;a.history.push({...current,status:decision==='accept'?'accepted':'deferred'});a.history=a.history.slice(-60);a.current=null;
 const name=survivalAdviceName(s,r.members.find(m=>m.key===current.speaker)),text=decision==='accept'?`${name}의 제안에 동의했다. ${current.label} 준비를 하기로 했다.`:`${name}에게 지금은 다른 일을 먼저 하겠다고 말했다. 같은 상황으로 오늘 다시 재촉하지 않기로 했다.`;
 r.log=[text];r.history.push({day:r.day,text});a.pause=adviceContext(r);return refreshSurvivalAdvice(s);
}
export function survivalAdviceTab(kind){return ['clinic','kiosk','convenience'].includes(kind)?kind:['care','eat','drink'].includes(kind)?'people':'overview';}
