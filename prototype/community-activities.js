import {availableRoutes} from './days.js';
import {advanceFreeTime,finishFreeActivity} from './free-roam.js';
import {planEvent} from './event-engine.js';
import {introduce,contact,seePeople} from './identity.js';
import {wetWeather} from './weather.js';
export const communityActivityDefinitions={
 'volunteer-recruit':{title:'봉사 물품 준비',club:'volunteer',day:1,route:'volunteer',venue:{location:'hall',area:'clubs',label:'자유관 · 봉사 준비 공간'},intro:'공용 테이블에서 학생들이 물품을 나누고 있다. 수첩을 펴놓은 학생이 빈 상자 하나를 옆으로 밀어준다. “처음 오셨으면 이 목록부터 같이 볼까요?”',stages:[
  {name:'목록과 실제 물품 확인',prompt:'목록의 수량과 쌓인 상자를 번갈아 본다. 지금 무엇부터 맞춰볼까?',choices:[
   {id:'audit',label:'목록을 읽으며 다른 사람이 센 수량과 대조한다.',approach:'listen',fact:'봉사 물품 수량 대조 방법',reply:'“아, 제가 센 건 봉투 수였네요.” 세는 단위가 달랐던 부분을 찾아 목록 옆에 적는다. 물품을 다시 꺼내기 전에 기준부터 맞췄다.'},
   {id:'sort',label:'같은 종류의 물품을 모아 놓고 빠진 묶음을 찾는다.',approach:'organize',fact:'봉사 준비 물품 분류표',reply:'상자에서 물품을 꺼내 종류별로 놓는다. “이렇게 나누면 다음 사람이 세기도 편하겠어요.” 아직 포장하지 않은 묶음이 눈에 들어온다.'}]},
  {name:'포장과 운반',prompt:'확인한 물품이 테이블 위에 나뉘었다. 포장을 끝내고 옮기기 전에 맡을 일을 고른다.',choices:[
   {id:'labels',label:'포장에 목적지와 수량을 적고 옆 사람과 한 번 더 확인한다.',fact:'봉사 물품 포장 표기',reply:'혼자 맞다고 넘기지 않고 표시한 수량을 옆 사람에게 읽어달라고 한다. 헷갈리던 상자에 목적지를 다시 붙였다.'},
   {id:'carry',label:'통로를 비우고 무거운 상자를 지정한 보관 자리로 나른다.',fact:'자유관 봉사 물품 임시 보관 자리',reply:'운반할 상자를 먼저 정하고 문 앞에 놓인 작은 물건을 치운다. “이쪽은 비워둘게요.” 옮겨놓은 뒤에는 포장 중인 물품과 섞이지 않게 구분한다.'}]},
  {name:'인수인계',prompt:'테이블이 조금 비었다. 누가 다음 일을 이어받아도 알 수 있도록 마무리해야 한다.',choices:[
   {id:'handover',label:'완료한 묶음과 남은 일을 적어 다음 사람에게 넘긴다.',fact:'봉사 준비 인수인계 메모',reply:'끝난 일과 아직 확인이 필요한 일을 따로 적었다. “여기부터 이어가면 되는 거죠?” 다음 사람이 메모를 읽고 자기 쪽으로 가져간다.'},
   {id:'next',label:'남은 일을 정리한 뒤 다음 공개 활동에서 할 일도 물어본다.',fact:'봉사 사진 정리 공개 활동 안내',reply:'인수인계를 마친 뒤 사진 정리 이야기를 듣는다. “내일은 도서관에서 찍어둔 사진을 고를 거예요.” 안내를 들었지만 참석 약속까지 잡은 것은 아니다.'}]}]},
 'music-recruit':{title:'음악 동아리 공개 합주',club:'music',day:1,route:'rehearsal',venue:{location:'arts',area:'band',label:'예술동 4층 구석 · 대형 합주실'},intro:'방 안에서는 각자 튜닝과 소리 확인을 하고 있다. 문 가까이 있던 학생이 악보에서 눈을 든다. “공개 합주 보고 오셨어요? 어떤 파트로 같이 해볼래요?”',stages:[
  {name:'맡을 파트 정하기',prompt:'모집글에 적힌 곡의 악보를 펼친다. 오늘은 어떤 파트로 들어갈까?',choices:[
   {id:'vocal',label:'보컬로 들어가 가사의 흐름과 들어갈 박자를 확인한다.',fact:'공개 합주 보컬 파트 메모',reply:'작게 한 구절을 불러 음역을 확인한다. “그럼 두 번째 마디부터 같이 들어가봐요.” 반주를 맡은 학생이 시작 지점을 짚어준다.'},
   {id:'bass',label:'베이스 파트를 맡아 드럼과 기준 박자를 맞춘다.',fact:'공개 합주 베이스 파트 메모',reply:'태이가 다룰 줄 아는 베이스 파트로 들어간다. 손부터 빠르게 움직이기보다 킥과 겹치는 지점을 짚고 짧게 반복해본다.'},
   {id:'guitar',label:'기타 파트로 들어가 코드와 소리 크기를 확인한다.',fact:'공개 합주 기타 파트 메모',reply:'코드를 확인하고 다른 악기를 덮지 않을 정도로 소리를 맞춘다. “여기서는 조금 비워도 좋겠어요.” 건반을 맡은 학생과 겹치는 음을 나눈다.'}]},
  {name:'다른 파트와 맞추기',prompt:'한 번 맞춰보니 후렴으로 넘어갈 때 소리가 급해진다. 다시 시작하기 전에 무엇을 바꿔볼까?',choices:[
   {id:'blend',label:'다른 파트의 소리를 듣고 호흡과 음량을 맞춘다.',fact:'공개 합주 호흡 조율 메모',reply:'서로의 소리가 들릴 만큼만 음량을 줄이고 같은 구간을 반복한다. “이번에는 넘어갈 때 덜 급하네요.” 한 번에 완벽해지지는 않아도 기준이 생겼다.'},
   {id:'mark',label:'전환 구간에 표시하고 누가 신호를 줄지 먼저 정한다.',fact:'공개 합주 전환 신호 메모',reply:'악보의 전환 구간에 표시를 남기고 신호를 정했다. 태이가 맡은 파트만 잘 끝내는 대신 다음 사람이 들어올 자리를 함께 확인한다.'}]},
  {name:'연습 마무리',prompt:'마지막으로 한 번 더 맞춰볼 시간이 남았다. 다음 연습에 무엇을 남길까?',choices:[
   {id:'take',label:'짧게 맞춰본 내용을 휴대폰에 기록하고 수정할 부분을 적는다.',fact:'공개 합주 수정 메모',reply:'마지막 합주에서 확인한 부분을 기록한다. 지금 잘 들린 부분과 다음에 고칠 부분을 따로 적어 자작곡 작업 때도 참고할 수 있게 했다.'},
   {id:'gear',label:'악기와 케이블을 함께 정리하고 보관 위치를 확인한다.',fact:'예술동 대형 합주실 케이블 보관 위치',reply:'케이블을 밟지 않게 걷어 올리고 함께 정리한다. “이건 이쪽에 두면 돼요.” 보관 위치를 알게 됐지만 공동 장비를 개인 물건처럼 챙기지는 않는다.'}]}]},
 'football-recruit':{title:'축구 동아리 공개 체험',club:'football',day:2,route:'football',venue:{location:'gym',area:null,label:'공개 훈련 운동장'},intro:'선수로 참가한 남학생들이 몸을 풀고, 운영을 맡은 부원은 순서를 안내하고 있다. “바로 뛰지 말고 준비 운동부터 같이 해요.” 가입 여부부터 묻기보다 움직일 자리를 내준다.',stages:[
  {name:'준비 운동',prompt:'처음부터 무리하지 않고 오늘 움직일 범위부터 확인한다.',choices:[
   {id:'warm',label:'다 같이 몸을 풀며 발목과 어깨의 움직임을 확인한다.',fact:'축구 체험 준비 운동 순서',reply:'몸을 충분히 풀고 호흡을 고른다. 평소 운동을 해왔더라도 오늘 바닥과 함께 움직일 사람들의 간격은 따로 확인한다.'},
   {id:'observe',label:'시범을 본 뒤 안전한 간격을 잡고 준비 운동에 들어간다.',fact:'축구 체험 안전 간격',reply:'앞사람이 움직이는 범위를 보고 간격을 넓혔다. 운영진이 다음 순서를 설명하는 동안에도 가볍게 몸을 움직인다.'}]},
  {name:'짝 훈련',prompt:'짝을 지어 짧게 공을 주고받거나 움직임을 맞춰볼 차례다.',rainPrompt:'비 때문에 실내로 바뀌었다. 공을 차는 대신 매트와 준비 공간에서 할 훈련을 고른다.',choices:[
   {id:'pass',label:'짝과 짧은 패스를 주고받으며 공을 받을 위치를 맞춘다.',fact:'축구 체험 짝 패스 훈련',reply:'공을 보내는 쪽만 보지 않고 상대가 편하게 받을 위치로 움직여본다. 같은 거리도 타이밍이 맞아야 자연스럽게 이어진다.'},
   {id:'press',label:'표시된 구간에서 방향을 바꾸며 상대와 간격을 맞춘다.',fact:'축구 체험 방향 전환 훈련',reply:'빠르게 달리는 것보다 멈추고 방향을 바꾸는 구간을 확인한다. 다른 사람의 동선을 가로지르지 않게 차례를 맞췄다.'}],rainChoices:[
   {id:'mobility',label:'실내에서 관절 가동성과 기본 동작을 맞춰본다.',fact:'체육관 실내 가동성 훈련',reply:'젖은 운동장 대신 실내에서 움직일 범위를 확인한다. 발목과 고관절 동작을 차례로 맞추고 바닥에서 미끄러지지 않게 간격을 둔다.'},
   {id:'balance',label:'균형과 코어 동작을 짝과 번갈아 확인한다.',fact:'체육관 실내 균형 훈련',reply:'속도를 겨루기보다 몸이 흔들리는 구간을 서로 확인한다. 가볍게 시작해 동작이 무너지지 않는 선에서 반복했다.'}]},
  {name:'정리와 피드백',prompt:'체험 훈련이 끝나간다. 숨을 고르며 오늘 확인한 것을 정리한다.',choices:[
   {id:'cool',label:'정리 운동을 하고 다음에 필요한 준비물을 확인한다.',fact:'축구 공개 체험 준비물 안내',reply:'호흡을 낮추고 정리 운동을 마친 뒤 다음 체험에 필요한 것을 물었다. 안내를 들었다고 가입이나 참석을 자동으로 결정하지는 않는다.'},
   {id:'feedback',label:'오늘 맞추기 어려웠던 동작을 운영진에게 물어본다.',fact:'축구 체험 동작 피드백',reply:'움직임을 맞추기 어려웠던 구간을 구체적으로 물었다. 운영진이 짧게 시범을 보이고, 태이도 같은 위치에서 한 번 더 확인한다.'}]}]}
};
export function communityActivityKey(s,postId){return `${s.day}:${postId}`;}
export function sessionStore(s){s.activitySessions??={active:null,records:{}};return s.activitySessions;}
export function currentCommunityActivity(s,key=s.activitySessions?.active){return s.activitySessions?.records?.[key]??null;}
export function activityAvailability(s,postId,session=null){
 const def=communityActivityDefinitions[postId];if(!def)return {ok:false,reason:'연결된 공개 활동이 없습니다.'};
 if(s.day!==def.day)return {ok:false,reason:`${def.day}일차 13:00부터 진행하는 공개 활동입니다.`};
 const stored=session??currentCommunityActivity(s,communityActivityKey(s,postId));
 if(stored?.status==='completed'||(def.route!=='rehearsal'&&(s.freeDay?.completed??[]).some(a=>a.id===def.route)))return {ok:false,reason:'이미 마친 공개 활동입니다.'};
 const route=stored?.route??availableRoutes(s).find(r=>r.id===def.route);
 if(!route||route.locked)return {ok:false,reason:route?.lockReason??'지금은 참여할 수 없습니다.'};
 if(s.clock.minute<780)return {ok:false,reason:'현장 공개 활동은 13:00부터 시작합니다. 수업과 공강 시간을 확인해 주세요.'};
 const remaining=(stored?.duration??route.duration)-(stored?.spent??0);
 if(s.freeDay?.home||s.clock.minute+remaining>1080)return {ok:false,reason:'18:00 준비 마감까지 남은 활동을 끝내기 어렵습니다. 오늘은 안내만 확인할 수 있습니다.'};
 return {ok:true,route,remaining};
}
export function pauseCommunityActivity(state){
 const s=structuredClone(state),store=sessionStore(s),record=currentCommunityActivity(s);
 if(record?.status==='active'){record.status='paused';store.active=null;}
 return s;
}
export function beginCommunityActivity(state,postId){
 const availability=activityAvailability(state,postId);if(!availability.ok)throw new Error(availability.reason);
 if(!state.flow?.postsRead?.[postId])throw new Error('해당 모집글을 먼저 읽어 주세요.');
 const existing=currentCommunityActivity(state,communityActivityKey(state,postId));
 if(existing)return resumeCommunityActivity(state,communityActivityKey(state,postId));
 const s=pauseCommunityActivity(state),store=sessionStore(s),def=communityActivityDefinitions[postId],rain=def.club==='football'&&wetWeather(s);
 const venue=rain?{location:'gym',area:'fitness',label:'체육관 · 체력단련실'}:structuredClone(def.venue);
 const record={key:communityActivityKey(s,postId),postId,day:s.day,route:structuredClone(availability.route),routeId:def.route,duration:availability.route.duration,startedAt:s.clock.minute,spent:0,step:0,choices:[],segments:[],status:'active',rain,venue,last:null};
 store.records[record.key]=record;store.active=record.key;if(def.club==='volunteer')seePeople(s,['yeogyeong']);s.location=venue.location;s.buildingArea=venue.area?{place:venue.location,id:venue.area}:null;s.pace={count:0,seen:{}};return s;
}
export function resumeCommunityActivity(state,key){
 const record=currentCommunityActivity(state,key);if(!record)throw new Error('이어갈 활동이 없습니다.');
 if(record.day!==state.day)throw new Error('이전 날짜의 공개 활동은 이어갈 수 없습니다.');
 const availability=activityAvailability(state,record.postId,record);if(!availability.ok)throw new Error(availability.reason);
 const s=pauseCommunityActivity(state),store=sessionStore(s),r=store.records[key];r.status='active';store.active=key;s.location=r.venue.location;s.buildingArea=r.venue.area?{place:r.venue.location,id:r.venue.area}:null;s.pace={count:0,seen:{}};return s;
}
export function communityActivityStage(s){
 const r=currentCommunityActivity(s);if(!r)return null;const def=communityActivityDefinitions[r.postId],stage=def.stages[r.step];
 if(!stage)return null;return {...stage,prompt:r.rain&&stage.rainPrompt?stage.rainPrompt:stage.prompt,choices:r.rain&&stage.rainChoices?stage.rainChoices:stage.choices};
}
export function progressCommunityActivity(state,choice){
 const record=currentCommunityActivity(state),stage=communityActivityStage(state);
 if(!record||record.status!=='active'||!stage||record.day!==state.day)throw new Error('진행 중인 공개 활동이 없습니다.');
 if(state.location!==record.venue.location||(record.venue.area&&(state.buildingArea?.place!==record.venue.location||state.buildingArea?.id!==record.venue.area)))throw new Error('먼저 활동 현장으로 돌아가 주세요.');
 const selected=stage.choices.find(c=>c.id===choice);if(!selected)throw new Error('지금 할 수 없는 활동입니다.');
 const availability=activityAvailability(state,record.postId,record);if(!availability.ok)throw new Error(availability.reason);
 let s=structuredClone(state),r=currentCommunityActivity(s),def=communityActivityDefinitions[r.postId];
 const chunks=[Math.round(r.duration/6),Math.round(r.duration/2),r.duration-Math.round(r.duration/6)-Math.round(r.duration/2)];
 const minutes=chunks[r.step],start=s.clock.minute;
 if(selected.approach)s=planEvent(s,r.routeId,selected.approach);
 const firstExchange=def.club==='volunteer'&&!contact(s,'yeogyeong').introduced;
 if(firstExchange){introduce(s,'yeogyeong','community-activity-exchange');s.memory.push(`[${s.day}일차] 봉사 물품을 확인하며 차여경과 인사를 나눴다.`);}
 r=currentCommunityActivity(s);r.choices.push({stage:r.step,id:choice});r.spent+=minutes;r.step++;r.last={player:selected.label,speaker:def.club==='volunteer'?'차여경':'현장의 부원',text:(firstExchange?'“차여경이에요. 같이 봐주셔서 고마워요.” ':'')+selected.reply};r.segments.push({start,end:start+minutes});
 if(!s.known.includes(selected.fact))s.known.push(selected.fact);
 s.memory.push(`[${s.day}일차] ${def.title}: ${selected.label} ${selected.reply}`);
 s=advanceFreeTime(s,minutes,{activeChoice:r.step===def.stages.length?r.routeId:null});s.pace={count:0,seen:{}};r=currentCommunityActivity(s);
 if(r.step===def.stages.length){
  s=finishFreeActivity(s,r.routeId,r.route,{start:r.startedAt,activeMinutes:r.spent});r=currentCommunityActivity(s);r.status='completed';r.finishedAt=s.clock.minute;
  s.lastResult+=' '+communityActivityOutcome(r);
  r.result=s.lastResult;s.memory.push(`[${s.day}일차] ${def.title} 공개 체험을 마쳤다. 가입 여부는 아직 별개다.`);
 }
 return s;
}

export function communityActivityOutcome(record){
 const ids=record.choices.map(c=>c.id);
 if(record.postId==='volunteer-recruit')return ids[2]==='next'?'남은 일을 넘겨준 뒤 다음 공개 사진 정리 활동에 대한 안내도 들었다.':'다음 사람이 이어받을 수 있도록 완료한 일과 남은 일을 정리했다.';
 if(record.postId==='music-recruit')return `${{vocal:'보컬',bass:'베이스',guitar:'기타'}[ids[0]]} 파트로 들어가 ${ids[1]==='blend'?'다른 파트와 호흡과 음량을 맞췄다.':'전환 신호를 함께 정했다.'} ${ids[2]==='take'?'다음 연습과 곡 작업에 참고할 수정 메모를 남겼다.':'케이블을 함께 정리하고 보관 위치를 확인했다.'}`;
 return `${record.rain?'실내에서 ':''}${{pass:'짝 패스',press:'방향 전환',mobility:'가동성',balance:'균형과 코어'}[ids[1]]} 훈련을 했다. ${ids[2]==='cool'?'정리 운동과 다음 체험의 준비물 확인까지 마쳤다.':'운영진에게 동작 피드백을 듣고 다시 확인했다.'}`;
}
