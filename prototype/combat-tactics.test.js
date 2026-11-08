import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';import {startGridCombat,gridAct,endGridTurn,tacticalLureTargets,tacticalEnemyIntents} from './combat-grid.js';
test('throwing a bottle costs real actions and stock; redirected enemy intent matches execution',()=>{
 let s=startGridCombat(newGame());const before=save(s),targets=tacticalLureTargets(s,'taei');assert.ok(targets.some(p=>p.x===5&&p.y===2));assert.equal(save(s),before);
 s=gridAct(s,'taei','lure',{x:5,y:2});assert.equal(s.combatTrial.actors.taei.ap,1);assert.equal(s.combatTrial.actors.taei.stamina,86);assert.equal(s.combatTrial.noise,2);assert.equal(s.combatTrial.items.lure,0);assert.equal(tacticalLureTargets(s,'ally').length,0);
 const snapshot=save(s),forecast=tacticalEnemyIntents(s);assert.equal(save(s),snapshot);const actual=endGridTurn(restore(snapshot));for(const i of forecast){const enemy=actual.combatTrial.enemies.find(e=>'enemy-'+e.id===i.unit);if(i.path.length)assert.deepEqual([enemy.x,enemy.y],i.path.at(-1));}
 assert.deepEqual(forecast.find(i=>i.unit==='enemy-1').path.at(-1),[5,3]);assert.equal(actual.combatTrial.lure.turns,1);assert.equal(endGridTurn(actual).combatTrial.lure,null);
});
test('nearby people take priority over a distant lure and protection still needs guarding',()=>{
 let s=startGridCombat(newGame(),'student','protect');s.combatTrial.enemies[0].x=7;s.combatTrial.enemies[0].y=3;s.combatTrial.enemies[1].balance=0;s=gridAct(s,'taei','lure',{x:3,y:3});assert.ok(tacticalEnemyIntents(s).some(i=>i.attack==='protected'));s=endGridTurn(s);assert.equal(s.combatTrial.protection.wounds,1);
});
test('illegal throws and old saves are safe; lure noise can trigger a real reinforcement',()=>{
 let s=startGridCombat(newGame());const before=save(s);assert.throws(()=>gridAct(s,'taei','lure',{x:4,y:1}));assert.throws(()=>gridAct(s,'taei','lure',{x:2,y:4}));assert.equal(save(s),before);
 delete s.combatTrial.items.lure;assert.equal(tacticalLureTargets(s,'taei').length,0);assert.throws(()=>gridAct(s,'taei','lure',{x:5,y:2}));s=startGridCombat(newGame());s.combatTrial.noise=4;s=gridAct(s,'taei','lure',{x:5,y:2});assert.ok(tacticalEnemyIntents(s).some(i=>i.spawn));assert.equal(endGridTurn(s).combatTrial.reinforced,true);
});
test('enemy forecast includes a guard outcome but cannot mutate combat rewards',()=>{
 let s=startGridCombat(newGame());s.combatTrial.enemies=[{id:1,x:3,y:4,balance:2,stun:0}];s=gridAct(s,'taei','guard');const before=save(s),intent=tacticalEnemyIntents(s);assert.equal(intent[0].attack,'taei');for(let n=0;n<4;n++)tacticalEnemyIntents(s);assert.equal(save(s),before);assert.equal(endGridTurn(s).combatTrial.actors.taei.wounds,0);
});
