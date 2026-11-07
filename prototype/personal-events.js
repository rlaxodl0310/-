import {dogyeomStories,dogyeomEventsAt,beginDogyeomEvent,dogyeomEventView,progressDogyeomEvent} from './dogyeom-events.js';
import {personalFollowups,followupGameOutcome} from './personal-followups.js';
import {presentPeople} from './days.js';
import {contact,introduce,displayName,seePeople} from './identity.js';
import {npcNow,noteNpcExperience} from './npc-state.js';
import {relationship,changeRelationship} from './dialogue.js';
import {timetable} from './timetable.js';
import {wetWeather} from './weather.js';
import {advanceFreeTime} from './free-roam.js';
import {personalEventPosition} from './personal-event-presence.js';
export const personalEventDefs={
 taei:{title:'미완성 곡의 한 줄',places:['arts','music','library','cafe'],intro:'복학 전에 적어 둔 가사 파일을 연다. 하고 싶은 말은 많은데, 막상 첫 줄을 읽으면 남의 이야기처럼 들린다.',opening:'지금 멋있게 들리는 말 말고, 내가 정말 하려던 말이 뭐였지.',options:[['honest','군휴학 전후 달라진 감정을 짧게 적는다.'],['sound','말보다 먼저 떠오르는 리듬을 흥얼거려 녹음한다.'],['plan','발매 목표를 작은 작업 단계로 나눈다.']],second:[['keep','미완성인 채로 작업 노트에 남긴다.'],['record','한 구절만 녹음하고 오늘 작업을 닫는다.']]},
 yeogyeong:{title:'맞지 않는 1,200원',places:['hall','library','cafe','cafeteria'],intro:'수첩과 영수증 사이에서 계산기 소리가 멈춘다. 여경은 같은 줄을 두 번 확인하고도 종이를 덮지 못한다.',opening:'큰돈은 아닌데요. 안 맞는 걸 그냥 넘기는 건 좀 그래서요. 제가 어디서 빼먹었나.',options:[['compare','어디까지 확인했는지 묻고, 허락받은 영수증만 대조한다.'],['break','잠깐 쉬었다가 본인이 확인하고 싶은 부분부터 같이 보자고 한다.'],['pay','내가 1,200원을 내면 해결되지 않겠느냐고 묻는다.']],second:[['share','다음에도 혼자 확인하지 않도록 대조 방법을 함께 적는다.'],['respect','지금 정리한 부분까지만 넘기고 남은 확인은 본인이 맡게 둔다.']]},
 seoyeon:{title:'괜찮다는 말의 뒤',places:['hall','library','cafe','cafeteria'],intro:'서연은 부탁 메시지에 답장을 쓰다 지운다. 누구에게나 편하게 대답하던 목소리가 이번에는 조금 늦게 나온다.',opening:'다 어려운 부탁은 아닌데, 한 번씩만 들어주면 제 시간은 계속 뒤로 밀리네요. 말은 제가 괜찮다고 했으니까.',options:[['ask','어디까지 이야기해도 괜찮은지 묻고, 본인이 원하는 걸 듣는다.'],['draft','거절 대신 가능한 범위를 적는 답장을 같이 생각해 보자고 한다.'],['decide','그냥 다 거절하라고 단정해서 말한다.']],second:[['boundary','본인이 편한 표현을 고르도록 기다려 준다.'],['split','지금 내가 실제로 나눠 맡을 수 있는 일만 물어본다.']]},
 soyul:{title:'아직 보여주지 않은 한 장',places:['library','hall','cafe'],intro:'소율이 휴대폰 화면을 껐다 켠다. 사진을 고르는 손은 멈췄는데, 설명을 꺼내는 쪽이 더 어려워 보인다.',opening:'이 사진은… 잘 찍었다는 말 말고요. 무슨 느낌인지 한번 들어보고 싶어서. 근데 그냥 안 봐도 돼요.',options:[['permission','보여 주고 싶은 사진만 편한 만큼 보여 달라고 한다.'],['listen','사진 설명보다, 왜 남겨 두고 싶은지 먼저 물어본다.'],['choose','사진을 보기 전에 어떤 사진을 골라야 할지 먼저 정해 준다.']],second:[['meaning','내가 느낀 점을 말하되, 해석이 맞는지는 본인에게 묻는다.'],['wait','바로 공개하지 않아도 된다며 저장해 둘 시간을 준다.']]},
 iseo:{title:'쉬는 날에도 운동?',places:['gym','field','outdoorCourt'],intro:'운동을 마친 단발머리 학생이 물병 뚜껑을 닫고 스트레칭한다. 눈이 마주치자 먼저 말을 건다.',opening:'저 오늘은 가볍게만 하려고 했거든요. 근데 오니까 또 이것저것 하게 되네요. 가만히 쉬는 것도 연습해야 하나?',options:[['listen','훈련과 쉬는 시간을 어떻게 나누는지 물어본다.'],['introduce','운동 이야기를 듣다가 자연스럽게 서로 이름을 묻는다.'],['tease','쉬는 날에도 운동하러 오는 거냐며 가볍게 웃는다.']],second:[['pace','가볍게 마무리 스트레칭을 하고 무리하지 않기로 한다.'],['chat','운동은 여기까지 하고 조금 걸으며 이야기를 듣는다.']]}
};
export function iseoEventLocation(s){if(s.clock.minute<960||s.clock.minute>=1080)return null;return wetWeather(s)?'gym':s.clock.minute<1020?'gym':s.day%2?'field':'outdoorCourt';}
function enoughTime(s,id,minutes){if(s.clock.minute+minutes>1320)return false;if(id==='taei')return true;const booked=(s.appointments??[]).some(a=>a.person===id&&a.day===s.day&&a.status==='pending'&&a.minute>=s.clock.minute&&a.minute<s.clock.minute+minutes);return !booked&&(id==='iseo'||!timetable(s,id).some(c=>c.start<s.clock.minute+minutes&&c.end>s.clock.minute));}
function firstPersonalEventsAt(s,place=s.location){
 if(s.academics?.registrationPending||s.freeDay?.home)return [];
 return Object.entries(personalEventDefs).filter(([id,d])=>{
  const r=s.personalEvents?.records?.[id];if(r?.status==='completed'||s.clock.minute<720||!enoughTime(s,id,r?.stage?20:30)||!d.places.includes(place))return false;
  if(id==='taei')return s.clock.minute>=780;
  if(id==='iseo')return (personalEventPosition(s,id)??iseoEventLocation(s))===place;
  if(!contact(s,id).introduced||s.clock.minute>=1080)return false;
  return (personalEventPosition(s,id)===place||presentPeople({...s,location:place},place).includes(id))&&!npcNow(s,id).rushed;
 }).map(([person,d])=>({person,eventId:person,title:person==='iseo'&&!contact(s,'iseo').introduced?'운동을 마친 학생':d.title,resuming:s.personalEvents?.records?.[person]?.status==='paused'}));
}
export function personalEventRecord(s){return s.personalEvents?.records?.[s.personalEvents?.active]??null;}
function beginFirstPersonalEvent(state,id){if(!firstPersonalEventsAt(state).some(e=>e.eventId===id))throw new Error('지금 같은 장소에서 이어갈 수 없는 이벤트입니다.');const s=structuredClone(state);s.personalEvents??={active:null,records:{}};const previous=s.personalEvents.records[s.personalEvents.active];if(previous?.status==='active'&&previous.person!==id)previous.status='paused';const old=s.personalEvents.records[id];const mood=id==='taei'?'steady':id==='iseo'?'bright':npcNow(s,id).mood;s.personalEvents.records[id]={...old,person:id,eventId:id,episode:1,status:'active',day:s.day,location:s.location,until:s.clock.minute+(old?.stage?20:30),stage:old?.stage??0,choices:old?.choices??[],context:{mood,close:id==='taei'?false:relationship(s,id).familiarity>=6,trusted:id==='taei'?false:relationship(s,id).trust>=4}};s.personalEvents.active=id;if(id==='iseo')seePeople(s,['iseo']);return s;}
function reaction(id,choice,context){const close=context.close,limited=['drained','overwhelmed'].includes(context.mood);const replies={
 taei:{honest:'군대에 가기 전에는 당연하던 일들이, 돌아오니 조금씩 달라져 있다. 그 어긋남을 감추지 않고 첫 줄에 남겼다.',sound:'말로 설명하려던 감정을 짧은 허밍으로 남겼다. 완성된 멜로디는 아니어도 다시 시작할 위치가 생겼다.',plan:'발매라는 큰 목표를 데모·가사·합주 확인으로 나누었다. 오늘 끝낼 수 있는 몫부터 보인다.'},
 yeogyeong:{compare:close?'이런 거 같이 보면 이상하게 덜 답답해요. 여기, 제가 확인한 데까지만 표시했어요.':'그럼 이 영수증부터 같이 봐주실래요? 전체를 넘기기보다는 제가 확인한 부분부터요.',break:limited?'사실 같은 줄만 계속 보고 있었어요. 잠깐 멈췄다가 보면 좀 낫겠죠.':'쉬라고 하면 계속 마음에 걸릴 줄 알았는데… 어디까지 봤는지 적어 두면 괜찮겠네요.',pay:'돈을 맞추는 것하고, 왜 안 맞는지 아는 건 조금 달라요. 대신 내주실 필요는 없어요.'},
 seoyeon:{ask:close?'저도 그냥 잘해 주고 싶어서 시작한 건데, 언제부터 부탁을 거절하면 제가 미안한 사람이 된 것 같아요.':'해결해 달라는 말은 아니고요. 제가 어디까지 괜찮은 건지 먼저 정하고 싶어요.',draft:'못 한다는 말만 쓰려니까 어렵더라고요. 오늘은 여기까지만 가능하다고 쓰면 조금 덜 막히네요.',decide:'그렇게 간단하면 좋겠는데요. 제가 계속 볼 사람들이기도 해서, 제 방식으로 말해 보고 싶어요.'},
 soyul:{permission:close?'그럼 이거 하나만. 이상하다고 느껴도 괜찮은데… 다른 사람한테 먼저 보여주지는 말아 줘요.':'한 장만 보여드릴게요. 아직 공개할 사진은 아니라서요.',listen:context.trusted?'아무 일도 안 일어나는 사진인데, 그래서 기억하고 싶었나 봐요. 꼭 특별한 날만 남겨야 하는 건 아니잖아요.':'그때 조용했던 느낌이 남아서요. 말로 하려니까 좀 어려운데… 그런 이유도 괜찮나 해서요.',choose:'아직 안 보셨잖아요. 어떤 걸 남길지는 제가 조금 더 생각해 볼게요.'},
 iseo:{listen:'그걸 잘 나누면 제가 여기서 이러고 있겠어요? 아, 농담이에요. 근데 쉬는 것도 마음먹고 해야 하긴 해요.',introduce:'아, 이름도 안 물어봤네요. 저는 정이서예요. 태권도과 2학년이고요. 저 혼자 먼저 떠들었네.',tease:close?'벌써 저 놀리는 거예요? 그래도 오늘은 진짜 여기까지만 할 거예요. 아마도요.':'그러게요. 저도 말하고 나니까 조금 웃기네. 대신 오늘은 기록 같은 건 안 재려고요.'}
};return replies[id][choice];}
function firstPersonalEventView(s){const r=personalEventRecord(s);if(!r)return null;const d=personalEventDefs[r.person];return {...d,...r,title:r.person==='iseo'&&!contact(s,'iseo').introduced?'운동을 마친 학생':d.title,options:r.status==='completed'?[]:r.stage?[...d.second,...(r.person==='iseo'&&!contact(s,'iseo').introduced?[["names","마무리하기 전에 서로 이름을 묻는다."]]:[])]:d.options,opening:r.person==='iseo'&&contact(s,'iseo').introduced?'또 운동 끝나고 보네요. 오늘은 쉬는 시간도 제대로 잡아보려고요.':d.opening};}
function progressFirstPersonalEvent(state,choice){const r=personalEventRecord(state),view=personalEventView(state);if(!r||r.status!=='active'||r.day!==state.day||r.location!==state.location||state.clock.minute>r.until)throw new Error('장소와 시간을 다시 확인해 주세요.');const option=view.options.find(o=>o[0]===choice);if(!option||state.clock.minute+(r.stage?20:10)>r.until||!enoughTime(state,r.person,r.stage?20:10))throw new Error('지금 선택할 수 없는 행동입니다.');const id=r.person,stage=r.stage;let s=advanceFreeTime(state,stage?20:10),rec=s.personalEvents.records[id];rec.choices.push(choice);if(stage===0){rec.last={player:option[1],text:reaction(id,choice,rec.context)};rec.stage=1;if(id==='iseo'&&choice==='introduce'){introduce(s,'iseo','personal-event');s.contacts.iseo.details={major:'태권도과',year:2};s.contacts.iseo.lastSeen={day:s.day,minute:s.clock.minute,location:s.location};}const blunt=['pay','decide','choose'].includes(choice);if(id!=='taei')changeRelationship(s,id,'taei',blunt?{familiarity:1,tension:1}:{familiarity:1,trust:1});}
 else{if(id==='iseo'&&choice==='names'){introduce(s,'iseo','personal-event');s.contacts.iseo.details={major:'태권도과',year:2};s.contacts.iseo.lastSeen={day:s.day,minute:s.clock.minute,location:s.location};}const first=rec.choices[0],blunt=['pay','decide','choose'].includes(first);const endings={taei:choice==='record'?'한 구절을 녹음하고 수정할 지점을 적었다. 미완성 파일을 지우지 않고 다음 작업의 출발점으로 남겼다.':'완성하지 못한 줄도 작업 노트에 남겼다. 오늘 해야 할 만큼과 다음에 이어갈 부분을 나눴다.',yeogyeong:blunt?'돈을 대신 내는 것으로 끝내지 않고 기록을 다시 확인했다. 여경이 원하는 도움의 범위를 먼저 묻기로 했다.':choice==='share'?'누가 어디까지 확인했는지 표시하는 방법을 함께 남겼다. 대신 책임져 주기보다 확인할 몫을 나누었다.':'함께 본 부분만 정리하고 여경이 직접 마무리할 여지를 남겼다. 대화를 끝내며 수첩을 덮는 손이 조금 느긋해졌다.',seoyeon:blunt?'서연의 입장을 단순하게 정리했던 말을 거두고, 본인이 고른 표현으로 답장을 마칠 때까지 기다렸다.':choice==='boundary'?'서연은 가능한 시간만 담은 문장을 골라 보냈다. 누군가에게 잘 보이는 답보다 본인이 지킬 수 있는 답을 남겼다.':'태이가 실제로 나눠 맡을 수 있는 작은 일만 정했다. 서연은 대신 결정을 맡기지 않고 자기 일정부터 다시 적었다.',soyul:blunt?'소율이 직접 고를 시간을 남겼다. 사진보다 먼저 답을 정해 주지 않는 편이 낫겠다는 생각이 들었다.':choice==='meaning'?'느낀 점을 단정하지 않고 물어보자 소율이 자기 해석을 덧붙였다. 사진은 허락 없이 저장하거나 공유하지 않았다.':'사진을 당장 공개할 필요는 없다고 말했다. 소율은 파일을 지우지 않고 본인 폴더에 남겼다.',iseo:choice==='names'?'운동 이야기를 마치며 서로 이름을 나눴다. 정이서는 태권도과 2학년이라고 소개하고 다음에 보면 먼저 인사하겠다고 웃었다.':choice==='pace'?'기록을 겨루지 않고 가볍게 몸을 풀었다. 이서는 중간중간 말을 걸다가도 오늘은 운동을 더하지 않겠다고 웃었다.':'운동은 마치고 공공 보행 공간을 잠깐 걸었다. 차가운 인상과 달리 이서는 생각나는 이야기를 끊임없이 꺼냈다.'};rec.result=endings[id];rec.last={player:option[1],text:id==='taei'?'오늘은 여기까지 해도 되겠다. 다음에 이어갈 게 남았으니까.':id==='iseo'&&choice==='names'?'저는 정이서예요. 태권도과 2학년이요. 다음에 보면 저 먼저 인사해도 되죠?':id==='iseo'?'저 말 너무 많이 했죠? 그래도 오늘은 운동 더 안 하고 쉬었잖아요. 그건 성공이에요.':blunt?'제가 어떻게 하고 싶은지도 같이 물어봐 주면 좋겠어요.':rec.context.close?'오늘 같이 있어서 좋았어요. 다음에는 제 얘기만 말고 태이 씨 얘기도 들어요.':'잠깐 같이 봐줘서 고마워요. 혼자 정리할 때랑은 좀 다르네요.'};rec.status='completed';rec.completedDay=s.day;rec.completedMinute=s.clock.minute;if(id!=='taei'){changeRelationship(s,id,'taei',blunt?{trust:1,tension:-1}:{familiarity:1,trust:2,affection:choice==='wait'||choice==='chat'?1:0});if(id!=='iseo')noteNpcExperience(s,id,'personal-event',{warmth:3,stress:-3},'personal-event');}const title=personalEventDefs[id].title;s.memory.push(`[${s.day}일차] ${id==='taei'?'김태이':displayName(s,id)} · ${title}: ${rec.result}`);s.known.push(...(s.known.includes(title+' 기록')?[]:[title+' 기록']));s.lastResult=rec.result;}
 s.pace={count:0,seen:{}};return s;}
export function pausePersonalEvent(state){const s=structuredClone(state),r=personalEventRecord(s);if(r?.status==='active')r.status='paused';if(s.personalEvents)s.personalEvents.active=null;return s;}
function firstPersonalEventGreeting(s,id){const r=s.personalEvents?.records?.[id];if(!r||r.status!=='completed'||s.day<=r.completedDay||r.lastRecallDay===s.day)return '';const texts={yeogyeong:r.choices[0]==='pay'?'지난번엔 기록부터 같이 보고 싶었던 거예요. 말이 조금 딱딱했죠.':'지난번에 같이 확인했던 방식으로 표시해 봤어요. 누가 어디까지 봤는지 남기니까 덜 헷갈리네요.',seoyeon:r.choices[0]==='decide'?'지난번에 제 방식으로 말해 보고 싶다고 했잖아요. 조금 어색했지만 직접 답장했어요.':'지난번에 적었던, 가능한 시간까지만 말하는 답장 있잖아요. 어색해도 한번 써봤어요.',soyul:r.choices[0]==='choose'?'그 사진은 제가 조금 더 골라보고 있어요. 아직 지우지는 않았어요.':'그때 보여드린 사진은 아직 제 폴더에 있어요. 급하게 공개하지 않아도 된다는 말이 좀 남아서요.'};if(!texts[id])return '';r.lastRecallDay=s.day;return ` ${displayName(s,id)}이 지난번 이야기를 짧게 꺼낸다. “${texts[id]}”`;}

// Legacy first-event records keep their person key. Later chapters have independent IDs.
export function personalEventDefinition(id){return dogyeomStories[id]??personalFollowups[id]??personalEventDefs[id]??null;}
function followupAvailable(s,id,d,place){
 const r=s.personalEvents?.records?.[id],prior=s.personalEvents?.records?.[d.previous];
 if(r?.status==='completed'||prior?.status!=='completed'||s.day<=(prior.completedDay??prior.day??s.day)||!d.places.includes(place)||s.clock.minute<720||!enoughTime(s,d.person,r?.stage?20:30))return false;
 if(d.person==='taei')return s.clock.minute>=780;
 if(d.person==='iseo')return (personalEventPosition(s,'iseo')??iseoEventLocation(s))===place;
 return contact(s,d.person).introduced&&s.clock.minute<1080&&(personalEventPosition(s,d.person)===place||presentPeople({...s,location:place},place).includes(d.person))&&!npcNow(s,d.person).rushed;
}
export function personalEventsAt(s,place=s.location){if(s.academics?.registrationPending||s.freeDay?.home)return [];return [...dogyeomEventsAt(s,place),...firstPersonalEventsAt(s,place),...Object.entries(personalFollowups).filter(([id,d])=>followupAvailable(s,id,d,place)).map(([eventId,d])=>({eventId,person:d.person,title:d.person==='iseo'&&!contact(s,'iseo').introduced?'다시 마주친 운동복 학생':d.title,resuming:s.personalEvents?.records?.[eventId]?.status==='paused'}))];}
export function beginPersonalEvent(state,eventId){
 if(dogyeomStories[eventId])return beginDogyeomEvent(state,eventId);
 const d=personalFollowups[eventId];if(!d)return beginFirstPersonalEvent(state,eventId);
 if(!personalEventsAt(state).some(e=>e.eventId===eventId))throw new Error('아직 이 이야기를 이어갈 조건이 되지 않았습니다.');
 const s=structuredClone(state);s.personalEvents??={active:null,records:{}};const store=s.personalEvents,previous=store.records[store.active];if(previous?.status==='active'&&store.active!==eventId)previous.status='paused';const old=store.records[eventId],prior=store.records[d.previous];
 let roll=old?.context?.roll;if(roll===undefined){store.rng=((store.rng??482193)*1664525+1013904223)>>>0;roll=store.rng%3;}
 const mood=d.person==='taei'?'steady':d.person==='iseo'?'bright':npcNow(s,d.person).mood;
 store.records[eventId]={...old,eventId,person:d.person,episode:d.episode,status:'active',stage:old?.stage??0,choices:old?.choices??[],day:s.day,location:s.location,until:s.clock.minute+(old?.stage?20:30),context:{mood,close:relationship(s,d.person).familiarity>=6,trusted:relationship(s,d.person).trust>=4,roll,previousChoices:[...(prior.choices??[])],priorIntrusive:(prior.choices??[]).some(c=>['pay','decide','choose','refuse','assume','fix'].includes(c))}};store.active=eventId;if(d.person==='iseo')seePeople(s,['iseo']);return s;
}
function followupOpening(d,r){
 const repair={yeogyeong:'지난번엔 돈으로 맞추자는 말보다, 같이 확인하고 싶었던 거예요. 오늘은 다른 얘기 해봐요.',seoyeon:'지난번처럼 제가 원하는 걸 먼저 말해볼게요. 태이 씨도 짐작만 하지 말고 물어봐 줘요.',soyul:'이번에는 먼저 끝까지 봐주셨으면 해요. 고칠 곳은 그다음에 물어볼게요.'};
 return [r.context.priorIntrusive?repair[d.person]??'':r.context.close?({yeogyeong:'태이 씨도 잠깐 앉아 있어요. 오늘은 제가 먼저 말 걸었네요.',seoyeon:'아, 태이 씨. 마침 잠깐 쉬려던 참이었어요.',soyul:'저기… 잠깐만요. 지난번 보고 나서 한번 더 물어보고 싶었어요.',iseo:'아, 또 봤네요! 오늘도 그냥 지나가면 좀 아쉬웠을 것 같은데.'}[d.person]??''):'',d.opening].filter(Boolean).join(' ');
}
export function personalEventView(s){
 if(dogyeomStories[s.personalEvents?.active])return dogyeomEventView(s);
 const r=personalEventRecord(s),d=personalFollowups[r?.eventId];if(!d)return firstPersonalEventView(s);
 let options=r.stage?d.second:d.options;options=options.map(o=>o.slice(0,2));
 if(r.person==='iseo'&&!contact(s,'iseo').introduced)options=r.stage?[...options,['names','마무리하기 전에 서로 이름을 묻는다.']]:[...options.slice(0,2),['introduce','장난을 이어가기 전에 서로 이름부터 묻는다.']];
 return {...d,...r,title:r.person==='iseo'&&!contact(s,'iseo').introduced?'다시 마주친 운동복 학생':d.title,opening:followupOpening(d,r),options:r.status==='completed'?[]:options};
}
function followupIntroduceIseo(s){introduce(s,'iseo','personal-event');s.contacts.iseo.details={major:'태권도과',year:2};s.contacts.iseo.lastSeen={day:s.day,minute:s.clock.minute,location:s.location};}
export function progressPersonalEvent(state,choice){
 if(dogyeomStories[state.personalEvents?.active])return progressDogyeomEvent(state,choice);
 const r=personalEventRecord(state),d=personalFollowups[r?.eventId];if(!d)return progressFirstPersonalEvent(state,choice);
 const view=personalEventView(state),option=view.options.find(o=>o[0]===choice),minutes=r.stage?20:10;
 if(r.status!=='active'||r.day!==state.day||r.location!==state.location||!option||state.clock.minute+minutes>r.until||!enoughTime(state,r.person,minutes))throw new Error('현재 장소·시간·선택을 다시 확인해 주세요.');
 const s=advanceFreeTime(state,minutes),rec=s.personalEvents.records[r.eventId],id=r.person;rec.choices.push(choice);
 if((choice==='introduce'||choice==='names')&&id==='iseo')followupIntroduceIseo(s);
 if(!r.stage){
  const game=followupGameOutcome(d,choice,r.context.roll);if(game)rec.game=game;
  let response=choice==='introduce'&&id==='iseo'?'그러고 보니 인사도 제대로 못 했네요. 저는 정이서예요. 태권도과 2학년이요.':d.options.find(o=>o[0]===choice)?.[2]??'';
  if(d.game==='rps'&&game)response=game.result==='tie'?'똑같은 걸 냈네요. 이러면 정리도 같이 하는 거죠?':game.result==='win'?'졌네요. 알겠어요. 다음에는 안 봐줄 거예요.':'저 이런 건 꽤 진지하게 해요. 테이블은 같이 치워도 되고요.';
  const limited=['drained','overwhelmed'].includes(r.context.mood)&&id!=='taei';
  rec.last={player:option[1],narration:game?.text.replace(/“[^”]*”/g,'').trim()??'',text:[response,limited?'오늘은 무리하지 않고 정한 시간까지만 같이 해요.':''].filter(Boolean).join(' ')};rec.stage=1;
  if(id!=='taei')changeRelationship(s,id,'taei',['refuse','assume','fix'].includes(choice)?{familiarity:1,tension:1}:{familiarity:1,trust:1});
 }else{
  const finish=d.second.find(o=>o[0]===choice),blunt=rec.choices.some(c=>['refuse','assume','fix'].includes(c));
  let closing=finish?.[2]??'저는 정이서예요. 다음에 보면 먼저 인사해도 되죠?',outcome=finish?.[3]??'마무리하며 서로 이름을 나누고 다음에 알아보기로 했다.';
  if(d.game==='balance'&&choice==='laugh'){closing=!rec.game?'오늘은 인사부터 했으니까 승부는 다음에 해요. 몸 풀고 같이 웃었으면 됐죠.':rec.game?.result==='iseo'?'오늘은 제가 이겼네요. 그래도 다음에 또 겨루려면 몸부터 잘 풀고 오기예요.':rec.game?.result==='both'?'둘 다 흔들렸으니까 오늘은 동점인 걸로 해요. 저만 그렇게 생각하는 거 아니죠?':closing;}
  if(blunt)outcome='처음 너무 앞서 단정했던 부분을 돌아보고, 상대가 원하는 방식부터 확인했다. '+outcome;
  rec.last={player:option[1],text:closing};const gameSummary=d.game==='rps'&&rec.game?({win:'가위바위보에서 태이가 이겼다. ',lose:'가위바위보에서 서연이 이겼다. ',tie:'가위바위보는 비겼다. '}[rec.game.result]??''):d.game==='balance'&&rec.game?({taei:'균형 놀이에서 태이가 조금 더 오래 버텼다. ',iseo:'균형 놀이에서 이서가 조금 더 오래 버텼다. ',both:'둘이 거의 동시에 균형을 풀었다. '}[rec.game.result]??''):'';rec.result=gameSummary+outcome;rec.status='completed';rec.completedDay=s.day;rec.completedMinute=s.clock.minute;
  if(id!=='taei'){changeRelationship(s,id,'taei',blunt?{trust:1,tension:-1}:{familiarity:1,trust:2,affection:r.context.close&&['play','quiet','thanks','exchange'].includes(choice)?1:0});if(id!=='iseo')noteNpcExperience(s,id,'personal-followup',{warmth:3,stress:-2},r.eventId);}
  s.memory.push(`[${s.day}일차] ${id==='taei'?'김태이':displayName(s,id)} · ${d.title}: ${rec.result}`);if(!s.known.includes(d.title+' 기록'))s.known.push(d.title+' 기록');s.lastResult=rec.result;
 }
 s.pace={count:0,seen:{}};return s;
}
export function personalEventGreeting(s,id){const latest=Object.values(s.personalEvents?.records??{}).filter(r=>r.person===id&&r.status==='completed').sort((a,b)=>(b.episode??1)-(a.episode??1))[0];const d=personalFollowups[latest?.eventId];if(!d)return firstPersonalEventGreeting(s,id);if(s.day<=latest.completedDay||latest.lastRecallDay===s.day)return '';latest.lastRecallDay=s.day;const callback=latest.eventId==='yeogyeong:2'&&!latest.choices.includes('play')?'그날 아무 일 얘기 안 하고 쉬었던 거, 생각보다 좋았어요.':latest.eventId==='seoyeon:2'&&!latest.choices.includes('rematch')?'저 작은 승부에도 진지한 거, 지난번에 보셨죠? 괜히 얌전하게만 보시면 안 돼요.':d.callback;return ` ${displayName(s,id)}이 지난번 이야기를 짧게 꺼낸다. “${callback}”`;}
