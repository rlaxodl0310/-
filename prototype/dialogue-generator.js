import {supplyAftermathMemory} from './supply-aftermath.js';
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
// Small everyday exchanges use concrete observations, not abstract advice on every visit.
const everydaySubjects={
 yeogyeong:[
  {id:'lunch',name:'점심 메뉴',subject:'점심을 고를 때는',detail:['줄 짧은 쪽으로 가는 것','메뉴부터 보고 결정하는 것','먹고 싶은 걸 먼저 정하는 것'],want:['밥 먹는 시간까지 급하지 않았으면 좋겠'],question:['점심은 먹었어요?'],observations:['메뉴 사진은 괜찮아 보이는데, 줄이 더 궁금하네요.','아까부터 메뉴만 보고 있어요. 고르는 게 제일 오래 걸려요.','오늘은 따뜻한 거 먹고 싶어요. 아직 뭘 먹을지는 못 정했고요.'],continuations:['빨리 먹으려다가 고르는 데 시간을 다 쓰겠어요.','이러다 그냥 늘 먹던 걸 고를 것 같아요.','같이 먹자는 건 아니고, 메뉴 참고 좀 하려고요.'],answers:[{label:'아직 못 먹었어요. 메뉴부터 보려고요.',reply:['그럼 저랑 똑같네요. 사진 말고 실물이 보고 싶은데.','아직이면 서두를 필요는 없겠네요. 저도 조금 더 보려고요.']},{label:'밥은 먹었는데 따뜻한 음료가 생각나요.',reply:['밥 먹고 나면 또 마실 게 생각나죠.','따뜻한 거요? 오늘은 그쪽이 더 당길 수도 있겠네요.']}]},
  {id:'bag',name:'가방 속 정리',subject:'짐을 챙길 때는',detail:['필요한 것만 따로 꺼내두는 것','가방 칸을 나누는 것','자주 쓰는 걸 앞에 두는 것'],want:['찾는 데 시간을 덜 썼으면 좋겠'],question:['가방 정리 자주 해요?'],observations:['펜을 찾으면 꼭 가방 맨 밑에 있어요. 분명 앞에 넣었는데.','가방은 무거운데 정작 꺼내려는 건 안 보여요.','필요 없는 종이부터 빼야겠어요. 챙길 때는 다 필요해 보였는데.'],continuations:['다 꺼내면 다시 넣는 게 일이겠죠.','오늘은 집에 가면 진짜 정리하려고요.','지금 웃었죠? 저도 좀 웃기긴 해요.'],answers:[{label:'필요할 때 못 찾으면 그제야 정리해요.',reply:['그거 딱 저인데요. 못 찾을 때만 급해져요.','저만 그런 줄 알았어요. 정리해야겠다는 생각은 자주 하는데.']},{label:'자주 쓰는 건 같은 자리에 넣어둬요.',reply:['자리부터 정해야겠네요. 전 빈 데 있으면 그냥 넣어서.','그게 낫겠어요. 매번 다른 칸에 넣는 게 문제인가 봐요.']}]}
 ],
 seoyeon:[
  {id:'lunch',name:'공강의 점심',subject:'공강에 먹을 걸 고를 때는',detail:['가까운 데서 먹는 것','붐비는 시간을 피하는 것','앉을 곳부터 보는 것'],want:['조금 천천히 먹었으면 좋겠'],question:['공강이 짧으면 어디서 쉬어요?'],observations:['공강이 생겨도 멀리 가기는 애매하네요. 돌아오면 바로 수업이라서.','앉아 있으면 금방 시간이 가요. 뭐 한 것도 없는데.','뭘 먹을지보다 앉을 곳부터 보게 돼요. 잠깐이라도 쉬려고요.'],continuations:['그래도 서서 기다리는 것보다는 나아요.','오늘은 너무 꽉 채워서 움직이고 싶진 않네요.','빈 시간까지 계획대로 쓸 필요는 없겠죠.'],answers:[{label:'가까운 데 앉아서 잠깐 음악 들어요.',reply:['좋네요. 한두 곡 듣고 나면 바로 돌아갈 수도 있고.','그 정도면 딱 쉬었다는 느낌 나겠어요.']},{label:'할 일이 없으면 그냥 일찍 강의실에 가요.',reply:['자리 잡아두면 마음은 편하겠네요.','저도 다음 강의실이 가까우면 그냥 들어가 있어요.']}]},
  {id:'drink',name:'음료 고르기',subject:'음료를 고를 때는',detail:['익숙한 맛을 고르는 것','덜 단 걸 찾는 것','천천히 마실 수 있는 걸 고르는 것'],want:['끝까지 맛있게 마셨으면 좋겠'],question:['새 메뉴 나오면 바로 마셔보는 편이에요?'],observations:['새 메뉴 이름이 길어서 주문할 때 한번 읽어봤어요.','사진은 맛있어 보이는데 너무 달면 남길 것 같아요.','오늘은 고르기 귀찮아서 아는 걸로 시킬까 해요.'],continuations:['고민해 놓고 결국 늘 마시던 거면 조금 웃기죠.','막상 주문하면 다른 게 궁금해질 수도 있고요.','실패하면 다음번에는 안 고르면 되니까요.'],answers:[{label:'궁금하면 한번은 마셔봐요.',reply:['그럼 실패한 메뉴도 좀 있겠네요. 그래도 고르는 재미는 있겠다.','저도 사진에 속는 셈 치고 가끔 골라요.']},{label:'대부분 마시던 걸 다시 골라요.',reply:['편하긴 하죠. 어떤 맛인지 이미 아니까.','그럼 고민하는 시간은 덜 들겠네요.']}]}
 ],
 soyul:[
  {id:'lunch',name:'점심 사이의 틈',subject:'점심시간에는',detail:['조용한 자리를 찾는 것','붐비기 전에 먹는 것','잠깐 바깥을 걷는 것'],want:['좀 천천히 움직였으면 좋겠'],question:['사람 많은 데는 괜찮아요?'],observations:['사람 빠지면 움직이려고요. 지금은 좀 복잡해서.','밥 먹고 바로 들어가기는 아쉬워서 잠깐 서 있었어요.','아까는 줄이 길었는데, 지금은 조금 나아졌네요.'],continuations:['싫다는 건 아니고, 말소리가 겹치면 잘 안 들려요.','조금만 기다렸다 가도 될 것 같아요.','오래 있을 건 아니에요. 그냥 잠깐.'],answers:[{label:'괜찮긴 한데 조용한 곳이 더 편해요.',reply:['저도요. 이야기할 때 목소리 안 높여도 되니까.','그렇죠. 사람 많으면 그냥 빨리 나가고 싶어져요.']},{label:'붐벼도 볼일 있으면 그냥 들어가요.',reply:['전 앞에서 한번 멈추게 되더라고요. 들어가긴 하는데.','그런 건 좀 부러워요. 망설이는 시간은 덜 들겠네요.']}]},
  {id:'reading',name:'읽다 멈춘 이야기',subject:'이야기를 읽을 때는',detail:['마음에 걸린 부분을 다시 읽는 것','결말까지 먼저 보는 것','잠깐 덮어두는 것'],want:['바로 좋고 싫음을 정하지 않았으면 좋겠'],question:['결말이 마음에 안 들면 다시 보기도 해요?'],observations:['다 읽었는데 한 장면이 계속 걸려요. 별 장면도 아닌데.','끝까지 보고 나니까 처음 부분이 조금 다르게 보이네요.','읽다 멈췄어요. 재미없는 건 아닌데, 지금은 잘 안 들어와서.'],continuations:['누가 뜻을 설명해주면 오히려 다르게 느낄 수도 있고요.','맞는 해석이 있는지는 모르겠어요.','말로 옮기려니까 생각보다 어렵네요.'],answers:[{label:'다시 보면 놓쳤던 이유가 보일 때가 있어요.',reply:['그럴 것 같아요. 처음에는 결말만 신경 썼으니까.','그럼 조금 두고 다시 봐야겠네요. 지금이랑 다를 수도 있으니까.']},{label:'마음에 안 드는 결말도 여운은 남더라고요.',reply:['맞아요. 싫었던 게 더 오래 생각나기도 해요.','좋아하는 거랑 계속 생각나는 건 다른가 봐요.']}]}
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
 const after=supplyAftermathMemory(s,id);if(after)candidates.push({id:'supply-aftermath-memory',text:after});
 const sharedSupply=supplyConversationMemory(s,id);if(sharedSupply)candidates.push({id:'supply-group-memory',text:sharedSupply});
 const work=Object.values(s.activitySessions?.records??{}).findLast(r=>r.status==='completed'&&r.routeId==='volunteer');
 if(id==='yeogyeong'&&work&&!work.supplyGroup)candidates.push({id:'volunteer',text:work.choices.some(c=>c.id==='carry')?'같이 상자 옮기면서 통로부터 비웠잖아요.':'같이 물품 수량을 맞춰봤잖아요.'});
 return candidates;
}
export function generateDialogueTurn(s,id,{action='greet',topic=null,playerLine='',turn=0,prompt='',focus=null}={}){
 const store=generationStore(s),status=npcNow(s,id);
 const intentState=socialIntent(s,id),safe=intentState.feelsSafe;
 const guarded=intentState.mode==='guarded';
 const previous=store.recent[id]??[],subjects=[...dialogueSubjects[id],...everydaySubjects[id]];
 const sharedLunch=Object.values(s.rainLunch?.episodes??{}).findLast(r=>r.person===id&&r.status==='completed'&&r.walked);
 if(sharedLunch)subjects.push({id:'shared-lunch',name:'비 오는 점심시간에 함께한 일',subject:'아까 함께 걸을 때는',detail:[sharedLunch.choices.includes('rush')?'같이 가는 속도를 먼저 맞추는 것':'말이 없어도 같이 걸어보는 것',sharedLunch.ate?'앉을 자리를 서로 물어보는 것':'시간이 짧아도 잠깐 인사하는 것','각자 할 일로 돌아갈 시간을 존중하는 것'],want:['다음에도 부담 없이 인사할 수 있으면 좋겠','같이 있다고 계속 말해야 한다고 생각하지 않았으면 좋겠','바쁜 날에는 짧게 봐도 괜찮았으면 좋겠'],question:['평소에도 점심 먹고 바로 하던 일로 돌아가요?','잠깐 걷는 동안에도 좀 쉬어진 느낌 들지 않았어요?','다음 수업까지 시간은 괜찮아요?']});
 const groundedTopic=action==='greet'&&prompt?(/식당|점심|밥/.test(prompt)?(sharedLunch?'shared-lunch':'lunch'):/계산|영수증|수량/.test(prompt)?'checking':/사진|문구|인쇄/.test(prompt)?'photo':/커피|맛|컵/.test(prompt)?'taste':null):null;
 const recentTopics=previous.slice(-3).map(p=>p.topic);
 const fresh=subjects.filter(t=>!recentTopics.includes(t.id));
 const subject=subjects.find(t=>t.id===(groundedTopic??topic))??selectDialoguePart(store,fresh.length?fresh:subjects);
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
  if(action==='answer'&&focus?.answerReply)clauses=[selectDialoguePart(store,focus.answerReply)];
  if(action==='disagree')clauses=[selectDialoguePart(store,{yeogyeong:['아, 그쪽으로 생각한 거였어요? 그럼 제가 너무 빨리 정했네요.','저는 조금 다른데, 왜 그렇게 말했는지는 알겠어요.'],seoyeon:['그럴 수도 있겠네요. 제가 편한 게 모두한테 편한 건 아니니까.','저랑은 조금 다르네요. 그 이유도 듣고 싶어요.'],soyul:['…그렇게도 볼 수 있겠네요. 저는 다른 데가 먼저 보여서.','같아야 하는 건 아니니까요. 저는 제 생각을 조금 더 정리해볼게요.']}[id])];
  if(intent==='close')clauses.push(selectDialoguePart(store,['다음에는 선배 얘기도 들어요.','붙잡지는 않을게요.','하던 일 마저 하고 갈게요.']));
  else if(intent==='defer'){
   clauses.push(`${status.next??'다음 일정'}에 가야 해서 지금은 길게 말하기 어려워요.`);
   clauses.push(selectDialoguePart(store,['인사만 하고 나중에 이어가도 될까요?','급한 얘기면 하나만 듣고 갈게요.','나중에 시간 있을 때 다시 말 걸어주세요.']));
  }else if(intent==='boundary')clauses.push(selectDialoguePart(store,['지금은 제 생각을 더 설명하고 싶지 않아요.','지금 바로 편하게 얘기하기는 어려워요.','그 얘기를 아무 일 없던 것처럼 넘기지는 못하겠어요.']),selectDialoguePart(store,['조금 시간을 주세요.','오늘은 여기까지만 하면 좋겠어요.']));
  else {
   if(subject.observations&&action!=='why'){
    if(!['answer','disagree'].includes(action))clauses.push(selectDialoguePart(store,subject.observations));
    if(status.bandwidth==='limited')clauses.push('오늘은 조금 지쳐서요. 길게 이야기하기는 어렵겠어요.');
    else if(action==='answer')clauses.push(selectDialoguePart(store,subject.continuations));
    else if(action!=='disagree')clauses.push(selectDialoguePart(store,subject.continuations),question);
   } else {
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
  }
  if(intentState.willingToJoke&&action==='disagree')clauses.push(selectDialoguePart(store,['이렇게 다를 줄은 몰랐는데요.','다른 얘기도 물어보면 또 다르려나.']));
  if(id==='soyul'&&dialogueRandom(store)<0.6)clauses[0]='…'+clauses[0];
  const ownMajor={yeogyeong:'간호학과',seoyeon:'치위생과',soyul:'치위생과'}[id];
  const requiredPrefix=action==='about'?`저는 ${ownMajor} 다녀요. `:'';
  const text=requiredPrefix+normalizeNpcAddress(s,id,clauses.join(' '));
  const signature=[intent,subject.id,detail,want,question,memory?.id??'',acknowledgment].join('|');
  chosen={text,requiredPrefix,intent,topic:subject.id,topicName:subject.name,detail,memoryIds:memory?[memory.id]:[],signature,answers:subject.answers??[]};
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
  {id:'switch',kind:'switch',label:'그 얘기는 잠깐 두고, 다른 이야기도 해볼까요?'},
  {id:'disagree',kind:'disagree',label:'나는 조금 다르게 생각해요. 내 생각도 말해볼게요.'}
 ];
 if(!s.contacts[id]?.playerSeniorityKnown&&!limited)available.push({id:'introduce',kind:'introduce',label:'저는 스물셋이고 보컬 전공 2학년이에요. 군대 다녀와서 복학했어요.'});
 if(!s.contacts[id]?.details?.major&&!limited)available.push({id:'about',kind:'about',label:'그러고 보니 어느 과 다녀요? 아직 못 물어봤네요.'});
 const options=[];
 if(!limited&&status.bandwidth==='open'&&subject.answers&&!['answer','disagree'].includes(action)){const index=Math.floor(dialogueRandom(store)*subject.answers.length);options.push({id:'answer'+index,kind:'answer',label:subject.answers[index].label,answerReply:subject.answers[index].reply});}
 const pool=[...available];while(pool.length&&options.length<(limited?1:2)){const index=Math.floor(dialogueRandom(store)*pool.length);options.push(pool.splice(index,1)[0]);}
 options.push({id:'leave',kind:'leave',label:'그럼 다음에 또 이야기해요.'});
 store.sequence++;store.recent[id]=[...previous,{text:chosen.text,signature:chosen.signature,topic:chosen.topic}].slice(-16);
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
 return {result:generateDialogueTurn(s,id,{action,topic:option.kind==='switch'?selectDialoguePart(store,[...dialogueSubjects[id],...everydaySubjects[id]].filter(t=>t.id!==session.topic)).id:session.topic,playerLine:option.label,turn:session.turn,focus:{...session.response.plan,answerReply:option.answerReply}}),delta};
}
export function canGenerateReencounter(s,id){
 if(!usesGeneratedDialogue(s))return false;
 const last=s.dialogue.generatedVisits?.[id];
 return !!last&&((s.day-last.day)*1440+(s.clock?.minute??780)-last.minute)>=30;
}
