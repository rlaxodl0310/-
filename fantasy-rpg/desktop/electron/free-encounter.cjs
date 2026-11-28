'use strict';

const {policy}=require('../ui/adventure/tracking.js');

const commands=new Map([
 ['조우에서 물러난다','withdraw'],
 ['마지막 조우에 재접근한다','approach'],
 ['조우 추적을 그만둔다','leave'],
]);

function current(state) {
 const encounter=state.freeEncounter;
 if(state.era!=='fantasy'||!encounter||state.minutes>=encounter.expiresAt)return null;
 return encounter;
}

function capture(previous,next) {
 let encounter=current(next);
 const previousEncounter=current(previous);
 const battle=next.combat;
 if(previousEncounter?.battleId===battle?.id&&battle?.status==='won'){
  delete next.freeEncounter;
  return;
 }
 if(encounter?.battleId===battle?.id&&battle?.status==='escaped'&&previous.combat?.status==='playing'){
  encounter={...encounter,phase:'withdrawn',battle:structuredClone(battle)};
 }
 const sighting=next.monsterAppearances?.[0];
 if(!encounter&&next.era==='fantasy'&&sighting&&!battle?.tracking&&!battle?.adventureQuestId&&battle?.status!=='playing'){
  encounter={species:sighting.id,location:next.location,phase:'sighted',seenAt:next.minutes,expiresAt:next.minutes+policy.signalLifetime};
 }
 if(encounter&&encounter.location===previous.location&&encounter.location===next.location&&encounter.phase==='sighted'&&
    battle?.status==='playing'&&previous.combat?.status!=='playing'&&battle.mode==='chat'&&
    !battle.tracking&&!battle.adventureQuestId&&battle.enemies.length===1&&battle.enemies[0].kind===encounter.species){
  encounter={...encounter,battleId:battle.id};
 }
 if(encounter)next.freeEncounter=encounter;
 else delete next.freeEncounter;
}

function bind(state,result,battle) {
 const record=current({...state,minutes:state.minutes+result.elapsedMinutes});
 if(!record||record.location!==state.location||result.location!==state.location||record.phase!=='sighted'||
    battle?.status!=='playing'||battle.mode!=='chat'||state.combat?.status==='playing'||
    battle.adventureQuestId||battle.tracking||battle.enemies.length!==1||battle.enemies[0].kind!==record.species)return battle;
 if(record.battle)return {...structuredClone(record.battle),status:'playing',distance:Math.max(2,record.battle.distance)};
 return battle;
}

function command(state,text) {
 const action=commands.get(text.trim().replace(/[.!。]$/,''));
 if(!action)return null;
 const record=current(state);
 if(!record)throw Error('이어갈 수 있는 조우 기록이 없습니다.');
 if(state.combat?.status==='playing')throw Error('진행 중인 전투에서 먼저 이탈하세요.');
 if(action==='leave')return {...state,freeEncounter:null,monsterAppearances:[],message:'이 조우의 추적을 그만뒀다.'};
 if(record.location!==state.location)throw Error('마지막 목격 장소에서만 이어갈 수 있습니다.');
 if(state.player.hp<=0)throw Error('전투 불능 상태에서는 조우를 이어갈 수 없습니다.');
 const phase=action==='withdraw'?'withdrawn':'sighted';
 if(record.phase===phase)throw Error(action==='withdraw'?'이미 조우에서 물러났습니다.':'이미 조우를 관찰 중입니다.');
 const minutes=state.minutes+(action==='withdraw'?policy.withdrawMinutes:policy.approachMinutes);
 if(minutes>=record.expiresAt)throw Error('시간이 지나 마지막 흔적을 따라갈 수 없습니다.');
 const message=action==='withdraw'?'거리를 벌렸다. 마지막 목격 장소와 시각을 기록했다.':'마지막 목격 위치에 다시 접근했다. 전투할지 더 살필지 선택할 수 있다.';
 return {...state,minutes,freeEncounter:{...record,phase},monsterAppearances:[],message};
}

module.exports={current,capture,bind,command};
