// User-confirmed character settings. No inferred skill levels, jobs or lesson schedules.
export const characterPersonalities={
 yeogyeong:{name:'차여경',summary:'차분하고 귀여운 성격. 겁이 많은 편이며 무서움을 느끼면 눈과 입, 얼굴에 확실히 드러난다.',planning:{care:12,safety:18,risk:-12},voice:'차분한 말투를 유지하되 놀랐을 때 잠깐 말이 끊기거나 솔직하게 무섭다고 말한다. 유아적인 말투로 바꾸지 않는다.'},
 seoyeon:{name:'한서연',summary:'차분하지만 자기 주관과 확고한 의지가 뚜렷하다. 하고 싶은 일이 생기면 피겨나 양궁 같은 활동도 직접 돈을 벌어 레슨을 받을 만큼 스스로 준비하고 실행한다.',planning:{care:14,safety:5,risk:4},voice:'조용하고 또렷하게 본인의 선택과 이유를 말한다. 다른 사람의 의견도 듣되 친절함을 무조건적인 동의로 표현하지 않는다.'}
};
export function visibleFear(id,text){return id==='yeogyeong'&&/무서|겁이|겁나|겁먹|겁을 먹|두려|으악|비명|쾅|벌벌|깜짝|놀랐|좀비.*(가까|다가|앞)|감염체.*(가까|다가|앞)/.test(String(text))&&!/무섭지 않|겁나지 않|이제.*안 무서/.test(String(text));}
export function personalityReaction(id,{text='',fear=0,danger=false}={}){return id==='yeogyeong'&&(visibleFear(id,text)||danger&&fear>=35)?{visible:true,label:'눈이 크게 뜨이고 입술이 굳어 겁먹은 기색이 확실히 드러난다.',line:'무서운 건 얼굴에 다 티 나죠… 그래도 먼저 돌아올 길부터 확인하고 싶어요.'}:{visible:false,label:'',line:''};}
