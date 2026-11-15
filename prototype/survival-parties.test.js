import {decideSupplyDebate,supplyDebatePending} from './supply-debate.js';
import {sixPartyRoute} from './survival-parties-fixtures.js';
import {combatPackAction} from './survival-pack.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,launchSurvivalSortie,returnSurvivalSortie,finishSurvivalDay,claimSurvivalBase} from './survival-base.js';
import {ensureSurvivalParties,playerSurvivalParty,currentSurvivalMembers,survivalResidentCapacity,createSurvivalParty,moveSurvivalPartyMember,dissolveSurvivalParty,meetSurvivalRecruit,meetSurvivalResident,discussSurvivalRecruit,inviteSurvivalRecruit,dispatchSurvivalParty,resolveSurvivalPartyMissions} from './survival-parties.js';
import {gridAct,endGridTurn,tacticalPaths,tacticalTargets,tacticalCanOpen} from './combat-grid.js';
import {survivalAdviceView,refreshSurvivalAdvice} from './survival-advice.js';
import {survivalPage} from './survival-ui.js';
import {combatGridPage} from './combat-grid-ui.js';
import {combatMissionProgress} from './combat-missions.js';
function solo(){return startSurvival(newGame(),'solo',{seed:6});}
function colony(count=12){const s=solo(),r=s.survivalRun;Object.assign(r,{day:4,stage:'base',base:{site:'basement',integrity:90,exposure:0,facilities:['annex']},resources:{food:50,water:50,parts:10,bandage:5}});for(let i=1;i<count;i++)r.members.push({...structuredClone(r.members[0]),key:i===1?'ally':'member-'+i,character:'student',label:'학생 '+i,partyConsent:true,fatigue:15,stress:20});return s;}
function fillPlayer(s){for(const m of s.survivalRun.members.slice(1,6))s=moveSurvivalPartyMember(s,m.key,'party-1');return s;}
test('fresh survival is solo; legacy membership migrates once without dropping contacts or rewriting school bonds',()=>{
 const s=solo();assert.equal(startSurvival(newGame()).survivalRun.members.length,1);assert.equal(s.survivalRun.members.length,1);assert.deepEqual(playerSurvivalParty(s.survivalRun).members,['taei']);assert.ok(survivalPage(s,'parties').includes('주변에서 사람 만나기'));assert.ok(!survivalPage(newGame()).includes('id="survival-companion"'));
 const old=startSurvival(newGame(),'student'),before=save(old);assert.ok(!old.survivalRun.parties);ensureSurvivalParties(old);assert.deepEqual(playerSurvivalParty(old.survivalRun).members,['taei','ally']);const id=save(old);ensureSurvivalParties(old);assert.equal(save(old),id);assert.deepEqual(restore(save(old)),old);assert.ok(before);
});
test('actual encounter, all three relationship values, trust floor, promises and saved refusal decide consent',()=>{
 let s=solo();s.contacts.seoyeon={introduced:true,nameLevel:'full'};s.relations['seoyeon>taei']={familiarity:90,trust:0,affection:95,tension:0};s=meetSurvivalRecruit(s,'seoyeon');const actions=s.survivalRun.actions;s=inviteSurvivalRecruit(s,'party-1');assert.equal(s.survivalRun.members.length,1);assert.equal(s.survivalRun.actions,actions);assert.match(s.survivalRun.log[0],/믿고/);assert.throws(()=>inviteSurvivalRecruit(restore(save(s)),'party-1'),/오늘/);
 s.survivalRun.day++;s.survivalRun.actions=3;s=meetSurvivalRecruit(s,'seoyeon');s.survivalRun.parties.bonds.seoyeon={familiarity:40,trust:45,affection:0,tension:0};s=inviteSurvivalRecruit(s,'party-1');assert.equal(s.survivalRun.members.length,2);assert.equal(s.survivalRun.members[1].injury,1);assert.equal(s.survivalRun.members[1].partyConsent,true);
 let waiting=solo();waiting=meetSurvivalRecruit(waiting,'survivor-1');waiting.survivalRun.parties.bonds['survivor-1']={familiarity:100,trust:100,affection:100,tension:0};waiting=inviteSurvivalRecruit(waiting,'party-1');assert.match(waiting.survivalRun.log[0],/약속/);assert.equal(waiting.survivalRun.members.length,1);assert.throws(()=>inviteSurvivalRecruit(solo(),'party-1'));
});
test('listening/help use actual time and resources, do not guarantee joining, and cannot be farmed per day',()=>{
 let s=meetSurvivalRecruit(solo(),'survivor-2');const water=s.survivalRun.resources.water+s.survivalRun.kit.items.water;s=discussSurvivalRecruit(s,'listen');s=discussSurvivalRecruit(s,'help');assert.equal(s.survivalRun.actions,0);assert.equal(s.survivalRun.resources.water+s.survivalRun.kit.items.water,water-1);assert.ok(s.survivalRun.parties.bonds['survivor-2'].trust>0);s=inviteSurvivalRecruit(s,'party-1');assert.equal(s.survivalRun.members.length,1);s.survivalRun.actions=1;assert.throws(()=>discussSurvivalRecruit(s,'help'));
 s.survivalRun.day++;assert.throws(()=>discussSurvivalRecruit(s,'listen'),/만남/);
});
test('six-person cap, one membership per person, reserve, multiple one-person squads, disband and deployment locks',()=>{
 let s=fillPlayer(colony());assert.equal(currentSurvivalMembers(s.survivalRun).length,6);assert.throws(()=>moveSurvivalPartyMember(s,'member-6','party-1'),/6명/);assert.throws(()=>moveSurvivalPartyMember(s,'taei','reserve'));
 s=createSurvivalParty(s,'member-6','보급팀');s=createSurvivalParty(s,'member-7','경계팀');assert.equal(s.survivalRun.parties.groups.length,3);s=moveSurvivalPartyMember(s,'member-8','party-2');s=moveSurvivalPartyMember(s,'member-9','party-3');s=dispatchSurvivalParty(s,'party-2','supply');assert.throws(()=>moveSurvivalPartyMember(s,'member-6','party-3'));assert.throws(()=>dissolveSurvivalParty(s,'party-2'));assert.throws(()=>dispatchSurvivalParty(s,'party-2','supply'));s=dissolveSurvivalParty(s,'party-3');assert.ok(!s.survivalRun.parties.groups.some(p=>p.members.includes('member-7')));assert.equal(survivalResidentCapacity(s.survivalRun),14);
});
test('two background parties resolve once, consume one ration per member and coexist with the player expedition',()=>{
 let s=fillPlayer(colony());s=createSurvivalParty(s,'member-6','보급팀');s=createSurvivalParty(s,'member-9','경계팀');for(const key of ['member-7','member-8'])s=moveSurvivalPartyMember(s,key,'party-2');for(const key of ['member-10','member-11'])s=moveSurvivalPartyMember(s,key,'party-3');s=dispatchSurvivalParty(s,'party-2','supply');s=dispatchSurvivalParty(s,'party-3','guard');assert.equal(s.survivalRun.resources.food,44);s=launchSurvivalSortie(s,'supply');assert.equal(Object.keys(s.combatTrial.actors).length,6);assert.ok(!Object.values(s.combatTrial.actors).some(a=>a.memberKey==='member-6'));s=returnSurvivalSortie(s,{abandon:true});s=finishSurvivalDay(restore(save(s)));assert.equal(s.survivalRun.parties.reports.length,2);assert.ok(s.survivalRun.parties.reports.every(p=>p.success));assert.equal(s.survivalRun.resources.food,43);assert.ok(s.survivalRun.members.every(m=>!m.deployment));const food=s.survivalRun.resources.food;assert.deepEqual(resolveSurvivalPartyMissions(s),[]);assert.equal(s.survivalRun.resources.food,food);
});
test('rescued residents must consent before party assignment; acceptance reuses their resident identity',()=>{
 let s=colony(2);s.survivalRun.members[1].partyConsent=false;assert.throws(()=>moveSurvivalPartyMember(s,'ally','party-1'),/뜻/);assert.throws(()=>createSurvivalParty(s,'ally'));s=meetSurvivalResident(s,'ally');s.survivalRun.parties.bonds['resident-ally']={familiarity:70,trust:70,affection:30,tension:0};s=inviteSurvivalRecruit(s,'party-1');assert.equal(s.survivalRun.members.length,2);assert.equal(s.survivalRun.members[1].partyConsent,true);assert.deepEqual(playerSurvivalParty(s.survivalRun).members,['taei','ally']);
});
test('solo escape is playable with live enemies and no fictional ally; success uses the actual actor count',()=>{
 let s=launchSurvivalSortie(solo(),'escape');assert.deepEqual(Object.keys(s.combatTrial.actors),['taei']);assert.match(combatMissionProgress(s.combatTrial),/\/1명/);assert.ok(combatGridPage(s).includes('data-unit="taei"'));
 const trace=[['move',{x:5,y:4}],['strike',{id:1}],['end'],['strike',{id:1}],['move',{x:5,y:3}],['end'],['shove',{id:2}],['move',{x:7,y:4}],['end'],['move',{x:9,y:3}],['door'],['end'],['door'],['move',{x:11,y:3}]];
 for(const [a,t] of trace)s=a==='end'?endGridTurn(s):gridAct(s,'taei',a,t);assert.equal(s.combatTrial.status,'escaped');s=returnSurvivalSortie(s);assert.equal(s.survivalRun.escapes,1);assert.equal(s.survivalRun.members.length,1);
});
test('six actual combat actors receive individual AP, wounds, targeting and saved extraction state',()=>{
 let s=launchSurvivalSortie(fillPlayer(colony(6)),'kiosk');const b=s.combatTrial;assert.equal(Object.keys(b.actors).length,6);assert.equal(new Set(Object.values(b.actors).map(a=>a.x+','+a.y)).size,6);assert.equal(Object.values(b.actors).reduce((n,a)=>n+a.ap,0),12);assert.equal((combatGridPage(s).match(/class="tactic-card /g)??[]).length,6);
 // Inspect a casualty other than the old fixed ally, carry it, and verify real identity on return.
 b.enemies=[];Object.assign(b.actors['member-2'],{x:2,y:3,down:true,wounds:3,ap:0});s=gridAct(s,'taei','rescue');assert.equal(s.combatTrial.carriedKey,'member-2');assert.throws(()=>gridAct(s,'member-2','guard'));s=gridAct(s,'taei','move',{x:4,y:4});assert.equal(s.combatTrial.actors['member-2'].x,4);s=returnSurvivalSortie(restore(save(s)),{abandon:true});assert.equal(s.survivalRun.members.find(m=>m.key==='member-2').injury,3);assert.equal(s.survivalRun.members.find(m=>m.key==='member-4').injury,1);
});
test('off-party residents do not speak for the current party and a departed member frees its roster slot',()=>{
 let s=colony(3);s.survivalRun.resources.food=0;s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s),null);s=moveSurvivalPartyMember(s,'ally','party-1');s=refreshSurvivalAdvice(s);assert.equal(survivalAdviceView(s).speaker,'ally');s.survivalRun.members[1].mind={state:'departed'};ensureSurvivalParties(s);assert.deepEqual(playerSurvivalParty(s.survivalRun).members,['taei']);
 let t=fillPlayer(colony(8));t=createSurvivalParty(t,'member-6','별도 보급팀');t=moveSurvivalPartyMember(t,'member-7','party-2');t.survivalRun.resources.food=8;t.survivalRun.resources.water=8;t=dispatchSurvivalParty(t,'party-2','supply');t=refreshSurvivalAdvice(t);assert.equal(survivalAdviceView(t).level,1);
});

test('all six party members can really recover the shop cache and escape against live enemies',()=>{
 let s=launchSurvivalSortie(fillPlayer(colony(6)),'kiosk');for(const [key,action,target] of sixPartyRoute){s=key==='end'?endGridTurn(s):key==='packLeave'?combatPackAction(s,'leave'):gridAct(s,key,action,target);if(supplyDebatePending(s.combatTrial))s=decideSupplyDebate(s,'withdraw');}assert.equal(s.combatTrial.status,'escaped');assert.equal(s.combatTrial.turn,5);assert.ok(Object.values(s.combatTrial.actors).every(a=>a.escaped));s=returnSurvivalSortie(restore(save(s)));assert.equal(currentSurvivalMembers(s.survivalRun).length,6);assert.equal(s.survivalRun.members.find(m=>m.key==='member-4').injury,1);
});
test('background failure, unavailable duties and camp capacity have real consequences',()=>{
 let s=colony(3);s=createSurvivalParty(s,'ally','위험 보급팀');s.survivalRun.threat=99;s=dispatchSurvivalParty(s,'party-2','supply');const food=s.survivalRun.resources.food;const reports=resolveSurvivalPartyMissions(s);assert.equal(reports.length,1);assert.equal(s.survivalRun.parties.delays[0].status,'pending');assert.equal(s.survivalRun.members[1].deployment,'party-2');assert.equal(s.survivalRun.resources.food,food);assert.equal(s.survivalRun.members[1].injury,1);assert.throws(()=>dispatchSurvivalParty({...s,survivalRun:{...s.survivalRun,resources:{food:0,water:0}}},'party-2','guard'));
 let t=colony(8);t.survivalRun.base=null;t.survivalRun.stage='settlement';assert.equal(survivalResidentCapacity(t.survivalRun),8);t=meetSurvivalRecruit(t,'survivor-2');t.survivalRun.parties.bonds['survivor-2']={familiarity:80,trust:80,affection:80,tension:0};t=inviteSurvivalRecruit(t,'party-1');assert.match(t.survivalRun.log[0],/공간/);t.survivalRun.scouted.basement=true;t.survivalRun.secured.basement=true;Object.assign(t.survivalRun.exploration.rooms.basement,{occupants:0,confirmed:true});assert.equal(claimSurvivalBase(t,'basement').survivalRun.base.site,'basement');
});
test('a six-person roster without the legacy ally key controls and updates only its actual members',()=>{
 let s=fillPlayer(colony(7));s=moveSurvivalPartyMember(s,'ally','reserve');s=moveSurvivalPartyMember(s,'member-6','party-1');s=launchSurvivalSortie(s,'kiosk');assert.equal(s.combatTrial.actors.ally,undefined);assert.equal(Object.keys(s.combatTrial.actors).length,6);assert.ok(combatGridPage(s,'ally').includes('학생 6'));s.combatTrial.actors['member-6'].wounds=2;s=returnSurvivalSortie(s,{abandon:true});assert.equal(s.survivalRun.members.find(m=>m.key==='member-6').injury,3);assert.equal(s.survivalRun.members.find(m=>m.key==='ally').injury,0);
});
