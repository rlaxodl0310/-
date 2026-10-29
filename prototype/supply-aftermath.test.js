import {placeContinuations} from './scene-flow.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,nextDay,restore,save} from './simulation.js';
import {advanceFreeTime,goHome} from './free-roam.js';
import {readCommunityPost} from './community.js';
import {beginCommunityActivity,progressCommunityActivity} from './community-activities.js';
import {replyOffer,meetAppointments} from './appointments.js';
import {currentSchedule} from './days.js';
import {beginSupplyAftermath,progressSupplyAftermath,activeSupplyAftermath,supplyAftermathScene,pauseSupplyAftermath,supplyAftermathMemory,aftermathObservation} from './supply-aftermath.js';
import {dialogueServiceContext} from './dialogue-service.js';
function yesterday(choices=['roles','labels','handover']){
 let s=newGame();s.clock.minute=780;s=advanceFreeTime(s,0);s.location='hall';for(const id of Object.keys(s.npcs))s.supplyStory.plan[id]={attending:true,join:780,leave:960,role:'labels'};
 s=beginCommunityActivity(readCommunityPost(s,'volunteer-recruit'),'volunteer-recruit');for(const c of choices)s=progressCommunityActivity(s,c);return s;
}
function tomorrow(choices){return nextDay(goHome(yesterday(choices)));}
function meet(s){const offer=s.appointments.find(a=>a.kind==='supply-followup');s=replyOffer(s,offer.id,true);s=advanceFreeTime(s,810-s.clock.minute);s.location=offer.location;return {s,id:offer.person,offer};}
function step(s,choice){const minutes=progressSupplyAftermath(s,choice);return advanceFreeTime(s,minutes);}
test('next-day proposal depends on firsthand work and appears only once, without an automatic promise',()=>{
 const s=tomorrow(),offers=s.appointments.filter(a=>a.kind==='supply-followup');assert.equal(offers.length,1);assert.equal(offers[0].status,'offered');assert.equal(offers[0].minute,810);assert.equal(s.supplyAftermath.reactions[offers[0].person].mode,'work');assert.match(offers[0].text,/가능한 시간/);assert.deepEqual(restore(save(s)).appointments,s.appointments);
 const rest=tomorrow(['sort','carry','selfFinish']);assert.equal(rest.appointments.find(a=>a.kind==='supply-followup').location,'cafe');assert.equal(rest.supplyAftermath.reactions.yeogyeong.mode,'rest');
});
test('arrival and speaking do not fulfill the short activity; two real actions and twenty minutes do',()=>{
 let {s,id,offer}=meet(tomorrow());s=meetAppointments(s,id);assert.equal(s.appointments.find(a=>a.id===offer.id).status,'pending');const r=beginSupplyAftermath(s,id);assert.equal(r.ok,true);s=r.state;
 s=step(s,'listen');assert.equal(s.clock.minute,820);assert.equal(s.appointments.find(a=>a.id===offer.id).status,'pending');s=step(s,'share');assert.equal(s.clock.minute,830);assert.equal(s.appointments.find(a=>a.id===offer.id).status,'kept');assert.equal(activeSupplyAftermath(s).spent,20);assert.equal(s.supplyAftermath.completed[id].outcome,'shared');assert.throws(()=>progressSupplyAftermath(s,'share'));assert.throws(()=>beginSupplyAftermath(s,id));
});
test('fast solo work gains practical trust while leaving tension; rest can stay pleasant without work trust',()=>{
 const ready=meet(tomorrow()),start=beginSupplyAftermath(ready.s,ready.id).state;let shared=step(step(structuredClone(start),'listen'),'share'),fast=step(step(structuredClone(start),'takeover'),'fast');
 assert.equal(fast.supplyAftermath.completed[ready.id].outcome,'efficient-distance');assert.ok(fast.relations[ready.id+'>taei'].tension>shared.relations[ready.id+'>taei'].tension);assert.ok(fast.relations[ready.id+'>taei'].trust>start.relations[ready.id+'>taei'].trust);
 let rest=meet(tomorrow(['sort','carry','selfFinish']));let s=beginSupplyAftermath(rest.s,rest.id).state,trust=s.relations[rest.id+'>taei'].trust;s=step(step(s,'light'),'keep');assert.equal(s.relations[rest.id+'>taei'].trust,trust);assert.equal(s.supplyAftermath.completed[rest.id].outcome,'easy-company');
});
test('a tense relationship can attempt a concrete repair without erasing all its history',()=>{
 let s=yesterday();s.relations['yeogyeong>taei'].tension=5;s=nextDay(goHome(s));assert.equal(s.appointments.some(a=>a.kind==='supply-followup'&&a.person==='yeogyeong'),false);s=advanceFreeTime(s,270);s.location=s.npcs.yeogyeong.location;const start=beginSupplyAftermath(s,'yeogyeong');assert.equal(start.ok,true);s=step(step(start.state,'own'),'boundary');assert.equal(s.relations['yeogyeong>taei'].tension,3);assert.equal(s.supplyAftermath.completed.yeogyeong.outcome,'shared');
});
test('high affection never overrides class preparation, lack of time or boundaries',()=>{
 let s=tomorrow();assert.equal(placeContinuations(s,'library').some(c=>c.value==='review'),false);s.location=s.npcs.yeogyeong.location;s.relations['yeogyeong>taei'].affection=100;assert.equal(beginSupplyAftermath(s,'yeogyeong').ok,false);
 s=advanceFreeTime(s,270);s.location=s.npcs.yeogyeong.location;s.relations['yeogyeong>taei'].tension=6;assert.equal(beginSupplyAftermath(s,'yeogyeong').ok,false);
});
test('NPC peers spend time together privately even if the player never joined the earlier event',()=>{
 let s=newGame();s.clock.minute=780;s=advanceFreeTime(s,0);for(const id of Object.keys(s.npcs))s.supplyStory.plan[id]={attending:true,join:780,leave:960,role:'labels'};s.location='arts';s=advanceFreeTime(s,180);s=nextDay(goHome(s));assert.equal(Object.keys(s.supplyAftermath.reactions).length,0);assert.equal(s.appointments.filter(a=>a.kind==='supply-followup').length,0);assert.equal(Object.keys(s.contacts).length,0);
 const pair=s.supplyAftermath.peer;assert.equal(pair.mode,'together');const before=s.relations[pair.people[0]+'>'+pair.people[1]].trust;s=advanceFreeTime(s,300);assert.equal(s.relations[pair.people[0]+'>'+pair.people[1]].trust,before+1);assert.equal(s.supplyAftermath.peer.sharedMinutes,50);assert.equal(s.memory.some(t=>t.includes('같은 자료를')),false);
});
test('peer distance can change positions without prematurely healing the disagreement',()=>{
 let s=yesterday();s.relations['yeogyeong>soyul'].tension=5;s=nextDay(goHome(s));s=advanceFreeTime(s,260);const pair=s.supplyAftermath.peer;assert.equal(pair.mode,'distance');const plan=currentSchedule(s);assert.notEqual(plan[pair.people[0]],plan[pair.people[1]]);assert.equal(aftermathObservation(s,'library'),'');assert.equal(s.relations['yeogyeong>soyul'].tension,5);
});
test('an accepted but missed proposal is penalized once; an unaccepted or declined one is not',()=>{
 let s=tomorrow(),offer=s.appointments.find(a=>a.kind==='supply-followup'),before=s.relations[offer.person+'>taei'].trust;
 const declined=advanceFreeTime(replyOffer(s,offer.id,false),340);assert.equal(declined.relations[offer.person+'>taei'].trust,before);
 s=advanceFreeTime(replyOffer(s,offer.id,true),320);assert.equal(s.appointments.find(a=>a.id===offer.id).status,'broken');assert.equal(s.relations[offer.person+'>taei'].trust,before-1);const again=advanceFreeTime(s,30);assert.equal(again.relations[offer.person+'>taei'].trust,s.relations[offer.person+'>taei'].trust);
});
test('save/menu reads preserve partial decisions and finishing does not duplicate effects',()=>{
 let {s,id}=meet(tomorrow());s=beginSupplyAftermath(s,id).state;s=step(s,'listen');const snapshot=save(s);supplyAftermathScene(s);assert.equal(save(s),snapshot);const a=step(s,'share'),b=step(restore(snapshot),'share');assert.deepEqual(a.supplyAftermath,b.supplyAftermath);assert.deepEqual(a.relations,b.relations);
});
test('incomplete participation releases the NPC and keeps limited memories; model context includes only its own completed encounter',()=>{
 let {s,id}=meet(tomorrow());s=beginSupplyAftermath(s,id).state;s=step(s,'listen');pauseSupplyAftermath(s);assert.equal(supplyAftermathMemory(s,id),null);assert.equal(s.appointments.find(a=>a.kind==='supply-followup').status,'pending');
 s=beginSupplyAftermath(s,id).state;s=step(s,'share');const result={plan:{intent:'respond',topicName:'일상',detail:'메모'},text:'안녕하세요.'};assert.ok(dialogueServiceContext(s,id,result).known.supplyFollowup);assert.equal(dialogueServiceContext(s,id==='yeogyeong'?'soyul':'yeogyeong',result).known.supplyFollowup,null);
});
test('time spent on a player encounter cannot also be counted as private peer companionship',()=>{
 let s=yesterday();s.relations['yeogyeong>taei'].trust=0;s=nextDay(goHome(s));const offer=s.appointments.find(a=>a.kind==='supply-followup');assert.equal(offer.person,'seoyeon');s=replyOffer(s,offer.id,true);s=advanceFreeTime(s,270);s.location=offer.location;s=beginSupplyAftermath(s,offer.person).state;s=step(step(s,'listen'),'share');s=advanceFreeTime(s,10);assert.equal(s.supplyAftermath.peer.sharedMinutes,30);
});
test('an older second-day save gets reactions once and materializes the same authoritative NPC positions',()=>{
 const old=tomorrow();delete old.supplyAftermath;old.appointments=old.appointments.filter(a=>a.kind!=='supply-followup');old.messages=[];const loaded=restore(save(old));assert.ok(loaded.supplyAftermath);assert.equal(loaded.appointments.filter(a=>a.kind==='supply-followup').length,1);assert.deepEqual(restore(save(loaded)),loaded);for(const [id,place] of Object.entries(currentSchedule(loaded)))assert.equal(loaded.npcs[id].location,place);
});
test('a missed promise can be addressed in a later real encounter while its historical status stays broken',()=>{
 let s=tomorrow(),offer=s.appointments.find(a=>a.kind==='supply-followup');s=advanceFreeTime(replyOffer(s,offer.id,true),330);assert.equal(s.appointments.find(a=>a.id===offer.id).status,'broken');s.location=s.npcs[offer.person].location;const start=beginSupplyAftermath(s,offer.person);assert.equal(start.ok,true);assert.equal(activeSupplyAftermath(start.state).kind,'repair');s=step(step(start.state,'own'),'boundary');const a=s.appointments.find(a=>a.id===offer.id);assert.equal(a.status,'broken');assert.equal(a.repairedAt.day,2);
});
