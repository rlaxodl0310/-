import {npcNow,conversationExperience} from './npc-state.js';
import {followupCandidate,rememberConversation} from './conversation-continuity.js';
import {photoReport,showcaseReport,scheduledEvent,learnEvent} from './event-view.js';
import {contact,firstContact,respondIntroduction} from './identity.js';
import {sceneKey,sceneNodes,scenePrompt} from './conversation-scenes.js';
import {socialIntent} from './social-reasoning.js';
export const people={
 seoyeon:{name:'한서연',column:1,habit:'서연은 서두르지 않고 말을 고른다.'},
 yeogyeong:{name:'차여경',column:2,habit:'여경은 펼쳐둔 수첩에서 시선을 든다.'},
 soyul:{name:'박소율',column:3,habit:'소율은 눈이 마주치자 손에 든 종이를 가지런히 맞춘다.'}
};
export function relationship(s,from,to='taei'){
 return {familiarity:0,affection:0,trust:0,tension:0,...s.relations[`${from}>${to}`]};
}
export function changeRelationship(s,from,to,delta){
 const r=relationship(s,from,to);
 for(const [key,value] of Object.entries(delta)) r[key]=Math.max(0,Math.min(100,r[key]+value));
 s.relations[`${from}>${to}`]=r;
}
export function groupDialogue(s){
 const friends=relationship(s,'soyul','seoyeon').familiarity>=4;
 const exhibition=scheduledEvent(s,'campus-showcase');
 if(s.day===3&&s.phase==='evening'&&exhibition){const joint=exhibition.outcome==='joint-display';return [{person:'seoyeon',text:'사진은 다 붙였어? 아까 비어 있던 칸이 있던데.'},{person:'soyul',text:joint?'응. 고른 이유를 쓰고 나니까 순서도 정해지더라.':exhibition.outcome==='separate-display'?'응. 각자 고른 건 각자 붙였어. 다음에는 기준부터 이야기해야겠어.':'사진은 붙였어. 설명은 다음 활동 때 조금 더 보완하려고.'},{person:'seoyeon',text:joint?'이제 사진 옆에 네 이야기도 있네. 그냥 사진만 볼 때랑 또 다르다.':'오늘 다 해결하려고 하지는 마. 각자 뭘 남기고 싶은지부터 이야기해봐.'},{person:'soyul',text:'응. 일단 오늘은 집에 가서 다시 고르지는 말아야겠다.'}];}

 if((s.day??1)>1&&scheduledEvent(s,'photo-selection')?.outcome==='practical')return [{person:'seoyeon',text:'여경이랑 사진은 골랐다며? 설명도 정했어?'},{person:'soyul',text:'사진은 골랐어. 설명은… 각자 조금 더 써보기로 했고. 넣고 싶은 게 아직 남아서.'},{person:'seoyeon',text:'그럼 그 이야기도 해봐. 아직 붙이기 전이잖아.'},{person:'soyul',text:'응. 내일 다시 이야기해보려고.'}];
 if((s.day??1)>1&&scheduledEvent(s,'photo-selection')?.outcome==='separate')return [{person:'seoyeon',text:'사진 정리는 잘됐어?'},{person:'soyul',text:'일단 따로 골랐어. 여경이랑 중요하게 보는 게 달라서.'},{person:'seoyeon',text:'서로 고른 이유는 들어봤고?'},{person:'soyul',text:'그것부터 다시 이야기해야 할 것 같아.'}];
 if((s.day??1)>1)return [
 {person:'seoyeon',text:s.day===2?'여경이랑 사진 골랐다며? 전시 구성도 정했어?':'오늘 사진 설명은 네가 직접 할 거야?'},
 {person:'soyul',text:s.day===2?(friends?'응. 같이 고르니까 내가 놓친 것도 보이더라. 내일 설명도 같이 정하기로 했어.':'네. 여경 씨랑 같이 골랐어요.'):(friends?'응. 여경이랑 순서도 맞췄어. 떨리긴 하는데, 해보려고.':'제가 고른 사진부터 설명해보려고요.')},
 {person:'seoyeon',text:friends?'잘됐네. 네가 찍은 거니까 네 이야기가 제일 궁금하지.':'좋네요. 준비한 이야기 들려주세요.'},
 {person:'soyul',text:s.dialogue?.facts?.soyul?.speech==='casual'?'태이도 볼래? 이 사진, 어제 이야기하던 거야.':'괜찮으시면 같이 보실래요?'}
 ];
 return [
 {person:'seoyeon',text:s.phase==='afternoon'?'소율아, 이거 안 지웠지? 너 표정 진짜 잘 나왔는데.':'가기 전에 사진 하나만 봐봐. 아까 이거 보여주려다 말았어.'},
 {person:'soyul',text:friends?'너 말하는 잘 나왔다는 걸 내가 못 믿겠어. 지난번에도 눈 감은 거 보냈잖아.':'네… 제가 찍은 사진도 몇 장 있어요.'},
 {person:'seoyeon',text:friends?'그건 네가 웃었잖아. 알았어, 네가 먼저 골라. 대신 내 사진도 마음대로 지우진 말고.':'좋아요. 괜찮은 것부터 보여주세요.'},
 {person:'soyul',text:s.dialogue?.facts?.soyul?.speech==='casual'?'태이도 볼래? …이상하게 찍은 건 없으니까.':'아, 안녕하세요. 사진 보고 있었는데… 같이 보실래요?'}
 ];
}
export function respondGroup(state,choice){
 if(!['wait','include','speakFor'].includes(choice))throw new Error('알 수 없는 대답입니다.');
 const s=structuredClone(state),close=s.dialogue?.facts?.soyul?.speech==='casual';
 const repeated=s.dialogue.history.some(h=>h.person==='group'&&(h.day??1)===(s.day??1)&&h.phase===s.phase&&h.choice===choice);
 let lines;
 if(choice==='wait'){
  lines=[{person:'soyul',text:close?'고마워. 내가 먼저 골라볼게. 보고 싶은 거 있으면 말해.':'조금만 기다려주실래요? 제가 먼저 골라볼게요.'},{person:'seoyeon',text:'천천히 해. 우리도 급한 건 아니니까.'}];
  if(!repeated)changeRelationship(s,'soyul','taei',{trust:1});
 }else if(choice==='include'){
  lines=[{person:'soyul',text:close?'응. 이쪽으로 와. 화면 작아서 잘 안 보이겠다.':'네, 괜찮아요. …이 사진부터 볼까요?'},{person:'seoyeon',text:relationship(s,'seoyeon').affection>=3?'선배가 찍으면 어떤 걸 찍을지도 궁금한데요.':'좋아요. 다음 활동 때 사진 담당도 한번 해볼래요?'}];
  if(!repeated)changeRelationship(s,'soyul','taei',{familiarity:1});
 }else{
  lines=[{person:'soyul',text:close?'잠깐, 내 사진인데 왜 서연이가 골라. 내가 말할게.':'잠깐만요. 제가 고르던 거라… 저도 말씀드릴 수 있어요.'},{person:'seoyeon',text:'저한테 맡기면 또 소율이 눈 감은 걸로 골라요. 본인한테 물어봐줘요.'}];
  if(!repeated){changeRelationship(s,'soyul','taei',{tension:1});changeRelationship(s,'seoyeon','taei',{trust:-1});}
 }
 s.dialogue.history.push({person:'group',choice,day:s.day??1,phase:s.phase,lines});
 return {state:s,lines};
}
export function dialogue(s,id){
 if(!contact(s,id).introduced)return firstContact(s,id);
 const active=s.dialogue?.sessions?.[sceneKey(s,id)];
 if(active&&!active.closed){
  const n=sceneNodes(s,id,active)[active.node];
  if(n)return {opening:n.text,stage:n.stage,scene:true,options:n.options.map(o=>({id:'scene:'+o.id,label:o.label}))};
 }
 if(!people[id])throw new Error('알 수 없는 인물입니다.');
 const r=relationship(s,id),comfortable=r.familiarity>=4,close=s.dialogue?.facts?.[id]?.speech==='casual',warm=r.affection>=3,trusted=r.trust>=3;
 const d=s.dialogue??{history:[],promises:{}};
 const history=d.history.filter(h=>h.person===id&&(h.day??1)===(s.day??1));
 const latest=history.at(-1);
 const evening=s.phase==='evening';
 let opening;
 const yesterday=s.dayHistory?.at(-1);
 const old=d.history.filter(h=>h.person===id&&(h.day??1)<(s.day??1));
 const appointment=s.appointments?.find(a=>a.person===id&&a.day===s.day&&['pending','broken','kept'].includes(a.status));
 if((s.day??1)>1&&!latest){
  if(appointment?.status==='broken') opening={seoyeon:'리허설에 오기로 했었죠. 못 온 것보다 연락이 없었던 게 마음에 걸려요.',yeogyeong:'전시 준비 인원에 넣어뒀었어요. 다음에는 바뀌면 먼저 알려주세요.',soyul:'오늘 온다고 해서… 기다렸어. 다음에는 먼저 말해줘.'}[id];
  else if(appointment?.status==='kept') opening={seoyeon:'약속대로 와줬네요. 같이 준비하니까 훨씬 낫더라고요.',yeogyeong:'오늘 약속 지켜줘서 고마워요. 덕분에 무리 없이 끝냈어요.',soyul:'와줬네. …내가 고른 사진, 같이 봐줘서 좋았어.'}[id];
  else if(appointment?.status==='pending') opening=`오늘 ${appointment.label}, 같이 하기로 한 거 기억하고 있어요. 일정 바뀌면 알려줘요.`;
  else if(yesterday?.promises[id]==='broken')opening={seoyeon:'어제 오기로 했던 거요. 못 올 수도 있지만, 다음에는 먼저 알려줬으면 해요.',yeogyeong:'어제 기다렸어요. 오늘은 일정부터 확인하고 이야기해요.',soyul:'어제는… 기다렸어요. 오늘은 무리해서 약속하지 않아도 돼요.'}[id];
  else if(yesterday?.promises[id]==='kept')opening={seoyeon:'어제 약속대로 와줘서 고마웠어요. 오늘은 좀 여유 있어요?',yeogyeong:'어제 같이 마무리해줘서 든든했어요. 오늘도 얼굴 보네요.',soyul:'어제 고마웠어요. 오늘은… 제가 먼저 인사하려고 했는데.'}[id];
  else if(old.length||close)opening={seoyeon:'지난번에 나눈 이야기 생각났어요. 오늘은 잘 지냈어요?',yeogyeong:'또 보네요. 하던 일은 잘 끝났어요?',soyul:close?'왔네. 지난번 이야기하던 거… 조금 더 해도 돼?':'안녕하세요. 지난번에 뵀죠? 오늘은 사진 고르고 있었어요.'}[id];
  else opening={seoyeon:'안녕하세요. 봉사단에서 이름은 봤어요. 이렇게 이야기하는 건 처음이죠?',yeogyeong:'안녕하세요. 저는 재무 맡고 있는 차여경이에요. 오늘은 무슨 일로 오셨어요?',soyul:'아… 안녕하세요. 박소율이에요. 봉사단 분 맞으시죠?'}[id];
 }
 else if(evening&&d.promises[id]==='broken') opening={seoyeon:'오늘 온다고 했었죠. 못 올 수도 있는데, 연락은 해줄 수 있었잖아요.',yeogyeong:'아까 온다고 해서 인원에 넣었어요. 다음에는 못 오면 먼저 알려주세요.',soyul:'기다렸어요. …못 오게 됐으면 말해주지.'}[id];
 else if(evening&&(s.choice==='volunteer'||s.freeDay?.completed?.some(a=>a.id==='volunteer'))) opening={seoyeon:trusted?'아까 같이 확인해줘서 마음이 좀 놓였어요. 나 혼자 괜찮다고 넘겼을지도 몰라요.':'오늘 고생했어요. 수량 다시 확인해줘서 도움이 됐어요.',yeogyeong:'아까 같이 세준 거, 고마워요. 정산이 안 맞는 줄 알고 식겁했네.',soyul:close?'아까… 같이 확인해줘서 고마워. 내가 말을 너무 늦게 했지?':'아까 도와주셔서 감사했어요. 제가 먼저 말씀드렸어야 했는데.'}[id];
 else if(evening) opening={seoyeon:'오늘 일정은 잘 끝났어요? 우리는 조금 늦게 마쳤어요.',yeogyeong:'이제 정리 끝났어요. 다른 일정은 잘 마쳤어요?',soyul:'아… 아직 학교에 계셨네요. 저는 이제 가려고요.'}[id];
 else if(r.tension>=4) opening={seoyeon:'지금은 조금 혼자 있고 싶어요. 꼭 해야 할 이야기예요?',yeogyeong:'잠깐만요. 아까 이야기부터 정리하고 넘어가고 싶어요.',soyul:'지금은… 길게 이야기하기가 어려워요.'}[id];
 else if(latest?.choice==='push') opening={seoyeon:'아까 이야기요. 제 일정은 제가 정하고 싶어요. 그건 알아줬으면 해요.',yeogyeong:'확인하는 건 괜찮은데, 제가 숨기는 것처럼 말하지는 말아주세요.',soyul:'아까는… 대답하기가 좀 어려웠어요. 지금은 조금 천천히 말해주면 안 돼요?'}[id];
 else if(latest?.choice==='promise') opening={seoyeon:'이따 준비실에서 봐요. 일정 바뀌면 알려주고요.',yeogyeong:'오는 걸로 적어뒀어요. 혹시 못 오면 메시지 주세요.',soyul:'이따 오시는 거죠? …네, 알겠어요.'}[id];
 else if(latest) opening={seoyeon:close?'또 만났네요. 이번엔 무슨 이야기예요?':'아까 이야기하다 말았죠. 더 물어볼 게 있어요?',yeogyeong:close?'아, 또 왔네. 영수증 맡기러 온 건 아니죠?':'아직 근처에 있었네요. 무슨 일이에요?',soyul:close?'또 왔네. …아니, 싫다는 말은 아니고.':'아, 네. 아까 뵀죠.'}[id];
 else opening={seoyeon:close?(warm?'왔어요? 오늘은 조금 일찍 봤으면 했는데.':'왔네요. 오늘도 일정 꽉 찼어요?'):'안녕하세요. 봉사단에서 뵀죠? 오늘 활동에도 오세요?',yeogyeong:close?'태이 선배, 잠깐만요. 이 수량 한번 같이 봐줄래요?':'안녕하세요. 혹시 오늘 활동 참여하시는지 여쭤봐도 돼요?',soyul:close?(warm?'왔네. …오늘은 먼저 인사하려고 했는데.':'안녕. 서연이는 안쪽에 있어.'):'안녕하세요. …봉사단 분, 맞으시죠?'}[id];
 if(active?.closed)opening={seoyeon:'아, 그러고 보니 선배 오늘 일정은 어떻게 돼요?',yeogyeong:'선배도 뭐 하러 온 거 아니었어요? 제가 제 얘기만 했네.',soyul:'아, 그리고… 더 물어볼 거 있어요?'}[id];
 const topic=scenePrompt(s,id);
 const joke={seoyeon:'커피랑 눈싸움 중이에요? 아까부터 보고만 있네.',yeogyeong:'계산기가 잘못했네. 여경 씨 표정이 아까부터 심각해.',soyul:'사진 고르는 게 찍는 것보다 오래 걸리네.'}[id];
 return {opening,stage:people[id].habit,options:[
 ...((latest||old.length)&&r.tension>0?[{id:'repair',label:latest?'아까는 내 말이 앞섰어요. 미안해요.':'지난번에는 내 말이 앞섰어요. 미안해요.'}]:[]),
 ...(s.day===2&&r.familiarity>=2&&r.tension<3&&npcNow(s,id).bandwidth==='open'?[{id:'invite',label:'내일은 어떤 일정이에요?'}]:[]),
 ...(evening||(s.day??1)>1?[{id:'listen',label:evening?'오늘은 어땠어요? 아까 좀 바빠 보이던데.':'아까부터 바빠 보이던데, 뭐 하고 있었어요?'}]:[]),
 ...(!active?.finished||followupCandidate(s,id)?[{id:'personal',label:followupCandidate(s,id)?'아까 이야기한 뒤에는 좀 어땠어요?':topic}]:[]),
 ...(comfortable&&s.dialogue?.facts?.[id]?.speech!=='casual'?[{id:'speech',label:'우리 조금 편하게 말할까요? 불편하면 지금처럼 해도 되고.'}]:[]),
 ...(!evening&&(s.day??1)===1&&!active?.finished?[{id:'joke',label:joke}]:[]),
 ...(!evening&&(s.day??1)===1?[{id:'promise',label:'오늘 봉사 활동에 갈게요.'}]:[]),
 {id:'push',label:{seoyeon:'힘들면 그냥 못 한다고 해요. 계속 받아주니까 더 맡기는 거죠.',yeogyeong:'확인은 이쯤 해도 되지 않아요? 계속 보면 끝이 없을 텐데.',soyul:'그냥 빨리 고르면 안 돼요? 계속 보고 있으면 달라지나.'}[id]}
 ]};
}
export function respond(state,id,choice){
 if(choice.startsWith('intro:'))return respondIntroduction(state,id,choice);
 if(!contact(state,id).introduced)throw new Error('먼저 인사를 나누거나 상황에 맞게 만나야 합니다.');
 if(choice.startsWith('scene:'))return advanceScene(state,id,choice.slice(6));
 if(['personal','joke'].includes(choice)||(choice==='listen'&&state.phase==='afternoon'&&(state.day??1)===1))return beginScene(state,id,choice);
 const current=dialogue(state,id);
 if(!current.options.some(o=>o.id===choice))throw new Error('지금 할 수 없는 대답입니다.');
 const s=structuredClone(state),r=relationship(s,id),comfortable=r.familiarity>=4,close=s.dialogue?.facts?.[id]?.speech==='casual',warm=r.affection>=3;
 s.dialogue??={history:[],promises:{}};
 const repeated=s.dialogue.history.some(h=>h.person===id&&h.choice===choice&&(h.day??1)===(s.day??1)&&h.phase===s.phase);
 let text,stage,followup;
 const delta={familiarity:1};
 if(repeated){
  text={seoyeon:'그 이야기는 아까 했죠. 이번에는 선배 이야기도 듣고 싶은데요.',yeogyeong:'아까랑 같은 질문인데요? 제 대답도 같아요.',soyul:'아까… 말씀드렸던 것 같아요.'}[id];
  stage='상대는 앞서 나눈 이야기를 기억하고 있다.';
 }else if(choice==='speech'){
  const willing=r.trust>=2&&r.tension<3;
  if(willing){s.dialogue.facts??={};s.dialogue.facts[id]??={};s.dialogue.facts[id].speech='casual';}
  text=willing?{seoyeon:'좋아요. 근데 갑자기 바꾸려니까 좀 어색하네. …방금도 존댓말 할 뻔했어요.',yeogyeong:'그럴까요? 아, 근데 재무 얘기할 땐 저도 모르게 딱딱해질 수 있어요. 그건 양해해줘요.',soyul:'응… 그래도 돼요. 아니, 돼. 벌써 이상하게 말했네.'}[id]:{seoyeon:'저는 아직 지금이 편해요. 좀 더 친해지면 그때 이야기해도 되죠?',yeogyeong:'아직은 이대로가 편한데, 조금만 나중에 해도 될까요?',soyul:'저는… 아직은 이렇게 말하는 게 편해요.'}[id];
  stage='말을 놓는 일도 서로 동의한 뒤에 바뀐다.';
 }else if(choice==='invite'){
  text={seoyeon:'내일 리허설 때 입구 안내를 도와주기로 했어요. 같이 준비할래요? 봉사단 사진 전시랑은 시간이 겹친대요.',yeogyeong:'내일 자유관에서 사진 전시 준비해요. 도와줄 수 있어요? 공연 리허설이랑 시간이 같아서 확인은 해줘야 해요.',soyul:close?'내일 전시 준비… 같이 할래? 리허설도 있다던데, 시간 괜찮으면.':'내일 사진 전시 준비해요. 시간 괜찮으시면 같이 해주실래요? 리허설이랑 겹친다고는 들었어요.'}[id];
  stage='초대에 응할지는 직접 결정할 수 있다. 질문만으로 약속이 잡히지는 않는다.';
 }else if(choice==='listen'&&(s.day??1)>1){
  Object.assign(delta,{trust:1});
  if(s.day===2){
   text=s.phase==='evening'?{seoyeon:'소율이 여경이랑 사진 정리했대요. 둘이 내일 전시 구성을 같이 정했더라고요.',yeogyeong:'소율이가 사진을 보내줘서 같이 골랐어요. 다음에는 설명 문구도 같이 정하기로 했고요.',soyul:close?'여경이랑 사진 골랐어. 처음에는 어렵게 느꼈는데, 같이 보니까 이야기 잘 되더라.':'여경이랑 사진 정리했어요. 제가 고른 것도 전시에 쓰기로 했대요.'}[id]:{seoyeon:'오전에 수업 끝내고 잠깐 쉬는 중이에요. 소율이는 도서관에서 사진 고른다고 했고요.',yeogyeong:'어제 활동 자료 정리하고 있어요. 소율이가 사진 골라서 보내주기로 했어요.',soyul:'여기서 사진 고르고 있어요. 다 고르면 여경이한테 보내려고요.'}[id];
   if(s.phase==='evening')text=photoReport(s,id)??text;
   if(s.phase==='evening'&&!s.known.includes('소율과 여경의 사진 협업')){const event=scheduledEvent(s,'photo-selection');if(event)learnEvent(s,event,'heard-from:'+id);s.known.push('소율과 여경의 사진 협업');s.memory.push(`[2일차] ${people[id].name}에게 소율과 여경이 함께 전시 구성을 정했다는 이야기를 전해 들었다.`);}
  }else text={seoyeon:'리허설 안내랑 전시 준비가 겹쳤어요. 저는 정한 일정대로 움직이려고요.',yeogyeong:'전시 준비 중이에요. 어제 소율이랑 정한 순서가 있어서 생각보다 수월하네요.',soyul:'어제 고른 파일 챙기고 있어요. 이번에는 제가 설명할 사진도 직접 골랐어요.'}[id];
  if(s.day===3&&s.phase==='evening'){const event=scheduledEvent(s,'campus-showcase');text=showcaseReport(s,id)??text;if(event){const seen=!!s.eventState?.knowledge?.[`campus:${event.day}:${event.id}`];if(!seen)learnEvent(s,event,'heard-from:'+id);if(!seen)s.memory.push(`[3일차] ${people[id].name}에게 전해 들음: ${event.result}`);}}
  else if(s.day===3)text=photoReport(s,id)??text;
  stage=people[id].habit;
 }else if(choice==='listen'){
  Object.assign(delta,{trust:1});
  if(s.phase==='evening'&&s.choice!=='volunteer'&&!s.freeDay?.completed?.some(a=>a.id==='volunteer')){
   text={seoyeon:'물품이 신청한 만큼 안 와서 순서를 조금 바꿨어요. 소율이가 다시 세어보고 알려줬고요.',yeogyeong:'포장 하나가 누락됐더라고요. 소율이가 찾아줘서 정산 문제는 아닌 걸 확인했어요.',soyul:'물품이 모자랐어요. 제가 다시 세어봤는데… 여경이가 확인해줘서 해결됐어요.'}[id];
   if(!s.known.includes('물품 수량 불일치 사건'))s.known.push('물품 수량 불일치 사건');
   s.memory.push(`${people[id].name}에게 봉사 물품 포장 누락에 관한 이야기를 전해 들었다.`);
  }else{
   const friends=relationship(s,'seoyeon','soyul').familiarity>=4;
   text={seoyeon:friends?'소율이 기다리고 있어요. 아는 사람이 많으면 말수가 좀 줄거든요. 대신 제가 대답해버리지는 않으려고요.':'준비가 끝났는지 확인하고 있었어요. 저도 오늘은 일찍 돌아가서 쉬고 싶어서요.',yeogyeong:'물품 수량 확인 중이에요. 돈이 안 맞는 건 아닌데, 한번 헷갈리면 계속 신경 쓰여서요.',soyul:close?'사진 고르는 중이야. 찍는 건 좋은데… 내가 나온 사진은 다 어색해 보여.':'지난 활동 사진이요. 제가 찍은 것도 있어서, 같이 골라달라고 하셔서요.'}[id];
  }
  stage={seoyeon:'서연은 들고 있던 휴대폰을 내려놓고 이야기한다.',yeogyeong:'여경이 수첩을 살짝 돌려 보여준다.',soyul:'대답을 재촉하지 않자 소율이 한 문장을 더 덧붙인다.'}[id];
  followup={seoyeon:'“설명하기 불편한 건 안 해도 돼요.”',yeogyeong:'“확인하는 동안 옆에서 같이 볼게요.”',soyul:'“괜찮으면 한 장만 보여줄래요?”'}[id];
 }else if(choice==='personal'){
  Object.assign(delta,{affection:1});
  text={seoyeon:close?'가봤어요. 조용해서 좋더라. 다음에는… 선배 시간 괜찮을 때 같이 가도 되겠네요.':'카페 가거나 혼자 동네 돌아다녀요. 사람 만나는 것도 좋은데, 쉬는 시간까지 약속으로 채우면 좀 지쳐서요.',yeogyeong:close?'그러게요. 오늘은 집 가면 아무것도 안 할 거예요. …문구점만 잠깐 들르고.':'도와주는 사람도 있어요. 다만 확인은 제가 해야 마음이 편해서요. 너무 붙잡고 있는 건가 싶기도 하고.',soyul:close&&warm?'있어. …네가 나오는 것도 있는데, 보여줘도 돼? 이상하게 찍은 건 아니야.':close?'있어. 보여줄게. 웃긴 사진부터 보여주지 말라고 해도 서연이는 꼭 그걸 먼저 골라.':'사진 찍는 건 좋아해요. 찍히는 건 좀… 어색해서. 서연이는 자꾸 같이 찍자고 하지만요.'}[id];
  stage={seoyeon:'의례적인 안부에서 조금 벗어난 이야기가 이어진다.',yeogyeong:'여경이 웃으며 수첩을 덮는다.',soyul:'소율이 잠깐 망설이다 휴대폰을 꺼낸다.'}[id];
  followup='태이도 음악 작업과 합주 사이에서 시간을 나누는 이야기를 짧게 들려준다.';
 }else if(choice==='joke'){
  if(close){Object.assign(delta,{affection:1});text={seoyeon:'그 말 다른 사람한테도 하고 다니는 건 아니죠? …농담이에요. 그렇게 진지하게 보지 말고.',yeogyeong:'그럼 오늘 선배 간식값부터 정산할까요? 농담은 제가 더 잘하거든요.',soyul:warm?'…진짜, 그런 말은 갑자기 하지 마. 웃는 거 보고 일부러 그러지?':'또 장난친다. 나 이번에는 안 속아.'}[id];}
  else {Object.assign(delta,{tension:1});text={seoyeon:'아… 그런 뜻이었어요? 아직 선배 농담에는 적응이 안 돼서요.',yeogyeong:'농담이죠? 제가 진지하게 듣고 있었는데.',soyul:'네? …아, 농담이었구나.'}[id];}
  stage=close?'서로 웃는 동안 다음 말이 조금 늦어진다.':'상대가 태이의 표정을 잠깐 살핀다.';
 }else if(choice==='deepen'){
  const safe=r.trust>=3;
  if(safe)Object.assign(delta,{trust:1,affection:1});
  text=safe?{seoyeon:'계속 괜찮다고 대답하면 진짜 괜찮은 줄 알더라고요. 저도 말을 해야 하는데… 분위기 망치는 건 싫어서.',yeogyeong:'제가 확인을 놓치면 다들 불편해지잖아요. 그래서 자꾸 다시 보는데, 남한테는 못 믿는 것처럼 보일까 봐 신경 쓰여요.',soyul:'말하려고 했는데 타이밍을 놓쳤어. 다들 이미 다음 얘기를 하면, 다시 꺼내는 게… 생각보다 어렵더라.'}[id]:{seoyeon:'그건… 아직 길게 이야기할 만큼 정리가 안 됐어요. 다음에 해도 될까요?',yeogyeong:'음, 아직 제 얘기를 그렇게 자세히 하기는 조금 어색해요.',soyul:'아… 그건, 지금은 잘 모르겠어요. 미안해요.'}[id];
  stage=safe?'잠시 침묵이 흐른 뒤, 조금 더 개인적인 대답이 돌아온다.':'더 묻지 않고 기다릴 여지가 남는다.';
 }else if(choice==='share'){
  Object.assign(delta,{trust:1});
  text={seoyeon:close?'선배도 혼자 다 처리하려고 하는 편이네요. 힘들 때는 괜찮다고만 하지 말아요. 저도 그래볼 테니까.':'곡에 자기 이야기를 담는 거군요. 무대에서 봤을 때는 그런 고민까지는 몰랐어요.',yeogyeong:'합주에 작업에 공부까지요? 그럼 선배도 일정 확인해줄 사람이 있어야 하는 거 아니에요?',soyul:close?'그 곡… 완성되면 들려줄래? 잘 몰라도 그냥 들어줄 수는 있으니까.':'자기 이야기를 남한테 들려주는 거, 안 떨려요? 저는 사진 한 장 보여주는 것도 망설이는데.'}[id];
  stage='태이는 만들고 있는 곡과 복학 후의 생활을 이야기한다. 대화가 한쪽의 질문에만 머무르지 않는다.';
 }else if(choice==='repair'){
  if(s.dialogue.observations?.[id])s.dialogue.observations[id].boundary='acknowledged';
  Object.assign(delta,{tension:-1});
  text={seoyeon:'알아줘서 고마워요. 다음에는 먼저 물어봐주면 좋겠어요.',yeogyeong:'네. 저도 바로 이야기할게요. 혼자 기분 나빠하고 있지는 않을게요.',soyul:'…응. 말해줘서 고마워. 나도 싫으면 제대로 얘기해볼게.'}[id];
  stage='사과를 받아들였다고 불편했던 기억까지 바로 사라지지는 않는다.';
 }else if(choice==='promise'){
  s.dialogue.promises[id]='pending';
  text={seoyeon:'좋아요. 이따 봐요. 다른 일 생기면 알려주고요.',yeogyeong:'그럼 오는 걸로 적을게요. 고마워요.',soyul:'정말요? …네. 그럼 이따 봬요.'}[id];
  stage='상대는 참석하겠다는 말을 약속으로 받아들였다.';
 }else{
  Object.assign(delta,{trust:-1,tension:2});
  text={seoyeon:'그건 알아요. 그래도 지금은 제가 정리할게요. 제 일정은 제가 정하고 싶어요.',yeogyeong:'선배 눈에는 답답하겠죠. 그래도 제가 확인하고 끝내고 싶은 일이에요.',soyul:close?'나도 고르려고 보고 있는 거야. 그냥 멍하니 있는 거 아니고.':'저도 고르려고 보고 있어요. 그냥 보고만 있는 건 아니에요.'}[id];
  stage='선의로 건넨 말이어도 상대가 원하는 방식은 아닐 수 있다.';
 }
 if(!repeated)changeRelationship(s,id,'taei',delta);
 if(!repeated)conversationExperience(s,id,choice,`${s.phase}:ordinary:${choice}`);
 const result={person:id,choice,day:s.day??1,phase:s.phase,text,stage,playerLine:current.options.find(o=>o.id===choice)?.label??'',followup:'',repeated};
 s.dialogue.history.push(result);
 return {state:s,result};
}

function ensureConversations(s){
 s.dialogue.sessions??={};s.dialogue.facts??={};s.dialogue.observations??={};s.dialogue.sceneAwards??={};
}
export function endTopic(state,id){
 const s=structuredClone(state);ensureConversations(s);
 const session=s.dialogue.sessions[sceneKey(s,id)];if(session){const n=sceneNodes(s,id,session)[session.node];const finished=n?.options.every(o=>o.next==='_close')??false;if(finished&&!session.closed&&!session.node.startsWith('ctx'))rememberConversation(s,id,session);session.closed=true;session.finished=finished&&!session.node.startsWith('ctx');}
 return s;
}
function beginScene(state,id,choice,initiated=false){
 const current=dialogue(state,id);
 if(current.scene||!current.options.some(o=>o.id===choice))throw new Error('지금 나누던 이야기에 먼저 답해주세요.');
 const s=structuredClone(state);ensureConversations(s);
 const key=sceneKey(s,id),intent=socialIntent(s,id),prior=s.dialogue.sessions[key];
 const continuation=followupCandidate(s,id);
 const session={...(continuation?{episode:continuation.episode}:{}),node:continuation?'start':prior?.lastNode??'start',closed:false,casual:s.dialogue.facts?.[id]?.speech==='casual',variant:continuation?'followup':intent.mode==='guarded'?'guarded':'normal'};
 if(choice==='joke'&&!prior&&(s.day??1)===1)session.node={seoyeon:'ice',yeogyeong:'joke',soyul:'start'}[id];
 if(session.variant==='guarded')session.node='start';
 const status=npcNow(s,id);
 if(session.variant!=='guarded'&&(status.bandwidth!=='open'||s.academics?.enabled&&['resting','focused','bright'].includes(status.mood))){session.topicEntry=session.node;session.context={mood:status.mood,bandwidth:status.bandwidth,next:status.next};session.node='ctxStart';}
 s.dialogue.sessions[key]=session;
 const n=sceneNodes(s,id,session)[session.node]??sceneNodes(s,id,session).start;
 const award=key+':entry';
 if(!s.dialogue.sceneAwards[award]){
  if(!initiated)changeRelationship(s,id,'taei',{familiarity:1,...(choice==='joke'&&intent.willingToJoke?{affection:1}:{})});
  s.dialogue.sceneAwards[award]=true;
 }
 const result={person:id,day:s.day??1,phase:s.phase,choice:initiated?'npc:personal':choice,initiated,playerLine:initiated?'':current.options.find(o=>o.id===choice).label,text:n.text,stage:n.stage,scene:true,repeated:!!prior};
 s.dialogue.history.push(result);return {state:s,result};
}
function advanceScene(state,id,choice){
 const s=structuredClone(state);ensureConversations(s);
 const key=sceneKey(s,id),session=s.dialogue.sessions[key];
 if(!session||session.closed)throw new Error('진행 중인 대화가 없습니다.');
 const nodes=sceneNodes(s,id,session),current=nodes[session.node];
 const selected=current?.options.find(o=>o.id===choice);
 if(selected&&choice.startsWith('ctx')&&!session.context){const now=npcNow(s,id);session.context={mood:now.mood,bandwidth:now.bandwidth,next:now.next};session.topicEntry=session.node;}
 if(!selected)throw new Error('현재 이야기와 맞지 않는 대답입니다.');
 const award=key+(session.variant==='followup'?':followup:'+session.episode:'')+':'+choice;
 if(!s.dialogue.sceneAwards[award]){
  changeRelationship(s,id,'taei',selected.delta);conversationExperience(s,id,choice,award);s.dialogue.sceneAwards[award]=true;
 }
 if(choice==='apologize'&&s.dialogue.observations[id])s.dialogue.observations[id].boundary='acknowledged';
 if(id==='soyul'&&s.day===3&&s.eventState?.flags?.captionEncountered&&socialIntent(s,id).feelsSafe&&['specific','honest','soft'].includes(choice)&&!s.eventState.flags.captionReviewed){s.eventState.flags.captionReviewed=true;s.memory.push('[3일차] 소율의 설명 문구를 함께 읽고 구체적인 의견을 나눴다.');}
 if(selected.fact){
  const [name,value]=selected.fact;s.dialogue.facts[id]??={};s.dialogue.facts[id][name]=value;
  s.dialogue.observations[id]??={};s.dialogue.observations[id][name]=value;
 }
 const leaving=selected.next==='_close';
 if(leaving){if(!session.node.startsWith('ctx'))rememberConversation(s,id,session);session.closed=true;session.finished=!session.node.startsWith('ctx');session.lastNode=session.node.startsWith('ctx')?(session.topicEntry??'start'):session.node;}
 else {session.node=selected.next;session.lastNode=selected.next;}
 const next=leaving?current:sceneNodes(s,id,session)[session.node];
 if(!next)throw new Error('대화의 다음 장면이 없습니다.');
 const result={person:id,day:s.day??1,phase:s.phase,choice:'scene:'+choice,playerLine:selected.label,text:next.text,stage:next.stage,scene:true,leave:leaving};
 s.dialogue.history.push(result);return {state:s,result};
}

export function openConversation(state,id){
 if(!contact(state,id).introduced){const s=structuredClone(state);s.contacts??={};s.contacts[id]={...contact(s,id),seen:true,approaches:contact(s,id).approaches+1};return {state:s,result:null};}
 const current=dialogue(state,id),intent=socialIntent(state,id);
 if(current.scene)return {state,result:null};
 const key=sceneKey(state,id);
 // A person can initiate a topic once per encounter period, not every menu visit.
 if((!state.dialogue?.sessions?.[key]||followupCandidate(state,id))&&['seek-company','cautious-interest','guarded','task'].includes(intent.mode))
  return beginScene(state,id,'personal',true);
 return {state,result:null};
}
