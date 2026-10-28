import test from 'node:test';
import assert from 'node:assert/strict';
import {newAfternoonScenario,restore,save} from './simulation.js';
import {readCommunityPost} from './community.js';
import {beginCommunityActivity,progressCommunityActivity,currentCommunityActivity,queueActivityMiniGame} from './community-activities.js';
import {createActivityMiniGame,startActivityMiniGame,tickActivityMiniGame,pauseActivityMiniGame,hitActivityMiniGame,skipActivityMiniGame,activityMiniPosition} from './activity-minigame.js';
const prepared=id=>{let s=beginCommunityActivity(readCommunityPost(newAfternoonScenario(),id),id);return progressCommunityActivity(s,id==='basketball-open'?'passing':id==='cooking-open'?'even':'pair');};
function play(mini,good=true){
 mini=startActivityMiniGame(mini);
 while(mini.phase==='running'){
  const elapsed=good?mini.targets[mini.hits.length]*900:880;
  mini=tickActivityMiniGame(mini,elapsed);mini=hitActivityMiniGame(mini);
 }
 return mini;
}
test('a started input game earns nothing until explicit confirmation and consumes the original batched time',()=>{
 let s=prepared('basketball-open');const before=structuredClone(s);s=queueActivityMiniGame(s,'shoot');
 assert.equal(s.clock.minute,before.clock.minute);assert.deepEqual(s.known,before.known);assert.equal(currentCommunityActivity(s).actionState.round,0);assert.throws(()=>progressCommunityActivity(s,'shoot'));assert.throws(()=>queueActivityMiniGame(s,'pass'));
 currentCommunityActivity(s).mini=play(currentCommunityActivity(s).mini);assert.equal(currentCommunityActivity(s).actionState.round,0);
 s=progressCommunityActivity(s,'shoot');const r=currentCommunityActivity(s);assert.equal(r.actionState.round,1);assert.equal(r.actionState.plays[0].success,true);assert.equal(r.actionState.plays[0].timing,100);assert.equal(r.mini,undefined);assert.equal(r.miniGames.length,1);assert.equal(s.clock.minute,790);
});
test('real precision changes basketball outcome instead of being decorative',()=>{
 const base=prepared('basketball-open');
 const run=good=>{let s=queueActivityMiniGame(base,'shoot');currentCommunityActivity(s).mini=play(currentCommunityActivity(s).mini,good);return progressCommunityActivity(s,'shoot');};
 assert.equal(currentCommunityActivity(run(true)).actionState.plays[0].success,true);assert.equal(currentCommunityActivity(run(false)).actionState.plays[0].success,false);
});
test('cooking and carrying use all three input scores and preserve their advertised activity duration',()=>{
 for(const id of ['cooking-open','carry-open']){
  const choice=id==='cooking-open'?'gentle':'edge',base=prepared(id);
  const run=good=>{let s=queueActivityMiniGame(base,choice);currentCommunityActivity(s).mini=play(currentCommunityActivity(s).mini,good);return progressCommunityActivity(s,choice);};
  const good=run(true),bad=run(false);assert.equal(currentCommunityActivity(good).miniGames[0].hits.length,3);
  if(id==='cooking-open'){assert.equal(currentCommunityActivity(good).actionState.texture,'soft');assert.equal(currentCommunityActivity(bad).actionState.texture,'uneven');assert.equal(good.clock.minute,815);}
  else {assert.equal(currentCommunityActivity(good).actionState.balance,100);assert.equal(currentCommunityActivity(bad).actionState.stops,currentCommunityActivity(good).actionState.stops+1);assert.equal(good.clock.minute,825);}
 }
});
test('paused save restores progress and marker, no wall time, automatic restart or reroll',()=>{
 let s=queueActivityMiniGame(prepared('cooking-open'),'gentle'),m=startActivityMiniGame(currentCommunityActivity(s).mini);m=tickActivityMiniGame(m,m.targets[0]*900);m=hitActivityMiniGame(m);m=tickActivityMiniGame(m,350);currentCommunityActivity(s).mini=m;
 const loaded=restore(save(s)),saved=currentCommunityActivity(loaded).mini;assert.equal(saved.phase,'paused');assert.equal(saved.hits.length,1);assert.equal(activityMiniPosition(saved),activityMiniPosition(m));assert.deepEqual(tickActivityMiniGame(saved,60000),saved);
 const resumed=startActivityMiniGame(saved);assert.equal(resumed.elapsed,m.elapsed);assert.deepEqual(resumed.targets,m.targets);
});
test('early, repeated and post-result hits cannot complete extra inputs; ticks and view functions are pure',()=>{
 const record=currentCommunityActivity(prepared('carry-open'));let m=createActivityMiniGame(record,'clear');const snapshot=structuredClone(m);assert.deepEqual(hitActivityMiniGame(m),m);activityMiniPosition(m);assert.deepEqual(m,snapshot);
 m=startActivityMiniGame(m);m=hitActivityMiniGame(tickActivityMiniGame(m,450));assert.equal(m.hits.length,1);assert.deepEqual(hitActivityMiniGame(m),m);assert.deepEqual(tickActivityMiniGame(m,-1),m);assert.equal(pauseActivityMiniGame(m).phase,'paused');m=play({...m,phase:'paused'});assert.equal(m.hits.length,3);assert.deepEqual(hitActivityMiniGame(m),m);
});
test('non-timing assistance records its mode and uses existing outcome rules without fake precision',()=>{
 let s=queueActivityMiniGame(prepared('basketball-open'),'pass');currentCommunityActivity(s).mini=skipActivityMiniGame(currentCommunityActivity(s).mini);s=progressCommunityActivity(s,'pass');const r=currentCommunityActivity(s);assert.equal(r.miniGames[0].result.mode,'assisted');assert.equal(r.miniGames[0].result.score,null);assert.equal(r.actionState.plays[0].timing,undefined);assert.equal(r.actionState.round,1);
});
test('result cannot be applied to another choice or after leaving its room',()=>{
 let s=queueActivityMiniGame(prepared('carry-open'),'clear');currentCommunityActivity(s).mini=play(currentCommunityActivity(s).mini);assert.throws(()=>progressCommunityActivity(s,'edge'));s.location='gym';assert.throws(()=>progressCommunityActivity(s,'clear'));
});
