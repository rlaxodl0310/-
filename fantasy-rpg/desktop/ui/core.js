(function(root){
 const CAST={narrator:{name:'상황',text:'현실의 환경 묘사'},yeogyeong:{name:'차여경',text:'같은 반 친구. 차분하고 올바르며 겁이 많다. 간호학과 진학을 준비한다.'}};
 function reply(actor,text){
  const topic=/안녕|반가|이름/.test(text)?'hello':/괜찮|쉬|휴식|무서|걱정/.test(text)?'care':/어디|지도|길|주변|확인|살펴/.test(text)?'look':null;
  const lines={yeogyeong:{hello:'응. 오늘은 좀 일찍 나왔네.',care:'괜찮아. 아직 학교까지 시간 좀 남았잖아.',look:'다음 역 안내가 곧 나올 것 같은데.'}};
  return topic?lines[actor]?.[topic]||'잠깐 확인해 볼게요.':'[체험 안내] 지금은 작성형 체험 모드예요. 상단 ChatGPT 연결에서 로그인하면 AI와 대화할 수 있어요. 위의 선택지로도 장면을 진행할 수 있어요.';
 }
 function validateSave(raw,D,Engine){
  if(!raw||raw.version!==D.saveVersion||typeof raw.engine!=='string'||!Array.isArray(raw.logs)||raw.logs.length>300||typeof raw.large!=='boolean'||typeof raw.motion!=='boolean')throw Error('지원하지 않는 저장 파일입니다.');
  const engine=Engine.restore(D,raw.engine);
  for(const row of raw.logs)if(!row||typeof row.speaker!=='string'||typeof row.text!=='string'||row.text.length>2000||row.speaker.length>100)throw Error('대화 기록이 올바르지 않습니다.');
  return {engine,logs:raw.logs,large:raw.large,motion:raw.motion};
 }
 function partyInfo(data,state){return Object.entries(data.publicFacts).filter(([id])=>state.flags.includes('companion_'+id)&&id!==data.player.id).map(([id,fact])=>({id,name:fact.name,age:state.flags.includes('known_age_'+id)?fact.age??null:null}));}
 function codexInfo(data,state){return data.catalog.map((person,index)=>{const known=data.initiallyKnown.includes(person.id)||state.flags.includes('known_person_'+person.id);if(!known)return{index:index+1,known:false,name:'아직 모르는 인물',age:null};return{index:index+1,id:person.id,known:true,name:person.name,age:person.id===data.player.id||state.flags.includes('known_age_'+person.id)?person.age:null};});}
 const api={CAST,reply,validateSave,partyInfo,codexInfo};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GameCore=api;
})(globalThis);
