import {applyCampusMoments} from './campus-moments.js';
import {advanceFreeTime} from './free-roam.js';
import {weatherBlockMinutes} from './weather.js';
import {learnEvent} from './event-view.js';
import {currentSchedule} from './days.js';
import {changeRelationship} from './dialogue.js';
import {recordEvent} from './event-engine.js';

export function campusMinute(s){return s.clock?.minute??(s.phase==='evening'?1140:780);}
export function clockLabel(s){const m=campusMinute(s);return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
export function timeCost(s,action,destination){
 if(s.playMode==='free')return action==='wait'?Math.min(30,1320-campusMinute(s)):0;
 if(s.day!==1||s.phase!=='afternoon')return 0;
 return action==='wait'?Math.min(30,Math.max(0,960-campusMinute(s))):0;
}
export function canSpendTime(s,minutes){if(s.playMode==='free')return campusMinute(s)+minutes<=1320;return s.day!==1||s.phase!=='afternoon'||campusMinute(s)+minutes<=960;}
export function npcPlan(s){return currentSchedule(s);}
export function spendTime(state,minutes,{travelling=false}={}){
 if(state.playMode==='free')return advanceFreeTime(state,minutes,{travelling});
 if(!Number.isInteger(minutes)||minutes<0)throw new Error('올바르지 않은 소요 시간입니다.');
 if(!canSpendTime(state,minutes))throw new Error('16:00 활동 준비 시간입니다. 오후 활동을 선택해 주세요. 더 짧은 행동은 남은 시간 안에서 할 수 있습니다.');
 const s=structuredClone(state);
 if(s.day!==1||s.phase!=='afternoon')return s;
 const before=campusMinute(s);s.clock={minute:before+minutes};
 applyCampusMoments(s,before,campusMinute(s),{travelling});
 const plan=npcPlan(s);for(const [id,place] of Object.entries(plan))s.npcs[id].location=place;
 return s;
}
export function placeAtmosphere(s,location){
 if(s.phase==='evening')return {hall:'자유관 조명 아래서 남은 물건을 정리하거나 잠깐 쉬는 학생들이 보인다.',library:'자료실 쪽은 한결 조용해졌지만 열람실에 남아 있는 학생들이 보인다.',cafe:'창밖이 어두워지고 잔을 정리하는 소리가 낮게 들린다.'}[location]??'';
 if(s.day!==1||s.phase!=='afternoon')return '';
 const m=campusMinute(s);
 if(location==='hall')return m<840?'점심 뒤라 공용 테이블에 사람들이 모여 있다. 컵과 활동 자료가 여기저기 놓여 있다.':m<900?'테이블 몇 자리가 비었다. 아까 보이던 사람들 중 일부는 자기 일을 보러 나간 듯하다.':m<960?'복도는 한결 조용해졌다. 프린터 옆에는 누군가 정리하던 자료가 남아 있다.':'늦은 오후의 복도에는 각자 남은 일을 마무리하는 학생들이 보인다.';
 if(location==='library')return m<840?'자료실 안쪽은 조용하다. 반납대 옆 공용 프린터가 비어 있다.':m<900?'창가에서 사진을 살피는 학생이 보인다. 공용 프린터에서 종이가 나오는 소리가 들린다.':m<960?'자료실 주변으로 출력물을 챙기는 학생들이 오간다.':'출력물을 챙긴 사람들이 자료실을 나서고, 빈자리가 조금씩 늘어난다.';
 return m<840?'점심 손님이 빠져나가 빈자리가 늘고 있다.':m<900?'창가에는 책을 펴놓은 손님들이 있다. 잠깐 쉬어가는 분위기다.':'컵을 반납하고 다음 일정으로 떠나는 사람들이 보인다.';
}

// Short choices do not tick the clock. Three distinct activities make one time block.
export function paceSummary(s){
 if(s.playMode==='free')return '이동과 짧은 교류를 여러 번 마치면 시간이 흐릅니다. 무엇을 할지는 자유롭게 정할 수 있습니다.';
 if(s.day!==1||s.phase!=='afternoon')return '';
 if(campusMinute(s)>=960)return '오후 활동을 준비할 시간입니다.';
 return (s.pace?.count??0)>=2?'다음 활동을 마치면 한 구간의 시간이 지나갑니다. 대화는 끝까지 나눌 수 있어요.':`몇 가지 활동을 마친 뒤 약 ${(s.pace?.blockMinutes??30)}분이 한 번에 흐릅니다. 대답마다 시간이 들지는 않습니다.`;
}
export function paceAction(before,after,{action,value,from,to,person}={}){
 let s=structuredClone(after);
 if((s.playMode!=='free'&&(s.day!==1||s.phase!=='afternoon'))||before.day!==s.day)return {state:s,minutes:0};
 s.pace??={count:0,seen:{}};
 if(action==='wait'){
  const minutes=Math.min(30,Math.max(0,(s.playMode==='free'?1320:960)-campusMinute(s)));
  s=s.playMode==='free'?advanceFreeTime(s,minutes):spendTime(s,minutes);s.pace={count:0,seen:{}};return {state:s,minutes};
 }
 if(campusMinute(s)>=(s.playMode==='free'?1320:960))return {state:s,minutes:0};
 const stamp=campusMinute(s);let key=null;
 if(action==='classTravel'&&before.location!==s.location)key=`${stamp}:classTravel:${s.location}`;
 if(action==='visit'&&before.location!==s.location)key=`${stamp}:visit:${before.location}:${s.location}`;
 if(action==='buildingArea')key=`${stamp}:area:${before.location}:${value}`;
 if(action==='buildingActivity')key=`${stamp}:building:${s.location}:${value}`;
 if(action==='libraryActivity')key=`${stamp}:library:${value}`;
 if(action==='walk')key=`${stamp}:walk:${s.location}:${value}`;
 const leavingConversation=['dialogue','group'].includes(from)&&['place','campus','activities','travel','result'].includes(to);
 if(leavingConversation)key=`${stamp}:conversation:${person??'group'}`;
 if(key&&!s.pace.seen[key]){s.pace.seen[key]=true;s.pace.count++;if(['visit','classTravel'].includes(action)){s.pace.outdoor=true;s.pace.blockMinutes=Math.max(s.pace.blockMinutes??30,weatherBlockMinutes(s,true));}}
 const safe=['place','campus','activities','travel'].includes(to);
 if(s.pace.count<3||!safe)return {state:s,minutes:0};
 const minutes=Math.min(s.pace.blockMinutes??30,(s.playMode==='free'?1320:960)-campusMinute(s));
 s=s.playMode==='free'?advanceFreeTime(s,minutes,{travelling:['visit','classTravel'].includes(action)}):spendTime(s,minutes,{travelling:['visit','classTravel'].includes(action)});s.pace={count:0,seen:{}};
 return {state:s,minutes};
}
