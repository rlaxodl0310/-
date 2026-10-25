// User-confirmed building uses/floors. Paths and service rules remain prototype assumptions.
export const campusBuildings={
 cafeteria:{name:'외식관',description:'요리 관련 학과 · 학식당 · 카페 · 편의점 · 조리실습실',entry:'식당 입구에서 식판 부딪히는 소리가 들린다. 메뉴 안내 옆으로 배식대와 퇴식구가 보인다.',fact:'학식당 위치',day:'식탁에 가방을 놓고 식사하거나 이야기를 나누는 학생들이 보인다.',night:'배식 시간이 지나면 직원들이 테이블을 닦는다. 입구 쪽 휴게 좌석에는 아직 사람이 있다.',actions:[
  {id:'menu',label:'오늘의 메뉴와 배식 시간을 확인한다.',fact:'학식당 배식 시간',text:'안내에는 점심 12:00~14:30, 저녁 17:00~19:00라고 적혀 있다. 오늘 메뉴는 제육볶음과 두부 반찬이다. 식수대는 퇴식구 맞은편에 있다.'},
  {id:'meal',label:'배식대에서 식사를 받아 먹는다.',fact:'학식당 식수대 위치',meal:true,text:'식판을 받아 자리를 잡는다. 급하게 먹지 않으려고 휴대폰은 가방에 넣어둔다. 식사를 마친 뒤 퇴식구에 식판을 정리하고 물을 마신다.'},
  {id:'water',label:'식수대에서 물을 마시고 잠깐 쉰다.',fact:'학식당 식수대 위치',text:'물을 받아 마시고 입구 쪽 의자에 앉는다. 식당을 오가는 사람들 사이에서 다음에 어디로 갈지 생각해본다.'}]},
 dorm:{name:'기숙사',description:'방문객이 이용할 수 있는 안내 데스크와 현관 앞 공간',entry:'기숙사 현관에는 학생들이 택배를 찾으러 오간다. 거주 구역 앞에는 출입 확인 장치가 있고, 방문객 안내는 현관 밖에 붙어 있다.',fact:'기숙사 현관 위치',day:'현관 밖 벤치에서 학생들이 통화한다. 안내 데스크 너머 생활 구역은 거주자만 드나든다.',night:'현관에 조명이 켜졌다. 출입 확인을 마친 학생들이 안으로 들어간다. 방문객은 현관 앞에서 기다린다.',actions:[
  {id:'guide',label:'현관의 방문객 안내를 읽는다.',fact:'기숙사 방문객 출입 안내',text:'방문객은 현관 안내 공간을 이용하고 생활 구역은 허가 없이 들어갈 수 없다고 적혀 있다. 태이의 집은 학교 앞 자취방이다. 여기서 묵을 수 있는 것은 아니다.'},
  {id:'bench',label:'현관 밖 벤치에서 잠깐 쉰다.',fact:'기숙사 앞 쉼터',text:'현관 밖 벤치에 앉아 가방끈을 고쳐 멘다. 택배를 들고 돌아가는 학생과 잠깐 시선이 마주친다. 이곳에서 생활하는 사람들의 하루가 따로 흐르고 있다.'}]},
 academic:{name:'은혜관',description:'교양수업 강의실 · 큰 편의점',entry:'강의실 문 옆에 호실이 적혀 있다. 수업 중인 방에서는 낮은 목소리가 들리고, 복도 끝 공용 학습 공간에는 빈자리가 보인다.',fact:'은혜관 위치',day:'수업을 마친 학생들과 다음 강의실을 찾는 학생들이 복도에서 엇갈린다.',night:'일부 강의실의 불이 꺼졌다. 공용 학습 공간에서는 노트북 화면이 빛난다.',actions:[
  {id:'rooms',label:'층별 강의실 안내를 살펴본다.',fact:'은혜관 계단과 층별 안내',text:'층별 안내에서 강의실 호실과 계단 위치를 확인한다. 문이 닫힌 강의실은 방해하지 않고 지나간다.'},
  {id:'notes',label:'공용 학습 공간에서 노트를 정리한다.',fact:'은혜관 공용 학습 공간',text:'공용 책상에 앉아 가방에서 노트를 꺼낸다. 밀린 메모를 정리하고 오늘 더 확인할 내용에는 작게 표시를 해둔다.'}]},
 music:{name:'음악관',description:'중형 연습실들이 모여 있는 건물',entry:'방음문 사이로 베이스의 낮은 진동이 전해진다. 복도에는 악기 케이스가 놓여 있고 연습실 앞에 이용 안내가 붙어 있다.',fact:'음악관 위치',day:'방음문이 열릴 때마다 짧은 연주 소리가 새어 나온다. 학생들이 케이스를 메고 방을 오간다.',night:'복도는 한산해졌지만 몇몇 연습실은 아직 사용 중이다. 문 앞 이용 표시를 확인할 수 있다.',actions:[
  {id:'rooms',label:'연습실 이용 안내와 위치를 확인한다.',fact:'음악관 연습실 안내',text:'안내에서 중형 연습실 위치를 확인한다. 사용 중 표시가 있는 방은 건드리지 않고 비어 있는 복도 쪽으로 물러난다.'},
  {id:'voice',label:'휴게 공간에서 가사를 메모한다.',fact:'음악관 휴게 공간',text:'휴게 공간에 앉아 떠오른 문장을 휴대폰 메모에 적는다. 아직 멜로디는 붙이지 않고, 부를 때 숨이 끊기는 위치만 표시한다.'}]},
 gym:{name:'체육관',description:'체대·실용음악과 공용 · 지하·1층 연습실·합주실 · 실내체육관 · 체력단련실 · 강의실',entry:'체육관 안에서 운동화가 바닥에 스치는 소리가 들린다. 입구 안내에는 사용 중인 구역과 이용 수칙이 적혀 있다.',fact:'체육관 위치',day:'실내 코트에서는 학생들이 공을 주고받는다. 준비 공간에는 몸을 풀 수 있는 자리가 남아 있다.',night:'운동을 마친 학생들이 장비를 정리한다. 입구의 이용 안내를 보고 비어 있는 준비 공간에 머문다.',actions:[
  {id:'guide',label:'체육관 이용 안내를 확인한다.',fact:'체육관 이용 안내',text:'사용 중인 코트에는 들어가지 않고 이용 안내를 읽는다. 준비 공간과 장비 보관 구역은 구분되어 있다. 보관된 장비를 개인 물품처럼 챙기지는 않는다.'},
  {id:'stretch',label:'준비 공간에서 가볍게 몸을 푼다.',fact:'체육관 준비 운동 공간',text:'가방을 옆에 두고 발목과 어깨부터 천천히 푼다. 무리한 훈련 대신 굳은 몸을 움직여 보고 호흡을 고른다.'}]}
};
export const confirmedCampusLayout={
 "headquarters": {
  "name": "본부동",
  "description": "교내에서 가장 큰 건물 · 지하~10층 · 은행 · 편의점 · 식당 · 다수 강의실",
  "entry": "가장 큰 건물인 본부동 앞에 선다. 안내에는 지하 공간부터 10층까지 표시되어 있고, 은행과 편의점, 식당과 여러 강의실을 찾는 사람들이 오간다.",
  "areas": [
   [
    "basement",
    "지하",
    "지하 공간",
    "안내를 따라 지하로 내려간다. 연결된 공간과 되돌아갈 계단을 눈으로 확인한다. 세부 용도는 아직 더 살펴봐야 한다."
   ],
   [
    "bank",
    "층 미확정",
    "은행",
    "은행 안내와 창구가 보인다. 이곳에서 은행 업무를 볼 수 있다는 것만 확인한다."
   ],
   [
    "store",
    "층 미확정",
    "편의점",
    "학생들이 필요한 물건을 고르고 있다. 진열된 물건은 판매용이며 지금 가지고 있는 소지품과는 별개다."
   ],
   [
    "dining",
    "층 미확정",
    "식당",
    "식당 입구에서 식탁과 배식 공간을 살핀다. 외식관 학식당과는 다른 식사 공간이다."
   ],
   [
    "classrooms",
    "층 미확정",
    "강의실 구역",
    "여러 층에 걸친 강의실 안내를 읽는다. 층별 호실이 많아 이동할 곳부터 골라두는 편이 좋겠다."
   ]
  ]
 },
 "arts": {
  "name": "예술동",
  "description": "실용음악과 · 8층 · 1층 시청각실·뮤지컬홀 · 2~7층 강의실 · 7~8층 소형 연습실 · 4층 구석 대형 합주실",
  "entry": "예술동 입구에 들어서자 1층 공연 공간으로 향하는 넓은 동선이 보인다. 층별 안내에는 8층까지의 강의실과 연습 공간이 적혀 있다.",
  "areas": [
   [
    "av",
    "1층",
    "시청각실",
    "시청각실 입구에서 안쪽 좌석과 무대 쪽을 살핀다. 사용 중인 공간을 방해하지 않고 출입 동선을 기억한다."
   ],
   [
    "musical",
    "1층",
    "뮤지컬홀·대형 무대",
    "큰 무대를 향해 이어진 입구 앞에 선다. 무대와 객석을 오가는 동선이 넓게 나 있다."
   ],
   [
    "classes",
    "2~7층",
    "강의실 구역",
    "2층부터 7층까지 이어지는 강의실 안내를 확인한다. 7층에는 강의실과 연습실이 함께 있다."
   ],
   [
    "band",
    "4층 구석",
    "대형 합주실",
    "4층 복도 구석까지 걸어가 대형 합주실을 확인한다. 다른 방보다 넓은 공간과 방음문이 눈에 들어온다."
   ],
   [
    "small7",
    "7층",
    "좁은 연습실 구역",
    "강의실 구역을 지나 좁은 연습실들이 이어진 곳을 살핀다. 악기를 든 사람이 지나가면 잠깐 비켜서야 한다."
   ],
   [
    "small8",
    "8층",
    "좁은 연습실 구역",
    "8층의 좁은 연습실 구역까지 올라왔다. 각 방의 문 앞을 살피며 사용 중인 공간과 비어 있는 복도를 구분한다."
   ]
  ]
 },
 "music": {
  "areas": [
   [
    "medium",
    "층 미확정",
    "중형 연습실 구역",
    "중형 연습실들이 복도를 따라 이어진다. 예술동 위층의 좁은 연습실과는 공간 크기가 다르다."
   ]
  ]
 },
 "gym": {
  "areas": [
   [
    "basement",
    "지하",
    "연습실·합주실 구역",
    "지하에 연습실과 합주실들이 이어진다. 체육관에서도 실용음악과 학생들의 연습 소리를 들을 수 있다."
   ],
   [
    "first",
    "1층",
    "연습실·합주실 구역",
    "1층의 연습실과 합주실 앞을 지난다. 운동하러 온 학생과 악기 케이스를 든 학생이 같은 건물을 드나든다."
   ],
   [
    "court",
    "층 미확정",
    "대형 실내체육관",
    "넓은 실내체육관을 둘러본다. 사용 중인 코트를 가로지르지 않고 가장자리에서 출입 동선을 살핀다."
   ],
   [
    "fitness",
    "층 미확정",
    "체력단련실",
    "체력단련실 입구에서 운동 공간과 이용 안내를 확인한다. 장비 보관 위치를 알게 된 것과 장비를 소유한 것은 다르다."
   ],
   [
    "classes",
    "층 미확정",
    "강의실 구역",
    "체육관 안 강의실 구역의 호실 안내를 확인한다. 운동 공간과 수업 공간이 같은 건물에 있다."
   ]
  ]
 },
 "cafeteria": {
  "areas": [
   [
    "dining",
    "층 미확정",
    "학식당",
    "외식관 안 학식당으로 들어간다. 배식대와 식탁, 퇴식구가 보인다."
   ],
   [
    "cafe",
    "층 미확정",
    "카페",
    "외식관 안 카페에서 주문을 기다리는 학생들이 보인다. 대학가 카페와는 별개의 공간이다."
   ],
   [
    "store",
    "층 미확정",
    "편의점",
    "외식관 편의점의 위치를 확인한다. 필요한 물건이 어디에 있는지 눈으로 살펴본다."
   ],
   [
    "cooking",
    "층 미확정",
    "조리실습실",
    "조리실습실 입구 안내를 읽는다. 수업 중인 안쪽에는 들어가지 않고 실습 공간의 위치만 기억해둔다."
   ]
  ]
 },
 "creative": {
  "name": "창조관",
  "description": "매우 큰 건물 · 간호학과·미대·패션디자인과 · 도서관 · 간호 실습실",
  "entry": "큰 창조관 안으로 들어서자 여러 학과 안내가 보인다. 간호학과와 미대, 패션디자인과의 공간과 도서관이 같은 건물에 있다.",
  "areas": [
   [
    "library",
    "층 미확정",
    "도서관",
    "창조관 안 도서관 입구로 향한다."
   ],
   [
    "nursing",
    "층 미확정",
    "간호 실습실",
    "간호 실습실 입구에서 안내를 살핀다. 실습 장비가 있다는 사실을 확인해도 허가 없이 사용하거나 가져가지는 않는다."
   ],
   [
    "art",
    "층 미확정",
    "미대 공간",
    "미대 공간으로 이어지는 복도를 둘러본다. 작업 중인 공간은 방해하지 않고 지나간다."
   ],
   [
    "fashion",
    "층 미확정",
    "패션디자인과 공간",
    "패션디자인과 공간의 안내를 확인한다. 전공이 다른 학생들의 생활 동선이 같은 건물 안에서 이어진다."
   ]
  ]
 },
 "academic": {
  "areas": [
   [
    "classes",
    "층 미확정",
    "교양 강의실 구역",
    "교양 강의실들이 이어진 복도를 살핀다. 여러 학과 학생들이 각자의 수업을 찾아 오간다."
   ],
   [
    "store",
    "층 미확정",
    "큰 편의점",
    "큰 편의점 앞에서 잠깐 발걸음을 멈춘다. 수업 사이에 필요한 물건을 사러 온 학생들이 보인다."
   ]
  ]
 },
 "hall": {
  "name": "자유관",
  "description": "동아리실들이 모여 있는 건물",
  "entry": "자유관 안으로 들어서자 동아리실들이 이어진다. 공용 공간에는 준비 중인 물품과 활동 자료가 놓여 있다.",
  "areas": [
   [
    "clubs",
    "층 미확정",
    "동아리실 구역",
    "자유관 동아리실 구역의 안내를 살핀다. 문마다 서로 다른 동아리 이름이 붙어 있다. 안내를 읽는 것과 가입은 별개다."
   ]
  ]
 },
 "sculpture": {
  "name": "조형관",
  "description": "매우 큰 건물 · 치위생과 중심 · 편의점 · 여러 시설 · 많은 강의실",
  "entry": "크게 이어진 조형관의 안내를 살핀다. 치위생과 학생들이 주로 드나드는 건물 안에 많은 강의실과 편의점, 여러 시설이 있다.",
  "areas": [
   [
    "classes",
    "층 미확정",
    "강의실 구역",
    "여러 강의실이 이어지는 복도를 따라가 호실 안내를 읽는다. 치위생과 학생들이 각자 하던 일을 보러 오간다."
   ],
   [
    "store",
    "층 미확정",
    "편의점",
    "조형관 안 편의점 위치를 확인한다. 지금은 필요한 곳이 어디인지 알아두고 돌아선다."
   ],
   [
    "facilities",
    "층 미확정",
    "공용 시설 안내",
    "시설 안내를 훑어본다. 구체적인 시설 종류와 용도는 현장에서 더 확인해야 한다."
   ]
  ]
 },
 "baekseok": {
  "name": "백석홀",
  "description": "여러 학과가 한 번에 채플을 듣는 매우 큰 예배·수업 공간",
  "entry": "백석홀 앞에 서자 여러 학과가 함께 들어올 만큼 큰 규모가 눈에 들어온다. 공통 교양 예배인 채플을 듣는 곳이다.",
  "areas": [
   [
    "chapel",
    "층 미확정",
    "채플 공간",
    "매우 큰 채플 공간의 좌석과 입구를 살핀다. 여러 학과가 한 번에 수업을 듣는 곳이라 들어오고 나가는 동선도 넓다."
   ],
   [
    "entrance",
    "층 미확정",
    "출입 동선",
    "많은 학생이 함께 이동하는 출입구와 통로를 확인한다. 지금 둘러보는 것만으로 채플 출석이 처리되지는 않는다."
   ]
  ]
 }
};
for(const [id,definition] of Object.entries(confirmedCampusLayout)){
 const existing=campusBuildings[id]??{};
 campusBuildings[id]={...existing,...definition,primary:true,fact:definition.name?definition.name+' 위치':existing.fact,day:definition.entry??existing.day,night:definition.entry??existing.night,actions:existing.actions??[]};
 campusBuildings[id].maxFloor=id==='headquarters'?10:id==='arts'?8:null;
 campusBuildings[id].fact=campusBuildings[id].name+' 위치';
 campusBuildings[id].areas=definition.areas.map(([id,floor,name,text])=>({id,floor,name,text}));
}
export function enterBuildingArea(state,id){
 const place=state.location,b=campusBuildings[place],area=b?.areas?.find(a=>a.id===id);
 if(!area)throw new Error('이 건물에 없는 공간입니다.');
 if(state.clock.minute>=1320)throw new Error('오늘은 늦었습니다. 귀가할 시간입니다.');
 const s=structuredClone(state);s.buildingArea={place,id};
 const fact=b.name+' '+(area.floor==='층 미확정'?'':area.floor+' ')+area.name;
 if(!s.known.includes(fact)){s.known.push(fact);s.memory.push(`[${s.day}일차] ${area.text}`);}
 return {state:s,text:area.text,destination:place==='creative'&&id==='library'?'library':null};
}
export function selectedBuildingArea(s,place=s.location){return s.buildingArea?.place===place?campusBuildings[place]?.areas?.find(a=>a.id===s.buildingArea.id):null;}
export function mealPeriod(s){const m=s.clock.minute;return m>=720&&m<870?'lunch':m>=1020&&m<1140?'dinner':null;}
export function buildingActions(s,place=s.location){return (campusBuildings[place]?.actions??[]).filter(a=>!a.meal||!selectedBuildingArea(s,place)||selectedBuildingArea(s,place).id==='dining').filter(a=>!a.meal||(mealPeriod(s)&&!(s.buildingLife?.meals??[]).includes(`${s.day}:${mealPeriod(s)}`)));}
export function buildingAtmosphere(s,place){const b=campusBuildings[place];if(!b)return '';const area=selectedBuildingArea(s,place);if(area)return area.name+' · '+(area.floor==='층 미확정'?'':area.floor+' · ')+area.text;return (s.clock.minute>=(place==='cafeteria'?1140:1080)?b.night:b.day)+(place==='cafeteria'?(mealPeriod(s)?' 지금은 배식 중이다.':' 지금은 배식 시간이 아니다. 입구 휴게 공간은 이용할 수 있다.'):'');}
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
 const paths={hall:['cafeteria','academic','arts'],library:['creative'],cafe:['dorm','cafeteria'],cafeteria:['headquarters','hall','dorm'],dorm:['cafeteria','cafe'],academic:['headquarters','sculpture','baekseok'],music:['arts','gym'],gym:['music','arts'],headquarters:['academic','cafeteria','creative'],arts:['music','gym','hall'],creative:['library','sculpture','headquarters'],sculpture:['creative','academic'],baekseok:['academic','headquarters']};
 return (paths[place]??[]).map(value=>({label:(campusBuildings[value]?.name??{library:'창조관 안 도서관',cafe:'대학가 카페'}[value])+' 쪽으로 걸어간다.',action:'visit',value}));
}
