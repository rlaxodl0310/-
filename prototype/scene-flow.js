import {buildingLinks} from './campus-buildings.js';
import {availableRoutes} from './days.js';
export function flowState(s){s.flow??={seen:{}};return s.flow;}
export function markFlow(state,kind,value){const s=structuredClone(state);flowState(s).seen[kind+(value?':'+value:'')]=true;return s;}
export function campusScene(s){
 return {text:s.phase==='evening'?'캠퍼스에 하나둘 불이 켜진다. 아직 머물며 주변을 둘러볼 수도, 집으로 돌아갈 수도 있다.':'학교에 도착했다. 학생들이 각자의 일로 건물 사이를 오간다. 어디로 갈지 천천히 둘러본다.',choices:[
  {label:'자유관 쪽으로 걸어간다.',action:'visit',value:'hall'},
  {label:'도서관으로 이어지는 길을 따라간다.',action:'visit',value:'library'},
  {label:'대학가 카페 쪽으로 발길을 돌린다.',action:'visit',value:'cafe'},
  ...buildingLinks('hall').filter(c=>['cafeteria','academic'].includes(c.value)),
  {label:s.day<3?'오늘은 집으로 돌아간다.':'집으로 돌아가 지난 며칠을 떠올린다.',action:'go',value:'dayEnd'}]};
}
export function placeContinuations(s,place){
 const choices=[];
 if(s.clock.minute<1320){
  if(['arts','gym'].includes(place))choices.push({label:'연습실에 들러 합주할 수 있을지 살펴본다.',action:'select',value:'rehearsal'});
  if(['library','cafe'].includes(place))choices.push({label:'빈자리에 앉아 작업 중인 곡을 다듬는다.',action:'select',value:'work'});
  if(place==='library')choices.push({label:'돌아가기 전에 주변 길을 조금 더 알아둔다.',action:'select',value:'explore'});
  if(place==='cafe')choices.push({label:'카페를 나와 처마가 이어진 대학가 길을 돌아본다.',action:'select',value:'walk'});
 }
 if(s.phase==='afternoon'){
  if(s.day===3&&place==='arts')choices.push({label:'1층 공연장 쪽으로 가서 리허설 준비를 돕는다.',action:'select',value:'backstage'});
  if(s.day===1&&place==='hall')choices.push({label:'쌓인 물품 상자 쪽으로 가서 준비를 도울지 살펴본다.',action:'select',value:'volunteer'});
  if(s.day===2&&place==='library')choices.push({label:'펼쳐진 사진들을 함께 정리할 수 있을지 살펴본다.',action:'select',value:'review'});
  if(s.day===3&&place==='hall')choices.push({label:'아직 비어 있는 전시판 옆에서 준비를 돕는다.',action:'select',value:'exhibit'});
  if(s.day===3&&place==='hall'&&s.known.some(k=>['도서관으로 이어지는 길','대학가 연결 통로'].includes(k)))choices.push({label:'알아둔 연결 통로로 공연 장비를 옮기는 일을 돕는다.',action:'select',value:'shortcut'});
  if(s.day===3&&['hall','library'].includes(place)&&s.warnings?.evidence?.length)choices.push({label:'접한 안내가 마음에 걸린다. 다른 건물의 안내도 확인한다.',action:'select',value:'checkCampus'});
 }
 if(place!=='library')choices.push({label:'도서관으로 이어지는 길을 따라 걷는다.',action:'visit',value:'library'});
 if(place!=='hall')choices.push({label:'자유관 쪽에서 들리는 말소리를 따라간다.',action:'visit',value:'hall'});
 if(place==='library')choices.push({label:'건너편 대학가 카페 쪽으로 발길을 돌린다.',action:'visit',value:'cafe'});
 for(const link of buildingLinks(place))if(!choices.some(c=>c.action==='visit'&&c.value===link.value))choices.push(link);
 return choices.filter(c=>c.action!=='select'||((['rehearsal','work','explore','walk'].includes(c.value)||!(s.freeDay?.completed??[]).some(x=>x.id===c.value))&&availableRoutes(s).some(r=>r.id===c.value&&!r.locked&&s.clock.minute+r.duration<=1320)));
}
export function knownSceneRoutes(s){
 const seen=s.flow?.seen??{};
 const visited=place=>seen['visit:'+place]||Object.keys(s.encounters??{}).some(k=>k.includes(':'+place+':'));
 const invited=id=>s.appointments.some(a=>a.activity===id&&['pending','offered','kept'].includes(a.status));
 return availableRoutes(s).filter(r=>{
  if(['rehearsal','work','backstage'].includes(r.id))return true;
  if(r.id==='volunteer'||r.id==='exhibit')return seen['club:volunteer']||visited('hall')||s.memberships?.volunteer||invited(r.id);
  if(r.id==='football')return seen['club:football']||s.memberships?.football||invited(r.id);
  if(r.id==='review')return visited('library')||s.contacts?.soyul?.introduced||invited(r.id);
  if(r.id==='explore')return visited('library');
  return r.id==='walk'||r.id==='checkCampus'||(r.id==='shortcut'&&!r.locked);
 });
}
export function visibleSpatialActions(s,actions){
 return actions.filter(a=>!a.fromDay||a.fromDay<=s.day).filter(a=>{
  if(s.day!==1)return true;
  if(a.id==='tables')return !!s.dialogue?.sessions?.[`${s.day}:${s.phase}:yeogyeong`]||s.contacts?.yeogyeong?.introduced;
  if(a.id==='lounge')return !!s.contacts?.soyul?.introduced||!!s.contacts?.seoyeon?.introduced||Object.keys(s.encounters??{}).some(k=>k.includes(':hall:window'));
  return true;
 });
}
