import {characterPresent} from './character-stats.js';
import {contact,displayName,seePeople,introduce} from './identity.js';
import {relationship,changeRelationship} from './dialogue.js';
import {advanceFreeTime} from './free-roam.js';
import {personalEventPosition} from './personal-event-presence.js';
export const fairStudents={
 jihoo:{name:'서지후',description:'회색 후드집업을 입은 교복 학생',route:['headquarters','cafe','creative','arts','headquarters'],intro:'충전대 앞에서 교복 위에 후드집업을 입은 학생이 케이블을 뒤집어 꽂아 본다.',opening:'이거 방향이 문제가 아닌 것 같은데요. 휴대폰이 오늘 저보다 의욕이 없네.',title:'짧은 충전선',action:'충전 표시와 연결 상태를 함께 확인한다.',reply:'아, 여기 꽂는 거였네요. 하하. 제가 못 찾았다는 건 비밀로 해줘요.',follow:'모른다고 말하는 연습',followOpening:'아까 설명 들었는데 반은 못 알아들었어요. 다들 아는 얼굴이라 저도 그냥 끄덕였고요.',followAction:'어떤 부분부터 모르겠는지 부담 없이 말하게 기다린다.',followReply:'코딩도 제대로 해본 적 없어요. 게임 좋아하는 거랑은 다르겠죠? 그거부터 물어봐야겠네.'},
 naeun:{name:'이나은',description:'둥근 안경을 쓴 교복 학생',route:['headquarters','creative','cafeteria','library','headquarters'],intro:'교복 재킷을 입은 학생이 안내문 두 장의 같은 항목에 서로 다른 표시를 해놓고 바라본다.',opening:'여기에는 통학도 가능하다고 되어 있는데, 설명할 때는 기숙사를 권해서요. 비용부터 다시 물어봐야 하나.',title:'안내문 사이의 빈칸',action:'서로 다른 조건을 표시하고 상담 부스에 물어볼 질문을 정리한다.',reply:'조건이 다른 거였네요. 제가 직접 물어볼게요. 대신 답을 정해주지 않아서 오히려 덜 복잡해졌어요.',follow:'내가 고를 기준',followOpening:'좋다는 학과는 많은데 제가 감당할 수 있는지는 별개네요. 집에 가면 또 고민할 것 같아요.',followAction:'비용·통학·배우는 내용 중 본인이 중요하게 보는 순서를 묻는다.',followReply:'저는 통학 시간이요. 남는 시간도 제 생활이니까요. 이거부터 적어놓을래요.'},
 dohyun:{name:'권도현',description:'소매를 접은 교복 학생',route:['cafeteria','headquarters','arts','field','headquarters'],intro:'식당 앞에서 키 큰 교복 학생이 손에서 기울어진 빈 식판을 급히 바로잡는다.',opening:'잠깐 이것만 받아주실 수 있어요? 안 떨어뜨렸는데 왜 벌써 사고 친 기분이지.',title:'기울어진 식판',action:'식판을 잠깐 받아 가까운 테이블에 내려놓는다.',reply:'감사합니다. 하하, 손이 두 개라는 걸 자꾸 잊나 봐요. 다음부터는 한 번에 안 들려고요.',follow:'다 들어줄 수는 없어서',followOpening:'친구한테 부스도 같이 가준다 하고 선생님한테 정리도 돕는다 했거든요. 시간이 겹쳤네요.',followAction:'이미 한 약속을 확인하고 직접 조정할 시간을 준다.',followReply:'한쪽에 못 간다고 말해야겠죠. 괜찮다고만 하면 다 괜찮아지는 줄 알았는데.'},
 dayeon:{name:'강다연',description:'작은 카메라를 든 긴 머리 교복 학생',route:['arts','campus','creative','library','headquarters'],intro:'반묶음 머리의 교복 학생이 사람들이 지나갈 때마다 카메라를 조용히 내린다.',opening:'건물만 찍으려고 했는데 계속 사람이 들어와서요. 잠깐 기다리면 되겠죠.',title:'사진에 담지 않은 것',action:'통행을 막지 않는 촬영 위치를 함께 살핀다.',reply:'여기서는 얼굴이 안 들어오네요. 고마워요. 모르는 사람이 찍히는 건 저도 좀 불편해서요.',follow:'남길 사진 한 장',followOpening:'다 비슷한 사진 같아도 하나만 남기려니까 못 고르겠어요.',followAction:'본인이 다시 보고 싶은 사진을 고르도록 감상을 먼저 묻는다.',followReply:'잘 나온 것보다 그때 소리가 생각나는 사진이 있네요. 이걸 남길래요.'},
 chaerin:{name:'오채린',description:'낮게 머리를 묶은 카디건 교복 학생',route:['gym','arts','cafeteria','campus','headquarters'],intro:'접은 지도를 든 교복 학생이 방금 지나온 건물과 안내 화살표를 번갈아 본다.',opening:'분명 이쪽이었는데 한 바퀴 돈 것 같아요. 이 지도, 제가 거꾸로 들고 있나요?',title:'지도의 반대편',action:'현재 위치부터 찾고 가고 싶은 부스 방향을 확인한다.',reply:'아, 시작점이 여기네요. 하하. 일단 걷기부터 하면 찾을 줄 알았죠.',follow:'오늘 다 못 봐도',followOpening:'여기도 보고 저기도 가고 싶은데 집합 시간이 있네요. 하나 포기하라면 더 궁금해져요.',followAction:'지금 가장 궁금한 체험 하나를 직접 고르게 한다.',followReply:'오늘은 이거요. 친구들이 간 데 따라가면 또 제 건 못 볼 것 같아서요.'},
 junseo:{name:'신준서',description:'사각 안경과 조끼 차림의 교복 학생',route:['creative','headquarters','library','cafe','headquarters'],intro:'사각 안경을 쓴 교복 학생이 수첩에 적은 금액을 지웠다가 다시 계산한다.',opening:'등록금만 보면 안 되네요. 교통비랑 식비까지 넣으니까 생각했던 거랑 달라서요.',title:'적어놓지 않은 비용',action:'빠진 비용 항목을 함께 찾아 상담할 질문으로 묶는다.',reply:'같은 기간으로 비교해야 되는 거였네요. 이건 물어보고 적어야겠어요. 감사합니다.',follow:'남의 답안과 내 선택',followOpening:'친구가 다들 지원하는 데 쓰라는데요. 저는 통학 때문에 다른 데도 보고 싶거든요.',followAction:'친구와 달라도 본인 조건을 말할 수 있다고 답한다.',followReply:'반박하려니까 어려웠는데 제 사정부터 말하면 되겠네요. 정답처럼 설명할 필요는 없고요.'}
};
export function prepareFairVisit(s){s.fairVisit??={seed:s.campusVariation?.seed??417193};return s;}
export function fairVisitDay(s){return [4,9,10][(s.fairVisit?.seed??417193)%3];}
export function fairStudentLocation(s,id){
 if(!characterPresent(s,id)||!fairStudents[id]||s.day!==fairVisitDay(s)||(s.world?.stage??'campus')!=='campus'||s.clock.minute<600||s.clock.minute>=990)return null;
 const reserved=personalEventPosition(s,id);if(reserved)return reserved;
 const phase=Math.min(4,Math.floor((s.clock.minute-600)/90));
 return fairStudents[id].route[phase];
}
export const fairStories=Object.fromEntries(Object.entries(fairStudents).flatMap(([person,d])=>[1,2].map(episode=>[`${person}:fair:${episode}`,{person,episode,title:episode===1?d.title:d.follow}])));
function fairAvailableTime(s,minutes){return s.clock.minute+minutes<=990&&!(s.appointments??[]).some(a=>a.status==='pending'&&a.day===s.day&&a.minute>=s.clock.minute&&a.minute<s.clock.minute+minutes);}
export function fairEventsAt(s,place){
 if(s.academics?.registrationPending||s.freeDay?.home)return [];
 return Object.entries(fairStories).filter(([id,d])=>{const r=s.personalEvents?.records?.[id],prior=s.personalEvents?.records?.[`${d.person}:fair:1`];return r?.status!=='completed'&&fairStudentLocation(s,d.person)===place&&fairAvailableTime(s,r?.stage?20:30)&&(d.episode===1||prior?.status==='completed'&&s.clock.minute>=(prior.completedMinute??600)+20);}).map(([eventId,d])=>({eventId,person:d.person,title:contact(s,d.person).introduced?d.title:fairStudents[d.person].description,resuming:s.personalEvents?.records?.[eventId]?.status==='paused'}));
}
export function beginFairEvent(state,id){
 if(!fairEventsAt(state,state.location).some(e=>e.eventId===id))throw new Error('지금은 이곳에서 이어갈 수 없는 이야기입니다.');
 const s=structuredClone(state),d=fairStories[id];s.personalEvents??={records:{}};const store=s.personalEvents,old=store.records[id],prior=store.records[store.active];if(prior?.status==='active'&&store.active!==id)prior.status='paused';
 store.records[id]={...old,eventId:id,person:d.person,episode:d.episode,status:'active',stage:old?.stage??0,choices:old?.choices??[],day:s.day,location:s.location,until:Math.min(990,s.clock.minute+(old?.stage?20:30))};store.active=id;seePeople(s,[d.person]);return s;
}
const fairFollowIntros={jihoo:'교복 학생이 휴대폰을 가방에 넣다가 상담 부스 쪽을 다시 바라본다.',naeun:'안내문에 표시를 더하던 학생이 펜을 멈추고 생각에 잠긴다.',dohyun:'소매를 접은 학생이 단체 대화방과 시계를 번갈아 확인한다.',dayeon:'카메라 화면을 넘기던 학생이 비슷한 사진 두 장 앞에서 멈춘다.',chaerin:'지도를 접던 학생이 남은 관람 시간과 부스 방향을 다시 확인한다.',junseo:'수첩을 덮던 학생이 친구에게 온 메시지를 읽고 잠깐 머뭇거린다.'};
export function fairEventView(s){
 const r=s.personalEvents?.records?.[s.personalEvents?.active],d=fairStories[r?.eventId];if(!d)return null;const p=fairStudents[d.person],known=contact(s,d.person).introduced,rel=relationship(s,d.person),tense=rel.tension>=3;
 const options=r.stage?[...(known?[]:[['names','마무리하면서 서로 이름을 소개한다.']]),['leave','각자의 관람 일정으로 돌아간다.']]:[['help',r.episode===1?p.action:p.followAction],['listen','먼저 어떤 도움이 필요한지 물으며 이야기를 듣는다.'],['dismiss','대수롭지 않은 문제라며 서둘러 결론을 내린다.']];
 return {...d,...r,visitor:true,title:known?d.title:p.description,intro:r.episode===1?p.intro:fairFollowIntros[d.person],opening:tense?'아까 얘기는 조금 불편했어요. 이번에는 제가 먼저 해볼게요.':r.episode===1?p.opening:p.followOpening,options:r.status==='completed'?[]:options};
}
export function progressFairEvent(state,choice){
 const r=state.personalEvents?.records?.[state.personalEvents?.active],view=fairEventView(state),option=view?.options.find(o=>o[0]===choice),minutes=r?.stage?20:10;
 if(!option||r.status!=='active'||r.day!==state.day||r.location!==state.location||state.clock.minute+minutes>r.until||!fairAvailableTime(state,minutes)||fairStudentLocation(state,r.person)!==state.location)throw new Error('지금 가능한 장소와 선택을 다시 확인해 주세요.');
 const s=advanceFreeTime(state,minutes),rec=s.personalEvents.records[r.eventId],p=fairStudents[r.person],rel=relationship(s,r.person);rec.choices.push(choice);
 if(!r.stage){
  const guarded=rel.tension>=3||choice==='dismiss';rec.actionTone=guarded?'guarded':'calm';
  const text=guarded?'제 얘기를 끝까지 들어주셨으면 좋겠어요. 제가 직접 확인할게요.':choice==='listen'?(rel.familiarity>=4?'아까는 말이 좀 꼬였죠. 이번에는 제가 원하는 것부터 말해볼게요.':'답을 대신 정해달라는 건 아니에요. 잠깐 정리하면서 말해도 괜찮아요?'):r.episode===1?p.reply:p.followReply;
  rec.last={player:option[1],text,emotion:guarded?'serious':choice==='listen'?'neutral':'happy'};rec.stage=1;changeRelationship(s,r.person,'taei',choice==='dismiss'?{tension:3,trust:-1}:{familiarity:2,trust:1});
 }else{
  if(choice==='names'){introduce(s,r.person,'fair-conversation');s.contacts[r.person].details={school:'천안 해솔고등학교',grade:3};}
  const guarded=relationship(s,r.person).tension>=3;
  rec.last={player:option[1],text:choice==='names'?`저는 ${p.name}예요. 해솔고 3학년이고요. 오늘 박람회 보러 왔어요.`:guarded?'저는 이제 따로 둘러볼게요. 집합 시간은 지켜야 해서요.':'도움 고마워요. 저는 남은 부스 좀 보고 갈게요.',emotion:guarded?'serious':choice==='names'?'neutral':'warm'};
  rec.status='completed';rec.completedDay=s.day;rec.completedMinute=s.clock.minute;rec.result='짧은 교류를 마치고 각자 관람으로 돌아갔다. '+(guarded?'서로 거리를 두기로 했다.':'');s.memory.push(`[${s.day}일차] ${displayName(s,r.person)} · ${fairStories[r.eventId].title}: ${rec.result}`);s.lastResult=rec.result;
 }
 seePeople(s,[r.person]);s.pace={count:0,seen:{}};return s;
}
