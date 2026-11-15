import test from 'node:test';import assert from 'node:assert/strict';
import {characterHeightProfiles,characterHeightCm,characterHeightScale,knownCharacterHeight,canAskCharacterHeight,askCharacterHeight,characterHeightCatalog} from './character-heights.js';
import {newAfternoonScenario,newReturningGame,save,restore} from './simulation.js';
import {characterStatsContent} from './character-stats-ui.js';
import {introduce} from './identity.js';
import {characterVisual} from './character-visuals.js';
function ready(){const s=newAfternoonScenario('close');s.clock.minute=780;s.location='hall';return s;}
test('confirmed heights are exact and proposals stay separate from game facts',()=>{
 const expected={taei:179,seoha:167,doyun:182,nakyeong:161,haerin:163,subin:172,yeogyeong:162,seoyeon:160,soyul:165,iseo:158,chaewon:164};for(const [id,cm] of Object.entries(expected))assert.equal(characterHeightCm(id),cm);assert.equal(characterHeightCm('dogyeom'),null);assert.equal(characterHeightCm('naeun'),null);assert.equal(characterHeightCm('missing'),null);assert.equal(Object.keys(characterHeightProfiles).length,18);
 assert.equal(characterVisual('seoyeon').heightScale,160/183);assert.equal(characterHeightScale('iseo')/characterHeightScale('taei'),158/179);
});
test('height queries and viewing cannot modify ability rolls, growth, relationships, time or legacy saves',()=>{
 for(const s of [newReturningGame(),ready()]){const before=save(s);characterHeightCatalog();characterStatsContent(s);for(const id of Object.keys(characterHeightProfiles)){characterHeightCm(id);characterHeightScale(id);knownCharacterHeight(s,id);canAskCharacterHeight(s,id);}assert.equal(save(s),before);assert.deepEqual(restore(save(s)).characterSystem,s.characterSystem);}
});
test('names alone do not reveal exact height; real same-place question spends 2 minutes and persists once',()=>{
 let s=ready();introduce(s,'seoyeon');assert.equal(knownCharacterHeight(s,'seoyeon'),null);assert.ok(canAskCharacterHeight(s,'seoyeon'));const minute=s.clock.minute,relations=structuredClone(s.relations),abilities=structuredClone(s.characterSystem);const result=askCharacterHeight(s,'seoyeon');assert.match(result.text,/160cm/);assert.equal(s.clock.minute,minute);s=restore(save(result.state));assert.equal(s.clock.minute,minute+2);assert.equal(knownCharacterHeight(s,'seoyeon'),160);assert.equal(s.contacts.seoyeon.heightSource.kind,'direct-conversation');assert.deepEqual(s.relations,relations);assert.deepEqual(s.characterSystem,abilities);assert.ok(!canAskCharacterHeight(s,'seoyeon'));const before=save(s);assert.throws(()=>askCharacterHeight(s,'seoyeon'));assert.equal(save(s),before);assert.match(characterStatsContent(s),/키 · 160cm/);
});
test('unknown, distant, uncomfortable and absent people cannot be queried or expose height',()=>{
 for(const edit of [s=>s.contacts.seoyeon.introduced=false,s=>s.location='market',s=>s.relations['seoyeon>taei']={familiarity:0,trust:0},s=>s.relations['seoyeon>taei'].tension=5,s=>s.appointments.push({day:s.day,minute:s.clock.minute+1,status:'pending'})]){const s=ready();introduce(s,'seoyeon');edit(s);const before=save(s);assert.equal(canAskCharacterHeight(s,'seoyeon'),false);assert.throws(()=>askCharacterHeight(s,'seoyeon'));assert.equal(save(s),before);assert.equal(knownCharacterHeight(s,'seoyeon'),null);}
 const s=ready();assert.equal(knownCharacterHeight(s,'taei'),179);assert.ok(!canAskCharacterHeight(s,'dogyeom'));assert.match(characterHeightCatalog(),/183cm · 제안/);
});
