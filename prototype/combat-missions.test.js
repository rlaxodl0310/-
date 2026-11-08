import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startGridCombat,gridAct,endGridTurn,tacticalPaths,tacticalCanOpen} from './combat-grid.js';
import {combatMissionInfo,combatMissionWon,combatMissionProgress} from './combat-missions.js';
import {combatGridPage} from './combat-grid-ui.js';
import {combatSetupPage} from './combat-ui.js';
const missionBattle=mission=>startGridCombat(newGame(),'student',mission);
test('three mission choices have distinct rules and old grid saves remain escape missions',()=>{
 const s=newGame(),html=combatSetupPage(s);for(const id of ['escape','eliminate','protect'])assert.ok(html.includes(`value="${id}"`));assert.throws(()=>startGridCombat(s,'student','unknown'));
 const old=missionBattle('escape');delete old.combatTrial.mission;assert.equal(combatMissionInfo(old.combatTrial).label,'동반 탈출');assert.equal(restore(save(old)).combatTrial.mission,undefined);
});
test('elimination wins without leaving and includes reinforcements drawn by noise',()=>{
 let s=missionBattle('eliminate');s.combatTrial.enemies.forEach(e=>e.balance=0);s=gridAct(s,'taei','guard');assert.equal(s.combatTrial.status,'victory');assert.equal(s.combatTrial.actors.taei.escaped,false);assert.equal(combatMissionWon(s.combatTrial),true);
 s=missionBattle('eliminate');s.combatTrial.enemies.forEach(e=>e.balance=0);s.combatTrial.noise=6;s=gridAct(s,'taei','guard');assert.equal(s.combatTrial.status,'active');assert.ok(combatMissionProgress(s.combatTrial).includes('접근 중'));s=endGridTurn(s);assert.equal(s.combatTrial.enemies.length,3);assert.equal(s.combatTrial.status,'active');s.combatTrial.enemies[2].balance=0;s=gridAct(s,'taei','guard');assert.equal(s.combatTrial.status,'victory');
});
test('protect mission shows an immobile target and does not finish just because enemies are defeated',()=>{
 let s=missionBattle('protect');assert.ok(!tacticalPaths(s,'taei').some(p=>p.x===6&&p.y===3));assert.equal(tacticalCanOpen(s,'taei'),false);assert.throws(()=>gridAct(s,'protected','guard'));s.combatTrial.enemies.forEach(e=>e.balance=0);s=gridAct(s,'taei','guard');assert.equal(s.combatTrial.status,'active');assert.equal(s.combatTrial.protection.held,0);for(let i=0;i<4;i++)s=endGridTurn(s);assert.equal(s.combatTrial.status,'victory');assert.equal(s.combatTrial.protection.held,4);assert.ok(combatMissionProgress(s.combatTrial).includes('4/4'));
});
test('enemies prioritize the protected student and adjacent guarding prevents injuries for four real rounds',()=>{
 let s=missionBattle('protect'),before=structuredClone(s);for(let round=0;round<4;round++){s=gridAct(s,'taei','guard');s=endGridTurn(s);}assert.equal(s.combatTrial.status,'victory');assert.equal(s.combatTrial.protection.wounds,0);assert.ok(s.combatTrial.history.some(h=>h.text.includes('보호 대상 · 접근을 막아냈다')));delete s.combatTrial;delete before.combatTrial;assert.deepEqual(s,before);
 let exposed=missionBattle('protect');exposed=endGridTurn(exposed);assert.ok(exposed.combatTrial.protection.wounds>0);assert.equal(exposed.combatTrial.actors.taei.wounds,0);assert.ok(exposed.combatTrial.frames.some(f=>f.target==='protected'));
});
test('protection failure takes precedence over final-turn survival and ally danger remains separate',()=>{
 let s=missionBattle('protect');s.combatTrial.protection.held=3;s.combatTrial.protection.wounds=2;s=endGridTurn(s);assert.equal(s.combatTrial.status,'failed');assert.equal(s.combatTrial.protection.held,3);assert.ok(!combatMissionWon(s.combatTrial));
 s=missionBattle('protect');s.combatTrial.enemies=[];s.combatTrial.actors.taei.down=true;s.combatTrial.protection.held=3;s=endGridTurn(s);assert.equal(s.combatTrial.status,'failed');
});
test('mission, protected target and countdown survive save/load and do not reroll on display',()=>{
 let s=missionBattle('protect');s=gridAct(s,'taei','guard');s=endGridTurn(s);const saved=save(s),r=restore(saved);assert.deepEqual(r.combatTrial,s.combatTrial);for(let i=0;i<3;i++){combatMissionInfo(r.combatTrial);combatMissionProgress(r.combatTrial);combatGridPage(r);}assert.equal(save(r),saved);assert.ok(combatGridPage(r).includes('data-unit="protected"'));assert.ok(!combatGridPage(r).includes('class="tactical-door-action"'));
});
