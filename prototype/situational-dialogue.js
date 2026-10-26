import {npcNow} from './npc-state.js';
export function situationNodes(s,id,session){
 const current=npcNow(s,id),context=session.context??current;
 const r=s.relations?.[`${id}>taei`]??{},safe=(r.trust??0)>=3&&(r.tension??0)<3;
 const mood=context.mood,brief=context.bandwidth==='brief';
 const n=(text,options=[])=>({text,stage:current.cue,options});
 const o=(id,label,next,delta={})=>({id,label,next,delta});
 const opener={
 bright:{yeogyeong:'아, 선배. 지금은 좀 여유 있어요. 이번에는 제가 선배 얘기를 들어볼까요?',seoyeon:'왔어요? 지금은 좀 여유 있어요. 아까보다 말이 많아져도 놀라지 말고요.',soyul:'아, 선배. 먼저 인사하려다가 눈이 마주쳤네요. 무슨 일로 오셨어요?'},
 resting:{yeogyeong:'잠깐 쉬는 중이에요. 지금 계산기 다시 켜라고만 안 하면 돼요. 선배도 쉬러 왔어요?',seoyeon:'지금은 아무것도 안 하려고 앉았어요. 선배가 할 일 들고 온 건 아니죠? 그냥 얘기하는 건 좋아요.',soyul:'지금은 사진 안 보고 있어요. 잠깐 화면 좀 안 보려고요. 선배도 쉬는 시간이세요?'},
 focused:{yeogyeong:'여기까지 표시해두고 얘기할게요. 중간에 끊으면 제가 어디까지 셌는지 잊어버려서. 급한 거예요?',seoyeon:'이것만 먼저 마무리할게요. 지금 다른 부탁까지 받으면 둘 다 놓칠 것 같아요.',soyul:'한 줄만 쓰고요. 아까 생각한 말을 잊어버릴 것 같아서… 조금만 기다려주실래요?'},
 rushed:{yeogyeong:`지금 ${context.next??'다음 일정'} 가기 직전이에요. 확인할 거면 하나만요. 걸으면서 들어도 되는 얘기예요?`,seoyeon:'저 지금 나가야 해요. 얘기하기 싫어서 그러는 건 아니고, 늦을 것 같아서. 급한 일이에요?',soyul:'아, 지금은… 저 곧 들어가야 해서요. 짧게 말씀해주시면 들을 수 있어요.'},
 overwhelmed:{yeogyeong:'잠깐만요. 지금 여러 얘기를 한꺼번에 들으면 제가 또 놓쳐요. 하나씩 말해주면 안 돼요?',seoyeon:'미안해요. 오늘은 누가 뭐 부탁할 것처럼 말만 걸어도 먼저 긴장하게 되네. 무슨 얘기였어요?',soyul:'지금 제가 대답을 좀 이상하게 할 수도 있어요. 머릿속이 복잡해서… 조금만 천천히요.'},
 drained:{yeogyeong:'지금 숫자 보면 또 세다가 틀릴 것 같아요. 급한 거 아니면 잠깐만 앉았다가 해도 돼요?',seoyeon:safe?'선배 얼굴 보니까 얘기는 하고 싶은데, 오늘은 기운이 없네. 대답이 좀 늦어도 괜찮죠?':'오늘은 좀 지쳤어요. 얘기 듣고는 있는데 길게 답하기가 어렵네요.',soyul:safe?'오늘은 말 많이 못 할 것 같아요. 그냥 옆에 있어도 돼요? 제가 먼저 말할 때까지.':'아, 네. 듣고 있어요. 근데 오늘은 조금 피곤해서… 짧게 얘기해도 될까요?'}
 };
 const start=opener[mood]?.[id]??'잠깐만요. 지금 하던 것부터 정리하고 얘기해도 될까요?';
 return {
  ctxStart:n(start,[
   o('ctxBrief',brief?'급한 건 아니에요. 인사만 하고 갈게요.':current.bandwidth==='open'?'잠깐 기다릴게요. 괜찮으면 하던 이야기 이어가요.':'그럼 하나만요. 지금은 어떤 얘기가 편해요?','ctxBriefReply'),
   ...(current.bandwidth==='open'?[o('ctxTopic','지금 괜찮으면 아까 이야기하던 걸 마저 할까요?',session.topicEntry??'start')]:[]),
   ...(!brief&&current.bandwidth!=='open'?[o('ctxHelp','내가 대신 정하진 않을게요. 지금 필요한 게 있어요?','ctxHelpReply')]:[]),
   o('ctxSpace','지금은 쉬거나 하던 일 해요. 다음에 이야기해도 돼요.','ctxSpaceReply')]),
  ctxBriefReply:n(brief?{yeogyeong:'그럼 다녀와서 봐요. 아, 인사도 제대로 못 했네. 먼저 갈게요.',seoyeon:'고마워요. 나중에 보면 제가 먼저 인사할게요. 지금은 진짜 뛰어야겠다.',soyul:'네. 나중에… 그때는 좀 더 얘기해요.'}[id]:safe?{yeogyeong:'일 얘기 말고 선배 얘기요. 제가 대답을 잘해야 하는 게 아니면 좋겠어요.',seoyeon:'정답 없는 얘기요. 선배 오늘 뭐 하다 왔는지, 그런 거.',soyul:'사진 잘 골랐냐고 묻는 거 말고… 선배가 좋아하는 장면 같은 거요.'}[id]:{yeogyeong:'급한 확인만 아니면 돼요. 다른 건 조금 뒤에 하고 싶어요.',seoyeon:'가벼운 얘기면 괜찮아요. 아직 제 얘기를 길게 하고 싶지는 않아서.',soyul:'그냥 평범한 얘기요. 지금 뭘 설명해야 하면 말이 안 나올 것 같아요.'}[id],brief?[o('ctxBye','다녀와요. 붙잡지 않을게요.','_close')]:[
   o('ctxListen','그럼 오늘 내 얘기를 조금 할게요. 듣기만 해도 돼요.','ctxShared'),
   ...(current.bandwidth==='open'?[o('ctxTopic','괜찮아졌으면 아까 이야기하던 것만 마저 할까요?',session.topicEntry??'start')]:[]),
   o('ctxBye','다음에 편할 때 이어서 얘기해요.','_close')]),
  ctxHelpReply:n(safe?{yeogyeong:'제가 또 확인하려고 하면 이미 봤다고만 말해주세요. 다시 해주지는 말고요.',seoyeon:'부탁 하나만요. 지금은 뭐 해야 한다는 얘기 없이 잠깐 있어줘요.',soyul:'제가 말을 고르는 동안 다른 얘기로 넘어가지 말아주세요. 지금은 그게 제일 좋아요.'}[id]:{yeogyeong:'마음은 고마운데 일은 제가 마칠게요. 잠깐만 기다려주세요.',seoyeon:'지금은 혼자 정리하는 게 나을 것 같아요. 도와주겠다는 말은 고마워요.',soyul:'지금은 보여드리거나 맡기기는 어려워요. 제가 정리되면 말할게요.'}[id],[o('ctxListen','알겠어요. 말한 만큼만 할게요.','ctxShared'),o('ctxInsist','그래도 같이 하는 게 더 빠르지 않아요?','ctxBoundary',{tension:2})]),
  ctxBoundary:n({yeogyeong:'빠른 게 문제가 아니라니까요. 지금은 제가 멈출 때를 정해보고 싶어요.',seoyeon:'거절했는데 계속 권하면, 제가 또 설명해야 하잖아요. 오늘은 그만할게요.',soyul:'싫다는 말까지 해야 해요? 지금은 안 하고 싶어요.'}[id],[o('ctxSpace','미안해요. 지금은 물러날게요.','_close')]),
  ctxSpaceReply:n({yeogyeong:'네. 지금 잠깐 끊어주는 게 더 도움이 되네요. 나중에 제가 말 걸게요.',seoyeon:'고마워요. 쉬겠다고 말하고도 눈치 봤는데… 그럼 좀 쉴게요.',soyul:'…고마워요. 대답 못 했다고 불편해하지 않으셔도 돼요.'}[id],[o('ctxBye','나중에 봐요.','_close')]),
  ctxShared:n(safe?{yeogyeong:'선배도 늘 괜찮은 건 아니죠? 오늘은 서로 해결해주려고 하지 말고 그냥 들어요.',seoyeon:'그러고 있으니까 좀 낫네요. 얘기하다 말이 끊겨도 그냥 둬요. 저는 괜찮으니까.',soyul:'이렇게 있어도 안 어색하네요. 제가 조용하면 불편해하실 줄 알았어요.'}[id]:{yeogyeong:'네. 지금은 그 정도가 좋아요. 더 길게 말하는 건 나중에요.',seoyeon:'들었어요. 오늘은 여기까지만 해도 괜찮겠죠?',soyul:'…네. 이야기해주셔서 고마워요. 저는 조금 더 있다 갈게요.'}[id],[
   ...(safe&&current.bandwidth==='open'?[o('ctxTopic','아까 얘기, 지금 이어가도 괜찮아요?',session.topicEntry??'start')]:[]),o('ctxBye','그럼 오늘은 여기까지 해요.','_close')])
 };
}
