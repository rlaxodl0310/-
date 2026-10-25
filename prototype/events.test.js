import test from 'node:test';
import assert from 'node:assert/strict';
import {newAfternoonScenario as newGame,act,nextDay,save,restore} from './simulation.js';
import {knownGame} from './fixtures.js';
import {phaseEvents,activityEvents,eventApproaches,planEvent,evaluateEvents} from './event-engine.js';
import {eventKey,scheduledEvent,readMessages,photoReport} from './event-view.js';
import {arrive,resolveEncounter} from './encounters.js';
import {respond,relationship} from './dialogue.js';
import {survivalEventExamples} from './survival-event-examples.js';

const secondDay=(s=newGame())=>nextDay(act(s,'rehearsal'));

test('scheduled activities occur without the player but NPC relationships change their outcome',()=>{
 const confident=secondDay(),withdrawn=newGame();
 withdrawn.relations['soyul>seoyeon'].trust=0;
 const quiet=secondDay(withdrawn);
 const a=act(confident,'work'),b=act(quiet,'work');
 assert.equal(scheduledEvent(a,'photo-selection').outcome,'joint');
 assert.equal(scheduledEvent(b,'photo-selection').outcome,'practical');
 assert.ok(!scheduledEvent(a,'photo-selection').participants.includes('taei'));
 assert.ok(!a.eventState.knowledge[eventKey(scheduledEvent(a,'photo-selection'))]);
 assert.notEqual(photoReport(a,'soyul'),photoReport(b,'soyul'));
});

test('participation method is a persisted decision and changes the event result',()=>{
 const s=secondDay(knownGame('friend'));
 const practical=act(planEvent(s,'review','organize'),'review');
 const personal=act(planEvent(s,'review','listen'),'review');
 assert.equal(scheduledEvent(practical,'photo-selection').outcome,'practical');
 assert.equal(scheduledEvent(personal,'photo-selection').outcome,'joint');
 assert.ok(eventApproaches(s,'review').some(o=>o.id==='stepBack'));
 assert.equal(restore(save(practical)).eventState.plans['2:review'],'organize');
 assert.throws(()=>planEvent(s,'review','unknown'));
});

test('conditions create NPC-to-NPC followups without exposing private reasons',()=>{
 const s=act(secondDay(),'work');
 const encouragement=s.events.find(e=>e.id==='friend-check-in');
 assert.equal(encouragement.kind,'conditional');
 assert.ok(s.eventState.flags.photoConfidence);
 assert.ok(!s.eventState.knowledge[eventKey(encouragement)]);
 assert.ok(!s.memory.some(m=>m.includes('서연이 소율에게')));
 const practical=act(secondDay(),'review',{approach:'organize'});
 assert.ok(practical.events.some(e=>e.id==='creative-friction'));
 assert.ok(practical.eventState.flags.unspokenPreference);
});

test('trust and personal experience gate the private request; affection alone is insufficient',()=>{
 const close=secondDay(knownGame('close'));
 const invited=act(close,'review');
 assert.ok(invited.events.some(e=>e.id==='caption-request'));
 const low=structuredClone(close);low.relations['soyul>taei'].trust=0;
 assert.ok(!act(low,'review').events.some(e=>e.id==='caption-request'));
 assert.ok(!act(secondDay(),'work').events.some(e=>e.id==='caption-request'));
});

test('reading a conditional message changes what the player can recognize in a later encounter',()=>{
 const evening=act(secondDay(knownGame('friend')),'review',{approach:'organize'});
 const request=evening.events.find(e=>e.id==='caption-request');assert.ok(request);
 assert.ok(!evening.eventState.knowledge[eventKey(request)]);
 const unread=arrive(nextDay(evening),'library');
 assert.equal(unread.encounter.condition,undefined);
 const read=arrive(nextDay(readMessages(evening)),'library');
 assert.equal(read.encounter.condition,'caption-request');
 assert.match(read.encounter.text,/어젯밤 메시지/);
 assert.ok(read.state.eventState.knowledge[eventKey(request)]);
});

test('a meaningful reply, not just arriving, changes the eventual exhibition even when absent',()=>{
 const evening=readMessages(act(secondDay(knownGame('friend')),'review',{approach:'organize'}));
 const entered=arrive(nextDay(evening),'library');
 const greeted=resolveEncounter(entered.state,entered.encounter,true).state;
 assert.ok(!greeted.eventState.flags.captionReviewed);
 const stepped=respond(greeted,'soyul','scene:distance').state;
 const reviewed=respond(stepped,'soyul','scene:specific').state;
 assert.equal(reviewed.eventState.flags.captionReviewed,true);
 const without=act(nextDay(evening),'backstage');
 const withFeedback=act(reviewed,'backstage');
 assert.equal(scheduledEvent(without,'campus-showcase').outcome,'unfinished-caption');
 assert.equal(scheduledEvent(withFeedback,'campus-showcase').outcome,'joint-display');
 assert.ok(withFeedback.events.some(e=>e.id==='caption-reviewed'));
 assert.ok(!withFeedback.eventState.knowledge[eventKey(scheduledEvent(withFeedback,'campus-showcase'))]);
});

test('NPCs can reconcile on their own when their existing bond supports it',()=>{
 const s=secondDay();s.relations['yeogyeong>soyul'].trust=2;s.relations['soyul>yeogyeong'].trust=2;
 const day3=nextDay(act(s,'review',{approach:'organize'}));
 assert.ok(day3.events.some(e=>e.id==='peer-adjustment'));
 assert.ok(day3.eventState.flags.preferenceReconciled);
});

test('all three event kinds share records and do not duplicate rewards after loading',()=>{
 const noticed=arrive(newGame(),'hall');
 const passed=resolveEncounter(noticed.state,noticed.encounter,false).state;
 const day2=secondDay(passed),resolved=act(day2,'work');
 assert.deepEqual(new Set(resolved.events.map(e=>e.kind)),new Set(['scheduled','conditional','situational']));
 const before=structuredClone(resolved.relations);
 const rerun=activityEvents(restore(save(resolved)),'work');
 assert.deepEqual(rerun.relations,before);
 assert.deepEqual(rerun.memory,resolved.memory);
 assert.equal(rerun.events.length,resolved.events.length);
 const phaseAgain=phaseEvents(restore(save(day2)));
 assert.equal(phaseAgain.events.length,day2.events.length);
});

for(const stage of ['outbreak','survival'])test(stage+': same event rule contract handles rotation, fatigue and blocked movement',()=>{
 let s=newGame();s.world.stage=stage;s.npcs.soyul.fatigue=90;
 s=evaluateEvents(s,{trigger:'phase-start'},survivalEventExamples);
 assert.equal(s.eventState.flags.restRequested.soyul,true);
 s=evaluateEvents(s,{trigger:'shift-end',shift:'night',watchers:['yeogyeong']},survivalEventExamples);
 s=evaluateEvents(s,{trigger:'move',location:'north-passage',blocked:true,presentIds:['taei','seoyeon']},survivalEventExamples);
 assert.deepEqual(new Set(s.events.map(e=>e.kind)),new Set(['scheduled','conditional','situational']));
 assert.ok(s.events.every(e=>e.stage===stage));
 assert.ok(s.known.includes('봉쇄된 통로: north-passage'));
 const loaded=restore(save(s));
 assert.equal(evaluateEvents(loaded,{trigger:'move',location:'north-passage',blocked:true,presentIds:['taei','seoyeon']},survivalEventExamples).events.length,s.events.length);
});

test('survival-only rules cannot leak into peaceful campus life',()=>{
 const s=newGame();s.npcs.soyul.fatigue=90;
 assert.equal(evaluateEvents(s,{trigger:'phase-start'},survivalEventExamples).events.length,0);
});

test('legacy schedules migrate without rerunning past outcomes or changing bonds',()=>{
 const old=act(newGame(),'volunteer');old.version=5;delete old.world;delete old.eventState;
 for(const e of old.events){delete e.kind;delete e.stage;}
 const loaded=restore(save(old));assert.equal(loaded.version,6);
 assert.deepEqual(loaded.relations,old.relations);
 assert.equal(loaded.events[0].kind,'scheduled');
});
