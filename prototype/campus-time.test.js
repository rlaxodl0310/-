import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,save,restore} from './simulation.js';
import {timeCost,spendTime,clockLabel,placeAtmosphere} from './campus-time.js';
import {presentPeople} from './days.js';
import {arrive} from './encounters.js';
import {relationship} from './dialogue.js';
test('clock charges traversal and exploration, not menus, and survives saving',()=>{
 const s=newGame();assert.equal(clockLabel(s),'13:00');assert.equal(timeCost(s,'visit','hall'),5);assert.equal(timeCost(s,'go','menu'),0);
 const n=spendTime(s,15);assert.equal(clockLabel(n),'13:15');assert.equal(clockLabel(s),'13:00');assert.deepEqual(restore(save(n)),n);
});
test('an unoccupied location gains an encounter later; schedules and atmosphere change',()=>{
 let s=arrive(newGame(),'library').state;assert.deepEqual(presentPeople(s,'library'),[]);
 const earlier=placeAtmosphere(s,'library');s=spendTime(s,60);
 assert.deepEqual(presentPeople(s,'library'),['soyul']);assert.notEqual(placeAtmosphere(s,'library'),earlier);
 assert.equal(arrive(s,'library').encounter.person,'soyul');
 assert.equal(arrive(s,'cafe').encounter.person,'seoyeon');
});
test('independent exchanges run once, remain private when absent and are observed only on site',()=>{
 const s=newGame(),before=relationship(s,'soyul','seoyeon').trust;
 const n=spendTime(s,120);assert.equal(relationship(n,'soyul','seoyeon').trust,before+1);
 assert.ok(n.events.some(e=>e.id==='day1-library-check'));assert.ok(!n.known.includes('사진 출력 수량 협의'));
 assert.equal(spendTime(n,0).events.length,n.events.length);
 const onSite=structuredClone(s);onSite.location='library';assert.ok(spendTime(onSite,120).known.includes('사진 출력 수량 협의'));
 assert.ok(!spendTime(onSite,120,{travelling:true}).known.includes('사진 출력 수량 협의'));
});
test('strained NPCs skip optional meeting; scheduled private contact still occurs',()=>{
 const s=newGame();s.relations['yeogyeong>soyul']={tension:3};const n=spendTime(s,130);
 assert.ok(presentPeople(n,'hall').includes('yeogyeong'));assert.ok(!n.events.some(e=>e.id==='day1-library-check'));
 assert.ok(n.events.some(e=>e.id==='day1-peer-message'));
});
test('exploration cutoff does not strand player and activity resolves skipped world time',()=>{
 const s=spendTime(newGame(),180);assert.equal(clockLabel(s),'16:00');assert.throws(()=>spendTime(s,1),/16:00/);
 const finished=act(s,'volunteer');assert.equal(finished.phase,'evening');assert.equal(clockLabel(finished),'19:00');
 const early=act(newGame(),'rehearsal');assert.equal(clockLabel(early),'18:00');
 assert.equal(early.events.filter(e=>e.id==='day1-library-check').length,1);
});
