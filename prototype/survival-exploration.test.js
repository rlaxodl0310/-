import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,scoutSurvivalSite,claimSurvivalBase,launchSurvivalSortie,returnSurvivalSortie,survivalDefense,finishSurvivalDay} from './survival-base.js';
import {survivalRoomCatalog,createSurvivalExploration,survivalSiteObservation} from './survival-exploration.js';
import {survivalPage} from './survival-ui.js';import {shelterSceneView} from './shelter-scene.js';import {endGridTurn} from './combat-grid.js';
function seedFor(count){for(let n=1;n<200;n++)if(createSurvivalExploration(n).rooms.arts401.occupants===count)return n;throw new Error('seed');}
function ready(seed=6){const s=startSurvival(newGame(),'student',{seed});Object.assign(s.survivalRun,{day:3,stage:'settlement',escapes:2});s.survivalRun.resources={food:30,water:30,parts:20,bandage:4};return s;}
test('same room can be empty or occupied across runs; all 16 room conditions persist by seed',()=>{
 const ids=Object.keys(survivalRoomCatalog);assert.equal(ids.length,16);for(const n of [0,2,3]){const s=ready(seedFor(n));assert.equal(s.survivalRun.exploration.rooms.arts401.occupants,n);assert.deepEqual(createSurvivalExploration(s.survivalRun.exploration.seed),s.survivalRun.exploration);}
 assert.deepEqual(restore(save(ready())).survivalRun.exploration,ready().survivalRun.exploration);
});
test('browsing buildings and floors reveals no private occupant, door or defense stats',()=>{
 const s=ready(seedFor(3)),before=save(s);assert.equal(survivalSiteObservation(s.survivalRun,'arts401'),null);for(const building of ['arts','music','creative']){const html=survivalPage(s,'base','','',building);assert.ok(html.includes('내부 미확인'));assert.ok(!html.includes('감염체 3마리'));assert.ok(!html.includes('문 상태 90/100'));}assert.equal(save(s),before);assert.throws(()=>claimSurvivalBase(s,'arts401'));assert.throws(()=>launchSurvivalSortie(s,'secure','arts401'));assert.equal(save(s),before);
});
test('empty inspection leads directly to claiming; real condition affects the shelter and night',()=>{
 let s=ready(seedFor(0));const original=s.survivalRun.exploration.rooms.arts401;s=scoutSurvivalSite(s,'arts401');assert.equal(s.survivalRun.actions,2);assert.equal(s.survivalRun.exploration.here,'arts401');assert.equal(s.survivalRun.secured.arts401,true);assert.throws(()=>launchSurvivalSortie(s,'secure','arts401'));s=claimSurvivalBase(s,'arts401');assert.equal(s.survivalRun.actions,1);assert.equal(s.survivalRun.base.integrity,original.integrity);assert.equal(s.survivalRun.base.exposure,original.exposure);assert.equal(survivalDefense(s.survivalRun),Math.max(0,35-original.exposure-Math.floor((100-original.integrity)/3)));
});
test('inspection order, repeated menus and save/load cannot reroll rooms',()=>{
 let a=ready(),b=ready();a=scoutSurvivalSite(scoutSurvivalSite(a,'arts401'),'library');b=scoutSurvivalSite(scoutSurvivalSite(b,'library'),'arts401');assert.deepEqual(a.survivalRun.exploration.rooms,b.survivalRun.exploration.rooms);const before=save(a);survivalPage(a,'base');assert.equal(save(a),before);assert.throws(()=>scoutSurvivalSite(a,'arts401'));assert.equal(save(a),before);
});
test('occupied rooms launch the observed enemy group and returning after retreat preserves casualties',()=>{
 let s=scoutSurvivalSite(ready(seedFor(3)),'arts401');assert.equal(s.survivalRun.secured.arts401,undefined);assert.throws(()=>claimSurvivalBase(s,'arts401'));s=launchSurvivalSortie(s,'secure','arts401');assert.equal(s.combatTrial.enemies.length,3);s.combatTrial.enemies[0].balance=0;s=returnSurvivalSortie(s,{abandon:true});assert.equal(survivalSiteObservation(s.survivalRun,'arts401').occupants,2);s=launchSurvivalSortie(s,'secure','arts401');assert.equal(s.combatTrial.enemies.length,2);
});
test('room reinforcements use distinct IDs and persist once across a failed clearance',()=>{
 let s=launchSurvivalSortie(scoutSurvivalSite(ready(seedFor(3)),'arts401'),'secure','arts401');s.combatTrial.noise=6;s=endGridTurn(s);assert.equal(s.combatTrial.enemies.length,4);assert.equal(new Set(s.combatTrial.enemies.map(e=>e.id)).size,4);s=returnSurvivalSortie(s,{abandon:true});s=launchSurvivalSortie(s,'secure','arts401');assert.equal(s.combatTrial.enemies.length,4);assert.equal(s.combatTrial.reinforced,true);s.combatTrial.noise=6;s=endGridTurn(s);assert.equal(s.combatTrial.enemies.length,4);
});
test('an empty room after an unsuccessful sortie still needs a fresh inspection before claiming',()=>{
 let s=launchSurvivalSortie(scoutSurvivalSite(ready(6),'arts401'),'secure','arts401');for(const e of s.combatTrial.enemies)e.balance=0;s=returnSurvivalSortie(s,{abandon:true});assert.throws(()=>claimSurvivalBase(s,'arts401'));s=scoutSurvivalSite(s,'arts401');assert.equal(s.survivalRun.secured.arts401,true);
});
test('legacy observations and established bases retain saved safety, facilities and room condition',()=>{
 let s=ready();delete s.survivalRun.exploration;s.survivalRun.scouted={arts401:true,library:true};s.survivalRun.secured={library:true};s=scoutSurvivalSite(s,'music201');assert.equal(survivalSiteObservation(s.survivalRun,'arts401').occupants,2);assert.equal(survivalSiteObservation(s.survivalRun,'library').occupants,0);
 const legacy=ready();delete legacy.survivalRun.exploration;legacy.survivalRun.base={site:'arts401',integrity:57,facilities:['beds']};legacy.survivalRun.stage='base';const before=save(legacy);survivalPage(legacy,'base');assert.equal(save(legacy),before);assert.equal(shelterSceneView(legacy.survivalRun).integrity,57);assert.equal(finishSurvivalDay(legacy).survivalRun.base.facilities[0],'beds');
});
test('new room capacity is enforced and matching room-art templates are reusable',()=>{
 let seed=1;while(createSurvivalExploration(seed).rooms.arts711.occupants!==0)seed++;let s=scoutSurvivalSite(ready(seed),'arts711');s.survivalRun.members.push({...s.survivalRun.members[1],key:'third'});assert.throws(()=>claimSurvivalBase(s,'arts711'));s.survivalRun.members.pop();s=claimSurvivalBase(s,'arts711');assert.equal(shelterSceneView(s.survivalRun).room,0);
});
