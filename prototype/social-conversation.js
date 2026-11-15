import {contact} from './identity.js';
import {npcNow} from './npc-state.js';
import {socialIntent} from './social-reasoning.js';
export function conversationPurpose(text=''){if(/주워|떨어|건네|영수증|필통|펜을/.test(text))return 'return-item';if(/의자|자리|앉/.test(text))return 'seat';if(/안내|지도|어디|방향|문을|출입|줄|길을/.test(text))return 'directions';if(/봉사|수량|활동|물품/.test(text))return 'shared-task';return null;}
export function conversationDisposition(s,id){
 const r={familiarity:0,trust:0,affection:0,tension:0,...s.relations?.[id+'>taei']},known=!!contact(s,id).introduced,now=npcNow(s,id),intent=socialIntent(s,id),appointmentSoon=(s.appointments??[]).some(a=>a.person===id&&a.day===s.day&&a.status==='pending'&&Number.isFinite(a.minute)&&a.minute>=s.clock.minute&&a.minute<=s.clock.minute+15&&!(a.kind==='meeting'&&a.location===s.location)),foundation=known&&r.familiarity>=4&&r.trust>=2,guarded=r.tension>=3||intent.unresolved,busy=appointmentSoon||now.rushed||['brief','limited'].includes(now.bandwidth),comfortable=foundation&&!guarded&&!busy,interested=comfortable&&(r.affection>=3||r.familiarity>=8&&r.trust>=4);
 return {mustGo:appointmentSoon,stage:!foundation?'brief':guarded?'guarded':'familiar',canInitiate:interested&&now.bandwidth==='open',canContinue:interested,budget:!foundation?2:busy||guarded?2:interested?6:4,known,reason:!foundation?'아직 서로 잘 모르는 사이':guarded?'불편한 일이 남아 있음':busy?'일정이나 여유가 부족함':interested?'더 함께 있고 싶음':'편하게 이야기할 수 있는 사이'};
}
export function briefExchangeLine(purpose,action){
 if(action==='about')return null;
 if(action==='introduce')return '아, 그러시구나. 저는 하던 것 마저 하고 갈게요. 다음에 뵐게요.';
 if(action!=='greet')return '네. 도와주셔서 감사해요. 그럼 먼저 가볼게요.';
 return ({'return-item':'아, 감사합니다. 떨어뜨린 줄도 몰랐네요.','seat':'네, 비었어요. 여기 앉으셔도 돼요.','directions':'네, 이쪽이에요. 저도 안내문 보고 있었어요.','shared-task':'아, 이것 좀 같이 봐주실 수 있어요? 여기까지만 맞추면 돼서요.'})[purpose]??'아, 안녕하세요. 무슨 일이세요?';
}
export function proactiveGreeting(s,id){const d=conversationDisposition(s,id),last=s.dialogue?.socialOpenings?.[id];if(!d.canInitiate||last?.day===s.day&&s.clock.minute-last.minute<90)return null;const line={yeogyeong:'아, 잠깐만요. 시간 괜찮아요? 저 잠깐 쉬려던 참인데 같이 있어도 돼요?',seoyeon:'지금 어디 가요? 바쁜 거 아니면 조금만 얘기하다 갈래요?',soyul:'저기… 지금 가는 거예요? 시간 있으면 잠깐만 더 있어도 돼요?'}[id];return line?{line,purpose:'known-person',initiated:true}:null;}
