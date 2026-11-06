import {fortnightActivities} from './fortnight-life.js';
import {communityActivityDefinitions,activityAvailability,onsiteCommunityActivities} from './community-activities.js';
import {nextLesson} from './timetable.js';
// Hints use personal plans, public posts already read, or activity observed here.
export function opportunityCandidates(s){
 if(s.phase==='evening'||s.academics?.registrationPending||s.clock.minute<600||s.clock.minute>1200)return [];
 const lesson=nextLesson(s);if(lesson&&lesson.start>=s.clock.minute&&lesson.start-s.clock.minute<45)return [];
 const out=[],daily=fortnightActivities[s.day];
 if(daily&&!s.fortnightLife?.[s.day]?.done&&s.clock.minute>=780)out.push({id:`daily:${s.day}`,place:daily.place,title:'공강에 잠깐, 다른 일을',text:daily.place===s.location?'잠깐 멈춰 주변을 둘러볼까. 오늘 남겨둘 만한 일이 있을지도 모른다.':'오늘은 늘 가던 길에서 조금 벗어나 볼까. 잠깐 들러 하고 싶은 일을 찾아봐도 좋겠다.'});
 const onsite=new Set(onsiteCommunityActivities(s).map(x=>x.id));
 for(const [id,d] of Object.entries(communityActivityDefinitions)){
  if(!onsite.has(id)&&!s.flow?.postsRead?.[id])continue;
  if(!activityAvailability(s,id).ok)continue;
  out.push({id:`public:${s.day}:${id}`,place:d.venue.location,title:onsite.has(id)?'근처에서 들려오는 소리':'읽어둔 모집글이 떠오른다',text:onsite.has(id)?'근처에서 활동 안내가 들린다. 관심이 있으면 직접 어떤 자리인지 물어볼까?':`${d.title} 안내를 읽어뒀지. 시간이 된다면 현장 분위기를 살펴봐도 좋겠다.`});
 }
 return out;
}
export function currentOpportunity(s){const h=s.opportunityHints?.active;return h&&opportunityCandidates(s).some(c=>c.id===h.id)?h:null;}
export function updateOpportunityHints(s){
 const log=s.opportunityHints??={seen:[],day:s.day,count:0,last:-999,active:null};
 if(log.day!==s.day){log.day=s.day;log.count=0;log.last=-999;log.active=null;}
 if(log.active&&!currentOpportunity(s))log.active=null;
 if(log.active||log.count>=2||s.clock.minute-log.last<90)return;
 const candidates=opportunityCandidates(s).filter(c=>!log.seen.includes(c.id));
 if(!candidates.length)return;
 const h=candidates[(s.day+Math.floor(s.clock.minute/30))%candidates.length];
 log.active=h;log.seen.push(h.id);log.count++;log.last=s.clock.minute;
}
export function dismissOpportunity(s){if(s.opportunityHints)s.opportunityHints.active=null;}
