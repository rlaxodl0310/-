import test from 'node:test';import assert from 'node:assert/strict';
import {newReturningGame,nextDay,restore,save} from './simulation.js';
import {advanceFreeTime} from './free-roam.js';
import {days,currentSchedule} from './days.js';
import {timetable,confirmRegistration,registeredCourseIds} from './timetable.js';
import {fortnightActivities,fortnightActivityView,progressFortnightActivity} from './fortnight-life.js';
import {arrive} from './encounters.js';import {generateDialogueTurn} from './dialogue-generator.js';
import {introduce} from './identity.js';import {weatherNow} from './weather.js';
import {moneyBalance} from './wallet.js';
import {attendLesson} from './classes.js';
import {groupDialogue,respondGroup} from './dialogue.js';
function game(){const s=newReturningGame();return confirmRegistration(s,registeredCourseIds(s));}
test('fourteen consecutive days preserve saves wallets and return-day state; stop after14',()=>{let s=game();s.wallet={balance:43210,ledger:[]};for(let day=1;day<=14;day++){assert.equal(s.day,day);assert.ok(days[day]);assert.ok(currentSchedule(s));s=advanceFreeTime(s,1320-s.clock.minute);s=restore(save(s));assert.equal(moneyBalance(s),43210);if(day<14)s=nextDay(s);else assert.throws(()=>nextDay(s));}assert.equal(s.dayHistory.length,13);});
test('weekday classes repeat in week2 while weekends have no normal classes',()=>{const s=game();for(const id of ['taei','yeogyeong','seoyeon','soyul'])for(let day=1;day<=7;day++){const a=timetable(s,id,day),b=timetable(s,id,day+7);assert.deepEqual(a.map(c=>c.id),b.map(c=>c.id));if(day>=6)assert.equal(a.length,0);else assert.ok(a.length);assert.ok(b.every(c=>c.key.startsWith((day+7)+':')));}});
test('eleven new daily activities persist midway, finish once and never grant free purchases',()=>{for(let day=4;day<=14;day++){let s=game();s.day=day;s.clock.minute=800;s.location=fortnightActivities[day].place;const before=moneyBalance(s),inventory=structuredClone(s.inventory??[]);const v=fortnightActivityView(s);s=progressFortnightActivity(s,v.choices[0][0]);s=restore(save(s));assert.equal(fortnightActivityView(s).step,1);s=progressFortnightActivity(s,'finish');assert.equal(s.clock.minute,830);assert.equal(fortnightActivityView(s),null);assert.equal(moneyBalance(s),before);assert.deepEqual(s.inventory??[],inventory);assert.throws(()=>progressFortnightActivity(s,'finish'));}});
test('later arrivals and generated conversations work without replaying day1 scenes',()=>{for(let day=4;day<=14;day++){let s=game();s.day=day;s.clock.minute=850;const pos=currentSchedule(s).soyul;const r=arrive(s,pos);assert.ok(r.observation||r.encounter);introduce(s,'soyul','test');const turn=generateDialogueTurn(s,'soyul');assert.ok(turn.text&&!turn.text.includes('undefined'));assert.ok(weatherNow(s).name);}});
test('new private NPC contacts progress without exposing contents to absent player',()=>{let s=game();s.day=9;s.clock.minute=890;s.location='market';s=advanceFreeTime(s,20);const e=s.events.find(x=>x.day===9&&x.id==='ordinary-peer-contact');assert.equal(e.visibility,'private');assert.ok(!s.memory.some(x=>x.includes(e.result)||x.includes('근처 학생들이 준비 상황')));assert.ok(!s.known.some(x=>x.includes('ordinary-peer')));});

test('second-week lessons recall only actual prior attendance records',()=>{for(const status of ['present','absent']){let s=game();s.day=8;const c=timetable(s)[0];s.clock.minute=c.start;s.location=c.location;s.buildingArea={place:c.location,id:c.area};s.academics.records['1:taei:'+c.id]={status};const r=attendLesson(s,c.key,c.choices[0].id);assert.ok(r.text.includes(status==='present'?'지난주에 남긴':'지난주 빠졌던'));assert.equal(r.state.academics.records[c.key].day,8);}});

test('later group conversations do not replay an unfinished day3 photo exhibition',()=>{const s=game();s.day=14;s.clock.minute=850;const lines=groupDialogue(s);assert.ok(!lines.some(x=>/내일.*전시|붙이기 전/.test(x.text)));const r=respondGroup(s,'include');assert.ok(!r.lines.some(x=>/사진/.test(x.text)));});
