import {availableRoutes} from './days.js';
export function flowState(s){s.flow??={seen:{}};return s.flow;}
export function markFlow(state,kind,value){const s=structuredClone(state);flowState(s).seen[kind+(value?':'+value:'')]=true;return s;}
export function campusScene(s){
 const seen=s.flow?.seen??{},evening=s.phase==='evening';
 if(evening)return {text:'건물 사이로 불이 하나둘 켜진다. 오늘 나눈 말과 남은 일들이 떠오른다.',choices:[{label:'아직 불이 켜진 학생회관 쪽으로 걷는다.',action:'visit',value:'hall'},{label:s.day<3?'자취방으로 돌아가 오늘을 마무리한다.':'돌아가는 길에 지난 며칠을 떠올린다.',action:'go',value:'dayEnd'}]};
 if(s.day===1&&!seen.board&&!seen['visit:hall'])return {text:'학생회관 앞에서 걸음을 늦춘다. 열린 문 안쪽에서 상자 끄는 소리가 들리고, 게시판에는 새 모집 안내가 겹쳐 붙어 있다.',choices:[{label:'게시판에 붙은 종이를 가까이서 읽는다.',action:'readBoard'},{label:'안쪽에서 들리는 소리를 따라 문을 연다.',action:'visit',value:'hall'}]};
 if(s.day===1)return {text:'게시판에서 고개를 들자 저편 연습실 쪽에서 합주 소리가 새어 나온다. 도서관으로 이어지는 길에는 나무가 줄지어 서 있다.',choices:[{label:'연습실 쪽으로 가서 합주 준비를 살펴본다.',action:'select',value:'rehearsal'},{label:'나무가 이어진 길을 따라 도서관 쪽으로 걷는다.',action:'visit',value:'library'},{label:seen.board?'열린 문으로 학생회관 안에 들어간다.':'아까 지나친 모집 안내를 읽어본다.',action:seen.board?'visit':'readBoard',value:seen.board?'hall':''}]};
 if(s.day===2){const football=seen.board||s.memberships?.football||s.appointments.some(a=>a.activity==='football');return {text:'휴대폰에 어제 작업하던 곡의 메모가 남아 있다. 교내에서는 각자 오늘 할 일을 시작하고, 대학가 카페 쪽으로 사람들이 걸어간다.',choices:[{label:'떠오른 가사를 잊기 전에 자취방에서 데모를 다듬는다.',action:'select',value:'work'},football?{label:'안내받은 축구 동아리 체험 장소로 향한다.',action:'select',value:'football'}:{label:'정리할 것이 남아 있던 학생회관으로 향한다.',action:'visit',value:'hall'},{label:'대학가 카페 쪽으로 천천히 걸어간다.',action:'visit',value:'cafe'}]};}
 return {text:'공연장 쪽에서 장비를 옮기는 소리가 들린다. 학생회관 입구에는 오늘 사진 전시 준비 안내가 붙어 있고, 도서관으로 향하는 학생들도 보인다.',choices:[{label:'공연장으로 가서 리허설 준비를 돕는다.',action:'select',value:'backstage'},{label:'사진 전시 안내가 붙은 학생회관으로 간다.',action:'visit',value:'hall'},{label:'자료실 쪽으로 가는 학생들을 따라 걷는다.',action:'visit',value:'library'}]};
}
export function placeContinuations(s,place){
 const choices=[];
 if(s.phase==='afternoon'){
  if(s.day===1&&place==='hall')choices.push({label:'쌓인 물품 상자 쪽으로 가서 준비를 도울지 살펴본다.',action:'select',value:'volunteer'});
  if(s.day===1&&place==='library')choices.push({label:'돌아가기 전에 주변 길을 조금 더 알아둔다.',action:'select',value:'explore'});
  if(s.day===2&&place==='library')choices.push({label:'펼쳐진 사진들을 함께 정리할 수 있을지 살펴본다.',action:'select',value:'review'});
  if(s.day===2&&place==='cafe')choices.push({label:'카페를 나와 처마가 이어진 대학가 길을 돌아본다.',action:'select',value:'walk'});
  if(s.day===3&&place==='hall')choices.push({label:'아직 비어 있는 전시판 옆에서 준비를 돕는다.',action:'select',value:'exhibit'});
  if(s.day===3&&place==='hall'&&s.known.some(k=>['도서관으로 이어지는 길','대학가 연결 통로'].includes(k)))choices.push({label:'알아둔 연결 통로로 공연 장비를 옮기는 일을 돕는다.',action:'select',value:'shortcut'});
  if(s.day===3&&['hall','library'].includes(place)&&s.warnings?.evidence?.length)choices.push({label:'접한 안내가 마음에 걸린다. 다른 건물의 안내도 확인한다.',action:'select',value:'checkCampus'});
 }
 if(place!=='library')choices.push({label:'도서관으로 이어지는 길을 따라 걷는다.',action:'visit',value:'library'});
 if(place!=='hall')choices.push({label:'학생회관 쪽에서 들리는 말소리를 따라간다.',action:'visit',value:'hall'});
 if(place==='library')choices.push({label:'건너편 대학가 카페 쪽으로 발길을 돌린다.',action:'visit',value:'cafe'});
 return choices.filter(c=>c.action!=='select'||availableRoutes(s).some(r=>r.id===c.value&&!r.locked));
}
export function knownSceneRoutes(s){
 const seen=s.flow?.seen??{};
 const visited=place=>seen['visit:'+place]||Object.keys(s.encounters??{}).some(k=>k.includes(':'+place+':'));
 const invited=id=>s.appointments.some(a=>a.activity===id&&['pending','offered','kept'].includes(a.status));
 return availableRoutes(s).filter(r=>{
  if(['rehearsal','work','backstage'].includes(r.id))return true;
  if(r.id==='volunteer'||r.id==='exhibit')return seen.board||visited('hall')||s.memberships?.volunteer||invited(r.id);
  if(r.id==='football')return seen.board||s.memberships?.football||invited(r.id);
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
