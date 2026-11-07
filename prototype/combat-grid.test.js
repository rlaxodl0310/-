import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startCombat} from './combat.js';
import {startGridCombat,gridAct,endGridTurn,tacticalPaths,tacticalTargets,tacticalCanOpen,tacticalBlocked,executeGridCombat} from './combat-grid.js';
import {combatGridPage} from './combat-grid-ui.js';
const gridBase=()=>startGridCombat(newGame());
function outsideGrid(s){const c=structuredClone(s);delete c.combatTrial;return c;}
const gridWinTrace=[['taei','move',{x:5,y:4}],['taei','guard'],['ally','move',{x:4,y:4}],['ally','move',{x:5,y:3}],['end'],['taei','strike',{id:1}],['taei','strike',{id:1}],['ally','strike',{id:2}],['ally','strike',{id:2}],['end'],['taei','guard'],['taei','guard'],['ally','guard'],['ally','guard'],['end'],['taei','guard'],['taei','guard'],['ally','strike',{id:3}],['ally','strike',{id:3}],['end'],['taei','move',{x:8,y:4}],['taei','move',{x:9,y:3}],['ally','move',{x:8,y:3}],['ally','move',{x:9,y:4}],['end'],['taei','door'],['taei','door'],['ally','move',{x:11,y:3}],['end'],['taei','move',{x:11,y:4}]];
test('grid paths use orthogonal cells, respect walls, units, movement range and stamina',()=>{
 const s=gridBase(),before=save(s),paths=tacticalPaths(s,'taei');assert.ok(paths.some(p=>p.x===5&&p.y===4));assert.ok(!paths.some(p=>p.x===2&&p.y===5));assert.ok(!paths.some(p=>p.x===4&&p.y===2));for(const p of paths){assert.ok(p.path.length<=3);let last=s.combatTrial.actors.taei;for(const [x,y] of p.path){assert.equal(Math.abs(x-last.x)+Math.abs(y-last.y),1);assert.equal(tacticalBlocked(x,y),false);last={x,y};}}assert.equal(save(s),before);
 s.combatTrial.actors.taei.stamina=2;assert.ok(tacticalPaths(s,'taei').every(p=>p.path.length===1));
});
test('click movement spends AP and actual path length, without RNG or school effects',()=>{
 const s=gridBase(),next=gridAct(s,'taei','move',{x:5,y:4});assert.equal(next.combatTrial.actors.taei.ap,1);assert.equal(next.combatTrial.actors.taei.stamina,84);assert.equal(next.combatTrial.actors.taei.x,5);assert.equal(next.combatTrial.seed,s.combatTrial.seed);assert.equal(next.combatTrial.frames[0].path.length,3);assert.deepEqual(outsideGrid(next),outsideGrid(s));assert.throws(()=>gridAct(s,'taei','move',{x:6,y:4}));assert.throws(()=>gridAct(s,'taei','move',{x:2,y:5}));
});
test('two AP limit, explicit adjacency and targeted attacks survive save/load',()=>{
 let s=gridAct(gridBase(),'taei','move',{x:5,y:4});assert.deepEqual(tacticalTargets(s,'taei').map(e=>e.id),[1]);assert.throws(()=>gridAct(s,'taei','strike',{id:2}));const a=gridAct(s,'taei','strike',{id:1}),b=gridAct(restore(save(s)),'taei','strike',{id:1});assert.deepEqual(a.combatTrial,b.combatTrial);assert.equal(a.combatTrial.actors.taei.ap,0);assert.throws(()=>gridAct(a,'taei','guard'));assert.ok(combatGridPage(a).includes('tactical-board'));
});
test('closed fire door blocks paths until two adjacent interactions, and both must escape',()=>{
 let s=gridBase();s.combatTrial.enemies=[];s.combatTrial.actors.taei.x=9;s.combatTrial.actors.taei.y=3;assert.equal(tacticalCanOpen(s,'taei'),true);assert.ok(!tacticalPaths(s,'taei').some(p=>(p.x===10||p.x===11)&&(p.y===3||p.y===4)));s=gridAct(s,'taei','door');assert.equal(s.combatTrial.door,1);s=gridAct(s,'taei','door');assert.equal(s.combatTrial.door,2);s=endGridTurn(s);s=gridAct(s,'taei','move',{x:11,y:3});assert.equal(s.combatTrial.actors.taei.escaped,true);assert.equal(s.combatTrial.status,'active');
});
test('a real seven-turn battle can be completed with movement, targeted combat, door and exits',()=>{
 let s=gridBase(),outside=outsideGrid(s);for(const [key,action,target] of gridWinTrace){s=key==='end'?endGridTurn(s):gridAct(s,key,action,target);for(const e of s.combatTrial.enemies.filter(e=>e.balance>0)){assert.equal(tacticalBlocked(e.x,e.y),false);assert.ok(!Object.values(s.combatTrial.actors).some(a=>!a.escaped&&a.x===e.x&&a.y===e.y));}}assert.equal(s.combatTrial.status,'escaped');assert.equal(s.combatTrial.turn,7);assert.deepEqual(outsideGrid(s),outside);assert.throws(()=>endGridTurn(s));
});
test('enemy turns path around furniture, respect stuns, generate animation frames and restore AP',()=>{
 let s=gridAct(gridBase(),'taei','move',{x:5,y:4});s=gridAct(s,'taei','shove',{id:1});assert.equal(s.combatTrial.enemies[0].x,7);assert.equal(s.combatTrial.enemies[0].stun,2);let next=endGridTurn(s);assert.equal(next.combatTrial.enemies[0].x,7);assert.equal(next.combatTrial.enemies[0].stun,1);assert.equal(next.combatTrial.actors.taei.ap,2);assert.ok(next.combatTrial.frames.some(f=>f.kind==='move'));
});
test('temporary cover blocks movement, shared items consume once, fear can override attacks',()=>{
 let s=gridAct(gridBase(),'taei','cover',{x:3,y:4});assert.equal(s.combatTrial.items.chair,0);assert.ok(!tacticalPaths(s,'taei').some(p=>p.x===3&&p.y===4));assert.throws(()=>gridAct(s,'taei','cover',{x:2,y:3}));s=endGridTurn(s);assert.equal(s.combatTrial.cover[0].turns,1);s=endGridTurn(s);assert.equal(s.combatTrial.cover.length,0);
 s=gridAct(gridBase(),'taei','drink');assert.throws(()=>gridAct(s,'ally','drink'));
 s=gridBase();s.combatTrial.actors.ally.x=5;s.combatTrial.actors.ally.y=4;s.combatTrial.actors.ally.fear=80;s=gridAct(s,'ally','strike',{id:1});assert.equal(s.combatTrial.enemies[0].balance,2);assert.equal(s.combatTrial.actors.ally.guard,true);assert.ok(s.combatTrial.log.some(x=>x.includes('무리')));
});
test('fallen ally can be carried to an exit at increased movement cost',()=>{
 let s=gridBase();s.combatTrial.enemies=[];s.combatTrial.actors.ally.down=true;s.combatTrial.actors.ally.wounds=3;s=gridAct(s,'taei','rescue');assert.equal(s.combatTrial.carrying,true);let stamina=s.combatTrial.actors.taei.stamina;s=gridAct(s,'taei','move',{x:4,y:4});assert.equal(s.combatTrial.actors.taei.stamina,stamina-16);assert.equal(s.combatTrial.actors.ally.x,4);assert.throws(()=>gridAct(s,'ally','guard'));
});
test('noise spawns one additional enemy and deadline cannot be bypassed by skipping actions',()=>{
 let s=gridBase();s.combatTrial.noise=6;s=endGridTurn(s);assert.equal(s.combatTrial.enemies.length,3);s.combatTrial.actors.taei.guard=true;s.combatTrial.actors.ally.guard=true;s=endGridTurn(s);assert.equal(s.combatTrial.enemies.length,3);s=gridBase();s.combatTrial.enemies=[];s.combatTrial.turn=12;s=endGridTurn(s);assert.equal(s.combatTrial.status,'failed');
});
test('version-one combat saves remain playable without silent conversion; names stay learned-only',()=>{
 const old=restore(save(startCombat(newGame())));assert.equal(old.combatTrial.version,1);assert.equal(executeGridCombat(old).combatTrial.phase,'result');const s=startGridCombat(newGame(),'dogyeom');assert.ok(!combatGridPage(s).includes('윤도겸'));assert.equal(save(restore(save(s))),save(s));
});
