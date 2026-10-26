import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {submitClubApplication,answerClubInterview,interviewAvailability,settleClubAdmissions,clubInterviewRooms} from './club-admissions.js';
import {joinClub} from './appointments.js';
import {enterBuildingArea} from './campus-buildings.js';
import {contact} from './identity.js';
function application(id='volunteer'){
 let s=newGame();s.clock.minute=780;s=submitClubApplication(s,id,'interest');s.clock.minute=810;s.location='hall';return enterBuildingArea(s,clubInterviewRooms[id]).state;
}
test('phone submission never enrolls or reveals members; early and remote interviews are rejected',()=>{
 const s=newGame();s.clock.minute=780;const a=submitClubApplication(s,'volunteer','interest');
 assert.deepEqual(a.memberships,{});assert.equal(contact(a,'yeogyeong').nameLevel,'unknown');assert.throws(()=>joinClub(a,'volunteer'));
 assert.match(interviewAvailability(a,'volunteer'),/접수/);assert.throws(()=>answerClubInterview(a,'volunteer','honest'));
 a.clock.minute=810;assert.match(interviewAvailability(a,'volunteer'),/직접/);
});
test('two actual interview exchanges, result wait, explicit acceptance and save roundtrip',()=>{
 for(const id of ['volunteer','football','music']){
  let s=application(id);assert.equal(interviewAvailability(s,id),null);
  s=answerClubInterview(s,id,'honest');assert.equal(s.clock.minute,810);s=restore(save(s));
  s=answerClubInterview(s,id,'coordinate');assert.equal(s.clock.minute,830);assert.equal(s.clubApplications[id].status,'reviewing');
  assert.throws(()=>joinClub(s,id));s.clock.minute=859;assert.equal(settleClubAdmissions(s).clubApplications[id].status,'reviewing');
  s.clock.minute=860;s=settleClubAdmissions(s);assert.deepEqual(s.memberships,{});s=joinClub(s,id);assert.ok(s.memberships[id]);
  assert.equal(contact(s,'yeogyeong').nameLevel,'unknown');assert.equal(contact(s,'soyul').nameLevel,'unknown');assert.throws(()=>joinClub(s,id));
 }
});
test('overpromising can be declined and does not award membership or acquaintance',()=>{
 let s=application();s=answerClubInterview(s,'volunteer','showoff');s=answerClubInterview(s,'volunteer','overpromise');s.clock.minute+=30;s=settleClubAdmissions(s);
 assert.equal(s.clubApplications.volunteer.status,'declined');assert.throws(()=>joinClub(s,'volunteer'));assert.deepEqual(s.memberships,{});
});
