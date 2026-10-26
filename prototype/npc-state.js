import {timetable} from './timetable.js';
import {weatherNow} from './weather.js';
const lifeProfiles={
 yeogyeong:{load:1.15,sensitivity:0.9,recovery:1,baseline:8},
 seoyeon:{load:0.95,sensitivity:1,recovery:1.2,baseline:4},
 soyul:{load:1,sensitivity:1.25,recovery:0.85,baseline:11}
};
const bound=n=>Math.max(0,Math.min(100,Math.round(n)));
export function npcNow(s,id){
 const profile=lifeProfiles[id];if(!profile)throw new Error('알 수 없는 인물입니다.');
 const minute=s.clock?.minute??(s.phase==='evening'?1140:780),day=s.day??1;
 const lessons=timetable(s,id),next=lessons.find(c=>c.end>minute),inClass=next&&minute>=next.start;
 const until=next?next.start-minute:null;
 const classLoad=lessons.reduce((n,c)=>n+Math.max(0,Math.min(minute,c.end)-c.start),0);
 // Off-screen ordinary breaks are assumed; player absence does not starve NPCs.
 const resting=id==='seoyeon'?minute>=840&&minute<900:minute>=780&&minute<810;
 let fatigue=Math.max(0,minute-540)*0.055+classLoad*0.1*profile.load-(resting?12*profile.recovery:0);
 let stress=profile.baseline+(inClass?30:until!==null&&until>=0&&until<=20?48:0);
 const tension=s.relations?.[`${id}>taei`]?.tension??0;
 stress+=tension*6;
 const peers=Object.entries(s.relations??{}).filter(([k])=>k.startsWith(id+'>')&&!k.endsWith('>taei'));
 stress+=peers.reduce((n,[,r])=>n+(r.tension??0)*3,0);
 const task=day===1&&id==='yeogyeong'&&minute>=840&&minute<1080||day===3&&minute>=810&&minute<1080;
 if(task)stress+=18;
 const weather=weatherNow(s).kind;
 if(weather==='storm')stress+=8;
 if(day===3&&(s.warnings?.evidence?.length??0)>0)stress+=10;
 let warmth=0;
 const recent=[];
 for(const e of s.npcLife?.events??[]){
  if(e.person!==id)continue;
  const age=(day-e.day)*1440+minute-e.minute;if(age<0||age>=240)continue;
  const factor=1-age/240;fatigue+=(e.fatigue??0)*factor;stress+=(e.stress??0)*factor*profile.sensitivity;warmth+=(e.warmth??0)*factor;recent.push(e.kind);
 }
 fatigue=bound(fatigue);stress=bound(stress);warmth=Math.round(warmth);
 const rushed=!!inClass||until!==null&&until>=0&&until<=20;
 const mood=rushed?'rushed':stress>=55?'overwhelmed':fatigue>=50?'drained':warmth>=8&&stress<40?'bright':resting?'resting':task?'focused':'steady';
 return {minute,day,fatigue,stress,warmth,mood,rushed,resting,task,until,next:next?.name??null,recent,
  bandwidth:rushed?'brief':stress>=55||fatigue>=50?'limited':'open',
  disclosure:stress<45&&fatigue<50&&!rushed,
  cue:{rushed:'가방 끈을 고쳐 잡으며 시계를 거듭 확인한다.',overwhelmed:id==='soyul'?'대답하기 전 화면을 끄고 손에 쥔 휴대폰을 꼭 잡는다.':'말을 꺼내려다 멈추고 눈앞의 자료부터 한쪽으로 모은다.',drained:'눈가를 문지르고 자세를 고쳐 앉는다. 대답 사이의 간격이 평소보다 길다.',bright:id==='soyul'?'눈이 마주치자 먼저 짧게 웃는다.':'하던 일을 잠시 내려놓고 먼저 고개를 든다.',resting:'기대 앉은 자세를 그대로 두고 천천히 고개를 든다.',focused:'말을 듣는 동안에도 손가락은 하던 곳에 끼워두고 있다.',steady:'발소리가 들리자 하던 일에서 시선을 든다.'}[mood]};
}
export function noteNpcExperience(s,id,kind,effect={},key=kind){
 s.npcLife??={events:[],seen:{}};s.npcLife.events??=[];s.npcLife.seen??={};
 const stamp=`${s.day}:${id}:${key}`;if(s.npcLife.seen[stamp])return false;
 s.npcLife.seen[stamp]=true;
 s.npcLife.events.push({person:id,day:s.day??1,minute:s.clock?.minute??780,kind,...effect});
 // Keep a compact history, with separate deduplication keys for the short prototype.
 s.npcLife.events=s.npcLife.events.filter(e=>(s.day??1)-e.day<=1).slice(-120);return true;
}
export function conversationExperience(s,id,choice,key){
 const impatient=['push','decide','speakFor','rush','insist','force','ctxInsist'].includes(choice);
 const considerate=['space','respect','autonomy','quiet','wait','apologize','repair','ctxSpace','ctxListen'].includes(choice);
 const supported=['help','together','mutual','share','ctxHelp'].includes(choice);
 if(impatient)noteNpcExperience(s,id,'pressured',{stress:20,warmth:-8},key);
 else if(considerate)noteNpcExperience(s,id,'given-space',{stress:-8},key);
 else if(supported)noteNpcExperience(s,id,'supported',{stress:-10,warmth:10},key);
}
