'use strict';

const Tracking=require('../ui/adventure/tracking.js');
const Proposals=require('./npc-proposals.cjs');
const Geography=require('../ui/map/geography.js');

const trackingInfo={
 observe:{kind:'observe',condition:'아직 살피지 않은 단서를 확인'},
 approach:{kind:'move',condition:'접근하면 조우가 시작될 수 있음'},
 circle:{kind:'move',condition:'엄폐로 상대 경계를 낮춤'},
 withdraw:{kind:'retreat',condition:'추적 중단 · 현재 장소에 남음'},
};

function category(text){
 if(/물러|후퇴|도망|철수|빠져나/u.test(text))return 'retreat';
 if(/방어|엄폐|몸을 숨|막는/u.test(text))return 'defend';
 if(/살피|살핀|귀를|관찰|조사|단서를 확인/u.test(text))return 'observe';
 if(/다가|접근|이동|우회/u.test(text))return 'move';

 if(/공격|때리|쳐낸/u.test(text))return 'attack';
 if(/기다|멈추/u.test(text))return 'wait';
 return 'talk';
}

function build(state){
 const rows=[], seen=new Set();
 const add=(kind,row)=>{
  if(rows.length<3&&!seen.has(kind)){
   seen.add(kind);
   rows.push(row);
  }
 };
 const combat=state.combat?.status==='playing';
 if(combat&&state.combat.mode==='realtime'||state.player.hp<=0)return [];
 if(!combat){
  const offers=Proposals.options(state).flatMap(offer=>{
   try{
    const {minutes}=Proposals.quote(state,offer);
    const place=Geography.records.find(item=>item.id===offer.target)?.name||offer.target;
    return [{label:place+' 우회 제안 수락',input:'우회 제안 수락 '+offer.id,minutes,condition:'여정 준비 시간 · 실제 이동은 다음 구간부터'}];
   }catch{return [];}
  });
  if(offers.length===1)add('move',offers[0]);
  else if(offers.length>1)add('move',{label:'우회 제안 비교',compare:offers});
  const quests=(state.adventure?.quests||[]).filter(q=>q.type==='hunt'&&q.destination===state.location);
  for(const decision of ['observe','withdraw','approach','circle']){
   for(const quest of quests){
    const option=Tracking.options(state,quest.id).find(row=>row.decision===decision);
    if(!option)continue;
    const info=trackingInfo[decision];
    add(info.kind,{
     label:quests.length>1?quest.title+' · '+option.label:option.label,minutes:option.minutes,
     condition:[option.effort?'활동 피로 +'+option.effort:null,info.condition].filter(Boolean).join(' · '),
     action:{type:'trackStep',questId:quest.id,decision},
    });
   }
  }
 }
 const fallback=combat?['적의 움직임을 살핀다.','방어 자세를 잡는다.','뒤로 물러나 거리를 확보한다.']:
  ['주변에서 확인할 수 있는 단서를 살핀다.','곁에 사람이 있는지 확인하고 말을 건다.','잠시 기다리며 주변 반응을 본다.'];
 for(const input of [...(state.choices||[]),...(state.actionWorld?.suggestions||[]).map(row=>row.text),...fallback]){
  if(typeof input==='string'&&input.trim())add(category(input),{label:input,input,condition:'채팅으로 시도 · 상황에 따라 판정'});
 }
 return rows;
}

module.exports={build};
