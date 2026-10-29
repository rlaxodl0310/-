import {contact,displayName,introduce,seePeople} from './identity.js';
import {npcNow,noteNpcExperience} from './npc-state.js';
import {schoolLocation,preparationLocation} from './timetable.js';
const supplyIds=['yeogyeong','seoyeon','soyul'];
export function usesSupplyStory(s){return !!s.supplyStory||s.academics?.enabled!==false&&!(s.events??[]).some(e=>e.id==='supplies'&&e.day===1);}
function supplyRelation(s,from,to,delta){const key=from+'>'+to,r={familiarity:0,affection:0,trust:0,tension:0,...s.relations[key]};for(const [k,v] of Object.entries(delta))r[k]=Math.max(0,Math.min(100,r[k]+v));s.relations[key]=r;}
function supplyRandom(story){story.rng=(Math.imul(story.rng,1664525)+1013904223)>>>0;return story.rng/4294967296;}
export function prepareSupplyStory(s){
 if(!usesSupplyStory(s)||s.day!==1||(s.world?.stage??'campus')!=='campus'||s.supplyStory)return;
 const rng=(s.campusVariation?.seed??Math.floor(Math.random()*4294967296))>>>0;
 const g=s.supplyStory={day:1,rng,status:'preparing',start:780,end:960,plan:{},met:[],witnesses:{},actions:[],reports:{},work:0,burden:0,coordination:0,playerFinished:false,effected:false};
 g.issue=['count','departure','delivery'][Math.floor(supplyRandom(g)*3)];
 for(const id of supplyIds){
  const now=npcNow({...s,phase:'afternoon',clock:{minute:780}},id),strain=s.relations[id+'>yeogyeong']?.tension??0;
  const chance=(id==='yeogyeong'?.95:.64)+(id==='soyul'&&(s.relations['soyul>seoyeon']?.trust??0)>=8?.12:0)-(now.stress>45?.3:0)-(strain>=4?.3:0);
  const attending=supplyRandom(g)<chance;
  const join=id==='yeogyeong'?780:supplyRandom(g)<.25?810:780;
  const leave=id==='yeogyeong'?960:[840,900,960][Math.floor(supplyRandom(g)*3)];
  g.plan[id]={attending,join,leave,role:['labels','carry','check'][Math.floor(supplyRandom(g)*3)]};
 }
}
function supplyCanAttend(s,id){
 if(schoolLocation(s,id)||preparationLocation(s,id))return false;
 if((s.appointments??[]).some(a=>a.person===id&&a.kind==='meeting'&&a.status==='pending'&&a.day===s.day&&a.location!=='hall'&&Math.abs(s.clock.minute-(a.minute??900))<=30))return false;
 const lunch=s.rainLunch?.episodes?.[s.rainLunch?.active];return !(lunch?.person===id&&lunch.status==='active'&&lunch.day===s.day&&lunch.location!=='hall');
}
export function supplyPeople(s){const g=s.supplyStory;if(!g||s.day!==1||g.status==='resolved'||s.clock.minute<780||s.clock.minute>=g.end)return [];return supplyIds.filter(id=>g.plan[id]?.attending&&g.plan[id].join<=s.clock.minute&&s.clock.minute<g.plan[id].leave&&supplyCanAttend(s,id));}
export function supplyPosition(s,id){return supplyPeople(s).includes(id)?'hall':null;}
const supplyIssueText={count:'목록의 묶음 수와 실제 상자 수가 맞지 않는다. 세는 단위가 다른지, 정말 빠진 물품이 있는지 확인해야 한다.',departure:'포장이 끝나기 전에 자리를 떠나야 하는 사람이 있다. 남은 사람에게 일을 어떻게 넘길지 정해야 한다.',delivery:'추가 포장재가 아직 도착하지 않았다. 지금 할 수 있는 일과 기다려야 하는 일을 나눠야 한다.'};
export function supplyIntro(s){const g=s.supplyStory;if(!g)return '';const people=supplyPeople(s);return (people.length?people.map(id=>displayName(s,id)).join(', ')+'이 각자 상자와 목록을 살피고 있다.':'공용 테이블에서 배경 부원이 상자와 목록을 맞추고 있다.')+' '+supplyIssueText[g.issue]+' 아직 누구와 무슨 일을 맡을지는 정하지 않았다.';}
function meetSupplyPeople(s,people){
 const introductions=[];
 for(const id of people){if(!s.supplyStory.met.includes(id))s.supplyStory.met.push(id);if(!contact(s,id).introduced){introduce(s,id,'supply-work-introduction');introductions.push(`“저는 ${displayName(s,id)}이에요.” 함께 일을 시작하며 짧게 인사를 나눈다.`);}}
 seePeople(s,people);return introductions.join(' ');
}
export function supplyStage(s,stage){
 const g=s.supplyStory;if(!g)return stage;const people=supplyPeople(s),r=s.activitySessions?.records?.[s.activitySessions?.active],step=r?.step??0;
 const present=people.length?people.map(id=>displayName(s,id)).join(', ')+'이 지금 함께 있다.':'지금은 배경 부원과 남은 일을 살핀다.';
 const departing=people.filter(id=>g.plan[id].leave-s.clock.minute<=60);
 let prompt=present+' '+(step===0?'각자가 가능한 시간과 맡을 일을 먼저 확인할 수 있다.':step===1?supplyIssueText[g.issue]:'완료한 일과 남은 일을 나누고 책임을 넘길 차례다.');
 if(departing.length)prompt+=' '+departing.map(id=>displayName(s,id)).join(', ')+'은 오래 머물기 어렵다고 말한다.';
 return {...stage,prompt,choices:[...stage.choices,{id:step===0?'roles':step===1?'askHelp':'selfFinish',label:step===0?'각자가 가능한 시간과 원하는 역할을 듣고 일을 나눈다.':step===1?'혼자 더 맡기 전에 지금 도울 수 있는 범위를 서로 확인한다.':'남은 정리까지 직접 맡고 다른 사람은 먼저 보내준다.',fact:step===0?'봉사 준비 역할 분담 경험':step===1?'봉사 준비 도움 범위 조율':'봉사 준비 단독 마무리 경험',reply:''}]};
}
export function progressSupplyStory(s,record,choice){
 const g=s.supplyStory,people=supplyPeople(s),intro=meetSupplyPeople(s,people),step=record.step;
 for(const id of people){g.witnesses[id]??=[];g.witnesses[id].push({step,choice,minute:s.clock.minute});}
 g.actions.push({step,choice,minute:s.clock.minute,people:[...people]});let text='';
 if(step===0){
  if(choice==='roles'){g.coordination+=2;g.work++;text='한 번에 전부 맡기지 않고 각자가 남을 수 있는 시간부터 묻는다. 할 수 있는 만큼 역할을 나누고, 먼저 가는 사람의 몫은 넘겨받기로 한다.';}
  else if(choice==='audit'){g.coordination++;g.work++;text='각자 센 단위를 차례로 읽어본다. 수량을 다시 확인하는 사람과 포장을 이어가는 사람을 나눴다.';}
  else {g.work+=2;text='물품을 종류별로 나눠 손이 멈추지 않게 했다. 분류는 빨라졌지만 늦게 말하려던 의견은 아직 듣지 못했다.';}
  if(choice==='roles'&&people.length)text+=' '+people.map(id=>displayName(s,id)+'이 '+({labels:'표기부터 맡겠다고',carry:'완료한 상자를 옮기겠다고',check:'목록을 맞춰보겠다고'}[g.plan[id].role]??'가능한 일을 맡겠다고')+' 답한다.').join(' ');
 }
 if(step===1){
  if(choice==='carry'){g.work+=2;g.burden+=2;text='완료된 상자부터 직접 옮기고 통로를 비운다. 다른 사람은 포장을 이어갈 수 있지만 태이 쪽에 일이 몰린다.';for(const id of people)supplyRelation(s,id,'taei',{trust:1});}
  else if(choice==='labels'){g.work++;g.coordination++;text=g.issue==='count'?'포장에 적힌 단위를 맞추고 목록을 대조한다. 빠진 것처럼 보이던 묶음 중 일부가 다른 상자에 들어 있었음을 확인했다.':g.issue==='departure'?'먼저 갈 사람이 어디까지 마쳤는지 적어 포장에 붙인다. 남은 사람이 처음부터 다시 세지 않아도 이어갈 수 있게 했다.':'포장재가 없어도 할 수 있는 수량 확인과 목적지 표기부터 한다. 아직 포장하지 못한 물품은 완료한 상자와 나눠둔다.';}
  else {
   const willing=people.filter(id=>(s.relations[id+'>taei']?.tension??0)<4&&g.plan[id].leave-s.clock.minute>30&&npcNow(s,id).bandwidth!=='limited');
   if(willing.length){g.work++;g.coordination+=2;text=willing.map(id=>displayName(s,id)).join(', ')+'이 지금 가능한 일만 맡겠다고 답한다. 남은 시간을 확인하고 확인·포장·운반을 다시 나눈다.';}
   else {g.work++;text='지금은 더 맡기 어렵다는 답이 돌아온다. 억지로 붙잡는 대신 할 수 있는 물품부터 끝내고 남은 일을 표시하기로 했다.';g.helpDeclined=true;}
  }
 }
 if(step===2){
  if(choice==='selfFinish'){g.work+=2;g.burden+=2;text='다른 사람이 챙길 짐부터 비켜주고 남은 정리를 직접 맡는다. 일은 진행되지만 다음에 이어받을 사람이 아는 과정은 줄어든다.';}
  else {g.coordination++;g.work++;text='완료한 상자와 아직 손보지 못한 물품을 나눠 적는다. 마지막에 남은 사람끼리 읽어보고 누가 무엇을 이어갈지 확인했다.';if(choice==='next')text+=' 다음 공개 사진 정리 안내를 들었지만 참석을 약속한 것은 아니다.';}
  g.playerFinished=true;
 }
 for(const id of people){noteNpcExperience(s,id,'supply-shared-step',{fatigue:5,stress:g.coordination>1?-4:2,warmth:2},`supply:${step}`);supplyRelation(s,id,'taei',{familiarity:1,...(choice==='roles'||choice==='labels'?{trust:1}:{})});}
 const chunks=[Math.round(record.duration/6),Math.round(record.duration/2),record.duration-Math.round(record.duration/6)-Math.round(record.duration/2)],leaving=people.filter(id=>g.plan[id].leave<=s.clock.minute+chunks[step]);if(leaving.length)text+=' '+leaving.map(id=>displayName(s,id)).join(', ')+'은 남길 일을 짚어주고 자기 일정 때문에 먼저 자리를 뜬다.';
 record.supplyGroup=true;record.supplySpeaker=people[0]??'taei';return intro+' '+text;
}
function resolveSupplyWorld(s){
 const g=s.supplyStory;if(!g||g.status==='resolved')return;
 const slots={};for(const id of supplyIds){slots[id]=[];if(g.plan[id].attending)for(let t=g.plan[id].join;t<g.plan[id].leave;t+=30)if(supplyCanAttend({...s,day:1,clock:{minute:t+15}},id))slots[id].push(t);}
 const ids=supplyIds.filter(id=>slots[id].length);g.actualParticipants=ids;g.attendanceSlots=slots;
 const overlap=(a,b)=>slots[a].some(t=>slots[b].includes(t));
 const strained=ids.some(a=>ids.some(b=>a!==b&&overlap(a,b)&&(s.relations[a+'>'+b]?.tension??0)>=4));
 const capacity=ids.reduce((n,id)=>n+slots[id].length/3,0);
 const enough=capacity+g.work>=5;
 const friendly=ids.some(a=>ids.some(b=>a!==b&&overlap(a,b)&&(s.relations[a+'>'+b]?.trust??0)>=6));g.npcCoordination=(friendly?1:0)+(ids.length>1&&ids.some(id=>g.plan[id].role==='check')?1:0);const coordination=g.coordination+g.npcCoordination;
 g.outcome=g.playerFinished&&g.burden>=4?'solo-burden':strained&&coordination<2?'separate':enough&&coordination>=2?'shared':enough?'practical':'limited';
 g.result={shared:'수량과 남은 일을 서로 확인하고 인수인계까지 정리했다.',practical:'먼저 끝낼 수 있는 포장을 마쳤다. 세부 인수인계는 다음에 더 맞추기로 했다.',limited:'가능한 물품부터 마무리하고 남은 일은 표시해 두었다.',separate:'각자 맡은 구역을 따로 끝냈다. 기준을 맞추는 일은 남아 있다.','solo-burden':'태이가 남은 정리를 많이 맡아 일을 마쳤지만 과정과 책임이 한 사람에게 몰렸다.'}[g.outcome];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)if(overlap(ids[i],ids[j])){
  const delta=g.outcome==='separate'?{familiarity:1,tension:1}:g.outcome==='shared'?{familiarity:1,trust:1,tension:-1}:{familiarity:1};supplyRelation(s,ids[i],ids[j],delta);supplyRelation(s,ids[j],ids[i],delta);
 }
 for(const id of ids)noteNpcExperience(s,id,'supply-outcome',{stress:g.outcome==='separate'?8:g.outcome==='shared'?-7:2},'supply-world-once');
 g.status='resolved';g.finishedAt=g.end;g.effected=true;s.eventState.flags.logisticsReady=['shared','practical','solo-burden'].includes(g.outcome);
 const event={id:'supplies',kind:'scheduled',stage:'campus',day:1,phase:'afternoon',participants:[...ids,...(g.actions.length?['taei']:[])],status:'resolved',outcome:g.outcome,result:g.result,visibility:'participants'};
 s.events=s.events.filter(e=>!(e.id==='supplies'&&e.day===1));s.events.push(event);
 // Only the player who actually finishes sees the overall handover; no omniscient diary entry.
 if(g.playerFinished){s.eventState.knowledge['campus:1:supplies']={source:'participated',day:s.day,phase:s.phase};s.memory.push('[1일차] '+g.result);}
}
export function advanceSupplyWorld(s,before,end){if(!usesSupplyStory(s)||s.day!==1||(s.world?.stage??'campus')!=='campus')return;if(end>=780)prepareSupplyStory(s);if(s.supplyStory&&end>=s.supplyStory.end)resolveSupplyWorld(s);}
export function finishSupplyPlayer(s,record){
 const g=s.supplyStory;if(!g)return '';if(s.clock.minute>=g.end)resolveSupplyWorld(s);
 s.choice='volunteer';s.minutes=record.spent;
 s.freeDay.completed.push({id:'volunteer',start:record.startedAt,end:s.clock.minute,activeMinutes:record.spent});
 for(const a of s.appointments??[])if(a.day===1&&a.status==='pending'&&a.activity==='volunteer')a.status='kept';
 for(const [id,status] of Object.entries(s.dialogue.promises??{}))if(status==='pending'&&g.met.includes(id))s.dialogue.promises[id]='kept';
 return g.result+(g.burden>=4?' 태이는 쉬어갈 틈이 적었고, 다음에는 책임을 나눌 필요를 느꼈다.':'');
}
export function canAskSupplyReport(s,id){return s.supplyStory?.status==='resolved'&&s.supplyStory.actualParticipants?.includes(id)&&contact(s,id).introduced&&!s.supplyStory.reports[id];}
export function supplyReport(state,id){
 if(!canAskSupplyReport(state,id)||state.npcs[id]?.location!==state.location)throw new Error('지금 이 사람에게 들을 수 있는 이야기가 아닙니다.');
 const s=structuredClone(state),g=s.supplyStory,now=npcNow(s,id);
 if(now.bandwidth==='limited'||now.rushed||(s.relations[id+'>taei']?.tension??0)>=4)return {state:s,text:'지금은 자세히 이야기하기 어렵네요. 나중에 여유 있을 때 이야기해요.'};
 const full=(g.attendanceSlots?.[id]??[]).includes(g.end-30);
 const text=full?`그날 준비는 ${g.result} 제가 끝까지 있었던 쪽에서는 그렇게 정리했어요.`:'저는 중간에 나왔어요. 제가 있던 동안에는 상자와 목록을 맞추고 있었는데, 그 뒤 마무리는 직접 못 봤어요.';
 g.reports[id]={day:s.day,minute:s.clock.minute,scope:full?'handover':'partial'};s.memory.push(`[${s.day}일차] ${displayName(s,id)}에게 들음: ${text}`);return {state:s,text};
}
export function supplyConversationMemory(s,id){const g=s.supplyStory,w=g?.witnesses?.[id];if(!w?.length)return null;return w.some(x=>x.choice==='carry')?'같이 준비할 때 상자를 직접 옮기셨죠. 그때 한쪽에 일이 많이 몰리기는 했어요.':w.some(x=>x.choice==='roles')?'같이 준비하면서 언제까지 있을 수 있는지 먼저 물어봤잖아요. 그건 기억나요.':'같이 물품과 목록을 맞춰본 건 기억나요. 그때도 확인하는 방식이 다를 수 있겠다고 생각했어요.';}
