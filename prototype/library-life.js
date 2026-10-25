import {presentPeople} from './days.js';
import {contact} from './identity.js';
import {socialIntent} from './social-reasoning.js';

export const libraryActivities=[
 {id:'read',label:'서가에서 눈에 들어온 책을 읽는다.'},
 {id:'study',label:'조용한 자리에 앉아 코딩 공부를 한다.'},
 {id:'rest',label:'로비 벤치에서 잠깐 쉰다.'}
];
export function libraryAtmosphere(s){
 const m=s.clock.minute;
 const text=m<840?'점심시간이 지나면서 학생들이 한두 명씩 자리를 잡는다. 열람석은 조용하고 로비에서는 작은 목소리로 이야기할 수 있다.':m<960?'창가 자리는 제법 찼다. 출력 공간을 오가는 발소리와 책장을 넘기는 소리가 번갈아 들린다.':m<1080?'가방을 챙기는 학생들 사이로 늦게 자리를 잡는 사람도 보인다. 아직 책을 더 읽을 시간은 있다.':'창밖이 어두워졌다. 열람등 아래 남은 학생들은 각자 책이나 노트북을 들여다본다.';
 const peers=presentPeople(s,'library');
 const together=peers.includes('yeogyeong')&&peers.includes('soyul');
 return text+(together?' 출력 공간에서 차여경이 종이 묶음을 세고, 박소율은 옆에서 사진 순서를 맞춘다. 두 사람은 낮게 이야기를 나누다 다시 손을 움직인다.':'');
}
export function libraryActivity(state,id){
 if(state.location!=='library')throw new Error('도서관에서 할 수 있는 행동입니다.');
 if(!libraryActivities.some(a=>a.id===id))throw new Error('알 수 없는 자유행동입니다.');
 if(state.clock.minute>=1320)throw new Error('오늘은 늦었습니다. 이제 귀가할 시간입니다.');
 const s=structuredClone(state);s.libraryLife??={history:[]};
 const previous=s.libraryLife.history.filter(h=>h.id===id);
 const repeated=previous.some(h=>h.day===s.day&&h.minute===s.clock.minute);
 const texts={
 read:previous.length?'책갈피를 끼워둔 부분부터 읽는다. 앞에서 별것 아니라고 넘긴 문장이 뒤의 장면과 연결된다. 같은 결말도 누구의 입장에서 읽느냐에 따라 달라 보인다.':'소설 한 권을 골라 창가에서 읽는다. 대사보다 장면 사이에 생략된 시간이 눈에 들어온다. 내가 쓴 이야기라면 이 장면을 어디서 끊을까, 잠깐 생각해본다.',
 study:previous.length?'아까 막힌 코드를 다시 들여다본다. 한꺼번에 고치려던 부분을 나눠 적으니 어디서부터 확인할지 보인다.':'노트북을 열고 공부하던 예제를 따라 쓴다. 생각한 대로 실행되지 않아 입력값부터 다시 살핀다. 바로 답을 찾지는 못해도 지금 막힌 곳은 짚어둔다.',
 rest:s.phase==='evening'?'로비 벤치에 앉아 어깨를 돌린다. 유리문에 실내 불빛이 비친다. 오늘 쓴 문장과 아직 못 한 일이 번갈아 떠오른다.':'로비 벤치에 가방을 내려놓는다. 책을 반납하고 나가는 사람들을 멍하니 바라보다 숨을 고른다. 잠깐 아무것도 하지 않아도 괜찮다.'};
 let text=repeated?'아직 같은 자리에 머물러 있다. 방금 하던 일을 조금 더 이어간다.':texts[id];
 if(!repeated){
  s.libraryLife.history.push({id,day:s.day,minute:s.clock.minute});
  const fact={read:'도서관 문학 서가 위치',study:'도서관 노트북 이용 좌석',rest:'도서관 로비 휴게 벤치'}[id];
  if(!s.known.includes(fact))s.known.push(fact);
  s.memory.push(`[${s.day}일차] ${text}`);
 }
 return {state:s,text};
}
// Observable greetings only; private affection or motives are never narrated as facts.
export function libraryGreeting(s,id){
 const before=Object.values(s.encounters??{}).some(e=>e.person===id&&e.outcome==='engaged'&&e.day<s.day);
 if(!before||!contact(s,id).introduced)return '';
 const intent=socialIntent(s,id);
 if(intent.mode==='guarded')return ' 잠깐 눈이 마주쳤지만 상대는 짧게 고개만 끄덕이고 하던 일로 시선을 돌린다.';
 if(intent.workPressure)return ' 먼저 알아보고 고개를 끄덕이지만, 손에 든 출력물을 내려놓지는 않는다.';
 if(id==='soyul'&&s.dialogue?.facts?.soyul?.photo&&intent.feelsSafe)return ' 소율이 먼저 눈인사를 한다. 잠깐 망설이다 휴대폰을 들어 보인다. '+(s.dialogue.facts.soyul.speech==='casual'?'“그때 같이 본 사진, 아직 안 지웠어.”':'“그때 같이 본 사진, 아직 안 지웠어요.”');
 if(intent.feelsSafe&&intent.personallyInterested)return id==='soyul'?' 소율이 먼저 태이를 알아본다. 손을 작게 들었다가, 빈 의자 쪽으로 가방을 당겨놓는다.':' 여경이 태이를 알아보고 손을 흔든다. 잠깐 말을 붙이려다 주변을 보고 목소리를 낮춘다.';
 return intent.comfortable?' 눈이 마주치자 상대가 먼저 작게 웃으며 인사한다.':' 전에 이야기를 나눴던 얼굴이다. 눈이 마주치자 서로 가볍게 고개를 끄덕인다.';
}
