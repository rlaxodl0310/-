'use strict';

const Catalog=require('../ui/monsters/catalog.js');
const FreeEncounter=require('./free-encounter.cjs');
const {policy}=require('../ui/adventure/tracking.js');
const observeText='안전한 거리에서 더 관찰한다';
const submitText='협회에 현장 조사 기록을 제출한다';
const normalize=text=>text.trim().replace(/[.!。]$/,'');
const profile=id=>Catalog.sightings.find(monster=>monster.id===id)?.research;
const ambiguous=/소문|들었다|들었다고|가능성|모른다|지 않았|지 않는다|할 수|할 듯|할지도|것 같다|한다고|예상|상상|기억|아마|흔적만/;

function observe(state,text){
 if(normalize(text)!==observeText)return null;
 const encounter=FreeEncounter.current(state);
 if(!encounter||encounter.location!==state.location||!profile(encounter.species)||
    state.combat?.status==='playing'||state.player.hp<=0)
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
 if(state.era!=='fantasy'||state.combat?.status==='playing'||state.player.hp<=0||
    !facilities.some(f=>f.type==='association'))throw Error('현재 장소의 협회에서 제출하세요.');
 const completed=Object.entries(state.fieldResearch||{}).filter(([id,record])=>{
  const tasks=profile(id);
  return tasks&&!record.submitted&&Object.keys(tasks).every(key=>record.observations?.[key]);
 });
 if(!completed.length)throw Error('제출할 수 있는 완성 조사 기록이 없습니다.');
 const fieldResearch={...state.fieldResearch};
 for(const [id,record] of completed)fieldResearch[id]={...record,submitted:{location:state.location,minutes:state.minutes}};
 return fieldResearch;
}

module.exports={observe,submit,capture,observeText,submitText,minutes:policy.observeMinutes};
