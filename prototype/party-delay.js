import {partyMemberName,partyMemberFree} from './survival-parties.js';
import {survivalCondition} from './survival-health.js';
const delayClamp=n=>Math.max(0,Math.min(100,n));
export function partyDelayOpinions(state,event){
 const r=state.survivalRun;
 return r.members.filter(m=>m.key!=='taei'&&partyMemberFree(r,m.key)).map(m=>{
  const b=r.parties.bonds[m.recruitId??'member:'+m.key]??state.relations?.[m.character+'>taei']??{},friend=event.members.some(k=>{const other=r.members.find(a=>a.key===k);return (state.relations?.[m.character+'>'+other?.character]?.affection??0)>=40;}),strained=m.injury>0||m.hydration<=35||m.fatigue>=65,short=r.resources.food<r.members.filter(a=>!a.deployment).length;
  const helped=m.partyRescueMemories?.some(v=>v.rescued);const choice=strained||short?'recall':friend||b.trust>=20||helped?'direct':'wait';
  return {key:m.key,name:partyMemberName(state,m),choice,line:choice==='recall'?'우리도 지금 나가기 힘들잖아요. 물건은 두고, 돌아올 수 있는 길로 오라고 해요.':choice==='direct'?(helped?'지난번에도 서로 데리러 갔잖아요. 이번에도 그냥 두고 싶진 않아요.':friend?'거기 제 친구도 있잖아요. 저도 데리러 가고 싶어요.':'우리가 보낸 사람들이잖아요. 데리러 가요.'):'어디 있는지는 알았으니까, 무전 한 번만 더 기다려봐요. 그동안 갈 길도 좀 보고요.'};
 });
}
export function openPartyDelay(state,p){
 const r=state.survivalRun,sys=r.parties;sys.delays??=[];
 const event={id:'delay-'+p.id+'-'+p.mission.day,partyId:p.id,name:p.name,day:r.day,members:[...p.mission.members],status:'pending',location:'편의점 뒤편 연결 통로',radio:'“연결 통로가 막혔어요. 한 명이 발목을 다쳤어요. 아직 안쪽 방은 안전해요.”',waits:0,lastUpdateDay:r.day,choices:[],opinions:[],initialInjuries:{}};
 for(const m of r.members.filter(m=>event.members.includes(m.key))){event.initialInjuries[m.key]=m.injury;if(m.key===event.members[0])m.injury=Math.min(2,m.injury+1);m.fatigue=delayClamp(m.fatigue+15);}
 p.mission.delayId=event.id;event.opinions=partyDelayOpinions(state,event);sys.delays.push(event);return event;
}
export function settlePartyDelay(state,event,method){
 if(event.status==='resolved')return '';const r=state.survivalRun,p=r.parties.groups.find(p=>p.id===event.partyId),rescued=['direct','backup'].includes(method),helpers=event.backupId?r.parties.groups.find(p=>p.id===event.backupId):null;
 for(const m of r.members.filter(m=>event.members.includes(m.key)||(event.helpers??[]).includes(m.key))){delete m.deployment;m.job='rest';m.fatigue=delayClamp(m.fatigue+(rescued?12:22));m.stress=delayClamp(m.stress+(rescued?-5:8));if(!rescued)m.injury=Math.min(3,m.injury+1);m.partyRescueMemories??=[];m.partyRescueMemories.push({id:event.id,day:r.day,method,role:event.members.includes(m.key)?'stranded':'helper',rescued});m.partyRescueMemories=m.partyRescueMemories.slice(-12);
  const key=m.recruitId??'member:'+m.key,b=r.parties.bonds[key]??={familiarity:0,trust:0,affection:0,tension:0,...state.relations?.[m.character+'>taei']};if(rescued)b.trust=delayClamp(b.trust+3);
 }
 if(p)p.mission=null;if(helpers)helpers.mission=null;event.status='resolved';event.method=method;event.returnDay=r.day;event.result=rescued?'막힌 연결 통로를 확보하고 원래 파티 전원과 귀환했다. 보급 물자는 두고 사람을 데려왔다.':'물자를 버리고 우회해 전원 귀환했다. 긴 이동으로 피로와 부상이 늘었다.';r.parties.reports.push({partyId:event.partyId,day:r.day,kind:'delayed-return',success:rescued,members:[...event.members],text:event.name+' · '+event.result});return event.result;
}
export function advancePartyDelays(state,nightDay=state.survivalRun.day-1){
 const r=state.survivalRun,out=[];
 for(const e of r.parties?.delays??[]){if(e.status==='resolved'||(e.lastUpdateDay??e.day)>=nightDay)continue;e.lastUpdateDay=nightDay;
  if(e.status==='backup'){const helpers=r.members.filter(m=>(e.helpers??[]).includes(m.key)),ready=helpers.length>0&&helpers.every(m=>!survivalCondition(m).critical)&&helpers.length>=Math.ceil(e.members.length/2)&&r.threat<90;out.push(settlePartyDelay(state,e,ready?'backup':'recall'));}
  else if(e.status==='pending'){e.waits++;for(const m of r.members.filter(m=>e.members.includes(m.key))){m.hydration=delayClamp(m.hydration-15);m.nutrition=delayClamp(m.nutrition-10);m.fatigue=delayClamp(m.fatigue+8);}e.radio='“아직 통로를 못 넘었어요. 물이 줄고 있어요. 더 늦으면 물자를 두고 우회할게요.”';if(e.waits>=2)out.push(settlePartyDelay(state,e,'fallback'));else out.push(e.name+'에서 다시 무전이 왔다. 아직 연결 통로 안쪽에서 기다리고 있다.');}
 }return out;
}
export function decidePartyDelay(state,id,choice,backupId){
 const r0=state.survivalRun,e0=r0?.parties?.delays?.find(e=>e.id===id);if(!r0||r0.status!=='active'||r0.activeSortie||r0.kit?.pending||e0?.status!=='pending')throw new Error('거점에서 진행 중인 귀환 지연 요청을 확인하세요.');if(!['wait','recall','backup'].includes(choice))throw new Error('대응 방법을 확인하세요.');
 const s=structuredClone(state),r=s.survivalRun,e=r.parties.delays.find(e=>e.id===id);if(e.choices.some(c=>c.day===r.day&&c.choice==='wait')&&choice==='wait')throw new Error('오늘은 이미 연락을 기다리기로 했어요. 하루를 마치면 다음 무전이 옵니다.');
 if(choice==='wait'){e.radio='“안쪽 방에서 대기할게요. 다음 연락 때까지 통로를 살펴볼게요.”';}
 else if(choice==='recall')settlePartyDelay(s,e,'recall');
 else{const p=r.parties.groups.find(p=>p.id===backupId),team=r.members.filter(m=>p?.members.includes(m.key));if(!p||p.mission||p.members.includes('taei')||!team.length||team.some(m=>!partyMemberFree(r,m.key)||survivalCondition(m).critical||m.fatigue>=75||m.hydration<=35||m.nutrition<=35))throw new Error('움직일 수 있는 다른 대기 파티를 골라 주세요.');if(r.actions<1||r.resources.food<team.length||r.resources.water<team.length)throw new Error('여력 1과 구조팀 인원마다 공동 식량·물 1이 필요해요.');r.actions--;r.resources.food-=team.length;r.resources.water-=team.length;e.status='backup';e.backupId=p.id;e.helpers=[...p.members];p.mission={kind:'party-rescue',day:r.day,members:[...p.members],delayId:e.id};for(const m of team)m.deployment=p.id;}
 e.choices.push({choice,day:r.day,backupId:backupId??null});r.log=[choice==='wait'?'다음 무전을 기다리기로 했다. 대기 중에도 현지 물과 체력이 줄어든다.':choice==='backup'?'구조 파티가 출발했다. 다음 날 인원과 몸 상태, 위협에 따라 귀환 결과가 온다.':e.result];r.history.push({day:r.day,text:r.log[0]});return s;
}
export function preparePartyRescueBattle(b,event){b.partyRescue={id:event.id,partyId:event.partyId,members:[...event.members]};b.protection.id='stranded-party';b.protection.label=event.name+'의 부상자';b.survivalContext={kind:'partyRescue',title:event.name+' 귀환 지원',location:event.location};b.log=['부상자를 지키며 적 턴 4번 동안 막힌 통로를 확보하세요. 성공하면 기존 파티 전원이 복귀합니다.'];}
export function finishPartyRescue(state,b,won){const e=state.survivalRun.parties.delays.find(e=>e.id===b.partyRescue?.id);if(!e||e.status!=='direct')throw new Error('연결된 구조 요청을 찾을 수 없어요.');if(won){if(b.mission!=='protect'||b.protection?.down||b.protection?.held<4)throw new Error('부상 파티를 보호하고 통로를 확보해야 합니다.');const injured=state.survivalRun.members.find(m=>m.key===e.members[0]);if(injured)injured.injury=Math.min(3,injured.injury+(b.protection.wounds??0));e.helpers=[...(state.survivalRun.activeSortie.members??Object.keys(b.actors))];return settlePartyDelay(state,e,'direct');}const injured=state.survivalRun.members.find(m=>m.key===e.members[0]);if(injured)injured.injury=Math.min(3,injured.injury+(b.protection?.wounds??0));e.status='pending';e.radio='“다시 돌아가셨다면서요. 저희는 아직 안에 있어요. 어떻게 하면 돼요?”';return '구조 지원이 중단됐다. 원래 파티는 현장에 남아 있으며 재지원이나 복귀 지시를 선택할 수 있다.';}
