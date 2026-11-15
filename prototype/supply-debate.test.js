import test from 'node:test';
import assert from 'node:assert/strict';
import {save,restore} from './simulation.js';
import {launchSurvivalSortie,returnSurvivalSortie} from './survival-base.js';
import {moveSurvivalPartyMember,playerSurvivalParty} from './survival-parties.js';
import {gridAct,endGridTurn,tacticalEnemyIntents} from './combat-grid.js';
import {combatPackAction} from './survival-pack.js';
import {beginSupplyDebate,decideSupplyDebate,supplyDebatePending,supplyDebateBlocked,discussSupplyAftermath} from './supply-debate.js';
import {refreshSurvivalAdvice,survivalAdviceView,respondSurvivalAdvice} from './survival-advice.js';
import {combatGridPage} from './combat-grid-ui.js';
import {survivalPage} from './survival-ui.js';
import {debateCampaign,supplyRescueRoute} from './supply-debate-fixtures.js';
function sortie(){return launchSurvivalSortie(debateCampaign(),'kiosk');}
function atCache(s=sortie()){Object.assign(s.combatTrial.actors.taei,{x:5,y:1,ap:2});return gridAct(s,'taei','loot');}
function escort(s){Object.assign(s.combatTrial.actors.taei,{x:7,y:1,ap:2});return gridAct(s,'taei','supplyRescue');}
function extract(s){const b=s.combatTrial;b.enemies=[];b.door=2;for(const [k,a]of Object.entries(b.actors))if(k!=='taei')a.escaped=true;Object.assign(b.actors.taei,{x:9,y:3,ap:2});return gridAct(s,'taei','move',{x:11,y:3});}
function liveRescue(){let s=sortie();for(const [k,a,t]of supplyRescueRoute)s=k==='end'?endGridTurn(s):k==='decision'?decideSupplyDebate(s,a):k==='packLeave'?combatPackAction(s,'leave'):gridAct(s,k,a,t);return s;}
test('voices start only after a real shop cache interaction and include only actual conscious companions',()=>{
 let s=sortie();assert.equal(s.combatTrial.supplyDebate,undefined);s=gridAct(s,'taei','guard');assert.equal(s.combatTrial.supplyDebate,undefined);s=atCache(s);assert.equal(s.combatTrial.supplyDebate.opinions.length,2);assert.deepEqual(s.combatTrial.supplyDebate.opinions.map(o=>o.stance),['rescue','withdraw']);assert.equal(s.combatTrial.supplyDebate.context.size,3);
 let solo=debateCampaign();solo=moveSurvivalPartyMember(solo,'ally','reserve');solo=moveSurvivalPartyMember(solo,'member-2','reserve');solo=atCache(launchSurvivalSortie(solo,'kiosk'));assert.equal(solo.combatTrial.supplyDebate,undefined);
 let down=sortie();down.combatTrial.actors.ally.down=true;down.combatTrial.actors.ally.wounds=3;down=atCache(down);assert.equal(down.combatTrial.supplyDebate.context.wounded,1);assert.deepEqual(down.combatTrial.supplyDebate.opinions.map(o=>o.key),['member-2']);
});
test('personal wounds, a hurt friend and shared trust can change stance instead of fixing a good/bad character role',()=>{
 let s=sortie();s.relations['seoyeon>dogyeom']={trust:20,affection:15};s.combatTrial.actors['member-2'].wounds=1;s=atCache(s);const o=s.combatTrial.supplyDebate.opinions[0];assert.equal(o.stance,'withdraw');assert.match(o.line,/윤도겸/);
 let safe=sortie();safe.combatTrial.stash.items.food=6;safe.combatTrial.stash.items.water=6;safe.survivalRun.parties.bonds['member:member-2']={trust:50,affection:50};safe=atCache(safe);assert.equal(safe.combatTrial.supplyDebate.opinions[1].stance,'rescue');
});
test('pending dialogue freezes combat and loot, saves exactly, and rendering does not reroll opinions or consume time',()=>{
 const s=atCache(),before=save(s);assert.equal(supplyDebatePending(s.combatTrial),true);assert.throws(()=>gridAct(s,'taei','guard'),/구조 요청/);assert.throws(()=>endGridTurn(s),/구조 요청/);assert.throws(()=>combatPackAction(s,'take','food'),/결정/);assert.deepEqual(tacticalEnemyIntents(s),[]);for(let i=0;i<3;i++)combatGridPage(s);assert.equal(save(s),before);assert.deepEqual(restore(before),s);assert.deepEqual(restore(before).combatTrial.supplyDebate.opinions,s.combatTrial.supplyDebate.opinions);
});
test('marking uses carried water once, cannot teleport camp water, and persists an actual return plan',()=>{
 const s=atCache(),water=s.combatTrial.stash.items.water,actions=s.combatTrial.actors.taei.ap;let marked=decideSupplyDebate(s,'mark');assert.equal(marked.combatTrial.stash.items.water,water-1);assert.equal(marked.combatTrial.actors.taei.ap,actions);assert.equal(s.combatTrial.stash.items.water,water);assert.throws(()=>decideSupplyDebate(marked,'mark'));marked=returnSurvivalSortie(marked,{abandon:true});assert.equal(marked.survivalRun.supplyStories.sites.kiosk.status,'marked');assert.equal(marked.survivalRun.members.length,3);
 let dry=atCache();dry.combatTrial.stash.items.water=0;dry.combatTrial.items.water=0;assert.ok(dry.survivalRun.resources.water>0);assert.ok(supplyDebateBlocked(dry,'mark'));assert.throws(()=>decideSupplyDebate(dry,'mark'),/생수/);
});
test('a rescue decision has a noise cost and requires physical escort plus real party extraction',()=>{
 let s=decideSupplyDebate(atCache(),'rescue');assert.equal(s.combatTrial.noise,2);assert.throws(()=>gridAct(s,'taei','supplyRescue'),/옆/);s.combatTrial.enemies=[];s.combatTrial.door=2;Object.assign(s.combatTrial.actors.taei,{x:9,y:3,ap:2});assert.throws(()=>gridAct(s,'taei','move',{x:11,y:3}),/학생/);s=escort(s);assert.equal(s.combatTrial.supplyDebate.rescued,true);assert.equal(s.combatTrial.actors.taei.ap,1);assert.throws(()=>gridAct(s,'taei','supplyRescue'));s=extract(s);assert.equal(s.combatTrial.status,'escaped');s=returnSurvivalSortie(s);assert.equal(s.survivalRun.members.length,4);assert.equal(s.survivalRun.members.at(-1).partyConsent,false);assert.equal(playerSurvivalParty(s.survivalRun).members.length,3);assert.throws(()=>moveSurvivalPartyMember(s,s.survivalRun.members.at(-1).key,'party-1'),/뜻/);
});
test('the full authored route really rescues and extracts with live enemies in six turns',()=>{
 let s=liveRescue();assert.equal(s.combatTrial.status,'escaped');assert.equal(s.combatTrial.turn,6);assert.ok(s.combatTrial.supplyDebate.rescued);assert.ok(Object.values(s.combatTrial.actors).every(a=>a.escaped));s=returnSurvivalSortie(restore(save(s)));assert.equal(s.survivalRun.supplyStories.sites.kiosk.status,'rescued');assert.equal(s.survivalRun.supplyStories.records[0].harm,true);assert.equal(s.survivalRun.members.length,4);
});
test('different opinions alone do not deduct affinity and only witnesses receive result memories',()=>{
 let s=decideSupplyDebate(atCache(),'withdraw');const relations=structuredClone(s.relations);s=extract(s);s=returnSurvivalSortie(s);assert.equal(s.survivalRun.members.length,3);assert.deepEqual(s.relations,relations);assert.equal(s.survivalRun.parties.bonds['member:ally'].trust,0);assert.equal(s.survivalRun.parties.bonds['member:ally'].tension,0);assert.match(s.survivalRun.members[1].supplyMemories[0].line,/이해/);assert.equal(s.survivalRun.members[0].supplyMemories,undefined);
});
test('real harm after a rescue makes concerned members cautious and a later discussion can address the tension once',()=>{
 let s=returnSurvivalSortie(liveRescue()),r=s.survivalRun,id=r.supplyStories.records[0].id;assert.equal(r.parties.bonds['member:member-2'].tension,1);assert.equal(r.members.at(-1).supplyMemories,undefined);s=refreshSurvivalAdvice(s);assert.match(survivalAdviceView(s).text,/지난 원정/);const before=save(s);survivalPage(s);assert.equal(save(s),before);s=discussSupplyAftermath(s,id,'listen');assert.equal(s.survivalRun.parties.bonds['member:member-2'].tension,0);assert.equal(s.survivalRun.supplyStories.records[0].debrief,'listen');assert.throws(()=>discussSupplyAftermath(s,id,'explain'));
 // A companion's voiced caution, personally heard last time, enters the next decision.
 s.survivalRun.day++;s.survivalRun.actions=3;for(const m of s.survivalRun.members){m.injury=0;m.woundRisk=0;m.fatigue=15;m.stress=20;}s=launchSurvivalSortie(s,'convenience');s=atCache(s);assert.match(s.combatTrial.supplyDebate.opinions.find(o=>o.key==='ally').line,/지난번.*윤도겸/);
});
test('a marked request can be revisited, a kept promise is acknowledged by its original witnesses, and rescues do not farm duplicates',()=>{
 let s=returnSurvivalSortie(decideSupplyDebate(atCache(),'mark'),{abandon:true});s.survivalRun.day++;s.survivalRun.actions=3;s=atCache(launchSurvivalSortie(s,'kiosk'));assert.equal(s.combatTrial.supplyDebate.previousMark,true);s=decideSupplyDebate(s,'rescue');s=escort(s);s=extract(s);s=returnSurvivalSortie(s);const record=s.survivalRun.supplyStories.records.at(-1);assert.equal(record.keptPromise,true);assert.ok(record.reactions.every(o=>o.line.includes('지켰네')));const count=s.survivalRun.members.length;s.survivalRun.day++;s.survivalRun.actions=3;s=atCache(launchSurvivalSortie(s,'kiosk'));assert.equal(s.combatTrial.supplyDebate,undefined);s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.members.length,count);
});
test('failure or an unfinished debate never creates a rescued resident or a false promise completion',()=>{
 let s=escort(decideSupplyDebate(atCache(),'rescue'));s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.members.length,3);assert.equal(s.survivalRun.supplyStories.records[0].rescued,false);assert.equal(s.survivalRun.supplyStories.records[0].keptPromise,false);
 let interrupted=returnSurvivalSortie(atCache(),{abandon:true});assert.equal(interrupted.survivalRun.supplyStories.records[0].choice,null);assert.ok(interrupted.survivalRun.supplyStories.records[0].reactions.every(o=>o.tone==='unfinished'));
});
test('camp capacity can block rescue without blocking other choices, and forged success is rejected atomically',()=>{
 let full=debateCampaign();while(full.survivalRun.members.length<14){const n=full.survivalRun.members.length;full.survivalRun.members.push({...structuredClone(full.survivalRun.members[0]),key:'waiting-'+n,label:'대기 학생 '+n,character:'student'});}full=atCache(launchSurvivalSortie(full,'kiosk'));assert.ok(supplyDebateBlocked(full,'rescue'));assert.throws(()=>decideSupplyDebate(full,'rescue'),/공간/);assert.equal(decideSupplyDebate(full,'withdraw').combatTrial.supplyDebate.choice,'withdraw');
 let forged=decideSupplyDebate(atCache(),'rescue');for(const a of Object.values(forged.combatTrial.actors))a.escaped=true;forged.combatTrial.status='escaped';const before=save(forged);assert.throws(()=>returnSurvivalSortie(forged),/구조 목표/);assert.equal(save(forged),before);
});

test('an unrescued request becomes a later proposal only for witnesses who cared or made a return plan',()=>{
 let s=returnSurvivalSortie(extract(decideSupplyDebate(atCache(),'withdraw')));assert.equal(survivalAdviceView(refreshSurvivalAdvice(s)),null);s.survivalRun.day++;s=refreshSurvivalAdvice(s);const a=survivalAdviceView(s);assert.equal(a.need,'rescue-request:kiosk');assert.equal(a.speaker,'ally');assert.match(a.reason,/지난번.*구조 요청/);s=respondSurvivalAdvice(s,a.id,'defer');assert.equal(survivalAdviceView(s),null);s.survivalRun.day++;s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).need,'rescue-request:kiosk');s.survivalRun.supplyStories.sites.kiosk.status='rescued';s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s),null);
});
