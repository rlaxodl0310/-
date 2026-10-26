import test from 'node:test';
import assert from 'node:assert/strict';
import {campusBuildings,enterBuildingArea} from './campus-buildings.js';
import {roomFloorList,roomFloorLabel} from './campus-rooms.js';
import {newGame,save,restore} from './simulation.js';
import {timetable,classPlace,nextLesson} from './timetable.js';
import {attendLesson} from './classes.js';
import {contact,introduce,normalizeNpcAddress,displayName} from './identity.js';
import {generateDialogueTurn,advanceGeneratedDialogue} from './dialogue-generator.js';
import {prepareCampusVariation,variedCampusSchedule} from './campus-variation.js';
import {currentSchedule} from './days.js';
test('room plans have unique IDs/numbers and respect arts floors and the ten-floor headquarters',()=>{
 for(const b of Object.values(campusBuildings)){
  const areas=b.areas??[],rooms=areas.filter(a=>a.number);
  assert.equal(new Set(areas.map(a=>a.id)).size,areas.length);assert.equal(new Set(rooms.map(a=>a.number)).size,rooms.length);
  for(const room of rooms){assert.equal(room.provisional,true);if(b.maxFloor)assert.ok((parseInt(room.floor)||0)<=b.maxFloor);}
 }
 const arts=campusBuildings.arts;assert.equal(arts.areas.find(a=>a.id==='classes').number,'401');assert.equal(arts.areas.find(a=>a.id==='band').number,'409');
 assert.ok(arts.areas.some(a=>roomFloorLabel(a)==='7층'&&a.kind==='classroom'));assert.ok(arts.areas.some(a=>roomFloorLabel(a)==='7층'&&a.kind==='facility'));
 assert.deepEqual(roomFloorList(arts),['1층','2층','3층','4층','5층','6층','7층','8층']);
});
test('every course resolves to a specific room or the single chapel hall, never a floor range',()=>{
 const s=newGame();for(const id of ['taei','yeogyeong','seoyeon','soyul'])for(const day of [1,2,3])for(const c of timetable(s,id,day)){
  assert.ok(!classPlace(c).includes('~'));assert.ok(campusBuildings[c.location].areas.find(a=>a.id===c.area));assert.match(classPlace(c),/호|채플/);
 }
});
test('being on the correct floor is insufficient to attend and only visited room is learned',()=>{
 let s=newGame();s.location='arts';s=enterBuildingArea(s,'room402').state;
 s.clock.minute=690;const c=timetable(s)[1];assert.match(classPlace(c),/401호/);assert.throws(()=>attendLesson(s,c.key,'apply'));
 assert.ok(s.known.some(x=>x.includes('402호')));assert.ok(!s.known.some(x=>x.includes('401호')));assert.deepEqual(restore(save(s)).buildingArea,s.buildingArea);
});
test('knowing a name never grants knowledge of seniority or major',()=>{
 const s=newGame();introduce(s,'yeogyeong','incidental-exchange');
 assert.equal(contact(s,'yeogyeong').playerSeniorityKnown,false);assert.equal(contact(s,'yeogyeong').details,undefined);
 assert.equal(normalizeNpcAddress(s,'yeogyeong','선배는요?'),'태이 씨는요?');assert.equal(normalizeNpcAddress(s,'yeogyeong','태이 선배는요?'),'태이 씨는요?');
 for(let i=0;i<15;i++)assert.ok(!generateDialogueTurn(s,'yeogyeong').text.includes('선배'));
});
test('actual introduction and major questions unlock only the information spoken to that listener',()=>{
 const s=newGame();s.clock.minute=820;introduce(s,'yeogyeong','test');
 for(let i=0;i<100;i++){const r=generateDialogueTurn(s,'yeogyeong');if(r.options.some(o=>o.id==='introduce'))break;}
 advanceGeneratedDialogue(s,'yeogyeong','introduce');assert.equal(contact(s,'yeogyeong').playerSeniorityKnown,true);assert.equal(contact(s,'soyul').playerSeniorityKnown,false);
 for(let i=0;i<100;i++){const r=generateDialogueTurn(s,'yeogyeong');if(r.options.some(o=>o.id==='about'))break;}
 const r=advanceGeneratedDialogue(s,'yeogyeong','about').result;
 assert.match(r.text,/간호학과/);assert.equal(contact(s,'yeogyeong').details.major,'간호학과');assert.equal(contact(s,'soyul').details,undefined);
});
test('day variation changes independent locations, persists, and never rerolls on observation',()=>{
 const plans=new Set();for(let seed=1;seed<=12;seed++){
  const s=newGame();s.campusVariation={seed:seed*717193,plans:{}};prepareCampusVariation(s);s.clock.minute=930;
  const before=structuredClone(s),position=currentSchedule(s);plans.add(JSON.stringify(position));
  assert.deepEqual(currentSchedule(s),position);assert.deepEqual(s,before);assert.deepEqual(currentSchedule(restore(save(s))),position);
  s.clock.minute=600;assert.equal(currentSchedule(s).yeogyeong,'creative');
 }
 assert.ok(plans.size>=3);
});
