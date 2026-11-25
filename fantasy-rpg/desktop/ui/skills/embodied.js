(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.EmbodiedSkills=f();})(globalThis,()=>{
 'use strict';
 const kinds=['body_harden','body_flex','edge_blade','contact_fracture'],clone=x=>JSON.parse(JSON.stringify(x)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const supports=kind=>kinds.includes(kind);
 function material(o){if(o?.material)return o.material;const s=(o?.name||'')+' '+(o?.quote||'');if(/나무|목재|철제|강철|금속|wood|steel|metal/i.test(s))return'other';return /바위|암석|암반|석재|돌덩|돌벽|돌기둥|석벽|석주|stone|rock/i.test(s)?'rock':'unknown';}
 function objectCheck(o,m){if(!o||material(o)!==m.material)throw Error('실제로 확인된 암석 대상이 필요합니다.');if(!['light','medium','heavy'].includes(o.weight)||/산맥|동굴 전체|산 전체|절벽 전체/.test(o.name||''))throw Error('국소적인 크기가 확인된 암석만 다룰 수 있습니다.');if(o.condition==='broken')throw Error('이미 파쇄된 대상입니다.');if(o.distance>m.range)throw Error('손이나 무기가 암석에 닿을 거리로 접근해 주세요.');const limit=m.workByWeight[o.weight],cap=o.fixed?limit*.9:limit;if((o.fractureWork||0)>=cap)throw Error('이 구조의 추가 붕괴는 별도 구조 판정이 필요합니다.');return{limit,cap};}
 function prepare(d,ctx){const m=d.mechanic;if(!supports(m.kind))return null;const active=(ctx.activeCommon||[]).some(s=>s.commonId===d.id&&s.key===m.kind),requested=ctx.abilityMode||'auto';let mode=active?(m.kind==='edge_blade'?'release':'off'):'form';if(requested==='cancel')mode='off';if(requested==='release')mode='release';if(m.kind==='contact_fracture')mode='fracture';if(mode==='off'&&!active)throw Error('현재 유지 중인 능력이 아닙니다.');if(mode==='release'){if(m.kind!=='edge_blade'||!active)throw Error('먼저 잎날을 형성해야 합니다.');if(!ctx.targetAlive||ctx.distance>m.detachRange)throw Error('잎날을 날릴 유효한 대상이 사거리 안에 있어야 합니다.');}
  const part=ctx.abilityPart||'arm';if(m.kind==='body_harden'&&mode==='form'&&!m.parts.includes(part))throw Error('암체는 팔·어깨·다리·몸통 일부를 지정해 사용합니다.');
  let objectId;if(mode==='fracture'){objectCheck(ctx.object,m);objectId=ctx.object.id;}
  const mana=mode==='off'?0:mode==='release'?m.detachMana:d.mana;
  return{mana:mana+(ctx.manaLeak?Math.ceil(mana*.25):0),cooldown:0,windup:mode==='off'?.1:mode==='release'?.2:m.windup,amount:m.amount||0,distance:mode==='release'?m.detachRange:m.range,common:clone(d),ability:{mode,part,objectId}};
 }
 function release(b,u,a,C){const p=a.prepared,d=p.common,m=d.mechanic,choice=p.ability;if(!supports(m.kind))return false;
  if(choice.mode==='off'){u.commonStatuses=(u.commonStatuses||[]).filter(s=>s.commonId!==d.id);normaliseBody(u,b.time);return true;}
  if(choice.mode==='release'){
   const held=b.statuses(u).find(s=>s.commonId===d.id&&s.key==='edge_blade');if(!held)return true;
   u.commonStatuses=u.commonStatuses.filter(s=>s!==held);const cm={...d,mechanic:{...m,kind:'damage',delivery:'projectile',range:m.detachRange,amount:m.detachAmount,attackCoefficient:m.detachCoefficient,hits:1}};
   b.projectiles.push({id:++b.serial,source:u.id,team:u.team,x:u.x,y:u.y,vx:a.face.x*m.projectileSpeed,vy:a.face.y*m.projectileSpeed,radius:.16,damage:m.detachAmount,life:m.detachRange/m.projectileSpeed,weapon:'bow',shape:'leaf',registered:{skill:p.skill,castId:a.castId,common:cm,hitPart:u.aimPart||'torso'},commonId:d.id,pierce:1,hitIds:[]});
  }else if(choice.mode==='fracture'){
   const object=b.props.find(o=>o.id===choice.objectId);if(!object||distance(u,object)>m.range)return true;
   u.contactWork={objectId:object.id,prepared:clone(p),castId:a.castId,next:b.time+m.pulseInterval,left:m.pulses};
  }else{
   u.commonStatuses=(u.commonStatuses||[]).filter(s=>s.commonId!==d.id);
   u.commonStatuses.push({key:m.kind,commonId:d.id,definitionRevision:d.revision,skillId:p.skill.id,castId:a.castId,source:u.id,part:choice.part,until:b.time+m.maxDuration,maintenance:m.maintenance});normaliseBody(u,b.time);
  }
  b.emit('skill_fx',{actor:u.id,x:u.x,y:u.y,face:a.face,visual:d.visual});return true;
 }
 function normaliseBody(u,now){const flex=(u.commonStatuses||[]).some(s=>s.key==='body_flex'&&s.until>now);if(flex){u.bodyBaseRadius??=u.radius;u.radius=u.bodyBaseRadius*.75;}else if(u.bodyBaseRadius!==undefined){u.radius=u.bodyBaseRadius;delete u.bodyBaseRadius;}const h=(u.commonStatuses||[]).find(s=>s.key==='body_harden'&&s.until>now);u.bodyMobility=h?(h.part==='leg'?.4:['torso','chest','abdomen'].includes(h.part)?.25:.15):0;}
 function step(b,dt,C){for(const u of b.units){u.commonStatuses=(u.commonStatuses||[]).filter(s=>{if(!supports(s.key))return true;const d=C.get(s.commonId);if(!d||s.definitionRevision!==d.revision||s.until<=b.time||u.hp<=0)return false;if(u.id==='taei'&&!(u.essenceSpecies||[]).includes(d.essenceSpecies))return false;const cost=(s.maintenance||0)*Math.min(dt,s.until-b.time);if(u.mana+1e-8<cost){u.mana=0;return false;}u.mana=Math.max(0,Math.round((u.mana-cost)*1e6)/1e6);return true;});normaliseBody(u,b.time);
   const task=u.contactWork;if(!task)continue;const d=task.prepared.common,m=d.mechanic,o=b.props.find(o=>o.id===task.objectId);
   if(u.hp<=0||u.action||u.dodgeTime>0||b.hasStatus(u,'stun')||b.hasStatus(u,'root')||!o||distance(u,o)>m.range||material(o)!==m.material){u.contactWork=null;continue;}
   if(b.time>=task.next){let check;try{check=objectCheck({...o,distance:distance(u,o)},m);}catch{u.contactWork=null;continue;}const before=o.fractureWork||0;o.fractureWork=Math.min(check.cap,before+m.workPerPulse);o.condition=o.fractureWork>=check.limit?'broken':'cracked';o.fractured=true;b.objectWorkLog??=[];b.objectWorkLog.push({id:'work-'+b.encounterId+'-'+(++b.serial),castId:task.castId,objectId:o.id,skillId:task.prepared.skill.id,actorId:u.id,at:b.time,distance:distance(u,o),work:o.fractureWork-before});b.objectWorkLog=b.objectWorkLog.slice(-4096);
    b.skillAward(u,task.prepared.skill,task.castId,o,o.fractureWork-before);b.emit('skill_fx',{actor:u.id,x:o.x,y:o.y,visual:d.visual});task.next+=m.pulseInterval;task.left--;if(task.left<=0||o.fractureWork>=check.cap)u.contactWork=null;
   }
  }
 }
 function reduction(b,target,part,kind,source,registered){if(kind==='magic')return 0;let n=0;const h=b.statuses(target).find(s=>s.key==='body_harden');if(h){const match=h.part===part||h.part==='torso'&&['torso','chest','abdomen'].includes(part)||(target.braceUntil||0)>b.time&&['arm','shoulder'].includes(h.part);if(match)n+=.4;}
  const impact=kind==='gauntlet'&&source.equipmentType==='unarmed'&&!registered?.projectile&&!registered?.common?.mechanic?.delivery;
  if(impact&&b.hasStatus(target,'body_flex'))n+=.15;return n;
 }
 function melee(b,source,target,amount,kind,registered,C){if(registered?.skill||!['gauntlet'].includes(kind)||distance(source,target)>1.8)return{amount,registered};const held=b.statuses(source).find(s=>s.key==='edge_blade');if(!held)return{amount,registered};const d=C.get(held.commonId),skill=b.skillBook.skills.find(s=>s.id===held.skillId);if(!d||!skill)return{amount,registered};return{amount:amount+d.mechanic.edgeAmount,registered:{...(registered||{}),skill,castId:held.castId,common:d,edgeContact:true}};}
 function actionCost(d,u){if(!d||!supports(d.mechanic.kind))return d?.mana;const active=(u.commonStatuses||[]).some(s=>s.commonId===d.id&&s.key===d.mechanic.kind&&s.until>0);return active?(d.mechanic.kind==='edge_blade'?d.mechanic.detachMana:0):d.mana;}
 function actionLabel(d,u){const cost=actionCost(d,u);return d.name+(cost===0?' 해제':d.mechanic.kind==='edge_blade'&&cost===d.mechanic.detachMana?' 날리기':'');}
 return{supports,prepare,release,step,reduction,melee,actionCost,actionLabel,material,objectCheck};
});
