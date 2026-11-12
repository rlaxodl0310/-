import test from 'node:test';
import assert from 'node:assert/strict';
import {characterAbilities,characterAbilityIds,rarityForAbilities,initializeCharacterSystem,characterPresent,attributeAttackChance,attributeEffortCost,attributeMoveRange,attributeFearLoad} from './character-stats.js';
import {characterStatsContent} from './character-stats-ui.js';
import {newGame,newReturningGame,save,restore} from './simulation.js';
import {currentSchedule} from './days.js';
import {personalEventsAt,beginPersonalEvent} from './personal-events.js';
import {fairStudents,fairVisitDay,fairStudentLocation} from './fair-events.js';
import {dogyeomEventsAt} from './dogyeom-events.js';
import {evaluateEvents} from './event-engine.js';
import {introduce} from './identity.js';
import {survivalCondition,spendSurvivalEffort,advanceSurvivalHealth} from './survival-health.js';
import {startSurvival} from './survival-base.js';
import {startGridCombat,tacticalPaths,gridAct,tacticalMoveCost} from './combat-grid.js';
const all=n=>({strength:n,agility:n,vitality:n,endurance:n,mentality:n});
function fresh(seed=1){return initializeCharacterSystem(newGame(),{seed});}
test('17 profiles have bounded physical abilities; stronger totals mean rarer appearance, not a sex multiplier',()=>{
 assert.equal(characterAbilityIds.length,17);for(const id of characterAbilityIds){const stats=characterAbilities(id);assert.equal(Object.keys(stats).length,5);assert.ok(Object.values(stats).every(n=>Number.isInteger(n)&&n>=1&&n<=10));}
 assert.ok(characterAbilities('taei').strength>5);assert.ok(characterAbilities('taei').agility>5);assert.ok(characterAbilities('iseo').agility>4);
 const levels=[all(2),all(4),all(5),all(6),all(8)].map(rarityForAbilities);assert.deepEqual(levels.map(x=>x.tier),[0,1,2,3,4]);for(let i=1;i<levels.length;i++)assert.ok(levels[i].probability<levels[i-1].probability);
});
test('population and stat snapshot persist through save/load, time changes and view reads; protagonist stays',()=>{
 const s=fresh(817),population=structuredClone(s.characterSystem),before=save(s);assert.equal(characterPresent(s,'taei'),true);assert.match(characterStatsContent(s),/김태이/);assert.equal((characterStatsContent(s).match(/data-stats-character=/g)??[]).length,1);for(let i=0;i<5;i++){currentSchedule(s);personalEventsAt(s);characterStatsContent(s);}assert.equal(save(s),before);
 const loaded=restore(before);assert.deepEqual(loaded.characterSystem,population);loaded.day=9;loaded.clock.minute=900;initializeCharacterSystem(loaded,{seed:999});assert.deepEqual(loaded.characterSystem,population);
 assert.ok(newReturningGame().characterSystem);assert.equal(newGame().characterSystem,undefined);
});
test('fixed seeds vary encounter population; public records never expose missing cast',()=>{
 const populations=new Set();let appearances=0;
 for(let seed=0;seed<300;seed++){const s=fresh(seed);populations.add(JSON.stringify(s.characterSystem.presence));appearances+=Number(characterPresent(s,'iseo'));}
 assert.ok(populations.size>20);assert.ok(appearances>130&&appearances<230);
 const s=fresh(1);for(const id of characterAbilityIds)if(id!=='taei')s.characterSystem.presence[id]=false;s.location='hall';
 assert.deepEqual(currentSchedule(s),{});assert.ok(personalEventsAt(s).every(e=>e.person==='taei'));assert.deepEqual(dogyeomEventsAt(s,'gym'),[]);assert.throws(()=>beginPersonalEvent(s,'iseo'));
 s.day=fairVisitDay(s);s.clock.minute=610;for(const id of Object.keys(fairStudents))assert.equal(fairStudentLocation(s,id),null);
 const blocked=evaluateEvents(s,{trigger:'check'},[{id:'absent-scene',kind:'conditional',stages:['campus'],trigger:'check',participants:['soyul'],when:()=>true,effect:x=>{x.known.push('should never happen');}}]);assert.equal(blocked.events.some(e=>e.id==='absent-scene'),false);assert.equal(blocked.known.includes('should never happen'),false);
 assert.equal(characterStatsContent(s).includes('박소율'),false);
 introduce(s,'soyul');assert.equal(characterPresent(s,'soyul'),true);assert.equal(characterStatsContent(s).includes('박소율'),true);
});
test('endurance changes accumulating deprivation load but not real food/water consumption',()=>{
 const member=e=>({key:'taei',attributes:{...all(4),endurance:e},fatigue:20,stress:20,injury:0,nutrition:15,hydration:15});const weak={members:[member(1)]},strong={members:[member(10)]};
 spendSurvivalEffort(weak);spendSurvivalEffort(strong);assert.equal(weak.members[0].nutrition,strong.members[0].nutrition);assert.equal(weak.members[0].hydration,strong.members[0].hydration);assert.ok(weak.members[0].fatigue>strong.members[0].fatigue);assert.ok(weak.members[0].stress>strong.members[0].stress);
 assert.ok(attributeFearLoad({attributes:{...all(4),endurance:10},fear:80})<attributeFearLoad({attributes:{...all(4),endurance:1},fear:80}));
});
test('mentality changes existing debuff penalties, not fear values, wound care or starvation survival',()=>{
 const m={fatigue:60,stress:60,injury:1,nutrition:10,hydration:10,woundRisk:50};const low={...m,attributes:{...all(4),mentality:1}},high={...m,attributes:{...all(4),mentality:10}};
 assert.ok(survivalCondition(high).stamina>survivalCondition(low).stamina);assert.equal(survivalCondition(high).fear,survivalCondition(low).fear);assert.equal(survivalCondition(high).staminaCap,survivalCondition(low).staminaCap);
 assert.ok(attributeAttackChance({attributes:high.attributes,fear:90,wounds:2})>attributeAttackChance({attributes:low.attributes,fear:90,wounds:2}));
 const run={status:'active',members:[{...high,key:'taei',nutrition:0,hydration:0,dryNights:2,starveNights:4,injury:0}]};advanceSurvivalHealth(run,0,0,1);assert.equal(run.status,'overrun');
});
test('strength/agility/vitality affect actual new combat and camp characters; legacy battles retain old rules',()=>{
 const state=fresh(5),grid=startGridCombat(state),old=startGridCombat(newGame());assert.equal(grid.combatTrial.actors.taei.attributes.strength,7);assert.equal(old.combatTrial.actors.taei.attributes,undefined);assert.equal(attributeMoveRange(grid.combatTrial.actors.taei),4);assert.ok(tacticalPaths(grid,'taei').some(p=>p.path.length===4));assert.ok(tacticalPaths(old,'taei').every(p=>p.path.length<=3));
 assert.ok(attributeEffortCost(grid.combatTrial.actors.taei,16)<16);assert.ok(tacticalMoveCost(grid.combatTrial.actors.taei,true)<tacticalMoveCost(old.combatTrial.actors.taei,true));
 grid.combatTrial.actors.taei.x=5;const stamina=grid.combatTrial.actors.taei.stamina,acted=gridAct(grid,'taei','strike',{id:1});assert.equal(acted.combatTrial.actors.taei.stamina,stamina-attributeEffortCost(grid.combatTrial.actors.taei,16));
 assert.deepEqual(startSurvival(state).survivalRun.members[0].attributes,state.characterSystem.profiles.taei);assert.equal(startSurvival(newGame()).survivalRun.members[0].attributes,undefined);
});
