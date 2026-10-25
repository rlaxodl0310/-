import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,save,restore} from './simulation.js';

for(const route of ['rehearsal','volunteer','explore']) test(`${route}: world event resolves without duplicate execution`,()=>{
 const initial=newGame(),s=act(initial,route);
 assert.equal(initial.phase,'afternoon');assert.deepEqual(s.events.map(e=>e.id),['day1-peer-message','day1-library-check','supplies']);
 assert.equal(s.npcs.soyul.location,'hall');
 assert.equal(s.relations['yeogyeong>soyul'].trust,1);
 assert.throws(()=>act(s,route));
 assert.deepEqual(restore(save(s)),s);
 assert.throws(()=>act(restore(save(s)),route));
});
test('absent player does not learn hidden incident or receive participation credit',()=>{
 const s=act(newGame(),'rehearsal');
 assert.ok(!s.known.includes('물품 수량 불일치 사건'));
 assert.equal(s.relations['yeogyeong>taei'],undefined);
 assert.ok(!s.messages[0].text.includes('누락'));
 assert.ok(s.known.includes('장비 보관 위치'));
});
test('participant witnesses incident and receives specific memory',()=>{
 const s=act(newGame(),'volunteer');
 assert.ok(s.known.includes('물품 수량 불일치 사건'));
 assert.equal(s.relations['yeogyeong>taei'].trust,1);
});
test('invalid saves and actions are rejected',()=>{
 assert.throws(()=>restore('{"version":2}'));
 assert.throws(()=>restore('broken'));
 assert.throws(()=>act(newGame(),'unknown'));
});
