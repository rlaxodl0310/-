import {survivalResidentCapacity,partyMemberName,ensureSurvivalParties,playerSurvivalParty} from './survival-parties.js';
const supplyRescueBias={seoyeon:16,yeogyeong:12,iseo:8,soyul:-6,dogyeom:-12};
export const supplyDebateChoices={
 rescue:{label:'사람을 먼저 돕자. 안쪽을 확인하고 데려오자.',reason:'도울 수 있는 사람을 우선하자고 했다.',cost:'소음 +2 · 학생 옆에서 구조 행동력 1 / 스태미나 8'},
 withdraw:{label:'우리 안전과 배급이 먼저야. 지금은 돌아가자.',reason:'현재 파티의 안전과 배급을 먼저 지키자고 했다.',cost:'추가 소비 없음 · 학생은 구조하지 않음'},
 mark:{label:'물을 남기고 위치를 적자. 준비해서 다시 오자.',reason:'위치를 기록하고 구조 준비를 갖춰 다시 오자고 했다.',cost:'휴대한 생수 1 · 다음 방문에 요청을 다시 확인 가능'}
};
function debateWater(b){return (b.items?.water??0)+(b.stash?.items?.water??0);}
function debateBond(state,m){return state.survivalRun.parties?.bonds?.[m.recruitId??'member:'+m.key]??state.relations?.[m.character+'>taei']??{};}
function debateLiving(r){return r.members.filter(m=>m.mind?.state!=='departed');}
export function supplyDebatePending(b){return b?.supplyDebate?.phase==='decision';}
export function beginSupplyDebate(state){
 const r=state.survivalRun,b=state.combatTrial;if(!r||!b?.shop||!b.survivalSortie||b.supplyDebate||Object.keys(b.actors).length<2||r.supplyStories?.sites?.[b.shop.kind]?.status==='rescued')return;
 ensureSurvivalParties(state);b.partyId??=playerSurvivalParty(r)?.id;
 const actors=Object.entries(b.actors).filter(([,a])=>!a.absent&&!a.escaped),witnesses=actors.filter(([k,a])=>k!=='taei'&&!a.down);if(!witnesses.length)return;
 const n=actors.length,food=['food','canned','energybar'].reduce((q,k)=>q+(b.stash.items[k]??0),0),water=debateWater(b),wounded=actors.filter(([,a])=>a.wounds>0),context={size:n,food,water,enemies:b.enemies.filter(a=>a.balance>0).length,wounded:wounded.length,canHouse:debateLiving(r).length<survivalResidentCapacity(r),turn:b.turn,threat:r.threat};
 const opinions=witnesses.map(([key,a])=>{
  const m=r.members.find(m=>m.key===(a.memberKey??key)),bond=debateBond(state,m),prior=m.supplyMemories?.at(-1),friend=wounded.find(([k,p])=>k!==key&&((state.relations?.[m.character+'>'+p.id]?.trust??0)+(state.relations?.[m.character+'>'+p.id]?.affection??0)>=25));
  const cautionedBy=prior?.choice==='rescue'&&prior.harm?prior.heard?.find(h=>h.stance==='withdraw'&&actors.some(([k])=>k===h.key)):null;
  const score=20-(context.enemies>=3?8:0)-(context.canHouse?0:25)+(cautionedBy?-6:0)+(supplyRescueBias[m.character]??0)+Math.min(10,(bond.trust??0)*.1+(bond.affection??0)*.05)-(food<n||water<n?18:0)-(wounded.length?20:0)-(a.wounds>0?15:0)-(a.fear>=50?15:0)-(friend?12:0)-(r.threat>=75?10:0)-(prior?.harm&&prior.choice==='rescue'?12:0),stance=score>=12?'rescue':score<=0?'withdraw':'mark';
  const fact=(cautionedBy?'지난번 '+cautionedBy.name+'의 돌아올 길에 대한 걱정도 생각나. ':'')+(friend?`${friend[1].label??partyMemberName(state,r.members.find(m=>m.key===friend[0]))}도 다쳤어. `:a.wounds>0?'지금 내 상처도 신경 쓰여. ':water<n||food<n?'우리가 휴대한 먹을 것과 물도 넉넉하지 않아. ':'');
  const line=stance==='rescue'?fact+'그래도 저기 사람이 있잖아. 데리고 나가자.':stance==='withdraw'?fact+'더 들어갔다가 우리도 갇히면 어떡해. 일단 돌아가자.':fact+'물이라도 두고 가자. 여기 어딘지 적어 놓고, 사람 더 데려오면 되잖아.';
  return {key,character:m.character,name:a.label??partyMemberName(state,m),stance,line,score,initialWounds:a.wounds};
 });
 b.supplyDebate={version:1,id:b.shop.kind+':'+r.activeSortie.id,site:b.shop.kind,phase:'decision',choice:null,reason:null,student:{x:7,y:2},rescued:false,context,opinions,initialWounds:Object.fromEntries(Object.entries(b.actors).map(([k,a])=>[k,a.wounds])),previousMark:r.supplyStories?.sites?.[b.shop.kind]?.status==='marked',promiseWitnesses:r.supplyStories?.sites?.[b.shop.kind]?.promiseWitnesses??[]};
 b.log=['진열대 너머에서 “아직 사람이 있어요?” 하고 부르는 소리가 난다. 동료들이 걸음을 멈추고 서로의 의견을 말한다.'];
}
export function supplyDebateBlocked(state,choice){
 const b=state.combatTrial,e=b?.supplyDebate;if(!e||!supplyDebatePending(b)||!supplyDebateChoices[choice])return '지금 결정할 구조 요청이 없어요.';
 if(choice==='rescue'&&debateLiving(state.survivalRun).length>=survivalResidentCapacity(state.survivalRun))return '거점에 학생을 받을 공간이 없어요.';
 if(choice==='mark'&&debateWater(b)<1)return '현장에 남길 휴대 생수가 없어요.';return null;
}
export function decideSupplyDebate(state,choice){
 const blocked=supplyDebateBlocked(state,choice);if(blocked)throw new Error(blocked);
 const s=structuredClone(state),b=s.combatTrial,e=b.supplyDebate;e.choice=choice;e.reason=supplyDebateChoices[choice].reason;e.phase='chosen';b.frames=[];
 if(choice==='rescue')b.noise+=2;
 if(choice==='mark'){if(b.items.water>0)b.items.water--;else b.stash.items.water--;}
 const text='태이 · '+supplyDebateChoices[choice].label;b.log=[text,choice==='rescue'?'학생 옆에서 동행을 도운 뒤 파티 전원이 탈출해야 구조가 확정된다.':choice==='mark'?'생수 한 병을 남기고 위치를 적었다. 함께 돌아왔거나 이후 상태까지 확인한 것은 아니다.':'이번에는 파티의 귀환을 먼저 택했다. 요청을 들은 위치는 기억해 두었다.'];b.history.push({turn:b.turn,text});return s;
}
export function canEscortSupplyStudent(b,a){const e=b?.supplyDebate;return !!e&&e.phase==='chosen'&&e.choice==='rescue'&&!e.rescued&&a&&!a.down&&!a.escaped&&a.ap>0&&a.stamina>=8&&Math.abs(a.x-e.student.x)+Math.abs(a.y-e.student.y)===1;}
export function escortSupplyStudent(b,a){if(!canEscortSupplyStudent(b,a))throw new Error('구조를 결정한 뒤 학생 옆에서 행동력 1과 스태미나 8이 필요해요.');a.ap--;a.stamina-=8;b.supplyDebate.rescued=true;b.log.push('학생이 일행을 따라온다. 파티 전원이 함께 탈출해야 거점까지 구조할 수 있다.');}
export function supplyRescueRequired(b){return b?.supplyDebate?.choice==='rescue'&&!b.supplyDebate.rescued;}
function applyDebateBond(state,m,delta){
 const r=state.survivalRun,key=m.recruitId??'member:'+m.key;r.parties.bonds[key]??={familiarity:0,trust:0,affection:0,tension:0,...debateBond(state,m)};
 for(const [field,value] of Object.entries(delta))r.parties.bonds[key][field]=Math.max(0,Math.min(100,(r.parties.bonds[key][field]??0)+value));
}
export function finishSupplyDebate(state,b,won){
 const e=b.supplyDebate,r=state.survivalRun;if(!e)return '';if(won&&(e.phase==='decision'||e.choice==='rescue'&&!e.rescued))throw new Error('동료들과 정한 구조 목표를 마친 뒤 복귀하세요.');
 const stories=r.supplyStories??={version:1,sites:{},records:[]};if(stories.records.some(record=>record.id===e.id))return '';
 const saved=won&&e.rescued&&e.choice==='rescue';if(saved&&debateLiving(r).length>=survivalResidentCapacity(r))throw new Error('구조한 학생을 받을 거점 공간을 확인하세요.');
 if(saved){const number=r.members.filter(m=>m.key.startsWith('rescued-')).length+1;r.members.push({key:'rescued-'+number,partyConsent:false,character:'student',label:(e.site==='kiosk'?'매점':'편의점')+' 창고에서 구조한 학생',job:'rest',fatigue:50,stress:40,injury:1,nutrition:35,hydration:35,woundDays:0,woundRisk:0,caredDay:null});}
 const newInjuries=Object.entries(b.actors).filter(([k,a])=>a.wounds>(e.initialWounds[k]??0)),harm=!won||newInjuries.length>0,keptPromise=saved&&e.previousMark,record={id:e.id,site:e.site,day:r.day,choice:e.choice,reason:e.reason,success:won,rescued:saved,newInjuries:newInjuries.map(([k])=>k),harm,keptPromise,debrief:null,reactions:[]};
 for(const opinion of e.opinions){const m=r.members.find(m=>m.key===opinion.key);if(!m)continue;let tone='understood',delta={familiarity:1},line;
  if(saved){if(harm){tone='concern';line='데리고 나온 건 다행인데, 우리도 다쳤잖아. 다음엔 빠져나올 길부터 보고 들어가자.';if(opinion.stance==='withdraw')delta.tension=1;}else{line=opinion.stance==='withdraw'?'난 위험할 줄 알았어. 그래도 다 같이 돌아와서 다행이야. 진짜로.':'다 같이 돌아왔네. 아… 이제 좀 마음 놓인다.';delta.trust=1;}if(keptPromise&&e.promiseWitnesses.includes(m.key)){line='전에 준비해서 다시 오자고 했던 말을 지켰네. '+line;delta.trust=(delta.trust??0)+1;}}
  else if(e.choice==='rescue'){tone='concern';line='도와주고 싶었던 건 알아. 그래도 데리고 못 나왔잖아. 일단 우리부터 좀 추스르자.';if(opinion.stance==='withdraw'&&harm)delta.tension=1;}
  else if(e.choice==='mark'){line='다시 오자고 한 거, 잊지 말자. 물만 두고 끝내면 안 되잖아.';}
  else if(opinion.stance==='rescue'){tone='unresolved';line=e.context.wounded||e.context.water<e.context.size||e.context.food<e.context.size?'두고 나온 건 마음에 걸려. 그래도 우리 상태와 배급부터 지키자고 한 이유는 이해했어.':'나는 데리고 올 수 있을 줄 알았어. 아까 왜 돌아가자고 한 거야? 좀 얘기해줄래?';}
  else line='우리도 살아야지. 그래도 거기 사람 있던 건 잊지 말자.';
  if(!e.choice){delta={};tone='unfinished';line='목소리는 들었지만 함께 결정을 내리기 전에 원정을 중단했네. 다음에는 상황부터 다시 확인하자.';}
  applyDebateBond(state,m,delta);const memory={id:e.id,site:e.site,day:r.day,choice:e.choice,reason:e.reason,stance:opinion.stance,heard:e.opinions.filter(o=>o.key!==m.key).map(o=>({key:o.key,name:o.name,stance:o.stance})),harm,rescued:saved,tone,source:'witnessed',line};m.supplyMemories=[...(m.supplyMemories??[]),memory].slice(-12);record.reactions.push({key:m.key,name:opinion.name,stance:opinion.stance,tone,line});
 }
 stories.sites[e.site]={status:saved?'rescued':e.choice==='mark'||e.previousMark?'marked':'unresolved',day:r.day,lastChoice:e.choice,promiseWitnesses:saved?[]:e.choice==='mark'?[...new Set([...e.promiseWitnesses,...e.opinions.map(o=>o.key)])]:e.promiseWitnesses};stories.records.push(record);stories.records=stories.records.slice(-40);e.settled=true;
 return saved?'창고 학생을 거점까지 데리고 돌아왔다. 파티 동행은 회복 뒤 별도로 물어볼 수 있다.':e.choice==='mark'?'구조 요청의 위치와 남긴 물을 기록했다. 다음 방문에서 다시 확인할 수 있다.':'이번에 구조한 학생은 없다. 동료들은 선택한 이유와 확인한 결과를 기억한다.';
}
export function discussSupplyAftermath(state,id,reply){
 const r0=state.survivalRun;if(!r0||r0.status!=='active'||r0.activeSortie||!['listen','explain'].includes(reply))throw new Error('거점에 돌아와 동료들과 이야기하세요.');const record=r0.supplyStories?.records.find(e=>e.id===id);if(!record||record.debrief)throw new Error('지금 이어갈 복귀 대화가 없어요.');
 const s=structuredClone(state),r=s.survivalRun,entry=r.supplyStories.records.find(e=>e.id===id);entry.debrief=reply;entry.heardBy=[];
 for(const reaction of entry.reactions){const m=r.members.find(m=>m.key===reaction.key);if(!m||m.deployment||['away','departed'].includes(m.mind?.state))continue;entry.heardBy.push(m.key);if(reply==='listen')applyDebateBond(s,m,{trust:1,tension:-1});else applyDebateBond(s,m,{familiarity:1});const memory=m.supplyMemories?.find(e=>e.id===id);if(memory)memory.discussed=reply;}
 const text=reply==='listen'?'선택에 동의했는지부터 따지지 않고 동료들이 걱정했던 점을 다시 들었다. 다음 원정에서는 부상과 돌아올 길을 먼저 함께 확인하기로 했다.':'그때 선택한 이유와 실제로 확인한 결과를 나눴다. 구조 의도만으로 결과를 덮지 않고 남은 일과 부상을 짚었다.';r.log=[text];r.history.push({day:r.day,text});return s;
}
