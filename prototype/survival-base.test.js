import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startGridCombat} from './combat-grid.js';
import {settleCombatRewards} from './combat-side-missions.js';
import {startSurvival,survivalAction,scoutSurvivalSite,claimSurvivalBase,buildSurvivalFacility,assignSurvivalJob,finishSurvivalDay,launchSurvivalSortie,returnSurvivalSortie,survivalDefense,survivalNightRisk} from './survival-base.js';
import {survivalPage} from './survival-ui.js';
function campaign(){return startSurvival(newGame());}
function completedSortie(s,kind,site){s=launchSurvivalSortie(s,kind,site);s.combatTrial.status=kind==='escape'?'escaped':'victory';settleCombatRewards(s.combatTrial);return returnSurvivalSortie(s);}
function candidates(){let s=campaign();s=completedSortie(s,'escape');s=finishSurvivalDay(s);s=completedSortie(s,'escape');return finishSurvivalDay(s);}
function home(site='arts401'){let s=candidates();s=scoutSurvivalSite(s,site);s=completedSortie(s,'secure',site);return claimSurvivalBase(s,site);}
function school(s){const c=structuredClone(s);delete c.survivalRun;return c;}
test('survival starts with a private clock, no unlearned names, and no alteration to school data',()=>{
 const original=newGame(),s=startSurvival(original);assert.equal(s.survivalRun.day,1);assert.equal(s.survivalRun.stage,'flight');assert.deepEqual(school(s),original);assert.throws(()=>startSurvival(s));assert.throws(()=>startSurvival(original,'dogyeom'));assert.ok(!survivalPage(original).includes('윤도겸'));assert.deepEqual(restore(save(s)).survivalRun,s.survivalRun);
});
test('two escaped sorties and day three unlock scouting; claims require real secured results and parts',()=>{
 let s=campaign();assert.throws(()=>scoutSurvivalSite(s,'arts401'));assert.throws(()=>finishSurvivalDay(s));s=candidates();assert.equal(s.survivalRun.day,3);assert.equal(s.survivalRun.stage,'settlement');s=scoutSurvivalSite(s,'arts401');assert.throws(()=>claimSurvivalBase(s,'arts401'));s=completedSortie(s,'secure','arts401');s=claimSurvivalBase(s,'arts401');assert.equal(s.survivalRun.stage,'base');assert.equal(s.survivalRun.base.site,'arts401');assert.equal(s.survivalRun.actions,0);
});
test('sortie reserves rather than duplicates resources and restores the previous demo battle',()=>{
 let s=startGridCombat(newGame(),'student');const old=structuredClone(s.combatTrial);s=startSurvival(s);const water=s.survivalRun.resources.water;s=launchSurvivalSortie(s,'escape');assert.equal(s.survivalRun.resources.water,0);assert.equal(s.combatTrial.stash.items.water,water);assert.equal(s.combatTrial.items.water,0);assert.throws(()=>survivalAction(s,'hide'));assert.throws(()=>finishSurvivalDay(s));assert.throws(()=>startGridCombat(s));assert.throws(()=>returnSurvivalSortie(s));s.combatTrial.stash.items.water--;s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.resources.water,water-1);assert.deepEqual(s.combatTrial,old);assert.throws(()=>returnSurvivalSortie(s));
});
test('success carries combat rewards once; failed missions do not secure sites or grant food',()=>{
 let s=candidates();s=scoutSurvivalSite(s,'library');s=launchSurvivalSortie(s,'secure','library');s.combatTrial.status='failed';s=returnSurvivalSortie(s);assert.equal(s.survivalRun.secured.library,undefined);assert.throws(()=>claimSurvivalBase(s,'library'));
 s=home();s=finishSurvivalDay(s);const food=s.survivalRun.resources.food;s=completedSortie(s,'supply');assert.equal(s.survivalRun.resources.food,food+3);assert.throws(()=>returnSurvivalSortie(s));
});
test('facilities consume parts/actions, change real defenses and cannot exceed room capacity',()=>{
 let s=home();s=finishSurvivalDay(s);const parts=s.survivalRun.resources.parts,defense=survivalDefense(s.survivalRun);s=buildSurvivalFacility(s,'barricade');assert.equal(s.survivalRun.resources.parts,parts-2);assert.equal(survivalDefense(s.survivalRun),defense+20);assert.throws(()=>buildSurvivalFacility(s,'barricade'));s=buildSurvivalFacility(s,'beds');s=buildSurvivalFacility(s,'clinic');s=finishSurvivalDay(s);assert.throws(()=>buildSurvivalFacility(s,'workshop'));
});
test('roles are not major locked, but fatigued workers and missing facilities cannot be forced',()=>{
 let s=home();assert.throws(()=>assignSurvivalJob(s,'ally','care'));s=assignSurvivalJob(s,'ally','watch');const risk=survivalNightRisk(s.survivalRun);s=assignSurvivalJob(s,'ally','rest');assert.ok(survivalNightRisk(s.survivalRun)>=risk);s.survivalRun.members[1].fatigue=85;assert.throws(()=>assignSurvivalJob(s,'ally','watch'));
});
test('care and maintenance consume real resources and resting/beds recover fatigue',()=>{
 let s=home('basement');s.survivalRun.resources.parts=20;s.survivalRun.resources.bandage=3;s=finishSurvivalDay(s);s=buildSurvivalFacility(s,'clinic');s=buildSurvivalFacility(s,'workshop');s=buildSurvivalFacility(s,'beds');s.survivalRun.members[0].injury=2;s.survivalRun.members[1].fatigue=30;s.survivalRun.base.integrity=50;s=assignSurvivalJob(s,'taei','care');s=assignSurvivalJob(s,'ally','repair');const bandage=s.survivalRun.resources.bandage,parts=s.survivalRun.resources.parts;const resting=finishSurvivalDay(assignSurvivalJob(s,'ally','rest'));s=finishSurvivalDay(s);assert.equal(s.survivalRun.members[0].injury,1);assert.equal(s.survivalRun.resources.bandage,bandage-1);assert.equal(s.survivalRun.resources.parts,parts-1);assert.ok(s.survivalRun.base.integrity>resting.survivalRun.base.integrity);
 s=assignSurvivalJob(s,'ally','rest');const fatigue=s.survivalRun.members[1].fatigue;s=finishSurvivalDay(s);assert.ok(s.survivalRun.members[1].fatigue<fatigue);
});
test('rescue adds a survivor once, raises daily ration demand and respects capacity',()=>{
 let s=home();s=finishSurvivalDay(s);s=completedSortie(s,'rescue');assert.equal(s.survivalRun.members.length,3);assert.equal(s.survivalRun.members.at(-1).injury,1);assert.throws(()=>returnSurvivalSortie(s));s=completedSortie(s,'rescue');assert.equal(s.survivalRun.members.length,4);assert.throws(()=>launchSurvivalSortie(s,'rescue'));s.survivalRun.resources.food=20;s.survivalRun.resources.water=20;s.survivalRun.threat=0;s=finishSurvivalDay(s);assert.equal(s.survivalRun.resources.food,16);assert.equal(s.survivalRun.resources.water,16);
});
test('a shortage and unsafe nights have consequences without changing the school world',()=>{
 let s=home(),original=school(s);s.survivalRun.resources.food=0;s.survivalRun.resources.water=0;s.survivalRun.threat=95;s.survivalRun.base.integrity=20;s=finishSurvivalDay(s);assert.ok(s.survivalRun.members[0].stress>20);assert.equal(s.survivalRun.status,'overrun');assert.deepEqual(school(s),original);
});
test('active sortie survives save/load, validates its origin and cannot be abandoned after victory',()=>{
 let s=launchSurvivalSortie(campaign(),'escape');s=restore(save(s));assert.equal(s.survivalRun.activeSortie.id,s.combatTrial.survivalSortie);const tampered=structuredClone(s);tampered.combatTrial.survivalSortie=99;assert.throws(()=>returnSurvivalSortie(tampered,{abandon:true}));s.combatTrial.status='escaped';settleCombatRewards(s.combatTrial);assert.throws(()=>returnSurvivalSortie(s,{abandon:true}));s=returnSurvivalSortie(s);assert.equal(s.survivalRun.escapes,1);
});
test('search is once a day, role/view changes do not advance school time or reroll supply',()=>{
 let s=campaign();const original=school(s);s=survivalAction(s,'search');assert.equal(s.survivalRun.resources.food,8);assert.throws(()=>survivalAction(s,'search'));const before=save(s);for(let i=0;i<3;i++)survivalPage(s,'base');assert.equal(save(s),before);assert.deepEqual(school(s),original);
});
test('pre-existing campaign wounds do not count as new combat injuries',async()=>{
 const {combatSideMissions}=await import('./combat-side-missions.js');const {gridAct}=await import('./combat-grid.js');let s=campaign();s.survivalRun.members[0].injury=1;s=launchSurvivalSortie(s,'escape');assert.equal(s.combatTrial.actors.taei.wounds,1);assert.equal(combatSideMissions(s.combatTrial).find(q=>q.id==='unhurt').condition,true);s=gridAct(s,'taei','bandage');assert.equal(s.combatTrial.optional.teamHurt,false);assert.equal(combatSideMissions(s.combatTrial).find(q=>q.id==='unhurt').condition,true);
});
test('a failed survival run can restart without resetting school progress or a demo battle',async()=>{
 const {restartSurvival}=await import('./survival-base.js');let s=campaign();assert.throws(()=>restartSurvival(s));const original=school(s);s.survivalRun.status='overrun';s=restartSurvival(s);assert.equal(s.survivalRun.day,1);assert.equal(s.survivalRun.stage,'flight');assert.deepEqual(school(s),original);
});
