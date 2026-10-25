import test from 'node:test';
import assert from 'node:assert/strict';
import {campusBuildings,buildingActivity,buildingActions,buildingAtmosphere,buildingLinks} from './campus-buildings.js';
import {locations} from './days.js';
import {newGame,restore,save} from './simulation.js';
import {arrive} from './encounters.js';
import {campusScene,placeContinuations} from './scene-flow.js';
import {paceAction} from './campus-time.js';
test('all eight places are reachable through real scene links with no invalid destination',()=>{
 assert.equal(Object.keys(locations).length,8);
 const s=newGame(),visited=new Set(),pending=campusScene(s).choices.filter(c=>c.action==='visit').map(c=>c.value);
 while(pending.length){const place=pending.pop();if(visited.has(place))continue;visited.add(place);for(const c of placeContinuations(s,place).filter(c=>c.action==='visit')){assert.ok(locations[c.value]);pending.push(c.value);}}
 assert.equal(visited.size,8);for(const place of Object.keys(locations))assert.ok(buildingLinks(place).every(c=>locations[c.value]));
});
test('arriving at new buildings observes actual facilities without inventing an NPC or item',()=>{
 for(const [id,b] of Object.entries(campusBuildings)){const s=newGame(),r=arrive(s,id);assert.equal(r.state.location,id);assert.equal(r.encounter,null);assert.match(r.observation,new RegExp(b.entry.slice(0,5)));assert.ok(r.state.known.includes(b.fact));assert.deepEqual(r.state.inventory,s.inventory);assert.deepEqual(r.state.contacts,s.contacts);const again=arrive(r.state,id);assert.equal(again.state.memory.length,r.state.memory.length);}
});
test('meals obey service windows and one meal per period, preserved by save/load',()=>{
 let s=arrive(newGame(),'cafeteria').state;s=buildingActivity(s,'meal').state;
 assert.ok(!buildingActions(s).some(a=>a.id==='meal'));assert.throws(()=>buildingActivity(restore(save(s)),'meal'));
 s.clock.minute=900;assert.ok(!buildingActions(s).some(a=>a.meal));assert.match(buildingAtmosphere(s,'cafeteria'),/배식 시간이 아니다/);
 s.clock.minute=1020;s=buildingActivity(s,'meal').state;assert.equal(s.buildingLife.meals.length,2);
 s.clock.minute=1140;assert.ok(!buildingActions(s).some(a=>a.meal));s.day=2;s.clock.minute=780;assert.ok(buildingActions(s).some(a=>a.meal));
});
test('local actions use existing time batches and do not duplicate discoveries or relationships',()=>{
 let s=arrive(newGame(),'academic').state;const relations=structuredClone(s.relations);
 for(let i=0;i<5;i++){const before=s;s=paceAction(before,buildingActivity(s,'rooms').state,{action:'buildingActivity',value:'rooms',from:'place',to:'place'}).state;}
 assert.equal(s.clock.minute,780);assert.equal(s.buildingLife.history.length,1);assert.deepEqual(s.relations,relations);assert.equal(s.known.filter(x=>x==='강의동 계단과 층별 안내').length,1);
 const before=s;s=paceAction(before,buildingActivity(s,'notes').state,{action:'buildingActivity',value:'notes',from:'place',to:'place'}).state;assert.equal(s.pace.count,2);
});
test('local actions reject wrong places and late hours; dorm remains a visit rather than housing',()=>{
 assert.throws(()=>buildingActivity(newGame(),'meal'));
 const s=arrive(newGame(),'dorm').state;const r=buildingActivity(s,'guide');assert.match(r.text,/자취방/);assert.equal(r.state.phase,'afternoon');assert.equal(r.state.freeDay.home,undefined);s.clock.minute=1320;assert.throws(()=>buildingActivity(s,'bench'));
});
test('music building has rehearsal access and existing saved locations remain valid',()=>{
 assert.ok(placeContinuations(newGame(),'music').some(c=>c.value==='rehearsal'));
 for(const id of Object.keys(locations)){const s=arrive(newGame(),id).state;assert.equal(restore(save(s)).location,id);}
});
