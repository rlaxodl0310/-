import {advanceFreeTime} from './free-roam.js';
import {wetWeather} from './weather.js';
export function outdoorActivities(s){
 if(!['field','outdoorCourt'].includes(s.location)||s.clock.minute>=1320)return [];
 const actions=s.location==='field'?[{id:'jog',label:'트랙에서 달린다.',minutes:30},{id:'stretch',label:'그늘 쪽에서 몸을 풀고 스트레칭한다.',minutes:15}]:[{id:'shots',label:'빈 골대에서 가볍게 자유투를 연습한다.',minutes:30},{id:'stretch',label:'벤치 옆에서 다리와 어깨를 푼다.',minutes:15}];
 actions[0].label=s.location==='field'?(wetWeather(s)?'젖은 트랙 가장자리를 천천히 걷는다.':'트랙에서 내 속도로 달리고 호흡을 고른다.'):actions[0].label;
 return actions.filter(a=>s.clock.minute+a.minutes<=1320);
}
export function outdoorActivity(state,id){
 const action=outdoorActivities(state).find(a=>a.id===id);if(!action)throw new Error('이곳에서 할 수 없는 야외 활동입니다.');
 let s=advanceFreeTime(state,action.minutes);s.pace={count:0,seen:{}};
 const text=id==='jog'?(wetWeather(s)?'속도를 낮추고 젖은 트랙의 발 디딜 곳을 확인하며 걸었다.':'다른 사람을 추월할 때는 바깥으로 비켜가며 트랙을 달렸다. 마지막에는 천천히 걸어 호흡을 내렸다.'):id==='shots'?(wetWeather(s)?'공과 바닥이 미끄러워 멀리 뛰지 않고 제자리에서 짧게 던지는 동작만 확인했다.':'공을 튀기고 발을 멈춘 뒤 골대를 향해 던졌다. 빗나간 공을 주워오며 손목과 발의 방향을 맞춰봤다.'):'그늘 벤치 옆에서 종아리와 어깨를 천천히 풀었다. 다른 사람과 움직임이 겹치지 않게 자리를 넓혔다.';
 s.outdoorLife??=[];s.outdoorLife.push({day:s.day,location:s.location,action:id,start:state.clock.minute,end:s.clock.minute});s.memory.push(`[${s.day}일차] ${text}`);return {state:s,text};
}
export function outdoorScene(place){
 const court=place==='outdoorCourt';
 return `<div class="outdoor-scene" role="img" aria-label="${court?'골대와 벤치가 있는 야외 코트':'잔디 운동장과 달리기 트랙'}"><svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"><path fill="#a6c7cc" d="M0 0h1200v800H0z"/><path fill="#537866" d="M0 270q180-100 350 0t350 0 500 0v530H0z"/><path fill="${court?'#6b9290':'#b87a62'}" d="M0 385h1200v415H0z"/>${court?'<g fill="none" stroke="#eee6d0" stroke-width="6"><path d="M100 470h1000v270H100zM600 470v270"/><ellipse cx="600" cy="605" rx="90" ry="70"/></g><path d="M880 260h160v100H880z" fill="#e4e6d7" stroke="#385a64" stroke-width="8"/><path d="M960 360v220" stroke="#385a64" stroke-width="12"/><ellipse cx="960" cy="365" rx="40" ry="9" fill="none" stroke="#d38851" stroke-width="7"/>':'<ellipse cx="640" cy="670" rx="550" ry="240" fill="#78a078" stroke="#f4debd" stroke-width="5"/><g fill="none" stroke="#f4debd" stroke-width="3"><ellipse cx="640" cy="670" rx="590" ry="275"/><ellipse cx="640" cy="670" rx="630" ry="310"/><ellipse cx="640" cy="670" rx="670" ry="345"/></g><path d="M640 450v350M250 520h770v280H250z" fill="none" stroke="#cad9ae" stroke-width="3"/>'}<g fill="#e6d6ae" stroke="#3a5a5d" stroke-width="9"><path d="M120 330h180v35H120zM140 365v45m140-45v45"/></g></svg></div>`;
}
