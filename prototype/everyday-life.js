import {wetWeather} from './weather.js';
export function everydayStore(s){s.everydayLife??={rng:Math.floor(Math.random()*4294967296),history:[],pending:null,sequence:0};return s.everydayLife;}
export function everydayRoll(s){const life=everydayStore(s);life.rng=(Math.imul(life.rng,1664525)+1013904223)>>>0;return life.rng/4294967296;}
const everydayEvents=[
 {id:'loose-paper',places:['hall','academic','arts'],text:'열린 문으로 바람이 들어와 옆 테이블의 종이 몇 장이 통로로 흩어진다. 자료를 챙기던 학생이 뒤늦게 고개를 든다.',choices:[['help','발치의 종이를 주워 묶음 가장자리에 맞춰 건넨다.','발에 밟히기 전에 종이를 모아 건넸다. 상대는 짧게 고맙다고 하고 자료를 가방 안에 넣는다. 이름까지 나누지는 않았다.'],['clear','종이를 밟지 않게 길을 비켜주고 떨어진 위치를 알려준다.','통로에서 비켜서 손으로 위치를 가리켰다. 학생이 나머지 종이를 직접 주워 정리한다.']]},
 {id:'printer-check',places:['library'],text:'프린터에서 짧은 경고음이 난다. 앞에 선 학생이 같은 출력 버튼을 다시 누르려다 안내문을 확인한다.',choices:[['notice','옆의 안내문을 함께 읽고 담당 데스크 위치를 짚어준다.','기계를 임의로 열지 않고 옆 안내문에서 문의 데스크를 확인했다. 학생은 파일을 저장하고 담당자에게 가본다.'],['wait','프린터 앞을 비워주고 원래 하던 자리로 돌아간다.','지금 바로 출력해야 하는 상황은 아니어서 자리를 비웠다. 뒤에서는 학생이 데스크 쪽으로 걸어가는 소리가 들린다.']]},
 {id:'seat-change',places:['library','cafe'],text:'가까운 자리의 사람이 짐을 챙겨 나간다. 조금 전까지 가려져 있던 창가 자리와 콘센트가 보인다.',choices:[['check','남은 물건이 없는지 확인한 뒤 빈자리로 옮긴다.','의자와 테이블에 남은 물건이 없는지 먼저 확인했다. 자리를 옮기니 작업할 공간이 조금 넓어진다.'],['stay','짐을 다시 펴지 않고 지금 자리에 머문다.','자리를 옮기는 대신 하던 흐름을 이어가기로 했다. 다른 학생이 잠시 뒤 빈자리를 확인하러 온다.']]},
 {id:'rolling-ball',places:['field','outdoorCourt','gym'],text:'옆에서 연습하던 공이 경계선을 넘어 태이 발치로 굴러온다. 공을 쫓아오던 학생이 속도를 줄인다.',choices:[['return','공을 멈춰 세운 뒤 상대가 받을 준비를 보고 돌려준다.','공을 잡아 시선을 맞춘 뒤 가볍게 돌려줬다. 상대가 손을 들어 보이고 자기 연습 자리로 돌아간다.'],['step','공이 지나갈 길을 비켜주고 굴러간 방향을 알려준다.','서로 부딪히지 않게 한쪽으로 물러났다. 학생이 공을 챙겨 지나가고 태이는 다시 호흡을 고른다.']]},
 {id:'wet-bench',places:['field','outdoorCourt','cafe'],wet:true,text:'앉으려던 자리 끝이 젖어 있다. 빗물이 가방 끈에 닿기 전에 눈에 들어온다.',choices:[['dry','젖지 않은 안쪽 공간을 확인하고 가방을 옮긴다.','가방을 젖은 자리에서 치우고 마른 쪽에 놓았다. 자리를 잡는 데 조금 신경이 쓰였지만 짐은 젖지 않았다.'],['move','앉는 대신 처마 안쪽에서 잠깐 서서 쉰다.','의자에 짐을 놓지 않고 처마 안쪽으로 움직였다. 비가 떨어지는 방향을 보며 다음 동선을 생각한다.']]},
 {id:'cart-crossing',places:['headquarters','creative','cafeteria','sculpture'],text:'복도 모퉁이에서 물품 카트가 나온다. 서로 지나갈 폭이 좁아 잠깐 걸음을 멈춘다.',choices:[['hold','출입문을 잡고 카트가 먼저 지나가게 한다.','카트가 통로를 빠져나올 때까지 문을 잡았다. 바퀴 소리가 멀어진 뒤 자기 방향으로 돌아섰다.'],['detour','옆 통로로 잠깐 돌아가며 서로 지나갈 공간을 만든다.','급하게 비집고 지나가지 않고 옆으로 돌아갔다. 반대편 통로에서 다시 원래 길에 합류했다.']]}
];
// Short encounters can leave traces on a later day without inventing names or intimacy.
everydayEvents.push(
 {id:'order-slip',places:['cafe','cafeteria'],text:'카운터에 놓인 주문표와 방금 불린 메뉴가 다르다. 음료를 집으려던 사람이 손을 멈춘다.',choices:[['check','자기 주문표를 확인하고 직원에게 번호를 다시 묻는다.','자기 번호와 메뉴만 확인했다. 직원이 주문표 두 장을 다시 맞춰 놓고 다음 번호를 불렀다.'],['space','옆으로 비켜 확인할 자리를 만든다.','급하게 물건을 집지 않고 한 걸음 비켰다. 앞사람이 직원과 자기 주문을 확인하는 동안 가방을 고쳐 멨다.']]},
 {id:'lunch-tray',places:['cafeteria','restaurant'],text:'쟁반 반납대 앞에서 컵 하나가 기울어진다. 뒤따르던 사람이 걸음을 늦추고, 젖은 바닥 쪽으로 시선이 모인다.',choices:[['warn','다가오는 사람에게 젖은 곳을 알려준다.','지나가는 사람에게 바닥을 가리키고 직원에게 위치를 전했다. 청소하는 동안 통로가 잠깐 다른 쪽으로 열렸다.'],['wait','쟁반을 안정적으로 들고 통로가 비기를 기다린다.','컵 위로 무리하게 손을 뻗지 않고 자기 쟁반부터 바로 들었다. 직원이 바닥을 정리한 뒤 차례로 움직였다.']]},
 {id:'rehearsal-gap',places:['arts','music','gym'],text:'방음문이 잠깐 열리며 같은 마디를 반복하는 소리가 새어 나온다. 안쪽에서 “방금 어디서 박자 놓쳤지?”라는 말이 들린다.',choices:[['listen','문을 막지 않고 잠깐 그 구간을 들어본다.','복도 한쪽에 서서 다음 반복을 들었다. 베이스가 쉬어가는 자리와 보컬이 들어오는 순간이 다르게 들렸다. 자기 곡에도 써볼 만한 여백을 떠올렸다.'],['leave','연습을 방해하지 않고 자기 동선으로 간다.','문 앞을 비워 두고 지나갔다. 조금 뒤 같은 마디가 다시 시작되는 소리가 등 뒤로 멀어졌다.']]},
 {id:'checkout-space',places:['market','neighborhoodMart'],text:'계산대 앞 손님이 지갑을 찾으며 장바구니를 내려놓는다. 다음 손님이 지나갈 폭이 좁아졌다.',choices:[['clear','자기 물건을 한쪽으로 모아 통로를 비운다.','아직 계산하지 않은 자기 물건만 모아 길을 만들었다. 장바구니를 든 손님이 짧게 고개를 숙이고 먼저 지나갔다.'],['wait','뒤로 한 걸음 물러서 차례를 기다린다.','계산이 끝난 것으로 착각하지 않고 물건을 그대로 챙겼다. 앞 손님이 지갑을 꺼낸 뒤 줄이 다시 움직였다.']]},
 {id:'paper-followup',places:['hall','academic','arts'],after:{id:'loose-paper',choice:'help'},once:true,text:'지난번 종이가 흩어졌던 테이블에 이번에는 집게가 달린 파일이 놓여 있다. 옆 작은 메모에는 “자료 주워주신 분, 감사합니다”라고 적혀 있다.',choices:[['read','메모를 읽고 지나간 작은 일을 떠올린다.','이름도 묻지 않았던 일이 상대에게는 기억에 남았나 보다. 파일을 건드리지 않고 자기 길로 돌아갔다.'],['leave','지금 하던 일을 계속한다.','집게에 잘 묶인 자료를 보고 걸음을 옮겼다. 그날의 일에 더 개입하지 않아도 흔적은 남아 있었다.']]},
 {id:'ball-followup',places:['field','outdoorCourt','gym'],after:{id:'rolling-ball',choice:'return'},once:true,text:'공을 돌려줬던 학생이 태이를 알아보고 가볍게 손을 든다. 자기 일행을 가리키며 “다음에 시간 맞으면 같이 해요”라고 덧붙인다.',choices:[['respond','손을 들어 인사하고 오늘은 자기 운동을 이어간다.','그때처럼 공을 가볍게 받아 돌려주고 자기 자리로 갔다. 정식 약속이나 서로의 이름을 안다고 할 정도는 아니지만, 낯선 얼굴 하나가 덜 낯설어졌다.'],['busy','오늘은 시간이 짧다고 말한다.','오늘 동선을 짧게 설명하고 지나갔다. 상대는 고개를 끄덕이고 다시 자기 일행에게 돌아갔다. 거절을 불만으로 받아들이지는 않았다.']]},
 {id:'printer-followup',places:['library'],after:{id:'printer-check',choice:'notice'},once:true,text:'지난번 경고음이 났던 프린터 옆에 새 이용 안내가 붙어 있다. 문의 데스크에서 돌아온 직원이 시험 출력물을 확인하고 있다.',choices:[['check','바뀐 이용 안내를 읽는다.','같은 오류가 나면 여러 번 누르지 말고 접수해 달라는 안내였다. 이전에 어디로 문의해야 하는지 확인해 둔 일이 새 안내와 연결됐다.'],['pass','지금은 출력할 일이 없어 지나간다.','기계가 작동하는 것만 보고 자기 자리로 갔다. 그날 멈췄던 풍경이 조금 달라져 있었다.']]}
);

const actionDetails={
 read:['대사의 말끝과 실제 행동이 다른 장면에서 손이 멈춘다.','이전 장면의 작은 물건이 다시 등장해 앞부분을 넘겨본다.','결말을 먼저 단정하지 않고 인물이 알고 있던 정보부터 메모한다.'],
 study:['입력값 하나를 바꾸며 어디서 결과가 달라지는지 확인한다.','오류를 한꺼번에 고치기보다 작은 예제부터 다시 실행한다.','아까 막혔던 부분을 짧게 적어두고 다른 방법을 시도한다.'],
 rest:['한동안 휴대폰을 꺼내지 않고 어깨의 힘을 뺀다.','가방 끈을 느슨하게 하고 호흡이 가라앉기를 기다린다.','일정을 바로 채우지 않고 다음에 어디로 갈지 천천히 생각한다.'],
 jog:['앞사람과 간격을 두고 한 구간만 속도를 올렸다가 낮춘다.','처음보다 보폭을 줄이니 호흡을 유지하기 편해진다.','트랙의 바깥 선을 따라 돌며 발을 디디는 위치를 바꿔본다.'],
 shots:['림에 맞고 돌아오는 공을 따라가 다시 발을 정렬한다.','팔보다 무릎의 힘이 먼저 이어지도록 천천히 던져본다.','몇 번 던진 뒤 거리를 좁혀 손목 감각을 다시 잡는다.'],
 stretch:['좌우가 다르게 뻣뻣한 부분이 있어 한쪽을 조금 더 천천히 푼다.','가방을 내려놓고 어깨부터 종아리까지 순서대로 이완한다.','크게 반동을 주지 않고 편하게 움직일 수 있는 범위를 확인한다.']
};
export function varyEverydayAction(state,{action,text,minute=state.clock.minute,returnScreen='place'}){
 const s=structuredClone(state),life=everydayStore(s),key=`${s.day}:${minute}:${s.location}:${action}`;
 const old=life.history.findLast(r=>r.key===key);if(old)return {state:s,text:old.text,repeated:true};
 const visits=life.history.filter(r=>r.location===s.location&&r.action===action),details=actionDetails[action]??['하던 일을 마친 뒤 다음 사람이 사용할 공간을 정리한다.','주변의 움직임을 보며 방해되지 않게 자리를 고쳐 잡는다.','이번에는 서두르지 않고 앞에서 놓친 부분을 한 번 더 확인한다.'];
 const previous=visits.at(-1)?.detail;const options=details.filter(d=>d!==previous);const detail=options[Math.floor(everydayRoll(s)*options.length)];
 const atmosphere=wetWeather(s)?'창밖과 출입구 쪽에서 빗소리가 이어진다.':s.clock.minute<720?'오전의 소음이 멀어지고 자기 손이 움직이는 소리가 또렷해진다.':s.clock.minute>=1080?'사람들이 하나둘 짐을 챙기는 사이 남은 일을 이어간다.':'주변 사람들도 각자의 일에 집중하거나 자리를 옮긴다.';
 const combined=(visits.length?`같은 활동이라도 이번에는 ${detail}`:text+' '+detail)+' '+atmosphere;
 const record={key,day:s.day,minute,location:s.location,action,text:combined,detail};life.history.push(record);life.sequence++;
 const recent=life.history.filter(h=>h.eventId&&h.day===s.day&&Math.abs(s.clock.minute-(h.eventMinute??h.minute))<60);
 const pool=everydayEvents.filter(e=>(!e.after||life.history.some(h=>h.eventId===e.after.id&&h.eventOutcome===e.after.choice&&h.day<s.day&&h.location===s.location))&&(!e.once||!life.history.some(h=>h.eventId===e.id))&&e.places.includes(s.location)&&(!e.wet||wetWeather(s))&&!life.history.slice(-5).some(h=>h.eventId===e.id));
 const due=pool.filter(e=>e.after);
 if(!life.pending&&!recent.length&&pool.length&&(due.length||everydayRoll(s)<.38)){
  const event=due.length?due[0]:pool[Math.floor(everydayRoll(s)*pool.length)];record.eventId=event.id;record.eventMinute=s.clock.minute;life.pending={key:'everyday:'+life.sequence,id:event.id,day:s.day,minute:s.clock.minute,location:s.location,text:event.text,choices:event.choices.map(([id,label])=>({id,label})),returnScreen,recordKey:key};
 }
 s.memory.push(`[${s.day}일차] ${combined}`);return {state:s,text:combined,repeated:false};
}
export function everydayEventView(s){const e=s.everydayLife?.pending;return e&&e.day===s.day&&e.location===s.location?structuredClone(e):null;}
export function resolveEverydayEvent(state,choice){
 const event=everydayEventView(state),def=everydayEvents.find(e=>e.id===event?.id),selected=def?.choices.find(c=>c[0]===choice);if(!event||!selected)throw new Error('이미 지나간 상황입니다.');
 const s=structuredClone(state),record=s.everydayLife.history.find(r=>r.key===event.recordKey);record.eventOutcome=choice;record.eventText=selected[2];s.everydayLife.pending=null;s.memory.push(`[${s.day}일차] ${selected[2]}`);return {state:s,text:selected[2],returnScreen:event.returnScreen};
}
export function abandonEverydayEvent(state){if(!state.everydayLife?.pending)return state;const s=structuredClone(state),e=s.everydayLife.pending,r=s.everydayLife.history.find(h=>h.key===e.recordKey);if(r)r.eventOutcome='left';s.everydayLife.pending=null;return s;}
