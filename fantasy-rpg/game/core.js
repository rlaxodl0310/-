(function(root){
 const CAST={taei:{name:'김태이',text:'18세 · 고등학교 2학년. 등교하던 지하철에서 이세계로 전송된 주인공. 고유 특성의 동반자 제로와 함께 성장한다.'},dogyeom:{name:'백도겸',text:'같은 학교의 유명한 문제아. 태이와는 서로 존재만 알던 사이. 고유 특성 반동과 뛰어난 전투 센스·담력·정신력을 지녔다.'},seoha:{name:'윤서하',text:'같은 학교 학생. 차가운 무표정과 달리 엉뚱하고 딴생각이 많다. 고유 특성 경계: 그어 둔 선을 가로지르는 움직임을 한 차례 끊는다.'},yeogyeong:{name:'차여경',text:'태이와 조금 친한 같은 반 친구. 차분하고 올바르며 겁이 많고 귀여운 성격. 간호학과 진학을 준비했고 치유에 재능이 있다. 고유 특성 유예로 부상 상태를 잠시 고정한다.'},woojin:{name:'정우진 · 시안',text:'29세 물류회사 현장 직원으로 제안한 전송자. 말수가 적고 현실적이며 다부진 체형. 세부 설정과 고유 특성은 검토 중이다.'}};
 function reply(actor,text){
  const topic=/안녕|반가|이름/.test(text)?'hello':/괜찮|쉬|휴식|무서|걱정/.test(text)?'care':/어디|지도|길|주변|확인|살펴/.test(text)?'look':null;
  const lines={taei:{hello:'응. 잠깐 이것부터 확인하고.',care:'괜찮아. 급하게 움직이지는 않으려고.',look:'지도랑 실제 길이 좀 달라 보여. 한 번 더 보자.'},dogyeom:{hello:'……왜.',care:'알아서 해. 무리할 생각 없어.',look:'모르는 데를 그냥 들어가자고? 먼저 보고.'},seoha:{hello:'응? 아, 안녕.',care:'괜찮아. 잠깐 다른 생각 했어.',look:'저쪽 보고 있었어. 뭐가 움직여서.'},yeogyeong:{hello:'응. 무슨 일이야?',care:'조금 긴장했나 봐. 잠깐 쉬면 괜찮을 것 같아.',look:'바로 가기보다는 여기서 먼저 확인해 보자.'},woojin:{hello:'네. 무슨 일이에요?',care:'잠깐 앉아 있으면 괜찮겠죠.',look:'움직이기 전에 주변부터 보죠.'}};
  return topic?lines[actor]?.[topic]||'잠깐 확인해 볼게요.':'[체험 안내] 지금은 작성형 체험 모드예요. 상단 AI 시작을 눌러 모델을 준비하면 자유롭게 대화할 수 있어요. 위의 선택지로도 장면을 진행할 수 있어요.';
 }
 function validateSave(raw,D,Engine){
  if(!raw||raw.version!==1||typeof raw.engine!=='string'||!Array.isArray(raw.logs)||raw.logs.length>300||typeof raw.large!=='boolean'||typeof raw.motion!=='boolean')throw Error('지원하지 않는 저장 파일입니다.');
  const engine=Engine.restore(D,raw.engine);
  for(const row of raw.logs)if(!row||typeof row.speaker!=='string'||typeof row.text!=='string'||row.text.length>2000||row.speaker.length>100)throw Error('대화 기록이 올바르지 않습니다.');
  return {engine,logs:raw.logs,large:raw.large,motion:raw.motion};
 }
 const api={CAST,reply,validateSave};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GameCore=api;
})(globalThis);
