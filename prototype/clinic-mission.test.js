import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,launchSurvivalSortie,returnSurvivalSortie} from './survival-base.js';
import {gridAct,endGridTurn,tacticalBlocked,tacticalPaths} from './combat-grid.js';
import {combatPackAction} from './survival-pack.js';
import {combatSideMissions,settleCombatRewards} from './combat-side-missions.js';
import {survivalPage} from './survival-ui.js';
import {combatGridPage} from './combat-grid-ui.js';
export function clinicHome(){const s=startSurvival(newGame(),'student',{seed:6});Object.assign(s.survivalRun,{day:4,stage:'base',base:{site:'arts401',integrity:80,exposure:0,facilities:[]}});return s;}
function sortie(){return launchSurvivalSortie(clinicHome(),'clinic');}
function at(s,key,x,y){Object.assign(s.combatTrial.actors[key],{x,y,ap:2});return s;}
function cleared(s){const b=s.combatTrial;b.enemies=[];b.supplyCache.recovered=true;b.door=2;Object.assign(b.actors.ally,{escaped:true});return at(s,'taei',9,3);}
test('clinic launch requires a base and uses a saved map without replacing old combat maps',()=>{
 assert.throws(()=>launchSurvivalSortie(startSurvival(newGame()),'clinic'));
 const original=clinicHome(),s=launchSurvivalSortie(original,'clinic');assert.equal(original.survivalRun.actions,3);assert.equal(s.survivalRun.actions,2);
 assert.equal(tacticalBlocked(5,3,s.combatTrial),true);assert.equal(tacticalBlocked(5,3),false);
 assert.deepEqual(restore(save(s)),s);assert.ok(combatGridPage(s).includes('data-encounter="clinic"'));
 const before=save(original);assert.ok(survivalPage(original,'clinic').includes('보건실로 출발'));assert.equal(save(original),before);
});
test('clinic loot uses real capacity, keeps only selected items on failed return, and cannot be claimed twice',()=>{
 let s=at(sortie(),'taei',6,2);s=gridAct(s,'taei','loot');assert.equal(s.combatTrial.survivalPack.pending.items.firstaid,1);
 s=combatPackAction(s,'take','firstaid');s=combatPackAction(s,'leave');assert.throws(()=>gridAct(s,'taei','loot'));
 const before=s.survivalRun.resources.food;s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.kit.items.firstaid,1);assert.equal(s.survivalRun.resources.food,before);assert.equal(s.survivalRun.members.length,2);assert.match(s.survivalRun.log[0],/미완료/);assert.throws(()=>returnSurvivalSortie(s));
 let full=at(sortie(),'taei',6,2);full.combatTrial.stash.items={firstaid:4};full=gridAct(full,'taei','loot');assert.throws(()=>combatPackAction(full,'take','firstaid'),/수납/);
});
test('student rescue needs an adjacent actor, stamina and a free bed; survives save before extraction',()=>{
 let s=sortie();assert.throws(()=>gridAct(s,'taei','clinicRescue'));s=at(s,'taei',7,1);s.combatTrial.actors.taei.stamina=7;assert.throws(()=>gridAct(s,'taei','clinicRescue'));
 s.combatTrial.actors.taei.stamina=80;s=gridAct(s,'taei','clinicRescue');assert.equal(s.survivalRun.members.length,2);assert.equal(s.combatTrial.actors.taei.ap,1);assert.throws(()=>gridAct(s,'taei','clinicRescue'));
 s=restore(save(s));s=gridAct(cleared(s),'taei','move',{x:11,y:3});assert.equal(s.combatTrial.status,'escaped');s=returnSurvivalSortie(s);assert.equal(s.survivalRun.members.length,3);assert.equal(s.survivalRun.members.at(-1).injury,1);assert.match(s.survivalRun.log[0],/같이 돌아올 사람/);assert.throws(()=>launchSurvivalSortie(s,'clinic'));
 let full=clinicHome();full.survivalRun.members.push({...full.survivalRun.members[1],key:'rescued-1'},{...full.survivalRun.members[1],key:'rescued-2'});full=launchSurvivalSortie(full,'clinic');at(full,'taei',7,1);assert.equal(full.combatTrial.clinic.canRescue,false);assert.throws(()=>gridAct(full,'taei','clinicRescue'));
});
test('cache check is required, rescue is optional, and defeat never adds the student',()=>{
 let s=cleared(sortie());s.combatTrial.supplyCache.recovered=false;assert.throws(()=>gridAct(s,'taei','move',{x:11,y:3}),/물자함/);assert.equal(s.combatTrial.actors.taei.x,9);
 s.combatTrial.supplyCache.recovered=true;s=gridAct(s,'taei','move',{x:11,y:3});assert.equal(s.combatTrial.status,'escaped');assert.equal(combatSideMissions(s.combatTrial).find(q=>q.id==='clinicStudent').status,'missed');s=returnSurvivalSortie(s);assert.equal(s.survivalRun.members.length,2);assert.match(s.survivalRun.log[0],/학생은 아직/);
 let failed=at(sortie(),'taei',7,1);failed=gridAct(failed,'taei','clinicRescue');failed.combatTrial.status='failed';settleCombatRewards(failed.combatTrial);failed=returnSurvivalSortie(failed);assert.equal(failed.survivalRun.members.length,2);assert.equal(failed.survivalRun.clinicOutcome.rescued,false);
});
test('clinic collision and remaining student block movement; timeout and noise still apply',()=>{
 let s=at(sortie(),'taei',7,1);assert.ok(!tacticalPaths(s,'taei').some(p=>p.x===7&&p.y===2));s=gridAct(s,'taei','clinicRescue');assert.ok(tacticalPaths(s,'taei').some(p=>p.x===7&&p.y===2));
 s.combatTrial.noise=6;s=endGridTurn(s);assert.equal(s.combatTrial.reinforced,true);s.combatTrial.turn=12;s=endGridTurn(s);assert.equal(s.combatTrial.status,'failed');
});

test('authored clinic route can retrieve medicines, rescue and extract against live enemies',()=>{
 let s=sortie();
 const trace=[['taei','move',{x:4,y:3}],['taei','guard'],['ally','move',{x:4,y:4}],['ally','guard'],['end'],['taei','move',{x:4,y:1}],['taei','move',{x:6,y:1}],['ally','guard'],['ally','guard'],['end'],['taei','loot'],['taei','guard'],['ally','guard'],['ally','guard'],['end'],['taei','move',{x:7,y:1}],['taei','clinicRescue'],['ally','guard'],['ally','guard'],['end'],['taei','move',{x:9,y:2}],['taei','move',{x:9,y:3}],['ally','move',{x:4,y:2}],['ally','move',{x:6,y:1}],['end'],['taei','door'],['taei','door'],['ally','move',{x:8,y:2}],['ally','move',{x:9,y:4}],['end'],['taei','move',{x:11,y:3}],['ally','move',{x:11,y:4}]];
 for(const [key,action,target] of trace){s=key==='end'?endGridTurn(s):gridAct(s,key,action,target);if(action==='loot'){s=combatPackAction(s,'take','firstaid');s=combatPackAction(s,'leave');}if(s.combatTrial.turn===5)s=restore(save(s));}
 assert.equal(s.combatTrial.status,'escaped');assert.equal(s.combatTrial.clinic.rescued,true);assert.ok(s.combatTrial.turn<=12);s=returnSurvivalSortie(s);assert.equal(s.survivalRun.kit.items.firstaid,1);assert.equal(s.survivalRun.members.length,3);
});

test('legacy survival saves get a real medicine bag when entering the clinic',()=>{
 const old=clinicHome();delete old.survivalRun.kit;const resources={...old.survivalRun.resources};let s=launchSurvivalSortie(old,'clinic');assert.ok(s.combatTrial.survivalPack);assert.deepEqual(s.survivalRun.resources,resources);s=at(s,'taei',6,2);s=gridAct(s,'taei','loot');s=combatPackAction(s,'take','firstaid');s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.kit.items.firstaid,1);
});
