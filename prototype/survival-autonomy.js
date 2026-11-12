import {entityAbilities,gainCharacterPractice} from './character-stats.js';
import {survivalCondition} from './survival-health.js';
import {displayName} from './identity.js';
// Personality weights are balance proposals, not predetermined betrayals.
const fearResponses={taei:{escape:.1,selfPreservation:.1},yeogyeong:{escape:.35,selfPreservation:.2},seoyeon:{escape:.4,selfPreservation:.2},soyul:{escape:.55,selfPreservation:.3},iseo:{escape:.3,selfPreservation:.25},dogyeom:{escape:.3,selfPreservation:.35}};
export function survivalMind(member){return {exposure:0,state:'steady',lastDay:0,...member.mind};}
export function survivalMemberAvailable(member){return !['panic','away','departed'].includes(survivalMind(member).state);}
function mindRoll(seed,day,key,salt){let h=(seed^Math.imul(day+1,2654435761))>>>0;for(const c of key+salt)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;h=Math.imul(h^(h>>>16),2246822507)>>>0;return (h^(h>>>13))>>>0;}
export function resolveSurvivalAutonomy(state,day){
 if(!state.characterSystem)return [];
 const run=state.survivalRun,events=[];
 for(const member of run.members){
  const mind=member.mind=survivalMind(member);if(mind.lastDay>=day||mind.state==='departed')continue;mind.lastDay=day;
  const name=member.label??displayName(state,member.character),stats=entityAbilities(member),fear=survivalCondition(member).fear;
  if(mind.state==='away'){mind.state='shaken';mind.exposure=Math.max(0,mind.exposure-1);events.push(`${name} · 연락 없이 떠났다가 돌아왔다. 당분간 혼자 맡기는 일은 재고해야 한다.`);continue;}
  // Sustained fear, not one unlucky click. Low endurance builds exposure faster.
  mind.exposure=fear>=55?Math.min(20,mind.exposure+(55-stats.endurance)/25):Math.max(0,mind.exposure-2);
  if(fear<45){if(mind.state!=='steady')events.push(`${name} · 안전하게 쉬며 조금씩 안정을 되찾았다.`);mind.state='steady';continue;}
  mind.state='shaken';if(mind.exposure<4)continue;
  const relation=state.relations?.[`${member.character}>taei`]??{},trust=relation.trust??0,affection=relation.affection??0;
  const support=Math.min(.2,Math.max(0,trust)*.004+Math.max(0,affection)*.002);
  const risk=Math.max(.02,Math.min(.85,(fear-40)/100+mind.exposure*.025-(stats.endurance+stats.mentality)*.007-support));
  if(mindRoll(run.exploration?.seed??state.characterSystem.seed,day,member.key,'risk')/4294967296>=risk)continue;
  const profile=member.fearResponse??fearResponses[member.character]??{escape:.45,selfPreservation:.3};
  const choice=mindRoll(state.characterSystem.seed,day,member.key,'response')/4294967296;
  // Player agency is preserved: Taei can freeze, but never automatically betrays.
  if(member.key!=='taei'&&mind.exposure>=7&&choice<profile.selfPreservation*(1-support)){
   const stolen={food:Math.min(2,run.resources.food),water:Math.min(2,run.resources.water)};
   run.resources.food-=stolen.food;run.resources.water-=stolen.water;mind.state='departed';mind.taken=stolen;member.job='rest';
   if(state.relations?.[`${member.character}>taei`])state.relations[`${member.character}>taei`].trust-=8;
   events.push(`${name} · 식량 ${stolen.food}과 물 ${stolen.water}을 챙겨 일행을 버리고 떠났다.`);
  }else if(member.key!=='taei'&&choice<profile.escape){mind.state='away';member.job='rest';events.push(`${name} · 공포를 견디지 못하고 허락 없이 이탈했다. 현재 작업과 원정에 참여할 수 없다.`);}
  else{mind.state='panic';member.job='rest';events.push(`${name} · 패닉에 빠져 다음 활동에 참여하지 못한다. 안전한 휴식과 보살핌이 필요하다.`);}
  mind.events??=[];mind.events.push({day,state:mind.state,fear});
 }
 return events;
}
export function growSurvivalAbilities(state){
 if(!state.characterSystem)return;
 for(const member of state.survivalRun.members){if(!survivalMemberAvailable(member))continue;
  const c=survivalCondition(member);if(c.critical||c.nutrition<=35||c.hydration<=35||member.fatigue>=80)continue;
  if(member.job==='repair')gainCharacterPractice(state,member.character,'strength',2);
  if(member.job==='watch')gainCharacterPractice(state,member.character,'agility',2);
  if(member.job!=='rest')gainCharacterPractice(state,member.character,'vitality',2);
  if(c.fear>=40&&c.fear<65){gainCharacterPractice(state,member.character,'endurance',1);gainCharacterPractice(state,member.character,'mentality',1);}
 }
}
