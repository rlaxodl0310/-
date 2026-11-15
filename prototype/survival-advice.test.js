import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,launchSurvivalSortie,returnSurvivalSortie,survivalAction,finishSurvivalDay} from './survival-base.js';
import {careSurvivalMember,storeAllSurvivalPack} from './survival-pack.js';
import {refreshSurvivalAdvice,survivalAdviceView,respondSurvivalAdvice,survivalAdviceTab} from './survival-advice.js';
import {survivalPage} from './survival-ui.js';
function home(){const s=startSurvival(newGame(),'student',{seed:6});Object.assign(s.survivalRun,{day:4,stage:'base',base:{site:'arts401',integrity:80,exposure:0,facilities:[]},resources:{food:12,water:12,bandage:0,parts:4}});s.survivalRun.kit.items={};s.survivalRun.kit.stock={};return s;}
function scarce(character='student'){const s=home();s.survivalRun.resources.food=0;s.survivalRun.members[1].character=character;return refreshSurvivalAdvice(s);}
function respond(s,decision='defer'){return respondSurvivalAdvice(s,survivalAdviceView(s).id,decision);}
test('party compares food and water with actual ration demand and has character-dependent preferences',()=>{
 const cautious=scarce('soyul'),bold=scarce('dogyeom');assert.equal(survivalAdviceView(cautious).kind,'kiosk');assert.equal(survivalAdviceView(bold).kind,'convenience');assert.equal(survivalAdviceView(bold).speaker,'ally');assert.match(survivalAdviceView(bold).reason,/2명이/);
 let stocked=home();stocked.survivalRun.resources.food=0;stocked.survivalRun.kit.items.canned=4;assert.equal(survivalAdviceView(refreshSurvivalAdvice(stocked)),null);stocked.survivalRun.members.push({...stocked.survivalRun.members[1],key:'rescued-1',label:'구조한 학생'});assert.ok(survivalAdviceView(refreshSurvivalAdvice(stocked)));
});
test('injury without medicine prompts the clinic, then returning medicine prompts treatment rather than another sortie',()=>{
 let s=home();s.survivalRun.members[0].injury=1;s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).kind,'clinic');s=respond(s,'accept');assert.equal(s.survivalRun.actions,3);assert.equal(survivalAdviceTab('clinic'),'clinic');assert.equal(s.survivalRun.activeSortie,null);
 s.survivalRun.kit.items.bandage=1;s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).kind,'care');assert.equal(survivalAdviceView(s).target,'taei');s=respond(s,'accept');s=careSurvivalMember(s,'taei','treat');assert.equal(s.survivalRun.members[0].injury,0);assert.equal(survivalAdviceView(s),null);
 let closed=home();closed.survivalRun.members[0].injury=1;closed.survivalRun.clinicOutcome={rescued:true};assert.equal(survivalAdviceView(refreshSurvivalAdvice(closed)).kind,'search');
});
test('defer survives saves, does not nag after improvement, and permits renewed urgency or a new day',()=>{
 let s=scarce();s=respond(s);assert.equal(survivalAdviceView(s),null);s=restore(save(s));assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)),null);s.survivalRun.resources.food=3;s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s),null);s.survivalRun.day++;s=refreshSurvivalAdvice(s);assert.ok(survivalAdviceView(s));
 let mild=home();mild.survivalRun.resources.food=3;mild=respond(refreshSurvivalAdvice(mild));mild.survivalRun.resources.food=0;mild=refreshSurvivalAdvice(mild);assert.equal(survivalAdviceView(mild).level,3);
});
test('only present party members speak; no absent names, panic proposals or impossible revisits',()=>{
 let s=scarce();s.survivalRun.members[1].mind={state:'away'};assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)),null);s.survivalRun.members[1].mind={state:'panic'};assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)),null);
 s.survivalRun.members.push({...s.survivalRun.members[0],key:'rescued-1',character:'student',label:'구조한 학생',mind:{state:'steady'}});s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).speaker,'rescued-1');assert.ok(!['clinic','kiosk','convenience'].includes(survivalAdviceView(s).kind));
 s=scarce();s.survivalRun.shopVisits={kiosk:4};s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).kind,'convenience');s.survivalRun.shopVisits.convenience=4;assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)).kind,'search');
});
test('food, thirst and exhaustion prompt care and recovery before an unsafe supply trip',()=>{
 let s=scarce();s.survivalRun.members[0].fatigue=85;s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).kind,'rest');s=survivalAction(s,'hide');assert.equal(s.survivalRun.members[0].fatigue,73);assert.ok(survivalAdviceView(s));
 s=home();s.survivalRun.members[0].hydration=10;assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)).kind,'drink');s=careSurvivalMember(s,'taei','water');assert.ok(!survivalAdviceView(s)||survivalAdviceView(s).kind!=='drink');
 s=home();s.survivalRun.members[1].nutrition=15;assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)).kind,'eat');s.survivalRun.members[0].injury=3;s.survivalRun.resources.water=0;s.survivalRun.resources.food=0;assert.ok(!['clinic','kiosk','convenience'].includes(survivalAdviceView(refreshSurvivalAdvice(s)).kind));
});
test('rendering, bag transfers and repeated refreshes do not reroll; stale responses fail without spending anything',()=>{
 let s=scarce();const original=save(s),id=survivalAdviceView(s).id;for(let i=0;i<4;i++)survivalPage(s);assert.equal(save(s),original);s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).id,id);s=storeAllSurvivalPack(s);assert.equal(survivalAdviceView(s).id,id);assert.throws(()=>respondSurvivalAdvice(s,'bad','accept'));assert.throws(()=>respondSurvivalAdvice(s,id,'bad'));
 s.survivalRun.resources.food=12;assert.throws(()=>respondSurvivalAdvice(s,id,'accept'));assert.equal(s.survivalRun.actions,3);assert.equal(s.survivalRun.advice.history.length,0);
});
test('a real sortie suppresses camp conversation and return/day actions reevaluate without changing school state',()=>{
 let s=scarce(),original=structuredClone(s);delete original.survivalRun;const d=survivalAdviceView(s);s=respond(s,'accept');s=launchSurvivalSortie(s,d.kind);assert.equal(survivalAdviceView(s),null);s=returnSurvivalSortie(s,{abandon:true});assert.equal(survivalAdviceView(s).kind,'clinic');s=finishSurvivalDay(s);assert.ok(survivalAdviceView(s));const after=structuredClone(s);delete after.survivalRun;assert.deepEqual(after,original);
});

test('accepting a plan does not immediately trigger another competing need before any world action',()=>{
 let s=scarce();s.survivalRun.members[0].fatigue=85;s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).kind,'rest');s=respond(s,'accept');assert.equal(survivalAdviceView(s),null);assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)),null);s=restore(save(s));assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)),null);s=survivalAction(s,'hide');assert.ok(survivalAdviceView(s));
});
