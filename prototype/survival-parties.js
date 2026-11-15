import {enabledAttributes,entityAbilities,characterPresent} from './character-stats.js';
import {contact,displayName,identities} from './identity.js';
import {survivalCondition,advanceSurvivalHealth} from './survival-health.js';
import {survivalRoomCatalog} from './survival-exploration.js';
export const survivalPartyLimit=6;
export function survivalResidentCapacity(r){return r.base?(survivalRoomCatalog[r.base.site]?.capacity??0)+(r.base.facilities.includes('annex')?6:0):Math.max(...Object.values(survivalRoomCatalog).map(site=>site.capacity));}
export function partyMemberName(state,m){return m?.label??(m?.character==='student'?'함께 있는 학생':displayName(state,m?.character));}
export function playerSurvivalParty(r){return r.parties?.groups.find(p=>p.members.includes('taei'))??null;}
export function currentSurvivalMembers(r){const p=playerSurvivalParty(r);return p?r.members.filter(m=>p.members.includes(m.key)):r.members.filter(m=>['taei','ally'].includes(m.key));}
export function ensureSurvivalParties(state){
 const r=state.survivalRun;if(!r)return state;
 if(!r.parties)for(const m of r.members)m.partyConsent??=true;
 r.parties??={version:1,sequence:1,groups:[{id:'party-1',name:'태이 파티',members:r.members.filter(m=>['taei','ally'].includes(m.key)&&m.mind?.state!=='departed').map(m=>m.key),mission:null}],encounters:{},meeting:null,bonds:{},invites:[],reports:[]};r.parties.groups=r.parties.groups.map(p=>({...p,members:p.members.filter(k=>r.members.some(m=>m.key===k&&m.mind?.state!=='departed'))})).filter(p=>p.members.length);return state;
}
function partyReady(state){const r=state.survivalRun;if(!r||r.status!=='active'||r.activeSortie||r.kit?.pending)throw new Error('진행 중인 원정과 발견 물자를 먼저 정리하세요.');return r;}
function partyLog(r,text){r.log=[text];r.history.push({day:r.day,text});}
export function partyMemberFree(r,key){const m=r.members.find(m=>m.key===key);return !!m&&!m.deployment&&!['away','departed','panic'].includes(m.mind?.state);}
export function createSurvivalParty(state,key,name='새 파티'){
 partyReady(state);const s=structuredClone(state);ensureSurvivalParties(s);const r=s.survivalRun,sys=r.parties;if(r.members.find(m=>m.key===key)?.partyConsent===false||!partyMemberFree(r,key)||key==='taei'||sys.groups.some(p=>p.members.includes(key)))throw new Error('대기 중인 동료 한 명을 먼저 골라 주세요.');
 const clean=String(name).trim().slice(0,24);if(!clean)throw new Error('파티 이름을 적어 주세요.');sys.sequence++;sys.groups.push({id:'party-'+sys.sequence,name:clean,members:[key],mission:null});partyLog(r,clean+'을 편성했다. 한 파티는 1~6명이다.');return s;
}
export function moveSurvivalPartyMember(state,key,destination){
 partyReady(state);const s=structuredClone(state);ensureSurvivalParties(s);const r=s.survivalRun,sys=r.parties,source=sys.groups.find(p=>p.members.includes(key)),target=sys.groups.find(p=>p.id===destination);
 if(key==='taei')throw new Error('태이는 자신의 파티에 남아요. 다른 동료를 편성해 주세요.');if(r.members.find(m=>m.key===key)?.partyConsent===false&&destination!=='reserve')throw new Error('먼저 동행할 뜻이 있는지 물어봐 주세요.');if(!partyMemberFree(r,key)||source?.mission||target?.mission)throw new Error('임무 중이거나 움직일 수 없는 동료의 편성은 바꿀 수 없어요.');
 if(destination!=='reserve'&&!target)throw new Error('편성할 파티를 선택하세요.');if(source===target)return s;if(target&&target.members.length>=6)throw new Error('한 파티에는 최대 6명까지만 들어갈 수 있어요.');
 if(source)source.members=source.members.filter(k=>k!==key);sys.groups=sys.groups.filter(p=>p.members.length);if(target)target.members.push(key);partyLog(r,partyMemberName(s,r.members.find(m=>m.key===key))+'의 편성을 '+(target?.name??'거점 대기')+'로 바꿨다.');return s;
}
export function renameSurvivalParty(state,id,name){partyReady(state);const s=structuredClone(state);ensureSurvivalParties(s);const p=s.survivalRun.parties.groups.find(p=>p.id===id),clean=String(name).trim().slice(0,24);if(!p||p.mission||!clean)throw new Error('대기 중인 파티와 이름을 확인하세요.');p.name=clean;return s;}
export function dissolveSurvivalParty(state,id){partyReady(state);const s=structuredClone(state);ensureSurvivalParties(s);const r=s.survivalRun,p=r.parties.groups.find(p=>p.id===id);if(!p||p.mission||p.members.includes('taei'))throw new Error('태이 파티와 임무 중인 파티는 해산할 수 없어요.');r.parties.groups=r.parties.groups.filter(g=>g.id!==id);partyLog(r,p.name+'을 해산했다. 동료들은 거점에서 대기한다.');return s;}
const partyEncounterCast=['yeogyeong','seoyeon','soyul','iseo','dogyeom',...Array.from({length:8},(_,i)=>'survivor-'+(i+1))];
export function survivalEncounterChoices(state){const r=state.survivalRun;if(!r)return [];return partyEncounterCast.filter(id=>!r.members.some(m=>m.character===id||m.recruitId===id)&&(!partyEncounterCast.slice(0,5).includes(id)||characterPresent(state,id)));}
export function meetSurvivalRecruit(state,id){
 const r0=partyReady(state);if(r0.actions<1)throw new Error('주변 사람을 만나려면 행동 여력 1이 필요해요.');const s=structuredClone(state);ensureSurvivalParties(s);const r=s.survivalRun,sys=r.parties;
 const candidate=id??survivalEncounterChoices(s).find(k=>sys.encounters[k]?.lastMetDay!==r.day);if(!survivalEncounterChoices(s).includes(candidate))throw new Error('지금 만날 수 있는 사람을 확인하세요.');if(sys.encounters[candidate]?.lastMetDay===r.day)throw new Error('오늘은 이미 이야기를 나눈 자리예요.');
 const known=partyEncounterCast.slice(0,5).includes(candidate),index=partyEncounterCast.indexOf(candidate);sys.encounters[candidate]??={id:candidate,character:known?candidate:'student',label:known?null:'복도에서 만난 학생 '+candidate.split('-')[1],scene:index%3===0?'supplies':index%3===1?'injured':'waiting',waitUntil:index%3===2?r.day+1:0};
 const e=sys.encounters[candidate];e.lastMetDay=r.day;sys.meeting=candidate;sys.bonds[candidate]??={familiarity:0,trust:0,affection:0,tension:0,...(known?state.relations?.[candidate+'>taei']??{}:{})};r.actions--;
 partyLog(r,'복도에서 '+partyMemberName(s,e)+'과 마주쳤다. '+({supplies:'물자를 나눠 들 방법을 찾고 있다.',injured:'작은 상처를 누른 채 잠깐 쉬고 있다.',waiting:'함께 오기로 한 사람을 기다리고 있다.'}[e.scene]));return s;
}
export function meetSurvivalResident(state,key){
 const r0=partyReady(state);if(r0.actions<1)throw new Error('동행 이야기를 나누려면 행동 여력 1이 필요해요.');const s=structuredClone(state);ensureSurvivalParties(s);const r=s.survivalRun,m=r.members.find(m=>m.key===key);if(!m||m.partyConsent!==false||!partyMemberFree(r,key))throw new Error('지금 거점에서 동행을 논의할 사람을 확인하세요.');const id='resident-'+key,sys=r.parties;sys.encounters[id]??={id,character:m.character,label:partyMemberName(s,m),existingKey:key,scene:m.injury>0?'injured':'supplies',waitUntil:0};const e=sys.encounters[id];if(e.lastMetDay===r.day)throw new Error('오늘은 이미 이야기를 나눈 자리예요.');e.lastMetDay=r.day;sys.meeting=id;sys.bonds[id]??={familiarity:6,trust:6,affection:2,tension:0,...(state.relations?.[m.character+'>taei']??{})};r.actions--;partyLog(r,partyMemberName(s,m)+'에게 앞으로 동행할 생각이 있는지 물을 자리를 마련했다.');return s;
}
export function discussSurvivalRecruit(state,action){
 const r0=partyReady(state),id=r0.parties?.meeting;if(!id)throw new Error('먼저 실제로 마주친 사람과 이야기하세요.');if(r0.actions<1)throw new Error('이야기하거나 돕는 데 행동 여력 1이 필요해요.');const s=structuredClone(state),r=s.survivalRun,sys=r.parties,e=sys.encounters[id],bond=sys.bonds[id];if(e.lastMetDay!==r.day)throw new Error('다음 만남에서 다시 이야기하세요.');let text;
 if(action==='listen'){if(e.talkDay===r.day)throw new Error('오늘은 이미 서로의 사정을 들었어요.');e.talkDay=r.day;bond.familiarity=Math.min(100,bond.familiarity+4);bond.trust=Math.min(100,bond.trust+3);bond.affection=Math.min(100,bond.affection+1);text='서로 어디까지 함께할 수 있을지 듣고, 대답을 재촉하지 않았다.';if(identities[e.character]&&!contact(s,e.character).introduced&&!e.introduced){e.label=identities[e.character].name;e.introduced=true;text='“저는 '+e.label+'이에요.” '+text;}}
 else if(action==='help'){if(e.helpDay===r.day)throw new Error('오늘 도울 수 있는 일은 이미 도왔어요.');const item=e.scene==='injured'?'bandage':'water',source=(r.kit?.items[item]??0)>0?r.kit.items:r.resources;if(!(source[item]>0))throw new Error((item==='bandage'?'붕대':'생수')+' 1개가 필요해요.');source[item]--;e.helpDay=r.day;bond.familiarity=Math.min(100,bond.familiarity+3);bond.trust=Math.min(100,bond.trust+8);bond.affection=Math.min(100,bond.affection+2);text='가진 '+(item==='bandage'?'붕대':'물')+'를 나누고 지금 필요한 일을 도왔다. 함께하라는 조건을 붙이지 않았다.';}
 else throw new Error('대화 방법을 확인하세요.');r.actions--;partyLog(r,text);return s;
}
export function survivalRecruitDecision(state,id,partyId){
 const r=state.survivalRun,sys=r?.parties,e=sys?.encounters[id],p=sys?.groups.find(p=>p.id===partyId),b=sys?.bonds[id];if(!e||e.lastMetDay!==r.day||sys.meeting!==id||!p||!b)return {accepted:false,reason:'먼저 그 사람을 만나 어떤 파티인지 이야기해야 해요.'};
 const snapshot={familiarity:b.familiarity,trust:b.trust,affection:b.affection,tension:b.tension};
 if(p.mission||p.members.length>=6)return {accepted:false,reason:'지금 그 파티에는 합류할 자리가 없네요.',snapshot};
 if(!e.existingKey&&r.members.filter(m=>m.mind?.state!=='departed').length>=survivalResidentCapacity(r))return {accepted:false,reason:'함께 지낼 공간부터 마련해 주세요.',snapshot};
 if(e.waitUntil>r.day)return {accepted:false,reason:'기다리기로 한 사람이 있어요. 오늘은 그 약속을 먼저 지킬게요.',snapshot};
 if(r.threat>=85&&b.trust<35)return {accepted:false,reason:'지금 동선은 너무 위험해 보여요. 아직은 그 위험까지 함께 감수하기 어렵겠어요.',snapshot};
 if(b.trust<8)return {accepted:false,reason:'아직 서로를 믿고 움직일 만큼 알지는 못하겠어요. 지금은 따로 갈게요.',snapshot};
 if(b.tension>=15)return {accepted:false,reason:'지난 일에 대한 불편함이 남아 있어요. 지금 같은 파티에 들어가기는 어렵겠어요.',snapshot};
 const score=b.familiarity*.3+b.trust*.55+b.affection*.15-b.tension*.5,threshold=e.character==='soyul'?16:e.character==='iseo'?10:12;
 return score>=threshold?{accepted:true,reason:'무조건 따라가겠다는 뜻은 아니지만, 지금까지 본 행동은 믿어볼 수 있겠어요. 그 파티에서 함께해요.',snapshot,score}:{accepted:false,reason:'호의는 고마워요. 그래도 함께 위험을 감수할 만큼 가까워졌는지는 조금 더 생각하고 싶어요.',snapshot,score};
}
export function inviteSurvivalRecruit(state,partyId){
 partyReady(state);const s=structuredClone(state);ensureSurvivalParties(s);const r=s.survivalRun,sys=r.parties,id=sys.meeting;if(!id||sys.encounters[id]?.lastMetDay!==r.day)throw new Error('오늘 실제로 만난 사람에게 제안하세요.');if(!sys.groups.some(p=>p.id===partyId))throw new Error('제안할 파티를 확인하세요.');if(sys.invites.some(i=>i.id===id&&i.day===r.day))throw new Error('오늘 들은 답은 존중하고 다음 만남을 기다려 주세요.');
 const decision=survivalRecruitDecision(s,id,partyId),e=sys.encounters[id];sys.invites.push({id,day:r.day,partyId,...decision});
 if(decision.accepted){const key=e.existingKey??(!r.members.some(m=>m.key==='ally')?'ally':'recruit-'+(sys.invites.length+sys.sequence)),m={key,partyConsent:true,recruitId:id,character:e.character,...(e.label?{label:e.label}:{}),...enabledAttributes(s,e.character),job:'rest',fatigue:25,stress:25,injury:e.scene==='injured'&&!e.helpDay?1:0,nutrition:70,hydration:70,woundDays:0,woundRisk:0,caredDay:null};if(e.existingKey){const resident=r.members.find(m=>m.key===e.existingKey);resident.partyConsent=true;resident.recruitId=id;}else r.members.push(m);sys.groups.find(p=>p.id===partyId).members.push(key);sys.meeting=null;}
 partyLog(r,partyMemberName(s,e)+': “'+decision.reason+'”');return s;
}
export function dispatchSurvivalParty(state,id,kind){
 const r0=partyReady(state);if(!r0.base||r0.actions<1)throw new Error('거점과 행동 여력 1이 필요해요.');if(!['supply','guard'].includes(kind))throw new Error('파티 임무를 확인하세요.');const s=structuredClone(state);ensureSurvivalParties(s);const r=s.survivalRun,p=r.parties.groups.find(p=>p.id===id);
 if(!p||p.members.includes('taei')||p.mission)throw new Error('다른 대기 중인 파티를 선택하세요.');const team=r.members.filter(m=>p.members.includes(m.key));if(team.length!==p.members.length||team.some(m=>!partyMemberFree(r,m.key)||survivalCondition(m).critical||m.fatigue>=75||m.nutrition<=35||m.hydration<=35))throw new Error('파티원이 몸 상태를 회복한 뒤 임무를 맡겨 주세요.');
 const n=team.length;if(r.resources.food<n||r.resources.water<n)throw new Error('출발 배급으로 파티원마다 공동 식량 1·물 1이 필요해요.');
 r.resources.food-=n;r.resources.water-=n;r.actions--;p.mission={kind,day:r.day,members:[...p.members],threat:r.threat};for(const m of team){m.deployment=p.id;m.job='rest';}partyLog(r,p.name+'이 '+(kind==='supply'?'별도 보급':'주변 경계')+' 임무를 맡았다. 출발 배급을 챙겼으며 하루를 마칠 때 복귀한다.');return s;
}
export function resolveSurvivalPartyMissions(state){
 const r=state.survivalRun,events=[];if(!r?.parties)return events;
 for(const p of r.parties.groups){const mission=p.mission;if(!mission)continue;const team=r.members.filter(m=>mission.members.includes(m.key)),power=team.reduce((n,m)=>n+entityAbilities(m).endurance+entityAbilities(m).mentality+entityAbilities(m).agility,0)/Math.max(1,team.length),success=mission.kind==='guard'||mission.threat<65+power;
  for(const m of team){delete m.deployment;m.fatigue=Math.min(100,m.fatigue+(success?18:30));m.stress=Math.min(100,m.stress+(success?4:16));if(!success)m.injury=Math.min(3,m.injury+1);}
  advanceSurvivalHealth({members:team,status:'active'},team.length,team.length,r.day);
  if(success&&mission.kind==='supply'){r.resources.food+=team.length+2;r.resources.water+=team.length+2;}else if(success)r.threat=Math.max(0,r.threat-12-team.length*2);else r.threat=Math.min(100,r.threat+6);
  const text=p.name+' · '+(success?mission.kind==='supply'?'보급 물자를 가지고 복귀했다.':'주변 접근을 살피고 복귀했다.':'위험이 커져 물러났다. 새 보급은 없고 부상을 돌봐야 한다.');events.push(text);r.parties.reports.push({partyId:p.id,day:r.day,kind:mission.kind,success,members:[...mission.members],text});p.mission=null;
 }return events;
}
