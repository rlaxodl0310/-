'use strict';

const Information=require('./information-engine.cjs');
const Social=require('./social-information.cjs');
const Transport=require('../ui/rescue/transport-host.js');
const Journey=require('../ui/journey/host.js');

const actions=['verify','warn','detour'];
const properties={
  actorId:{type:'string'},eventId:{type:'string'},action:{type:'string',enum:actions},
  target:{type:['string','null']},quote:{type:'string'},
};
const SCHEMA={type:'array',maxItems:2,items:{type:'object',additionalProperties:false,required:Object.keys(properties),properties}};
const present=s=>new Set(['taei',...(s.present||[]),...(s.locals||[]).map(n=>n.id)]);
const active=s=>s.era==='fantasy'&&s.player.hp>0&&s.combat?.status!=='playing';

function available(s,id){
  if(!present(s).has(id)||s.actionWorld?.actors?.[id]?.incapacitated)return false;
  const actor=Transport.actor(s,id),player=Transport.actor(s,'taei');
  return (!actor||actor.hp>0)&&(!actor||!player||
    actor.position.regionId===player.position.regionId&&actor.position.zoneId===player.position.zoneId);
}

const wording={verify:/확인|살펴|살피|조사|알아보/u,warn:/경고|알려|알리|조심|주의|전해/u,detour:/우회|다른\s*길|돌아가|돌아서/u};

function context(s){
  if(!active(s))return null;
  const hazards=s.ledger.filter(event=>event.risk?.location).slice(-12);
  return {
    actors:[...present(s)].filter(id=>id!=='taei'&&available(s,id)).map(id=>({
      id,known:hazards.flatMap(event=>{
        const source=Information.provenance(s,id,event);
        return source?[{eventId:event.id,text:event.text,location:event.risk.location,
          kind:source.kind,from:source.from,canWarn:source.kind==='observed'||source.allowForward===true}]:[];
      }),
    })),
    responses:(s.npcRiskResponses||[]).slice(-8),
    destinations:Journey.candidates(s).map(({id,name})=>({id,name})),
    rule:'npcRiskActions는 알고 있는 위험만 사용한다. 과거 위험은 당시 기록이며 현재 존재를 확정하지 않는다. verify는 확인 요청, warn은 현재 함께 있는 상대에게 출처를 유지해 전하는 일, detour는 등록된 경로의 검토다. 어느 것도 이동·발견·안전을 확정하지 않는다. 잘 모르면 verify를 제안하고 해당 인물의 실제 발언 quote를 넣는다.',
  };
}

function detour(s,eventId,actorId,target){
 const event=s.ledger.find(row=>row.id===eventId);
 if(!active(s)||!available(s,actorId)||!event?.risk?.location||!Information.provenance(s,actorId,event))
  throw Error('현재 검토할 수 있는 우회 제안이 없어요.');
 const route=Journey.route(s,target,'safe');
 if(target===event.risk.location||route.legs.some(leg=>leg.location===event.risk.location))
  throw Error('해당 위험 지점을 피하는 등록 경로가 없습니다.');
 return route;
}

function apply(state,result,{requestId=null}={}){
  const proposals=result.npcRiskActions||[];
  if(!Array.isArray(proposals)||proposals.length>2)throw Error('위험 대응 제안을 확인하세요.');
  if(!proposals.length)return state;
  if(!active(state))throw Error('현재는 위험 정보를 논의할 수 없습니다.');
  let s=structuredClone(state);
  for(const [index,p] of proposals.entries()){
    if(!p||!actions.includes(p.action)||p.actorId==='taei'||!available(s,p.actorId)||
       typeof p.quote!=='string'||!p.quote.trim()||!wording[p.action].test(p.quote)||
       !result.panels?.some(line=>line.speaker===p.actorId&&line.text.includes(p.quote)))
      throw Error('같은 현장의 인물과 실제 발언이 필요합니다.');
    const event=s.ledger.find(row=>row.id===p.eventId);
    const source=Information.provenance(s,p.actorId,event);
    if(!event?.risk?.location||!source)throw Error('그 인물이 알고 있는 위험 정보가 필요합니다.');
    if(source.kind==='heard'&&/직접.*(?:봤|보았|겪)|목격했|내 눈으로/u.test(p.quote))
      throw Error('전해 들은 위험은 직접 본 일로 말할 수 없습니다.');
    let route;
    if(p.action==='verify'){
      if(p.target!==null)throw Error('추가 확인 대상은 근거가 된 위험으로 정해집니다.');
    }else if(p.action==='warn'){
      if(!p.target||p.target===p.actorId||!available(s,p.target)||
         source.kind==='heard'&&!source.allowForward)
        throw Error('경고를 전달할 실제 상대나 재전달 허락이 필요합니다.');
      if(!Information.provenance(s,p.target,event)){
        s.socialInformation??=Information.empty();
        s=Social.sync(s);
        s.socialInformation=Information.tell(s.socialInformation,{
          id:'risk-'+(requestId||'preview')+'-'+index,eventId:event.id,from:p.actorId,to:p.target,
          explicit:true,allowForward:false,
          contact:{id:'scene-'+s.revision,participants:[p.actorId,p.target],location:s.location,minutes:s.minutes},
        });
      }
    }else{
      route=detour(s,p.eventId,p.actorId,p.target);
    }
    if(!requestId)continue;
    const response={actorId:p.actorId,eventId:event.id,kind:p.action,target:p.target,
      source:source.kind,from:source.from,at:s.minutes,location:s.location};
    if(route){
      response.route=route.legs.map(leg=>leg.location);
      const pending=s.npcActionProposals||[];
      if(!pending.some(row=>row.eventId===event.id&&row.actorId===p.actorId&&row.target===p.target&&
        row.location===s.location&&['offered','held'].includes(row.status))){
        s.npcActionProposals=[...pending,{
          id:requestId+'-'+index,kind:'detour',status:'offered',actorId:p.actorId,eventId:event.id,
          location:s.location,target:p.target,edges:route.legs.map(leg=>leg.edgeId),
        }].slice(-12);
      }
    }
    s.npcRiskResponses=[...(s.npcRiskResponses||[]),response].slice(-32);
  }
  return requestId?s:state;
}

module.exports={SCHEMA,apply,context,available,detour};
