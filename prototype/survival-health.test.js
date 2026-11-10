import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,survivalAction,finishSurvivalDay,launchSurvivalSortie,returnSurvivalSortie,assignSurvivalJob,survivalDayPreview} from './survival-base.js';
import {survivalHealth,survivalCondition} from './survival-health.js';
import {useSurvivalPackItem,useStoredSurvivalItem,careSurvivalMember,transferSurvivalPack} from './survival-pack.js';
import {gridAct} from './combat-grid.js';import {survivalPage} from './survival-ui.js';
function camp(){const s=startSurvival(newGame(),'student',{seed:6});Object.assign(s.survivalRun,{stage:'base',day:4,actions:3,base:{site:'arts401',integrity:90,facilities:[]},threat:5,resources:{food:100,water:100,parts:20,bandage:12}});return s;}
test('hunger and hydration affect real expedition stamina, fear and carried combat meters',()=>{
 const healthy=camp(),weak=camp();weak.survivalRun.members[0].nutrition=10;weak.survivalRun.members[0].hydration=10;const a=launchSurvivalSortie(healthy,'supply').combatTrial.actors.taei,b=launchSurvivalSortie(weak,'supply').combatTrial.actors.taei;assert.ok(b.stamina<a.stamina);assert.ok(b.fear>a.fear);assert.equal(b.hunger,92);assert.equal(b.thirst,93);
});
test('daytime effort spends food and water and is more exhausting when deprived',()=>{
 let a=camp(),b=camp();b.survivalRun.members[0].nutrition=15;b.survivalRun.members[0].hydration=15;a=survivalAction(a,'search');b=survivalAction(b,'search');assert.equal(a.survivalRun.members[0].nutrition,77);assert.equal(a.survivalRun.members[0].hydration,75);assert.ok(b.survivalRun.members[0].fatigue>a.survivalRun.members[0].fatigue);assert.ok(b.survivalRun.members[0].stress>a.survivalRun.members[0].stress);
});
test('food and water shortages have separate consequences; dehydration is more severe',()=>{
 let a=camp(),b=camp();a.survivalRun.kit.items={};b.survivalRun.kit.items={};a.survivalRun.resources.food=0;a.survivalRun.members[0].nutrition=20;b.survivalRun.resources.water=0;b.survivalRun.members[0].hydration=20;a=finishSurvivalDay(a);b=finishSurvivalDay(b);assert.equal(a.survivalRun.members[0].nutrition,0);assert.equal(a.survivalRun.members[0].hydration,100);assert.equal(b.survivalRun.members[0].hydration,0);assert.ok(b.survivalRun.members[0].fatigue>a.survivalRun.members[0].fatigue);assert.ok(a.survivalRun.members[0].stress>20);
});
test('partial rations rotate rather than always feeding the protagonist first',()=>{
 let s=camp();s.survivalRun.resources.food=1;s.survivalRun.kit.items={};s=finishSurvivalDay(s);assert.ok(s.survivalRun.members[0].nutrition>s.survivalRun.members[1].nutrition);s.survivalRun.resources.food=1;s=finishSurvivalDay(s);assert.equal(s.survivalRun.members[0].nutrition,s.survivalRun.members[1].nutrition);
});
test('untreated wounds worsen over real nights, block work and can end the run',()=>{
 let s=camp();s.survivalRun.members[0].injury=1;for(let n=0;n<3;n++)s=finishSurvivalDay(s);assert.equal(s.survivalRun.members[0].woundDays,3);assert.equal(s.survivalRun.members[0].injury,2);for(let n=0;n<2;n++)s=finishSurvivalDay(s);assert.ok(s.survivalRun.members[0].woundRisk>=80);assert.throws(()=>assignSurvivalJob(s,'taei','watch'));assert.throws(()=>launchSurvivalSortie(s,'supply'));const before=save(s);assert.equal(survivalDayPreview(s).failed,true);assert.equal(save(s),before);s=finishSurvivalDay(s);assert.equal(s.survivalRun.status,'overrun');assert.match(s.survivalRun.log[0],/상처/);
});
test('care consumes supplies and resets neglect; a treated night does not worsen the wound',()=>{
 let s=camp();Object.assign(s.survivalRun.members[0],{injury:2,woundDays:4,woundRisk:68});s=survivalAction(s,'treat');assert.equal(s.survivalRun.resources.bandage,11);assert.equal(s.survivalRun.members[0].injury,1);assert.equal(s.survivalRun.members[0].woundDays,0);assert.equal(s.survivalRun.members[0].woundRisk,48);s=finishSurvivalDay(s);assert.equal(s.survivalRun.members[0].woundRisk,44);assert.equal(s.survivalRun.members[0].woundDays,0);
});
test('clinic roles care for wounds before neglect is applied that night',()=>{
 let s=camp();s.survivalRun.base.facilities=['clinic'];Object.assign(s.survivalRun.members[0],{injury:2,woundDays:4,woundRisk:80});s=assignSurvivalJob(s,'ally','care');s=finishSurvivalDay(s);assert.equal(s.survivalRun.members[0].injury,1);assert.equal(s.survivalRun.members[0].woundDays,0);assert.equal(s.survivalRun.members[0].woundRisk,56);assert.equal(s.survivalRun.resources.bandage,11);
});
test('food and water can target a companion without feeding or draining someone else',()=>{
 let s=camp();Object.assign(s.survivalRun.members[1],{nutrition:20,hydration:20});s=careSurvivalMember(s,'ally','food');assert.equal(s.survivalRun.members[1].nutrition,55);assert.equal(s.survivalRun.members[0].nutrition,80);assert.equal(s.survivalRun.resources.food,99);s=careSurvivalMember(s,'ally','water');assert.equal(s.survivalRun.members[1].hydration,60);assert.equal(s.survivalRun.kit.items.water,1);assert.equal(s.survivalRun.resources.water,100);
});
test('storage use consumes in place even with a full bag, and cannot duplicate carried items',()=>{
 let s=camp();s.survivalRun.kit.items={firstaid:4};s.survivalRun.kit.stock={canned:1};s.survivalRun.members[1].nutrition=20;s=useStoredSurvivalItem(s,'canned','ally');assert.equal(s.survivalRun.members[1].nutrition,65);assert.equal(s.survivalRun.kit.items.firstaid,4);assert.equal(s.survivalRun.kit.items.canned,0);assert.equal(s.survivalRun.kit.stock.canned,0);const before=save(s);assert.throws(()=>useStoredSurvivalItem(s,'canned','ally'));assert.equal(save(s),before);
});
test('tactical drinking and bandaging carry back hydration and actual wound care',()=>{
 let s=camp();Object.assign(s.survivalRun.members[0],{nutrition:30,hydration:25,injury:1,woundDays:3,woundRisk:55});s=launchSurvivalSortie(s,'supply');s=gridAct(s,'taei','bandage');s=gridAct(s,'taei','drink');s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.members[0].nutrition,28);assert.equal(s.survivalRun.members[0].hydration,47);assert.equal(s.survivalRun.members[0].woundDays,0);assert.equal(s.survivalRun.members[0].woundRisk,35);
});
test('legacy saves get neutral baselines without inventing past starvation or wound age',()=>{
 const s=camp();for(const m of s.survivalRun.members)for(const id of ['nutrition','hydration','woundDays','woundRisk','caredDay'])delete m[id];s.survivalRun.members[0].injury=1;const before=save(s);assert.equal(survivalHealth(s.survivalRun.members[0]).nutrition,80);assert.equal(survivalHealth(s.survivalRun.members[0]).woundDays,0);survivalPage(s,'people');survivalPage(s,'storage');assert.equal(save(s),before);const next=finishSurvivalDay(restore(before));assert.equal(next.survivalRun.members[0].woundDays,1);assert.equal(next.survivalRun.members[0].woundRisk,16);
});
test('base storage persists separately through save and expeditions',()=>{
 let s=camp();s.survivalRun.kit.items.parts=2;const initial=s.survivalRun.resources.parts;s=transferSurvivalPack(s,'store','parts',2);const saved=restore(save(s));assert.equal(saved.survivalRun.resources.parts,initial+2);const launched=launchSurvivalSortie(saved,'supply');assert.equal(launched.survivalRun.resources.parts,initial+2);assert.equal(launched.combatTrial.stash.items.parts,0);assert.equal(returnSurvivalSortie(launched,{abandon:true}).survivalRun.resources.parts,initial+2);
});

test('actual positive meters prevent a false game over from the old shortage counter',()=>{
 let s=camp();s.survivalRun.shortage=2;s.survivalRun.resources.food=0;s.survivalRun.resources.water=0;s.survivalRun.kit.items={};for(const m of s.survivalRun.members){m.nutrition=100;m.hydration=100;}s=finishSurvivalDay(s);assert.equal(s.survivalRun.shortage,3);assert.equal(s.survivalRun.status,'active');assert.equal(s.survivalRun.members[0].hydration,72);
});
test('sustained zero hydration can end survival, while water before night actually prevents it',()=>{
 let s=camp();s.survivalRun.resources.water=0;s.survivalRun.kit.items={};Object.assign(s.survivalRun.members[0],{hydration:0,dryNights:2});assert.equal(survivalDayPreview(s).failed,true);s.survivalRun.kit.items.water=1;s=careSurvivalMember(s,'taei','water');s=finishSurvivalDay(s);assert.equal(s.survivalRun.status,'active');assert.equal(s.survivalRun.members[0].hydration,12);assert.equal(s.survivalRun.members[0].dryNights,0);
});

test('guard cannot bypass a starvation recovery ceiling, but actual drinking raises it',()=>{
 let s=camp();Object.assign(s.survivalRun.members[0],{nutrition:10,hydration:10,fatigue:0});s=launchSurvivalSortie(s,'supply');assert.equal(s.combatTrial.actors.taei.stamina,50);s=gridAct(s,'taei','guard');assert.equal(s.combatTrial.actors.taei.stamina,50);s=gridAct(s,'taei','drink');assert.equal(s.combatTrial.actors.taei.stamina,65);
});
