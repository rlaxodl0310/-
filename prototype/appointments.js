import {socialOpinion} from './social-memory.js';
import {contact} from './identity.js';
import {socialIntent} from './social-reasoning.js';
import {changeRelationship} from './dialogue.js';
import {days} from './days.js';

export const clubs={
 volunteer:{name:'봉사단',description:'지역 봉사와 물품 준비를 함께하는 동아리. 공개 활동을 체험한 뒤 가입할 수도 있다.',place:'자유관',events:[{day:1,activity:'volunteer',label:'봉사 물품 준비'},{day:3,activity:'exhibit',label:'활동 사진 전시 준비'}]},
 football:{name:'축구 동아리',description:'정기적으로 모여 축구를 한다. 선수는 남학생, 여성 부원은 매니저로 참여한다. 현재 시제품은 체험 활동만 제공한다.',place:'운동장',events:[{day:2,activity:'football',label:'축구 동아리 체험 훈련'}]},
 music:{name:'음악 동아리',description:'합주와 공연 준비를 함께한다. 태이의 전공 합주와 동아리 가입은 별개다.',place:'합주실 · 공연장',events:[{day:3,activity:'backstage',label:'공연 리허설 돕기'}]}
};
export function joinClub(state,id){
 if(!clubs[id])throw new Error('알 수 없는 동아리입니다.');
 const s=structuredClone(state);s.memberships??={};
 if(s.memberships[id])throw new Error('이미 가입한 동아리입니다.');
 if(s.clubApplications?.[id]?.status!=='offered')throw new Error('신청과 현장 면접을 마치고 가입 안내를 받아야 합니다.');
 s.memberships[id]={joinedDay:s.day};s.memory.push(`[${s.day}일차] ${clubs[id].name}에 가입했다.`);
 if(s.clubApplications[id])s.clubApplications[id].status='accepted';
 const event=clubs[id].events.find(e=>e.day>s.day||(e.day===s.day&&s.phase==='afternoon'&&!s.freeDay?.completed?.some(a=>a.id===e.activity)&&s.clock.minute+(days[e.day].routes[e.activity]?.duration??0)<=1080));
 if(event)s.appointments.push({id:`club:${id}:${event.day}`,kind:'club',proposer:'club',club:id,day:event.day,phase:'afternoon',activity:event.activity,label:event.label,status:'offered'});
 return s;
}
function invitationReady(s,id){
 const intent=socialIntent(s,id);
 return contact(s,id).introduced&&intent.mode!=='guarded'&&!intent.unresolved&&(s.relations[`${id}>taei`]?.tension??0)<3;
}
function targetDay(s){return s.day+1;}
function npcOccupied(s,id,day){return s.appointments.some(a=>a.person===id&&a.day===day&&a.status==='pending');}
export function evaluateInvitations(state){
 const s=structuredClone(state);s.invitationDecisions??={};
 if(s.day>=3)return s;
 for(const id of ['yeogyeong','seoyeon','soyul']){
  const key=`npc:${id}:${s.day}`;
  if(socialOpinion(s,id).cautious){
   for(const offer of s.appointments.filter(a=>a.person===id&&a.proposer==='npc'&&a.status==='offered')){offer.status='withdrawn';s.messages.push({day:s.day,from:s.npcs[id].name,text:'아까 말한 일정은 시간부터 한 번 더 확인하고 정해요. 지금 바로 확정하진 않을게요.'});}
   continue;
  }
  if(s.invitationDecisions[key]||!invitationReady(s,id))continue;
  const r=s.relations[`${id}>taei`]??{},intent=socialIntent(s,id),day=targetDay(s);
  // Different personalities ask for different things. Affection never overrides low trust.
  const eligible=id==='yeogyeong'?r.familiarity>=3&&r.trust>=2:id==='seoyeon'?r.familiarity>=4&&r.trust>=3:intent.feelsSafe&&r.familiarity>=3;
  if(!eligible||npcOccupied(s,id,day))continue;
  const practical=id==='yeogyeong';
  const activity=practical?(day===2?'review':'exhibit'):undefined;
  const location=days[day].schedules.afternoon[id];
  const label=practical?(day===2?'사진 정리 함께하기':'사진 전시 준비'):id==='seoyeon'?'잠깐 쉬며 이야기하기':'사진 이야기 이어가기';
  const text=id==='yeogyeong'?'내일 준비할 게 좀 남았는데, 같이 해볼래요? 일정 괜찮을 때만요.':id==='seoyeon'?(r.affection>=3?'내일 잠깐 같이 있을래요? 바쁜 일이 있으면 다음에 봐도 되고요.':'내일 쉬는 시간에 이야기 좀 더 할래요? 시간 괜찮으면요.'):'아까 이야기, 내일 조금 더 해도 될까요? 사진도 같이 보고 싶어서요.';
  const offer={id:key,minute:900,kind:practical?'activity':'meeting',proposer:'npc',person:id,day,phase:'afternoon',activity,location,label,status:'offered',text};
  s.appointments.push(offer);s.invitationDecisions[key]='offered';
  s.messages.push({day:s.day,from:s.npcs[id].name,text,appointmentId:key});
 }
 return s;
}
export function appointmentConflicts(s,offer){return s.appointments.filter(a=>a!==offer&&a.status==='pending'&&a.day===offer.day&&(a.phase??'afternoon')===(offer.phase??'afternoon')&&(!a.activity||!offer.activity||a.activity!==offer.activity));}
export function replyOffer(state,id,accept){
 const s=structuredClone(state),a=s.appointments.find(x=>x.id===id);
 if(!a||a.status!=='offered')throw new Error('지금 응답할 수 있는 제안이 아닙니다.');
 if(a.kind==='supply-followup'&&(a.day!==s.day||s.clock.minute>a.minute+15))throw new Error('이 제안의 시간이 지났습니다.');
 if(a.day<s.day||(a.day===s.day&&s.phase==='evening'))throw new Error('이미 지난 제안입니다.');
 a.status=accept?'pending':'declined';
 s.memory.push(`[${s.day}일차] ${a.label} 제안을 ${accept?'수락했다.':'정중히 거절했다.'}`);
 return s;
}
export function suggestMeeting(state,id){
 if(!contact(state,id).introduced||state.day>=3)throw new Error('먼저 인사를 나누거나 이후 일정이 있는 날에 제안해 주세요.');
 const s=structuredClone(state);s.invitationDecisions??={};const key=`player:${id}:${s.day}`;
 if(s.invitationDecisions[key])throw new Error('오늘은 이미 의사를 물었습니다. 답변을 존중해 주세요.');
 const day=targetDay(s),intent=socialIntent(s,id),r=s.relations[`${id}>taei`]??{};
 const willing=invitationReady(s,id)&&intent.invite&&r.trust>=2&&!npcOccupied(s,id,day);
 s.invitationDecisions[key]=willing?'accepted':'refused';
 const text=willing?'내일 잠깐이면 괜찮아요. 그때 이야기해요.':'내일은 따로 약속을 잡기 어려울 것 같아요. 다음에 봐요.';
 if(willing)s.appointments.push({id:key,kind:'meeting',proposer:'player',person:id,day,phase:'afternoon',location:days[day].schedules.afternoon[id],label:'따로 만나 이야기하기',status:'pending',text});
 s.messages.push({day:s.day,from:s.npcs[id].name,text});s.memory.push(`[${s.day}일차] ${s.npcs[id].name}에게 만남을 제안했고 ${willing?'수락받았다.':'상대가 이번에는 어렵다고 답했다.'}`);
 return {state:s,accepted:willing};
}
export function meetAppointments(state,person){
 const s=structuredClone(state);
 for(const a of s.appointments)if(a.kind==='meeting'&&a.status==='pending'&&a.person===person&&a.day===s.day&&a.phase===s.phase&&a.location===s.location){
  a.status='kept';changeRelationship(s,person,'taei',{trust:1,familiarity:1});s.memory.push(`[${s.day}일차] ${s.npcs[person].name}과 만나 ${a.label} 약속을 지켰다.`);
 }
 return s;
}
export function expireOffers(state){
 const s=structuredClone(state);
 for(const a of s.appointments)if(a.status==='offered'&&(a.day<s.day||(a.day===s.day&&s.phase==='evening')))a.status='expired';
 return s;
}
