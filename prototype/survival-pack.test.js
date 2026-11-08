import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,survivalAction,launchSurvivalSortie,returnSurvivalSortie,finishSurvivalDay} from './survival-base.js';
import {survivalBags,survivalBagStats,survivalPackFit,createPackLoot,createSurvivalPack,initializeSurvivalPack,transferSurvivalPack,takeSurvivalLoot,equipSurvivalLootBag,leaveSurvivalLoot,dropSurvivalPackItem,useSurvivalPackItem,storeAllSurvivalPack,prepareSurvivalPack,combatPackAction,survivalPackView} from './survival-pack.js';
import {gridAct,endGridTurn,tacticalLureTargets} from './combat-grid.js';import {settleCombatRewards} from './combat-side-missions.js';import {survivalPackPage} from './survival-pack-ui.js';
function camp(){const s=startSurvival(newGame(),'student',{seed:6});Object.assign(s.survivalRun,{stage:'base',day:4,actions:3,base:{site:'library',integrity:70,facilities:[]},threat:20,resources:{food:20,water:20,parts:20,bandage:4}});return s;}
test('stacked slots and weight are independent constraints with integer gram accounting',()=>{
 assert.equal(survivalBagStats('campus',{water:2}).usedSlots,1);assert.equal(survivalBagStats('campus',{water:3}).usedSlots,2);assert.equal(survivalBagStats('campus',{firstaid:2}).usedSlots,4);assert.equal(survivalBagStats('campus',{water:3}).weight,1650);
 assert.match(survivalPackFit('campus',{water:14},'water',1),/무게/);assert.match(survivalPackFit('campus',{firstaid:4},'energybar',1),/칸/);assert.match(survivalPackFit('campus',{},'water',.5),/수량/);
});
test('starting pack transfers supplies once and keeps school inventory untouched',()=>{
 const initial=newGame(),s=startSurvival(initial,'student',{seed:8});assert.equal(s.survivalRun.resources.water+s.survivalRun.kit.items.water,6);assert.equal(s.survivalRun.resources.bandage+s.survivalRun.kit.items.bandage,2);assert.deepEqual(s.inventory,initial.inventory);const before=save(s);survivalPackPage(s);survivalPackView(s);assert.equal(save(s),before);
});
test('storage transfers conserve quantities, reject overflow atomically and allow recovery from a legacy overload',()=>{
 let s=camp();s=storeAllSurvivalPack(s);const total=s.survivalRun.resources.water;s=transferSurvivalPack(s,'take','water',4);assert.equal(s.survivalRun.resources.water+s.survivalRun.kit.items.water,total);s=transferSurvivalPack(s,'store','water',2);assert.equal(s.survivalRun.kit.items.water,2);const before=save(s);assert.throws(()=>transferSurvivalPack(s,'take','water',20));assert.equal(save(s),before);
 s.survivalRun.kit.items={water:30};assert.equal(survivalPackView(s).stats.over,true);assert.throws(()=>launchSurvivalSortie(s,'supply'));s=transferSurvivalPack(s,'store','water',20);assert.equal(survivalPackView(s).stats.over,false);
});
test('search produces saved loot, not automatic rewards, and cannot reroll or access storage at the find',()=>{
 let s=camp(),before=save(s);s=survivalAction(s,'search');assert.equal(s.survivalRun.resources.food,20);assert.equal(s.survivalRun.actions,2);assert.ok(s.survivalRun.kit.pending.items.food>=2);const found=save(s);for(let i=0;i<3;i++)survivalPackPage(s);assert.equal(save(s),found);assert.throws(()=>survivalAction(s,'search'));assert.throws(()=>storeAllSurvivalPack(s));assert.throws(()=>transferSurvivalPack(s,'store','water'));assert.throws(()=>launchSurvivalSortie(s,'supply'));assert.throws(()=>finishSurvivalDay(s));
 s=takeSurvivalLoot(restore(save(s)),'food');assert.equal(s.survivalRun.kit.items.food,1);s=leaveSurvivalLoot(s);assert.equal(s.survivalRun.kit.pending,null);assert.throws(()=>takeSurvivalLoot(s,'food'));assert.throws(()=>survivalAction(s,'search'));assert.notEqual(save(s),before);
});
test('found bags really change both limits, leave the old bag, and cannot delete oversized contents',()=>{
 let s=camp();s.survivalRun.kit.pending={id:1,source:'found',items:{},bags:['hiking','messenger']};s=equipSurvivalLootBag(s,'hiking');assert.equal(survivalPackView(s).stats.slots,14);assert.equal(survivalPackView(s).stats.maxWeight,15000);assert.ok(s.survivalRun.kit.pending.bags.includes('campus'));s.survivalRun.kit.items={water:12};const before=save(s);assert.throws(()=>equipSurvivalLootBag(s,'messenger'));assert.equal(save(s),before);s=dropSurvivalPackItem(s,'water');assert.equal(s.survivalRun.kit.items.water,11);
});
test('loot seeds vary foods, working tools and actual backpack finds while remaining reproducible',()=>{
 const kinds=new Set(),bags=new Set();for(let seed=1;seed<=512;seed++){const a=createSurvivalPack(seed),b=createSurvivalPack(seed),pool=createPackLoot(a);assert.deepEqual(pool,createPackLoot(b));for(const id of Object.keys(pool.items))kinds.add(id);for(const id of pool.bags)bags.add(id);}assert.ok(kinds.has('canned'));assert.ok(kinds.has('energybar'));assert.ok(kinds.has('tape'));assert.ok(bags.has('hiking'));assert.ok(bags.has('duffel'));
});
test('food, aid and repair tools consume real items and the stated camp action costs',()=>{
 let s=camp();s.survivalRun.kit.items={canned:1,firstaid:1,repairkit:1,tape:1};s.survivalRun.members[0].fatigue=50;s.survivalRun.members[0].injury=1;s=useSurvivalPackItem(s,'canned');assert.equal(s.survivalRun.members[0].fatigue,38);assert.equal(s.survivalRun.actions,3);s=useSurvivalPackItem(s,'firstaid');assert.equal(s.survivalRun.members[0].injury,0);assert.equal(s.survivalRun.actions,2);s=useSurvivalPackItem(s,'repairkit');assert.equal(s.survivalRun.base.integrity,88);s=useSurvivalPackItem(s,'tape');assert.equal(s.survivalRun.base.integrity,94);assert.equal(s.survivalRun.actions,0);assert.throws(()=>useSurvivalPackItem(s,'repairkit'));
});
test('rations use packed food, sealed cans and water before declaring a shortage',()=>{
 let s=camp();s.survivalRun.resources.food=0;s.survivalRun.resources.water=0;s.survivalRun.kit.items={food:1,canned:1,water:2};s=finishSurvivalDay(s);assert.equal(s.survivalRun.shortage,0);assert.equal(s.survivalRun.kit.items.food,0);assert.equal(s.survivalRun.kit.items.canned,0);assert.equal(s.survivalRun.kit.items.water,0);assert.match(s.survivalRun.log[0],/가방/);
});
test('sorties own only packed supplies, preserve the warehouse, and return consumed contents once',()=>{
 let s=camp();const common=structuredClone(s.survivalRun.resources);s=launchSurvivalSortie(s,'supply');assert.deepEqual(s.survivalRun.resources,common);assert.equal(s.combatTrial.stash.items.water,2);assert.deepEqual(s.survivalRun.kit.items,{});assert.throws(()=>transferSurvivalPack(s,'take','water'));s=gridAct(s,'taei','drink');s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.kit.items.water,1);assert.deepEqual(s.survivalRun.resources,common);assert.throws(()=>returnSurvivalSortie(s));
});
test('tactical cache pickups and capacity checks persist; earned mission supplies must be packed',()=>{
 let s=launchSurvivalSortie(camp(),'supply');s.combatTrial.actors.taei.x=3;s.combatTrial.actors.taei.y=2;s=gridAct(s,'taei','loot');assert.ok(s.combatTrial.survivalPack.pending);s=combatPackAction(s,'take','water');const taken=s.combatTrial.stash.items.water;s=restore(save(s));assert.equal(s.combatTrial.stash.items.water,taken);s.combatTrial.status='victory';settleCombatRewards(s.combatTrial);assert.equal(s.combatTrial.survivalPack.pending.items.food,3);assert.equal(s.combatTrial.stash.items.food??0,0);const before=save(s);settleCombatRewards(s.combatTrial);assert.equal(save(s),before);s=combatPackAction(s,'take','food');s=returnSurvivalSortie(s);assert.equal(s.survivalRun.kit.items.food,1);assert.equal(s.survivalRun.resources.food,20);
});
test('retreat retains only actual picked loot, not unpicked finds or success bonuses',()=>{
 let s=launchSurvivalSortie(camp(),'supply');s.combatTrial.actors.taei.x=3;s.combatTrial.actors.taei.y=2;s=gridAct(s,'taei','loot');s.combatTrial.survivalPack.pending.bags=['duffel'];s=combatPackAction(s,'bag','duffel');s=combatPackAction(s,'take','bandage');s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.kit.items.bandage,2);assert.equal(s.survivalRun.kit.bag,'duffel');assert.equal(s.survivalRun.kit.pending,null);assert.equal(s.survivalRun.resources.food,20);
});
test('energy bars and medical pouches spend tactical AP; found bottles extend lure stock',()=>{
 let s=camp();s.survivalRun.kit.items={energybar:2,firstaid:1,bottle:1};s=launchSurvivalSortie(s,'supply');s.combatTrial.actors.taei.stamina=50;s.combatTrial.actors.taei.wounds=1;s=gridAct(s,'taei','eat',{item:'energybar'});assert.equal(s.combatTrial.actors.taei.stamina,62);assert.equal(s.combatTrial.actors.taei.ap,1);s=gridAct(s,'taei','firstaid',{item:'firstaid'});assert.equal(s.combatTrial.actors.taei.wounds,0);s=endGridTurn(s);s.combatTrial.items.lure=0;assert.ok(tacticalLureTargets(s,'taei').length);s=gridAct(s,'taei','lure',{x:5,y:2});assert.equal(s.combatTrial.stash.items.bottle,0);
});
test('legacy saves keep original stores and in-flight supply ownership until explicitly upgraded',()=>{
 let s=camp();delete s.survivalRun.kit;const water=s.survivalRun.resources.water;s=launchSurvivalSortie(s,'supply');assert.equal(s.survivalRun.resources.water,0);assert.equal(s.combatTrial.stash.items.water,water);assert.throws(()=>initializeSurvivalPack(s));s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.resources.water,water);s=initializeSurvivalPack(s);assert.deepEqual(s.survivalRun.kit.items,{});assert.equal(s.survivalRun.resources.water,water);s=prepareSurvivalPack(s);assert.equal(s.survivalRun.kit.items.water,2);assert.equal(s.survivalRun.resources.water,water-2);
});
