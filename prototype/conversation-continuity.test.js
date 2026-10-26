import test from 'node:test';
import assert from 'node:assert/strict';
import {knownGame} from './fixtures.js';
import {dialogue,respond} from './dialogue.js';
import {arrive,resolveEncounter} from './encounters.js';
import {save,restore} from './simulation.js';
import {followupCandidate,continuityNodes} from './conversation-continuity.js';
function finish(s,id,choices){for(const c of ['personal',...choices.map(x=>'scene:'+x)])s=respond(s,id,c).state;return s;}
test('finished conversation becomes a later encounter with consequences, not a replay',()=>{
 let s=finish(knownGame(),'yeogyeong',['help','quiet','bye']);
 assert.equal(followupCandidate(s,'yeogyeong'),null);
 s.clock.minute+=30;
 let a=arrive(s,'hall');assert.match(a.encounter.text,/수첩/);
 s=resolveEncounter(a.state,a.encounter,true).state;
 assert.equal(s.dialogue.sessions['1:afternoon:yeogyeong'].variant,'followup');
 s=respond(s,'yeogyeong','scene:together').state;
 assert.match(dialogue(s,'yeogyeong').opening,/역할만/);
 s=respond(s,'yeogyeong','scene:mutual').state;
 assert.match(dialogue(s,'yeogyeong').opening,/선배 작업/);
 s=respond(s,'yeogyeong','scene:bye').state;
 assert.equal(s.dialogue.threads.yeogyeong.episode,1);
 assert.equal(followupCandidate(s,'yeogyeong'),null);
 s.clock.minute+=30;s=restore(save(s));
 s=respond(s,'yeogyeong','personal').state;
 assert.match(dialogue(s,'yeogyeong').opening,/다른 사람한테도 맡겨/);
 s=respond(s,'yeogyeong','scene:autonomy').state;
 s=respond(s,'yeogyeong','scene:respect').state;
 s=respond(s,'yeogyeong','scene:bye').state;
 s.clock.minute+=120;assert.equal(followupCandidate(s,'yeogyeong'),null);
 assert.equal(dialogue(s,'yeogyeong').options.some(o=>o.id==='personal'),false);
});
test('same offer differs by trust, memories, and personal boundaries',()=>{
 for(const id of ['yeogyeong','seoyeon','soyul']){
  const s=knownGame();s.dialogue.facts={[id]:{continuation:'help'}};
  const low=continuityNodes(s,id,{episode:0}).answer.text;
  s.relations[id+'>taei']={trust:6,affection:5,familiarity:8,tension:0};
  assert.notEqual(continuityNodes(s,id,{episode:0}).answer.text,low);
  s.dialogue.facts[id].continuation='space';
  assert.notEqual(continuityNodes(s,id,{episode:1}).start.text,continuityNodes(s,id,{episode:0}).start.text);
  assert.match(continuityNodes(s,id,{episode:0}).boundary.text,/제가|제 사진/);
 }
});
test('reading, saves and repeated arrival do not consume or farm a followup',()=>{
 let s=finish(knownGame(),'yeogyeong',['help','quiet','bye']);s.clock.minute+=30;
 const before=structuredClone(s);dialogue(s,'yeogyeong');dialogue(s,'yeogyeong');assert.deepEqual(s,before);
 const a=arrive(s,'hall');const next=resolveEncounter(a.state,a.encounter,true);
 assert.throws(()=>resolveEncounter(next.state,a.encounter,true));
 assert.deepEqual(restore(save(next.state)),next.state);
});
test('later conversation recalls the actual volunteer task instead of a generic activity',()=>{
 const s=knownGame();s.activitySessions={records:{a:{routeId:'volunteer',status:'completed',choices:[{id:'carry'}]}}};
 const carried=continuityNodes(s,'yeogyeong',{episode:0}).start.text;
 assert.match(carried,/통로부터 비우고/);
 s.activitySessions.records.a.choices=[{id:'labels'}];
 assert.match(continuityNodes(s,'yeogyeong',{episode:0}).start.text,/수량표/);
 assert.notEqual(continuityNodes(s,'yeogyeong',{episode:0}).start.text,carried);
});
test('same building later in the same hour can host a new followup without repeating the first accident',()=>{
 const a=arrive(knownGame(),'hall');let s=resolveEncounter(a.state,a.encounter,true).state;
 for(const c of ['help','quiet','bye'])s=respond(s,'yeogyeong','scene:'+c).state;
 assert.equal(arrive(s,'hall').encounter,null);
 s.clock.minute+=30;
 const later=arrive(s,'hall');assert.ok(later.encounter);assert.doesNotMatch(later.encounter.text,/영수증 한 장이 발치/);
 assert.equal(resolveEncounter(later.state,later.encounter,true).state.dialogue.sessions['1:afternoon:yeogyeong'].variant,'followup');
});
