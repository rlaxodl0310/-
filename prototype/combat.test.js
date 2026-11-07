import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startCombat,planCombat,executeCombat,nextCombatTurn,combatOptions,combatThreats} from './combat.js';
import {combatSetupPage,combatPlayPage} from './combat-ui.js';
function battle(ally='student'){return startCombat(newGame(),ally);}
function turn(s,a,b){s=planCombat(s,'taei',a);if(!s.combatTrial.actors.ally.down&&!s.combatTrial.actors.ally.escaped)s=planCombat(s,'ally',b);return executeCombat(s);}
function schoolOnly(s){const c=structuredClone(s);delete c.combatTrial;return c;}
test('combat selection and preview preserve all school state, knowledge, relationships and clock',()=>{
 const original=newGame(),snapshot=save(original);let s=startCombat(original,'dogyeom'),seed=s.combatTrial.seed;s=planCombat(s,'taei','shove');s=planCombat(s,'ally','advance');for(let i=0;i<4;i++){combatOptions(s,'taei');combatThreats(s);combatPlayPage(s);}assert.equal(s.combatTrial.turn,1);assert.equal(s.combatTrial.actors.taei.stamina,90);assert.equal(s.combatTrial.seed,seed);assert.deepEqual(schoolOnly(s),original);assert.equal(save(original),snapshot);assert.ok(!combatSetupPage(s).includes('윤도겸'));assert.throws(()=>startCombat(original,'invalid'));
});
test('a five-turn coordinated escape works without defeating the enemies',()=>{
 let s=battle(),original=schoolOnly(s);for(const [a,b] of [['shove','advance'],['advance','advance'],['shove','advance'],['advance','advance'],['advance','advance']]){s=turn(s,a,b);if(s.combatTrial.status==='active')s=nextCombatTurn(s);}
 assert.equal(s.combatTrial.status,'escaped');assert.equal(s.combatTrial.turn,5);assert.equal(s.combatTrial.door,2);assert.ok(Object.values(s.combatTrial.actors).every(a=>a.escaped));assert.equal(s.combatTrial.enemies.filter(e=>e.balance>0).length,2);assert.equal(s.combatTrial.noise,2);assert.throws(()=>executeCombat(s));assert.throws(()=>nextCombatTurn(s));assert.deepEqual(schoolOnly(s),original);
});
test('one person escaping never completes the objective; closed door requires two actions',()=>{
 let s=battle();s.combatTrial.enemies=[];s.combatTrial.actors.taei.zone=2;s.combatTrial.actors.ally.zone=0;s=turn(s,'advance','brace');assert.equal(s.combatTrial.door,1);assert.equal(s.combatTrial.actors.taei.zone,2);s=nextCombatTurn(s);s=turn(s,'advance','brace');assert.equal(s.combatTrial.door,2);s=nextCombatTurn(s);s=turn(s,'advance','brace');assert.equal(s.combatTrial.actors.taei.escaped,true);assert.equal(s.combatTrial.status,'active');
});
test('blocked advance costs a turn, while shoving into a second enemy creates a shared opening',()=>{
 let s=turn(battle(),'advance','brace');assert.equal(s.combatTrial.actors.taei.zone,0);assert.ok(s.combatTrial.log.some(x=>x.includes('견제가 필요')));s=turn(battle(),'shove','advance');assert.equal(s.combatTrial.actors.ally.zone,1);assert.ok(s.combatTrial.enemies.every(e=>e.stun===1));assert.ok(s.combatTrial.log.some(x=>x.includes('엉켜')));
});
test('save/load and repeated rendering never reroll an attack, duplicate a turn or use school inventory',()=>{
 let s=planCombat(battle(),'taei','strike');s=planCombat(s,'ally','strike');const stored=restore(save(s)),a=executeCombat(s),b=executeCombat(stored);assert.deepEqual(a.combatTrial,b.combatTrial);assert.throws(()=>executeCombat(a));assert.throws(()=>planCombat(a,'taei','brace'));assert.deepEqual(restore(save(a)).combatTrial,a.combatTrial);assert.deepEqual(schoolOnly(a),schoolOnly(s));
});
test('high noise brings one reinforcement and the turn limit ends a stalled battle',()=>{
 let s=battle();s.combatTrial.noise=6;s=turn(s,'brace','brace');assert.equal(s.combatTrial.enemies.length,3);s=nextCombatTurn(s);s=turn(s,'brace','brace');assert.equal(s.combatTrial.enemies.length,3);while(s.combatTrial.status==='active'){s=nextCombatTurn(s);s=turn(s,'brace','brace');}assert.equal(s.combatTrial.status,'failed');assert.equal(s.combatTrial.turn,10);
});
test('shared tools cannot be consumed twice in one round and insufficient stamina cannot be selected',()=>{
 let s=turn(battle(),'drink','drink');assert.equal(s.combatTrial.items.water,0);assert.ok(s.combatTrial.log.some(x=>x.includes('여력이 없어')));s=nextCombatTurn(s);assert.throws(()=>planCombat(s,'taei','drink'));s.combatTrial.actors.taei.stamina=0;assert.throws(()=>planCombat(s,'taei','strike'));assert.ok(combatOptions(s,'taei').some(o=>o.id==='brace'&&!o.disabled));
 s=turn(battle(),'chair','brace');assert.equal(s.combatTrial.items.chair,0);assert.equal(s.combatTrial.actors.taei.wounds,0);assert.equal(s.combatTrial.barrier,1);
});
test('fear can override an ally order; severe wounds allow rescue instead of a forced abandonment',()=>{
 let s=battle('yeogyeong');s.combatTrial.actors.ally.fear=80;s=turn(s,'brace','strike');assert.ok(s.combatTrial.log.some(x=>x.includes('가까이 가는 건 못')));assert.equal(s.combatTrial.actors.ally.guard,true);
 s=battle();s.combatTrial.enemies=[];s.combatTrial.actors.ally.down=true;s.combatTrial.actors.ally.wounds=3;s=turn(s,'rescue','brace');assert.equal(s.combatTrial.carrying,true);s=nextCombatTurn(s);const before=s.combatTrial.actors.taei.stamina;s=turn(s,'advance','brace');assert.equal(s.combatTrial.actors.ally.zone,1);assert.equal(s.combatTrial.actors.taei.stamina,before-14);
});
test('old saves have no battle automatically added and UI labels unknown identities safely',()=>{
 const s=restore(save(newGame()));assert.equal(s.combatTrial,undefined);assert.ok(!combatSetupPage(s).includes('차여경'));const started=battle('iseo');assert.ok(!combatPlayPage(started).includes('정이서'));started.contacts.iseo={introduced:true,nameLevel:'full'};assert.ok(combatPlayPage(started).includes('정이서'));
});
