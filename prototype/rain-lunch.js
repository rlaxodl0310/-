import {socialIntent} from './social-reasoning.js';
import {presentPeople,currentSchedule} from './days.js';
import {timetable} from './timetable.js';
import {wetWeather,hasUmbrella} from './weather.js';
import {contact,introduce,displayName,normalizeNpcAddress,seePeople} from './identity.js';
import {npcNow,noteNpcExperience} from './npc-state.js';
import {advanceFreeTime} from './free-roam.js';
import {enterBuildingArea,buildingActivity,mealPeriod,campusBuildings} from './campus-buildings.js';
import {changeRelationship} from './dialogue.js';
const lunchSources=['hall','library','creative','arts','academic','sculpture'];
export function lunchEpisode(s){return s.rainLunch?.episodes?.[s.rainLunch.active]??null;}
function lunchTimeBudget(s,id){
 const minute=s.clock.minute;
 const lessons=timetable(s,id).filter(c=>c.end>minute);
 const dates=(s.appointments??[]).filter(a=>(id==='taei'||a.person===id)&&a.day===s.day&&a.status==='pending'&&a.minute&&a.minute>=minute).map(a=>a.minute-minute-5);
 return Math.min(870-minute,...lessons.map(c=>Math.max(0,c.start-minute-30)),...dates);
}
export function rainLunchOffer(s,location,spot='entry'){
 if(!s.academics?.enabled||(s.world?.stage??'campus')!=='campus'||!wetWeather(s)||spot!=='entry'||!lunchSources.includes(location)||s.clock.minute<720||s.clock.minute>=840)return null;
 if((lunchEpisode(s)?.status==='active'&&lunchEpisode(s).day===s.day)||s.buildingLife?.meals?.includes(`${s.day}:lunch`))return null;
 const people=presentPeople(s,location).filter(id=>!s.rainLunch?.episodes?.[`${s.day}:${id}`]);
 if(!people.length)return null;
 const person=people[(s.campusVariation?.seed??1)%people.length],known=contact(s,person).introduced;
 const text=`창밖으로 빗줄기가 굵어졌다. ${known?displayName(s,person):'출입문 근처에 서 있던 학생'}이 휴대폰을 넣고 식당 쪽을 바라본다. ${known?'눈이 마주치자 가볍게 고개를 든다.':'서로 길을 비켜주다가 잠깐 눈이 마주친다.'}`;
 return {key:`lunch:${s.day}:${person}`,day:s.day,phase:s.phase,person,group:false,kind:'rain-lunch',text,action:'출입문 근처에서 인사한다. “비가 꽤 오네요. 식사하러 가세요?”',prefix:''};
}
export function passRainLunch(state,id){
 const s=structuredClone(state);s.rainLunch??={episodes:{},active:null};
 s.rainLunch.episodes[`${s.day}:${id}`]??={person:id,day:s.day,status:'passed',finishedAt:s.clock.minute,walked:false,ate:false};return s;
}
function lunchSay(s,r,player,text,narration=''){
 r.last={player,text:normalizeNpcAddress(s,r.person,text),narration};
}
function lunchPick(r,items){let x=r.rng;x^=x<<13;x^=x>>>17;x^=x<<5;r.rng=x>>>0||1;return items[Math.floor(r.rng/4294967296*items.length)];}
export function beginRainLunch(state,id){
 const s=structuredClone(state);
 if(rainLunchOffer(s,s.location)?.person!==id)throw new Error('지금 여기에서 마주친 사람이 아닙니다.');
 if(s.rainLunch?.episodes?.[`${s.day}:${id}`]||!presentPeople(s,s.location).includes(id))throw new Error('이미 지나간 만남입니다.');
 s.rainLunch??={episodes:{},active:null};const key=`${s.day}:${id}`;
 const r={person:id,day:s.day,status:'active',stage:'greeting',location:s.location,origin:s.location,startedAt:s.clock.minute,spent:0,walked:false,ate:false,first:!contact(s,id).introduced,rng:((s.campusVariation?.seed??51917)^s.clock.minute^id.length)>>>0||1,choices:[],last:null};
 s.rainLunch.episodes[key]=r;s.rainLunch.active=key;
 const previous=s.dialogue.sessions?.[`${s.day}:${s.phase}:${id}`];if(previous){previous.closed=true;previous.finished=false;}
 lunchSay(s,r,'비가 꽤 오네요. 식사하러 가세요?',contact(s,id).introduced?lunchPick(r,['아, 또 보네요. 밥 먹으러 가려고 나왔는데 비가 이러네요.','이제 먹으러 가려고요. 잠깐만 나왔다가 발 묶였네.']):lunchPick(r,['네, 아직 못 먹어서요. 나가려는데 갑자기 좀 굵어졌네요.','아, 네. 식당 쪽으로 가려던 참이에요. 먼저 지나가셔도 돼요.']),npcNow(s,id).cue);
 return s;
}
export function lunchAvailability(s){
 const r=lunchEpisode(s);if(!r||r.status!=='active')return '지금 이어가는 만남이 없다.';
 if(r.day!==s.day||r.location!==s.location||!presentPeople(s,s.location).includes(r.person))return '상대는 이미 다른 일정으로 자리를 옮겼다. 다음에 다시 마주치면 이야기하자.';
 return null;
}
export function rainLunchView(s){
 const r=lunchEpisode(s);if(!r)return null;
 const option=(id,label)=>({id,label});
 if(r.status!=='active')return {last:r.last,options:[option('leave','인사를 마치고 하던 일로 돌아간다.')],ended:true};
 const unavailable=lunchAvailability(s);if(unavailable)return {last:{player:'',text:'',narration:unavailable},options:[option('leave','붙잡지 않고 하던 일로 돌아간다.')]};
 const options={
  greeting:[...(!contact(s,r.person).introduced?[option('introduce','아, 저는 김태이예요. 성함 여쭤봐도 될까요?')]:[]),option('invite','저도 식당 가려던 참인데, 같이 걸어갈래요?'),option('leave','먼저 가세요. 저는 잠깐 더 있다 갈게요.')],
  route:[option('covered','급하게 가지 말고 비가 덜 드는 가장자리로 돌아간다.'),...(hasUmbrella(s)&&((s.relations[`${r.person}>taei`]?.trust??0)>=3)?[option('umbrella','괜찮으면 제 우산 같이 써요. 가까운 길로 갈까요?')]:[]),option('leave','지금은 각자 움직이는 게 낫겠어요. 다음에 봬요.')],
  walking:[option('pace','상대의 보폭에 맞추고 잠깐 말없이 걷는다.'),option('share','곡 작업하다 보면 저도 식사 시간을 자주 놓친다고 이야기한다.'),option('rush','시간이 아까워서 조금 서둘러 가자고 한다.')],
  seats:[option('wait','상대가 둘러보는 동안 자리를 정하지 않고 기다린다.'),option('ask','빈자리를 찾아 가리킨다. “여기 괜찮아요?”'),option('separate','오늘은 따로 먹는 게 편하면 그래도 괜찮아요.')],
  parting:[...(!contact(s,r.person).introduced?[option('introduce','같이 와놓고 이름도 몰랐네요. 저는 김태이예요.')]:[]),option('finish','식판을 정리하고 각자 다음 일정으로 향한다.')]
 }[r.stage]??[];
 return {last:r.last,options};
}
function closeLunch(s,r,reason){
 if(r.day===s.day&&r.location===s.location&&presentPeople(s,s.location).includes(r.person))seePeople(s,[r.person]);
 r.status='completed';r.finishedAt=s.clock.minute;r.outcome=reason;s.npcs[r.person].location=currentSchedule(s)[r.person];
 s.dialogue.generatedVisits??={};s.dialogue.generatedVisits[r.person]={day:s.day,minute:s.clock.minute};
 const who=displayName(s,r.person);
 s.memory.push(`[${s.day}일차] ${who}와 비 오는 점심시간에 ${r.ate?'식당까지 걸어 함께 식사했다.':r.walked?'식당까지 함께 걷고 각자 갈 길로 향했다.':'짧게 이야기하고 서로의 시간을 존중하며 헤어졌다.'}`);
}
export function interruptRainLunch(state){
 const s=structuredClone(state),r=lunchEpisode(s);if(r?.status==='active')closeLunch(s,r,'interrupted');return s;
}
export function rainLunchAction(state,choice){
 let s=structuredClone(state),r=lunchEpisode(s);const view=rainLunchView(s);
 if(!r||!view?.options.some(o=>o.id===choice))throw new Error('지금 할 수 없는 행동입니다.');
 if(r.status!=='active'){if(choice!=='leave')throw new Error('이미 마친 만남입니다.');return {state:s,leave:true};}
 if(choice==='leave'){
  if(!r.walked)noteNpcExperience(s,r.person,'given-space',{stress:-4},`lunch:${r.day}:space`);
  lunchSay(s,r,'그럼 다음에 봬요.','네. 조심해서 가세요.');closeLunch(s,r,'left');return {state:s,leave:true};
 }
 r.choices.push(choice);
 if(choice==='introduce'){
  introduce(s,r.person,'rain-lunch-introduction');
  lunchSay(s,r,'저는 김태이예요. 이번에 복학했어요.',`저는 ${s.npcs[r.person].name}이에요. ${r.stage==='parting'?'그러게요. 이름도 모르고 같이 왔네요.':'아, 복학하셨구나. 반가워요.'}`);return {state:s};
 }
 if(choice==='invite'){
  const budget=lunchTimeBudget(s,r.person),playerBudget=lunchTimeBudget(s,'taei'),relation=s.relations[`${r.person}>taei`]??{},guarded=(relation.tension??0)>=4||socialIntent(s,r.person).mode==='guarded';
  if(budget<10||guarded){
   lunchSay(s,r,'같이 걸어갈래요?',budget<10?'지금은 곧 가봐야 해서요. 밥은 나중에 먹으려고요. 인사해줘서 고마워요.':'오늘은 혼자 움직이고 싶어요. 먼저 가셔도 돼요.');closeLunch(s,r,'declined');
  }else{
   // Capacity and personal space both matter; no affection threshold guarantees consent.
   const chance=!r.first?0.9:r.person==='soyul'?0.55:0.8;
   if(lunchPick(r,[0.1,0.35,0.65,0.95])>chance){lunchSay(s,r,'같이 걸어갈래요?','고마운데 오늘은 혼자 갈게요. 아직 좀 어색해서요.');closeLunch(s,r,'declined');}
   else{r.walkOnly=Math.min(budget,playerBudget)<45||npcNow(s,r.person).bandwidth==='limited'||npcNow(s,r.person).task;r.stage='route';lunchSay(s,r,'같이 걸어갈래요?',r.walkOnly?'식당 쪽까지는 같이 가도 돼요. 다만 오래 앉아 있지는 못할 것 같아요.':contact(s,r.person).introduced?'좋아요. 따로 뛰어갈 뻔했네. 천천히 가요.':'네, 그쪽으로 가시는 거면 같이 걸어가도 괜찮겠네요.');}
  }
 }else if(choice==='covered'||choice==='umbrella'){
  const minutes=choice==='covered'?15:10;
  if(lunchTimeBudget(s,r.person)<minutes||lunchTimeBudget(s,'taei')<minutes){lunchSay(s,r,'같이 가려면 시간이 좀 걸리겠네요.','그러면 오늘은 여기서 인사해야겠어요. 늦으면 안 되는 일정이 있어서요.');closeLunch(s,r,'deadline');}
  else{
   r.route=choice;r.stage='walking';
   lunchSay(s,r,choice==='covered'?'비가 덜 드는 가장자리로 가자고 한다.':'우산을 함께 써도 괜찮은지 묻는다.',choice==='covered'?'좋아요. 조금 돌아가도 덜 젖는 쪽으로 가요.':'괜찮아요. 너무 붙어서 불편하면 제가 먼저 말할게요.','처마 끝에서 서로 보폭을 맞추기 시작한다. 걸어가는 동안 어떤 이야기를 할지, 말없이 갈지 선택할 수 있다.');
  }
 }else if(['pace','share','rush'].includes(choice)){
  const minutes=r.route==='umbrella'&&hasUmbrella(s)?10:15;
  if(lunchTimeBudget(s,r.person)<minutes||lunchTimeBudget(s,'taei')<minutes){lunchSay(s,r,'지금은 같이 걷기 어렵겠네요.','그럼 오늘은 여기서 인사해요. 서로 늦지는 말아야죠.');closeLunch(s,r,'deadline');return {state:s};}
  s=advanceFreeTime(s,minutes,{travelling:true});s.pace={count:0,seen:{}};r=lunchEpisode(s);r.spent+=minutes;r.walked=true;
  s.location='cafeteria';if(!s.known.includes(campusBuildings.cafeteria.fact))s.known.push(campusBuildings.cafeteria.fact);s=enterBuildingArea(s,'dining').state;r=lunchEpisode(s);r.location='cafeteria';s.npcs[r.person].location='cafeteria';seePeople(s,[r.person]);
  if(choice==='share'){
   s.dialogue.generation??={rng:r.rng,sequence:0,recent:{}};s.dialogue.generation.sharedWork??=[];
   if(!s.dialogue.generation.sharedWork.includes(r.person))s.dialogue.generation.sharedWork.push(r.person);
  }
  if(choice==='rush'){
   changeRelationship(s,r.person,'taei',{tension:1});noteNpcExperience(s,r.person,'pressured',{stress:6},`lunch:${r.day}:rush`);
  }else{changeRelationship(s,r.person,'taei',{trust:1});noteNpcExperience(s,r.person,'supported',{stress:-5},`lunch:${r.day}:walk`);}
  const line=choice==='share'?{yeogyeong:'하나 붙잡고 있으면 다른 걸 잊는 건 비슷하네요. 저는 정리 끝내겠다고 하다 보면 그래요.',seoyeon:'좋아서 시작한 일인데 쉬는 시간이 없어지기도 하네요. 밥 먹을 때만큼은 잠깐 멈춰도 되지 않을까요?',soyul:'저도 뭘 고르다 보면 계속 다시 보게 돼요. 오늘은 밥부터 먹고 나중에 볼래요.'}[r.person]:choice==='rush'?'저는 좀 천천히 가고 싶었어요. 빨리 끝내야 하는 일이 하나 더 생긴 기분이라.':lunchPick(r,['말 안 하고 걸어도 괜찮네요. 괜히 무슨 얘기 해야 하나 생각했는데.','조금 늦게 와도 되는 거였네. 아까는 비 피할 생각만 했어요.']);
  if(r.walkOnly||lunchTimeBudget(s,r.person)<25||lunchTimeBudget(s,'taei')<25){r.stage='parting';lunchSay(s,r,view.options.find(o=>o.id===choice).label,line,'외식관 1층 101호 학식당 입구에 들어선다. 휴대폰 시각을 확인한 상대가 가방을 다시 멘다. 오늘은 같이 앉기보다 여기서 헤어질 때다.');}
  else{r.stage='seats';lunchSay(s,r,view.options.find(o=>o.id===choice).label,line,'함께 걸어 외식관 1층 101호 학식당에 도착한다. 식당 안에 빈자리가 띄엄띄엄 보인다. 서로 앉을 곳을 살핀다.');}
 }else if(['wait','ask','separate'].includes(choice)){
  if(choice==='separate'||mealPeriod(s)!=='lunch'||s.buildingLife?.meals?.includes(`${s.day}:lunch`)||Math.min(lunchTimeBudget(s,r.person),lunchTimeBudget(s,'taei'))<25){r.stage='parting';lunchSay(s,r,view.options.find(o=>o.id===choice).label,'그럼 오늘은 여기까지 같이 와요. 다음에 만나면 그때 얘기해도 되고요.');}
  else{
   s=buildingActivity(s,'meal').state;s=advanceFreeTime(s,25);s.pace={count:0,seen:{}};r=lunchEpisode(s);r.ate=true;r.spent+=25;r.stage='parting';
   changeRelationship(s,r.person,'taei',{familiarity:1,...(choice==='wait'?{trust:1}:{})});
   noteNpcExperience(s,r.person,'shared-lunch',{stress:-8,warmth:8},`lunch:${r.day}:meal`);
   lunchSay(s,r,view.options.find(o=>o.id===choice).label,choice==='wait'?'기다려줘서 고마워요. 그냥 먼저 정해버려도 된다고 말할 뻔했는데, 제가 고르니까 편하네요.':'네, 여기가 좋겠어요. 아까 하던 얘기는 급하게 결론 안 내도 될 것 같고요.','식사를 받으며 각자 잠깐 조용해졌다. 한두 마디씩 이야기를 나누고 식판을 정리할 시간이 됐다.');
  }
 }else if(choice==='finish'){
  lunchSay(s,r,'저도 이제 하던 일 하러 가볼게요.','네. 다음에 마주치면 인사해요. 오늘 고마웠어요.','각자 가방을 챙긴다. 이제 각자 가야 할 쪽으로 발길을 돌린다.');closeLunch(s,r,r.ate?'shared-meal':'walk-only');
 }
 return {state:s};
}
