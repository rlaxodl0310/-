import test from 'node:test';
import assert from 'node:assert/strict';
import {activityScene,musicSceneState} from './activity-scene.js';
import {newAfternoonScenario,save,restore} from './simulation.js';
import {readCommunityPost} from './community.js';
import {beginCommunityActivity,progressCommunityActivity,currentCommunityActivity} from './community-activities.js';
test('performance uses the chosen instrument and real rehearsal, survives saving and cannot repeat',()=>{
 for(const role of ['vocal','bass','guitar'])for(const rehearsal of ['blend','mark']){
  let s=beginCommunityActivity(readCommunityPost(newAfternoonScenario(),'music-recruit'),'music-recruit');
  s=progressCommunityActivity(s,role);s=progressCommunityActivity(s,rehearsal);s=restore(save(s));s=progressCommunityActivity(s,'perform');
  const r=currentCommunityActivity(s);assert.equal(r.performance.role,role);assert.equal(r.performance.coordination,rehearsal==='blend'?'listening':'signal');assert.match(r.last.text,rehearsal==='blend'?/음량을 낮춘다/:/신호/);
  assert.equal(s.clock.minute,900);assert.equal(r.spent,120);assert.equal(r.status,'completed');assert.equal(s.memberships.music,undefined);assert.equal(s.appointments.length,0);assert.throws(()=>progressCommunityActivity(s,'perform'));
  assert.equal(musicSceneState(r).phase,'performance');assert.equal(musicSceneState(restore(save(s)).activitySessions.records[r.key]).role,role);
 }
});
test('scene rendering is pure, does not expose named major cast and follows setup, rehearsal and wrap',()=>{
 const r={step:0,choices:[]};assert.equal(musicSceneState(r).phase,'setup');const snapshot=JSON.stringify(r);assert.equal(activityScene(r),activityScene(r));assert.equal(JSON.stringify(r),snapshot);assert.doesNotMatch(activityScene(r),/차여경|한서연|박소율|선배/);
 assert.equal(musicSceneState({step:1,choices:[{id:'bass'}]}).phase,'practice');assert.equal(musicSceneState({step:2,choices:[{id:'guitar'}]}).phase,'together');assert.equal(musicSceneState({step:3,choices:[{id:'vocal'},{id:'mark'},{id:'gear'}]}).phase,'wrap');
});
