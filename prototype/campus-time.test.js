import test from 'node:test';
import assert from 'node:assert/strict';
import {newAfternoonScenario as makeGame,act,save,restore} from './simulation.js';
import {timeCost,spendTime,clockLabel,placeAtmosphere,paceAction} from './campus-time.js';
function newGame(...args){const s=makeGame(...args);s.playMode='legacy';return s;}
import {presentPeople} from './days.js';
import {arrive} from './encounters.js';
import {relationship} from './dialogue.js';
test('short choices have no individual time cost; clock and saves remain stable',()=>{
 const s=newGame();assert.equal(clockLabel(s),'13:00');assert.equal(timeCost(s,'visit','hall'),0);assert.equal(timeCost(s,'go','menu'),0);
 const n=spendTime(s,15);assert.equal(clockLabel(n),'13:15');assert.equal(clockLabel(s),'13:00');assert.deepEqual(restore(save(n)),{...n,playMode:'free'});
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

test('several activities advance one block and repeated looking cannot consume a block',()=>{
 let s=newGame();
 for(const spot of ['noticeboard','noticeboard','tables']){
  const after=arrive(s,'hall',spot).state;s=paceAction(s,after,{action:'walk',value:spot,from:'place',to:'place'}).state;
 }
 assert.equal(clockLabel(s),'13:00');assert.equal(s.pace.count,2);
 const after=arrive(s,'hall','window').state;const r=paceAction(s,after,{action:'walk',value:'window',from:'place',to:'place'});
 assert.equal(r.minutes,30);assert.equal(clockLabel(r.state),'13:30');assert.equal(r.state.pace.count,0);
});
test('dialogue replies never tick time and a pending block waits for conversation exit',()=>{
 let s=newGame();s.pace.count=2;
 const arriving=arrive(s,'hall').state;
 let r=paceAction(s,arriving,{action:'visit',from:'campus',to:'encounter'});s=r.state;
 assert.equal(s.pace.count,3);assert.equal(r.minutes,0);
 for(let i=0;i<12;i++){r=paceAction(s,s,{action:'answer',from:'dialogue',to:'dialogue',person:'yeogyeong'});s=r.state;assert.equal(r.minutes,0);}
 assert.equal(clockLabel(s),'13:00');
 r=paceAction(s,s,{action:'go',value:'place',from:'dialogue',to:'place',person:'yeogyeong'});
 assert.equal(clockLabel(r.state),'13:30');assert.equal(r.minutes,30);
});
test('partial batches survive loading and menus; rest clears the batch and stops at the cutoff',()=>{
 let s=newGame();s.pace.count=2;s=restore(save(s));
 assert.equal(paceAction(s,s,{action:'go',value:'menu',from:'place',to:'menu'}).state.pace.count,2);
 let r=paceAction(s,s,{action:'wait',from:'place',to:'place'});assert.equal(r.state.pace.count,0);assert.equal(r.minutes,30);
 r.state.clock.minute=950;r=paceAction(r.state,r.state,{action:'wait',from:'place',to:'place'});assert.equal(clockLabel(r.state),'16:20');assert.equal(r.minutes,30);
});
