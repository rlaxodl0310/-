import {observeSituation,finishSituation} from './event-engine.js';
import {eventKey} from './event-view.js';
import {presentPeople} from './days.js';
import {contact,introduce,seePeople} from './identity.js';
import {socialIntent} from './social-reasoning.js';
import {dialogue,openConversation,respond} from './dialogue.js';

export const placeActions={
 hall:[{id:'noticeboard',label:'게시판 쪽으로 걸어간다'},{id:'tables',label:'공용 테이블 쪽으로 돌아간다'},{id:'window',label:'창가 쪽 빈자리를 찾아본다'},{id:'lounge',label:'휴게공간을 지나간다'}],
 library:[{id:'shelves',label:'반납대와 자료실을 둘러본다'}],
 cafe:[{id:'counter',label:'주문대 쪽으로 간다'}]
};
export function encounterKey(s,spot='entry'){return `${s.day}:${s.phase}:${s.location}:${spot}`;}
function encounterContent(s,id){
 const day=s.day,evening=s.phase==='evening';
 if(evening)return {
  yeogyeong:{text:'학생회관을 나가려는데 공용 테이블 아래에서 무언가 떨어지는 소리가 난다. 차여경이 가방에서 물병을 꺼내다 작은 필통을 떨어뜨렸다. 혼자 물건을 주워 담느라 발소리를 듣지 못한 듯하다.',action:'필통을 주워 건넨다. “가방에 뭘 그렇게 많이 넣었어요?”',prefix:'아, 감사합니다. '},
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
export function arrive(state,location,spot='entry'){
 const s=structuredClone(state);s.location=location;s.encounters??={};
 const present=presentPeople(s,location);seePeople(s,present);
 const key=encounterKey(s,spot);
 if(s.encounters[key]?.resolved)return {state:s,encounter:null};
 let person=null,group=false;
 if(location==='hall'&&spot==='lounge')group=present.includes('seoyeon')&&present.includes('soyul');
 else if(location==='hall')person=spot==='noticeboard'?'seoyeon':spot==='window'?'soyul':'yeogyeong';
 else if(location==='library'&&spot==='entry')person='soyul';
 else if(location==='cafe'&&spot==='entry')person='seoyeon';
 if(person&&!present.includes(person))person=null;
 // Someone already spoken to keeps doing their own work; don't respawn a waiting dialogue target.
 const session=person?s.dialogue?.sessions?.[`${s.day}:${s.phase}:${person}`]:null;
 const resuming=!!session&&!session.closed;
 if(person&&!resuming&&Object.values(s.encounters).some(e=>e.day===s.day&&e.phase===s.phase&&e.person===person&&['engaged','passed'].includes(e.outcome)))person=null;
 if(!person&&!group){s.encounters[key]={day:s.day,phase:s.phase,resolved:true,outcome:'quiet'};return {state:s,encounter:null};}
 const content=group?{text:'휴게공간을 지나는데 낮은 웃음소리가 들린다. 한서연과 박소율이 같은 휴대폰을 들여다보고 있다. 두 사람은 이쪽을 보지 못한 채 사진 이야기를 이어간다.',action:'걸음을 늦추고 잠깐 이야기를 듣는다.',prefix:''}:encounterContent(s,person);
 const encounter={key,day:s.day,phase:s.phase,person,group,...content};
 const request=s.events.find(e=>e.id==='caption-request');
 if(person==='soyul'&&s.day===3&&s.location==='library'&&request&&s.eventState?.knowledge?.[eventKey(request)]){
  encounter.condition='caption-request';encounter.text='자료실 앞에서 막 출력된 종이를 맞춰 쥔 박소율과 마주친다. 어젯밤 메시지에서 말했던 사진 설명이 맨 위에 보인다. 소율은 복사기 앞을 비켜서며 종이를 다시 살핀다.';
  encounter.action='인쇄물을 건네며 묻는다. “어제 이야기한 문구, 이거예요?”';encounter.prefix='네, 어제 보낸 그거예요. ';
 }
 if(resuming){encounter.text=`${content.text} 아까 나누던 이야기가 잠깐 떠오른다.`;encounter.action='아까 멈춘 이야기의 뒷부분을 조심스럽게 꺼낸다.';encounter.prefix='';}
 s.encounters[key]??={day:s.day,phase:s.phase,person,group,resolved:false};
 observeSituation(s,encounter);return {state:s,encounter};
}
export function resolveEncounter(state,encounter,engage){
 const s=structuredClone(state),record=s.encounters?.[encounter?.key];
 if(!record||record.resolved||encounter.day!==s.day||encounter.phase!==s.phase)throw new Error('이미 지나간 장면입니다.');
 const present=presentPeople(s,s.location);
 if(encounter.group?!(present.includes('seoyeon')&&present.includes('soyul')):!present.includes(encounter.person))throw new Error('지금 그 장소에서 일어나는 장면이 아닙니다.');
 record.resolved=true;record.outcome=engage?'engaged':'passed';finishSituation(s,encounter,engage);
 if(!engage||encounter.group)return {state:s,result:null,group:engage&&encounter.group};
 introduce(s,encounter.person,'incidental-exchange');
 // The interaction comes from the encountered action, not a character-selection menu.
 const opened=openConversation(s,encounter.person);
 const next=dialogue(opened.state,encounter.person);
 const response=opened.result?opened:next.scene?{state:opened.state,result:{text:next.opening,stage:next.stage}}:next.options.some(o=>o.id==='personal')?respond(opened.state,encounter.person,'personal'):{state:opened.state,result:{text:next.opening,stage:next.stage}};
 response.result={...response.result,playerLine:encounter.action,text:(socialIntent(s,encounter.person).mode==='guarded'?'':encounter.prefix??'')+response.result.text};
 return response;
}
