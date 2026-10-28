import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,newAfternoonScenario,save,restore,nextDay} from './simulation.js';
import {readCommunityPost} from './community.js';
import {beginCommunityActivity,progressCommunityActivity,currentCommunityActivity,communityActivityStage,pauseCommunityActivity,resumeCommunityActivity,activityAvailability,onsiteCommunityActivities,hearOnsiteActivity} from './community-activities.js';
import {preparePhysicalActivity} from './physical-activities.js';
import {physicalActivityScene} from './activity-scene.js';
import {advanceFreeTime,goHome} from './free-roam.js';
const begin=(id,seed=3)=>{const s=beginCommunityActivity(readCommunityPost(newAfternoonScenario(),id),id);preparePhysicalActivity(currentCommunityActivity(s),seed);return s;};
const step=(s,...actions)=>actions.reduce((s,id)=>progressCommunityActivity(s,id),s);
test('basketball has three real possessions with saved defense, results, stamina and one batched clock advance',()=>{
 let s=step(begin('basketball-open'),'footwork');assert.equal(s.clock.minute,790);const before=save(s),stage=communityActivityStage(s);assert.match(stage.prompt,/1\/3번째 공격/);
 assert.deepEqual(communityActivityStage(s),stage);assert.equal(save(s),before);
 s=step(s,'drive');assert.equal(s.clock.minute,790);assert.equal(currentCommunityActivity(s).step,1);assert.equal(currentCommunityActivity(s).actionState.stamina,2);
 s=restore(save(pauseCommunityActivity(s)));s=resumeCommunityActivity(s,'1:basketball-open');assert.equal(currentCommunityActivity(s).actionState.round,1);
 const restored=structuredClone(s);s=step(s,'pass','shoot');assert.deepEqual(currentCommunityActivity(s).actionState,currentCommunityActivity(step(restored,'pass','shoot')).actionState);
 assert.equal(s.clock.minute,820);assert.equal(currentCommunityActivity(s).actionState.plays.length,3);assert.equal(currentCommunityActivity(s).step,2);
 s=step(s,'retry');assert.equal(s.clock.minute,840);assert.equal(currentCommunityActivity(s).spent,60);assert.match(s.lastResult,/세 번의 공격/);assert.equal(s.freeDay.completed.filter(x=>x.id==='basketball').length,1);assert.throws(()=>progressCommunityActivity(s,'cool'));assert.throws(()=>beginCommunityActivity(s,'basketball-open'));
});
test('identical basketball actions can resolve differently across runs without rerolling on render',()=>{
 const scores=new Set();for(let seed=1;seed<50;seed++){
  let s=step(begin('basketball-open',seed),'passing','pass','pass','pass','cool');scores.add(currentCommunityActivity(s).actionState.scored);
  const snapshot=save(s);physicalActivityScene(currentCommunityActivity(s));assert.equal(save(s),snapshot);
 }assert.ok(scores.size>1);
});
test('cooking responds to tasted salt and preparation, records completion without inventory or cast rewards',()=>{
 let base=begin('cooking-open');currentCommunityActivity(base).actionState.salt='strong';
 let s=step(base,'even','gentle');assert.match(currentCommunityActivity(s).last.text,/고르게/);s=step(s,'dilute');assert.equal(currentCommunityActivity(s).actionState.balanced,true);assert.match(s.lastResult,/간을 조절/);assert.equal(s.clock.minute,825);
 let other=step(base,'even','quick','reduce');assert.equal(currentCommunityActivity(other).actionState.texture,'uneven');assert.equal(currentCommunityActivity(other).actionState.balanced,false);assert.notEqual(other.lastResult,s.lastResult);
 const noNames=Object.values(s.contacts).every(c=>!c.introduced);assert.ok(noNames);assert.deepEqual(s.inventory,[]);assert.deepEqual(s.memberships,{});assert.deepEqual(s.relations,base.relations);
});
test('carrying changes its observed obstacle response and final storage without imaginary loss or named helpers',()=>{
 const base=begin('carry-open');currentCommunityActivity(base).actionState.obstacle='chair';
 const cleared=step(base,'pair','clear','stack'),edge=step(base,'solo','edge','count');assert.equal(cleared.clock.minute,840);assert.equal(edge.clock.minute,840);
 assert.match(cleared.lastResult,/둘이 신호.*통로를 먼저/);assert.match(edge.lastResult,/한 상자씩.*2번.*전달 수량/);assert.deepEqual(edge.inventory,[]);assert.equal(edge.appointments.length,0);assert.equal(Object.values(edge.contacts).some(c=>c.introduced),false);
 assert.ok(cleared.known.includes('물품 운반 통로 확보'));assert.ok(!cleared.known.includes('물품 운반 벽면 동선'));
});
test('onsite discovery needs the exact room and does not pretend to read a phone post',()=>{
 let s=newAfternoonScenario();s.location='cafeteria';assert.deepEqual(onsiteCommunityActivities(s),[]);s.buildingArea={place:'cafeteria',id:'kitchen'};
 assert.equal(onsiteCommunityActivities(s)[0].id,'cooking-open');s=hearOnsiteActivity(s,'cooking-open');assert.equal(s.flow.postsRead?.['cooking-open'],undefined);assert.match(s.memory.at(-1),/직접 들었다/);
 s=beginCommunityActivity(s,'cooking-open');assert.equal(s.buildingArea.id,'kitchen');assert.throws(()=>hearOnsiteActivity({...s,buildingArea:{place:'cafeteria',id:'dining'}},'cooking-open'));
});
test('deadlines, class conflicts, real location and paused completion are enforced',()=>{
 let s=begin('cooking-open');s.location='gym';assert.throws(()=>progressCommunityActivity(s,'even'));
 s=step(begin('carry-open'),'pair');s=pauseCommunityActivity(s);assert.equal(s.freeDay.completed.length,0);s=advanceFreeTime(s,260);assert.equal(activityAvailability(s,'carry-open',s.activitySessions.records['1:carry-open']).ok,false);assert.throws(()=>resumeCommunityActivity(s,'1:carry-open'));
 let morning=newGame();assert.equal(activityAvailability(morning,'basketball-open').ok,true);morning.clock.minute=790;assert.equal(activityAvailability(morning,'basketball-open').ok,true);
 const late=newAfternoonScenario();late.clock.minute=1036;assert.equal(activityAvailability(late,'cooking-open').ok,false);
});
test('activities are optional on later days; yesterday partials stay closed and fresh records use the new day',()=>{
 let s=step(begin('basketball-open'),'passing','pass');s=pauseCommunityActivity(s);s=nextDay(goHome(s));assert.throws(()=>resumeCommunityActivity(s,'1:basketball-open'));
 s.clock.minute=780;assert.ok(activityAvailability(s,'basketball-open').ok);s=beginCommunityActivity(s,'basketball-open');assert.equal(currentCommunityActivity(s).key,'2:basketball-open');assert.equal(currentCommunityActivity(s).actionState.round,0);assert.equal(s.activitySessions.records['1:basketball-open'].actionState.round,1);
});
