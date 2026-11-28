(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('../combat/rules.js'),require('../map/geography.js'),require('../monsters/catalog.js'));else r.HuntTracking=f(r.CombatRules,r.GameGeography,r.MonsterCatalog);})(globalThis,(Rules,Geo,Catalog)=>{
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),fail=m=>{throw Error(m);};
// Tunable field-play policy, not new species lore or character stats.
const policy=Object.freeze({searchMinutes:5,observeMinutes:10,approachMinutes:5,withdrawMinutes:5,circleMinutes:8,maxObservations:2,signalLifetime:30});
const focusKeys=['terrain','movement','distance'];
function profile(species){const m=Catalog.records.find(m=>m.id===species),text=(m?.ecology||'')+' '+(m?.combat||''),behaviours=['watch'];if(/무리|군체|군집/.test(text))behaviours.push('pack');if(/매복|사각|기습/.test(text))behaviours.push('ambush');if(/먹이|광석|잡식|갉아/.test(text))behaviours.push('forage');if(/활공|비행/.test(text))behaviours.push('mobile');return{species,behaviours,ecology:m?.ecology||null,combat:m?.combat||null};}
function quest(s,id){const q=s.adventure?.quests.find(q=>q.id===id&&q.type==='hunt');if(!q)fail('실제 토벌 의뢰가 필요합니다.');return q;}
function eligible(s,q){if(s.era!=='fantasy'||s.player.hp<=0||q.status!=='accepted'||q.progress>=q.target||s.location!==q.destination)fail('수행 중인 토벌 의뢰의 실제 현장에서 진행하세요.');if(s.combat?.status==='playing')fail('진행 중인 전투를 먼저 마쳐 주세요.');if(Object.values(s.transports?.trips||{}).some(t=>t.status==='active'&&[t.carrierId,t.targetId].includes('taei')))fail('부축·운반을 먼저 정리해 주세요.');}
function advance(s,q,minutes,fatigue=0){if(s.minutes+minutes>q.deadline)fail('이 행동을 수행하면 의뢰 기한을 넘깁니다.');s.minutes+=minutes;s.player.fatigue=Math.min(100,(s.player.fatigue||0)+fatigue);}
function record(q,s,kind,text){const t=q.tracking;t.at=s.minutes;t.lastEvent={kind,text,at:s.minutes};t.history.push(t.lastEvent);t.history=t.history.slice(-12);}
function expired(s,t){return !!t&&s.minutes-t.at>policy.signalLifetime;}
function needsSignal(s,id){const q=quest(s,id);eligible(s,q);return!q.tracking||['withdrawn','aftermath'].includes(q.tracking.phase)||expired(s,q.tracking)||q.tracking.location!==s.location;}
function frame(s,id){const q=quest(s,id),p=profile(q.species);return{questId:q.id,species:q.species,terrain:Geo.records.find(p=>p.id===s.location)?.note||'',minutes:s.minutes,remaining:q.deadline-s.minutes,hp:s.player.hp,max:s.player.max,mana:s.player.mana,fatigue:s.player.fatigue||0,progress:q.progress,target:q.target,profile:p,allowed:{behaviour:p.behaviours,focus:focusKeys},recent:q.tracking?.history.slice(-6)||[]};}
function checkProposal(s,id,p){const f=frame(s,id);if(!p||Object.keys(p).sort().join(',')!=='behaviour,focus'||!f.allowed.behaviour.includes(p.behaviour)||!focusKeys.includes(p.focus))fail('등록 생태에서 허용한 반응·관찰 초점을 선택해 주세요.');}
function local(s,id){const f=frame(s,id),cycle=quest(s,id).tracking?.cycle||0,n=Rules.hash(id+':'+cycle+':'+s.location);return{behaviour:f.allowed.behaviour[n%f.allowed.behaviour.length],focus:focusKeys[(n>>>4)%focusKeys.length]};}
function begin(state,id,proposal,meta={source:'local',exchange:[]}){const s=clone(state),q=quest(s,id);eligible(s,q);if(!needsSignal(s,id))return s;if(Rules.fatigue(s.player).exhausted)fail('탈진 상태에서는 추적을 시작할 수 없습니다.');checkProposal(s,id,proposal);const old=q.tracking;advance(s,q,policy.searchMinutes,1);q.tracking={version:1,cycle:(old?.cycle||0)+1,location:s.location,species:q.species,phase:'trail',behaviour:proposal.behaviour,focus:proposal.focus,attention:0,observations:0,observedClues:[],confidence:0,startedAt:s.minutes,at:s.minutes,source:meta.source,exchange:clone(meta.exchange||[]),history:clone(old?.history||[]),survivor:clone(old?.survivor||null),battleId:old?.battleId||null};if(s.combat?.status!=='playing')s.combat=null;s.scene='exploration';record(q,s,'trail','주변 흔적을 대조했다. 아직 정확한 위치와 수는 확인하지 못했다.');return s;}
const fieldActions=Object.freeze({
 observe:{label:'흔적 더 관찰',minutes:policy.observeMinutes,effort:1},
 approach:{label:'조심스럽게 접근',minutes:policy.approachMinutes,effort:2},
 circle:{label:'엄폐 따라 우회',minutes:policy.circleMinutes,effort:1},
 withdraw:{label:'물러나 거리 확보',minutes:policy.withdrawMinutes,effort:0},
});
function decisionReason(s,q,decision){
 if(!Object.hasOwn(fieldActions,decision))return '지원하지 않는 추적 행동입니다.';
 const t=q.tracking,action=fieldActions[decision];
 if(decision!=='withdraw'&&Rules.fatigue(s.player).exhausted)return '탈진 상태에서는 추적을 계속할 수 없습니다.';
 if(s.minutes+action.minutes>q.deadline)return '이 행동을 수행하면 의뢰 기한을 넘깁니다.';
 if(decision==='observe'){
  if(t.observations>=policy.maxObservations)return '관찰은 이 상황에서 두 번까지 가능합니다. 접근하거나 철수하세요.';
  if(!clues(s,q.id).some(c=>!(t.observedClues||[]).includes(c.id)))return '현재 더 살필 단서가 없습니다.';
 }
 if(decision==='circle'){
  if(!Geo.records.find(p=>p.id===s.location)?.huntTerrain?.coveredRoute)return '이곳에는 확인된 엄폐 우회로가 없습니다.';
  if(t.flanked)return '같은 흔적에서 우회는 한 번만 확인할 수 있습니다.';
 }
 return null;
}
function options(s,id){
 const q=quest(s,id);
 try{if(needsSignal(s,id)||!['trail','sighted'].includes(q.tracking?.phase))return [];}catch{return [];}
 return Object.entries(fieldActions).filter(([decision])=>!decisionReason(s,q,decision))
  .map(([decision,action])=>({decision,...action}));
}
function step(state,id,decision,{createCombat,clueId}={}){const s=clone(state),q=quest(s,id);eligible(s,q);const t=q.tracking;if(!t||!['trail','sighted'].includes(t.phase))fail('새 추적 상황부터 확인해 주세요.');if(t.location!==s.location||expired(s,t))fail('오래된 흔적입니다. 새 상황을 확인해 주세요.');const reason=decisionReason(s,q,decision);if(reason)fail(reason);
 if(clueId!==undefined&&decision!=='observe')fail('단서 지정은 관찰에서만 가능합니다.');
 if(decision==='withdraw'){advance(s,q,policy.withdrawMinutes);t.phase='withdrawn';record(q,s,'withdrawn','추적을 멈추고 거리를 벌렸다. 도시로 귀환한 것은 아니며 현재 장소에 남아 있다.');return s;}
 if(decision==='circle'){advance(s,q,policy.circleMinutes,1);t.flanked=true;t.attention=Math.max(0,t.attention-15);record(q,s,'circled','엄폐 지형을 따라 옆쪽 접근 방향을 확인했다. 시간이 흘렀으며 상대 경계를 최대15 낮췄다. 약점이나 기습 성공을 보장하지 않는다.');return s;}
 if(decision==='observe'){const seen=t.observedClues||[],cues=clues(s,id),cue=clueId!==undefined?cues.find(c=>c.id===clueId):cues.find(c=>c.focus===t.focus&&!seen.includes(c.id))||cues.find(c=>!seen.includes(c.id));if(!cue||seen.includes(cue.id))fail('이미 살폈거나 현재 없는 단서입니다.');t.observedClues=[...seen,cue.id];t.focus=cue.focus;advance(s,q,policy.observeMinutes,1);t.observations++;t.confidence=Math.min(100,t.confidence+50);t.attention+=t.behaviour==='ambush'?25:t.behaviour==='pack'?20:10;t.phase='sighted';record(q,s,'observed',cue.label+'을 대조했다. 대상의 움직임과 접근 방향을 확인했다. 관찰하는 동안 시간과 피로가 늘었고 상대도 주변을 경계한다.');return s;}
 if(typeof createCombat!=='function')fail('실제 전투 실행기가 필요합니다.');advance(s,q,policy.approachMinutes,2);const fatigue=s.player.fatigue||0,agility=Rules.stat?Rules.stat(s.player,'agility'):s.player.stats?.agility||0;
 // Persisted cycle seed prevents reopening the UI to reroll the same trail.
 const roll=Rules.hash(q.id+':'+t.cycle+':approach')%100,threshold=Math.min(85,35+t.confidence*.45+Math.min(10,Number.isFinite(agility)?agility:0)-fatigue*.15);
 if(t.phase==='trail'&&roll>=threshold){t.phase='sighted';t.attention+=35;record(q,s,'alerted',t.behaviour==='mobile'?'대상이 거리를 벌렸다. 재접근하기 전에 위치를 다시 확인해야 한다.':'접근 기척에 상대가 경계했다. 당장 타격할 거리는 아니며 다음 행동을 골라야 한다.');return s;}
 const combat=t.survivor?{...clone(t.survivor),status:'playing'}:createCombat(Array(t.behaviour==='pack'?Math.min(3,q.target-q.progress):1).fill(q.species),'chat',q.title);combat.adventureQuestId=q.id;combat.tracking={questId:q.id,cycle:t.cycle,behaviour:t.behaviour,attention:t.attention};if(!t.survivor)combat.distance=t.behaviour==='ambush'&&t.attention>=25?1:t.confidence>=100?1:t.attention>=35?3:2;
 t.phase='engaged';t.battleId=combat.id;t.survivor=null;s.combat=combat;s.scene='combat';record(q,s,'engaged','대상과 실제로 마주쳤다. 관찰과 경계 상태에 따른 거리에서 대화 전투가 시작된다.');return s;}
// A battle can only withdraw as a group, so surviving enemies stay in one saved encounter.
function enemyWithdrawal(previous,battle,location){
 if(!battle?.tracking||battle.mode!=='chat'||battle.status!=='playing'||
    previous?.id!==battle.id||previous.status!=='playing'||battle.round<=previous.round)return null;
 const survivors=battle.enemies.filter(enemy=>enemy.hp>0);
 if(!survivors.length||survivors.some(enemy=>enemy.hp>enemy.max*0.3))return null;
 const covered=Geo.records.find(place=>place.id===location)?.huntTerrain?.coveredRoute;
 const mobile=battle.tracking.behaviour==='mobile';
 if(!covered&&!mobile)return null;
 if(previous.tracking?.enemyWithdrawalRound!==undefined){
  delete battle.tracking.enemyWithdrawalRound;
  if(battle.distance<=2)return '거리를 좁혀 적의 이탈을 막았다.';
  battle.status='withdrawn';
  battle.tracking.enemyWithdrew=true;
  return '살아남은 적이 전투에서 이탈했다. 다시 추적하면 같은 개체와 마주칠 수 있다.';
 }
 if(battle.distance<=2)return null;
 battle.tracking.enemyWithdrawalRound=battle.round;
 return '부상당한 적이 물러날 길을 살핀다. 거리를 좁히면 이탈을 막을 수 있다.';
}
function observe(previous,next){const battle=next.combat,old=previous.combat;if(!battle?.tracking||old?.id!==battle.id||old.status!=='playing'||battle.status==='playing')return next;const s=clone(next),q=s.adventure?.quests.find(q=>q.id===battle.tracking.questId),t=q?.tracking;if(!t||t.battleId!==battle.id||t.phase!=='engaged')return next;t.phase=battle.status==='won'?'aftermath':'withdrawn';t.survivor=battle.status==='won'?null:clone(battle);record(q,s,'battle-'+battle.status,battle.tracking.enemyWithdrew?'부상당한 적이 이탈했다. 생존 개체를 다시 추적할 수 있다.':battle.status==='won'?'공방이 끝났다. 부상·피로·남은 전리품을 확인하고 계속 사냥할지 귀환할지 결정할 수 있다.':'전투를 끝내지 못했다. 살아남은 대상의 HP와 전투 기록을 유지한다.');return s;}
function validate(t,q){if(!t)return;if(t.version!==1||!Number.isSafeInteger(t.cycle)||t.cycle<1||t.location!==q.destination||t.species!==q.species||!['trail','sighted','engaged','aftermath','withdrawn'].includes(t.phase)||!profile(q.species).behaviours.includes(t.behaviour)||!focusKeys.includes(t.focus)||!Number.isFinite(t.at)||t.at<0||!Number.isInteger(t.observations)||t.observations<0||t.observations>2||!Number.isFinite(t.confidence)||t.confidence<0||t.confidence>100||!Number.isFinite(t.attention)||t.attention<0||t.attention>100||!['ai','local'].includes(t.source)||!Array.isArray(t.history)||t.history.length>12)fail('추적 상태 기록이 잘못되었습니다.');if(t.observedClues!==undefined&&(!Array.isArray(t.observedClues)||t.observedClues.length>2||new Set(t.observedClues).size!==t.observedClues.length||t.observedClues.some(id=>!['ground','motion','range'].includes(id))))fail('관찰 단서 기록이 잘못되었습니다.');if(t.flanked!==undefined&&typeof t.flanked!=='boolean')fail('우회 관찰 기록이 잘못되었습니다.');if(t.survivor&&(t.survivor.id!==t.battleId||t.survivor.adventureQuestId!==q.id||!['escaped','lost','withdrawn'].includes(t.survivor.status)||t.survivor.enemies.some(e=>e.kind!==q.species||!Number.isFinite(e.hp)||e.hp<0||e.hp>e.max)))fail('생존 개체 전투 기록이 잘못되었습니다.');}
function encounter(q){const t=q.tracking;if(!t)return null;const count=t.survivor?t.survivor.enemies.filter(e=>e.hp>0).length:t.behaviour==='pack'?Math.min(3,q.target-q.progress):1;return{count:t.phase==='engaged'?null:t.observations>0?count:null,distance:t.phase==='sighted'?t.confidence>=100?2:3:null,attention:t.attention,side:t.flanked?'side':'front',confirmed:t.observations>0};}
function clues(s,id){const q=quest(s,id),t=q.tracking;if(!t||!['trail','sighted'].includes(t.phase)||s.location!==q.destination||expired(s,t))return[];const m=Catalog.records.find(m=>m.id===q.species),text=[m?.lineage,m?.appearance,m?.name].join(' '),kind=/점액|젤리|슬라임/.test(text)?'residue':/식물|뿌리|줄기/.test(text)?'disturbed':/어류|지느러미/.test(text)?'scrape':'track';return[{id:'ground',kind,label:({residue:'남은 흔적',disturbed:'흐트러진 지면',scrape:'쓸린 자국',track:'지면의 자국'})[kind],focus:'terrain',note:'출몰 보고와 대조할 단서입니다. 원인·수·정확한 위치는 아직 단정하지 않습니다.'},{id:'motion',kind:'motion',label:'움직임의 기척',focus:'movement',note:'기척이 이어지는 방향을 더 관찰할 수 있습니다.'},{id:'range',kind:'range',label:t.phase==='sighted'?'확인한 접근 방향':'시야가 트인 틈',focus:'distance',note:'시야와 접근 방향을 살핍니다. 새 개체를 생성하지 않습니다.'}];}
function intent(text){if(typeof text!=='string'||!text.trim()||text.length>300||/줘|줄래|줄\s*수|부탁|해줄/.test(text)||/죽|처치|회복|구매|수락|동료|시켜|시키|시킨|하라고|대신/.test(text)||/하지\s*마|안\s*(?:가|갈|접근|관찰|우회|쫓)|않|말고|말자|취소|할까|어때|[?？]/.test(text))return null;const matches=[['observe',/관찰|살펴|살핀|살피|조사|흔적.*확인/],['approach',/접근|다가|가까이|거리를 좁/],['circle',/우회|돌아가|옆쪽|측면|에둘러/],['withdraw',/철수|물러|그만|추적.*멈|거리.*벌/]].filter(([,re])=>re.test(text));return matches.length===1?matches[0][0]:null;}
function active(s){if(s.era!=='fantasy'||s.combat?.status==='playing')return null;const qs=(s.adventure?.quests||[]).filter(q=>q.type==='hunt'&&q.status==='accepted'&&q.destination===s.location&&['trail','sighted'].includes(q.tracking?.phase));return qs.length===1?qs[0]:null;}
function guardScene(s,r){const qs=(s.adventure?.quests||[]).filter(q=>q.type==='hunt'&&q.status==='accepted'&&q.destination===s.location&&['trail','sighted'].includes(q.tracking?.phase));if(!qs.length||s.combat?.status==='playing')return;if(r.combat?.importance&&r.combat.importance!=='none'||r.scene==='combat')fail('추적 중 대치는 실제 접근 행동으로 시작하세요. 중요한 전투 전환은 실제 조우 뒤 판단합니다.');if((r.monsterAppearances||[]).some(m=>!qs.some(q=>q.species===m.id&&!expired(s,q.tracking)&&q.tracking.observations>0)))fail('아직 확인하지 않은 개체를 추적 장면에 추가할 수 없습니다.');}
function context(s,id){const q=quest(s,id),t=q.tracking;if(s.location!==q.destination||!t)return null;return{lastIntent:t.lastIntent||null,encounter:expired(s,t)?null:encounter(q),lastSeen:expired(s,t)?encounter(q):null,stale:expired(s,t),clues:clues(s,id),phase:t.phase,behaviour:t.phase==='trail'?null:t.behaviour,observations:t.observations,attention:t.attention,confidence:t.confidence,at:t.at,event:t.lastEvent,source:t.source,rule:'lastSeen은 만료된 과거 관찰이다. 현재 위치·수·거리로 사용하지 않는다. 현재 확인된 흔적과 판정만 묘사한다. 숨겨진 생태·새 약점·개체 수·처치·보상·귀환·회복을 추가하지 않는다.'};}
return{expired,guardScene,encounter,clues,options,intent,active,policy,profile,frame,checkProposal,local,begin,step,enemyWithdrawal,observe,validate,context,needsSignal};
});
