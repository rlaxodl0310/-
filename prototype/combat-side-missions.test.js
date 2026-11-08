import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startGridCombat,gridAct,endGridTurn} from './combat-grid.js';
import {combatSideMissions,settleCombatRewards,combatWaterCount} from './combat-side-missions.js';
import {combatGridPage} from './combat-grid-ui.js';
const extraBattle=mission=>startGridCombat(newGame(),'student',mission??'eliminate');
function clearExtra(s){s.combatTrial.enemies.forEach(e=>e.balance=0);s.combatTrial.noise=0;return gridAct(s,'taei','guard');}
test('optional objectives never block a main mission and only finished objectives give bonuses',()=>{
 let s=clearExtra(extraBattle());assert.equal(s.combatTrial.status,'victory');const r=s.combatTrial.rewardResult;assert.equal(r.objectives.find(q=>q.id==='cache').status,'missed');assert.deepEqual(s.combatTrial.stash.items,{water:1,bandage:0,parts:4});assert.equal(r.success,true);
});
test('cache pickup costs one AP, requires adjacency and is provisional until a main victory',()=>{
 let s=extraBattle();assert.throws(()=>gridAct(s,'taei','loot'));s=gridAct(s,'taei','move',{x:3,y:2});const ap=s.combatTrial.actors.taei.ap;s=gridAct(s,'taei','loot');assert.equal(s.combatTrial.actors.taei.ap,ap-1);assert.equal(s.combatTrial.supplyCache.recovered,true);assert.equal(s.combatTrial.stash.items.bandage,0);s=endGridTurn(s);assert.throws(()=>gridAct(s,'taei','loot'));s=clearExtra(s);assert.equal(s.combatTrial.stash.items.bandage,2);assert.equal(s.combatTrial.stash.items.water,2);
});
test('failure loses provisional loot but does not erase previously earned stock',()=>{
 let s=extraBattle('protect');s.combatTrial.stash.items.bandage=2;s=gridAct(s,'taei','move',{x:3,y:2});s=gridAct(s,'taei','loot');s.combatTrial.protection.wounds=2;s=endGridTurn(s);assert.equal(s.combatTrial.status,'failed');assert.equal(s.combatTrial.rewardResult.success,false);assert.deepEqual(s.combatTrial.rewardResult.items,[]);assert.equal(s.combatTrial.stash.items.bandage,2);assert.equal(s.combatTrial.stash.claimed.length,0);
});
test('awards are settled once across result views and save/load',()=>{
 let s=clearExtra(extraBattle());const initial=structuredClone(s.combatTrial.stash);s=restore(save(s));for(let i=0;i<5;i++){combatGridPage(s);combatSideMissions(s.combatTrial);settleCombatRewards(s.combatTrial);}assert.deepEqual(s.combatTrial.stash,initial);assert.equal(s.combatTrial.stash.claimed.length,1);
});
test('earned water and bandages carry into a new mission and can actually be consumed',()=>{
 let s=extraBattle();s.combatTrial.supplyCache.recovered=true;s=clearExtra(s);s=startGridCombat(s,'student','escape');assert.equal(s.combatTrial.runId,2);assert.equal(s.combatTrial.stash.items.bandage,2);assert.equal(combatWaterCount(s.combatTrial),3);s.combatTrial.actors.taei.wounds=1;s=gridAct(s,'taei','bandage');assert.equal(s.combatTrial.actors.taei.wounds,0);assert.equal(s.combatTrial.stash.items.bandage,1);assert.equal(s.combatTrial.optional.teamHurt,true);s=gridAct(s,'taei','drink');assert.equal(s.combatTrial.items.water,0);assert.equal(s.combatTrial.stash.items.water,2);s=endGridTurn(s);s=gridAct(s,'taei','drink');assert.equal(s.combatTrial.stash.items.water,1);
});
test('healing cannot erase a failed no-injury objective, even after a successful main mission',()=>{
 let s=extraBattle();s.combatTrial.stash.items.bandage=1;s.combatTrial.actors.taei.wounds=1;s=gridAct(s,'taei','bandage');s=clearExtra(s);assert.equal(s.combatTrial.status,'victory');assert.equal(s.combatTrial.rewardResult.objectives.find(q=>q.id==='unhurt').status,'missed');assert.equal(s.combatTrial.stash.items.water,0);
});
test('mission-specific bonuses respect deadlines, noise and protected injuries independently',()=>{
 let s=extraBattle();s.combatTrial.turn=7;s=clearExtra(s);assert.equal(s.combatTrial.status,'victory');assert.equal(s.combatTrial.rewardResult.objectives.find(q=>q.id==='quick').status,'missed');assert.equal(s.combatTrial.stash.items.parts,1);
 s=extraBattle('escape');s.combatTrial.noise=6;s.combatTrial.actors.taei.escaped=true;s.combatTrial.actors.ally.x=11;s.combatTrial.actors.ally.y=3;s.combatTrial.actors.ally.escaped=true;s.combatTrial.status='escaped';settleCombatRewards(s.combatTrial);assert.equal(s.combatTrial.rewardResult.objectives.find(q=>q.id==='quiet').status,'missed');
 s=extraBattle('protect');s.combatTrial.protection.wounds=1;s.combatTrial.enemies=[];for(let i=0;i<4;i++)s=endGridTurn(s);assert.equal(s.combatTrial.status,'victory');assert.equal(s.combatTrial.rewardResult.objectives.find(q=>q.id==='ward').status,'missed');
});
test('old saves do not receive retroactive extras, and displays do not reroll or spend AP',()=>{
 let s=extraBattle();delete s.combatTrial.optional;delete s.combatTrial.stash;delete s.combatTrial.supplyCache;delete s.combatTrial.rewardResult;s=clearExtra(s);assert.equal(s.combatTrial.rewardResult,undefined);assert.deepEqual(combatSideMissions(s.combatTrial),[]);
 s=extraBattle('protect');const before=save(s);for(let i=0;i<5;i++){combatSideMissions(s.combatTrial);combatGridPage(s);}assert.equal(save(s),before);
});
