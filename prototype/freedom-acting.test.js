import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {campusScene} from './scene-flow.js';
import {arrive} from './encounters.js';
import {outdoorActivity,outdoorActivities} from './outdoor-life.js';
import {characterActing} from './character-acting.js';
import {readCommunityPost} from './community.js';
import {beginCommunityActivity,progressCommunityActivity} from './community-activities.js';
import {advanceFreeTime} from './free-roam.js';
import {timetable} from './timetable.js';
test('morning campus offers class and outdoors together; skipping records absence without redirecting',()=>{
 let s=newGame();const options=campusScene(s).choices;assert.ok(options.some(c=>c.action==='classTravel'));assert.ok(options.some(c=>c.value==='field'));assert.ok(options.some(c=>c.value==='outdoorCourt'));
 s=arrive(s,'field').state;assert.ok(outdoorActivities(s).some(a=>a.id==='jog'));for(let i=0;i<4;i++)s=outdoorActivity(s,'jog').state;assert.equal(s.location,'field');assert.equal(s.clock.minute,660);assert.equal(s.academics.records[timetable(s)[0].key].status,'absent');assert.equal(restore(save(s)).outdoorLife.length,4);
});
test('physical public activity is allowed across class time and does not award class attendance',()=>{
 let s=newGame();s.clock.minute=570;s=beginCommunityActivity(readCommunityPost(s,'cooking-open'),'cooking-open');for(const c of ['even','gentle','serve'])s=progressCommunityActivity(s,c);assert.equal(s.clock.minute,615);assert.equal(s.location,'cafeteria');s=advanceFreeTime(s,45);assert.equal(s.academics.records[timetable(s)[0].key].status,'absent');
});
test('acting uses spoken context and mood without changing identity or re-sampling the world',()=>{
 const s=newGame();s.clock.minute=780;const snapshot=save(s);for(const id of ['taei','seoyeon','yeogyeong','soyul']){assert.equal(characterActing(s,id,{text:'고마워요. 반가워요.'}).row,0);assert.equal(characterActing(s,id,{text:'미안해요. 걱정돼요.'}).row,1);assert.equal(characterActing(s,id,{text:'지금은 곤란해요.'}).row,2);}assert.equal(save(s),snapshot);
});
