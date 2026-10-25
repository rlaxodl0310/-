import {spendTime,campusMinute} from './campus-time.js';
import {activityEvents,phaseEvents} from './event-engine.js';
import {introduce,contact,identities,learnIdentity,clubRoster} from './identity.js';
import {personalMessage} from './social-reasoning.js';
import {changeRelationship,relationship} from './dialogue.js';
import {days,availableRoutes} from './days.js';
export function newGame(profile='acquaintance') {
 const s={version:6,clock:{minute:780},world:{stage:'campus'},eventState:{flags:{},plans:{},knowledge:{}},contacts:{},encounters:{},day:1,phase:'afternoon',choice:null,minutes:0,location:'campus',
  known:[],inventory:[],discoveries:[],messages:[],events:[],relations:{},npcs:{yeogyeong:{name:'차여경',location:'hall'},seoyeon:{name:'한서연',location:'hall'},soyul:{name:'박소율',location:'hall'}},
  memory:[],dayHistory:[],appointments:[],lastResult:'',dialogue:{history:[],promises:{}}};
 for(const id of clubRoster){learnIdentity(s,id,'club-roster');s.contacts[id].playerNameKnown=true;}
 changeRelationship(s,'seoyeon','soyul',{familiarity:20,trust:12,affection:8});
 changeRelationship(s,'soyul','seoyeon',{familiarity:20,trust:12,affection:8});
 if(profile!=='acquaintance')for(const id of Object.keys(s.npcs))changeRelationship(s,id,'taei',profile==='close'?{familiarity:8,trust:5,affection:5}:{familiarity:6,trust:4,affection:0});
 if(profile!=='acquaintance'){for(const id of Object.keys(s.npcs))introduce(s,id,'relationship-demo');s.dialogue.facts={};for(const id of Object.keys(s.npcs))s.dialogue.facts[id]={speech:'casual'};}
 return s;
}
function remember(s,text){s.memory.push(`[${s.day}일차] ${text}`);}
function know(s,...facts){for(const fact of facts)if(!s.known.includes(fact))s.known.push(fact);}
export function act(state,choice,options={}){
 if(state.phase!=='afternoon')throw new Error('오늘의 오후 활동은 이미 완료했습니다.');
 const route=availableRoutes(state).find(r=>r.id===choice);
 if(!route||route.locked)throw new Error('지금 선택할 수 없는 활동입니다.');
 let s=state.day===1?spendTime(state,Math.max(0,960-campusMinute(state))):structuredClone(state);const day=s.day;
 s.clock={minute:day===1?960+route.duration:1080+route.duration};s.choice=choice;s.minutes=route.duration;s.phase='evening';s.lastResult=route.memory;
 const encounters=choice==='volunteer'||choice==='exhibit'?Object.keys(s.npcs):choice==='review'?['soyul']:choice==='backstage'?['seoyeon']:[];
 for(const id of encounters)if(!contact(s,id).introduced){introduce(s,id,'shared-activity');s.lastResult=`활동에 앞서 ${identities[id].name}과 함께 준비를 시작하며 몇 마디 나눴다. `+s.lastResult;remember(s,`${identities[id].name}과 함께 활동하며 이야기를 나눴다.`);}
 remember(s,route.memory);know(s,...route.knowledge);
 if(day===1&&choice==='volunteer'){
  changeRelationship(s,'yeogyeong','taei',{trust:1});
  s.messages.push({day,from:'봉사단 단체방',text:'오늘 정리까지 도와주셔서 감사합니다.'});
 }else if(day===2&&choice==='review'){
  changeRelationship(s,'soyul','taei',{familiarity:2,trust:1});
  changeRelationship(s,'yeogyeong','taei',{trust:1});
  s.messages.push({day,from:'박소율',text:relationship(s,'soyul').familiarity>=4?'아까 같이 골라줘서 고마워. 여경이한테 파일 보냈어.':'오늘 사진 같이 봐주셔서 감사해요. 파일은 여경이한테 보냈어요.'});
 }else if(day===3&&choice==='exhibit'){
  for(const id of Object.keys(s.npcs))changeRelationship(s,id,'taei',{familiarity:1,trust:1});
  s.messages.push({day,from:'봉사단 단체방',text:'사진 전시 준비를 마쳤습니다. 도와주셔서 감사합니다.'});
 }else s.messages.push({day,from:'봉사단 단체방',text:day===1?'오늘 활동 마쳤습니다. 참여하신 분들 수고하셨어요.':'오늘 일정 마쳤습니다. 모두 수고하셨어요.'});
 s=activityEvents(s,choice,options.approach);
 if(day===2&&choice==='work'&&s.dayHistory.some(h=>h.choice==='rehearsal')){
  s.lastResult+=' 어제 합주에서 확인한 부분을 수정해 데모를 녹음했다.';remember(s,'어제의 합주를 바탕으로 데모를 녹음했다.');
 }
 for(const [id,status] of Object.entries(s.dialogue.promises)){
  if(status!=='pending')continue;
  const kept=choice==='volunteer';s.dialogue.promises[id]=kept?'kept':'broken';
  changeRelationship(s,id,'taei',kept?{trust:2}:{trust:-2,tension:2});
  remember(s,`${s.npcs[id].name}에게 한 참석 약속을 ${kept?'지켰다.':'지키지 못했다.'}`);
 }
 for(const appointment of s.appointments.filter(a=>a.day===day&&a.status==='pending')){
  const kept=appointment.activity===choice;appointment.status=kept?'kept':'broken';
  changeRelationship(s,appointment.person,'taei',kept?{trust:2}:{trust:-1,tension:1});
  remember(s,`${s.npcs[appointment.person].name}과 한 ${appointment.label} 약속을 ${kept?'지켰다.':'지키지 못했다.'}`);
 }
 for(const [id,npc] of Object.entries(s.npcs))npc.location=days[day].schedules.evening[id];
 return s;
}
export function nextDay(state){
 if(state.phase!=='evening')throw new Error('오후 활동을 마친 뒤 하루를 마무리할 수 있습니다.');
 if(state.day>=3)throw new Error('3일간의 시제품을 모두 마쳤습니다.');
 let s=structuredClone(state);
 s.dayHistory.push({day:s.day,choice:s.choice,promises:structuredClone(s.dialogue.promises)});
 s.clock={minute:780};s.day++;s.phase='afternoon';s.choice=null;s.minutes=0;s.lastResult='';s.location='campus';s.dialogue.promises={};
 for(const [id,npc] of Object.entries(s.npcs))npc.location=days[s.day].schedules.afternoon[id];
 if(s.day===2){
  s.messages.push({day:2,from:'봉사단 단체방',text:'오늘 여경은 학생회관에서 정리하고, 소율은 도서관에서 사진을 고릅니다. 서연은 오후에 대학가 카페에 있어요.'});
  for(const id of Object.keys(s.npcs)){const text=personalMessage(s,id);if(text)s.messages.push({day:2,from:s.npcs[id].name,text});}
 }else s.messages.push({day:3,from:'봉사단 단체방',text:'오늘 사진 전시 준비는 학생회관에서 진행합니다. 소율은 먼저 도서관에서 파일을 챙깁니다. 공연 리허설도 같은 오후에 있어요.'});
 return phaseEvents(s);
}
export function acceptAppointment(state,person){
 if(state.day!==2||!state.npcs[person])throw new Error('지금은 다음 날 약속을 잡을 수 없습니다.');
 if(!contact(state,person).introduced||relationship(state,person).familiarity<2||relationship(state,person).tension>=3)throw new Error('아직 함께 일정을 잡을 만큼 이야기하지 않았습니다.');
 const s=structuredClone(state),activity=person==='seoyeon'?'backstage':'exhibit';
 if(s.appointments.some(a=>a.person===person&&a.status==='pending'))throw new Error('이미 수락한 약속입니다.');
 s.appointments.push({person,day:3,activity,label:activity==='backstage'?'리허설':'전시 준비',status:'pending'});
 remember(s,`${s.npcs[person].name}과 내일 ${activity==='backstage'?'리허설':'전시 준비'}에 참여하기로 했다.`);
 return s;
}
export function cancelAppointment(state,person){
 const s=structuredClone(state),a=s.appointments.find(a=>a.person===person&&a.status==='pending');
 if(!a||(s.day===3&&s.phase==='evening'))throw new Error('취소할 수 있는 약속이 없습니다.');
 a.status='cancelled';remember(s,`${s.npcs[person].name}에게 미리 연락해 ${a.label} 약속을 취소했다.`);
 s.messages.push({day:s.day,from:s.npcs[person].name,text:'미리 알려줘서 고마워요. 그럼 이번 일정은 다른 사람들과 진행할게요.'});
 return s;
}
export function save(state){return JSON.stringify(state);}
export function restore(raw){
 const s=JSON.parse(raw);
 if(s?.version===1){s.version=2;s.dialogue={history:[],promises:{}};}
 if(s?.version===2){s.version=3;s.day=1;s.dayHistory=[];s.appointments=[];s.lastResult=s.memory?.at(-1)??'';for(const h of s.dialogue?.history??[])h.day=1;for(const npc of Object.values(s.npcs??{}))npc.location='hall';}
 if(s?.version===3){
  s.version=4;s.contacts??={};
  const oldInteractions=new Set((s.dialogue?.history??[]).filter(h=>h.person!=='group').map(h=>h.person));
  for(const a of s.appointments??[])oldInteractions.add(a.person);
  for(const id of Object.keys(s.npcs??{}))if(oldInteractions.has(id)||s.dialogue?.facts?.[id]?.speech==='casual')introduce(s,id,'legacy-interaction');
 }
 if(s?.version===4){s.version=5;s.encounters={};for(const id of clubRoster)if(s.npcs?.[id])learnIdentity(s,id,'club-roster');}
 if(s?.version===5){
  s.version=6;s.world??={stage:'campus'};s.eventState??={flags:{},plans:{},knowledge:{}};
  for(const event of s.events??[]){event.kind??='scheduled';event.stage??='campus';event.phase??='evening';}
  if(s.events?.some(e=>e.id==='photo-selection'))s.eventState.flags.photoStyle='joint';
 }
 if(s?.version!==6||!s.world||!s.eventState||!s.encounters||!s.contacts||!Number.isInteger(s.day)||s.day<1||s.day>3||!['afternoon','evening'].includes(s.phase)||!Array.isArray(s.memory)||!Array.isArray(s.known)||!Array.isArray(s.messages)||!Array.isArray(s.events)||!Array.isArray(s.dayHistory)||!Array.isArray(s.appointments)||!s.npcs||!s.relations||!Array.isArray(s.dialogue?.history)||!s.dialogue?.promises)throw new Error('지원하지 않는 저장 파일입니다.');
 s.clock??={minute:s.phase==='evening'?1140:780};
 s.inventory??=[];s.discoveries??=[];
 return s;
}
