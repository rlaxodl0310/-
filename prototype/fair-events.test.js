import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore as load} from './simulation.js';
import {fairStudents,fairVisitDay,fairStudentLocation,fairEventsAt,beginFairEvent,progressFairEvent,fairEventView} from './fair-events.js';
import {personalEventsAt,beginPersonalEvent,progressPersonalEvent,personalEventView} from './personal-events.js';
import {displayName,contact} from './identity.js';
import {eventCutscene,composeCutscene} from './event-cutscenes.js';
import {characterActing} from './character-acting.js';
function fairFixture(id,minute=610){const s=newGame();s.day=fairVisitDay(s);s.clock.minute=minute;s.location=fairStudentLocation(s,id);return s;}
test('fair day is saved, visits move with time, and no after-hours or other-day encounters',()=>{
 for(const id of Object.keys(fairStudents)){const s=fairFixture(id),day=s.day,first=s.location,before=save(s);assert.ok(fairEventsAt(s,first).some(e=>e.person===id));assert.equal(save(s),before);assert.equal(fairVisitDay(load(save(s))),day);s.clock.minute=790;assert.notEqual(fairStudentLocation(s,id),first);s.clock.minute=990;assert.equal(fairStudentLocation(s,id),null);s.clock.minute=610;s.day=day===4?5:4;assert.equal(fairStudentLocation(s,id),null);assert.deepEqual(fairEventsAt(s,first),[]);}
});
test('six students enter through the real personal-event hub, disclose only by introduction, keep membership unchanged',()=>{
 for(const id of Object.keys(fairStudents)){let s=fairFixture(id);const memberships=structuredClone(s.memberships),label=displayName(s,id),event=id+':fair:1';assert.notEqual(label,fairStudents[id].name);assert.ok(personalEventsAt(s).some(e=>e.eventId===event));s=beginPersonalEvent(s,event);assert.equal(contact(s,id).seen,true);assert.equal(personalEventView(s).title,label);s=progressPersonalEvent(s,'help');const before=save(s),cut=eventCutscene(s,'personalEvent',{kind:'speech',actor:id,text:personalEventView(s).last.text});assert.deepEqual(cut.cast.map(x=>x.id),['taei',id]);assert.equal(cut.cast[1].row,0);assert.equal(cut.cast[1].label,label);assert.equal(save(s),before);s=load(save(s));s=progressPersonalEvent(s,'names');assert.equal(displayName(s,id),fairStudents[id].name);assert.deepEqual(s.contacts[id].details,{school:'천안 해솔고등학교',grade:3});assert.deepEqual(s.memberships,memberships);assert.equal(s.personalEvents.records[event].status,'completed');assert.throws(()=>progressPersonalEvent(s,'names'));}
});
test('leave preserves unknown identity; dismiss changes reaction without promising recruitment or romance',()=>{
 for(const id of Object.keys(fairStudents)){let s=beginFairEvent(fairFixture(id),id+':fair:1');s=progressFairEvent(s,'dismiss');assert.equal(s.personalEvents.records[s.personalEvents.active].last.emotion,'serious');assert.equal(characterActing(s,id,{emotion:'happy'}).emotion,'serious');const cut=eventCutscene(s,'personalEvent',{kind:'speech',actor:id,text:'하하'});assert.equal(cut.cast[1].row,2);s=progressFairEvent(s,'leave');assert.equal(contact(s,id).introduced,false);assert.equal(s.relations[id+'>taei'].affection,0);assert.deepEqual(s.memberships,{});}
});
test('followups need an actual earlier activity and elapsed time, and expire at bus departure',()=>{
 let s=fairFixture('jihoo');assert.equal(fairEventsAt(s,s.location).some(e=>e.eventId==='jihoo:fair:2'),false);s=progressFairEvent(beginFairEvent(s,'jihoo:fair:1'),'help');s=progressFairEvent(s,'names');assert.equal(fairEventsAt(s,s.location).some(e=>e.eventId==='jihoo:fair:2'),false);s.clock.minute+=20;s.location=fairStudentLocation(s,'jihoo');assert.ok(fairEventsAt(s,s.location).some(e=>e.eventId==='jihoo:fair:2'));s=beginFairEvent(s,'jihoo:fair:2');const earlier=s.clock.minute;s.clock.minute=991;assert.throws(()=>progressFairEvent(s,'help'));s.clock.minute=earlier;s.location='dorm';assert.throws(()=>progressFairEvent(s,'help'));
});
test('all twelve actors select correct pixel bank with guarded priority',()=>{
 const s=newGame();for(const id of Object.keys(fairStudents)){const c=composeCutscene(s,['taei',id],{emotion:'happy',activeActor:id});assert.equal(c.cast.length,2);assert.ok(['fair','fair-extra'].includes(c.cast[1].atlas));assert.ok(c.cast[1].column<3);}assert.equal(composeCutscene(s,['dogyeom']).cast[0].atlas,'main');
});
