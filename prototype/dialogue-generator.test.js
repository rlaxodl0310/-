import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {introduce} from './identity.js';
import {generateDialogueTurn,advanceGeneratedDialogue,canGenerateReencounter} from './dialogue-generator.js';
import {dialogue,respond,openConversation,endTopic} from './dialogue.js';
import {arrive,resolveEncounter} from './encounters.js';
function sample(seed=1,id='yeogyeong'){
 const s=newGame();s.clock.minute=820;introduce(s,id,'test');
 s.dialogue.generation={rng:seed,sequence:0,recent:{}};return s;
}
test('identical world and input can generate different intents and sentences across random streams',()=>{
 const texts=new Set(),intents=new Set(),details=new Set();
 for(let seed=1;seed<=80;seed++){
  const result=generateDialogueTurn(sample(seed*1234567),'yeogyeong',{topic:'checking',action:'why'});
  texts.add(result.text);intents.add(result.plan.intent);details.add(result.plan.detail);
  assert.equal(result.plan.topic,'checking');assert.ok(!result.text.includes('undefined'));
 }
 assert.ok(texts.size>50);assert.ok(intents.size>=3);assert.equal(details.size,3);
});
test('a new turn samples anew; pure rendering, menu reads and load keep an emitted answer stable',()=>{
 let s=openConversation(sample(12345),'yeogyeong').state;
 const text=dialogue(s,'yeogyeong').opening,before=structuredClone(s),rng=s.dialogue.generation.rng;
 for(let n=0;n<6;n++)assert.equal(dialogue(s,'yeogyeong').opening,text);
 assert.deepEqual(s,before);s=restore(save(s));assert.equal(dialogue(s,'yeogyeong').opening,text);
 const option=dialogue(s,'yeogyeong').options.find(o=>o.id!=='gen:leave');
 s=respond(s,'yeogyeong',option.id).state;
 assert.notEqual(s.dialogue.generation.rng,rng);assert.notEqual(dialogue(s,'yeogyeong').opening,text);
});
test('recent compositions are suppressed and saved RNG produces reproducible debugging',()=>{
 const s=sample(95361),texts=[];
 for(let n=0;n<20;n++)texts.push(generateDialogueTurn(s,'yeogyeong',{action:'why',topic:'checking'}).text);
 assert.equal(new Set(texts).size,texts.length);
 const b=restore(save(s));assert.equal(generateDialogueTurn(s,'yeogyeong').text,generateDialogueTurn(b,'yeogyeong').text);
});
test('the normal encounter uses generation by default and grounds its topic in what was asked',()=>{
 const s=newGame();s.clock.minute=820;
 const a=arrive(s,'hall'),met=resolveEncounter(a.state,a.encounter,true);
 assert.equal(met.result.generated,true);assert.equal(met.result.plan.topic,'checking');
 assert.ok(dialogue(met.state,'yeogyeong').options.every(o=>o.id.startsWith('gen:')));
});
test('unknown/private information is never selected as a memory',()=>{
 const s=sample(18,'soyul');s.memory.push('secret: taei coding');s.events.push({id:'secret',visibility:'private',result:'private secret'});
 for(let n=0;n<35;n++){
  const reply=generateDialogueTurn(s,'soyul');assert.deepEqual(reply.plan.memoryIds,[]);
  assert.ok(!/코딩|secret|곡으로/.test(reply.text));
 }
});
test('sharing an actual player statement unlocks recall only for the listener',()=>{
 const s=sample(123);
 // Find a generated invitation to share, without introducing new facts by reading.
 let offered;
 for(let n=0;n<40;n++){offered=generateDialogueTurn(s,'yeogyeong');if(offered.options.some(o=>o.id==='share'))break;}
 advanceGeneratedDialogue(s,'yeogyeong','share');assert.deepEqual(s.dialogue.generation.sharedWork,['yeogyeong']);
 let recalled=false;
 for(let n=0;n<40;n++){const r=generateDialogueTurn(s,'yeogyeong');recalled||=r.plan.memoryIds.includes('shared-work-story');}
 assert.equal(recalled,true);
 introduce(s,'soyul','test');for(let n=0;n<20;n++)assert.ok(!generateDialogueTurn(s,'soyul').plan.memoryIds.includes('shared-work-story'));
});
test('random wording cannot manufacture appointments, inventory, elapsed time or relationship farming',()=>{
 const s=sample(481);const original=structuredClone({clock:s.clock,appointments:s.appointments,inventory:s.inventory,known:s.known});
 for(let n=0;n<10;n++){
  let result;for(let i=0;i<30;i++){result=generateDialogueTurn(s,'yeogyeong');if(result.options.some(o=>o.id==='listen'))break;}
  const advanced=advanceGeneratedDialogue(s,'yeogyeong','listen');
  assert.equal(advanced.delta.trust??0,n===0?1:0);
 }
 assert.deepEqual({clock:s.clock,appointments:s.appointments,inventory:s.inventory,known:s.known},original);
});
test('busy NPCs always defer and offer no hidden invitation or disclosure',()=>{
 for(let seed=1;seed<40;seed++){
  const s=sample(seed);s.clock.minute=560;
  const r=generateDialogueTurn(s,'yeogyeong');assert.equal(r.plan.intent,'defer');
  assert.ok(r.options.every(o=>['listen','leave'].includes(o.kind)));
  assert.equal(advanceGeneratedDialogue(s,'yeogyeong','listen').result.leave,true);
 }
});
test('ended generated conversations reopen after actual elapsed time without replaying a scripted accident',()=>{
 let s=sample(673);s=openConversation(s,'yeogyeong').state;s=endTopic(s,'yeogyeong');
 assert.equal(canGenerateReencounter(s,'yeogyeong'),false);s.clock.minute+=30;
 assert.equal(canGenerateReencounter(s,'yeogyeong'),true);
 const a=arrive(s,'hall');assert.ok(a.encounter);const r=resolveEncounter(a.state,a.encounter,true);
 assert.equal(r.result.generated,true);
 assert.equal(r.state.dialogue.generation.sequence,2);
});
test('asking why stays attached to the detail actually said, rather than inventing a different subject',()=>{
 const s=sample(7891);let first;
 for(let n=0;n<30;n++){first=generateDialogueTurn(s,'yeogyeong');if(first.options.some(o=>o.id==='why'))break;}
 const next=advanceGeneratedDialogue(s,'yeogyeong','why').result;
 assert.equal(next.plan.topic,first.plan.topic);assert.equal(next.plan.detail,first.plan.detail);
 assert.match(next.text,/아서요/);
});
