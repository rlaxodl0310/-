import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,nextDay,save,restore,cancelAppointment} from './simulation.js';
import {knownGame} from './fixtures.js';
import {clubs,joinClub,evaluateInvitations,replyOffer,suggestMeeting,meetAppointments,appointmentConflicts} from './appointments.js';
import {contact} from './identity.js';
import {arrive,resolveEncounter} from './encounters.js';

test('joining a club is voluntary and its activity offer is separate from membership',()=>{
 const initial=newGame();assert.deepEqual(initial.memberships,{});assert.equal(contact(initial,'soyul').nameLevel,'unknown');
 let s=joinClub(initial,'volunteer');assert.equal(Object.keys(clubs).length,3);assert.ok(s.memberships.volunteer);
 assert.equal(s.appointments[0].status,'offered');assert.equal(contact(s,'soyul').nameLevel,'full');assert.equal(contact(s,'soyul').introduced,false);
 assert.equal(s.relations['soyul>taei'],undefined);assert.throws(()=>joinClub(s,'volunteer'));
 s=replyOffer(s,s.appointments[0].id,false);assert.ok(s.memberships.volunteer);assert.equal(s.appointments[0].status,'declined');
 assert.equal(act(s,'rehearsal').appointments[0].status,'declined');assert.deepEqual(restore(save(s)),s);
});
test('accepted club activities can be kept, missed, or cancelled without an NPC owner',()=>{
 const joined=joinClub(newGame(),'volunteer'),id=joined.appointments[0].id;
 const accepted=replyOffer(joined,id,true);
 assert.equal(act(accepted,'volunteer').appointments[0].status,'kept');
 assert.equal(act(accepted,'rehearsal').appointments[0].status,'broken');
 assert.equal(act(cancelAppointment(accepted,id),'rehearsal').appointments[0].status,'cancelled');
 assert.equal(act(joined,'rehearsal').appointments[0].status,'expired');
});
test('football joining produces a playable next-day activity appointment',()=>{
 let s=joinClub(newGame(),'football');s=replyOffer(s,s.appointments[0].id,true);
 s=nextDay(act(s,'rehearsal'));s=act(s,'football');assert.equal(s.appointments[0].status,'kept');assert.ok(s.known.includes('축구 동아리 실내 운동 공간'));assert.ok(!s.known.includes('운동장'));
});
test('NPC initiative uses personality, trust and acquaintance; affection cannot bypass distrust',()=>{
 assert.equal(evaluateInvitations(newGame()).appointments.length,0);
 const close=knownGame('close');let s=evaluateInvitations(close);assert.equal(s.appointments.length,3);
 assert.equal(s.appointments.find(a=>a.person==='yeogyeong').kind,'activity');assert.equal(s.appointments.find(a=>a.person==='soyul').kind,'meeting');
 assert.equal(evaluateInvitations(s).appointments.length,3);
 const distrust=knownGame('close');distrust.relations['soyul>taei'].trust=0;
 assert.ok(!evaluateInvitations(distrust).appointments.some(a=>a.person==='soyul'));
 const unfamiliar=newGame();unfamiliar.relations['soyul>taei']={familiarity:10,trust:10,affection:10};assert.equal(evaluateInvitations(unfamiliar).appointments.length,0);
});
test('declining an offer causes no promise penalty and prevents repeated requests that day',()=>{
 let s=evaluateInvitations(knownGame('close'));const a=s.appointments.find(a=>a.person==='soyul'),before=structuredClone(s.relations);
 s=replyOffer(s,a.id,false);assert.deepEqual(s.relations,before);assert.equal(evaluateInvitations(s).appointments.length,3);
 assert.throws(()=>replyOffer(s,a.id,true));assert.equal(act(s,'rehearsal').appointments.find(x=>x.id===a.id).status,'declined');
});
test('personal meeting requires a real exchange in the right place and cannot reward twice',()=>{
 let s=evaluateInvitations(knownGame('close'));const a=s.appointments.find(a=>a.person==='seoyeon');s=replyOffer(s,a.id,true);
 s=nextDay(act(s,'rehearsal'));const wrong=meetAppointments(s,'seoyeon');assert.equal(wrong.appointments.find(x=>x.id===a.id).status,'pending');
 const arrived=arrive(s,'cafe');assert.equal(arrived.state.appointments.find(x=>x.id===a.id).status,'pending');assert.match(arrived.encounter.text,/약속/);
 s=resolveEncounter(arrived.state,arrived.encounter,true).state;assert.equal(s.appointments.find(x=>x.id===a.id).status,'kept');
 assert.deepEqual(meetAppointments(s,'seoyeon').relations,s.relations);
});
test('player suggestions can be refused, accepted, conflict, and respect NPC availability',()=>{
 const shy=knownGame();assert.equal(suggestMeeting(shy,'soyul').accepted,false);
 let s=suggestMeeting(knownGame('friend'),'seoyeon').state;assert.equal(s.appointments[0].status,'pending');assert.throws(()=>suggestMeeting(s,'seoyeon'));
 assert.ok(!evaluateInvitations(s).appointments.some(a=>a.proposer==='npc'&&a.person==='seoyeon'));
 s=joinClub(s,'football');const offered=s.appointments.find(a=>a.proposer==='club');assert.equal(appointmentConflicts(s,offered).length,1);
 const cancelled=cancelAppointment(s,s.appointments[0].id);assert.equal(cancelled.appointments[0].status,'cancelled');
});

test('older slots preserve learned identities without fabricating club enrollment or proposals',()=>{
 const old=joinClub(newGame(),'volunteer');delete old.memberships;delete old.invitationDecisions;old.appointments=[];
 const s=restore(save(old));assert.deepEqual(s.memberships,{});assert.deepEqual(s.invitationDecisions,{});
 assert.equal(contact(s,'soyul').nameLevel,'full');assert.equal(contact(s,'soyul').introduced,false);
 assert.equal(evaluateInvitations(s).appointments.length,0);
});
