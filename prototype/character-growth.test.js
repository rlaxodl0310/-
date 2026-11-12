import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeCharacterSystem,normalizeAbilities,characterAbilityIds,characterPotential,gainCharacterPractice,savedCharacterAbilities,characterStartingRarity,abilityPenaltyFactors} from './character-stats.js';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,finishSurvivalDay,launchSurvivalSortie,survivalAction,assignSurvivalJob,survivalNightRisk} from './survival-base.js';
import {resolveSurvivalAutonomy,survivalMemberAvailable} from './survival-autonomy.js';
import {characterStatsContent} from './character-stats-ui.js';
import {careSurvivalMember} from './survival-pack.js';
const all=n=>({strength:n,agility:n,vitality:n,endurance:n,mentality:n});
function camp(seed=1){let s=initializeCharacterSystem(newGame(),{seed});s=startSurvival(s);s.survivalRun.stage='settlement';s.survivalRun.day=3;return s;}
test('global caps and personal potentials differ, growth respects limits and survives save',()=>{
 assert.deepEqual(normalizeAbilities(all(99)),{strength:20,agility:20,vitality:50,endurance:50,mentality:50});
 for(const id of characterAbilityIds){const p=characterPotential(id);assert.ok(p.strength<=20&&p.agility<=20&&p.vitality<=50&&p.endurance<=50&&p.mentality<=50);}
 let s=camp(),initial=characterStartingRarity(s,'taei');for(let i=0;i<500;i++)gainCharacterPractice(s,'taei','strength',20);
 assert.equal(savedCharacterAbilities(s,'taei').strength,18);assert.equal(s.survivalRun.members[0].attributes.strength,18);assert.deepEqual(characterStartingRarity(s,'taei'),initial);
 s=restore(save(s));assert.equal(s.characterSystem.potentials.taei.strength,18);assert.equal(savedCharacterAbilities(s,'taei').strength,18);assert.match(characterStatsContent(s),/\/46/);
 assert.ok(abilityPenaltyFactors({attributes:all(50)}).mentality<abilityPenaltyFactors({attributes:all(10)}).mentality);
});
test('fear needs sustained exposure; quiet safety recovers; resolving a day twice cannot reroll',()=>{
 const s=camp(),m=s.survivalRun.members[1];m.attributes=all(1);m.stress=100;m.nutrition=15;m.hydration=15;
 resolveSurvivalAutonomy(s,3);assert.equal(m.mind.state,'shaken');assert.ok(m.mind.exposure<4);
 const snapshot=save(s);resolveSurvivalAutonomy(s,3);assert.equal(save(s),snapshot);
 m.stress=0;m.nutrition=90;m.hydration=90;resolveSurvivalAutonomy(s,4);assert.equal(m.mind.state,'steady');
});
test('low mental stats increase autonomous incidents and high trust never guarantees immunity',()=>{
 let weak=0,strong=0,trusted=0;
 for(let seed=1;seed<=150;seed++)for(const kind of ['weak','strong','trusted']){const s=camp(seed),m=s.survivalRun.members[1];m.attributes=all(kind==='strong'?50:1);m.stress=100;m.nutrition=10;m.hydration=10;m.mind={exposure:12,state:'shaken',lastDay:0};if(kind==='trusted')s.relations['student>taei']={trust:100,affection:100};resolveSurvivalAutonomy(s,3);if(!survivalMemberAvailable(m)){if(kind==='weak')weak++;if(kind==='strong')strong++;if(kind==='trusted')trusted++;}}
 assert.ok(weak>strong);assert.ok(trusted>0&&trusted<=weak);
});
test('departures remove real resources and participation; panic and missing actors cannot launch',()=>{
 let found=false;
 for(let seed=1;seed<=100&&!found;seed++){const s=camp(seed),r=s.survivalRun,m=r.members[1];m.attributes=all(1);m.stress=100;m.nutrition=10;m.hydration=10;m.fearResponse={escape:1,selfPreservation:1};m.mind={exposure:12,state:'shaken',lastDay:0};const before={...r.resources};resolveSurvivalAutonomy(s,3);if(m.mind.state!=='departed')continue;found=true;assert.equal(r.resources.food,before.food-2);assert.equal(r.resources.water,before.water-2);assert.throws(()=>careSurvivalMember(s,'ally','water'));const next=launchSurvivalSortie({...s,survivalRun:{...r,stage:'flight'}},'escape');assert.equal(next.combatTrial.actors.ally.absent,true);assert.equal(next.combatTrial.actors.ally.ap,0);}
 assert.ok(found);
 const s=camp();s.survivalRun.members[0].mind={state:'panic'};s.survivalRun.stage='flight';assert.throws(()=>launchSurvivalSortie(s,'escape'),/패닉/);assert.doesNotThrow(()=>launchSurvivalSortie(survivalAction(s,'hide'),'escape'));
});
test('night outcomes persist and growth only accrues for healthy participating workers',()=>{
 let s=camp();s.survivalRun.base={site:'arts',integrity:100,facilities:[]};delete s.survivalRun.base;
 s.survivalRun.members[0].job='watch';s=finishSurvivalDay(s);assert.equal(s.characterSystem.practice.taei.agility,2);assert.deepEqual(restore(save(s)).survivalRun.members,s.survivalRun.members);
 const old=startSurvival(newGame());old.survivalRun.stage='settlement';assert.equal(finishSurvivalDay(old).survivalRun.members[0].mind,undefined);
});
