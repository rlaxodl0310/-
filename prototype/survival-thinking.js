import {characterPersonalities} from './character-personality.js';
import {currentSurvivalMembers,partyMemberName} from './survival-parties.js';
import {survivalCondition} from './survival-health.js';
// Local utility planner. Traits are tuning weights, never invented biography or hidden world facts.
const thinkingProfiles={yeogyeong:characterPersonalities.yeogyeong.planning,seoyeon:characterPersonalities.seoyeon.planning,soyul:{care:5,safety:14,risk:-16},iseo:{care:3,safety:7,risk:6},dogyeom:{care:2,safety:3,risk:14}};
export function thinkingHash(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}
export function thinkingSupply(r,id){return (r.resources[id]??0)+(r.kit?.items[id]??0)+(r.kit?.stock[id]??0);}
export function thinkingBond(state,m){return state.survivalRun.parties?.bonds?.[m.recruitId??'member:'+m.key]??state.relations?.[m.character+'>taei']??{};}
export function thinkingAvailable(m){return m&&m.key!=='taei'&&!m.deployment&&!['away','departed','panic'].includes(m.mind?.state);}
function thinkingStep(kind,label,target=null,site=null){return {kind,label,target,site,status:'pending'};}
export function thinkingConsent(state,plan){
 const r=state.survivalRun,field=plan.steps.some(q=>q.kind==='sortie'),roster=currentSurvivalMembers(r);
 if(!field)return [];
 return roster.filter(m=>m.key!=='taei'&&!['away','departed','panic'].includes(m.mind?.state)).map(m=>{const c=survivalCondition(m),b=thinkingBond(state,m),reason=!thinkingAvailable(m)||m.partyConsent===false?'지금 함께 출발할 상태가 아니에요.':c.critical||m.fatigue>=80?'먼저 치료하고 쉬어야 해요.':(b.tension??0)>=12?'지난 일에 대한 불편함부터 이야기하고 싶어요.':(m.stress>=75||c.fear>=65)&&(b.trust??0)<20?'지금은 그 위험을 감수할 자신이 없어요. 잠깐 쉬고 다시 정해요.':null;
  return {key:m.key,name:partyMemberName(state,m),agrees:!reason,line:reason??(m.key===plan.speaker?'내가 제안한 일인 만큼 준비를 확인하고 함께할게요.':'지금 몸 상태와 동선이라면 함께 준비해볼 수 있어요.')};});
}
export function thinkingMemory(member){
 const own=member.thinkingMemories?.slice().reverse().find(e=>e.goal!=='prepare');if(own)return own.success?'지난번에 세운 계획을 실제로 마쳤던 경험이 있어.':'지난 계획을 마치지 못한 일이 있어서, 이번에는 중간에 돌아올 기준도 정하고 싶어.';
 const rescue=member.partyRescueMemories?.at(-1);if(rescue)return rescue.rescued?'서로 길을 열어 데리고 돌아왔던 일을 기억하고 있어.':'물자를 포기하고 우회했던 일을 기억하고 있어.';
 const supply=member.supplyMemories?.at(-1);if(supply)return supply.harm?'지난 보급 때 다친 일이 마음에 걸려.':supply.rescued?'지난 보급에서 사람과 함께 돌아온 경험도 생각했어.':'지난 보급에서 들었던 구조 요청이 마음에 남아 있어.';
 return '';
}
export function survivalThinkingCandidates(state,member){
 const r=state.survivalRun;if(!r||r.status!=='active'||!thinkingAvailable(member))return [];
 const people=r.members.filter(m=>!m.deployment&&!['away','departed'].includes(m.mind?.state)),n=people.length,profile=thinkingProfiles[member.character]??{care:5,safety:5,risk:0},caution=member.thinkingLearning?.caution??0,options=[];
 const add=(goal,label,score,evidence,steps,risk,uncertainty='상황이 달라지면 출발 전에 다시 확인하자.')=>options.push({goal,label,score,evidence,steps,risk,uncertainty,speaker:member.key});
 for(const patient of people){const c=survivalCondition(patient),name=partyMemberName(state,patient),steps=[],facts=[],friend=state.relations?.[member.character+'>'+patient.character]??{},closeness=(friend.affection??0)*.08+(friend.trust??0)*.04;
  if(c.hydration<=35&&thinkingSupply(r,'water')>0){steps.push(thinkingStep('drink',name+'부터 물 마시기',patient.key));facts.push(name+'의 수분 '+c.hydration+'/100');}
  if(c.nutrition<=35&&['food','canned','energybar'].some(id=>thinkingSupply(r,id)>0)){steps.push(thinkingStep('eat',name+'의 식사 챙기기',patient.key));facts.push(name+'의 포만감 '+c.nutrition+'/100');}
  if(patient.injury>0&&c.caredDay!==r.day&&thinkingSupply(r,'bandage')+thinkingSupply(r,'firstaid')>0){steps.push(thinkingStep('treat',name+'의 상처 돌보기',patient.key));facts.push(name+'의 부상 '+patient.injury+'단계');}
  if(steps.length)add('recover:'+patient.key,'몸을 돌본 뒤 다음 일 정하기',130+profile.care+closeness+(c.critical?35:0)+(patient.key===member.key?8:0),facts.join(' · '),steps,'물품을 실제로 쓰고, 치료에는 행동 여력 1이 필요해.');
 }
 const tired=currentSurvivalMembers(r).find(m=>m.fatigue>=55||m.stress>=65);
 if(tired)add('rest','숨을 돌리고 다시 판단하기',120+profile.safety+caution,'원정 인원 '+partyMemberName(state,tired)+'의 피로 '+tired.fatigue+' · 부담 '+tired.stress,[thinkingStep('rest','몸을 숨기고 쉬기',tired.key)],'쉬는 데 여력 1이 들어. 배급이 저절로 늘지는 않아.');
 const food=thinkingSupply(r,'food')+thinkingSupply(r,'canned'),water=thinkingSupply(r,'water');
 if(r.base&&(food<n*2||water<n*2))for(const site of ['kiosk','convenience'])if(r.shopVisits?.[site]!==r.day){
  const place=site==='kiosk'?'매점':'편의점',memory=member.supplyMemories?.some(m=>m.harm&&m.site===site)?18:0;
  add('supply:'+site,place+'에서 다음 배급 준비하기',95+(food<n||water<n?25:0)+(site==='convenience'?profile.risk-caution-memory:8+profile.safety),n+'명분 배급에 식량 '+food+' · 물 '+water,[thinkingStep('prepare','몸 상태와 가방 확인'),thinkingStep('sortie',place+' 보급 원정',null,site)],site==='convenience'?'안쪽 보관함을 열면 소음이 크게 늘어. 물자를 챙겨도 전원이 탈출해야 해.':'진열대만 확인하고 돌아오는 동선을 우선하자. 적을 만나거나 부상을 입을 수 있어.','실제로 어떤 물자를 가져올지는 현장에서 확인해야 해.');
 }
 const injured=people.find(m=>m.injury>0);
 if(r.base&&injured&&thinkingSupply(r,'bandage')+thinkingSupply(r,'firstaid')===0&&!r.clinicOutcome?.rescued)add('medicine','보건실에서 치료 물자 찾기',125+profile.care,partyMemberName(state,injured)+'의 부상이 있지만 치료 물품이 없음',[thinkingStep('prepare','출발할 몸 상태와 가방 확인'),thinkingStep('sortie','보건실 물자 확인',null,'clinic')],'현재 원정 인원 중 중증 부상자가 있으면 먼저 가까운 회복 방법을 찾아야 해.','보건실에 가는 것만으로 치료되지는 않아. 물품을 가방에 챙겨 돌아와야 해.');
 const unready=currentSurvivalMembers(r).some(m=>survivalCondition(m).critical||m.fatigue>=80||m.mind?.state==='panic');
 if(r.searchDay!==r.day&&(!r.base||food<n||water<n||injured&&thinkingSupply(r,'bandage')+thinkingSupply(r,'firstaid')===0))add('search','가까운 물자부터 확인하기',unready?155:62+profile.safety+caution,'남은 식량 '+food+' · 물 '+water+' · 치료 물품 '+(thinkingSupply(r,'bandage')+thinkingSupply(r,'firstaid')),[thinkingStep('search','주변 물자를 살펴보고 가져갈 것 고르기')],'수색에는 여력 1이 들고 위협이 조금 늘어. 가방에 직접 담은 물품만 가져올 수 있어.','필요한 물품이 있는지는 실제 발견 물자를 확인해야 해.');
 if(r.base)for(const e of r.parties?.delays??[])if(e.status==='pending')add('rescue:'+e.id,e.name+'의 귀환 지원하기',140+profile.care-caution,e.name+'의 마지막 무전: '+e.radio,[thinkingStep('prepare','지원할 인원과 가방 확인'),thinkingStep('sortie','연결 통로에서 부상자 보호',e.id,'partyRescue')],'현장 부상자를 적 턴 4번 동안 지켜야 해. 우리 몸 상태가 나쁘면 다른 파티 지원이나 우회 복귀도 고려하자.');
 if(r.base&&(r.threat>=45||r.base.integrity<70)&&member.job!=='watch'&&!survivalCondition(member).critical)add('watch','거점의 밤을 준비하기',65+profile.safety+caution,'주변 위협 '+r.threat+' · 출입문 상태 '+r.base.integrity,[thinkingStep('watch','내가 주변 감시 맡기',member.key),thinkingStep('night','밤을 넘긴 뒤 결과 확인')],'감시를 맡으면 밤에 피로가 쌓여. 다음 날 몸 상태를 다시 봐야 해.','감시 인원이 있어도 안전한 밤을 보장할 수는 없어.');
 if(!options.length)add('prepare','다음 행동에 앞서 함께 준비하기',25+profile.safety,'급한 회복이나 배급 부족은 지금 관찰되지 않음',[thinkingStep('prepare','현재 파티와 가방 준비 확인')],'새 원정을 확정하는 단계는 아니야. 필요한 물품과 서로의 상태부터 보자.');
 const completed=r.thinking?.plans??[];
 return options.filter(o=>!completed.some(p=>p.speaker===member.key&&p.goal===o.goal&&p.day===r.day&&['completed','deferred','failed'].includes(p.status))).sort((a,b)=>b.score-a.score||a.goal.localeCompare(b.goal));
}
function thinkingSay(state,plan,topic){
 const r=state.survivalRun,m=r.members.find(m=>m.key===plan.speaker),seed=[r.exploration?.seed,r.day,m.key,plan.goal,topic,plan.revision??0].join(':'),pick=arr=>arr[thinkingHash(seed)%arr.length],bond=thinkingBond(state,m),memory=thinkingMemory(m);
 const name=partyMemberName(state,m),evidence=plan.evidence.split(name+'의').join('내'),sequence=plan.steps.map(q=>q.target===m.key?q.label.split(name+'부터').join('내가 먼저').split(name+'의').join('내'):q.label).join(' 다음에 ');
 const opening=(bond.tension??0)>=4?'의견이 다를 수 있지만, 지금 본 걸 이야기할게. ':m.character==='yeogyeong'?(r.threat>=45||plan.steps.some(q=>q.kind==='sortie')?pick(['조금 무섭기는 해. 먼저 안전하게 할 수 있는 순서부터 보자. ','나 겁먹은 거 얼굴에 다 보이지… 그래도 준비할 건 같이 정하고 싶어. ']):pick(['천천히 확인하고 같이 정하고 싶어. ','내 생각을 먼저 이야기해볼게. '])):m.character==='seoyeon'?pick(['내가 해보고 싶은 건 이거야. 필요한 준비부터 정해봤어. ','하고 싶다고 마음먹었으니, 내가 할 수 있는 일부터 해보려고 해. ']):m.character==='soyul'?pick(['내 생각에는… ','조금 걱정되는데, ']):m.character==='dogyeom'?pick(['다음 동선을 생각해봤어. ','이 순서로 움직이면 어떨까. ']):pick(['지금 상황을 보고 생각해봤어. ','다음 일을 같이 정하고 싶어. ','내가 먼저 확인하고 싶은 게 있어. ']);
 if(topic==='why')return opening+evidence+'. '+(memory?memory+' ':'')+'그래서 '+sequence+' 순서로 해보고 싶어.';
 if(topic==='risk')return pick(['걱정되는 점부터 말할게. ','계획대로 안 될 경우도 생각했어. ','가능한 일과 위험한 점을 나눠보면, '])+plan.risk+' '+plan.uncertainty;
 if(topic==='accepted')return pick(['좋아. 첫 단계부터 확인하자. ','그럼 이 순서로 준비해보자. ','함께 정했으니 하나씩 해보자. '])+'실제로 마친 일만 확인하고 다음 단계로 넘어갈게.';
 if(topic==='deferred')return pick(['알겠어. 오늘은 같은 일로 재촉하지 않을게. ','지금은 다른 일이 먼저구나. 다음 상황을 보고 다시 생각할게. ']);
 return opening+evidence+'. '+(memory?memory+' ':'')+pick(['이 계획은 어때?','이 순서로 해보면 어떨까?','가능한지 같이 생각해줄래?']);
}
export function thinkingPlanLine(state,plan,topic='proposal'){return thinkingSay(state,plan,topic);}
function thinkingObservation(r){return {day:r.day,sequence:r.sortieSequence,food:thinkingSupply(r,'food')+thinkingSupply(r,'canned'),water:thinkingSupply(r,'water'),meds:thinkingSupply(r,'bandage')+thinkingSupply(r,'firstaid'),searchDay:r.searchDay,restSequence:r.restSequence??0,members:Object.fromEntries(r.members.map(m=>[m.key,{hydration:m.hydration,nutrition:m.nutrition,injury:m.injury,fatigue:m.fatigue,stress:m.stress,caredDay:m.caredDay}]))};}
export function recordThinkingDeparture(run,kind,site,id,originalRun){for(const p of run.thinking?.plans??[])if(p.status==='accepted'&&p.steps.some(q=>q.kind==='sortie'&&q.site===kind&&(kind!=='partyRescue'||q.target===site))){p.departure={id,observation:thinkingObservation(originalRun)};const prepare=p.steps.find(q=>q.kind==='prepare');if(prepare&&prepare.status==='pending'){prepare.status='completed';prepare.result='실제 출발 때 인원과 가방 준비를 확인함';}}}
export function observeThinkingStep(r,plan,step){
 const m=r.members.find(m=>m.key===step.target),start=plan.observation?.members?.[step.target],base=plan.observation;if(!base)return null;
 if(step.kind==='drink'&&m&&m.hydration>(start?.hydration??100))return '실제로 물을 마시고 수분이 회복됨';
 if(step.kind==='eat'&&m&&m.nutrition>(start?.nutrition??100))return '실제로 음식을 먹고 포만감이 회복됨';
 if(step.kind==='treat'&&m&&(m.injury<(start?.injury??0)||m.caredDay===r.day&&m.caredDay!==start?.caredDay))return '실제 치료 물품을 사용해 상처를 돌봄';
 if(step.kind==='rest'&&m&&(r.restSequence??0)>base.restSequence&&(m.fatigue<(start?.fatigue??0)||m.stress<(start?.stress??0)))return '실제 휴식으로 피로나 부담이 줄어듦';
 if(step.kind==='watch'&&m?.job==='watch')return '실제 거점 감시 역할을 맡음';
 if(step.kind==='night'&&r.lastNight?.day>=base.day){const watcher=plan.steps.find(q=>q.kind==='watch')?.target;return !watcher||r.lastNight.roles?.[watcher]==='watch'?'실제 감시 역할로 밤을 넘기고 거점 보고를 확인함':{failed:true,text:'밤을 넘겼지만 계획했던 감시 역할은 맡지 않았음'};}
 if(step.kind==='search'&&r.searchDay===r.day&&r.searchDay!==base.searchDay&&!r.kit?.pending){const found=thinkingSupply(r,'food')+thinkingSupply(r,'canned')>base.food||thinkingSupply(r,'water')>base.water||thinkingSupply(r,'bandage')+thinkingSupply(r,'firstaid')>base.meds;return found?'수색에서 실제 물품을 골라 가지고 돌아옴':{failed:true,text:'주변을 살폈지만 필요한 물품을 챙기지 못함'};}
 if(step.kind==='sortie'){
  const departure=plan.departure?.observation??base;
  const result=r.completedSorties.find(q=>(plan.departure?q.id===plan.departure.id:q.id>base.sequence)&&q.kind===step.site&&(step.site!=='partyRescue'||q.siteId===step.target));if(!result)return null;
  if(!result.success)return {failed:true,text:'원정을 중단하거나 목표를 달성하지 못함'};
  if(step.site==='partyRescue'){const e=r.parties?.delays?.find(e=>e.id===step.target);return e?.status==='resolved'?'고립된 기존 파티의 실제 귀환을 확인함':null;}
  const found=step.site==='clinic'?thinkingSupply(r,'bandage')+thinkingSupply(r,'firstaid')>departure.meds:thinkingSupply(r,'food')+thinkingSupply(r,'canned')>departure.food||thinkingSupply(r,'water')>departure.water;
  return found?'실제 물품을 챙겨 원정에서 돌아옴':{failed:true,text:'귀환했지만 계획했던 보급 물품은 늘지 않음'};
 }
 return null;
}
function thinkingFinish(r,plan,success,text){
 plan.status=success?'completed':'failed';plan.result=text;plan.finishedDay=r.day;
 const m=r.members.find(m=>m.key===plan.speaker);if(m){m.thinkingMemories??=[];m.thinkingMemories.push({id:plan.id,goal:plan.goal,day:r.day,success,text});m.thinkingMemories=m.thinkingMemories.slice(-12);m.thinkingLearning??={caution:0};if(!success&&plan.steps.some(q=>q.kind==='sortie'))m.thinkingLearning.caution=Math.min(30,m.thinkingLearning.caution+6);else if(success)m.thinkingLearning.caution=Math.max(0,m.thinkingLearning.caution-1);}
 r.thinking.journal.push({id:plan.id,day:r.day,speaker:plan.speaker,goal:plan.goal,success,text});r.thinking.journal=r.thinking.journal.slice(-40);
}
export function refreshSurvivalThinking(state){
 if(!state.survivalRun)return state;const s=structuredClone(state),r=s.survivalRun;r.thinking??={version:1,sequence:0,plans:[],journal:[]};
 for(const p of r.thinking.plans.filter(p=>p.status==='accepted')){
  if(!thinkingAvailable(r.members.find(m=>m.key===p.speaker))){p.blocked='제안자가 거점에 없거나 지금 함께 판단할 상태가 아니에요.';continue;}p.blocked=null;
  for(const step of p.steps.filter(q=>q.status==='pending')){const result=observeThinkingStep(r,p,step);if(result?.failed){thinkingFinish(r,p,false,result.text);break;}if(result){step.status='completed';step.result=result;}}
  if(p.status==='accepted'&&p.steps.every(q=>q.status==='completed'))thinkingFinish(r,p,true,'함께 정한 순서를 실제 행동으로 마쳤다.');
 }
 if(r.activeSortie||r.status!=='active'||r.kit?.pending)return s;
 // Proposed goals can change with observations; accepted plans persist until their outcome is known.
 for(const m of currentSurvivalMembers(r).filter(thinkingAvailable)){
  const previous=r.thinking.plans.find(p=>p.speaker===m.key&&['proposed','accepted'].includes(p.status));if(previous?.status==='accepted')continue;
  const options=survivalThinkingCandidates(s,m),best=(previous?.alternativeChosen&&previous.day===r.day?options.find(o=>o.goal===previous.goal):null)??options[0];if(previous&&best?.goal===previous.goal&&previous.day===r.day){if(previous.evidence!==best.evidence)previous.revision++;Object.assign(previous,best);continue;}
  if(previous){previous.status='reconsidered';previous.result='상황이 바뀌어 다음 목표를 다시 생각했다.';}
  if(!best)continue;r.thinking.sequence++;const plan={...best,id:'thought-'+r.thinking.sequence,day:r.day,status:'proposed',revision:0,questions:[],dialogue:[]};plan.dialogue.push({speaker:m.key,text:thinkingSay(s,plan,'proposal')});r.thinking.plans.push(plan);
 }
 r.thinking.plans=r.thinking.plans.filter(p=>['accepted','proposed'].includes(p.status)).concat(r.thinking.plans.filter(p=>!['accepted','proposed'].includes(p.status)).slice(-30));return s;
}
export function survivalThinkingView(state){const r=state.survivalRun,keys=r?currentSurvivalMembers(r).map(m=>m.key):[];return r?.thinking?.plans.filter(p=>['proposed','accepted'].includes(p.status)&&keys.includes(p.speaker)&&thinkingAvailable(r.members.find(m=>m.key===p.speaker)))??[];}
export function respondSurvivalThinking(state,id,reply){
 const r0=state.survivalRun,p0=r0?.thinking?.plans.find(p=>p.id===id);if(!r0||r0.status!=='active'||r0.activeSortie||r0.kit?.pending||!p0||!['proposed','accepted'].includes(p0.status)||!thinkingAvailable(r0.members.find(m=>m.key===p0.speaker))||!currentSurvivalMembers(r0).some(m=>m.key===p0.speaker))throw new Error('거점에서 지금 이야기할 수 있는 동료의 계획을 확인하세요.');
 const s=structuredClone(state),r=s.survivalRun,p=r.thinking.plans.find(p=>p.id===id),m=r.members.find(m=>m.key===p.speaker);let text;
 if(['why','risk','companions'].includes(reply)){
  const key=r.day+':'+p.revision+':'+reply;if(p.questions.includes(key))throw new Error('이 계획에 대해서는 이미 들은 이야기예요.');p.questions.push(key);
  if(reply==='companions'){const voices=thinkingConsent(s,p);if(!voices.length)text='이 단계는 거점에서 할 수 있는 일이야. 밖으로 나갈 계획이 생기면 실제 출발 인원에게 다시 물어보자.';else{for(const voice of voices)p.dialogue.push({speaker:voice.key,text:voice.line});text='함께 출발할 사람들의 현재 뜻을 확인했다. 몸 상태나 편성이 달라지면 다시 확인한다.';}}
  else text=thinkingSay(s,p,reply);
 }else if(reply==='accept'){
  if(p.status!=='proposed')throw new Error('이미 함께 진행하기로 한 계획이에요.');const refusal=thinkingConsent(s,p).find(v=>!v.agrees);if(refusal)throw new Error(refusal.name+': '+refusal.line);p.status='accepted';p.observation=thinkingObservation(r);text=thinkingSay(s,p,'accepted');
 }else if(reply==='defer'){p.status='deferred';p.result='오늘은 다른 일을 먼저 하기로 했다.';text=thinkingSay(s,p,'deferred');}
 else if(reply==='alternative'){
  if(p.status!=='proposed'||(p.alternativesUsed??0)>=2)throw new Error('진행 중인 계획은 먼저 마치거나 미뤄 주세요. 다른 방법은 한 계획에서 두 번까지 살펴볼 수 있어요.');
  const option=survivalThinkingCandidates(s,m).filter(o=>o.goal!==p.goal).sort((a,b)=>Number(a.steps.some(q=>q.kind==='sortie'))-Number(b.steps.some(q=>q.kind==='sortie'))||b.score-a.score)[0];
  if(!option)throw new Error('지금 확인된 조건에서는 다른 실행 방법을 찾지 못했어. 몸 상태나 물자가 달라지면 다시 생각해보자.');const old=p.label;Object.assign(p,option);p.revision++;p.alternativesUsed=(p.alternativesUsed??0)+1;p.alternativeChosen=true;text=old+' 대신 '+p.label+'부터 하자는 거야. '+thinkingSay(s,p,'why');
 }else throw new Error('대화 방법을 확인하세요.');
 p.dialogue.push({speaker:reply==='companions'?'narrator':m.key,text});p.dialogue=p.dialogue.slice(-18);r.log=[text];return refreshSurvivalThinking(s);
}
export function markThinkingPrepared(state,id){const s=structuredClone(state),r=s.survivalRun,p=r.thinking.plans.find(p=>p.id===id),step=p.steps.find(q=>q.status==='pending');if(step?.kind!=='prepare')throw new Error('지금은 준비 확인 단계가 아니에요.');step.status='completed';step.result='현재 몸 상태와 가방을 함께 확인함';r.log=['현재 가방과 출발 인원을 확인했다. 물품은 실제로 챙긴 만큼만 사용할 수 있다.'];return refreshSurvivalThinking(s);}
