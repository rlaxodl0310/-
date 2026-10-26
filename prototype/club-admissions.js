import {clubs} from './appointments.js';
import {advanceFreeTime} from './free-roam.js';
export const clubInterviewRooms={volunteer:'clubs',football:'footballClub',music:'musicClub'};
export function submitClubApplication(state,id,reason){
 if(!clubs[id]||!['interest','experience'].includes(reason))throw new Error('신청 내용을 확인해 주세요.');
 if(state.memberships?.[id]||state.clubApplications?.[id])throw new Error('이미 신청했거나 가입한 동아리입니다.');
 const s=structuredClone(state);s.clubApplications??={};
 s.clubApplications[id]={status:'submitted',reason,day:s.day,minute:s.clock.minute,answers:[],room:clubInterviewRooms[id]};
 s.messages.push({day:s.day,from:clubs[id].name+' 모집 담당',text:`신청서를 받았습니다. 자유관 2층 ${id==='volunteer'?'202':id==='football'?'201':'203'}호에서 13:00~17:00 사이 면접을 진행합니다. 신청 직후에는 접수 확인에 시간이 걸리니 30분 뒤부터 방문해 주세요.`});return s;
}
export function interviewAvailability(s,id){
 const a=s.clubApplications?.[id];
 if(!a||a.status!=='submitted')return '면접을 진행할 신청서가 없습니다.';
 if((s.day-a.day)*1440+s.clock.minute-a.minute<30)return '아직 접수 확인 중이다. 다른 일을 하다가 방문하자.';
 if(s.clock.minute<780||s.clock.minute>1000)return '오늘 면접은 13:00~17:00 사이에 진행한다. 마칠 시간까지 남아 있어야 한다.';
 if(s.location!=='hall'||s.buildingArea?.place!=='hall'||s.buildingArea.id!==a.room)return '안내받은 자유관 동아리실에 직접 가야 한다.';
 return null;
}
export function clubInterviewView(s,id){
 const a=s.clubApplications?.[id];if(!a)return null;
 if(a.status==='submitted')return {text:a.answers.length?'담당자가 활동 일정표를 돌려 보여준다. “정기 활동과 수업이 겹치면 어떻게 하실 생각이세요?”':'모집 담당자가 신청서를 확인하고 자리를 권한다. “어떤 활동을 해보고 싶어서 신청하셨어요?”',options:a.answers.length?[{id:'coordinate',label:'시간표를 확인하고 가능한 일정을 미리 조율하겠습니다.'},{id:'overpromise',label:'다른 일정이 있어도 무조건 다 참여할 수 있어요.'}]:[{id:'honest',label:'처음이라 잘 모르는 부분도 있지만 실제 활동부터 배우고 싶어요.'},{id:'showoff',label:'어려운 일도 제가 다 맡아서 하면 될 것 같아요.'}]};
 if(a.status==='reviewing')return {text:'면접을 마쳤다. 담당자는 다른 지원자도 만나본 뒤 30분 정도 후 연락하겠다고 한다.',options:[]};
 return {text:a.status==='offered'?'가입 안내가 도착했다. 활동 규칙을 확인하고 참여 여부를 결정할 수 있다.':'이번 모집에서는 함께하기 어렵다는 연락이 왔다. 공개 체험에는 참여할 수 있다.',options:[]};
}
export function answerClubInterview(state,id,answer){
 const reason=interviewAvailability(state,id);if(reason)throw new Error(reason);
 const view=clubInterviewView(state,id);if(!view.options.some(o=>o.id===answer))throw new Error('지금 질문에 맞는 답변이 아닙니다.');
 let s=structuredClone(state);s.clubApplications[id].answers.push(answer);
 // Two exchanges share one actual twenty-minute interview, not one clock tick per answer.
 if(s.clubApplications[id].answers.length===2){
  s=advanceFreeTime(s,20);const a=s.clubApplications[id];a.status='reviewing';a.finishedDay=s.day;a.finishedMinute=s.clock.minute;
 }
 return s;
}
export function settleClubAdmissions(state){
 const s=structuredClone(state);
 for(const [id,a] of Object.entries(s.clubApplications??{}))if(a.status==='reviewing'&&(s.day-a.finishedDay)*1440+s.clock.minute-a.finishedMinute>=30){
  a.status=a.answers.includes('overpromise')&&a.answers.includes('showoff')?'declined':'offered';
  s.messages.push({day:s.day,from:clubs[id].name+' 모집 담당',text:a.status==='offered'?'면접 결과 함께 활동하실 수 있습니다. 활동 규칙과 가능한 일정을 확인한 뒤 가입 의사를 알려주세요.':'이번에는 일정과 역할을 맞추기 어려울 것 같습니다. 공개 체험 활동은 가입과 관계없이 참여할 수 있습니다.'});
 }
 return s;
}
