import {supplyConversationMemory} from './supply-story.js';
import {normalizeNpcAddress} from './identity.js';
import {socialIntent} from './social-reasoning.js';
import {npcNow,conversationExperience} from './npc-state.js';
// A semantic planner + small Korean clause grammar. No complete response lookup table.
const dialogueSubjects={
 yeogyeong:[
  {id:'checking',name:'확인을 멈추는 기준',subject:'확인을 멈출 때는',detail:['한 번 더 보는 것','다른 사람 눈으로 보는 것','틀린 부분만 표시해두는 것'],want:['나중에도 설명할 수 있으면 좋겠','내가 놓친 게 없었으면 좋겠','같이 보는 사람이 부담스럽지 않았으면 좋겠'],question:['선배는 어디까지 보면 됐다고 생각하세요?','같은 걸 다시 보면 더 헷갈릴 때 없어요?','맡겼으면 다시 안 보는 게 맞을까요?']},
  {id:'roles',name:'일을 나누는 방식',subject:'일을 나눌 때는',detail:['처음에 맡을 범위를 정하는 것','중간에 서로 묻는 것','끝낸 걸 다른 사람에게 넘기는 것'],want:['부탁하는 말부터 편하게 했으면 좋겠','확인하는 사람이 따로 있어도 괜찮았으면 좋겠','누가 뭘 맡았는지 서로 알았으면 좋겠'],question:['선배는 부탁받는 쪽이 편해요, 부탁하는 쪽이 편해요?','도와준다고 하면 어디까지 맡겨도 되는 걸까요?','자꾸 확인하면 못 믿는 것처럼 들릴까요?']}
 ],
 seoyeon:[
  {id:'rest',name:'쉬는 시간의 약속',subject:'쉬는 시간을 정할 때는',detail:['그냥 아무것도 안 하는 것','답장을 조금 늦게 하는 것','먼저 오늘은 어렵다고 말하는 것'],want:['쉬는 시간을 설명하지 않아도 됐으면 좋겠','만나는 게 할 일처럼 느껴지지는 않았으면 좋겠','혼자 있고 싶다는 말을 편하게 했으면 좋겠'],question:['선배는 약속 없는 시간이 생기면 뭐부터 해요?','혼자 있고 싶다는 말 들으면 서운할 것 같아요?','쉴 때도 뭘 해야 할 것 같은 때 없어요?']},
  {id:'taste',name:'취향과 선택',subject:'취향대로 고를 때는',detail:['늘 고르던 걸 다시 고르는 것','이름보다 안에 든 걸 보는 것','가끔 실패할 걸 알고 골라보는 것'],want:['남이 좋다는 것보다 내가 편한 걸 골랐으면 좋겠','고르는 데 시간을 너무 쓰지는 않았으면 좋겠','괜찮은 척하고 끝까지 버티지는 않았으면 좋겠'],question:['선배는 익숙한 걸 골라요, 새로운 걸 골라요?','별로인 걸 골랐을 때 끝까지 해보는 편이에요?','취향이 다르면 같이 고르는 게 더 어렵지 않아요?']}
 ],
 soyul:[
  {id:'photo',name:'사진을 고르는 기준',subject:'사진 한 장 고를 때는',detail:['처음 눈이 간 걸 남기는 것','잘 찍힌 이유를 적어보는 것','다른 사람한테 보여주기 전에 내가 고르는 것'],want:['왜 마음에 드는지 내 말로 설명할 수 있으면 좋겠','남이 좋다는 것만 남기지는 않았으면 좋겠','고르다 전부 지워버리지는 않았으면 좋겠'],question:['좋은 이유를 설명 못 해도 남겨도 될까요?','같은 장면을 봐도 눈에 들어오는 게 다르잖아요?','선배는 남한테 보여줄 때 뭘 먼저 말해요?']},
  {id:'speaking',name:'말을 꺼내는 타이밍',subject:'여럿이 이야기할 때는',detail:['말하기 전에 잠깐 기다리는 것','생각을 다 정리하기 전에 꺼내는 것','말을 놓쳤다고 다시 말하는 것'],want:['말이 늦어도 끝까지 말할 수 있으면 좋겠','다른 사람이 대신 정리해주기 전에 말했으면 좋겠','조용하다고 할 말 없는 건 아니란 걸 알았으면 좋겠'],question:['말하다 끊기면 다시 꺼내는 편이에요?','생각 정리 안 됐을 때도 그냥 말해요?','조용하면 불편하다고 느껴져요?']}
 ]
};
export function usesGeneratedDialogue(s){return s.dialogue?.engine==='generative'||s.dialogue?.engine!=='authored'&&s.academics?.enabled===true;}
function generationStore(s){
 s.dialogue.generation??={rng:(Math.floor(Math.random()*4294967295)||1),sequence:0,recent:{}};
 return s.dialogue.generation;
}
function dialogueRandom(store){let x=store.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;store.rng=x>>>0||1;return store.rng/4294967296;}
function selectDialoguePart(store,items){return items[Math.floor(dialogueRandom(store)*items.length)];}
function weightedDialoguePart(store,items){let cursor=dialogueRandom(store)*items.reduce((n,x)=>n+x.weight,0);for(const item of items){cursor-=item.weight;if(cursor<0)return item.value;}return items.at(-1).value;}
function generatedMemory(s,id){
 const facts=s.dialogue.facts?.[id]??{};
 const candidates=[];
 if(facts.coffee)candidates.push({id:'coffee',text:facts.coffee==='black'?'안 단 커피가 좋다고 했죠.':'단 걸 좋아한다고 했죠.'});
 if(facts.photo)candidates.push({id:'photo',text:'전에 같이 사진을 본 적도 있으니까요.'});
 if(s.dialogue.generation?.sharedWork?.includes(id))candidates.push({id:'shared-work-story',text:'선배도 자기 이야기를 곡으로 남기고 싶다고 했잖아요.'});
 const lunch=Object.values(s.rainLunch?.episodes??{}).findLast(r=>r.person===id&&r.status==='completed'&&r.walked);
 if(lunch)candidates.push({id:'rain-lunch',text:lunch.ate?'비 오던 날 식당까지 같이 가서 밥 먹었잖아요.':'비 오던 날 식당까지 같이 걸었던 것도 생각나네요.'});
 const sharedSupply=supplyConversationMemory(s,id);if(sharedSupply)candidates.push({id:'supply-group-memory',text:sharedSupply});
 const work=Object.values(s.activitySessions?.records??{}).findLast(r=>r.status==='completed'&&r.routeId==='volunteer');
 if(id==='yeogyeong'&&work&&!work.supplyGroup)candidates.push({id:'volunteer',text:work.choices.some(c=>c.id==='carry')?'같이 상자 옮기면서 통로부터 비웠잖아요.':'같이 물품 수량을 맞춰봤잖아요.'});
 return candidates;
}
export function generateDialogueTurn(s,id,{action='greet',topic=null,playerLine='',turn=0,prompt='',focus=null}={}){
 const store=generationStore(s),status=npcNow(s,id);
 const intentState=socialIntent(s,id),safe=intentState.feelsSafe;
 const guarded=intentState.mode==='guarded';
 const previous=store.recent[id]??[],subjects=[...dialogueSubjects[id]];
 const sharedLunch=Object.values(s.rainLunch?.episodes??{}).findLast(r=>r.person===id&&r.status==='completed'&&r.walked);
 if(sharedLunch)subjects.push({id:'shared-lunch',name:'비 오는 점심시간에 함께한 일',subject:'아까 함께 걸을 때는',detail:[sharedLunch.choices.includes('rush')?'같이 가는 속도를 먼저 맞추는 것':'말이 없어도 같이 걸어보는 것',sharedLunch.ate?'앉을 자리를 서로 물어보는 것':'시간이 짧아도 잠깐 인사하는 것','각자 할 일로 돌아갈 시간을 존중하는 것'],want:['다음에도 부담 없이 인사할 수 있으면 좋겠','같이 있다고 계속 말해야 한다고 생각하지 않았으면 좋겠','바쁜 날에는 짧게 봐도 괜찮았으면 좋겠'],question:['평소에도 점심 먹고 바로 하던 일로 돌아가요?','잠깐 걷는 동안에도 좀 쉬어진 느낌 들지 않았어요?','다음 수업까지 시간은 괜찮아요?']});
 const groundedTopic=action==='greet'&&prompt?(/식당|점심|밥/.test(prompt)&&sharedLunch?'shared-lunch':/계산|영수증|수량/.test(prompt)?'checking':/사진|문구|인쇄/.test(prompt)?'photo':/커피|맛|컵/.test(prompt)?'taste':null):null;
 const subject=subjects.find(t=>t.id===(groundedTopic??topic))??selectDialoguePart(store,subjects);
 const memories=generatedMemory(s,id);
 // Sample a speech act first, then a proposition/detail/question; never an entire answer.
 const candidates=guarded?[{value:'boundary',weight:1}]:status.rushed?[{value:'defer',weight:1}]:[
  {value:'reflect',weight:safe?3:1},
  {value:'ask-back',weight:status.bandwidth==='open'?4:1},
  {value:status.bandwidth==='limited'?'limit':'wonder',weight:status.bandwidth==='limited'?6:2},
  ...(safe?[{value:'disclose',weight:3}]:[])
 ];
 const acknowledgments={
  greet:['아, 네.','잠깐만요.','아, 선배.'],
  listen:['그렇게 들어주시니까 말하기는 좀 편하네요.','말로 꺼내보니까 조금 다르게 들리네요.','바로 답을 정해주지 않아서 좋아요.'],
  why:['왜 그러냐고 하면…','저도 그게 좀 궁금했어요.','잘 설명할 수 있을지는 모르겠는데요.'],
  suggest:['그렇게 해볼 수도 있겠네요.','그 말은 조금 생각해보고 싶어요.','바로 그러겠다고는 못 하겠는데, 무슨 뜻인지는 알겠어요.'],
  share:['그런 마음으로 작업하는 거군요.','선배 얘기 들으니까 조금 연결되는 게 있네요.','처음부터 잘 들려줘야 한다고 생각하면 힘들겠네요.'],
  switch:['다른 얘기 해도 좋아요.','잠깐 화제를 바꿔볼까요.','그럼 이 얘기는 잠깐 내려놓고요.'],
  about:['아, 전공이요?','아직 그 얘기를 안 했네요.','저는요,'],
  introduce:['아, 이제 알겠어요.','그렇군요. 알려줘서 고마워요.','이름만 듣고는 몰랐어요.'],
  leave:['네, 나중에 봬요.','오늘은 여기까지 얘기해요.','들어줘서 고마워요.']
 };
 let chosen;
 for(let attempt=0;attempt<24;attempt++){
  const intent=action==='leave'?'close':weightedDialoguePart(store,candidates);
  const detail=action==='why'&&focus?.topic===subject.id?focus.detail:selectDialoguePart(store,subject.detail),want=selectDialoguePart(store,subject.want),question=selectDialoguePart(store,subject.question);
  const acknowledgment=selectDialoguePart(store,acknowledgments[action]??acknowledgments.greet);
  let clauses=[acknowledgment],memory=null;
  if(intent==='close')clauses.push(selectDialoguePart(store,['다음에는 선배 얘기도 들어요.','붙잡지는 않을게요.','하던 일 마저 하고 갈게요.']));
  else if(intent==='defer'){
   clauses.push(`${status.next??'다음 일정'}에 가야 해서 지금은 길게 말하기 어려워요.`);
   clauses.push(selectDialoguePart(store,['인사만 하고 나중에 이어가도 될까요?','급한 얘기면 하나만 듣고 갈게요.','나중에 시간 있을 때 다시 말 걸어주세요.']));
  }else if(intent==='boundary')clauses.push(selectDialoguePart(store,['지금은 제 생각을 더 설명하고 싶지 않아요.','지금 바로 편하게 얘기하기는 어려워요.','그 얘기를 아무 일 없던 것처럼 넘기지는 못하겠어요.']),selectDialoguePart(store,['조금 시간을 주세요.','오늘은 여기까지만 하면 좋겠어요.']));
  else {
   if(intent==='limit')clauses.push(status.fatigue>=50?'오늘은 좀 지쳐서 길게 대답하기가 어렵네요.':'지금은 머릿속이 복잡해서 하나씩만 이야기하고 싶어요.');
   if(intent==='reflect'||intent==='disclose')clauses.push(selectDialoguePart(store,[`${subject.subject} ${detail}부터 해보면 어떨까 싶어요.`,`${subject.subject} ${detail} 정도면 시작할 수 있지 않을까요?`,`${subject.subject} ${detail}도 방법이겠지만, 그게 늘 편한 건 아닐 것 같아요.`]));
   if(intent==='wonder')clauses.push(`${subject.subject} ${detail}부터 해보는 게 나을까요? 생각만 하고 아직 결론은 못 내렸어요.`);
   if(intent==='disclose')clauses.push(`${want}어요. 말처럼 쉽지는 않지만요.`);
   if(intent==='ask-back')clauses.push(selectDialoguePart(store,[`${subject.subject} 저는 ${detail} 쪽으로 마음이 가요.`,`${subject.subject} ${detail}부터 생각하게 돼요. 선배는 다를 수도 있겠지만요.`,`${subject.subject} ${detail} 말고도 다른 방법이 있을 것 같기는 해요.`]));
   if(action==='why')clauses.push(`그러면 ${want.replace(/좋겠$/, '좋을 것 같')}아서요.`);
   if(memories.length&&dialogueRandom(store)<0.45){memory=selectDialoguePart(store,memories);clauses.push(memory.text);}
   if(intent!=='limit'||safe)clauses.push(question);
   else clauses.push(selectDialoguePart(store,['지금은 가벼운 얘기면 좋겠어요.','조금 정리하고 다시 이야기하면 안 될까요?']));
  }
  if(id==='soyul'&&dialogueRandom(store)<0.6)clauses[0]='…'+clauses[0];
  const ownMajor={yeogyeong:'간호학과',seoyeon:'치위생과',soyul:'치위생과'}[id];
  const requiredPrefix=action==='about'?`저는 ${ownMajor} 다녀요. `:'';
  const text=requiredPrefix+normalizeNpcAddress(s,id,clauses.join(' '));
  const signature=[intent,subject.id,detail,want,question,memory?.id??'',acknowledgment].join('|');
  chosen={text,requiredPrefix,intent,topic:subject.id,topicName:subject.name,detail,memoryIds:memory?[memory.id]:[],signature};
  if(!previous.some(p=>p.text===text||p.signature===signature))break;
 }
 const closed=action==='leave';
 const limited=['boundary','defer'].includes(chosen.intent);
 const available=limited?[
  {id:'listen',kind:'listen',label:'알겠어요. 지금은 붙잡지 않을게요.'}
 ]:[
  {id:'listen',kind:'listen',label:'그 얘기 조금 더 들어도 돼요?'},
  {id:'why',kind:'why',label:'어떤 점 때문에 그렇게 생각했어요?'},
  {id:'suggest',kind:'suggest',label:'바로 결정하지 말고, 작은 것부터 해보는 건 어때요?'},
  {id:'share',kind:'share',label:'나도 내 이야기를 곡으로 남기려는데, 어떻게 전할지 고민해요.'},
  {id:'switch',kind:'switch',label:'그 얘기는 잠깐 두고, 다른 이야기도 해볼까요?'}
 ];
 if(!s.contacts[id]?.playerSeniorityKnown&&!limited)available.push({id:'introduce',kind:'introduce',label:'저는 스물셋이고 보컬 전공 2학년이에요. 군대 다녀와서 복학했어요.'});
 if(!s.contacts[id]?.details?.major&&!limited)available.push({id:'about',kind:'about',label:'그러고 보니 어느 과 다녀요? 아직 못 물어봤네요.'});
 const options=[];
 const pool=[...available];while(pool.length&&options.length<(limited?1:2)){const index=Math.floor(dialogueRandom(store)*pool.length);options.push(pool.splice(index,1)[0]);}
 options.push({id:'leave',kind:'leave',label:'그럼 다음에 또 이야기해요.'});
 store.sequence++;store.recent[id]=[...previous,{text:chosen.text,signature:chosen.signature}].slice(-16);
 const response={person:id,day:s.day,phase:s.phase,minute:status.minute,choice:'gen:'+action,playerLine,text:chosen.text,stage:status.cue,scene:true,leave:closed,generated:true,requiredPrefix:chosen.requiredPrefix,plan:chosen,options:closed?[]:options,turnId:store.sequence};
 const session={generated:true,closed,finished:false,node:'generated',turn:turn+1,topic:chosen.topic,response};
 s.dialogue.sessions??={};s.dialogue.sessions[`${s.day}:${s.phase}:${id}`]=session;
 s.dialogue.generatedVisits??={};s.dialogue.generatedVisits[id]={day:s.day,minute:status.minute};
 s.dialogue.history.push(response);
 return response;
}
export function advanceGeneratedDialogue(s,id,choice){
 const session=s.dialogue.sessions?.[`${s.day}:${s.phase}:${id}`];
 const option=session?.response.options.find(o=>o.id===choice);
 if(!session?.generated||session.closed||!option)throw new Error('현재 대화에서 고를 수 없는 말입니다.');
 const store=generationStore(s);
 if(option.kind==='about'){s.contacts[id].details??={};s.contacts[id].details.major={yeogyeong:'간호학과',seoyeon:'치위생과',soyul:'치위생과'}[id];}
 if(option.kind==='introduce')s.contacts[id].playerSeniorityKnown=true;
 if(option.kind==='share'){store.sharedWork??=[];if(!store.sharedWork.includes(id))store.sharedWork.push(id);}
 // Semantics govern effects; random wording never changes rewards or creates facts.
 const award=`generated:${s.day}:${id}:${option.kind}`;s.dialogue.generatedAwards??={};
 let delta={};if(!s.dialogue.generatedAwards[award]){
  delta=option.kind==='listen'?{trust:1}:option.kind==='share'?{familiarity:1}:{};
  conversationExperience(s,id,option.kind==='listen'?'space':option.kind==='share'?'share':option.kind,award);s.dialogue.generatedAwards[award]=true;
 }
 const limited=['boundary','defer'].includes(session.response.plan.intent);
 const action=limited?'leave':option.kind;
 return {result:generateDialogueTurn(s,id,{action,topic:option.kind==='switch'?dialogueSubjects[id].find(t=>t.id!==session.topic).id:session.topic,playerLine:option.label,turn:session.turn,focus:session.response.plan}),delta};
}
export function canGenerateReencounter(s,id){
 if(!usesGeneratedDialogue(s))return false;
 const last=s.dialogue.generatedVisits?.[id];
 return !!last&&((s.day-last.day)*1440+(s.clock?.minute??780)-last.minute)>=30;
}
