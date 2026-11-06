// Isolated conversation audition: never modifies the live campus state.
export function newIseoPreview(round=0){return {node:'greet',introduced:false,comfort:0,round,beat:0};}
export function iseoPreviewView(s){
 const variant=s.round%3;
 const name=s.introduced?'정이서':'단발머리 학생';
 const nodes={
 greet:{expression:0,lines:[['저기요. 여기 앉아도 돼요? 가방 놓여 있어서 물어보려고요.','아, 혹시 옆자리 비어 있어요? 잠깐만 앉으려고요.','여기 자리 있어요? 없으면 저 잠깐만 쉬어도 될까요?'][variant]],options:[['welcome','네, 비어 있어요. 편하게 앉아요.'],['busy','잠깐 뒤에 나가야 하는데, 괜찮아요.'],['leave','죄송해요. 곧 다른 사람이 올 거예요.']]},
 chat:{expression:1,lines:['고마워요. 저 표정 때문에 말 걸기 어렵다는 얘기 자주 듣거든요. 근데 제가 먼저 말 걸었네.','운동하고 와서 잠깐 쉬는 중이에요. 가만히 있으면 좋은데, 또 가만히 있으면 심심하고. 좀 모순이죠?'],options:[['introduce','저는 김태이예요. 이름 물어봐도 돼요?'],['tease','조용한 분일 줄 알았는데, 말씀 잘하시네요.'],['listen','운동하고 나면 좀 느긋하게 쉬고 싶죠.']]},
 brief:{expression:0,lines:['그럼 오래 붙잡으면 안 되겠네요. 저도 잠깐 쉬고 갈 거라.','급하면 먼저 가세요. 아까 앉아도 된다고 한 건 고마워요.'],options:[['introduce','가기 전에 인사만 할게요. 김태이예요.'],['leave','네. 잠깐 쉬었다 가세요.']]},
 introduce:{expression:1,lines:['아, 태이 씨. 저는 정이서예요. 반가워요.','이름 듣고 나니까 갑자기 제대로 인사해야 할 것 같네. 저 방금 너무 혼자 떠들었죠?'],options:[['reassure','아니요. 덕분에 조용하진 않았어요.'],['tease','조금요. 인사보다 이야기를 먼저 들었네요.'],['leave','저는 슬슬 가볼게요. 반가웠어요.']]},
 tease:{expression:2,lines:[s.introduced?'이름 알려주자마자 놀리기예요? 너무한데.':'아, 그 말 진짜 많이 들어요. 그렇게 조용해 보이나?','그래도 싫다는 뜻은 아니죠? 저 혼자 신나서 떠든 거면 조금 민망한데.'],options:[['reassure','싫은 건 아니에요. 생각보다 편하게 이야기하시네요.'],['boundary','지금은 조용히 쉬고 싶긴 해요.'],...(s.introduced?[]:[['introduce','저는 김태이예요. 이제 인사도 할까요?']])]},
 listen:{expression:1,lines:['맞아요. 뭘 열심히 안 해도 되는 시간이 필요해요.','근데 쉬면서도 오늘 뭐 했는지 계속 말하게 돼요. 옆에서 들어주는 사람 있으면 더 그렇고.'],options:[['introduce','그러고 보니 이름도 안 물어봤네요. 김태이예요.'],['boundary','저는 잠깐 혼자 쉬다가 갈게요.'],['leave','잘 쉬었으면 좋겠네요. 저는 가볼게요.']]},
 reassure:{expression:1,lines:[s.introduced?'그럼 됐어요. 태이 씨도 하고 싶은 말 있으면 해요. 저 듣는 것도 잘해요.':'다행이다. 말해 놓고 혼자 눈치 봤잖아요.','아, 근데 다음에 또 보면 제가 먼저 인사해도 되죠? 못 알아보면 조금 서운할 것 같은데.'],options:[['bye','네. 다음에 마주치면 인사해요.'],['boundary','그때 상황 봐서 편하게 인사해요.']]},
 boundary:{expression:0,lines:['아, 알겠어요. 제가 제 얘기만 했네요. 말해줘서 고마워요.','그럼 저도 조용히 쉬다가 갈게요. 편하게 있어요.'],options:[]},
 bye:{expression:1,lines:['좋아요. 그때는 제가 먼저 알아볼게요.','지금은 가는 길 안 붙잡을게요. 조심히 가요!'],options:[]},
 leave:{expression:0,lines:['아, 네. 알겠어요. 좋은 하루 보내세요.'],options:[]}
 };
 return {name,...nodes[s.node]};
}
export function advanceIseoPreview(s,choice){
 const view=iseoPreviewView(s);
 if(choice==='next'){if(s.beat>=view.lines.length-1)throw new Error('더 읽을 문장이 없습니다.');return {...s,beat:s.beat+1};}
 if(s.beat<view.lines.length-1||!view.options.some(([id])=>id===choice))throw new Error('현재 대화에서 고를 수 없는 말입니다.');
 return {...s,node:choice==='welcome'?'chat':choice==='busy'?'brief':choice,introduced:s.introduced||choice==='introduce',comfort:s.comfort+(choice==='reassure'?1:0),beat:0};
}
