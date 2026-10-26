import {npcNow} from './npc-state.js';
import {contact,normalizeNpcAddress} from './identity.js';
// A transparent decision model for authored NPC behavior, not a language model.
export function socialIntent(s,id){
 const state=npcNow(s,id);
 const r={familiarity:0,affection:0,trust:0,tension:0,...s.relations[`${id}>taei`]};
 const memories=s.dialogue?.observations?.[id]??{};
 const history=s.dialogue?.history??[];
 const brokenDays=[];
 if(s.dialogue?.promises[id]==='broken')brokenDays.push(s.day??1);
 if(s.dayHistory?.at(-1)?.promises[id]==='broken')brokenDays.push(s.dayHistory.at(-1).day);
 for(const a of s.appointments??[])if(a.person===id&&a.status==='broken')brokenDays.push(a.day);
 const brokenDay=brokenDays.length?Math.max(...brokenDays):0;
 const apology=history.findLast(h=>h.person===id&&(h.choice==='repair'||h.choice==='scene:apologize')&&((h.day??1)>brokenDay||((h.day??1)===brokenDay&&h.phase==='evening')));
 const unresolved=!!brokenDay&&!apology;
 const feelsSafe=r.trust>=3&&r.tension<3&&!unresolved&&memories.boundary!=='ignored'&&state.disclosure;
 const personallyInterested=r.affection>=3;
 const comfortable=r.familiarity>=4;
 const workPressure=(s.day??1)===3&&s.phase==='afternoon'||state.rushed;
 const mode=r.tension>=4||unresolved?'guarded':workPressure?'task':feelsSafe&&personallyInterested?'seek-company':personallyInterested?'cautious-interest':comfortable?'casual':'polite';
 return {state,mode,feelsSafe,personallyInterested,comfortable,unresolved,workPressure,
  willingToJoke:comfortable&&r.tension<3&&!unresolved&&state.bandwidth==='open',
  invite:comfortable&&r.trust>=2&&r.tension<3&&!unresolved&&state.bandwidth==='open',
  disclosure:feelsSafe?(comfortable?'personal':'limited'):'surface',
  // Kept inside simulation state/tests; numerical reasoning is not shown as mind-reading UI.
  motives:{finishTask:workPressure?4:1,shareTime:personallyInterested?3:1,protectPrivacy:feelsSafe?0:3}};
}
function rawPersonalMessage(s,id){
 if(!contact(s,id).introduced)return null;
 const intent=socialIntent(s,id),facts=s.dialogue?.facts?.[id]??{};
 if(intent.unresolved)return {seoyeon:'어제 못 올 거면 한마디만 해줬으면 했어요. 오늘은 일정 확인하고 얘기해요.',yeogyeong:'어제 기다렸어요. 다음에는 못 오면 먼저 알려주세요.',soyul:'어제 기다렸는데… 오늘은 무리해서 약속 안 해도 돼요.'}[id];
 if(intent.mode==='guarded')return null;
 if(id==='seoyeon'&&facts.coffee)return facts.coffee==='black'?'오늘은 안 단 걸로 시켰어요. 디저트는 따로라고 했죠? 여기 빵도 있네요.':'어제 그 커피는 결국 다 못 마셨어요. 오늘은 다른 거 시켰는데 이건 괜찮네요.';
 if(id==='soyul'&&facts.photo)return '어제 같이 본 사진, 아직 안 지웠어요. 여경이한테도 보여주려고요.';
 if(intent.personallyInterested&&intent.feelsSafe)return {seoyeon:'오늘 카페에 있어요. 선배 작업하러 나올 거면 잠깐 들러도 되고요.',yeogyeong:'오늘도 자유관에 있어요. 간식 뜯기 전에 오면 나눠줄게요.',soyul:'오늘은 도서관에 있어. 시간 되면 잠깐 얼굴 볼 수 있을까?'}[id];
 if(intent.comfortable)return {seoyeon:'저는 오늘 카페에서 좀 쉬려고요. 선배도 근처에 나올 일 있어요?',yeogyeong:'저 오늘도 자유관이에요. 정리할 게 조금 남아서요.',soyul:'오늘은 도서관에서 사진 고르려고요. 시간 괜찮으면 들러요.'}[id];
 return null;
}

export function personalMessage(s,id){const text=rawPersonalMessage(s,id);return text==null?null:normalizeNpcAddress(s,id,text);}
