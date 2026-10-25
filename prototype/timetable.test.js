import {paceAction} from './campus-time.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,newAfternoonScenario,nextDay,save,restore} from './simulation.js';
import {characterTimetables,timetable,nextLesson,classConflicts,lessonStatus,classPlace} from './timetable.js';
import {attendLesson} from './classes.js';
import {advanceFreeTime,freeActivity,goHome} from './free-roam.js';
import {currentSchedule,presentPeople} from './days.js';
import {campusScene} from './scene-flow.js';
import {arrive} from './encounters.js';
import {campusBuildings} from './campus-buildings.js';
const room=(s,c)=>({...s,location:c.location,buildingArea:{place:c.location,id:c.area}});
function morning(s){for(const c of timetable(s))s=attendLesson(room(s,c),c.key,c.choices[0].id).state;return s;}
test('new game begins with an imminent real class and free exploration follows actual attendance',()=>{
 let s=newGame();assert.equal(s.clock.minute,540);assert.equal(nextLesson(s).name,'보컬 앙상블');assert.match(campusScene(s).text,/곧 수업/);assert.equal(campusScene(s).choices[0].action,'classTravel');
 s=morning(s);assert.equal(s.clock.minute,780);assert.equal(nextLesson(s),null);assert.match(campusScene(s).text,/공강/);assert.equal(Object.values(s.academics.records).filter(r=>r.status==='present').length,2);
});
test('every character has non-overlapping courses in valid building interiors',()=>{
 for(const id of Object.keys(characterTimetables))for(let day=1;day<=3;day++){
  const rows=timetable({...newGame(),day},id);assert.equal(rows.length,2);
  for(let i=0;i<rows.length;i++){const c=rows[i];assert.ok(campusBuildings[c.location].areas.some(a=>a.id===c.area));assert.ok(c.start<c.end);if(i)assert.ok(rows[i-1].end<=c.start);}
 }
 const s=newGame();assert.equal(timetable(s,'yeogyeong')[0].location,'creative');assert.equal(timetable(s,'soyul')[0].location,'sculpture');assert.equal(timetable(s,'seoyeon')[0].location,'sculpture');
});
test('NPCs prepare for and attend their own classes, with no phantom off-campus conversation',()=>{
 let s=newGame();assert.equal(currentSchedule(s).yeogyeong,'creative');s=advanceFreeTime(s,40);
 assert.equal(currentSchedule(s).soyul,'sculpture');assert.deepEqual(presentPeople(s,'sculpture'),[]);assert.equal(arrive(s,'hall').encounter,null);
 s=advanceFreeTime(s,80);assert.equal(s.academics.npcAttendance['1:yeogyeong:nursing'].status,'present');assert.ok(!s.known.some(x=>x.includes('기본간호')));
});
test('attending requires the correct building, interior, active course and one valid choice',()=>{
 const s=newGame(),c=nextLesson(s),future=timetable(s)[1];assert.throws(()=>attendLesson(room(s,future),future.key,future.choices[0].id));assert.throws(()=>attendLesson(s,c.key,'blend'));assert.throws(()=>attendLesson({...room(s,c),buildingArea:{place:'arts',id:'small7'}},c.key,'blend'));assert.throws(()=>attendLesson(room(s,c),c.key,'wrong'));
 const r=attendLesson(room(s,c),c.key,'blend');assert.equal(r.state.clock.minute,c.end);assert.match(r.text,/반주/);assert.throws(()=>attendLesson(r.state,c.key,'blend'));
 assert.deepEqual(r.state.relations,s.relations);assert.equal(restore(save(r.state)).academics.records[c.key].choice,'blend');
});
test('arrival time distinguishes on time, late, partial attendance, and a missed lesson',()=>{
 for(const [minute,status] of [[570,'present'],[575,'late'],[585,'late'],[586,'partial']]){let s=newGame(),c=nextLesson(s);s.clock.minute=minute;s=attendLesson(room(s,c),c.key,'blend').state;assert.equal(s.academics.records[c.key].status,status);}
 const wet=newGame();wet.weather.days[1].afternoon='rain';wet.pace={count:2,seen:{}};const first=nextLesson(wet);
 const arrival=paceAction(wet,room(wet,first),{action:'classTravel',from:'campus',to:'place'}).state;
 assert.equal(arrival.clock.minute,580);assert.equal(attendLesson(arrival,first.key,'blend').state.academics.records[first.key].status,'late');
 let s=advanceFreeTime(newGame(),120);const c=timetable(s)[0];assert.equal(lessonStatus(s,c),'absent');assert.throws(()=>attendLesson(room(s,c),c.key,'blend'));const n=s.memory.length;s=advanceFreeTime(s,0);assert.equal(s.memory.length,n);
});
test('long activities expose course overlaps and actual absence persists after choosing to skip',()=>{
 const s=newGame();assert.equal(classConflicts(s,180).length,2);assert.equal(classConflicts(s,20).length,0);
 const r=freeActivity(s,'explore');assert.equal(r.clock.minute,600);assert.match(campusScene(r).text,/수업이 진행/);
 const absent=advanceFreeTime(r,60);assert.equal(absent.academics.records[timetable(absent)[0].key].status,'absent');assert.equal(restore(save(absent)).academics.records[timetable(absent)[0].key].status,'absent');
});
test('going home resolves unattended courses once; next school day starts in the morning',()=>{
 let s=goHome(newGame());assert.equal(Object.values(s.academics.records).filter(r=>r.status==='absent').length,2);
 s=nextDay(s);assert.equal(s.clock.minute,540);assert.equal(nextLesson(s).location,'academic');s=morning(s);s=nextDay(goHome(s));assert.equal(nextLesson(s).location,'baekseok');assert.equal(timetable(s,'soyul')[0].id,'chapel');
});
test('afternoon authoring snapshots remain available without changing normal new-game behavior',()=>{
 const s=newAfternoonScenario('friend');assert.equal(s.clock.minute,780);assert.deepEqual(timetable(s),[]);assert.equal(newGame().clock.minute,540);
});

test('pre-timetable saves retain their clock and progress without retroactive absence penalties',()=>{
 const s=newAfternoonScenario();s.day=2;s.clock.minute=900;delete s.academics;
 const loaded=restore(save(s));assert.equal(loaded.clock.minute,900);assert.equal(Object.keys(loaded.academics.records).length,4);assert.ok(Object.values(loaded.academics.records).every(r=>r.status==='untracked'));assert.deepEqual(loaded.memory,s.memory);
 assert.ok(Object.values(advanceFreeTime(loaded,30).academics.records).every(r=>r.status==='untracked'));
});
