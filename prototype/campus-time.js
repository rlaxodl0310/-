import {learnEvent} from './event-view.js';
import {currentSchedule} from './days.js';
import {changeRelationship} from './dialogue.js';
import {recordEvent} from './event-engine.js';

export function campusMinute(s){return s.clock?.minute??(s.phase==='evening'?1140:780);}
export function clockLabel(s){const m=campusMinute(s);return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
export function timeCost(s,action,destination){
 if(s.day!==1||s.phase!=='afternoon')return 0;
 if(action==='visit'){if(s.location===destination)return 0;return s.location==='campus'?5:({hall:{library:10,cafe:15},library:{hall:10,cafe:15},cafe:{hall:15,library:15}}[s.location]?.[destination]??5);}
 return {walk:5,encounter:5,answer:3,groupNext:0,groupAnswer:3,wait:20}[action]??0;
}
export function canSpendTime(s,minutes){return s.day!==1||s.phase!=='afternoon'||campusMinute(s)+minutes<=960;}
export function npcPlan(s){return currentSchedule(s);}
export function spendTime(state,minutes,{travelling=false}={}){
 if(!Number.isInteger(minutes)||minutes<0)throw new Error('올바르지 않은 소요 시간입니다.');
 if(!canSpendTime(state,minutes))throw new Error('16:00 활동 준비 시간입니다. 오후 활동을 선택해 주세요. 더 짧은 행동은 남은 시간 안에서 할 수 있습니다.');
 const s=structuredClone(state);
 if(s.day!==1||s.phase!=='afternoon')return s;
 const before=campusMinute(s);s.clock={minute:before+minutes};
 // A private exchange happens without player attendance; it is never shown omnisciently.
 if(before<870&&campusMinute(s)>=870){
  const r=recordEvent(s,{id:'day1-peer-message',kind:'scheduled',participants:['seoyeon','soyul'],status:'resolved',visibility:'private',result:'서연이 소율에게 사진에 대한 의견을 메시지로 전했다.'});
  if(r.created){changeRelationship(s,'soyul','seoyeon',{familiarity:1,trust:1});s.eventState.flags.day1Encouraged=true;}
 }
 if(before<900&&campusMinute(s)>=900&&(s.relations['yeogyeong>soyul']?.tension??0)<3){
  const r=recordEvent(s,{id:'day1-library-check',kind:'conditional',participants:['yeogyeong','soyul'],status:'resolved',visibility:'participants',result:'여경과 소율이 도서관에서 출력할 사진의 수량을 맞춰봤다.'});
  if(r.created){changeRelationship(s,'yeogyeong','soyul',{familiarity:1});changeRelationship(s,'soyul','yeogyeong',{familiarity:1});
   if(!travelling&&s.location==='library'){learnEvent(s,r.event,'observed');s.memory.push('[1일차 · 15:00] 자료실에서 여경과 소율이 출력 수량을 맞춰보는 이야기를 들었다.');if(!s.known.includes('사진 출력 수량 협의'))s.known.push('사진 출력 수량 협의');}
  }
 }
 const plan=npcPlan(s);for(const [id,place] of Object.entries(plan))s.npcs[id].location=place;
 return s;
}
export function placeAtmosphere(s,location){
 if(s.day!==1||s.phase!=='afternoon')return '';
 const m=campusMinute(s);
 if(location==='hall')return m<840?'점심 뒤라 공용 테이블에 사람들이 모여 있다. 컵과 활동 자료가 여기저기 놓여 있다.':m<900?'테이블 몇 자리가 비었다. 아까 보이던 사람들 중 일부는 자기 일을 보러 나간 듯하다.':m<960?'복도는 한결 조용해졌다. 프린터 옆에는 누군가 정리하던 자료가 남아 있다.':'봉사단 활동 준비가 시작될 시간이다. 사람들은 물품 상자 쪽으로 모이고 있다.';
 if(location==='library')return m<840?'자료실 안쪽은 조용하다. 반납대 옆 공용 프린터가 비어 있다.':m<900?'창가에서 사진을 살피는 학생이 보인다. 공용 프린터에서 종이가 나오는 소리가 들린다.':m<960?'자료실 주변으로 출력물을 챙기는 학생들이 오간다.':'출력물을 챙긴 사람들이 자료실을 나선다. 오후 활동 장소로 향할 시간이다.';
 return m<840?'점심 손님이 빠져나가 빈자리가 늘고 있다.':m<900?'창가에는 책을 펴놓은 손님들이 있다. 잠깐 쉬어가는 분위기다.':'컵을 반납하고 다음 일정으로 떠나는 사람들이 보인다.';
}
