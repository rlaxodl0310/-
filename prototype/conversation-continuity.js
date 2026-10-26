import {socialIntent} from './social-reasoning.js';
// Persistent consequences, not random paraphrases. Reading never consumes a thread.
export function followupCandidate(s,id){
 const thread=s.dialogue?.threads?.[id];
 if(!thread||thread.episode>=2)return null;
 const elapsed=((s.day??1)-thread.day)*1440+(s.clock?.minute??780)-thread.minute;
 return elapsed>=30?thread:null;
}
export function rememberConversation(s,id,session){
 s.dialogue.threads??={};
 const previous=s.dialogue.threads[id];
 if(session.variant==='followup'){
  s.dialogue.threads[id]={...previous,episode:(previous?.episode??0)+1,day:s.day??1,minute:s.clock?.minute??780};
 }else if(session.variant!=='guarded'&&!previous){
  s.dialogue.threads[id]={episode:0,day:s.day??1,minute:s.clock?.minute??780,origin:session.node};
 }
}
export function continuityNodes(s,id,session){
 const intent=socialIntent(s,id),facts=s.dialogue?.facts?.[id]??{};
 const later=session.episode===1,choice=facts.continuation;
 const completed=s.freeDay?.completed?.some(a=>a.id==='volunteer');
 const opening={
  yeogyeong:later?(choice==='help'?'아까 같이 나눈 작업, 다른 사람한테도 맡겨봤어요. 제가 다시 다 세지는 않았고요. 근데 기다리는 게 더 어렵네요.':'아까 혼자 해보겠다고 했잖아요. 끝내긴 했어요. 다 끝난 다음에야 물 한 모금 마셨네.'):(completed?'아까 포장하면서 같이 확인했던 거요. 인계하고 나니까 제가 붙들고 있던 게 좀 보이더라고요. 다음에도 제가 전부 확인하는 게 맞을까요?':'아까 계산 보던 거 기억나요? 덮었다가 또 펴려는 걸 참았어요. 다른 사람한테 맡겨도 제가 불안하면 결국 똑같은 거 아닌가 싶어서.'),
  seoyeon:later?(choice==='help'?'아까 잠깐 같이 쉬자고 했던 거요. 혼자 앉아 있을 때랑은 다르긴 하네요. 선배는 말 안 하고 있어도 괜찮아요?':'아까 제 시간은 제가 정하겠다고 해놓고 또 부탁 하나 받았어요. 이번에는 오늘 말고 내일 하겠다고 했지만.'):(facts.coffee==='black'?'아까 안 단 커피 좋아한다고 했죠. 다음에 고를 땐 참고하려고요. 그런데 선배 쉬는 시간까지 제가 붙잡는 건 아닌가 싶네.':'아까 이야기하다 보니까 시간이 금방 갔네요. 저는 쉬러 나와서도 자꾸 누가 찾나 보게 돼요. 선배도 혼자 있고 싶을 때 있어요?'),
  soyul:later?(choice==='help'?'아까 같이 보자고 했던 사진, 제가 먼저 두 장만 골랐어요. 이번에는 선배가 좋다는 거 말고 제가 고른 이유부터 말해봐도 돼요?':'아까 혼자 골라보겠다고 했던 거요. 한 장은 남겼어요. 아직 보여드리기는 좀 그런데… 지우지는 않았어요.'):(facts.photo==='empty'?'아까 그 빈 의자 사진, 아직 남겨뒀어요. 여경이한테 보내려다가 설명을 못 쓰겠어서. 같이 보면 제 생각이 또 바뀔까 봐 그것도 조금 걱정이고요.':'아까 같이 본 사진을 다시 보는데 선배가 한 말이 생각나더라고요. 근데 이제는 제가 뭘 좋아서 골랐는지도 적어보고 싶어요.')
 }[id];
 const guarded=intent.mode==='guarded';
 const n=(text,stage,options)=>({text,stage,options});
 const o=(id,label,next,delta={},fact=null)=>({id,label,next,delta,fact});
 const volunteer=Object.values(s.activitySessions?.records??{}).findLast(r=>r.routeId==='volunteer'&&r.status==='completed');
 const workRecall=volunteer?.choices.some(c=>c.id==='carry')?'아까 통로부터 비우고 상자 옮겼던 거, 덕분에 인계할 때 안 막혔어요. ':volunteer?.choices.some(c=>c.id==='labels')?'아까 상자에 붙인 수량표, 다음 사람이 그대로 보고 확인했어요. ':'';
 const nodes={
  start:n(guarded?{seoyeon:'아까 얘기는 기억해요. 다만 지금은 조금 거리를 두고 싶어요.',yeogyeong:'그 얘기 다시 할 수는 있는데, 지금 제 일을 대신 정해주지는 않았으면 해요.',soyul:'아까 얘기는… 기억해요. 지금 바로 보여드려야 하는 건 아니죠?'}[id]:opening,'상대가 앞서 나눈 말을 자기 상황에 연결해 꺼낸다.',[
   o('together',later?'이번에는 네 생각부터 들을게요.':'내가 옆에서 같이 볼까요? 결정은 직접 하고.','answer',{trust:guarded?0:1},['continuation','help']),
   o('autonomy','혼자 해보고 싶으면 그래도 돼요. 다 끝내고 말해줘도 되고.','answer',{trust:1},['continuation','space']),
   o('decide','그냥 내가 정해줄게요. 그렇게 하면 빨리 끝나잖아요.','boundary',{tension:2},['continuation','control'])]),
  answer:n(facts.continuation==='help'?(intent.feelsSafe?{seoyeon:'좋아요. 그럼 잠깐만 같이 있어요. 선배 일정도 무리해서 비우지는 말고.',yeogyeong:'그럼 역할만 나눠요. 제가 또 선배 한 일까지 확인하려고 하면 말해주세요.',soyul:'그럼 제가 먼저 말해볼게요. 중간에 말이 좀 끊겨도 기다려주세요.'}[id]:{seoyeon:'고마워요. 그래도 오늘은 잠깐만요. 아직은 쉬는 시간을 같이 쓰는 게 좀 어색해서.',yeogyeong:'이 부분만 같이 봐주세요. 전부 맡기겠다는 뜻은 아니고요.',soyul:'두 장 다 말고 한 장만요. 나머지는 제가 조금 더 보고 싶어요.'}[id]):{seoyeon:'그럼 오늘은 좀 쉬어볼게요. 먼저 가도 제가 서운해한다고 생각하지 마요.',yeogyeong:'네. 이번에는 제가 어디까지 확인할지 정해볼게요.',soyul:'그래도 돼요? 그럼 다 고르기 전에는 보여달라고 안 하셔도 돼요.'}[id],'제안에 대한 반응은 신뢰와 불편했던 기억에 따라 달라진다.',[
   o('mutual','나도 혼자 다 맡으려다가 지칠 때가 있어요. 서로 말해주죠.','end',{trust:1},['sharedResponsibility',true]),
   o('respect','알겠어요. 지금 말한 만큼만 할게요.','end',{},['boundary','respected'])]),
  boundary:n({seoyeon:'빨리 끝내는 게 지금 제가 원하는 건 아닌데요. 제가 말할 틈은 줬으면 해요.',yeogyeong:'그렇게 하면 제 일은 끝나도 제가 맡길 수 있게 되는 건 아니잖아요.',soyul:'그럼 또 제 사진인데 제가 못 고르게 되잖아요. 지금은 혼자 볼게요.'}[id],'상대는 제안을 거절한다. 친하다고 결정권까지 넘기지는 않는다.',[
   o('apologize','맞아요. 내가 너무 앞섰네요. 그 말은 거둘게요.','end',{tension:-1},['boundary','acknowledged']),
   o('leave','알겠어요. 지금은 하던 일 마저 해요.','end')]),
  end:n(facts.sharedResponsibility?{seoyeon:'선배도 힘들면 말해요. 저한테만 괜찮냐고 묻지 말고요.',yeogyeong:'그럼 다음에는 선배 작업 얘기도 해요. 제 일만 같이 보고 끝내지는 말고.',soyul:'저도 듣기만 할 수는 있으니까… 선배 얘기도 나중에 해주세요.'}[id]:{seoyeon:'네. 다음에 마주치면 그땐 제가 먼저 물어볼게요.',yeogyeong:'일단 해볼게요. 결과는 나중에 보면 알겠죠.',soyul:'…네. 제가 정리되면 먼저 말할게요.'}[id],'대화에서 정한 거리와 방식은 다음 만남에도 남는다.',[o('bye','그럼 나중에 봐요.','_close')])
 };
 if(id==='yeogyeong'&&session.episode===0&&workRecall&&!guarded)nodes.start.text=workRecall+nodes.start.text;
 if((s.dialogue?.threads?.[id]?.day??s.day)<s.day)for(const node of Object.values(nodes))node.text=node.text.replaceAll('아까','지난번');
 return nodes;
}
