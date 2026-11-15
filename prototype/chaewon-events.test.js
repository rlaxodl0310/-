import test from 'node:test';import assert from 'node:assert/strict';
import {newAfternoonScenario,save,restore} from './simulation.js';
import {chaewonEventsAt,chaewonLocation} from './chaewon-events.js';
import {beginPersonalEvent,progressPersonalEvent,pausePersonalEvent,personalEventsAt} from './personal-events.js';
import {personalEventPosition} from './personal-event-presence.js';
import {advanceFreeTime} from './free-roam.js';
import {introduce,displayName} from './identity.js';
import {eventCutscene} from './event-cutscenes.js';
function intro(){let s=newAfternoonScenario('close');s.location='gym';s.clock.minute=960;return s;}
function known(){let s=progressPersonalEvent(beginPersonalEvent(intro(),'chaewon'),'names');return progressPersonalEvent(s,'leave');}
function shared(partner='iseo'){const s=known();s.day=3;s.clock.minute=partner==='iseo'?960:1020;s.location=partner==='iseo'?'gym':'hall';introduce(s,partner);s.relations[`${partner}>taei`]={familiarity:6,trust:4};s.weather.days[s.day]={afternoon:'sunny',evening:'sunny'};return s;}
test('Chaewon first contact has an actual equipment reason and learns names only when spoken',()=>{
 let s=beginPersonalEvent(intro(),'chaewon');assert.notEqual(displayName(s,'chaewon'),'유채원');const before=s.clock.minute;s=progressPersonalEvent(s,'turn');assert.equal(s.clock.minute,before+10);assert.equal(s.contacts.chaewon.introduced,false);s=progressPersonalEvent(restore(save(s)),'names');assert.equal(s.clock.minute,before+30);assert.equal(displayName(s,'chaewon'),'유채원');assert.equal(s.contacts.chaewon.details.age,21);assert.equal(s.personalEvents.records.chaewon.status,'completed');assert.throws(()=>progressPersonalEvent(s,'names'));
});
test('shared stories require a later meeting, known trusted actual participants and free time',()=>{
 let s=known();introduce(s,'iseo');s.relations['iseo>taei']={familiarity:6,trust:4};s.clock.minute=960;assert.throws(()=>beginPersonalEvent(s,'chaewon:iseo'));
 for(const partner of ['iseo','seoyeon']){s=shared(partner);assert.ok(chaewonEventsAt(s).some(e=>e.eventId==='chaewon:'+partner));for(const modify of [x=>x.location='library',x=>x.contacts[partner].introduced=false,x=>x.relations[partner+'>taei'].trust=0,x=>x.relations['chaewon>taei'].tension=5,x=>{x.characterSystem={presence:{[partner]:false}};x.contacts[partner].seen=false;x.contacts[partner].introduced=false;},x=>x.appointments.push({person:'soyul',day:x.day,minute:x.clock.minute+5,status:'pending'})]){const x=structuredClone(s);modify(x);if(!x.contacts[partner].introduced||x.characterSystem?.presence?.[partner]===false){x.contacts[partner].seen=false;x.contacts[partner].introduced=false;}assert.throws(()=>beginPersonalEvent(x,'chaewon:'+partner));}}
});
test('both real participants speak, save/load preserves choices and completion changes their mutual relation once',()=>{
 for(const partner of ['iseo','seoyeon']){let s=beginPersonalEvent(shared(partner),'chaewon:'+partner),m=s.clock.minute;const prior=save(s.personalEvents.records.chaewon);s=progressPersonalEvent(s,partner==='iseo'?'share':'stay');assert.deepEqual(s.personalEvents.records[s.personalEvents.active].last.lines.map(l=>l.person),[partner,'chaewon']);s=restore(save(s));s=progressPersonalEvent(s,partner==='iseo'?'finish':'respect');assert.equal(s.clock.minute,m+30);assert.equal(save(s.personalEvents.records.chaewon),prior);assert.equal(s.relations['chaewon>'+partner].trust,1);assert.equal(s.relations[partner+'>chaewon'].trust,1);const before=save(s);assert.throws(()=>progressPersonalEvent(s,'finish'));assert.equal(save(s),before);}
});
test('pausing or leaving releases every participant; departed and expired replies cannot grant results',()=>{
 let s=beginPersonalEvent(shared('seoyeon'),'chaewon:seoyeon');s=progressPersonalEvent(s,'stay');assert.equal(personalEventPosition(s,'seoyeon'),'hall');assert.equal(personalEventPosition(s,'chaewon'),'hall');const paused=pausePersonalEvent(s);assert.equal(personalEventPosition(paused,'seoyeon'),null);assert.deepEqual(paused.personalEvents.records['chaewon:seoyeon'].choices,['stay']);let moved=structuredClone(s);moved.location='cafe';assert.equal(personalEventPosition(moved,'seoyeon'),null);assert.throws(()=>progressPersonalEvent(moved,'respect'));let expired=advanceFreeTime(s,21);assert.equal(expired.personalEvents.active,null);assert.equal(expired.personalEvents.records['chaewon:seoyeon'].status,'paused');assert.throws(()=>progressPersonalEvent(expired,'respect'));
});
test('rear-view shared walk is choice-bound, dry-weather only, exact participants and no rendering side effects',()=>{
 let s=progressPersonalEvent(beginPersonalEvent(shared('seoyeon'),'chaewon:seoyeon'),'walk');const before=save(s),beat={kind:'speech',actor:'chaewon'};assert.equal(eventCutscene(s,'personalEvent',beat).id,'chaewon-together');assert.equal(save(s),before);assert.equal(eventCutscene(s,'personalEvent',{kind:'speech',actor:'taei'}),null);let wet=structuredClone(s);wet.weather.days[wet.day][wet.phase]='rain';assert.notEqual(eventCutscene(wet,'personalEvent',beat)?.id,'chaewon-together');s=progressPersonalEvent(s,'respect');assert.equal(eventCutscene(s,'personalEvent',beat),null);
 const pair=progressPersonalEvent(beginPersonalEvent(shared(),'chaewon:iseo'),'rest');assert.deepEqual(eventCutscene(pair,'personalEvent',beat).cast.map(a=>a.id),['taei','chaewon','iseo']);assert.equal(eventCutscene(pair,'personalEvent',beat).cast[1].atlas,'chaewon');
});
test('Chaewon has a limited route and remote map queries do not hold a person in place',()=>{const s=known();s.day=3;s.clock.minute=1020;s.location='hall';assert.equal(chaewonLocation(s),'hall');s.clock.minute=1140;assert.equal(chaewonLocation(s),null);assert.ok(!personalEventsAt(s,'gym').some(e=>e.person==='chaewon'));});
