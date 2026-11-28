'use strict';

const Catalog=require('../ui/monsters/catalog.js');
const FreeEncounter=require('./free-encounter.cjs');
const {policy}=require('../ui/adventure/tracking.js');
const {observe:observeText,submit:submitText}=Catalog.fieldResearchActions;
const normalize=text=>text.trim().replace(/[.!。]$/,'');
const profile=id=>Catalog.researchFor(id)?.research;
const ambiguous=/소문|들었다|들었다고|가능성|모른다|지 않았|지 않는다|할 수|할 준비|하려|기려 한다|하기 직전|할 태세|할 듯|할지도|것 같다|한다고|예상|상상|기억|아마|흔적만|하지 않|하지 못|않았|않는다|않고| 못했다|가정|전해진|했다고/;

function followClue(state,text){
 const input=normalize(text);
 const definition=Catalog.researchMonsters.find(monster=>monster.input===input);
 if(!definition)return null;
 const progress=Catalog.researchStatus(state,definition.id);
 if(!Catalog.researchAvailable(state)||!progress.clue)
  throw Error('협회에 제출한 조사 기록이 있어야 현장의 단서를 확인할 수 있습니다.');
 return {species:definition.id,...progress.clue};
}

function recordClue(state,clue,appearances){
 const record=state.fieldResearch[clue.species];
 const evidence=appearances.find(item=>item.id===clue.species&&!ambiguous.test(item.evidence)&&
  new RegExp(clue.pattern).test(item.evidence))?.evidence;
 const attempt={location:state.location,minutes:state.minutes,evidence:evidence||null};
 state.fieldResearch={...state.fieldResearch,[clue.species]:{
  ...record,clueAttempt:attempt,clueDiscovery:record.clueDiscovery||(evidence?attempt:null),
 }};
}

function observe(state,text){
 if(normalize(text)!==observeText)return null;
 const encounter=FreeEncounter.current(state);
 if(!encounter||encounter.location!==state.location||!profile(encounter.species)||
    !Catalog.researchAvailable(state))
  throw Error('현재 장소에서 유효한 조사 조우가 필요합니다.');
 if(state.minutes+policy.observeMinutes>=encounter.expiresAt)throw Error('조사를 마치기 전에 조우 기록이 만료됩니다.');
 return encounter;
}

function capture(next,appearances){
 let research=next.fieldResearch;
 for(const sighting of appearances){
  const tasks=profile(sighting.id);
  if(!tasks||ambiguous.test(sighting.evidence))continue;
  const prior=research?.[sighting.id]||{observations:{}};
  const observations={...prior.observations};
  for(const [id,task] of Object.entries(tasks)){
   if(!observations[id]&&(!task.pattern||new RegExp(task.pattern).test(sighting.evidence)))
    observations[id]={location:next.location,minutes:next.minutes,evidence:sighting.evidence};
  }
  research={...research,[sighting.id]:{...prior,observations}};
 }
 if(research)next.fieldResearch=research;
}

function submit(state,text,facilities){
 if(normalize(text)!==submitText)return null;
 if(!Catalog.researchAvailable(state)||
    !facilities.some(f=>f.type==='association'))throw Error('현재 장소의 협회에서 제출하세요.');
 const completed=Object.entries(state.fieldResearch||{}).filter(([id,record])=>{
  const status=Catalog.researchStatus(state,id);
  return status?.complete&&!record.submitted;
 });
 if(!completed.length)throw Error('제출할 수 있는 완성 조사 기록이 없습니다.');
 const fieldResearch={...state.fieldResearch};
 for(const [id,record] of completed)fieldResearch[id]={...record,submitted:{location:state.location,minutes:state.minutes}};
 return fieldResearch;
}

module.exports={observe,submit,capture,profile,followClue,recordClue,observeText,submitText,minutes:policy.observeMinutes};
