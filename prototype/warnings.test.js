import test from 'node:test';
import assert from 'node:assert/strict';
import {newAfternoonScenario as newGame,act,nextDay,restore,save,acceptAppointment} from './simulation.js';
import {knownGame} from './fixtures.js';
import {warningPhase,beginWarningSite,finishWarningSite,discussWarnings} from './warnings.js';
import {readMessages,eventKey} from './event-view.js';
import {availableRoutes} from './days.js';
import {arrive} from './encounters.js';
const third=(s=newGame())=>nextDay(act(nextDay(act(s,'rehearsal')),'work'));

test('scheduled disruption exists independently but is not automatically player knowledge',()=>{
 const s=third();assert.equal(s.events.filter(e=>e.id==='campus-staff-delay').length,1);assert.equal(s.warnings.evidence.length,0);
 assert.ok(!availableRoutes(s).some(r=>r.id==='checkCampus'));
 assert.equal(warningPhase(s).events.length,s.events.length);
 const read=readMessages(s);assert.ok(read.known.includes('행사 지원 인력의 도착 지연'));assert.equal(read.warnings.evidence[0].kind,'notice');
 assert.equal(readMessages(read).warnings.evidence.length,read.warnings.evidence.length);
});
test('private reports require acquaintance, trust and respect for boundaries rather than affection alone',()=>{
 const unknown=third();assert.ok(!unknown.events.some(e=>e.id==='trusted-campus-message'));
 const highAff=newGame();highAff.relations['soyul>taei']={affection:50,familiarity:10,trust:0};assert.ok(!third(highAff).events.some(e=>e.id==='trusted-campus-message'));
 const close=third(knownGame('close'));assert.ok(close.events.some(e=>e.id==='trusted-campus-message'));assert.equal(close.warnings.evidence.length,0);
 const read=readMessages(close);assert.ok(read.warnings.evidence.some(e=>e.kind==='report'));assert.ok(read.warnings.evidence.some(e=>e.source.includes('차여경')));
});
test('situational clues follow actual locations and distinguish noticing from reading details',()=>{
 let s=third();assert.equal(beginWarningSite(s,'hall','street'),null);
 const observed=arrive(s,'cafe','street');assert.ok(observed.warning);assert.ok(observed.state.known.includes('정류장 앞에 정차한 구급차'));
 assert.ok(!observed.state.known.includes('정류장에서 목격한 응급 이송'));
 s=finishWarningSite(observed.state,observed.warning,false).state;assert.ok(!s.known.includes('정류장에서 목격한 응급 이송'));
 assert.equal(arrive(s,'cafe','street').warning,null);assert.throws(()=>finishWarningSite(s,observed.warning,true));
});
test('reading a physical notice adds sourced details and survives reload without duplicate rewards',()=>{
 const start=arrive(third(),'hall','sidegate');const checked=finishWarningSite(start.state,start.warning,true).state;
 assert.ok(checked.warnings.evidence.some(e=>e.source==='현장 안내문'));assert.ok(checked.known.includes('응급 차량 동선 확보 안내'));
 const loaded=restore(save(checked));assert.deepEqual(loaded,checked);assert.equal(arrive(loaded,'hall','sidegate').state.warnings.evidence.length,2);
});
test('choosing investigation consumes the afternoon, changes promise outcomes and grants only visited evidence',()=>{
 let s=nextDay(act(knownGame('friend'),'rehearsal'));s=acceptAppointment(s,'seoyeon');s=nextDay(act(s,'work'));s=readMessages(s);
 const checked=act(s,'checkCampus');assert.equal(checked.phase,'evening');assert.equal(checked.choice,'checkCampus');
 assert.equal(checked.appointments.find(a=>a.person==='seoyeon').status,'broken');
 assert.ok(checked.known.includes('도서관 지원 인력 공백 안내'));assert.ok(!checked.known.includes('정류장 앞에 정차한 구급차'));
 assert.match(checked.lastResult,/확인할 근거는 없었다/);assert.ok(checked.events.some(e=>e.id==='campus-showcase'));
});
test('ordinary activities still work and reveal only what participants could notice',()=>{
 const after=act(third(),'backstage');assert.ok(after.known.includes('행사 지원 인력의 도착 지연'));
 assert.ok(!after.known.includes('응급 차량 동선 확보 안내'));assert.ok(!after.known.includes('정류장 앞에 정차한 구급차'));
});
test('characters react to information the player actually has without awarding relation points',()=>{
 const s=readMessages(third(knownGame('friend'))),before=structuredClone(s.relations);
 const result=discussWarnings(s,'seoyeon');assert.match(result.result.playerLine,/교내 행사 안내/);assert.match(result.result.text,/확실한 것/);
 assert.deepEqual(result.state.relations,before);assert.throws(()=>discussWarnings(third(),'seoyeon'));
});
test('early days and later world stages do not receive the demo warning scenes',()=>{
 assert.equal(warningPhase(newGame()).events.length,0);assert.equal(beginWarningSite(newGame(),'hall','sidegate'),null);
 const later=third();later.world.stage='survival';assert.equal(beginWarningSite(later,'hall','sidegate'),null);
 const old=newGame();delete old.warnings;assert.equal(restore(save(old)).warnings.evidence.length,0);
});
