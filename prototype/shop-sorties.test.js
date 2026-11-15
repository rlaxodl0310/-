import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,launchSurvivalSortie,returnSurvivalSortie,finishSurvivalDay} from './survival-base.js';
import {gridAct,endGridTurn,tacticalBlocked} from './combat-grid.js';
import {combatPackAction} from './survival-pack.js';
import {combatSideMissions} from './combat-side-missions.js';
import {survivalPage} from './survival-ui.js';
import {shopRoute} from './shop-sorties-fixtures.js';
function home(){const s=startSurvival(newGame(),'student',{seed:6});Object.assign(s.survivalRun,{day:4,stage:'base',base:{site:'arts401',integrity:80,exposure:0,facilities:[]}});return s;}
function at(s,x,y){Object.assign(s.combatTrial.actors.taei,{x,y,ap:2});return s;}
for(const kind of ['kiosk','convenience']){
 test(kind+' has a playable supply/optional-reserve/extraction route, including mid-sortie save and persistent daily limits',()=>{
  const before=home(),school=structuredClone(before);delete school.survivalRun;let s=launchSurvivalSortie(before,kind);assert.equal(before.survivalRun.actions,3);assert.equal(s.survivalRun.actions,2);assert.ok(survivalPage(before,kind).includes('출발 · 여력 1'));
  for(const [key,action,target] of shopRoute(kind)){s=key==='end'?endGridTurn(s):gridAct(s,key,action,target);if(['loot','shopReserve'].includes(action)){s=combatPackAction(s,'take',action==='loot'?'food':'canned');s=combatPackAction(s,'leave');s=restore(save(s));}}
  assert.equal(s.combatTrial.status,'escaped');assert.equal(s.combatTrial.turn,kind==='kiosk'?7:8);assert.equal(s.combatTrial.reinforced,kind==='convenience');assert.equal(combatSideMissions(s.combatTrial).find(q=>q.id==='shopReserve').status,'complete');
  s=returnSurvivalSortie(s);assert.equal(s.survivalRun.kit.items.food,1);assert.equal(s.survivalRun.kit.items.canned,1);assert.equal(s.survivalRun.members.length,2);const after=structuredClone(s);delete after.survivalRun;assert.deepEqual(after,school);assert.throws(()=>launchSurvivalSortie(s,kind),/오늘/);assert.throws(()=>returnSurvivalSortie(s));s=finishSurvivalDay(s);assert.ok(launchSurvivalSortie(s,kind).combatTrial.shop);
 });
 test(kind+' requires the main cache, allows leaving the reserve, and preserves picked items on abort without success rewards',()=>{
  assert.throws(()=>launchSurvivalSortie(startSurvival(newGame()),kind),/거점/);let s=launchSurvivalSortie(home(),kind);assert.equal(tacticalBlocked(5,3,s.combatTrial),true);
  at(s,9,3);s.combatTrial.door=2;assert.throws(()=>gridAct(s,'taei','move',{x:11,y:3}),/물자함/);at(s,6,2);s=gridAct(s,'taei','loot');s=combatPackAction(s,'take','water');s=combatPackAction(s,'leave');const food=s.survivalRun.resources.food;s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.kit.items.water,3);assert.equal(s.survivalRun.resources.food,food);assert.match(s.survivalRun.log[0],/미완료/);assert.throws(()=>launchSurvivalSortie(s,kind),/오늘/);
  let won=launchSurvivalSortie(home(),kind);won.combatTrial.enemies=[];won.combatTrial.supplyCache.recovered=true;won.combatTrial.door=2;won.combatTrial.actors.ally.escaped=true;at(won,9,3);won=gridAct(won,'taei','move',{x:11,y:3});assert.equal(won.combatTrial.status,'escaped');assert.equal(combatSideMissions(won.combatTrial).find(q=>q.id==='shopReserve').status,'missed');assert.match(returnSurvivalSortie(won).survivalRun.log[0],/남겨두고/);
 });
}
test('reserve uses its own pickup position, cannot be reopened, and bag capacity blocks additional items',()=>{
 let s=at(launchSurvivalSortie(home(),'convenience'),9,2);assert.throws(()=>gridAct(at(structuredClone(s),2,4),'taei','shopReserve'));s=gridAct(s,'taei','shopReserve');assert.equal(s.combatTrial.noise,6);s=restore(save(s));at(s,2,4);assert.throws(()=>combatPackAction(s,'take','canned'),/옆/);at(s,9,2);s=combatPackAction(s,'take','canned');s=combatPackAction(s,'leave');assert.throws(()=>gridAct(s,'taei','shopReserve'));s=endGridTurn(s);assert.equal(s.combatTrial.reinforced,true);
 let full=at(launchSurvivalSortie(home(),'kiosk'),6,2);full.combatTrial.stash.items={firstaid:4};full=gridAct(full,'taei','loot');assert.throws(()=>combatPackAction(full,'take','food'),/수납/);
});
test('legacy campaigns get a bag and each location has its own daily visit limit',()=>{
 let s=home();delete s.survivalRun.kit;s=launchSurvivalSortie(s,'kiosk');assert.ok(s.combatTrial.survivalPack);s=returnSurvivalSortie(s,{abandon:true});s=launchSurvivalSortie(s,'convenience');assert.equal(s.combatTrial.shop.kind,'convenience');
});
