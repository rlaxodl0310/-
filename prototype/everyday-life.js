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
 const pool=everydayEvents.filter(e=>e.places.includes(s.location)&&(!e.wet||wetWeather(s))&&!life.history.slice(-5).some(h=>h.eventId===e.id));
 if(!life.pending&&!recent.length&&pool.length&&everydayRoll(s)<.38){
  const event=pool[Math.floor(everydayRoll(s)*pool.length)];record.eventId=event.id;record.eventMinute=s.clock.minute;life.pending={key:'everyday:'+life.sequence,id:event.id,day:s.day,minute:s.clock.minute,location:s.location,text:event.text,choices:event.choices.map(([id,label])=>({id,label})),returnScreen,recordKey:key};
 }
 s.memory.push(`[${s.day}일차] ${combined}`);return {state:s,text:combined,repeated:false};
}
export function everydayEventView(s){const e=s.everydayLife?.pending;return e&&e.day===s.day&&e.location===s.location?structuredClone(e):null;}
export function resolveEverydayEvent(state,choice){
 const event=everydayEventView(state),def=everydayEvents.find(e=>e.id===event?.id),selected=def?.choices.find(c=>c[0]===choice);if(!event||!selected)throw new Error('이미 지나간 상황입니다.');
 const s=structuredClone(state),record=s.everydayLife.history.find(r=>r.key===event.recordKey);record.eventOutcome=choice;record.eventText=selected[2];s.everydayLife.pending=null;s.memory.push(`[${s.day}일차] ${selected[2]}`);return {state:s,text:selected[2],returnScreen:event.returnScreen};
}
export function abandonEverydayEvent(state){if(!state.everydayLife?.pending)return state;const s=structuredClone(state),e=s.everydayLife.pending,r=s.everydayLife.history.find(h=>h.key===e.recordKey);if(r)r.eventOutcome='left';s.everydayLife.pending=null;return s;}
