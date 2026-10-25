import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,restore,save} from './simulation.js';
import {dialogue,respond,relationship,changeRelationship,groupDialogue,respondGroup} from './dialogue.js';

test('same joke lands differently with familiarity and maintains distinct voices',()=>{
 for(const id of ['seoyeon','yeogyeong','soyul']){
  const a=respond(newGame(),id,'joke');
  const b=respond(newGame('friend'),id,'joke');
  assert.notEqual(a.result.text,b.result.text);
  assert.equal(relationship(a.state,id).tension,1);
  assert.equal(relationship(b.state,id).affection,1);
 }
 const lines=['seoyeon','yeogyeong','soyul'].map(id=>respond(newGame(),id,'push').result.text);
 assert.equal(new Set(lines).size,3);
});
test('affection changes a close character response independently of familiarity',()=>{
 const a=respond(newGame('friend'),'soyul','personal');
 const b=respond(newGame('close'),'soyul','personal');
 assert.notEqual(a.result.text,b.result.text);
});
test('NPC friendship affects what Seoyeon says about Soyul',()=>{
 const a=newGame(),b=newGame();
 b.relations['seoyeon>soyul'].familiarity=0;
 assert.notEqual(respond(a,'seoyeon','listen').result.text,respond(b,'seoyeon','listen').result.text);
});
test('repeat visits recall friction and repeated options cannot farm relationships',()=>{
 const a=respond(newGame(),'seoyeon','push');
 assert.match(dialogue(a.state,'seoyeon').opening,/제 일정/);
 const b=respond(a.state,'seoyeon','push');
 assert.equal(b.result.repeated,true);
 assert.deepEqual(b.state.relations,a.state.relations);
});
test('promise has later consequences and activity adds to existing relationships',()=>{
 const a=respond(newGame('friend'),'yeogyeong','promise').state;
 const kept=act(a,'volunteer'),broken=act(a,'rehearsal');
 assert.equal(kept.dialogue.promises.yeogyeong,'kept');
 assert.equal(broken.dialogue.promises.yeogyeong,'broken');
 assert.equal(relationship(kept,'yeogyeong').trust,7);
 assert.equal(relationship(broken,'yeogyeong').trust,2);
 assert.match(dialogue(broken,'yeogyeong').opening,/먼저 알려/);
 assert.equal(relationship(kept,'seoyeon','soyul').trust,13);
});
test('hearsay requires a conversation and stays identified as hearsay',()=>{
 const a=act(newGame(),'rehearsal');
 assert.ok(!a.known.includes('물품 수량 불일치 사건'));
 const b=respond(a,'seoyeon','listen').state;
 assert.ok(b.known.includes('물품 수량 불일치 사건'));
 assert.match(b.memory.at(-1),/전해 들었다/);
});
test('save preserves conversation and promise; legacy saves migrate',()=>{
 const a=respond(newGame(),'soyul','promise').state;
 assert.deepEqual(restore(save(a)),a);
 const legacy=newGame();legacy.version=1;delete legacy.dialogue;
 assert.deepEqual(restore(save(legacy)).dialogue,{history:[],promises:{}});
});
test('high trust changes post-activity greeting and tension affects boundaries',()=>{
 const a=act(newGame(),'volunteer'),b=act(newGame('friend'),'volunteer');
 assert.notEqual(dialogue(a,'seoyeon').opening,dialogue(b,'seoyeon').opening);
 changeRelationship(a,'seoyeon','taei',{tension:4});
 const c=newGame();changeRelationship(c,'seoyeon','taei',{tension:4});
 assert.match(dialogue(c,'seoyeon').opening,/혼자/);
});
test('followup is unlocked by the prior topic and trust gates disclosure',()=>{
 const a=respond(newGame(),'seoyeon','personal').state;
 const b=respond(newGame('friend'),'seoyeon','personal').state;
 assert.ok(dialogue(a,'seoyeon').options.some(o=>o.id==='deepen'));
 assert.notEqual(respond(a,'seoyeon','deepen').result.text,respond(b,'seoyeon','deepen').result.text);
 assert.throws(()=>respond(newGame(),'seoyeon','deepen'));
});
test('repair acknowledges conflict without erasing the original memory',()=>{
 const a=respond(newGame(),'soyul','push').state;
 const b=respond(a,'soyul','repair').state;
 assert.equal(relationship(b,'soyul').tension,1);
 assert.equal(b.dialogue.history[0].choice,'push');
});
test('group dialogue uses NPC bond and addresses the player without uniform approval',()=>{
 const a=newGame(),b=newGame();
 b.relations['soyul>seoyeon'].familiarity=0;
 assert.notEqual(groupDialogue(a)[1].text,groupDialogue(b)[1].text);
 const bad=respondGroup(newGame('friend'),'speakFor');
 assert.equal(relationship(bad.state,'soyul').tension,1);
 assert.equal(relationship(bad.state,'seoyeon').trust,3);
 const repeated=respondGroup(bad.state,'speakFor');
 assert.deepEqual(repeated.state.relations,bad.state.relations);
});
