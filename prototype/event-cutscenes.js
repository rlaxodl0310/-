import {presentPeople} from './days.js';
import {displayName,contact} from './identity.js';
import {characterActing} from './character-acting.js';
// Presentation only: no recruitment, relationship changes, RNG or time advancement.
const sdActorOrder=['taei','yeogyeong','seoyeon','soyul','iseo','dogyeom'];
function sdRelation(state,from,to){return state.relations?.[`${from}>${to}`]??{};}
function sdGuarded(state,id,ids){return ids.some(other=>other!==id&&((sdRelation(state,id,other).tension??0)>=3||(sdRelation(state,other,id).tension??0)>=3));}
export function composeCutscene(state,ids,{kind='conversation',text='',emotion,activeActor}={}){
 const actors=[...new Set(ids)].filter(id=>sdActorOrder.includes(id));
 if(!actors.length)return null;
 const tense=actors.some(id=>sdGuarded(state,id,actors));
 const cast=actors.map(id=>{
  const acting=characterActing(state,id,{text,heardText:text,listening:id!==activeActor,emotion:id===activeActor?emotion:undefined});
  const known=id==='taei'||contact(state,id).introduced,relation=sdRelation(state,id,'taei');
  const friendly=known&&(id==='taei'||((relation.familiarity??0)>=6&&(relation.trust??0)>=4));
  const row=sdGuarded(state,id,actors)?2:friendly&&['happy','warm'].includes(acting.emotion)?1:0;
  return {id,column:sdActorOrder.indexOf(id),row,label:displayName(state,id),reaction:row===2?'경계하는 반응':row===1?'편안한 반응':'조심스럽게 반응',speaking:id===activeActor};
 });
 return {id:`composed:${kind}:${actors.join(':')}`,kind,cast,tense,label:tense?'말 사이에 남은 거리':kind==='music'?'한 구절을 나눈 순간':kind==='exercise'?'잠깐 호흡을 고르는 순간':kind==='snack'?'간식을 사이에 둔 반응':'같은 자리, 서로 다른 반응'};
}
export function eventCutscene(state,screen,beat={},context={}){
 if(beat.kind!=='speech')return null;
 let ids=[],kind='conversation',activeActor=context.activeActor??beat.actor;
 if(screen==='personalEvent'){
  const r=state.personalEvents?.records?.[state.personalEvents?.active];
  if(!r||r.status!=='active'||r.stage!==1||r.day!==state.day||r.location!==state.location||!r.last||(Number.isFinite(r.until)&&state.clock.minute>r.until))return null;
  if(r.person!=='taei'&&(beat.actor==='taei'||beat.who==='김태이'))return null;
  const first=r.choices?.[0],place=state.location;
  ids=r.person==='taei'?['taei']:['taei',r.person];activeActor??=r.person;
  if(r.person==='taei'&&first==='sound'&&['arts','music'].includes(place))kind='music';
  else if(['taste','fair'].includes(first)&&['hall','cafeteria','cafe'].includes(place))kind='snack';
  else if(first==='rock'&&r.game?.result==='tie'&&['hall','cafeteria','cafe'].includes(place))kind='game';
  else if(first==='permission'&&place==='library')kind='sharing';
  else if(['steady','rhythm','playful'].includes(first)&&place==='field')kind='exercise';
  else if(first==='pass'&&place==='outdoorCourt')kind='exercise';
  else if(!['serious','worried'].includes(beat.emotion))return null;
 }else if(['dialogue','group'].includes(screen)){
  const present=presentPeople(state,state.location);
  ids=(context.participants??[]).filter(id=>id==='taei'||present.includes(id));
  if(!activeActor||!ids.includes(activeActor)||!ids.some(id=>id!=='taei'))return null;
  const acting=characterActing(state,activeActor,{text:beat.text,emotion:beat.emotion});
  if(!['happy','warm','serious','worried','surprised','bashful'].includes(acting.emotion))return null;
 }else return null;
 return composeCutscene(state,ids,{kind,text:beat.text,emotion:beat.emotion,activeActor});
}
