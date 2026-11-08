import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save} from './simulation.js';
import {startSurvival,buildSurvivalFacility} from './survival-base.js';
import {shelterSceneView,renderShelterScene} from './shelter-scene.js';
import {survivalPage} from './survival-ui.js';
function sceneFixture(){const s=startSurvival(newGame());Object.assign(s.survivalRun,{stage:'base',day:4,actions:3,base:{site:'basement',integrity:80,facilities:[]}});s.survivalRun.resources.parts=20;return s;}
test('empty shelter has no built furniture and each real construction adds only its own art',()=>{
 let s=sceneFixture();assert.equal(shelterSceneView(s.survivalRun).props.length,0);assert.ok(!renderShelterScene(s.survivalRun).includes('data-facility='));s=buildSurvivalFacility(s,'barricade');assert.deepEqual(shelterSceneView(s.survivalRun).props.map(p=>p.id),['barricade']);assert.ok(renderShelterScene(s.survivalRun).includes('data-facility="barricade"'));assert.ok(!renderShelterScene(s.survivalRun).includes('data-facility="beds"'));s=buildSurvivalFacility(s,'beds');assert.equal(shelterSceneView(s.survivalRun).props.length,2);assert.equal(s.survivalRun.resources.parts,16);
});
test('room backgrounds differ and inspecting built facilities never changes a save',()=>{
 const s=sceneFixture();s.survivalRun.base.facilities=['barricade','beds','clinic','workshop'];const before=save(s);for(const id of s.survivalRun.base.facilities){assert.ok(renderShelterScene(s.survivalRun,id).includes('prop-selected'));survivalPage(s,'base','',id);}assert.equal(save(s),before);const frames=[];for(const site of ['arts401','library','basement']){s.survivalRun.base.site=site;frames.push(shelterSceneView(s.survivalRun).room);}assert.deepEqual(frames,[0,1,2]);assert.equal(shelterSceneView({}),null);
});
