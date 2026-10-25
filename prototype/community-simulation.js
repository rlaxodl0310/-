import {weatherNow} from './weather.js';
// Anonymous background writers are simulated residents, not identities of the main cast.
export const communityWriters=[
 {id:'commuter',topics:['bus','weather'],hours:[7,22],cooldown:7},
 {id:'library-user',topics:['study','coffee'],hours:[9,23],cooldown:8},
 {id:'club-regular',topics:['clubs','sports'],hours:[11,22],cooldown:9},
 {id:'music-listener',topics:['music','exhibit'],hours:[12,23],cooldown:8},
 {id:'lunch-friend',topics:['food','coffee'],hours:[11,21],cooldown:6},
 {id:'late-assignment',topics:['study','food'],hours:[13,24],cooldown:10},
 {id:'careful-observer',topics:['notice','ambulance'],hours:[10,22],cooldown:12}
];
const topicWriting={
 bus:{titles:['정류장 줄 길어 보일 때 그냥 걸어가는 편임?','수업 끝나고 버스 기다리는 시간이 제일 애매함','통학하는 사람들 남는 시간 뭐 함'],bodies:['급한 날 아니면 한 대 보내고 앉아서 기다리는데 다들 어떻게 해요.','시간은 조금 남는데 뭘 시작하기는 애매해서 폰만 보게 됨.','학교 앞에서 잠깐 기다릴 때마다 괜히 시간표 다시 보게 된다.'],comments:['난 그냥 천천히 걸음','수업 끝나는 시간 따라 다른 듯','뭐 하려다 버스 오면 또 급해짐'],reply:['결국 오늘도 폰만 보고 있음 ㅋㅋ','다들 비슷하구나','다음에는 책이라도 챙겨야겠다']},
 study:{titles:['과제 시작하기 전 책상 정리만 한 시간째','도서관까지 왔는데 집중 안 되는 사람','제목 없는 파일이 왜 이렇게 많냐'],bodies:['할 일은 분명한데 첫 줄 쓰는 게 제일 어렵네.','이어폰까지 챙겼는데 파일 열었다 닫았다만 하고 있음.','작업을 안 한 건 아닌데 결과물이 없어서 억울하다.'],comments:['나도 지금 파일만 열어둠','일단 한 줄만 써봐','정리도 준비긴 하지'],reply:['그 한 줄이 제일 어렵다…','일단 저장은 했다','댓글 보고 다시 시작해봄']},
 coffee:{titles:['카페 자리 잡으면 오히려 딴짓하게 됨','단 거 시키고 후회하는 거 매번 반복함','쉬는 시간이 너무 짧을 때 커피 살까 말까'],bodies:['한 잔 시켜놓고 창밖 보는 시간이 더 긴 것 같다.','메뉴 이름만 보고 시키면 꼭 예상이랑 다름. 취향 찾기 어렵네.','잠깐 앉을 생각이었는데 나갈 시간부터 계산하고 있다.'],comments:['디저트는 또 별개임','메뉴 설명 끝까지 읽어야 함','잠깐 쉬는 것도 필요하지'],reply:['디저트 얘기는 왜 또 설득됨','오늘은 그냥 쉬기로 했다','다음에는 늘 먹던 걸로 간다']},
 food:{titles:['밥 먹고 나면 다음 할 일 까먹는 사람','혼자 밥 먹을 때 이어폰 끼는 편?','집에 가서 해먹을까 학교 근처에서 먹을까'],bodies:['배는 찼는데 다시 움직이기까지 준비가 오래 걸림.','오늘은 조용히 먹고 싶은데 손이 자꾸 폰으로 간다.','돈 아끼려고 나올 때는 도시락 생각했는데 돌아갈 때마다 고민함.'],comments:['해먹으면 설거지가 기다림','난 그냥 폰 안 보고 빨리 먹음','메뉴 고르는 게 더 오래 걸려'],reply:['설거지 생각하니까 또 고민되네','그래도 오늘은 집에서 먹어보려고','일단 메뉴부터 정해야겠다']},
 clubs:{titles:['동아리 가입 전 체험부터 가본 사람?','처음 가는 모임에 혼자 가는 거 은근 어렵네','모집글 읽기만 하다가 시간 다 감'],bodies:['어떤 분위기인지 보고 결정하고 싶은데 말 걸기가 어렵다.','활동해보고 정해도 된다는 글은 봤는데 실제로 가본 사람 궁금함.','시간표랑 같이 보니까 생각보다 겹치는 게 많네.'],comments:['모집글에 체험 가능하다고 적힌 곳부터 가봐','가입이랑 매번 참석하는 건 또 다름','나도 처음엔 혼자 갔음'],reply:['공개 체험부터 알아봐야겠다','시간 맞는 날 한 번 가보려고','괜히 오래 고민한 것 같기도 함']},
 music:{titles:['연습실 쪽 지나가다 잠깐 멈추게 됨','합주 소리는 멀리서 들을 때 또 다르네','공연 준비할 때 장비가 생각보다 많구나'],bodies:['누가 하는지는 모르겠는데 악기 소리 들리면 괜히 듣고 가게 된다.','보컬 소리보다 베이스가 먼저 들리는 날도 있음. 그냥 지나가다 잠깐 들었다.','공개 리허설 안내 보고 구경할까 고민 중. 준비하는 사람들 바쁘겠다.'],comments:['연습 방해는 하지 말고 밖에서 잠깐만','같이 맞는 순간이 좋지','나도 지나갈 때 가끔 듣는다'],reply:['조용히 듣고 지나왔음','다음에 공개 공연 있으면 가볼까','누군지는 나도 모름']},
 sports:{titles:['비 오면 운동 계획부터 다시 짜게 됨','공개 체험은 실력 없어도 괜찮을까','운동 끝나면 그날 할 일 다 한 기분임'],bodies:['축구 모집글에 우천 시 실내 대체한다고 적혀 있더라. 공지는 다시 확인하고 가야 할 듯.','시작할 때보다 가기 전이 제일 어렵다. 몸 풀고 나면 괜찮은데.','기본 체력부터 해보는 것도 나쁘진 않겠지. 혼자 생각만 하는 중.'],comments:['일단 모집글 조건부터 봐','준비 운동은 꼭 해','다치지 않는 게 제일 중요함'],reply:['공지 읽고 시간 맞으면 가보려고','오늘은 가볍게만 해야겠다','너무 무리하진 않으려고']},
 weather:{titles:['비 오면 건물 나오는 타이밍 계속 놓침','우산 챙긴 날은 괜히 든든함','젖은 우산 어디 둘지 늘 애매하다'],bodies:['처마 밑에 잠깐 서 있다가 나갈까 말까 반복하고 있음.','예보 보고 챙겼는데 막상 접고 펼 때가 제일 귀찮다.','바닥 미끄러운 데는 천천히 가는 게 낫겠다.'],comments:['자유관 공용 우산 대여대 있더라','들어올 때 물기 좀 털어줘','강한 비면 잠깐 안에서 쉬는 편'],reply:['다음에는 미리 챙겨야겠다','일단 비 좀 보고 움직이려고','정보 고마워']},
 notice:{titles:['행사 인력 늦는다는 공지 봤어?','안내문은 바뀐 부분 끝까지 읽어야겠네','지원 인력 지연 공지 보고 일정 다시 확인함'],bodies:['준비는 진행한다고 써 있던데 이유는 따로 안 나와 있네. 추측은 말고 현장 안내 봐야겠다.','일부 안내가 추가됐더라. 내가 가는 곳은 직접 확인하고 움직이려고.','공지만 봤고 무슨 사정인지는 모름. 참석할 사람은 안내 확인해봐.'],comments:['지연 이유는 아직 안 적혀 있더라','현장 담당자 안내대로 하면 될 듯','확인 안 된 말은 덧붙이지 말자'],reply:['추가 공지 나오면 그때 다시 볼게','나도 공지에서 본 게 전부임','다들 직접 확인하고 움직이자']},
 ambulance:{titles:['정류장 쪽에 구급차 봤다는 글 있네','학교 앞 지나가다 구급차 봄','정류장 주변 무슨 일인지 아는 사람'],bodies:['지나가다 구급차가 서 있는 건 봤는데 이유는 못 들었어. 길 막지는 말자.','사람들이 잠깐 모여 있더라. 상태나 원인은 아는 게 없어서 그냥 지나왔어.','본 사람이 있나 해서 물어봄. 모르는 이야기를 확정해서 퍼뜨리려는 건 아니고.'],comments:['무슨 일인지는 아직 모르는 거지?','응급 차량 동선은 비워두자','같은 글 여러 번 본다고 이유를 아는 건 아님'],reply:['맞아 이유는 나도 몰라','내가 본 건 구급차뿐이야','추측 덧붙이지 말자']},
 exhibit:{titles:['활동 사진 전시 열렸네','사진 옆 설명도 읽고 오게 되더라','작은 전시라도 준비할 건 많겠다'],bodies:['지나가다 사진 몇 장 보고 왔어. 잠깐 멈춰서 보기 괜찮더라.','사진 고르는 것부터 붙이는 것까지 일인 것 같다. 준비한 사람들 수고했겠다.','사진마다 보이는 분위기가 달라서 한 번 더 돌아봤다.'],comments:['방해 안 되게 보고 가면 좋지','나도 지나가다 봐야겠다','작게 해도 남는 게 있네'],reply:['시간 있을 때 잠깐 보고 와','준비하는 중이면 기다렸다가 봐','설명은 각자 느끼는 게 또 다를 듯']}
};
export function communityState(s){
 s.community??={beat:0,rng:641937,sequence:0,posts:[],jobs:[],agents:{},topics:{},nextPost:2,lastWorld:null};return s.community;
}
function communityRandom(c,n){c.rng=(Math.imul(c.rng,1664525)+1013904223)>>>0;return Math.floor(c.rng/4294967296*n);}
export function publicCommunityContext(s){return {day:s.day,phase:s.phase,weather:weatherNow(s).kind,hour:Math.floor((s.clock?.minute??780)/60),notice:s.day>=3&&s.events.some(e=>e.id==='campus-staff-delay'),exhibit:s.day===3&&s.phase==='evening'&&s.events.some(e=>e.id==='campus-showcase')};}
function allowedTopics(ctx){return ['bus','study','coffee','food','clubs','music','sports',...(['rain','storm'].includes(ctx.weather)?['weather']:[]),...(ctx.notice?['notice','ambulance']:[]),...(ctx.exhibit?['exhibit']:[])];}
function generateThread(s){
 const c=communityState(s),ctx=publicCommunityContext(s),topics=allowedTopics(ctx);
 const agents=communityWriters.filter(a=>ctx.hour>=a.hours[0]&&ctx.hour<a.hours[1]&&(c.agents[a.id]??-100)+a.cooldown<=c.beat&&a.topics.some(t=>topics.includes(t)&&(c.topics[t]??-100)+5<=c.beat));
 if(!agents.length)return;
 const actor=agents[communityRandom(c,agents.length)],eligible=actor.topics.filter(t=>topics.includes(t)&&(c.topics[t]??-100)+5<=c.beat),topic=eligible[communityRandom(c,eligible.length)],writing=topicWriting[topic];
 const used=new Set(c.posts.filter(p=>p.topic===topic).slice(-2).map(p=>p.title));let titles=writing.titles.filter(t=>!used.has(t));if(!titles.length)return;
 const title=titles[communityRandom(c,titles.length)],body=writing.bodies[communityRandom(c,writing.bodies.length)],id='student-'+(++c.sequence);
 const post={id,day:s.day,phase:s.phase,board:'자유',author:'익명',kind:'anonymous',title,body,comments:[],likes:0,createdBeat:c.beat,topic,actor:actor.id,generated:true};
 if(topic==='ambulance'||topic==='notice')post.warning={id:topic==='ambulance'?'community-ambulance':'community-notice',label:topic==='ambulance'?'커뮤니티에서 본 구급차 목격글':'커뮤니티에서 본 행사 지연 이야기',detail:topic==='ambulance'?'익명 학생이 구급차를 보았다고 썼다. 작성자의 신원과 원인은 확인되지 않았다.':'익명 학생이 행사 지연 공지를 언급했다. 태이가 원인을 직접 확인한 내용은 아니다.',source:'캠퍼스톡 익명글',kind:'report'};
 c.posts.push(post);c.agents[actor.id]=c.beat;c.topics[topic]=c.beat;
 const readers=communityWriters.filter(a=>a.id!==actor.id&&ctx.hour>=a.hours[0]&&ctx.hour<a.hours[1]);
 const interested=readers.filter(a=>a.topics.includes(topic)),pool=interested.length?interested:readers;
 const commenter=pool.length?pool[communityRandom(c,pool.length)]:null;
 if(commenter&&communityRandom(c,100)<85){
  c.jobs.push({due:c.beat+1+communityRandom(c,3),postId:id,type:'comment',actor:commenter.id,text:writing.comments[communityRandom(c,writing.comments.length)]});
  c.jobs.push({due:c.beat+4+communityRandom(c,4),postId:id,type:'reply',actor:actor.id,text:writing.reply[communityRandom(c,writing.reply.length)]});
  const second=readers.find(a=>a.id!==commenter.id);
  if(second&&communityRandom(c,100)<40)c.jobs.push({due:c.beat+7+communityRandom(c,4),postId:id,type:'comment',actor:second.id,text:writing.comments[communityRandom(c,writing.comments.length)]});
 }
 if(communityRandom(c,100)<75)c.jobs.push({due:c.beat+2+communityRandom(c,3),postId:id,type:'like'});
 if(c.posts.length>50){const index=c.posts.findIndex(p=>p.id!==c.focusPostId);const [removed]=c.posts.splice(index,1);c.jobs=c.jobs.filter(j=>j.postId!==removed.id);}
}
export function advanceCommunity(state,{ambient=false}={}){
 const s=structuredClone(state),c=communityState(s),ctx=publicCommunityContext(s),world=s.day*1440+(s.clock?.minute??780)+(s.phase==='evening'?1:0);
 let beats=ambient?1:c.lastWorld===null?2:Math.max(0,Math.min(12,Math.floor((world-c.lastWorld)/15)));
 if(!ambient)c.lastWorld=world;
 for(let i=0;i<beats;i++){
  c.beat++;
  for(const job of c.jobs.filter(j=>j.due<=c.beat)){
   const post=c.posts.find(p=>p.id===job.postId);if(!post)continue;
   if(job.type==='like')post.likes++;
   else {post.commenters??=[];if(job.actor!==post.actor&&!post.commenters.includes(job.actor))post.commenters.push(job.actor);post.comments.push({id:post.id+':'+post.comments.length,text:job.text,author:job.actor===post.actor?'글쓴이':'익명 '+(post.commenters.indexOf(job.actor)+1),beat:c.beat,reply:job.type==='reply'});}
  }
  c.jobs=c.jobs.filter(j=>j.due>c.beat);
  if(c.beat>=c.nextPost){generateThread(s);c.nextPost=c.beat+(ctx.phase==='evening'?3:4)+communityRandom(c,3);}
 }
 return s;
}
