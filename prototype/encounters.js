import {rainLunchOffer,beginRainLunch,passRainLunch} from './rain-lunch.js';
import {campusDetour} from './campus-variation.js';
import {canGenerateReencounter} from './dialogue-generator.js';
import {npcNow} from './npc-state.js';
import {followupCandidate} from './conversation-continuity.js';
import {campusBuildings} from './campus-buildings.js';
import {libraryGreeting} from './library-life.js';
import {beginWarningSite} from './warnings.js';
import {wetWeather,weatherAtmosphere} from './weather.js';
import {socialNews} from './social-memory.js';
import {meetAppointments} from './appointments.js';
import {observeSituation,finishSituation} from './event-engine.js';
import {eventKey} from './event-view.js';
import {presentPeople} from './days.js';
import {contact,introduce,seePeople} from './identity.js';
import {socialIntent} from './social-reasoning.js';
import {dialogue,openConversation,respond} from './dialogue.js';

export const placeActions={
 hall:[{id:'noticeboard',label:'게시판 쪽으로 걸어간다'},{id:'tables',label:'공용 테이블 쪽으로 돌아간다'},{id:'window',label:'창가 쪽 빈자리를 찾아본다'},{id:'lounge',label:'휴게공간을 지나간다'},{id:'sidegate',label:'뒤편 출입문 쪽으로 걸어간다',fromDay:3}],
 library:[{id:'shelves',label:'반납대와 자료실을 둘러본다'},{id:'entrance',label:'로비의 출입 안내를 살펴본다',fromDay:3}],
 cafe:[{id:'counter',label:'주문대 쪽으로 간다'},{id:'street',label:'창밖의 정류장 쪽을 살펴본다',fromDay:3}]
};
export function encounterKey(s,spot='entry'){return `${s.day}:${s.phase}:${s.location}:${spot}${s.clock?':'+Math.floor(s.clock.minute/60):''}${s.day===3&&s.risk?.revision?':risk'+s.risk.revision:''}`;}
function encounterContent(s,id){
 const day=s.day,evening=s.phase==='evening';
 if(evening)return {
  yeogyeong:{text:'자유관을 나가려는데 공용 테이블 아래에서 무언가 떨어지는 소리가 난다. 차여경이 가방에서 물병을 꺼내다 작은 필통을 떨어뜨렸다. 혼자 물건을 주워 담느라 발소리를 듣지 못한 듯하다.',action:'필통을 주워 건넨다. “가방에 뭘 그렇게 많이 넣었어요?”',prefix:'아, 감사합니다. '},
  seoyeon:{text:'출입문을 밀고 나가던 중, 안쪽에서 한서연이 다시 들어오는 모습이 보인다. 어깨에 가방까지 멨는데 무언가 놓고 온 모양이다.',action:'문을 잡아준다. “뭐 놓고 왔어요?”',prefix:'충전기요. '},
  soyul:{text:'복도 끝을 돌아 나오다가 박소율과 마주친다. 출입문 앞에서 휴대폰을 보고 있던 소율이 뒤늦게 몸을 옆으로 비킨다.',action:'발걸음을 늦춘다. “아직 사진 보고 있어요?”',prefix:''}
 }[id];
 if(id==='yeogyeong')return {
  1:{text:'동아리방 쪽으로 가던 중 문틈으로 들어온 바람에 영수증 한 장이 발치로 날아온다. 공용 테이블에 앉아 있던 차여경은 수첩과 계산기를 번갈아 보느라 아직 눈치채지 못했다.',action:'영수증을 건네며 계산기를 가리킨다. “두 개씩 써요?”',prefix:'아, 영수증! 고마워요. '},
  2:{text:'프린터에서 자료를 챙기려는데 앞에 놓인 종이에 비슷한 제목 세 개가 적혀 있다. 차여경이 출력물을 걷어내려다 태이를 보고 종이를 조금 비켜준다.',action:'종이를 비켜주며 묻는다. “제목 정하는 중이에요?”',prefix:''},
  3:{text:'게시물을 붙이는 소리를 따라 복도를 지나는데, 차여경의 손가락에 테이프가 엉켜 있다. 여경은 벽에 붙인 사진이 떨어지지 않게 한 손으로 누르느라 다른 손을 빼지 못한다.',action:'걸음을 멈춘다. “잠깐, 움직이면 더 붙겠는데.”',prefix:''}
 }[day];
 if(id==='seoyeon')return {
  1:{text:'게시판 옆을 지나가는데 창가에 기대 있던 한서연이 문이 닫히지 않게 발로 버티고 있다. 한 손에는 종이컵, 다른 손에는 활동 자료가 들려 있다.',action:'문을 잡아주며 컵을 본다. “그거 맛있어요?”',prefix:'아, 고마워요. '},
  2:{text:'커피를 받아 빈자리를 찾다가 창가에서 책을 펼쳐놓은 한서연을 발견한다. 서연은 창밖을 보다가 사람이 다가오는 기척에 가방을 자기 쪽으로 당긴다.',action:'맞은편 의자를 가리킨다. “여기 앉아도 돼요?”',prefix:'네, 비었어요. '},
  3:{text:'복도 갈림길에서 안내문을 확인하는데 한서연이 같은 종이를 들고 반대편 문과 번갈아 보고 있다. 태이가 종이를 읽자 서연도 고개를 든다.',action:'안내문을 가리킨다. “여기로 들어가면 돼요?”',prefix:''}
 }[day];
 return {
  1:{text:'창가 쪽 빈자리를 찾다가 옆자리의 박소율과 눈이 마주친다. 소율은 휴대폰에서 비슷한 사진 두 장을 번갈아 보다가 화면을 조금 내린다.',action:'옆자리에 가방을 놓으며 묻는다. “사진 고르는 중이에요?”',prefix:''},
  2:{text:'도서관 반납대에서 돌아서는데 펜 하나가 발치까지 굴러온다. 창가에서 휴대폰 메모를 들여다보던 박소율이 펜을 찾으며 주변을 살핀다.',action:'펜을 건네며 묻는다. “뭐 쓰고 있어요?”',prefix:'아, 감사합니다. '},
  3:{text:'자료실 앞을 지나다가 막 인쇄된 종이 한 장이 바닥으로 미끄러지는 걸 본다. 박소율이 출력물을 맞춰 쥐느라 떨어진 종이를 바로 줍지 못한다.',action:'인쇄물을 주워준다. “이게 오늘 붙일 거예요?”',prefix:'감사해요. '}
 }[day];
}
const surroundings={
 hall:{entry:['공용 테이블에는 물품 상자가 쌓여 있고, 벽에는 봉사단 활동 안내가 붙어 있다. 안쪽을 더 둘러볼 수 있을 것 같다.','자유관 공용 테이블'],noticeboard:['게시판에서 이번 주 활동 안내를 읽었다. 모임 장소는 자유관 안쪽 준비실로 표시되어 있다.','봉사 준비실 안내'],tables:['테이블 옆을 살펴보니 물품 상자와 문구류가 구분되어 있다. 지금은 함부로 가져가지 않고 보관 위치만 기억해 둔다.','자유관 문구류 보관 위치'],window:['창가의 빈자리에 잠깐 앉았다. 유리 너머로 자유관 앞 광장과 창조관이 보인다.','자유관 창가에서 보이는 광장'],lounge:['휴게공간을 지나며 콘센트가 있는 좌석과 정수기 위치를 확인했다. 잠시 쉬었다 가는 학생들이 보인다.','자유관 정수기 위치']},
 library:{entry:['창조관 안 도서관에 들어서자 반납기 작동음이 들린다. 입구 안내판에는 자료실과 출력 공간이 표시되어 있다. 반납대 쪽으로 더 들어가 볼 수 있다.','도서관 층별 안내'],shelves:['반납대를 지나 자료실을 살폈다. 복사기 옆에 공용 프린터가 있고, 벽의 안내도에서 계단 위치를 확인했다. 주변 사람들은 각자의 자료에 집중하고 있다.','도서관 공용 프린터 위치']},
 cafe:{entry:['카페 문을 열자 커피 향과 잔 부딪히는 소리가 섞여 들어온다. 주문대에는 짧은 줄이 있고 창가 몇 자리는 비어 있다.','대학가 카페 위치'],counter:['주문대 옆 메뉴판을 살펴보고 줄에서 비켜섰다. 창가 좌석 옆에는 충전용 콘센트가 있다. 주문을 마친 사람들이 각자의 자리로 돌아간다.','카페 충전 좌석 위치']}
};
function observePlace(s,location,spot,repeated=false){
 if(campusBuildings[location]&&location!=='hall'){const b=campusBuildings[location];if(!s.known.includes(b.fact)){s.known.push(b.fact);s.memory.push(`[${s.day}일차] ${b.entry}`);}return b.entry;}
 const [text,information]=surroundings[location]?.[spot]??surroundings[location]?.entry??['주변을 둘러봤다.',null];
 if(information&&!s.known.includes(information)){s.known.push(information);s.memory.push(`[${s.day}일차] ${text}`);}
 return repeated?`다시 주변을 확인했다. ${text}`:text;
}
export function arrive(state,location,spot='entry'){
 const s=structuredClone(state);s.location=location;s.encounters??={};
 const warning=beginWarningSite(s,location,spot);if(warning)return {state:warning.state,encounter:null,warning:warning.scene,observation:warning.observation};
 const present=presentPeople(s,location);seePeople(s,present);
 const lunch=rainLunchOffer(s,location,spot);if(lunch){s.encounters[lunch.key]??={day:s.day,phase:s.phase,location,person:lunch.person,resolved:false};observeSituation(s,lunch);return {state:s,encounter:lunch};}
 const key=encounterKey(s,spot);
 if(s.encounters[key]?.resolved&&!followupCandidate(s,s.encounters[key].person)&&!canGenerateReencounter(s,s.encounters[key].person))return {state:s,encounter:null,observation:observePlace(s,location,spot,true)};
 let person=null,group=false;
 if(location==='hall'&&spot==='lounge')group=present.includes('seoyeon')&&present.includes('soyul');
 else if(location==='hall')person=spot==='noticeboard'?'seoyeon':spot==='window'?'soyul':'yeogyeong';
 else if(location==='library'&&['entry','shelves'].includes(spot))person=spot==='shelves'&&present.includes('yeogyeong')?'yeogyeong':'soyul';
 else if(location==='cafe'&&['entry','counter'].includes(spot))person='seoyeon';
 if(!person&&!group&&campusBuildings[location])person=present.find(id=>npcNow(s,id).rushed||campusDetour(s,id)?.location===location)??null;
 if(!person&&!group&&s.campusVariation&&s.academics?.enabled&&present.length)person=present[0];
 if(person&&!present.includes(person))person=null;
 // Someone already spoken to keeps doing their own work; don't respawn a waiting dialogue target.
 const session=person?s.dialogue?.sessions?.[`${s.day}:${s.phase}:${person}`]:null;
 const resuming=!!session&&!session.closed;
 const regrouped=person==='soyul'&&s.location==='hall'&&s.risk?.positions?.soyul==='hall'&&!Object.values(s.encounters).some(e=>e.day===s.day&&e.phase===s.phase&&e.person==='soyul'&&e.location==='hall');
 const continuation=person?followupCandidate(s,person):null;
 if(person&&!resuming&&!regrouped&&!continuation&&!canGenerateReencounter(s,person)&&Object.values(s.encounters).some(e=>e.day===s.day&&e.phase===s.phase&&e.person===person&&['engaged','passed'].includes(e.outcome)))person=null;
 if(!person&&!group){s.encounters[key]={day:s.day,phase:s.phase,resolved:true,outcome:'quiet'};return {state:s,encounter:null,observation:observePlace(s,location,spot)};}
 const content=group?{text:'휴게공간을 지나는데 낮은 웃음소리가 들린다. 한서연과 박소율이 같은 휴대폰을 들여다보고 있다. 두 사람은 이쪽을 보지 못한 채 사진 이야기를 이어간다.',action:'걸음을 늦추고 잠깐 이야기를 듣는다.',prefix:''}:encounterContent(s,person);
 const encounter={key,day:s.day,phase:s.phase,person,group,...content};
 if(person&&campusDetour(s,person)&&!npcNow(s,person).rushed){encounter.text={break:'창가 쪽에 앉아 쉬던 학생이 발소리를 듣고 고개를 든다. 손에 들고 있던 휴대폰은 화면이 꺼져 있다.',errand:'출입문 안쪽에서 가방을 고쳐 메던 학생과 시선이 마주친다. 막 다른 곳으로 움직이려던 모양이다.','own-work':'한쪽에 펼쳐놓은 메모를 정리하던 학생이 고개를 든다. 다음 장으로 넘기던 손이 잠깐 멈춘다.'}[campusDetour(s,person).reason];encounter.action='하던 일을 방해하지 않게 인사한다. “지금 잠깐 이야기해도 괜찮아요?”';encounter.prefix='';}
 if(person&&npcNow(s,person).rushed){encounter.text='강의실 쪽으로 사람들이 들어가는 사이, 가방을 고쳐 멘 학생과 눈이 마주친다. 휴대폰 시간을 확인하고 다시 출입문을 보는 모습이다.';encounter.action='길을 막지 않게 옆으로 비켜서며 인사한다. “곧 수업이에요?”';encounter.prefix='';}
 if(wetWeather(s))encounter.text=weatherAtmosphere(s,s.location)+' '+encounter.text;
 if(s.day===1&&s.location==='cafe'&&person==='seoyeon')Object.assign(encounter,{text:'커피를 받아 자리를 찾는데 창가에서 책을 펼친 한서연이 보인다. 서연은 컵을 내려놓고 맞은편 의자의 가방을 당긴다.',action:'맞은편 의자를 가리킨다. “잠깐 앉아도 돼요?”',prefix:'네, 비었어요. '});
 if(s.day===1&&s.location==='library'&&person==='yeogyeong')Object.assign(encounter,{text:'자료실 앞에서 출력물을 세던 차여경이 종이를 떨어뜨린다. 여경은 다른 손에 든 계산기를 내려놓고 허리를 숙인다.',action:'종이를 주워 건넨다. “여기서도 계산 중이에요?”',prefix:'아, 고마워요. '});
 const request=s.events.find(e=>e.id==='caption-request');
 if(person==='soyul'&&s.day===3&&s.location==='library'&&request&&s.eventState?.knowledge?.[eventKey(request)]){
  encounter.condition='caption-request';encounter.text='자료실 앞에서 막 출력된 종이를 맞춰 쥔 박소율과 마주친다. 어젯밤 메시지에서 말했던 사진 설명이 맨 위에 보인다. 소율은 복사기 앞을 비켜서며 종이를 다시 살핀다.';
  encounter.action='인쇄물을 건네며 묻는다. “어제 이야기한 문구, 이거예요?”';encounter.prefix='네, 어제 보낸 그거예요. ';
 }
 const meeting=s.appointments.find(a=>a.kind==='meeting'&&a.status==='pending'&&a.person===person&&a.day===s.day&&a.phase===s.phase&&a.location===s.location);
 if(meeting){encounter.text+=' 오늘 이곳에서 잠깐 이야기하기로 했던 약속이 떠오른다.';encounter.action='하던 일을 방해하지 않게 가까이 가 인사한다. “오늘 잠깐 보기로 했죠. 지금 괜찮아요?”';encounter.prefix='네, 잠깐 괜찮아요. ';}
 if(canGenerateReencounter(s,person)){encounter.text='조금 뒤 다시 같은 공간을 지나다 눈이 마주친다. 상대는 자기 일을 하다 잠깐 고개를 든다.';encounter.action='가볍게 인사한다. “지금은 잠깐 이야기해도 괜찮아요?”';encounter.prefix='';}
 if(continuation){encounter.text={yeogyeong:'공용 공간에서 차여경이 수첩을 덮고 가방을 정리하다 태이를 알아본다. 아까와 달리 계산기는 가방 안에 들어가 있다.',seoyeon:'한서연이 휴대폰 시계를 확인하다 태이를 보고 고개를 든다. 아까 마시던 컵은 치워져 있고, 이제 자기 가방을 챙기는 중이다.',soyul:'박소율이 메모를 쓰다 잠깐 손을 멈춘다. 아까 보던 화면 대신 자신이 고른 사진과 짧은 문장이 나란히 떠 있다.'}[person];encounter.action='눈이 마주쳐 인사한다. “아까 이야기한 뒤에는 좀 어땠어요?”';encounter.prefix='';}
 if(resuming){encounter.text=`${content.text} 아까 나누던 이야기가 잠깐 떠오른다.`;encounter.action='아까 멈춘 이야기의 뒷부분을 조심스럽게 꺼낸다.';encounter.prefix='';}
 if(regrouped){encounter.text='자유관 창가 쪽을 지나는데 박소율이 정리한 출력물을 가방에 넣고 있다. 도서관에서 하던 일을 마치고 이쪽으로 옮겨온 모양이다.';encounter.action='걸음을 늦춘다. “아까 하던 건 마무리했어요?”';encounter.prefix='네, 일단 정리했어요. ';}
 const sharedLunch=person?Object.values(s.rainLunch?.episodes??{}).findLast(r=>r.person===person&&r.status==='completed'&&r.walked):null;
 if(sharedLunch&&canGenerateReencounter(s,person)){
  encounter.text='복도를 지나가다 아까 같이 걸었던 사람과 다시 눈이 마주친다. 이번에는 서로 얼굴을 알아보고 가볍게 인사한다.';
  encounter.action=sharedLunch.ate?'걸음을 늦춘다. “아까 식당에서 헤어지고 나서는 좀 어땠어요?”':'인사한다. “아까 식당 쪽까지 같이 갔었죠. 일정은 괜찮았어요?”';encounter.prefix='';
 }
 if(location==='library'&&person)encounter.text+=libraryGreeting(s,person);
 if(person){const now=npcNow(s,person);if(now.mood!=='steady')encounter.text+=' '+now.cue;}
 if(s.encounters[key]?.resolved)s.encounters[key]=null;
 s.encounters[key]??={day:s.day,phase:s.phase,location:s.location,person,group,resolved:false};
 observeSituation(s,encounter);return {state:s,encounter};
}
export function resolveEncounter(state,encounter,engage){
 const s=structuredClone(state),record=s.encounters?.[encounter?.key];
 if(!record||record.resolved||encounter.day!==s.day||encounter.phase!==s.phase)throw new Error('이미 지나간 장면입니다.');
 const present=presentPeople(s,s.location);
 if(encounter.group?!(present.includes('seoyeon')&&present.includes('soyul')):!present.includes(encounter.person))throw new Error('지금 그 장소에서 일어나는 장면이 아닙니다.');
 record.resolved=true;record.outcome=engage?'engaged':'passed';finishSituation(s,encounter,engage);
 if(encounter.kind==='rain-lunch')return {state:engage?beginRainLunch(s,encounter.person):passRainLunch(s,encounter.person),result:null,rainLunch:engage};
 if(!engage||encounter.group)return {state:s,result:null,group:engage&&encounter.group};
 const firstExchange=!contact(s,encounter.person).introduced;
 introduce(s,encounter.person,'incidental-exchange');
 // The interaction comes from the encountered action, not a character-selection menu.
 const opened=openConversation(s,encounter.person,{encounter:encounter.action});
 const next=dialogue(opened.state,encounter.person);
 const response=opened.result?opened:next.scene?{state:opened.state,result:{text:next.opening,stage:next.stage}}:next.options.some(o=>o.id==='personal')?respond(opened.state,encounter.person,'personal'):{state:opened.state,result:{text:next.opening,stage:next.stage}};
 response.result={...response.result,requiredPrefix:firstExchange?`저는 ${s.npcs[encounter.person].name}이에요. `:'',playerLine:encounter.action+(firstExchange?' “아, 저는 김태이예요. 이번에 복학했어요.”':''),text:(firstExchange?`저는 ${s.npcs[encounter.person].name}이에요. `:'')+(socialIntent(s,encounter.person).mode==='guarded'?'':encounter.prefix??'')+response.result.text};
 response.state=meetAppointments(response.state,encounter.person);const heard=socialNews(response.state,encounter.person);response.state=heard.state;if(heard.news)response.result.socialNews=heard.news.text;return response;
}
