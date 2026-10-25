import test from 'node:test';
import assert from 'node:assert/strict';
import {newAfternoonScenario as newGame,act,nextDay,save,restore,acceptAppointment,cancelAppointment} from './simulation.js';
import {knownGame} from './fixtures.js';
import {evolveRisk,tellRiskEvidence,riskAssessment,escortOpinion,requestEscort,rememberRisk} from './risk-decisions.js';
import {arrive} from './encounters.js';
import {finishWarningSite} from './warnings.js';
import {presentPeople} from './days.js';
const third=(s=knownGame('friend'))=>nextDay(act(nextDay(act(s,'rehearsal')),'work'));
function reportGate(s,id){const started=arrive(s,'hall','sidegate');s=started.warning?finishWarningSite(started.state,started.warning,true).state:started.state;return tellRiskEvidence(s,id,s.warnings.evidence.find(e=>e.id==='sidegate-detail').key);}

test('NPCs know their own observations, not the whole player evidence list',()=>{
 let s=third();const street=arrive(s,'cafe','street');s=evolveRisk(street.state);
 assert.ok(s.risk.knowledge.soyul.some(f=>f.kind==='direct'&&f.topic==='ambulance'));
 assert.ok(!s.risk.knowledge.yeogyeong.some(f=>f.topic==='ambulance'));
 assert.ok(s.risk.knowledge.seoyeon.some(f=>f.source==='soyul'&&f.kind==='report'));
 assert.ok(!s.known.includes('서연의 위험 판단'));
});
test('source trust and evidence provenance change interpretation; duplicates cannot inflate it',()=>{
 let s=third();s=reportGate(s,'seoyeon');const trusted=riskAssessment(s,'seoyeon').score;
 s.relations['seoyeon>taei'].trust=0;assert.ok(riskAssessment(s,'seoyeon').score<trusted);
 const before=riskAssessment(s,'seoyeon').score;rememberRisk(s,'seoyeon',{topic:'gate',kind:'report',source:'someone-else',originKind:'direct'});
 assert.equal(riskAssessment(s,'seoyeon').score,before);
});
test('high affection cannot override personal duties, a promise, or lack of trust',()=>{
 let s=reportGate(third(knownGame('close')),'yeogyeong');assert.equal(escortOpinion(s,'yeogyeong').willing,false);
 assert.match(escortOpinion(s,'yeogyeong').reason,/물품과 참석 인원|물품과|물품/);
 s=reportGate(s,'soyul');assert.equal(escortOpinion(s,'soyul').willing,false);assert.match(escortOpinion(s,'soyul').reason,/설명/);
 s.relations['seoyeon>taei'].affection=80;s.relations['seoyeon>taei'].trust=0;assert.equal(escortOpinion(s,'seoyeon').willing,false);
});
test('accepted duties prevent an escort; advance cancellation permits a new decision',()=>{
 let s=nextDay(act(knownGame('friend'),'rehearsal'));s=acceptAppointment(s,'seoyeon');s=nextDay(act(s,'work'));s=reportGate(s,'seoyeon');s=evolveRisk(s);
 assert.equal(escortOpinion(s,'seoyeon').willing,false);assert.match(escortOpinion(s,'seoyeon').reason,/약속/);
 s=cancelAppointment(s,'seoyeon');assert.equal(escortOpinion(evolveRisk(s),'seoyeon').willing,true);
});
test('independent contact and offer happen once, without granting knowledge to the player',()=>{
 let s=evolveRisk(reportGate(third(),'seoyeon'));const count=s.messages.length;
 assert.ok(s.appointments.some(a=>a.id==='risk-escort:seoyeon'&&a.status==='offered'));
 assert.equal(evolveRisk(s).messages.length,count);assert.deepEqual(evolveRisk(s).known,s.known);
 assert.deepEqual(restore(save(s)),s);
});
test('NPC movement waits until conversation ends and actual location controls encounters',()=>{
 let s=reportGate(third(),'soyul');s.eventState.flags.captionReviewed=true;
 s=evolveRisk(s,{allowMove:false});assert.ok(presentPeople(s,'library').includes('soyul'));
 s=evolveRisk(s,{allowMove:true});assert.ok(presentPeople(s,'hall').includes('soyul'));assert.ok(!presentPeople(s,'library').includes('soyul'));
 const encounter=arrive(s,'hall','window');assert.equal(encounter.encounter.person,'soyul');assert.match(encounter.encounter.text,/옮겨온/);
});
test('an accepted escort really joins the chosen activity and gains only visited evidence',()=>{
 let s=evolveRisk(reportGate(third(),'seoyeon'));s=requestEscort(s,'seoyeon').state;
 assert.equal(s.appointments.find(a=>a.id==='risk-escort:seoyeon').status,'pending');
 const after=act(s,'checkCampus');assert.equal(after.appointments.find(a=>a.id==='risk-escort:seoyeon').status,'kept');
 assert.match(after.lastResult,/한서연과 함께/);assert.ok(after.risk.knowledge.seoyeon.some(f=>f.kind==='direct'&&f.topic==='library'));
 assert.ok(!after.risk.knowledge.seoyeon.some(f=>f.kind==='direct'&&f.topic==='ambulance'));
});
test('early days and old saves do not invent extra risk knowledge or forced membership',()=>{
 assert.equal(Object.keys(evolveRisk(newGame()).risk.knowledge).length,0);
 const old=newGame();delete old.risk;const loaded=restore(save(old));assert.deepEqual(loaded.risk.knowledge,{});assert.deepEqual(loaded.memberships,{});
});

test('unacquainted NPCs still check their own tasks and contacts without messaging or recruiting the player',()=>{
 const before=third(newGame()),after=evolveRisk(before,{allowMove:true});
 assert.ok(after.risk.actions.some(a=>a.actor==='yeogyeong'&&a.kind==='coordinate'));
 assert.ok(after.risk.actions.some(a=>a.kind==='private-check-in'));
 assert.equal(after.messages.length,before.messages.length);assert.ok(!after.appointments.some(a=>a.id?.startsWith('risk-escort:')));
 assert.equal(evolveRisk(after).risk.actions.length,after.risk.actions.length);
});
