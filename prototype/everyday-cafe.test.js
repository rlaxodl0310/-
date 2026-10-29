import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,newAfternoonScenario,save,restore} from './simulation.js';
import {arrive} from './encounters.js';
import {chooseCafeDrink,setCafeTemperature,payCafeOrder,collectCafeOrder,drinkCafeOrder,cafeOrderView,cancelCafeDraft} from './cafe-life.js';
import {varyEverydayAction,everydayEventView,resolveEverydayEvent} from './everyday-life.js';
const cafe=()=>({...newGame(),location:'cafe'});
test('order needs choices and actual payment, grants one real drink only on collection, and resumes safely',()=>{
 let s=cafe();assert.throws(()=>payCafeOrder(s));s=chooseCafeDrink(s,'latte');assert.equal(cafeOrderView(s).spent,0);assert.equal(s.inventory.length,0);assert.throws(()=>payCafeOrder(s));
 s=setCafeTemperature(s,'hot');s=payCafeOrder(s);assert.equal(s.cafeLife.spent,3800);assert.ok(s.clock.minute>540);assert.equal(s.inventory.length,0);assert.throws(()=>payCafeOrder(s));
 s=collectCafeOrder(restore(save(s)));assert.equal(s.inventory.length,1);assert.equal(s.inventory[0].quantity,1);assert.throws(()=>collectCafeOrder(s));s=drinkCafeOrder(s);assert.equal(s.inventory.length,0);assert.throws(()=>drinkCafeOrder(s));assert.equal(s.cafeLife.orders.length,1);
});
test('cancelling a draft, wrong locations and view reads do not spend or create belongings',()=>{
 let s=setCafeTemperature(chooseCafeDrink(cafe(),'tea'),'iced');s=cancelCafeDraft(s);assert.equal(s.cafeLife.orders.length,0);assert.equal(s.cafeLife.spent,0);const snapshot=save(s);cafeOrderView(s);assert.equal(save(s),snapshot);assert.throws(()=>chooseCafeDrink(newGame(),'latte'));
});
test('counter leads to ordering rather than a repeat conversation or unearned coffee',()=>{
 const s=newAfternoonScenario();s.day=2;s.location='cafe';const r=arrive(s,'cafe','counter');assert.equal(r.encounter,null);assert.match(r.observation,/메뉴.*가격/);assert.equal(r.state.inventory.length,0);
 const first=arrive(s,'cafe');assert.ok(first.encounter);assert.doesNotMatch(first.encounter.action,/앉아도|가방을 놓/);assert.doesNotMatch(first.encounter.text,/커피를 받아/);assert.equal(first.state.contacts.seoyeon.introduced,false);
});
test('repeated activity details vary with saved history, but an already committed instant never rerolls',()=>{
 let s={...newGame(),location:'library',everydayLife:{rng:123,history:[],pending:null,sequence:0}};
 let a=varyEverydayAction(s,{action:'read',text:'책을 읽었다.'});const before=save(a.state);const repeated=varyEverydayAction(a.state,{action:'read',text:'책을 읽었다.'});assert.equal(repeated.text,a.text);assert.equal(save(repeated.state),before);
 const snapshot=restore(save(a.state));snapshot.clock.minute+=30;const b=varyEverydayAction(snapshot,{action:'read',text:'책을 읽었다.'});assert.notEqual(b.text,a.text);assert.deepEqual(varyEverydayAction(snapshot,{action:'read',text:'책을 읽었다.'}),b);
});
test('contextual random events offer actual choices, survive saving, resolve once and preserve unknown identities',()=>{
 let found;
 for(let seed=1;seed<200&&!found;seed++){
  const s={...newGame(),location:'field',everydayLife:{rng:seed,history:[],pending:null,sequence:0}};const r=varyEverydayAction(s,{action:'jog',text:'달렸다.'});if(everydayEventView(r.state))found=r.state;
 }
 assert.ok(found);const event=everydayEventView(found);assert.equal(event.id,'rolling-ball');const before=save(found);everydayEventView(found);assert.equal(save(found),before);
 const loaded=restore(before);assert.deepEqual(everydayEventView(loaded),event);const r=resolveEverydayEvent(loaded,event.choices[0].id);assert.equal(r.state.clock.minute,found.clock.minute);assert.deepEqual(r.state.relations,found.relations);assert.equal(r.state.inventory.length,0);assert.equal(Object.values(r.state.contacts).some(c=>c.introduced),false);assert.throws(()=>resolveEverydayEvent(r.state,event.choices[0].id));
});
test('events have a real cooldown and do not all trigger in every run',()=>{
 const outcomes=new Set();for(let seed=1;seed<=200;seed++){const s={...newGame(),location:'field',everydayLife:{rng:seed*7291,history:[],pending:null,sequence:0}};outcomes.add(!!everydayEventView(varyEverydayAction(s,{action:'jog',text:'달렸다.'}).state));}assert.equal(outcomes.size,2);
});
