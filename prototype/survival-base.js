import {survivalRoomCatalog,createSurvivalExploration,ensureSurvivalExploration,survivalSiteObservation,inspectSurvivalRoom,recordSurvivalClearance} from './survival-exploration.js';
import {scheduleCampIncident,finishCampStories} from './camp-incidents.js';
import {contact,displayName} from './identity.js';
import {startGridCombat} from './combat-grid.js';
import {combatMissionWon} from './combat-missions.js';
export const survivalSites=survivalRoomCatalog;
export const survivalFacilities={
 barricade:{name:'출입문 바리케이드',cost:2,effect:'야간 방어 +20'},
 beds:{name:'휴식용 침상',cost:2,effect:'밤마다 전원 피로 8 추가 회복'},
 clinic:{name:'응급처치 공간',cost:3,effect:'치료 담당이 붕대 1개로 부상자 1명 치료'},
 workshop:{name:'정비 작업대',cost:3,effect:'정비 담당이 부품 1개로 문 상태 12 복구'}
};
export const survivalJobs={rest:'휴식',watch:'감시',care:'치료',repair:'정비'};
const survivalClamp=n=>Math.max(0,Math.min(100,Math.round(n)));
export function survivalCompanions(state){return ['student',...['yeogyeong','seoyeon','soyul','iseo','dogyeom'].filter(id=>contact(state,id).introduced)];}
export function survivalMemberName(state,member){return member.label??(member.character==='student'?'함께 탈출한 학생':displayName(state,member.character));}
export function startSurvival(state,ally='student',{seed=Math.floor(Math.random()*4294967296)}={}){
 if(state.survivalRun)throw new Error('이미 진행 중인 생존 기록이 있어요. 저장된 흐름을 이어가세요.');
 if(!survivalCompanions(state).includes(ally))throw new Error('현재 알고 있는 동료를 골라 주세요.');
 const s=structuredClone(state),person=(key,character)=>({key,character,job:'rest',fatigue:15,stress:20,injury:0});
 s.survivalRun={version:1,exploration:createSurvivalExploration(seed),story:{seed:seed>>>0,last:[],checkedDay:0,current:null,pending:[],resolved:[]},status:'active',stage:'flight',day:1,actions:3,escapes:0,threat:24,shortage:0,resources:{food:6,water:6,bandage:2,parts:4},members:[person('taei','taei'),person('ally',ally)],scouted:{},secured:{},base:null,searchDay:0,sortieSequence:0,activeSortie:null,completedSorties:[],log:['사태 첫날. 아직 머무를 곳은 없다. 동료와 흩어지지 않고 오늘을 넘기는 것부터 생각한다.'],history:[]};return s;
}
export function restartSurvival(state){
 const r=state.survivalRun;if(!r||r.status!=='overrun'||r.activeSortie)throw new Error('끝난 생존 기록만 새로 시작할 수 있어요.');const s=structuredClone(state),ally=r.members.find(m=>m.key==='ally')?.character??'student';delete s.survivalRun;return startSurvival(s,ally);
}
function survivalReady(s,{base=false,actions=0}={}){const r=s.survivalRun;if(!r||r.status!=='active')throw new Error('진행 중인 생존 기록이 없어요.');if(r.activeSortie)throw new Error('진행 중인 작전으로 돌아가거나 중단 후 복귀하세요.');if(base&&!r.base)throw new Error('먼저 거점을 확보하세요.');if(r.actions<actions)throw new Error('오늘 행동 여력이 부족해요. 하루를 마무리하세요.');return r;}
function survivalLog(r,text){r.log=[text];r.history.push({day:r.day,text});}
export function survivalDefense(r){if(!r?.base)return 0;const site=survivalSites[r.base.site];return Math.max(0,site.defense-(r.base.exposure??0)+(r.base.facilities.includes('barricade')?20:0)-Math.floor((100-r.base.integrity)/3));}
export function survivalNightRisk(r){const watchers=r.members.filter(m=>m.job==='watch'&&m.fatigue<80).length;return Math.max(0,r.threat-survivalDefense(r)-watchers*10);}
export function survivalAction(state,action){
 survivalReady(state,{actions:1});const s=structuredClone(state),r=s.survivalRun;
 if(action==='hide'){r.actions--;r.threat=survivalClamp(r.threat-10);for(const m of r.members){m.fatigue=survivalClamp(m.fatigue-12);m.stress=survivalClamp(m.stress-8);}survivalLog(r,'소리를 줄이고 잠깐 몸을 숨겼다. 위협과 피로가 조금 가라앉았다.');}
 else if(action==='search'){if(r.searchDay===r.day)throw new Error('오늘 주변에서 안전하게 챙길 물자는 이미 확인했어요.');r.actions--;r.searchDay=r.day;r.resources.food+=2;r.resources.water++;r.threat=survivalClamp(r.threat+5);survivalLog(r,'주변 가방과 열린 보관함에서 식량 2와 생수 1을 챙겼다. 돌아다닌 흔적이 남았다.');}
 else if(action==='treat'){const patient=r.members.find(m=>m.injury>0);if(!patient||r.resources.bandage<1)throw new Error('치료할 부상자와 붕대가 필요해요.');r.actions--;r.resources.bandage--;patient.injury--;survivalLog(r,`${survivalMemberName(s,patient)}에게 붕대를 사용했다.`);}
 else throw new Error('할 수 없는 생존 행동입니다.');return s;
}
export function scoutSurvivalSite(state,id){
 const r0=survivalReady(state,{actions:1}),seen=survivalSiteObservation(r0,id);if(r0.stage!=='settlement'||!survivalSites[id]||seen&&(seen.occupants>0||seen.confirmed))throw new Error('이미 확인한 상태예요. 감염체가 있으면 제압하거나 다른 공간을 찾아보세요.');
 const s=structuredClone(state),r=s.survivalRun;r.actions--;const room=inspectSurvivalRoom(r,id);r.threat=survivalClamp(r.threat+3);
 survivalLog(r,`${survivalSites[id].name}까지 이동해 내부를 살폈다. ${room.occupants?`감염체 ${room.occupants}마리가 공간을 차지하고 있다. 싸우지 않고 다른 공간을 찾아도 된다.`:'감염체는 보이지 않는다. 문과 복도 상태를 확인했으니 전투 없이 거점을 준비할 수 있다.'} 문 상태 ${room.integrity}/100 · 복도 노출 ${room.exposure===0?'낮음':room.exposure===6?'보통':'높음'}.`);return s;
}
export function claimSurvivalBase(state,id){
 const r0=survivalReady(state,{actions:1}),site=survivalSites[id],room=survivalSiteObservation(r0,id);if(r0.stage!=='settlement'||!site||!r0.scouted[id]||!r0.secured[id]||!room||room.occupants>0)throw new Error('직접 확인해 비어 있거나, 감염체를 제압한 공간만 거점으로 삼을 수 있어요.');
 if(r0.members.length>site.capacity)throw new Error('함께 지낼 인원을 수용하기에는 공간이 작아요.');
 if(r0.resources.parts<site.cost)throw new Error('출입문을 정리할 부품이 부족해요.');const s=structuredClone(state),r=s.survivalRun;r.actions--;r.resources.parts-=site.cost;r.stage='base';r.base={site:id,integrity:room.integrity,exposure:room.exposure,facilities:[]};ensureSurvivalExploration(r).here=id;scheduleCampIncident(r);survivalLog(r,`${site.name}을 거점으로 삼았다. 확인한 문 상태와 복도 노출을 바탕으로 보강이 필요하다.`);return s;
}
export function buildSurvivalFacility(state,id){const r0=survivalReady(state,{base:true,actions:1}),f=survivalFacilities[id];if(!f||r0.base.facilities.includes(id))throw new Error('이미 설치했거나 없는 시설이에요.');if(r0.base.facilities.length>=survivalSites[r0.base.site].slots)throw new Error('이 거점의 시설 공간이 모두 찼어요.');if(r0.resources.parts<f.cost)throw new Error('공사에 필요한 부품이 부족해요.');const s=structuredClone(state),r=s.survivalRun;r.resources.parts-=f.cost;r.actions--;r.base.facilities.push(id);survivalLog(r,`${f.name}을 설치했다. ${f.effect}`);return s;}
export function assignSurvivalJob(state,key,job){const r0=survivalReady(state,{base:true}),member=r0.members.find(m=>m.key===key);if(!member||!survivalJobs[job])throw new Error('인원과 역할을 확인하세요.');if(job!=='rest'&&member.fatigue>=80)throw new Error('너무 지쳐 있어 오늘은 쉬어야 해요.');if(job==='care'&&!r0.base.facilities.includes('clinic')||job==='repair'&&!r0.base.facilities.includes('workshop'))throw new Error('그 역할을 위한 시설이 필요해요.');const s=structuredClone(state);s.survivalRun.members.find(m=>m.key===key).job=job;survivalLog(s.survivalRun,`${survivalMemberName(s,member)} · ${survivalJobs[job]} 역할을 맡았다.`);return s;}
export function finishSurvivalDay(state){
 const r0=survivalReady(state);if(r0.stage==='flight'&&r0.escapes<Math.min(2,r0.day))throw new Error('오늘의 도주 임무를 먼저 넘겨야 해요.');const s=structuredClone(state),r=s.survivalRun,before={...r.resources},nightDay=r.day,needed=r.members.length,short=r.resources.food<needed||r.resources.water<needed;
 r.resources.food=Math.max(0,r.resources.food-needed);r.resources.water=Math.max(0,r.resources.water-needed);r.shortage=short?r.shortage+1:0;const events=[`${needed}명분의 식량과 물을 나눴다.${short?' 배급이 부족했다.':''}`];
 for(const m of r.members){if(m.job!=='rest'&&m.fatigue>=80){m.job='rest';events.push(`${survivalMemberName(s,m)}는 지쳐 쉬기로 했다.`);}}
 const risk=survivalNightRisk(r);
 if(r.base){
  if(risk>=25){r.base.integrity=Math.max(0,r.base.integrity-12);r.resources.food=Math.max(0,r.resources.food-1);r.resources.water=Math.max(0,r.resources.water-1);events.push('밤새 문이 흔들렸다. 물자가 일부 흩어지고 문 상태가 나빠졌다.');}else{r.base.integrity=Math.max(0,r.base.integrity-3);events.push('감시와 출입문 덕분에 밤을 넘겼다.');}
  for(const medic of r.members.filter(m=>m.job==='care')){const patient=r.members.find(m=>m.injury>0);if(patient&&r.resources.bandage>0){r.resources.bandage--;patient.injury--;events.push(`${survivalMemberName(s,medic)}가 붕대로 부상자를 돌봤다.`);}}
  for(const worker of r.members.filter(m=>m.job==='repair'))if(r.resources.parts>0&&r.base.integrity<100){r.resources.parts--;r.base.integrity=Math.min(100,r.base.integrity+12);events.push('정비 담당이 부품 1개로 출입문을 보수했다.');}
 }
 for(const m of r.members){m.fatigue=survivalClamp(m.fatigue+(m.job==='rest'?-10:12)+(r.base?.facilities.includes('beds')?-8:0)+(short?14:0)+(!r.base?8:0));m.stress=survivalClamp(m.stress+(short?12:-3)+(r.base&&risk>=25?10:0));}
 r.threat=survivalClamp(r.threat+6-r.members.filter(m=>m.job==='watch').length*5);r.day++;r.actions=3;
 if(r.day>=3&&r.escapes>=2&&!r.base){r.stage='settlement';events.push('도주 동선이 조금 보인다. 이제 빈 강의실을 정찰하고 확보해볼 수 있다.');}
 if(r.shortage>=3||r.threat>=100||r.base?.integrity===0){r.status='overrun';events.push('더는 지금 상태로 버티기 어렵다. 이번 생존 기록은 여기서 끝난다.');}
 events.push(...finishCampStories(r));
 if(r.threat>=100){r.status='overrun';if(!events.some(e=>e.includes('이번 생존 기록')))events.push('위협을 감당하지 못해 이번 생존 기록이 끝났다.');}
 r.lastNight={day:nightDay,short,risk,before,after:{...r.resources},events:[...events],failed:r.status!=='active'};scheduleCampIncident(r);survivalLog(r,events.join(' '));return s;
}
export function launchSurvivalSortie(state,kind,siteId){
 const r0=survivalReady(state,{actions:1});let mission;
 if(kind==='escape'){if(r0.stage!=='flight')throw new Error('도주 단계에서 진행하는 임무예요.');mission='escape';}
 else if(kind==='secure'){const room=survivalSiteObservation(r0,siteId);if(r0.stage!=='settlement'||!survivalSites[siteId]||!r0.scouted[siteId]||r0.secured[siteId]||!room||room.occupants===0)throw new Error('정찰한 미확보 후보지를 선택하세요.');mission='eliminate';}
 else if(kind==='supply'||kind==='rescue'||kind==='defend'){if(!r0.base)throw new Error('거점을 확보한 뒤 진행할 수 있어요.');if(kind==='rescue'&&r0.members.length>=survivalSites[r0.base.site].capacity)throw new Error('새 인원을 받을 공간이 없어요.');mission=kind==='rescue'||kind==='defend'?'protect':'eliminate';}
 else throw new Error('없는 작전입니다.');
 if(r0.members.filter(m=>m.key==='taei'||m.key==='ally').some(m=>m.injury>=3))throw new Error('원정 인원이 부상을 치료한 뒤 출발해야 해요.');
 const previous=structuredClone(state.combatTrial??null),prepared=structuredClone(state);prepared.combatTrial={stash:{runs:r0.sortieSequence,items:{water:r0.resources.water,bandage:r0.resources.bandage,parts:r0.resources.parts},claimed:[]}};
 const ally=r0.members.find(m=>m.key==='ally'),s=startGridCombat(prepared,ally.character,mission),r=s.survivalRun;r.actions--;r.sortieSequence++;r.activeSortie={id:r.sortieSequence,kind,siteId:siteId??null,previousCombat:previous};r.resources.water=0;r.resources.bandage=0;r.resources.parts=0;s.combatTrial.items.water=0;s.combatTrial.survivalSortie=r.activeSortie.id;s.combatTrial.survivalContext={title:kind==='escape'?'흩어지지 말고 빠져나가':kind==='secure'?survivalSites[siteId].name+' 확보':kind==='supply'?'거점 보급 원정':kind==='rescue'?'부상 학생 구조':'거점 주변 방어',location:kind==='secure'?survivalSites[siteId].name:'캠퍼스 생존 작전'};
 for(const key of ['taei','ally']){const member=r.members.find(m=>m.key===key),actor=s.combatTrial.actors[key];actor.stamina=Math.max(25,100-Math.floor(member.fatigue/2));actor.fear=Math.min(65,15+Math.floor(member.stress/2));actor.wounds=Math.min(2,member.injury);}
 if(kind==='secure'){const room=survivalSiteObservation(r,siteId),spots=[[6,4],[8,3],[9,4],[9,3]];s.combatTrial.reinforced=!!room.reinforced;s.combatTrial.enemies=spots.slice(0,room.occupants).map(([x,y],i)=>({id:i+1,x,y,balance:2,stun:0}));s.combatTrial.log=[`${survivalSites[siteId].name} 내부에서 확인한 감염체 ${room.occupants}마리를 제압해야 한다.`];}
 s.combatTrial.optional.initialWounds=Object.fromEntries(Object.entries(s.combatTrial.actors).map(([key,a])=>[key,a.wounds]));
 survivalLog(r,'작전에 나섰다. 창고 물자를 휴대하며, 복귀 전에는 거점 행동을 할 수 없다.');return s;
}
export function returnSurvivalSortie(state,{abandon=false}={}){
 const r0=state.survivalRun,active=r0?.activeSortie,b=state.combatTrial;if(!active||b?.survivalSortie!==active.id||b.version!==2)throw new Error('이 생존 기록에 연결된 작전이 아니에요.');if(b.status==='active'&&!abandon)throw new Error('작전을 마치거나 실패로 중단해야 복귀할 수 있어요.');
 if(abandon&&b.status!=='active')throw new Error('이미 끝난 작전은 결과를 확인하고 복귀하세요.');
 const s=structuredClone(state),r=s.survivalRun,result=s.combatTrial,won=!abandon&&combatMissionWon(result);r.resources.water=result.stash.items.water;r.resources.bandage=result.stash.items.bandage;r.resources.parts=result.stash.items.parts;
 for(const key of ['taei','ally']){const member=r.members.find(m=>m.key===key),actor=result.actors[key];member.fatigue=survivalClamp(Math.max(member.fatigue,100-actor.stamina)+(won?4:12));member.stress=survivalClamp(actor.fear+(won?0:10));member.injury=Math.min(3,actor.wounds+(won?0:1));}
 if(active.kind==='secure')recordSurvivalClearance(r,active.siteId,result,won);
 let text;
 if(won){if(active.kind==='escape'){r.escapes++;r.threat=survivalClamp(r.threat+4);text='도주로를 넘어 동료와 다시 숨을 돌렸다.';}else if(active.kind==='secure'){r.secured[active.siteId]=true;text=survivalSites[active.siteId].name+' 내부를 확보했다. 출입문을 정리하면 거점으로 삼을 수 있다.';}else if(active.kind==='supply'){r.resources.food+=3;r.resources.water++;text='식량 3과 물 1, 전투 전리품을 가지고 돌아왔다.';}else if(active.kind==='rescue'){const number=r.members.filter(m=>m.key.startsWith('rescued-')).length+1;r.members.push({key:'rescued-'+number,character:'student',label:'구조한 학생 '+number,job:'rest',fatigue:50,stress:40,injury:1});text='부상 학생 1명을 데리고 돌아왔다. 먼저 쉴 자리와 치료가 필요하다.';}else{r.base.integrity=Math.min(100,r.base.integrity+15);r.threat=survivalClamp(r.threat-20);text='주변 접근을 막고 거점 출입문을 다시 정리했다.';}}
 else{r.threat=survivalClamp(r.threat+12);if(r.base)r.base.integrity=Math.max(0,r.base.integrity-8);text='작전을 중단하고 물러났다. 소비한 물자는 돌아오지 않았고, 새로 주울 예정이던 보상도 얻지 못했다.';}
 r.completedSorties.push({id:active.id,kind:active.kind,day:r.day,success:won,siteId:active.siteId});r.activeSortie=null;if(active.previousCombat)s.combatTrial=active.previousCombat;else delete s.combatTrial;survivalLog(r,text);return s;
}

export function survivalDayPreview(state){
 try{const next=finishSurvivalDay(state);return {...next.survivalRun.lastNight,nextThreat:next.survivalRun.threat,nextIntegrity:next.survivalRun.base?.integrity??null,canFinish:true};}
 catch(error){return {canFinish:false,reason:error.message};}
}
