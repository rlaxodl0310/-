import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {personalEventsAt,beginPersonalEvent,progressPersonalEvent,personalEventView,pausePersonalEvent} from './personal-events.js';
import {displayName,contact} from './identity.js';
import {dogyeomLocation} from './dogyeom-events.js';
import {characterActing} from './character-acting.js';
import {conversationCast} from './dialogue-cast.js';
function fixture(){const s=newGame();s.academics.registrationPending=false;s.freeDay={home:false};s.location='gym';s.clock.minute=1020;return s;}
function at(s){s.location=dogyeomLocation(s);return s;}
test('Dogyeom learns names through play, saves mid-scene, unlocks later stories on later days',()=>{
 let s=at(fixture());assert.notEqual(displayName(s,'dogyeom'),'윤도겸');assert.ok(personalEventsAt(s).some(e=>e.eventId==='dogyeom'));
 s=beginPersonalEvent(s,'dogyeom');assert.equal(contact(s,'dogyeom').seen,true);s=progressPersonalEvent(s,'introduce');assert.equal(displayName(s,'dogyeom'),'윤도겸');assert.equal(s.contacts.dogyeom.details.year,2);
 s=restore(save(s));s=progressPersonalEvent(s,'leave');assert.equal(s.personalEvents.records.dogyeom.status,'completed');assert.ok(!personalEventsAt(s).some(e=>e.eventId==='dogyeom:2'));
 for(const [id,first,last] of [['dogyeom:2','practice','listen'],['dogyeom:3','tease','quiet']]){s.day++;s.clock.minute=1020;at(s);assert.ok(personalEventsAt(s).some(e=>e.eventId===id));s=beginPersonalEvent(s,id);s=progressPersonalEvent(s,first);s=progressPersonalEvent(s,last);assert.equal(s.personalEvents.records[id].status,'completed');}
 assert.equal(s.memory.filter(x=>x.includes('윤도겸')).length,3);
});
test('Dogyeom respects actual location, short reservation, pause and late introductions',()=>{
 let s=at(fixture());const place=s.location;const wrong={...s,location:'arts'};assert.ok(!personalEventsAt(wrong).some(e=>e.person==='dogyeom'));s=beginPersonalEvent(s,'dogyeom');s=progressPersonalEvent(s,'pass');s=pausePersonalEvent(s);s=beginPersonalEvent(s,'dogyeom');s=progressPersonalEvent(s,'leave');assert.equal(contact(s,'dogyeom').introduced,false);
 s.day++;s.clock.minute=1020;at(s);s=beginPersonalEvent(s,'dogyeom:2');s=progressPersonalEvent(s,'ask');assert.ok(personalEventView(s).options.some(o=>o[0]==='names'));s=progressPersonalEvent(s,'names');assert.equal(displayName(s,'dogyeom'),'윤도겸');
 s.clock.minute=800;assert.equal(dogyeomLocation(s),null);s.clock.minute=720;assert.equal(dogyeomLocation(s),'cafeteria');s.clock.minute=960;assert.equal(dogyeomLocation(s),'library');
});
test('Dogyeom six atlas poses and cast do not borrow another character',()=>{const s=newGame();for(const [emotion,row] of [['neutral',0],['worried',1],['serious',2],['bashful',3],['surprised',4],['happy',5]]){const a=characterActing(s,'dogyeom',{emotion});assert.equal(a.row,row);assert.equal(a.atlas,'dogyeom');}assert.deepEqual(conversationCast({scene:'personalEvent',contextPerson:'dogyeom'}),['taei','dogyeom']);});
