import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,nextDay,restore,save} from './simulation.js';
import {campusScene,markFlow,placeContinuations,knownSceneRoutes} from './scene-flow.js';
import {arrive} from './encounters.js';
import {readMessages} from './event-view.js';
test('opening starts with observable situations rather than feature categories',()=>{
 const s=newGame(),scene=campusScene(s);assert.equal(scene.choices.length,6);assert.match(scene.text,/학교에 도착/);assert.ok(scene.choices.every(c=>c.action!=='openCommunity'&&c.action!=='select'));
 assert.ok(scene.choices.every(c=>!['activities','travel','clubs'].includes(c.value)));
 assert.ok(knownSceneRoutes(s).some(r=>r.id==='rehearsal'));assert.ok(!knownSceneRoutes(s).some(r=>r.id==='volunteer'||r.id==='football'));
});
test('reading and entering change the continuation without enrolling or advancing time',()=>{
 const s=newGame(),read=markFlow(s,'community');assert.deepEqual(campusScene(read).choices,campusScene(s).choices);
 assert.ok(campusScene(read).choices.some(c=>c.value==='library'));assert.deepEqual(read.memberships,{});assert.equal(read.clock.minute,s.clock.minute);
 const entered=markFlow(s,'visit','hall');assert.ok(knownSceneRoutes(entered).some(r=>r.id==='volunteer'));assert.ok(!knownSceneRoutes(entered).some(r=>r.id==='explore'));
});
test('tasks belong to their current locations and preserve warning and route conditions',()=>{
 let s=nextDay(act(newGame(),'rehearsal'));assert.ok(placeContinuations(s,'library').some(c=>c.value==='review'));
 assert.ok(!placeContinuations(s,'cafe').some(c=>c.value==='review'));
 s=nextDay(act(s,'work'));assert.ok(!placeContinuations(s,'hall').some(c=>c.value==='checkCampus'));
 s=readMessages(s);assert.ok(placeContinuations(s,'hall').some(c=>c.value==='checkCampus'));
 assert.ok(!placeContinuations(s,'hall').some(c=>c.value==='shortcut'));
});
test('save migration preserves actual visited context without inventing notices',()=>{
 const old=arrive(newGame(),'hall').state;delete old.flow;
 const loaded=restore(save(old));assert.equal(loaded.flow.seen['visit:hall'],true);assert.ok(!loaded.flow.seen.board);
 assert.ok(campusScene(loaded).choices.some(c=>c.value==='hall'));assert.deepEqual(restore(save(loaded)),loaded);
});
