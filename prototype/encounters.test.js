import test from 'node:test';
import assert from 'node:assert/strict';
import {newAfternoonScenario as newGame,act,nextDay,save,restore} from './simulation.js';
import {arrive,resolveEncounter,placeActions} from './encounters.js';
import {contact,displayName} from './identity.js';
import {dialogue} from './dialogue.js';

test('arrival frames an ongoing action, not a named conversation roster',()=>{
 const r=arrive(newGame(),'hall');
 assert.equal(r.encounter.person,'yeogyeong');
 assert.match(r.encounter.text,/영수증/);assert.match(r.encounter.action,/건네며/);
 assert.ok(!r.encounter.text.includes('기다리'));
 assert.equal(displayName(r.state,'yeogyeong'),'수첩을 정리하는 학생');
 assert.equal(contact(r.state,'yeogyeong').introduced,false);
 for(const actions of Object.values(placeActions))for(const a of actions)assert.ok(!/차여경|한서연|박소율|대화하기/.test(a.label));
});

test('passing does not start conversation or make someone wait for a repeat',()=>{
 const first=arrive(newGame(),'hall'),before=structuredClone(first.state.relations);
 const skipped=resolveEncounter(first.state,first.encounter,false).state;
 assert.deepEqual(skipped.relations,before);
 assert.equal(contact(skipped,'yeogyeong').introduced,false);
 assert.equal(arrive(skipped,'hall').encounter,null);
 assert.equal(arrive(skipped,'hall','tables').encounter,null);
 assert.throws(()=>resolveEncounter(skipped,first.encounter,true));
});

test('situational exchange begins a relevant topic without another formal introduction',()=>{
 const r=arrive(newGame(),'hall'),n=resolveEncounter(r.state,r.encounter,true);
 assert.equal(contact(n.state,'yeogyeong').introduced,true);
 assert.equal(contact(n.state,'soyul').introduced,false);
 assert.match(n.result.playerLine,/영수증/);
 assert.match(n.result.text,/계산|휴대폰/);
 assert.equal(dialogue(n.state,'yeogyeong').scene,true);
 assert.match(n.result.text,/저는 차여경/);assert.match(n.result.playerLine,/김태이/);
 const returning=arrive(n.state,'hall','tables');
 assert.match(returning.encounter.action,/아까 멈춘 이야기/);
 const resumed=resolveEncounter(returning.state,returning.encounter,true);
 assert.deepEqual(resumed.state.relations,n.state.relations);
});

test('location and day choose who happens to be present, never spawn missing people',()=>{
 const day2=nextDay(act(newGame(),'rehearsal'));
 assert.equal(arrive(day2,'hall').encounter.person,'yeogyeong');
 assert.equal(arrive(day2,'library').encounter.person,'soyul');
 assert.equal(arrive(day2,'cafe').encounter.person,'seoyeon');
 assert.equal(arrive(day2,'hall','window').encounter,null);
 assert.match(arrive(day2,'library').encounter.text,/펜/);
 assert.notEqual(arrive(day2,'hall').encounter.text,arrive(newGame(),'hall').encounter.text);
});

test('NPC-to-NPC conversation is encountered while moving through a shared space',()=>{
 const r=arrive(newGame(),'hall','lounge');
 assert.equal(r.encounter.group,true);
 assert.match(r.encounter.text,/이쪽을 보지 못한 채/);
 assert.equal(resolveEncounter(r.state,r.encounter,true).group,true);
 assert.equal(contact(r.state,'seoyeon').introduced,false);
 const day2=nextDay(act(newGame(),'rehearsal'));
 assert.equal(arrive(day2,'hall','lounge').encounter,null);
});

test('encounter resolution persists across saving and day changes permit new scenes',()=>{
 const r=arrive(newGame(),'hall'),skipped=resolveEncounter(r.state,r.encounter,false).state;
 assert.equal(arrive(restore(save(skipped)),'hall').encounter,null);
 const day2=nextDay(act(skipped,'explore'));
 assert.ok(arrive(day2,'hall').encounter);
 assert.deepEqual(restore(save(day2)),day2);
});

test('unoccupied locations and interior actions produce observations and lasting discoveries',()=>{
 for(const [location,spot,information] of [['library','shelves','도서관 공용 프린터 위치'],['cafe','counter','카페 충전 좌석 위치']]){
  const entry=arrive(newGame(),location);
  assert.equal(entry.encounter,null);assert.ok(entry.observation.length>20);
  const inside=arrive(entry.state,location,spot);
  assert.equal(inside.encounter,null);assert.ok(inside.state.known.includes(information));
  assert.notEqual(inside.observation,entry.observation);
  const saved=restore(save(inside.state)),again=arrive(saved,location,spot);
  assert.equal(again.state.memory.length,inside.state.memory.length);
  assert.match(again.observation,/다시/);
  assert.deepEqual(again.state.relations,entry.state.relations);
  assert.equal(again.state.phase,'afternoon');
 }
});

test('interior exploration can encounter present people without respawning resolved exchanges',()=>{
 const day2=nextDay(act(newGame(),'rehearsal'));
 for(const [location,spot,person] of [['library','shelves','soyul'],['cafe','counter','seoyeon']]){
  const inside=arrive(day2,location,spot);
  assert.equal(inside.encounter.person,person);
  const passed=resolveEncounter(inside.state,inside.encounter,false).state;
  const entry=arrive(passed,location);
  assert.equal(entry.encounter,null);assert.ok(entry.observation);
 }
});
