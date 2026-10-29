import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,restore,save} from './simulation.js';
import {advanceFreeTime} from './free-roam.js';
import {readCommunityPost} from './community.js';
import {beginCommunityActivity,progressCommunityActivity,currentCommunityActivity,communityActivityStage,pauseCommunityActivity,activityAvailability,resumeCommunityActivity} from './community-activities.js';
import {supplyPeople,supplyIntro,supplyReport,canAskSupplyReport,supplyConversationMemory} from './supply-story.js';
import {currentSchedule} from './days.js';
const roster=['yeogyeong','seoyeon','soyul'];
function ready(){let s=newGame();s.clock.minute=780;s=advanceFreeTime(s,0);s.supplyStory.issue='count';for(const id of roster)s.supplyStory.plan[id]={attending:true,join:780,leave:960,role:'labels'};return s;}
const begin=s=>beginCommunityActivity(readCommunityPost(s,'volunteer-recruit'),'volunteer-recruit');
const act=(s,...choices)=>choices.reduce((s,c)=>progressCommunityActivity(s,c),s);
test('attendees follow their own arrival/departure windows and only actual exchanges unlock names',()=>{
 let s=ready();s.supplyStory.plan.seoyeon.leave=840;s.supplyStory.plan.soyul.join=810;s.supplyStory.plan.soyul.leave=900;s=begin(s);
 assert.deepEqual(supplyPeople(s),['yeogyeong','seoyeon']);assert.equal(Object.values(s.contacts).some(c=>c.introduced),false);assert.doesNotMatch(supplyIntro(s),/차여경|한서연|박소율/);
 s=act(s,'roles');assert.ok(s.contacts.yeogyeong.introduced);assert.ok(s.contacts.seoyeon.introduced);assert.equal(s.contacts.soyul?.introduced??false,false);assert.deepEqual(supplyPeople(s),roster);
 s=act(s,'askHelp');assert.ok(s.contacts.soyul.introduced);assert.deepEqual(supplyPeople(s),['yeogyeong']);assert.equal(s.supplyStory.witnesses.soyul.some(w=>w.step===0),false);assert.equal(currentSchedule(s).seoyeon==='hall'&&s.clock.minute<840,false);
});
test('same team can share responsibility or complete more work while concentrating burden',()=>{
 const base=ready(),shared=act(begin(base),'roles','labels','handover'),solo=act(begin(base),'sort','carry','selfFinish');
 assert.equal(shared.supplyStory.outcome,'shared');assert.equal(solo.supplyStory.outcome,'solo-burden');assert.ok(solo.supplyStory.work>shared.supplyStory.work);assert.ok(solo.supplyStory.burden>shared.supplyStory.burden);
 assert.equal(shared.clock.minute,960);assert.equal(shared.freeDay.completed.filter(x=>x.id==='volunteer').length,1);assert.equal(shared.relations['yeogyeong>soyul'].trust,1);assert.equal(solo.relations['yeogyeong>soyul'].trust,0);
 assert.equal(shared.known.includes('물품 수량 불일치 사건'),false);assert.equal(shared.events.filter(e=>e.id==='supplies').length,1);
});
test('affection does not override another participant having only thirty minutes left',()=>{
 let s=ready();for(const id of roster)s.supplyStory.plan[id].attending=id==='seoyeon';s.supplyStory.plan.seoyeon.leave=840;s.relations['seoyeon>taei']={affection:100,trust:100,familiarity:100,tension:0};s=act(begin(s),'roles','askHelp');assert.equal(s.supplyStory.helpDeclined,true);assert.match(currentCommunityActivity(s).last.text,/더 맡기 어렵/);
});
test('unselected event progresses privately and peers change relationships without introducing themselves to player',()=>{
 let s=ready();s.location='cafe';const before=structuredClone(s.relations);s=advanceFreeTime(s,180);assert.equal(s.supplyStory.status,'resolved');assert.equal(s.supplyStory.playerFinished,false);assert.equal(s.freeDay.completed.length,0);assert.equal(s.events.find(e=>e.id==='supplies').participants.includes('taei'),false);assert.equal(s.eventState.knowledge['campus:1:supplies'],undefined);assert.equal(Object.keys(s.contacts).length,0);assert.notDeepEqual(s.relations,before);assert.equal(s.memory.some(t=>t.includes(s.supplyStory.result)),false);
 const again=advanceFreeTime(s,120);assert.deepEqual(again.relations,s.relations);assert.equal(again.events.filter(e=>e.id==='supplies').length,1);
});
test('commitments and school location win over an invitation and do not count as fictional attendance',()=>{
 let s=ready();s.supplyStory.plan.seoyeon.leave=840;s.appointments=[{id:'own',kind:'meeting',person:'seoyeon',status:'pending',day:1,minute:810,location:'cafe'}];assert.ok(!supplyPeople(s).includes('seoyeon'));assert.equal(currentSchedule(s).seoyeon,'cafe');s=advanceFreeTime(s,180);assert.ok(!s.supplyStory.actualParticipants.includes('seoyeon'));
});
test('saving preserves issue, plans, witnesses and branch; views never reroll',()=>{
 let s=act(begin(ready()),'roles');const snapshot=save(s);communityActivityStage(s);supplyIntro(s);assert.equal(save(s),snapshot);const loaded=restore(snapshot);assert.deepEqual(loaded.supplyStory,s.supplyStory);const a=act(s,'labels','handover'),b=act(loaded,'labels','handover');assert.deepEqual(a.supplyStory,b.supplyStory);assert.deepEqual(a.relations,b.relations);
});
test('leaving early keeps partial contribution and others finish; personal memories remain limited to witnesses',()=>{
 let s=ready();s.supplyStory.plan.soyul.join=900;s=act(begin(s),'sort');s=pauseCommunityActivity(s);s.location='arts';assert.equal(s.freeDay.completed.length,0);assert.equal(supplyConversationMemory(s,'soyul'),null);assert.ok(supplyConversationMemory(s,'yeogyeong'));s=advanceFreeTime(s,150);assert.equal(s.supplyStory.status,'resolved');assert.equal(s.supplyStory.playerFinished,false);assert.equal(activityAvailability(s,'volunteer-recruit',s.activitySessions.records['1:volunteer-recruit']).ok,false);assert.throws(()=>resumeCommunityActivity(s,'1:volunteer-recruit'));
});
test('report needs a real known participant and reveals only the part they witnessed',()=>{
 let s=ready();s.supplyStory.plan.seoyeon.leave=840;s=act(begin(s),'roles');s=pauseCommunityActivity(s);s.location='arts';s=advanceFreeTime(s,150);assert.equal(canAskSupplyReport(s,'seoyeon'),true);assert.throws(()=>supplyReport(s,'seoyeon'));
 s.location=s.npcs.seoyeon.location;const r=supplyReport(s,'seoyeon');assert.match(r.text,/중간에 나왔|그 뒤/);assert.equal(r.state.supplyStory.reports.seoyeon.scope,'partial');assert.equal(r.state.eventState.knowledge['campus:1:supplies'],undefined);assert.throws(()=>supplyReport(r.state,'seoyeon'));
});
test('late participation uses remaining actual event time rather than replaying a fresh three hours',()=>{
 let s=ready();s=advanceFreeTime(s,120);s=begin(s);assert.equal(currentCommunityActivity(s).duration,60);s=act(s,'audit','labels','handover');assert.equal(s.clock.minute,960);assert.equal(currentCommunityActivity(s).spent,60);
});
test('NPC-only outcomes reflect peer strain, available hands and independent coordination',()=>{
 let strained=ready();strained.relations['yeogyeong>soyul']={familiarity:1,trust:0,tension:6,affection:0};strained=advanceFreeTime(strained,180);assert.equal(strained.supplyStory.outcome,'separate');assert.equal(strained.relations['yeogyeong>soyul'].tension,7);
 let scarce=ready();for(const id of roster)scarce.supplyStory.plan[id].attending=id==='yeogyeong';scarce.supplyStory.plan.yeogyeong.leave=840;scarce=advanceFreeTime(scarce,180);assert.equal(scarce.supplyStory.outcome,'limited');
 let coordinated=ready();coordinated.supplyStory.plan.yeogyeong.role='check';coordinated=advanceFreeTime(coordinated,180);assert.equal(coordinated.supplyStory.outcome,'shared');assert.equal(coordinated.supplyStory.playerFinished,false);
});
