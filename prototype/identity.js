export const clubRoster=['yeogyeong','seoyeon','soyul'];
// Canonical identities stay internal; player-facing labels come from learned facts.
export const identities={
 seoyeon:{name:'한서연',given:'서연',description:'단발머리 학생'},
 yeogyeong:{name:'차여경',given:'여경',description:'수첩을 정리하는 학생'},
 soyul:{name:'박소율',given:'소율',description:'사진을 살펴보는 학생'}
};
export function contact(s,id){return {seen:false,nameLevel:'unknown',introduced:false,playerNameKnown:false,playerSeniorityKnown:false,asked:false,approaches:0,sources:[],...s.contacts?.[id]};}
export function displayName(s,id){
 const p=identities[id];if(!p)return id==='taei'?'김태이':'학생';
 const c=contact(s,id);return c.nameLevel==='full'?p.name:c.nameLevel==='given'?p.given:p.description;
}
export function learnIdentity(s,id,source,level='full'){
 if(!identities[id])throw new Error('알 수 없는 인물입니다.');
 s.contacts??={};const c=contact(s,id);
 if(c.nameLevel!=='full')c.nameLevel=level;
 if(!c.sources.some(x=>x.source===source&&x.day===(s.day??1)))c.sources.push({source,day:s.day??1,phase:s.phase});
 s.contacts[id]=c;return s;
}
export function introduce(s,id,source='self-introduction'){
 learnIdentity(s,id,source);s.contacts[id].introduced=true;s.contacts[id].playerNameKnown=true;if(source==='relationship-demo')s.contacts[id].playerSeniorityKnown=true;s.contacts[id].seen=true;return s;
}
export function seePeople(s,ids){s.contacts??={};for(const id of ids)s.contacts[id]={...contact(s,id),seen:true,lastSeen:{day:s.day,minute:s.clock?.minute??780,location:s.location}};return s;}
export function presentationText(s,text){
 let result=String(text??'').replaceAll('학생회관','자유관').replaceAll('음악 연습동','음악관').replaceAll('강의동','은혜관');
 for(const [id,p] of Object.entries(identities)){
  const label=displayName(s,id);
  if(label!==p.name)result=result.replaceAll(p.name,label);
  if(contact(s,id).nameLevel==='unknown'){
   result=result.replaceAll(p.given+' 씨',label).replaceAll(p.given,label);
  }
 }
 return result;
}
export function firstContact(s,id){
 const c=contact(s,id),p=identities[id];
 if(c.asked)return {intro:true,opening:{seoyeon:'성함은요? 제가 제 이름만 말했네요.',yeogyeong:'성함 여쭤봐도 돼요? 아직 제대로 인사를 못 드렸죠.',soyul:'성함이… 어떻게 되세요?'}[id],stage:'자기소개를 들었다. 아직 서로 인사를 마친 사이는 아니다.',options:[{id:'intro:introduce',label:'김태이예요. 이번에 복학해서 아직 낯선 얼굴이 많네요.'},{id:'intro:leave',label:'아, 지금은 일이 있어서요. 다음에 제대로 인사할게요.'}]};
 return {intro:true,opening:{seoyeon:'안녕하세요. 혹시 뭐 찾으세요?',yeogyeong:'아, 잠시만요. 이것만 적고… 네, 무슨 일이세요?',soyul:'아… 안녕하세요.'}[id],stage:c.approaches>1?'시선이 다시 마주친다. 아직 서로 이름을 소개하지 않았다.':{seoyeon:'단발머리 학생이 고개를 들어 눈을 맞춘다.',yeogyeong:'수첩을 펼쳐놓은 학생이 펜을 잠시 내려놓는다.',soyul:'사진을 보던 학생이 휴대폰을 조금 내린다.'}[id],options:[{id:'intro:greet',label:c.nameLevel==='unknown'?'안녕하세요. 혹시 봉사단 분이세요?':`${displayName(s,id)} 씨 맞으세요? 저는 아직 인사를 못 드렸네요.`},{id:'intro:leave',label:'지금 바빠 보이네. 나중에 말을 걸자.'}]};
}
export function respondIntroduction(state,id,choice){
 const d=firstContact(state,id);if(!d.options.some(o=>o.id===choice))throw new Error('지금 할 수 없는 인사입니다.');
 const s=structuredClone(state);s.contacts??={};s.contacts[id]=contact(s,id);let text;
 if(choice==='intro:greet'){
  learnIdentity(s,id,'self-introduction');s.contacts[id].asked=true;
  text={seoyeon:'네, 맞아요. 저는 한서연이에요. 저희 제대로 인사하는 건 처음이죠?',yeogyeong:'네. 저는 차여경이에요. 봉사단 재무 맡고 있어요. 혹시 이번 활동 때문에 오셨어요?',soyul:'네… 박소율이에요. 오늘 처음 오신 거예요?'}[id];
 }else if(choice==='intro:introduce'){
  introduce(s,id);text={seoyeon:'아, 태이 선배. 저는 여기서 준비하고 있었어요. 아직 시간 있으시면 잠깐 이야기해도 되고요.',yeogyeong:'김태이 선배… 네, 기억할게요. 저는 여기서 물품 확인하고 있었어요.',soyul:'아, 네. 태이 선배. 저는 사진 고르고 있었어요. 잠깐 보고 가셔도 돼요.'}[id];
  s.memory.push(`[${s.day??1}일차] ${identities[id].name}과 서로 이름을 소개했다.`);
 }else text='짧게 고개를 끄덕이고 자리를 비켜준다.';
 const result={person:id,day:s.day??1,phase:s.phase,choice,playerLine:d.options.find(o=>o.id===choice).label,text,stage:choice==='intro:greet'?'이름을 직접 들었다.':choice==='intro:introduce'?'서로 이름을 알게 됐다.':'아직 더 묻지는 않기로 했다.',leave:choice==='intro:leave'};
 result.text=normalizeNpcAddress(s,id,result.text);s.dialogue.history.push(result);return {state:s,result};
}
export function hearGroupLine(s,line){
 // Only a name audibly addressed to the other visible speaker is linked to a face.
 if(line.person==='seoyeon'&&/^소율아/.test(line.text))learnIdentity(s,'soyul','overheard-address','given');
 if(line.person==='soyul'&&/서연아/.test(line.text))learnIdentity(s,'seoyeon','overheard-address','given');
 return s;
}

export function normalizeNpcAddress(s,id,text){if(contact(s,id).playerSeniorityKnown)return String(text??'');const address=contact(s,id).playerNameKnown?'태이 씨':'그쪽';return String(text??'').replace(/(?:김태이|태이)\s*선배(?:님)?/g,address).replace(/선배(?:님)?/g,address);}
