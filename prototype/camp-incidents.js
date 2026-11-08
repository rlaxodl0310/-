// Camp-only stories. Scheduling occurs on actions, never on rendering or loading.
const incidentClamp=n=>Math.max(0,Math.min(100,n));
const campIncidentDefinitions={
 locker:{title:'잠긴 생수 보관함',text:'옆방의 보관함 틈으로 미개봉 생수 묶음이 보인다. 문을 뜯으면 빠르겠지만, 금속이 울리는 소리가 복도까지 퍼질 것 같다.',choices:[
 {id:'quiet',label:'잠금장치를 차분히 풀어 둔다',cost:{actions:1,parts:1},later:{water:4},effect:'내일 아침 생수 +4',outcome:'부품으로 잠금장치를 풀고 운반 동선을 표시했다. 내일 아침 밝아지면 생수를 옮기기로 했다.'},
 {id:'force',label:'지금 필요한 만큼만 꺼낸다',cost:{actions:1},now:{water:2,threat:8},effect:'지금 생수 +2 · 위협 +8',outcome:'틈을 벌려 생수 두 병을 꺼냈다. 금속이 부딪히는 소리가 생각보다 멀리 울렸다.'}]},
 corridor:{title:'복도 끝에서 들리는 소리',text:'문 밖에서 바퀴가 굴러가다 벽에 부딪힌다. 바람에 밀리는 카트 같지만 소리가 이어지면 다른 것까지 끌어올 수 있다.',choices:[
 {id:'pad',label:'카트 바퀴를 고정하고 소음을 막는다',cost:{actions:1,parts:1},now:{threat:-12},effect:'위협 −12',outcome:'문을 연 채 서두르지 않고 둘이 번갈아 주변을 살폈다. 바퀴를 고정하자 반복되던 소리가 멎었다.'},
 {id:'observe',label:'안쪽에서 동선을 지켜본다',cost:{actions:1},now:{threat:-6,fatigue:5},later:{threat:-6},effect:'위협 −6 · 전원 피로 +5 · 내일 위협 −6',outcome:'불필요하게 밖으로 나가지 않고 접근하는 방향을 기록했다. 내일 감시할 사각지대도 하나 줄었다.'}]},
 tension:{title:'괜찮다는 말 뒤에',text:'누군가 대답을 짧게 끊고, 다른 사람은 그 침묵을 불만으로 받아들인다. 쉬자는 말을 먼저 꺼내야 할 것 같다.',choices:[
 {id:'listen',label:'작업을 멈추고 서로의 상태를 듣는다',cost:{actions:1},now:{stress:-12},later:{stress:-4},effect:'전원 부담 −12 · 내일 부담 −4',outcome:'해결책부터 내놓지 않고 누가 무엇 때문에 버거웠는지 들었다. 내일도 상태를 확인하고 일을 나누기로 했다.'},
 {id:'share',label:'먹을 것을 나누며 잠깐 함께 앉는다',cost:{food:1,water:1},now:{stress:-8},effect:'전원 부담 −8 · 행동 여력 소비 없음',outcome:'남은 배급과 별도로 간식을 나누었다. 긴 이야기는 아니었지만, 혼자 버티는 시간은 잠깐 줄었다.'}]},
 exchange:{title:'문 너머의 물물교환',text:'문 건너편에서 자신도 학생이라고 말하는 목소리가 들린다. 안으로 들이지 않고 문틈으로 물품을 확인하며 교환할 수는 있다. 말만 믿고 문을 열 필요는 없다.',choices:[
 {id:'medical',label:'식량을 붕대와 바꾼다',cost:{food:2},now:{bandage:1,threat:3},effect:'붕대 +1 · 위협 +3',outcome:'포장을 확인한 뒤 식량 두 개와 붕대 하나를 문틈으로 교환했다. 상대의 이름이나 소속까지 확인한 것은 아니다.'},
 {id:'water',label:'부품을 생수와 바꾼다',cost:{parts:2},now:{water:3,threat:3},effect:'생수 +3 · 위협 +3',outcome:'봉인이 남은 생수를 확인하고 부품과 교환했다. 함께 살자는 약속은 하지 않았다.'}]}
};
function campStory(r){return r.story??={seed:((r.day*7919+(r.sortieSequence??0)*104729)^726139)>>>0,last:[],checkedDay:0,current:null,pending:[],resolved:[]};}
export function scheduleCampIncident(r){
 if(!r.base||r.status!=='active')return;
 const story=campStory(r);if(story.checkedDay===r.day)return;story.checkedDay=r.day;
 const pool=Object.keys(campIncidentDefinitions).filter(id=>!story.last.slice(-2).includes(id));
 story.seed=(Math.imul(story.seed,1664525)+1013904223)>>>0;
 const id=pool[story.seed%pool.length];story.current={id,day:r.day};story.last.push(id);
}
function campChoiceBlock(r,choice){
 if(r.activeSortie)return '원정에서 복귀한 뒤 결정하세요.';
 for(const [key,cost] of Object.entries(choice.cost??{}))if((key==='actions'?r.actions:r.resources[key])<cost)return key==='actions'?'오늘 행동 여력이 부족해요.':'필요한 물자가 부족해요.';
 return null;
}
export function campIncidentView(state){
 const r=state.survivalRun,e=r?.story?.current,def=campIncidentDefinitions[e?.id];
 if(!r?.base||r.status!=='active'||!def||e.day!==r.day)return null;
 return {id:e.id,day:e.day,title:def.title,text:def.text,choices:def.choices.map(c=>({...c,blocked:campChoiceBlock(r,c)}))};
}
export function checkCampIncident(state){
 const r=state.survivalRun;if(!r?.base||r.status!=='active'||r.activeSortie)throw new Error('거점에 돌아와 주변을 살펴보세요.');
 const s=structuredClone(state);scheduleCampIncident(s.survivalRun);return s;
}
function applyCampChange(r,change={}){
 for(const [key,value] of Object.entries(change)){
  if(key==='stress'||key==='fatigue')for(const m of r.members)m[key]=incidentClamp(m[key]+value);
  else if(key==='threat')r.threat=incidentClamp(r.threat+value);
  else r.resources[key]=Math.max(0,r.resources[key]+value);
 }
}
export function resolveCampIncident(state,id){
 const r0=state.survivalRun,view=campIncidentView(state);if(!view||r0.activeSortie)throw new Error('지금 거점에서 결정할 상황이 없어요.');
 const choice=id==='pass'?{id:'pass',cost:{},outcome:'오늘은 개입하지 않고 원래 계획을 이어갔다.'}:view.choices.find(c=>c.id===id);
 if(!choice)throw new Error('현재 상황의 선택지를 골라 주세요.');const blocked=campChoiceBlock(r0,choice);if(blocked)throw new Error(blocked);
 const s=structuredClone(state),r=s.survivalRun,story=campStory(r);
 for(const [key,value] of Object.entries(choice.cost))if(key==='actions')r.actions-=value;else r.resources[key]-=value;
 applyCampChange(r,choice.now);
 if(choice.later)story.pending.push({day:r.day+1,title:view.title,change:choice.later});
 story.resolved.push({day:r.day,id:view.id,choice:id});story.current=null;
 const text=`${view.title} · ${choice.outcome}${choice.effect?' ('+choice.effect+')':''}`;r.log=[text];r.history.push({day:r.day,text});return s;
}
export function finishCampStories(r){
 const story=r.story;if(!story)return [];
 const messages=[];for(const p of story.pending.filter(p=>p.day<=r.day)){applyCampChange(r,p.change);const gain=Object.entries(p.change).map(([k,v])=>`${({water:'생수',threat:'위협',stress:'전원 부담'})[k]??k} ${v>0?'+':''}${v}`).join(' · ');messages.push(`${p.title}의 후속 결과: ${gain}.`);}
 story.pending=story.pending.filter(p=>p.day>r.day);story.current=null;return messages;
}
export function campPendingView(state){return (state.survivalRun?.story?.pending??[]).map(p=>({day:p.day,title:p.title,effect:Object.entries(p.change).map(([k,v])=>`${({water:'생수',threat:'위협',stress:'전원 부담'})[k]??k} ${v>0?'+':''}${v}`).join(' · ')}));}
