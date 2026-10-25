import {noteWarning} from './warning-records.js';
import {learnEvent} from './event-view.js';
export const communityPosts=[
 {id:'volunteer-recruit',day:1,board:'동아리 모집',author:'봉사단 운영진',kind:'club',club:'volunteer',title:'오늘 물품 준비 같이 해볼 사람? 가입 전 체험도 가능해요',body:'학생회관에서 봉사 물품을 준비하고 있어요. 동아리 가입부터 결정하지 않아도 됩니다. 잠깐 와서 어떤 활동인지 보고 가셔도 돼요.',comments:['시간 맞으면 잠깐 가봐도 되나요?','운영진: 네, 안내 읽고 편하게 들러주세요.']},
 {id:'football-recruit',day:1,board:'동아리 모집',author:'축구 동아리 운영진',kind:'club',club:'football',title:'내일 공개 훈련 모집합니다 · 처음 와도 괜찮아요',body:'운동장에서 공개 체험 훈련을 진행합니다. 선수는 남학생, 여성 부원은 매니저로 참여합니다. 비가 오면 실내 기본 체력 훈련으로 대체해요. 가입 여부는 체험한 뒤 정해도 됩니다.',comments:['비 와도 취소 아닌가요?','운영진: 실내 대체로 진행할 예정입니다.']},
 {id:'music-recruit',day:1,board:'동아리 모집',author:'음악 동아리 운영진',kind:'club',club:'music',title:'같이 합주하고 공연 준비할 부원 구해요',body:'보컬이나 악기 파트에 관심 있으면 모집 안내를 읽어주세요. 이번 주 공연 리허설을 돕는 일정도 있습니다. 전공 합주에 참여하는 것과 동아리 가입은 별개예요.',comments:['공연 준비만 도와봐도 되나요?','운영진: 공개 체험 일정에서 먼저 만나봐요.']},
 {id:'library-seats',day:1,board:'자유',author:'익명',kind:'anonymous',title:'도서관 창가 자리 아까는 비어 있었음',body:'점심 먹고 지나갈 때는 몇 자리 남아 있었어요. 지금도 비어 있는지는 모르겠음.',comments:['직접 가봐야겠네','시간 지나면 또 다르니까 참고만 해']},
 {id:'event-notice',day:3,board:'교내 공지',author:'교내 행사 안내',kind:'notice',title:'행사 지원 인력 도착 지연 및 준비 구역 안내',body:'오늘 지원 인력 일부의 도착이 늦고 있습니다. 준비는 예정대로 진행하며 담당 구역은 현장에서 다시 안내합니다. 지연 사유에 대한 추가 안내는 없습니다.',comments:[],warning:{id:'staff-delay',label:'행사 지원 인력의 도착 지연',detail:'행사 안내에는 지원 인력 일부가 늦으며 준비는 예정대로 진행한다고 적혀 있다. 이유는 안내되지 않았다.',source:'교내 행사 안내',kind:'notice'}},
 {id:'ambulance-post',day:3,board:'자유',author:'익명',kind:'anonymous',title:'학교 앞 정류장에 구급차 와 있던데',body:'지나가면서 봤는데 사람 몇 명 모여 있었어요. 무슨 일인지는 못 들었음. 아는 사람 있나요?',comments:['누가 다친 건가?','이유 나온 건 없으니까 모르는 얘기는 덧붙이지 말자'],warning:{id:'community-ambulance',label:'커뮤니티에서 본 구급차 목격글',detail:'익명 작성자가 정류장 앞에서 구급차를 보았다고 썼다. 태이는 현장을 보지 않았고, 원인이나 작성자의 신원도 확인하지 못했다.',source:'캠퍼스톡 익명글',kind:'report'}}
];
export function visibleCommunityPosts(s){return [...(s.community?.posts??[]).slice().reverse(),...communityPosts.filter(p=>p.day<=s.day).slice().reverse()];}
export function readCommunityPost(state,id){
 const post=visibleCommunityPosts(state).find(p=>p.id===id);if(!post)throw new Error('지금 볼 수 없는 글입니다.');
 const s=structuredClone(state);if(s.community)s.community.focusPostId=post.generated?post.id:null;s.flow??={seen:{}};s.flow.seen.community=true;s.flow.postsRead??={};
 if(!s.flow.postsRead[id]){
  s.flow.postsRead[id]={day:s.day,phase:s.phase};
  s.memory.push(`[${s.day}일차] 캠퍼스톡 ${post.board}에서 ${post.author}의 글 「${post.title}」을 읽었다.`);
 }
 if(post.club)s.flow.seen['club:'+post.club]=true;
 if(post.warning){noteWarning(s,post.warning);if(post.kind==='notice'){const e=s.events.find(e=>e.id==='campus-staff-delay');if(e)learnEvent(s,e,'community-notice');}}
 return s;
}
