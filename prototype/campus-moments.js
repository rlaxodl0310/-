import {learnEvent} from './event-view.js';
import {currentSchedule} from './days.js';
import {changeRelationship} from './dialogue.js';
import {recordEvent} from './event-engine.js';
export function applyCampusMoments(s,before,end,{travelling=false}={}){
 if(s.day!==1)return s;
 // A private exchange happens without player attendance; it is never shown omnisciently.
 if(before<870&&end>=870){
  const r=recordEvent(s,{id:'day1-peer-message',kind:'scheduled',participants:['seoyeon','soyul'],status:'resolved',visibility:'private',result:'서연이 소율에게 사진에 대한 의견을 메시지로 전했다.'});
  if(r.created){changeRelationship(s,'soyul','seoyeon',{familiarity:1,trust:1});s.eventState.flags.day1Encouraged=true;}
 }
 if(before<900&&end>=900&&currentSchedule({...s,phase:'afternoon',clock:{minute:900}}).yeogyeong==='library'){
  const r=recordEvent(s,{id:'day1-library-check',kind:'conditional',participants:['yeogyeong','soyul'],status:'resolved',visibility:'participants',result:'여경과 소율이 도서관에서 출력할 사진의 수량을 맞춰봤다.'});
  if(r.created){changeRelationship(s,'yeogyeong','soyul',{familiarity:1});changeRelationship(s,'soyul','yeogyeong',{familiarity:1});
   if(!travelling&&s.location==='library'){learnEvent(s,r.event,'observed');s.memory.push('[1일차 · 15:00] 자료실에서 여경과 소율이 출력 수량을 맞춰보는 이야기를 들었다.');if(!s.known.includes('사진 출력 수량 협의'))s.known.push('사진 출력 수량 협의');}
  }
 }
 return s;
}
