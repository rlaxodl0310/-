import {weatherRoute,adaptWeatherSchedule} from './weather.js';
export const days={
 1:{title:'서로의 시간을 알아가는 날',weekday:'목요일',event:'supplies',
  routes:{rehearsal:{name:'합주',duration:120,description:'연습실에서 합주하고 장비 위치를 익힙니다.',memory:'합주를 마쳤다. 연습실 장비 보관 위치를 확인했다.',knowledge:['연습실','장비 보관 위치']},volunteer:{name:'봉사 활동',duration:180,description:'물품 준비를 함께 합니다.',memory:'물품을 다시 세는 일을 도와 포장 누락을 확인했다.',knowledge:['봉사 준비실','물품 수량 불일치 사건']},explore:{name:'자유 탐색',duration:60,description:'학생회관에서 도서관까지 걸으며 길을 알아봅니다.',memory:'학생회관 주변을 걸으며 도서관으로 이어지는 길을 확인했다.',knowledge:['학생회관','도서관으로 이어지는 길']}},
  schedules:{afternoon:{yeogyeong:'hall',seoyeon:'hall',soyul:'hall'},evening:{yeogyeong:'hall',seoyeon:'hall',soyul:'hall'}}},
 2:{title:'어제의 말이 남은 자리',weekday:'금요일',event:'photo-selection',
  routes:{football:{name:'축구 동아리 체험 훈련',duration:90,description:'운동장에서 공개 체험 훈련에 참여합니다. 가입 여부와 관계없이 한 번 경험할 수 있습니다.',memory:'축구 동아리 공개 훈련에 참여했다. 운동장과 공용 장비 보관 장소를 살폈다.',knowledge:['운동장','축구 공용 장비 보관 위치']},work:{name:'개인 음악 작업',duration:120,description:'작업 중인 자작곡 데모를 다듬습니다.',memory:'자작곡 데모를 다듬었다. 떠오른 이야기를 가사 메모로 남겼다.',knowledge:['작업 데모']},review:{name:'사진 정리 함께하기',duration:90,description:'도서관에서 소율과 봉사 사진을 고릅니다. 관계에 따라 대화가 달라집니다.',memory:'소율과 사진을 정리했다. 여경이 요청한 파일을 함께 분류했다.',knowledge:['봉사 사진 정리']},walk:{name:'대학가 산책',duration:60,description:'대학가를 걸으며 카페와 공연장 사이의 길을 살펴봅니다.',memory:'대학가에서 공연장 옆 출입구와 연결 통로를 확인했다.',knowledge:['대학가 연결 통로']}},
  schedules:{afternoon:{yeogyeong:'hall',seoyeon:'cafe',soyul:'library'},evening:{yeogyeong:'hall',seoyeon:'hall',soyul:'hall'}}},
 3:{title:'겹쳐진 약속',weekday:'토요일',event:'campus-showcase',
  routes:{checkCampus:{name:'교내 안내 확인',duration:90,description:'학생회관과 도서관의 현장 안내를 확인합니다. 확인하는 동안 다른 약속과 겹치지 않는지 살펴봅니다.',memory:'교내 현장 안내를 확인하는 데 오후를 보냈다.',knowledge:[],requiresWarning:true},backstage:{name:'공연 리허설 참여',duration:120,description:'합주 일정에 참여해 무대 준비를 돕습니다. 다른 약속과 시간을 맞춰 참여할 수 있습니다.',memory:'공연 리허설에 참여했다. 음악 작업과 무대 준비를 이어갔다.',knowledge:['공연 준비 경험']},exhibit:{name:'사진 전시 준비',duration:120,description:'봉사단의 작은 활동 사진 전시를 준비합니다. 리허설과 시간이 겹칩니다.',memory:'봉사단 사진 전시 준비를 함께했다. 사진을 고른 사람들의 이야기를 들었다.',knowledge:['사진 전시 준비']},shortcut:{name:'연결 통로로 장비 운반 돕기',duration:60,description:'미리 알아둔 길로 공연 장비를 옮깁니다. 짧은 시간에 물품을 전달할 수 있지만 다른 활동에 끝까지 참여하지는 못합니다.',memory:'미리 알아둔 연결 통로로 장비를 전달했다. 길을 알아둔 경험이 도움이 됐다.',knowledge:['연결 통로 활용'],requiresAny:['도서관으로 이어지는 길','대학가 연결 통로']}},
  schedules:{afternoon:{yeogyeong:'hall',seoyeon:'hall',soyul:'library'},evening:{yeogyeong:'hall',seoyeon:'hall',soyul:'hall'}}}
};
const personalActivities={rehearsal:days[1].routes.rehearsal,work:days[2].routes.work,explore:days[1].routes.explore,walk:days[2].routes.walk};
for(const day of Object.values(days))day.routes={...personalActivities,...day.routes};
export const locations={hall:'학생회관',library:'도서관',cafe:'대학가 카페'};
export function availableRoutes(s){return Object.entries(days[s.day??1].routes).filter(([,r])=>!r.requiresWarning||(s.warnings?.evidence?.length??0)>0).map(([id,r])=>weatherRoute(s,id,{id,...r,locked:!!r.requiresAny&&!r.requiresAny.some(k=>s.known.includes(k)),lockReason:r.requiresAny&&!r.requiresAny.some(k=>s.known.includes(k))?'이전 탐색으로 연결 통로를 알아야 합니다.':null}));}
function baseSchedule(s){
 if(s.day!==1||s.phase!=='afternoon'||!s.clock)return days[s.day??1].schedules[s.phase];
 const m=s.clock.minute;
 if(m<840)return {yeogyeong:'hall',seoyeon:'hall',soyul:'hall'};
 if(m<900)return {yeogyeong:'hall',seoyeon:'cafe',soyul:'library'};
 if(m<960)return {yeogyeong:(s.relations['yeogyeong>soyul']?.tension??0)>=3?'hall':'library',seoyeon:'hall',soyul:'library'};
 return {yeogyeong:'hall',seoyeon:'hall',soyul:'hall'};
}
export function currentSchedule(s){const plan=adaptWeatherSchedule(s,baseSchedule(s));if(s.day===3&&s.phase==='afternoon'&&(s.world?.stage??'campus')==='campus')Object.assign(plan,s.risk?.positions??{});return plan;}
export function presentPeople(s,location){const plan=currentSchedule(s);return Object.keys(plan).filter(id=>plan[id]===location);}
