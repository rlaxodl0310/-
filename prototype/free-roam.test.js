import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,nextDay,save,restore} from './simulation.js';
import {freeActivity,advanceFreeTime,goHome} from './free-roam.js';
import {campusScene} from './scene-flow.js';
import {paceAction} from './campus-time.js';

test('arrival offers free destinations and no community prompt or assigned personal activity',()=>{
 const s=newGame(),scene=campusScene(s);assert.match(scene.text,/학교에 도착/);
 assert.ok(scene.choices.every(c=>!['select','openCommunity'].includes(c.action)));
 assert.ok(!scene.text.includes('휴대폰'));assert.equal(s.appointments.length,0);
});
test('multiple optional tasks fit into one day with no forced 16:00 start or evening jump',()=>{
 let s=newGame();s=freeActivity(s,'rehearsal');assert.equal(s.clock.minute,900);assert.equal(s.phase,'afternoon');
 s=freeActivity(s,'explore');assert.equal(s.clock.minute,960);assert.equal(s.phase,'afternoon');assert.equal(s.freeDay.completed.length,2);
 const again=freeActivity(s,'rehearsal');assert.equal(again.freeDay.completed.length,3);assert.deepEqual(restore(save(s)),s);
});
test('free exploration alone can reach evening and advance the world without a mandatory long activity',()=>{
 let s=newGame();s.location='hall';s=advanceFreeTime(s,300);assert.equal(s.phase,'evening');assert.ok(s.freeDay.settled);
 assert.equal(s.choice,null);assert.ok(s.events.some(e=>e.id==='supplies'));
 const home=goHome(s),tomorrow=nextDay(home);assert.equal(tomorrow.day,2);assert.equal(tomorrow.freeDay.completed.length,0);
});
test('unfulfilled promises remain pending while free time remains, and settle at the real day boundary',()=>{
 const s=newGame();s.appointments=[{id:'help',person:'yeogyeong',day:1,activity:'volunteer',label:'물품 준비',status:'pending'}];
 const music=freeActivity(s,'rehearsal');assert.equal(music.appointments[0].status,'pending');
 const help=freeActivity(music,'volunteer');assert.equal(help.appointments[0].status,'kept');
 const missed=goHome(music);assert.equal(missed.appointments[0].status,'broken');
});
test('short action batches continue after 16:00 without forcing a named activity',()=>{
 let s=newGame();s.clock.minute=960;
 for(const id of ['one','two','three'])s=paceAction(s,s,{action:'walk',value:id,from:'place',to:'place'}).state;
 assert.equal(s.clock.minute,990);assert.equal(s.phase,'afternoon');assert.equal(s.choice,null);
});
test('early departure is optional and preserves independent events without granting unseen information',()=>{
 const s=goHome(newGame());assert.ok(s.freeDay.home);assert.ok(s.events.some(e=>e.id==='supplies'));
 assert.ok(!s.known.includes('물품 수량 불일치 사건'));assert.equal(nextDay(s).day,2);
});

test('doing another task later does not erase the earlier shared volunteer experience',async()=>{
 const {dialogue}=await import('./dialogue.js');let s=freeActivity(newGame(),'volunteer');s=freeActivity(s,'explore');s=advanceFreeTime(s,60);
 assert.equal(s.phase,'evening');assert.equal(s.choice,'explore');assert.match(dialogue(s,'yeogyeong').opening,/같이 세준 거|고마워/);
});
test('creative followups remember all prior activities rather than only the last one',()=>{
 let s=freeActivity(newGame(),'rehearsal');s=freeActivity(s,'explore');s=nextDay(goHome(s));s=freeActivity(s,'work');
 assert.match(s.lastResult,/이전에 합주/);
});
test('finishing real responsibilities frees an NPC to reconsider an escort',async()=>{
 const {knownGame}=await import('./fixtures.js');const {escortOpinion}=await import('./risk-decisions.js');
 let s=nextDay(goHome(nextDay(goHome(knownGame('close')))));assert.equal(escortOpinion(s,'yeogyeong').willing,false);
 s=freeActivity(s,'exhibit');assert.equal(s.phase,'afternoon');assert.equal(escortOpinion(s,'yeogyeong').willing,true);
});
