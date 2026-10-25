export const weatherTypes={
 sunny:{name:'맑음',icon:'☀',temperature:22},cloudy:{name:'흐림',icon:'☁',temperature:20},
 rain:{name:'비',icon:'☂',temperature:18},storm:{name:'강한 비',icon:'☂',temperature:16}
};
export function defaultWeather(){return {days:{1:{afternoon:'sunny',evening:'cloudy'},2:{afternoon:'rain',evening:'rain'},3:{afternoon:'cloudy',evening:'sunny'}}};}
export function weatherNow(s,day=s.day,phase=s.phase){const kind=s.weather?.days?.[day]?.[phase]??'sunny';return {kind,...weatherTypes[kind],temperature:weatherTypes[kind].temperature-(phase==='evening'?3:0)};}
export function wetWeather(s){return ['rain','storm'].includes(weatherNow(s).kind);}
export function hasUmbrella(s){return (s.inventory??[]).some(i=>i.id==='umbrella'&&i.quantity>0);}
export function weatherBlockMinutes(s,outdoor){return outdoor&&wetWeather(s)&&!hasUmbrella(s)?(weatherNow(s).kind==='storm'?45:40):30;}
export function weatherAtmosphere(s,place='campus'){
 const kind=weatherNow(s).kind;
 if(kind==='sunny')return place==='campus'?'햇빛이 광장 바닥에 길게 걸린다. 건물 사이로 학생들이 오간다.':'창 너머로 햇빛이 들어온다. 밖에서는 학생들이 다음 장소로 걸음을 옮긴다.';
 if(kind==='cloudy')return place==='campus'?'구름에 햇빛이 가려져 광장이 차분한 빛을 띤다.':'창밖이 흐려져 실내 조명이 조금 더 밝게 느껴진다.';
 if(place==='campus')return kind==='storm'?'빗줄기가 굵다. 학생들이 처마 아래에서 비가 잦아들기를 기다린다.':'광장에 빗방울이 떨어진다. 학생들이 우산을 펴고 건물 사이를 오간다.';
 return kind==='storm'?'창을 두드리는 빗소리가 커졌다. 밖으로 나가기보다 안에서 시간을 보내는 사람이 많다.':'출입문 옆에 접힌 우산들이 놓여 있다. 창밖으로 비가 내린다.';
}
export function weatherRoute(s,id,route){
 const kind=weatherNow(s,s.day,'afternoon').kind;if(!['rain','storm'].includes(kind))return route;
 if(id==='football')return {...route,description:'비로 운동장 사용을 쉬고 실내 기본 체력·스트레칭 체험으로 대체합니다. 동아리에서 안내한 같은 활동이므로 참석 약속은 정상 이행됩니다.',memory:'비로 축구 동아리 체험을 실내 기본 체력·스트레칭으로 대체했다. 실내 운동 공간을 확인했다.',knowledge:['축구 동아리 실내 운동 공간'],weatherNote:'우천 시 실내 체력 훈련으로 대체 · 참석 약속 유지'};
 if(['explore','walk','shortcut'].includes(id)){
  if(kind==='storm')return {...route,locked:true,weatherBlocked:true,lockReason:'강한 비로 야외 이동 활동을 쉬고 있습니다. 실내 활동을 선택해 주세요.',weatherNote:'강한 비 · 야외 활동 제한'};
  const extra=hasUmbrella(s)?0:30;
  return {...route,duration:route.duration+extra,description:route.description+' 비를 피해 처마와 건물 안쪽 동선을 따라 이동합니다.',memory:route.memory+' 비를 피해 덮인 구간을 골라 이동했다.',weatherNote:hasUmbrella(s)?'우산 준비 · 기존 소요 시간 유지':'우산 없이 이동 · 비를 피하는 데 30분 추가'};
 }
 return {...route,weatherNote:'실내 활동 · 날씨에 따른 소요 시간 변화 없음'};
}
export function adaptWeatherSchedule(s,plan){
 const next={...plan};if(s.day!==1||s.phase!=='afternoon'||!wetWeather(s))return next;
 // These optional trips are skipped; scheduled indoor duties continue.
 if(next.seoyeon==='cafe')next.seoyeon='hall';
 if(next.yeogyeong==='library')next.yeogyeong='hall';
 return next;
}
export function borrowUmbrella(state,returning=false){
 if(state.location!=='hall')throw new Error('학생회관 공용 우산 대여대에서 이용할 수 있습니다.');
 const s=structuredClone(state);s.inventory??=[];
 if(returning){
  if(!hasUmbrella(s))throw new Error('반납할 대여 우산이 없습니다.');
  s.inventory=s.inventory.filter(i=>i.id!=='umbrella');s.memory.push(`[${s.day}일차] 공용 우산을 대여대에 반납했다.`);
 }else{
  if(hasUmbrella(s))throw new Error('이미 대여 우산을 가지고 있습니다.');
  s.inventory.push({id:'umbrella',name:'대여 우산',quantity:1,borrowed:true});
  if(!s.known.includes('학생회관 공용 우산 대여대'))s.known.push('학생회관 공용 우산 대여대');
  s.memory.push(`[${s.day}일차] 학생회관에서 공용 우산을 빌렸다. 사용 뒤 반납할 수 있다.`);
 }
 return s;
}
export function setWeatherExample(state,kind){
 if(!weatherTypes[kind])throw new Error('알 수 없는 날씨입니다.');
 const s=structuredClone(state);s.weather??=defaultWeather();s.weather.days[s.day][s.phase]=kind;return s;
}

export function weatherAdjustAppointments(state,routes){
 const s=structuredClone(state);
 if(s.phase!=='afternoon')return s;
 for(const a of s.appointments??[])if(a.day===s.day&&['pending','offered'].includes(a.status)&&routes.some(r=>r.id===a.activity&&r.weatherBlocked)){
  a.status='weather-cancelled';s.messages.push({day:s.day,from:'활동 안내',text:`${a.label} 일정은 강한 비로 취소합니다. 개인의 약속 불이행으로 처리하지 않습니다.`});
  s.memory.push(`[${s.day}일차] ${a.label} 약속이 날씨 때문에 취소되었다.`);
 }
 return s;
}
