import {supplyConversationMemory} from './supply-story.js';
import {npcNow} from './npc-state.js';
const serviceProfiles={
 yeogyeong:'차여경, 21세 간호학과 학생이자 봉사단 재무부장. 귀여운 인상. 확인하는 일을 중요하게 여기지만 자기 일과 결정권을 존중받고 싶다.',
 seoyeon:'한서연, 21세 치위생과 학생. 차분한 말투와 목소리, 친화력이 좋고 사회생활에 능숙하다. 친절함이 무조건적인 동의는 아니다.',
 soyul:'박소율, 21세 치위생과 학생. 차가운 인상과 달리 부끄러움과 쑥스러움이 많다. 조용해도 자기 생각과 선택권이 있다.'
};
export function dialogueServiceContext(s,id,result){
 const status=npcNow(s,id),facts=s.dialogue?.facts?.[id]??{};
 const heardWork=s.dialogue?.generation?.sharedWork?.includes(id)??false;
 const ownLunch=Object.values(s.rainLunch?.episodes??{}).findLast(r=>r.person===id&&r.status==='completed'&&r.walked);
 const history=(s.dialogue?.history??[]).filter(h=>h.person===id&&h.generated&&h.turnId!==result.turnId).slice(-6).map(h=>({player:String(h.playerLine??'').slice(0,250),npc:String(h.text??'').slice(0,500)}));
 return {character:serviceProfiles[id],name:s.npcs[id].name,day:s.day,time:s.clock.minute,place:s.location,
  state:{mood:status.mood,bandwidth:status.bandwidth},relationship:{...s.relations[`${id}>taei`]},
  known:{playerIntroduced:!!s.contacts[id]?.introduced,playerSeniorityKnown:!!s.contacts[id]?.playerSeniorityKnown,playerWork:heardWork?'본인의 이야기를 곡으로 남기려는 보컬 전공 복학생':null,preferences:{...facts},sharedSupplies:supplyConversationMemory(s,id),sharedLunch:ownLunch?{day:ownLunch.day,walked:ownLunch.walked,ate:ownLunch.ate,actions:ownLunch.choices}:null},
  history,playerLine:String(result.playerLine??'').slice(0,300),
  constraints:{intent:result.plan.intent,topic:result.plan.topicName,detail:result.plan.detail,closing:!!result.leave},
  draft:result.text};
}
export function applyServiceDialogue(s,id,turnId,text){
 const session=s.dialogue?.sessions?.[`${s.day}:${s.phase}:${id}`];
 if(!session?.generated||session.response.turnId!==turnId)return false;
 const history=s.dialogue.history.findLast(h=>h.person===id&&h.turnId===turnId&&h.generated);
 if(!history)return false;
 // Preserve the authoritative plan/options/effects; model output is only spoken text.
 session.response.text=text;session.response.source='server-model';
 history.text=text;history.source='server-model';return true;
}
export function createDialogueService({fetcher=globalThis.fetch?.bind(globalThis),protocol=globalThis.location?.protocol??'file:',base=''}={}){
 let configured=false,checked=false;
 const path=base.replace(/\/$/,'')+'/api/dialogue';
 return {
  get enabled(){return configured;},
  async probe(){
   if(checked)return configured;checked=true;
   if(!fetcher||!['http:','https:'].includes(protocol))return false;
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),1500);
   try{const response=await fetcher(path+'/status',{signal:controller.signal});configured=response.ok&&(await response.json()).configured===true;}catch{configured=false;}finally{clearTimeout(timer);}return configured;
  },
  async reply(context,{signal}={}){
   if(!configured)return null;
   const controller=new AbortController(),abort=()=>controller.abort();
   if(signal?.aborted)return null;signal?.addEventListener('abort',abort,{once:true});
   const timer=setTimeout(abort,15000);
   try{
    const response=await fetcher(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context}),signal:controller.signal});
    if(!response.ok)return null;const result=await response.json();
    return typeof result.text==='string'&&result.text.trim().length>=2&&result.text.length<=600?result.text.trim():null;
   }catch{return null;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
 };
}
