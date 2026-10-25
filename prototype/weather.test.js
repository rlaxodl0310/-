import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,nextDay,restore,save} from './simulation.js';
import {weatherNow,setWeatherExample,borrowUmbrella,weatherAdjustAppointments,hasUmbrella} from './weather.js';
import {availableRoutes,presentPeople} from './days.js';
import {spendTime,paceAction} from './campus-time.js';
import {discoveryChanges} from './discoveries.js';
import {updateSocialWorld} from './social-memory.js';

test('weather follows a saved daily forecast rather than rerolling on reads',()=>{
 const s=newGame();assert.equal(weatherNow(s).kind,'sunny');assert.equal(weatherNow(s,2,'afternoon').kind,'rain');
 assert.deepEqual(weatherNow(s),weatherNow(restore(save(s))));
 const evening=act(s,'rehearsal');assert.equal(weatherNow(evening).kind,'cloudy');assert.equal(weatherNow(nextDay(evening)).kind,'rain');
});
test('rain changes outdoor preparation costs, while an umbrella keeps normal duration',()=>{
 let s=setWeatherExample(newGame(),'rain');assert.equal(availableRoutes(s).find(r=>r.id==='explore').duration,90);
 s.location='hall';s=borrowUmbrella(s);assert.equal(availableRoutes(s).find(r=>r.id==='explore').duration,60);
 assert.equal(availableRoutes(s).find(r=>r.id==='rehearsal').duration,120);
});
test('rainy football has a real indoor result, not an outdoor reward or broken club promise',()=>{
 let s=nextDay(act(newGame(),'rehearsal'));s.appointments=[{id:'training',kind:'club',day:2,activity:'football',label:'훈련',status:'pending'}];
 const n=act(s,'football');assert.match(n.lastResult,/실내/);assert.ok(n.known.includes('축구 동아리 실내 운동 공간'));assert.ok(!n.known.includes('운동장'));
 assert.equal(n.appointments[0].status,'kept');
});
test('bad-weather cancellation protects an accepted outdoor commitment from social penalties',()=>{
 const before=setWeatherExample(newGame(),'storm');before.appointments=[{id:'outside',person:'soyul',day:1,activity:'explore',label:'함께 탐색',status:'pending'}];
 const route=availableRoutes(before).find(r=>r.id==='explore');assert.ok(route.locked);assert.ok(route.weatherBlocked);
 const adjusted=weatherAdjustAppointments(before,availableRoutes(before));assert.equal(adjusted.appointments[0].status,'weather-cancelled');
 const after=act(before,'rehearsal');assert.equal(after.appointments[0].status,'weather-cancelled');assert.equal(after.relations['soyul>taei'],undefined);
 assert.ok(!updateSocialWorld(before,after).social.facts.some(f=>f.type==='missed'));assert.throws(()=>act(before,'explore'),/강한 비/);
});
test('optional NPC trips change with rain and do not create an impossible library meeting',()=>{
 const rainy=setWeatherExample(newGame(),'rain');const one=spendTime(rainy,60);
 assert.ok(presentPeople(one,'hall').includes('seoyeon'));assert.equal(presentPeople(one,'cafe').length,0);
 const later=spendTime(one,60);assert.ok(presentPeople(later,'hall').includes('yeogyeong'));
 assert.ok(!later.events.some(e=>e.id==='day1-library-check'));assert.ok(later.events.some(e=>e.id==='day1-peer-message'));
});
test('wet travel adds time only at a completed activity block and umbrella mitigates it',()=>{
 function threeActivities(s){
  let after=structuredClone(s);after.location='library';s=paceAction(s,after,{action:'visit',from:'place',to:'place'}).state;
  assert.equal(s.clock.minute,780);
  s=paceAction(s,s,{action:'walk',value:'shelves',from:'place',to:'place'}).state;assert.equal(s.clock.minute,780);
  return paceAction(s,s,{action:'walk',value:'desk',from:'place',to:'place'});
 }
 let rainy=setWeatherExample(newGame(),'rain');assert.equal(threeActivities(rainy).minutes,40);
 rainy.location='hall';rainy=borrowUmbrella(rainy);assert.equal(threeActivities(rainy).minutes,30);
});
test('borrowing and returning an umbrella is a real saved item change, without duplicate items',()=>{
 const before=newGame();assert.throws(()=>borrowUmbrella(before));before.location='hall';
 const held=borrowUmbrella(before);assert.ok(hasUmbrella(held));assert.throws(()=>borrowUmbrella(held));
 assert.ok(discoveryChanges(before,held).some(c=>c.kind==='item'&&c.name==='대여 우산'&&c.quantity===1));
 const loaded=restore(save(held));assert.ok(hasUmbrella(loaded));assert.ok(!hasUmbrella(borrowUmbrella(loaded,true)));
});
test('older saves receive a forecast without changing prior activity outcomes or belongings',()=>{
 const old=act(newGame(),'rehearsal');delete old.weather;const loaded=restore(save(old));
 assert.equal(weatherNow(loaded).kind,'cloudy');assert.equal(loaded.lastResult,old.lastResult);assert.deepEqual(loaded.inventory,old.inventory);
});

test('borrowing an umbrella after an unprotected trip cannot erase time already spent',()=>{
 let s=setWeatherExample(newGame(),'rain');const moved=structuredClone(s);moved.location='hall';
 s=paceAction(s,moved,{action:'visit',from:'campus',to:'place'}).state;
 s=borrowUmbrella(s);s=paceAction(s,s,{action:'walk',value:'tables',from:'place',to:'place'}).state;
 const done=paceAction(s,s,{action:'walk',value:'noticeboard',from:'place',to:'place'});assert.equal(done.minutes,40);
});
