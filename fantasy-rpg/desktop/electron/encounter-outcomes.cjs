'use strict';

const Companion=require('../ui/companions/model.js');
const Transport=require('../ui/rescue/transport-host.js');
const labels={
  won:'위협을 제압했다.',
  escaped:'현재 조우에서 이탈했다.',
  lost:'전투 불능으로 조우가 끝났다.',
  withdrawn:'전투 진행을 중단했다. 승패는 미확정이다.',
};

function record(previous,next) {
  const before=previous.combat, after=next.combat;
  if(before?.status!=='playing'||!after?.id||before.id!==after.id||!Object.hasOwn(labels,after.status))return;
  const id='encounter-outcome-'+next.revision+'-'+after.id;
  if(next.ledger.some(entry=>entry.id===id))return;

  const start=Transport.actor(previous,'taei')?.position;
  const finish=Transport.actor(next,'taei')?.position;
  const samePlace=previous.era===next.era&&previous.location===next.location&&
    (!start||!finish||start.regionId===finish.regionId&&start.zoneId===finish.zoneId);
  const remaining=after.status==='won'?0:after.mode==='chat'&&Array.isArray(after.enemies)
    ?after.enemies.filter(enemy=>enemy.hp>0).length:null;
  const sameScene=samePlace?new Set(Companion.actors(next).map(actor=>actor.id)):new Set();
  const witnesses=['taei',...Companion.actors(previous).filter(actor=>sameScene.has(actor.id)).map(actor=>actor.id)];
  const outcome={
    encounterId:after.id,status:after.status,
    remaining,player:{hp:next.player.hp,fatigue:next.player.fatigue??null},
  };
  const text=labels[after.status]+(remaining===null?' 남은 상대 수는 미확인이다.':remaining?' 남은 상대 '+remaining+'개체.':'');
  next.ledger.push({
    id,turn:next.revision,at:next.minutes,era:previous.era,location:previous.location,
    source:'engine-encounter-outcome',questId:after.adventureQuestId??null,text,witnesses,outcome,
  });
}

function context(state) {
  return state.ledger.filter(entry=>entry.source==='engine-encounter-outcome').slice(-4)
    .map(({id,at,era,location,text,witnesses,outcome})=>({
      id,at,era,location,text,witnesses,outcome,
    }));
}

module.exports={record,context};
