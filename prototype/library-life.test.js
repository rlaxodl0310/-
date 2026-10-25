import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {libraryActivity,libraryGreeting,libraryAtmosphere} from './library-life.js';
import {paceAction} from './campus-time.js';
import {arrive} from './encounters.js';
import {introduce} from './identity.js';
const atLibrary=()=>({...newGame(),location:'library'});
test('library tasks are voluntary short actions, three distinct actions share a time block',()=>{
 let s=atLibrary();
 for(const id of ['read','study','rest']){const before=s;const r=libraryActivity(s,id);s=paceAction(before,r.state,{action:'libraryActivity',value:id,from:'place',to:'place'}).state;}
 assert.equal(s.clock.minute,810);assert.equal(s.phase,'afternoon');assert.equal(s.libraryLife.history.length,3);assert.equal(s.choice,null);
});
test('repeated checking neither farms memory nor advances a short-action block',()=>{
 let s=atLibrary();for(let i=0;i<6;i++){const before=s;s=paceAction(before,libraryActivity(s,'read').state,{action:'libraryActivity',value:'read',from:'place',to:'place'}).state;}
 assert.equal(s.libraryLife.history.length,1);assert.equal(s.clock.minute,780);assert.equal(s.known.filter(k=>k==='도서관 문학 서가 위치').length,1);
 assert.deepEqual(s.relations,newGame().relations);
});
test('ongoing reading and study persist through saving and loading',()=>{
 let s=libraryActivity(atLibrary(),'read').state;s.clock.minute=810;s=restore(save(s));
 const r=libraryActivity(s,'read');assert.match(r.text,/책갈피/);assert.equal(r.state.libraryLife.history.length,2);
});
test('quiet activities require actual presence and stop at the late-hour boundary',()=>{
 assert.throws(()=>libraryActivity(newGame(),'read'));const s=atLibrary();s.clock.minute=1320;assert.throws(()=>libraryActivity(s,'study'));
});
test('library atmosphere observes real time and co-presence rather than inventing meetings',()=>{
 const s=atLibrary();assert.doesNotMatch(libraryAtmosphere(s),/차여경|박소율/);s.clock.minute=910;assert.match(libraryAtmosphere(s),/차여경.*박소율/);s.relations['yeogyeong>soyul']={tension:4};assert.doesNotMatch(libraryAtmosphere(s),/차여경/);
 s.phase='evening';assert.match(libraryAtmosphere({...s,clock:{minute:1140}}),/열람등/);
});
test('prior interaction and relationship change observable greeting without granting trust',()=>{
 const s=atLibrary();s.day=2;introduce(s,'soyul','test');s.encounters.old={day:1,person:'soyul',outcome:'engaged'};
 assert.match(libraryGreeting(s,'soyul'),/고개/);
 s.relations['soyul>taei']={familiarity:5,affection:4,trust:4,tension:0};assert.match(libraryGreeting(s,'soyul'),/빈 의자/);
 s.relations['soyul>taei'].tension=4;assert.match(libraryGreeting(s,'soyul'),/시선을 돌린다/);
 const encounter=arrive(s,'library').encounter;assert.match(encounter.text,/시선을 돌린다/);
 s.relations['soyul>taei'].tension=0;s.dialogue.facts.soyul={photo:'keep',speech:'casual'};
 assert.match(libraryGreeting(s,'soyul'),/안 지웠어\./);
 s.day=3;assert.match(libraryGreeting(s,'soyul'),/출력물/);assert.doesNotMatch(libraryGreeting(s,'soyul'),/안 지웠어/);
 s.encounters.old.outcome='passed';assert.equal(libraryGreeting(s,'soyul'),'');
});
