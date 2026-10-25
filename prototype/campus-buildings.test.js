import test from 'node:test';
import assert from 'node:assert/strict';
import {campusBuildings,buildingActivity,buildingActions,buildingAtmosphere,buildingLinks,enterBuildingArea,selectedBuildingArea} from './campus-buildings.js';
import {locations} from './days.js';
import {newGame,restore,save} from './simulation.js';
import {arrive} from './encounters.js';
import {campusScene,placeContinuations} from './scene-flow.js';
import {paceAction} from './campus-time.js';
test('all thirteen places are reachable through real scene links with no invalid destination',()=>{
 assert.equal(Object.keys(locations).length,13);
 const s=newGame(),visited=new Set(),pending=campusScene(s).choices.filter(c=>c.action==='visit').map(c=>c.value);
 while(pending.length){const place=pending.pop();if(visited.has(place))continue;visited.add(place);for(const c of placeContinuations(s,place).filter(c=>c.action==='visit')){assert.ok(locations[c.value]);pending.push(c.value);}}
 assert.equal(visited.size,13);for(const place of Object.keys(locations))assert.ok(buildingLinks(place).every(c=>locations[c.value]));
});
test('arriving at new buildings observes actual facilities without inventing an NPC or item',()=>{
 for(const [id,b] of Object.entries(campusBuildings).filter(([id])=>id!=='hall')){const s=newGame(),r=arrive(s,id);assert.equal(r.state.location,id);assert.equal(r.encounter,null);assert.match(r.observation,new RegExp(b.entry.slice(0,5)));assert.ok(r.state.known.includes(b.fact));assert.deepEqual(r.state.inventory,s.inventory);assert.deepEqual(r.state.contacts,s.contacts);const again=arrive(r.state,id);assert.equal(again.state.memory.length,r.state.memory.length);}
});
test('meals obey service windows and one meal per period, preserved by save/load',()=>{
 let s=arrive(newGame(),'cafeteria').state;s=buildingActivity(s,'meal').state;
 assert.ok(!buildingActions(s).some(a=>a.id==='meal'));assert.throws(()=>buildingActivity(restore(save(s)),'meal'));
 s.clock.minute=900;assert.ok(!buildingActions(s).some(a=>a.meal));assert.match(buildingAtmosphere(s,'cafeteria'),/배식 시간이 아니다/);
 s.clock.minute=1020;s=buildingActivity(s,'meal').state;assert.equal(s.buildingLife.meals.length,2);
 s.clock.minute=1140;assert.ok(!buildingActions(s).some(a=>a.meal));s.day=2;s.clock.minute=780;assert.ok(buildingActions(s).some(a=>a.meal));
});
test('local actions use existing time batches and do not duplicate discoveries or relationships',()=>{
 let s=arrive(newGame(),'academic').state;const relations=structuredClone(s.relations);
 for(let i=0;i<5;i++){const before=s;s=paceAction(before,buildingActivity(s,'rooms').state,{action:'buildingActivity',value:'rooms',from:'place',to:'place'}).state;}
 assert.equal(s.clock.minute,780);assert.equal(s.buildingLife.history.length,1);assert.deepEqual(s.relations,relations);assert.equal(s.known.filter(x=>x==='은혜관 계단과 층별 안내').length,1);
 const before=s;s=paceAction(before,buildingActivity(s,'notes').state,{action:'buildingActivity',value:'notes',from:'place',to:'place'}).state;assert.equal(s.pace.count,2);
});
test('local actions reject wrong places and late hours; dorm remains a visit rather than housing',()=>{
 assert.throws(()=>buildingActivity(newGame(),'meal'));
 const s=arrive(newGame(),'dorm').state;const r=buildingActivity(s,'guide');assert.match(r.text,/자취방/);assert.equal(r.state.phase,'afternoon');assert.equal(r.state.freeDay.home,undefined);s.clock.minute=1320;assert.throws(()=>buildingActivity(s,'bench'));
});
test('music building has rehearsal access and existing saved locations remain valid',()=>{
 assert.ok(placeContinuations(newGame(),'arts').some(c=>c.value==='rehearsal'));
 for(const id of Object.keys(locations)){const s=arrive(newGame(),id).state;assert.equal(restore(save(s)).location,id);}
});

test('ten confirmed main buildings retain their own departments, capacity and floor facts',()=>{
 const main=Object.values(campusBuildings).filter(b=>b.primary);assert.equal(main.length,10);
 assert.deepEqual(main.map(b=>b.name).sort(),['본부동','예술동','음악관','체육관','외식관','창조관','은혜관','자유관','조형관','백석홀'].sort());
 assert.equal(campusBuildings.headquarters.maxFloor,10);assert.equal(campusBuildings.arts.maxFloor,8);
 const arts=campusBuildings.arts.areas;assert.equal(arts.find(a=>a.id==='classes').floor,'2~7층');assert.equal(arts.find(a=>a.id==='small7').floor,'7층');assert.equal(arts.find(a=>a.id==='small8').floor,'8층');assert.equal(arts.find(a=>a.id==='band').floor,'4층 구석');
 assert.match(campusBuildings.gym.description,/체대·실용음악과/);assert.match(campusBuildings.baekseok.description,/여러 학과.*채플/);
 assert.equal(campusBuildings.creative.areas.find(a=>a.id==='nursing').floor,'층 미확정');
});
test('interior visits reveal only the selected facility, persist and do not grant supplies',()=>{
 let s=arrive(newGame(),'arts').state;const original=structuredClone(s.inventory);
 assert.ok(!s.known.some(k=>k.includes('4층 구석')));const r=enterBuildingArea(s,'band');s=r.state;
 assert.ok(s.known.includes('예술동 4층 구석 대형 합주실'));assert.ok(!s.known.some(k=>k.includes('8층 좁은')));
 assert.equal(enterBuildingArea(s,'band').state.memory.length,s.memory.length);assert.deepEqual(s.inventory,original);
 s=restore(save(s));assert.equal(selectedBuildingArea(s).id,'band');assert.match(buildingAtmosphere(s,'arts'),/4층 구석/);
 assert.throws(()=>enterBuildingArea(s,'nursing'));
});
test('library is an interior destination of Creative; the outside cafe stays distinct',()=>{
 const s=arrive(newGame(),'creative').state,r=enterBuildingArea(s,'library');assert.equal(r.destination,'library');assert.equal(r.state.location,'creative');
 const dining=arrive(newGame(),'cafeteria').state;const cafe=enterBuildingArea(dining,'cafe').state;
 assert.ok(!buildingActions(cafe).some(a=>a.meal));assert.equal(cafe.location,'cafeteria');
 assert.ok(buildingActions(enterBuildingArea(cafe,'dining').state).some(a=>a.meal));
});
test('old provisional saved names migrate without losing route knowledge or location',()=>{
 const s=newGame();s.location='hall';s.known=['학생회관','학생회관 문구류 보관 위치','음악 연습동 위치','강의동 위치'];
 const r=restore(save(s));assert.equal(r.location,'hall');assert.deepEqual(r.known,['자유관','자유관 문구류 보관 위치','음악관 위치','은혜관 위치']);
});
