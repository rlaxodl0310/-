// Authored-mode state regressions; normal generated play is covered by dialogue-generator.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {introduce} from './identity.js';
import {knownGame} from './fixtures.js';
import {npcNow,noteNpcExperience} from './npc-state.js';
import {respond,dialogue} from './dialogue.js';
import {socialIntent} from './social-reasoning.js';
import {evaluateEvents} from './event-engine.js';
function at(minute,id='soyul',profile='friend'){
 const s=newGame(profile);s.dialogue.engine='authored';introduce(s,id,'test-setup');s.clock.minute=minute;s.location=id==='soyul'?'library':'hall';return s;
}
test('same relationship and question produce different conversations before class, resting, and late evening',()=>{
 const openings=[560,790,1170].map(m=>respond(at(m),'soyul','personal'));
 assert.equal(new Set(openings.map(x=>x.result.text)).size,3);
 assert.match(openings[0].result.text,/곧 들어가야/);
 assert.match(openings[1].result.text,/화면 좀 안 보려고/);
 assert.match(openings[2].result.text,/말 많이 못/);
 const busy=dialogue(openings[0].state,'soyul');
 assert.ok(!busy.options.some(o=>o.id==='scene:ctxHelp'||o.id==='scene:ctxTopic'));
});
test('different identities react differently to the same overload and aid depends on trust',()=>{
 const texts=[];
 for(const id of ['yeogyeong','seoyeon','soyul']){
  const make=profile=>{const s=at(850,id,profile);noteNpcExperience(s,id,'offscreen-overload',{stress:60},'load');return respond(s,id,'personal').state;};
  const low=make('acquaintance'),high=make('friend');
  texts.push(dialogue(low,id).opening);
  const a=respond(low,id,'scene:ctxHelp'),b=respond(high,id,'scene:ctxHelp');
  assert.notEqual(a.result.text,b.result.text);
 }
 assert.equal(new Set(texts).size,3);
});
test('pressure can change capacity inside an existing topic; boundaries affect later feelings',()=>{
 let s=respond(knownGame(),'soyul','personal').state;
 noteNpcExperience(s,'soyul','pressure',{stress:65},'outside');
 assert.ok(dialogue(s,'soyul').options.some(o=>o.id==='scene:ctxHelp'));
 s=respond(s,'soyul','scene:ctxHelp').state;
 const before=npcNow(s,'soyul').stress;
 s=respond(s,'soyul','scene:ctxInsist').state;
 assert.ok(npcNow(s,'soyul').stress>before);
 assert.match(dialogue(s,'soyul').opening,/싫다는 말/);
 assert.ok(!dialogue(s,'soyul').options.some(o=>o.id==='scene:ctxTopic'));
});
test('stress fades in game time; reading and save reload neither reroll nor heal mood',()=>{
 const s=at(850);noteNpcExperience(s,'soyul','pressure',{stress:55},'pressure');
 const snapshot=structuredClone(s),now=npcNow(s,'soyul');
 for(let i=0;i<5;i++){npcNow(s,'soyul');dialogue(s,'soyul');}
 assert.deepEqual(s,snapshot);assert.deepEqual(npcNow(restore(save(s)),'soyul'),now);
 s.clock.minute+=240;assert.ok(npcNow(s,'soyul').stress<now.stress);
});
test('the same event is not applied twice and NPC experiences survive saves',()=>{
 const s=at(850);assert.equal(noteNpcExperience(s,'soyul','supported',{warmth:15},'one'),true);
 assert.equal(noteNpcExperience(s,'soyul','supported',{warmth:15},'one'),false);
 assert.equal(s.npcLife.events.length,1);assert.deepEqual(restore(save(s)),s);
 assert.equal(npcNow(s,'soyul').mood,'bright');
});
test('independent private events affect mood without revealing their story to the player',()=>{
 const s=at(850),before=structuredClone(s.known);
 const rules=[{id:'private-conflict',kind:'conditional',stages:['campus'],trigger:'test',participants:['soyul','yeogyeong'],when:()=>true,effect:()=>({outcome:'separate',visibility:'private',result:'private'})}];
 const a=evaluateEvents(s,{trigger:'test'},rules);
 assert.ok(npcNow(a,'soyul').stress>npcNow(s,'soyul').stress);
 assert.deepEqual(a.known,before);assert.deepEqual(a.memory,s.memory);
 assert.equal(evaluateEvents(a,{trigger:'test'},rules).npcLife.events.length,a.npcLife.events.length);
});
test('fatigue limits jokes, invitations and personal disclosure despite high affection',()=>{
 const s=at(1170,'soyul','close'),intent=socialIntent(s,'soyul');
 assert.equal(intent.personallyInterested,true);assert.equal(intent.invite,false);assert.equal(intent.willingToJoke,false);assert.equal(intent.disclosure,'surface');
 assert.equal(npcNow(s,'soyul').mood,'drained');
});
test('postponing a conversation does not mark the original topic as completed',()=>{
 let s=respond(at(560),'soyul','personal').state;
 s=respond(s,'soyul','scene:ctxSpace').state;s=respond(s,'soyul','scene:ctxBye').state;
 assert.equal(s.dialogue.sessions['1:afternoon:soyul'].finished,false);
 assert.equal(s.dialogue.threads?.soyul,undefined);
 s.clock.minute=820;s=respond(s,'soyul','personal').state;
 assert.equal(s.dialogue.sessions['1:afternoon:soyul'].node,'start');
});
test('all situational branches terminate or rejoin a valid original topic and can be saved',()=>{
 let terminals=0;
 function walk(s,id,depth=0){
  assert.ok(depth<20);const d=dialogue(s,id);
  for(const o of d.options){const n=respond(s,id,o.id);assert.deepEqual(restore(save(n.state)),n.state);if(n.result.leave)terminals++;else walk(n.state,id,depth+1);}
 }
 for(const id of ['yeogyeong','seoyeon','soyul'])for(const minute of [560,790,850,1170]){
  const s=at(minute,id);if(minute===850)noteNpcExperience(s,id,'stress',{stress:60},'stress');
  walk(respond(s,id,'personal').state,id);
 }
 assert.ok(terminals>30);
});
test('pre-class state is reachable at the actual preparation building, without revealing unknown names',async()=>{
 const {arrive,resolveEncounter}=await import('./encounters.js');
 const s=newGame();s.dialogue.engine='authored';s.clock.minute=560;
 assert.equal(arrive(s,'hall').encounter,null);
 const arrived=arrive(s,'creative');assert.equal(arrived.encounter.person,'yeogyeong');
 assert.doesNotMatch(arrived.encounter.text,/차여경/);
 const met=resolveEncounter(arrived.state,arrived.encounter,true);
 assert.match(met.result.text,/가기 직전/);
 assert.equal(met.state.contacts.yeogyeong.introduced,true);
});
