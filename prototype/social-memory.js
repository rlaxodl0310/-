import {contact,identities} from './identity.js';
import {presentPeople} from './days.js';

export function socialState(s){
 s.social??={facts:[],knowledge:{},shares:[],decisions:{},heardByPlayer:[]};return s.social;
}
function socialRelation(s,from,to){return {trust:0,familiarity:0,tension:0,...s.relations[`${from}>${to}`]};}
export function addSocialFact(s,fact){
 const social=socialState(s);if(social.facts.some(f=>f.id===fact.id))return;
 social.facts.push({day:s.day,phase:s.phase,privacy:'public',subject:'taei',...fact});
 for(const witness of fact.witnesses??[])rememberSocialFact(s,witness,fact.id,'direct',witness);
}
function rememberSocialFact(s,listener,factId,via,source){
 const social=socialState(s);social.knowledge[listener]??=[];
 if(social.knowledge[listener].some(k=>k.factId===factId))return false;
 social.knowledge[listener].push({factId,via,source,day:s.day,phase:s.phase});return true;
}
export function socialOpinion(s,id){
 const social=s.social??{facts:[],knowledge:{}};
 const known=social.knowledge[id]??[];
 const missed=known.filter(k=>k.via==='heard'&&social.facts.find(f=>f.id===k.factId)?.type==='missed');
 const incidents=new Set(missed.map(k=>{const fact=social.facts.find(f=>f.id===k.factId);return fact.incidentId??fact.id;}));
 const ownKept=known.some(k=>k.via==='direct'&&social.facts.find(f=>f.id===k.factId)?.type==='kept')||(s.appointments??[]).some(a=>a.person===id&&a.status==='kept');
 const ownTrust=socialRelation(s,id,'taei').trust;
 return {cautious:incidents.size>=2&&!ownKept&&ownTrust<6,verify:missed.length>0,ownKept};
}
export function updateSocialWorld(before,after){
 const s=structuredClone(after);socialState(s);
 if(s.day===1&&s.dialogue?.facts?.soyul?.photo&&!before.dialogue?.facts?.soyul?.photo)
  addSocialFact(s,{id:`photo-talk:${s.day}`,type:'photo-talk',witnesses:['soyul']});
 if(s.day===2&&s.choice==='review'&&before.choice!=='review')
  addSocialFact(s,{id:'photo-work:2',type:'photo-work',witnesses:['soyul']});
 const newLines=(s.dialogue?.history??[]).slice(before.dialogue?.history?.length??0);
 if(newLines.some(h=>h.person==='soyul'&&h.day===2&&h.choice==='scene:ask'))
  addSocialFact(s,{id:'private-draft:2',type:'private-draft',privacy:'private',witnesses:['soyul']});
 for(const a of s.appointments??[]){
  const prior=(before.appointments??[]).find(x=>a.id?x.id===a.id:x.person===a.person&&x.day===a.day&&x.activity===a.activity);
  if(a.person&&['kept','broken'].includes(a.status)&&prior?.status==='pending')
   addSocialFact(s,{id:`commitment:${a.person}:${a.day}:${a.activity??'meeting'}`,day:a.day,incidentId:a.activity?`activity:${a.day}:${a.activity}`:`meeting:${a.person}:${a.day}`,privacy:a.kind==='meeting'?'private':'public',type:a.status==='kept'?'kept':'missed',witnesses:[a.person]});
 }
 for(const [id,status] of Object.entries(s.dialogue?.promises??{}))if(before.dialogue?.promises?.[id]==='pending'&&['kept','broken'].includes(status))
  addSocialFact(s,{id:`commitment:${id}:${s.day}:volunteer`,incidentId:`activity:${s.day}:volunteer`,type:status==='kept'?'kept':'missed',witnesses:[id]});
 const changed=before.day!==s.day||before.phase!==s.phase||Math.floor((before.clock?.minute??780)/30)!==Math.floor((s.clock?.minute??780)/30);
 if(changed)return shareSocialFacts(s);
 return s;
}
export function shareSocialFacts(state){
 const s=structuredClone(state),social=socialState(s);
 // Only firsthand witnesses can pass this prototype's reports on; no unlimited rumour cascade.
 for(const fact of social.facts)for(const source of fact.witnesses??[])for(const listener of Object.keys(s.npcs)){
  if(source===listener)continue;
  const key=`${fact.id}:${source}:${listener}`;
  if(social.decisions[key])continue;
  const together=['hall','library','cafe'].some(place=>{const ids=presentPeople(s,place);return ids.includes(source)&&ids.includes(listener);});
  const friend=socialRelation(s,source,listener),mutual=socialRelation(s,listener,source);
  const messaging=friend.trust>=8&&friend.familiarity>=8;
  if(!together&&!messaging)continue;
  if(fact.privacy==='private'){social.decisions[key]='kept-private';continue;}
  // Soyul shares experiences with a trusted friend; Yeogyeong shares scheduling concerns at work.
  const willing=source==='soyul'?friend.trust>=8&&friend.tension<3:source==='yeogyeong'?['kept','missed','photo-work'].includes(fact.type)&&together&&friend.tension<3:friend.trust>=4&&friend.tension<3;
  if(!willing)continue;
  if(mutual.tension>=4){social.decisions[key]='not-received';continue;}
  if(rememberSocialFact(s,listener,fact.id,'heard',source))social.shares.push({factId:fact.id,source,listener,day:s.day,phase:s.phase,channel:together?'conversation':'message'});
  social.decisions[key]='shared';
 }
 return s;
}
export function socialNews(state,id){
 const s=structuredClone(state),social=socialState(s);
 if(!contact(s,id).introduced)return {state:s,news:null};
 const candidates=(social.knowledge[id]??[]).filter(k=>k.via==='heard'&&!social.heardByPlayer.includes(`${id}:${k.factId}`));
 const k=candidates.findLast(k=>social.facts.find(f=>f.id===k.factId)?.type==='missed')??candidates.at(-1);
 if(!k)return {state:s,news:null};
 const fact=social.facts.find(f=>f.id===k.factId);if(!fact||fact.privacy==='private')return {state:s,news:null};
 const source=identities[k.source].name,listener=identities[id].name,opinion=socialOpinion(s,id);
 const text=fact.type==='photo-talk'?`${source}한테 들었어요. 같이 사진 보면서 이야기했다면서요. 어떤 사진이었는지 궁금하더라고요.`:fact.type==='photo-work'?`${source}한테 들었어요. 사진 정리 같이 해줬다면서요. 정리한 파일도 보냈다던데, 준비는 어땠어요?`:fact.type==='kept'?`${source}가 약속대로 와줘서 도움이 됐다고 하더라고요. 저는 그 자리에 없었지만요.`:opinion.ownKept?`${source}한테 약속이 어긋났다는 이야기는 들었어요. 그래도 저랑 한 약속은 지켰잖아요. 무슨 일이었는지는 직접 듣고 싶어요.`:opinion.cautious?`${source}한테 일정이 몇 번 어긋났다고 들었어요. 제가 직접 본 건 아니니까 단정하진 않을게요. 같이 준비하는 일은 시간부터 확실히 맞추고 싶어요.`:`${source}한테 그날 약속에 못 왔다는 이야기를 들었어요. 제가 직접 본 건 아니고요. 무슨 일이 있었어요?`;
 social.heardByPlayer.push(`${id}:${fact.id}`);
 const label=`${listener}에게 전해 들음: ${source}와의 ${fact.type.startsWith('photo')?'사진 이야기':fact.type==='kept'?'약속 이행':'약속 불참 이야기'}`;
 if(!s.known.includes(label))s.known.push(label);
 s.memory.push(`[${s.day}일차] ${label}. 상대도 직접 목격한 사실이 아니라 전해 들은 이야기라고 밝혔다.`);
 return {state:s,news:{text,source:k.source,factId:fact.id,stage:'상대가 다른 사람에게 전해 들은 이야기를 꺼낸다.'}};
}
