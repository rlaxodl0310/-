import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,newAfternoonScenario,nextDay,restore,save} from './simulation.js';
import {readCommunityPost} from './community.js';
import {beginCommunityActivity,progressCommunityActivity,currentCommunityActivity,communityActivityStage,pauseCommunityActivity,resumeCommunityActivity,activityAvailability} from './community-activities.js';
import {advanceFreeTime,goHome,freeActivity} from './free-roam.js';
import {currentSchedule} from './days.js';
import {setWeatherExample} from './weather.js';
const ready=(id,day=1)=>{const s=newAfternoonScenario();s.day=day;return readCommunityPost(s,id);};
function complete(s,choices){for(const choice of choices)s=progressCommunityActivity(s,choice);return s;}
test('public events require reading the post, the correct day and an actual open window',()=>{
 assert.throws(()=>beginCommunityActivity(newAfternoonScenario(),'volunteer-recruit'));
 let s=readCommunityPost(newGame(),'volunteer-recruit');assert.equal(activityAvailability(s,'volunteer-recruit').ok,false);
 s=ready('football-recruit');assert.equal(activityAvailability(s,'football-recruit').ok,false);assert.throws(()=>beginCommunityActivity(s,'football-recruit'));
 s=ready('volunteer-recruit');s.clock.minute=901;assert.equal(activityAvailability(s,'volunteer-recruit').ok,false);
});
test('three substantial volunteer stages consume exactly the advertised time and fulfill attendance once',()=>{
 let s=ready('volunteer-recruit');s.appointments=[{id:'help',day:1,person:'yeogyeong',activity:'volunteer',label:'물품 준비',status:'pending'}];
 s=beginCommunityActivity(s,'volunteer-recruit');assert.equal(s.clock.minute,780);assert.equal(s.contacts.yeogyeong?.introduced??false,false);
 s=progressCommunityActivity(s,'sort');assert.equal(s.clock.minute,810);assert.equal(s.contacts.yeogyeong.introduced,true);assert.equal(s.appointments[0].status,'pending');assert.equal(s.freeDay.completed.length,0);
 s=complete(s,['carry','handover']);assert.equal(s.clock.minute,960);assert.equal(s.freeDay.completed.length,1);assert.equal(s.appointments[0].status,'kept');assert.equal(s.eventState.flags.logisticsReady,true);
 assert.ok(s.known.includes('자유관 봉사 물품 임시 보관 자리'));assert.ok(!s.known.includes('봉사 물품 포장 표기'));assert.deepEqual(s.memberships,{});
 assert.equal(currentCommunityActivity(s).status,'completed');assert.throws(()=>progressCommunityActivity(s,'handover'));assert.throws(()=>beginCommunityActivity(s,'volunteer-recruit'));
 assert.equal(restore(save(s)).activitySessions.records['1:volunteer-recruit'].choices.length,3);
});
test('leaving keeps partial work, grants no completed attendance, and saves the next stage',()=>{
 let s=progressCommunityActivity(beginCommunityActivity(ready('volunteer-recruit'),'volunteer-recruit'),'audit');
 s=pauseCommunityActivity(s);assert.equal(s.activitySessions.active,null);assert.equal(s.freeDay.completed.length,0);
 s=restore(save(s));s=advanceFreeTime(s,60);s=resumeCommunityActivity(s,'1:volunteer-recruit');assert.equal(communityActivityStage(s).name,'포장과 운반');
 s=complete(s,['labels','next']);assert.equal(s.clock.minute,1020);assert.equal(s.freeDay.completed[0].activeMinutes,180);assert.equal(s.freeDay.completed[0].end-s.freeDay.completed[0].start,240);
 assert.equal(currentCommunityActivity(s).segments.reduce((sum,x)=>sum+x.end-x.start,0),180);assert.ok(s.known.includes('봉사 사진 정리 공개 활동 안내'));assert.equal(s.appointments.length,0);
});
test('interrupted work cannot be resumed after the deadline or after another route already completed it',()=>{
 let s=pauseCommunityActivity(progressCommunityActivity(beginCommunityActivity(ready('volunteer-recruit'),'volunteer-recruit'),'audit'));
 s=advanceFreeTime(s,150);assert.throws(()=>resumeCommunityActivity(s,'1:volunteer-recruit'));
 s=nextDay(goHome(s));assert.throws(()=>resumeCommunityActivity(s,'1:volunteer-recruit'));
 let other=pauseCommunityActivity(beginCommunityActivity(ready('volunteer-recruit'),'volunteer-recruit'));other=freeActivity(other,'volunteer');assert.throws(()=>resumeCommunityActivity(other,'1:volunteer-recruit'));
});
test('rain changes the real football venue, drills and information without granting outdoor rewards',()=>{
 let s=beginCommunityActivity(ready('football-recruit',2),'football-recruit');assert.equal(currentCommunityActivity(s).rain,true);assert.equal(s.buildingArea.id,'fitness');
 s=progressCommunityActivity(s,'warm');assert.deepEqual(communityActivityStage(s).choices.map(c=>c.id),['mobility','balance']);assert.throws(()=>progressCommunityActivity(s,'pass'));
 s=complete(s,['balance','feedback']);assert.equal(s.clock.minute,870);assert.ok(s.known.includes('축구 동아리 실내 운동 공간'));assert.ok(!s.known.includes('운동장'));assert.match(s.lastResult,/균형과 코어/);assert.deepEqual(s.inventory,[]);
});
test('dry football and music roles produce their own outcomes rather than the same generic completion',()=>{
 let football=setWeatherExample(ready('football-recruit',2),'sunny');football=complete(beginCommunityActivity(football,'football-recruit'),['observe','pass','cool']);assert.match(football.lastResult,/짝 패스/);assert.ok(football.known.includes('운동장'));
 let music=complete(beginCommunityActivity(ready('music-recruit'),'music-recruit'),['bass','mark','gear']);assert.equal(music.clock.minute,900);assert.match(music.lastResult,/베이스.*전환 신호/);assert.ok(music.known.includes('예술동 대형 합주실 케이블 보관 위치'));assert.ok(!music.known.includes('공개 합주 수정 메모'));assert.throws(()=>beginCommunityActivity(music,'music-recruit'));
});
test('actual activity participants stay on task; classroom and other NPC schedules remain independent',()=>{
 let s=beginCommunityActivity(ready('volunteer-recruit'),'volunteer-recruit');s=progressCommunityActivity(s,'audit');s=progressCommunityActivity(s,'labels');assert.equal(s.clock.minute,900);assert.equal(currentSchedule(s).yeogyeong,'hall');assert.equal(currentSchedule(pauseCommunityActivity(s)).yeogyeong,'library');
 const away={...s,location:'library'};assert.throws(()=>progressCommunityActivity(away,'handover'));
});
test('all musical parts and final options remain reachable, and scene reads do not commit any task',()=>{
 const before=ready('music-recruit'),s=beginCommunityActivity(before,'music-recruit');assert.deepEqual(communityActivityStage(s).choices.map(c=>c.id),['vocal','bass','guitar']);assert.equal(s.known.length,before.known.length);assert.equal(s.freeDay.completed.length,0);assert.equal(s.clock.minute,780);
});
