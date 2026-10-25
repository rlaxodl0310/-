// Prototype buildings and access rules; not a surveyed map of the real campus.
export const campusBuildings={
 cafeteria:{name:'학식당',description:'식사 공간과 식수대가 있는 학생 식당',entry:'식당 입구에서 식판 부딪히는 소리가 들린다. 메뉴 안내 옆으로 배식대와 퇴식구가 보인다.',fact:'학식당 위치',day:'식탁에 가방을 놓고 식사하거나 이야기를 나누는 학생들이 보인다.',night:'배식 시간이 지나면 직원들이 테이블을 닦는다. 입구 쪽 휴게 좌석에는 아직 사람이 있다.',actions:[
  {id:'menu',label:'오늘의 메뉴와 배식 시간을 확인한다.',fact:'학식당 배식 시간',text:'안내에는 점심 12:00~14:30, 저녁 17:00~19:00라고 적혀 있다. 오늘 메뉴는 제육볶음과 두부 반찬이다. 식수대는 퇴식구 맞은편에 있다.'},
  {id:'meal',label:'배식대에서 식사를 받아 먹는다.',fact:'학식당 식수대 위치',meal:true,text:'식판을 받아 자리를 잡는다. 급하게 먹지 않으려고 휴대폰은 가방에 넣어둔다. 식사를 마친 뒤 퇴식구에 식판을 정리하고 물을 마신다.'},
  {id:'water',label:'식수대에서 물을 마시고 잠깐 쉰다.',fact:'학식당 식수대 위치',text:'물을 받아 마시고 입구 쪽 의자에 앉는다. 식당을 오가는 사람들 사이에서 다음에 어디로 갈지 생각해본다.'}]},
 dorm:{name:'기숙사',description:'방문객이 이용할 수 있는 안내 데스크와 현관 앞 공간',entry:'기숙사 현관에는 학생들이 택배를 찾으러 오간다. 거주 구역 앞에는 출입 확인 장치가 있고, 방문객 안내는 현관 밖에 붙어 있다.',fact:'기숙사 현관 위치',day:'현관 밖 벤치에서 학생들이 통화한다. 안내 데스크 너머 생활 구역은 거주자만 드나든다.',night:'현관에 조명이 켜졌다. 출입 확인을 마친 학생들이 안으로 들어간다. 방문객은 현관 앞에서 기다린다.',actions:[
  {id:'guide',label:'현관의 방문객 안내를 읽는다.',fact:'기숙사 방문객 출입 안내',text:'방문객은 현관 안내 공간을 이용하고 생활 구역은 허가 없이 들어갈 수 없다고 적혀 있다. 태이의 집은 학교 앞 자취방이다. 여기서 묵을 수 있는 것은 아니다.'},
  {id:'bench',label:'현관 밖 벤치에서 잠깐 쉰다.',fact:'기숙사 앞 쉼터',text:'현관 밖 벤치에 앉아 가방끈을 고쳐 멘다. 택배를 들고 돌아가는 학생과 잠깐 시선이 마주친다. 이곳에서 생활하는 사람들의 하루가 따로 흐르고 있다.'}]},
 academic:{name:'강의동',description:'강의실과 공용 학습 공간이 있는 건물',entry:'강의실 문 옆에 호실이 적혀 있다. 수업 중인 방에서는 낮은 목소리가 들리고, 복도 끝 공용 학습 공간에는 빈자리가 보인다.',fact:'강의동 위치',day:'수업을 마친 학생들과 다음 강의실을 찾는 학생들이 복도에서 엇갈린다.',night:'일부 강의실의 불이 꺼졌다. 공용 학습 공간에서는 노트북 화면이 빛난다.',actions:[
  {id:'rooms',label:'층별 강의실 안내를 살펴본다.',fact:'강의동 계단과 층별 안내',text:'층별 안내에서 강의실 호실과 계단 위치를 확인한다. 문이 닫힌 강의실은 방해하지 않고 지나간다.'},
  {id:'notes',label:'공용 학습 공간에서 노트를 정리한다.',fact:'강의동 공용 학습 공간',text:'공용 책상에 앉아 가방에서 노트를 꺼낸다. 밀린 메모를 정리하고 오늘 더 확인할 내용에는 작게 표시를 해둔다.'}]},
 music:{name:'음악 연습동',description:'연습실과 합주 공간을 둘러볼 수 있는 건물',entry:'방음문 사이로 베이스의 낮은 진동이 전해진다. 복도에는 악기 케이스가 놓여 있고 연습실 앞에 이용 안내가 붙어 있다.',fact:'음악 연습동 위치',day:'방음문이 열릴 때마다 짧은 연주 소리가 새어 나온다. 학생들이 케이스를 메고 방을 오간다.',night:'복도는 한산해졌지만 몇몇 연습실은 아직 사용 중이다. 문 앞 이용 표시를 확인할 수 있다.',actions:[
  {id:'rooms',label:'연습실 이용 안내와 위치를 확인한다.',fact:'음악 연습동 연습실 안내',text:'안내에서 개인 연습실과 합주실 위치를 확인한다. 사용 중 표시가 있는 방은 건드리지 않고 비어 있는 복도 쪽으로 물러난다.'},
  {id:'voice',label:'휴게 공간에서 가사를 메모한다.',fact:'음악 연습동 휴게 공간',text:'휴게 공간에 앉아 떠오른 문장을 휴대폰 메모에 적는다. 아직 멜로디는 붙이지 않고, 부를 때 숨이 끊기는 위치만 표시한다.'}]},
 gym:{name:'체육관',description:'실내 운동 공간과 공용 준비 공간',entry:'체육관 안에서 운동화가 바닥에 스치는 소리가 들린다. 입구 안내에는 사용 중인 구역과 이용 수칙이 적혀 있다.',fact:'체육관 위치',day:'실내 코트에서는 학생들이 공을 주고받는다. 준비 공간에는 몸을 풀 수 있는 자리가 남아 있다.',night:'운동을 마친 학생들이 장비를 정리한다. 입구의 이용 안내를 보고 비어 있는 준비 공간에 머문다.',actions:[
  {id:'guide',label:'체육관 이용 안내를 확인한다.',fact:'체육관 이용 안내',text:'사용 중인 코트에는 들어가지 않고 이용 안내를 읽는다. 준비 공간과 장비 보관 구역은 구분되어 있다. 보관된 장비를 개인 물품처럼 챙기지는 않는다.'},
  {id:'stretch',label:'준비 공간에서 가볍게 몸을 푼다.',fact:'체육관 준비 운동 공간',text:'가방을 옆에 두고 발목과 어깨부터 천천히 푼다. 무리한 훈련 대신 굳은 몸을 움직여 보고 호흡을 고른다.'}]}
};
export function mealPeriod(s){const m=s.clock.minute;return m>=720&&m<870?'lunch':m>=1020&&m<1140?'dinner':null;}
export function buildingActions(s,place=s.location){return (campusBuildings[place]?.actions??[]).filter(a=>!a.meal||(mealPeriod(s)&&!(s.buildingLife?.meals??[]).includes(`${s.day}:${mealPeriod(s)}`)));}
export function buildingAtmosphere(s,place){const b=campusBuildings[place];if(!b)return '';return (s.clock.minute>=(place==='cafeteria'?1140:1080)?b.night:b.day)+(place==='cafeteria'?(mealPeriod(s)?' 지금은 배식 중이다.':' 지금은 배식 시간이 아니다. 입구 휴게 공간은 이용할 수 있다.'):'');}
export function buildingActivity(state,id){
 const b=campusBuildings[state.location];const a=buildingActions(state).find(a=>a.id===id);
 if(!b||!a)throw new Error('지금 이 장소에서 할 수 없는 행동입니다.');
 if(state.clock.minute>=1320)throw new Error('오늘은 늦었습니다. 귀가할 시간입니다.');
 const s=structuredClone(state);s.buildingLife??={history:[],meals:[]};
 const repeated=s.buildingLife.history.some(h=>h.day===s.day&&h.minute===s.clock.minute&&h.place===s.location&&h.id===id);
 if(a.meal)s.buildingLife.meals.push(`${s.day}:${mealPeriod(s)}`);
 if(!repeated){s.buildingLife.history.push({day:s.day,minute:s.clock.minute,place:s.location,id});if(!s.known.includes(a.fact))s.known.push(a.fact);s.memory.push(`[${s.day}일차] ${b.name}: ${a.text}`);}
 return {state:s,text:repeated?'방금 확인한 곳이다. 잠깐 더 머물다가 시선을 돌린다.':a.text};
}
export function buildingLinks(place){
 const paths={hall:['cafeteria','academic','music'],library:['academic'],cafe:['dorm'],cafeteria:['hall','dorm'],dorm:['cafeteria','cafe'],academic:['library','music','gym'],music:['academic','hall'],gym:['academic','cafeteria']};
 const labels={cafeteria:'식당 쪽에서 나는 소리를 따라 학식당으로 간다.',dorm:'기숙사 현관 앞 길로 걸어간다.',academic:'강의동 쪽으로 걸어간다.',music:'음악 연습동으로 이어지는 길을 따라간다.',gym:'체육관 입구 쪽으로 걸어간다.',hall:'학생회관 쪽으로 걸어간다.',library:'도서관으로 이어지는 길을 따라 걷는다.',cafe:'대학가 카페 쪽으로 걸어간다.'};
 return (paths[place]??[]).map(value=>({label:labels[value],action:'visit',value}));
}
