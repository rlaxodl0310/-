import {timetable,classPlace,schoolTime,nextLesson} from './timetable.js';
import {advanceFreeTime} from './free-roam.js';
export function attendLesson(state,key,choice){
 const c=timetable(state).find(c=>c.key===key),m=state.clock.minute;
 if(!c||state.academics.records[key]||m>=c.end)throw new Error('지금 참석할 수 없는 수업입니다.');
 if(nextLesson(state)?.key!==key)throw new Error('그전에 예정된 수업이 있습니다. 시간표를 먼저 확인해 주세요.');
 if(state.location!==c.location||state.buildingArea?.place!==c.location||state.buildingArea?.id!==c.area)throw new Error('먼저 수업 장소로 이동해야 합니다.');
 const answer=c.choices.find(a=>a.id===choice);if(!answer)throw new Error('수업에서 할 행동을 골라 주세요.');
 let s=structuredClone(state);const status=m<=c.start?'present':m<=c.start+15?'late':'partial';
 s.academics.records[key]={status,day:s.day,course:c.id,arrival:m,start:Math.max(m,c.start),end:c.end,choice};
 s.academics.lesson=null;s=advanceFreeTime(s,c.end-m);s.pace={count:0,seen:{}};
 const fact=`${c.name} 수업 메모`;if(!s.known.includes(fact))s.known.push(fact);
 const text=(m<c.start?`${schoolTime(c.start)}까지 수업을 준비했다. `:'')+answer.text+` ${schoolTime(c.end)}, 수업이 끝났다.`;
 s.memory.push(`[${s.day}일차] ${c.name} · ${classPlace(c)} · ${text}`);return {state:s,text};
}
