import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,nextDay,acceptAppointment,save,restore} from './simulation.js';
import {dialogue,respond,endTopic,openConversation,relationship} from './dialogue.js';
import {socialIntent,personalMessage} from './social-reasoning.js';

function choose(s,id,...choices){for(const c of choices)s=respond(s,id,c.startsWith('scene:')?c:'scene:'+c).state;return s;}

test('NPC asks a real question and keeps the topic across several player answers',()=>{
 let s=respond(newGame(),'seoyeon','personal').state;
 assert.match(dialogue(s,'seoyeon').opening,/단 거 잘 먹어요/);
 s=choose(s,'seoyeon','black');assert.match(dialogue(s,'seoyeon').opening,/디저트/);
 s=choose(s,'seoyeon','bread');assert.match(dialogue(s,'seoyeon').opening,/가사/);
 s=choose(s,'seoyeon','honest');assert.match(dialogue(s,'seoyeon').opening,/변명/);
 assert.equal(s.dialogue.history.at(-1).playerLine,'응. 근데 내 얘기를 내가 쓰니까 자꾸 변명처럼 들려요.');
 assert.ok(dialogue(s,'seoyeon').options.every(o=>o.id.startsWith('scene:')));
});

test('a character can disagree without treating disagreement as distrust',()=>{
 let s=respond(newGame(),'soyul','personal').state;
 s=choose(s,'soyul','crowd');assert.match(dialogue(s,'soyul').opening,/빈 의자/);
 assert.equal(relationship(s,'soyul').tension,0);
 assert.ok(dialogue(s,'soyul').options.some(o=>o.id==='scene:detail'));
});

test('NPC initiates for companionship or an immediate task without awarding free affection',()=>{
 const close=newGame('close'),before=structuredClone(close.relations);
 const opened=openConversation(close,'seoyeon');
 assert.equal(opened.result.initiated,true);
 assert.equal(opened.result.playerLine,'');
 assert.deepEqual(opened.state.relations,before);
 assert.match(dialogue(opened.state,'seoyeon').opening,/선배는 단 거/);
 const busy=newGame();busy.day=3;
 assert.equal(openConversation(busy,'yeogyeong').result.initiated,true);
 assert.match(openConversation(busy,'yeogyeong').result.text,/테이프/);
});

test('affection with low trust seeks contact while maintaining privacy',()=>{
 const s=newGame('close');s.day=2;s.relations['soyul>taei'].trust=0;
 assert.equal(socialIntent(s,'soyul').mode,'cautious-interest');
 const opened=openConversation(s,'soyul');assert.equal(opened.result.initiated,true);
 const read=choose(opened.state,'soyul','ask');
 assert.match(dialogue(read,'soyul').opening,/정리한 다음/);
});

test('only the NPC who heard a preference can refer to it later',()=>{
 let s=respond(newGame(),'seoyeon','personal').state;s=choose(s,'seoyeon','black');
 s=nextDay(act(s,'rehearsal'));
 assert.match(personalMessage(s,'seoyeon'),/안 단 걸로/);
 assert.equal(s.dialogue.facts.seoyeon.coffee,'black');
 assert.equal(s.dialogue.facts.soyul,undefined);
 assert.equal(personalMessage(s,'soyul'),null);
 assert.match(respond(s,'seoyeon','personal').result.text,/디저트는 따로/);
});

test('unfinished topics resume after leaving and loading without farming rewards',()=>{
 let s=respond(newGame(),'soyul','personal').state;s=choose(s,'soyul','empty');
 const text=dialogue(s,'soyul').opening,before=structuredClone(s.relations);
 const loaded=restore(save(s));
 assert.equal(openConversation(loaded,'soyul').result,null);
 assert.equal(dialogue(loaded,'soyul').opening,text);
 const again=respond(endTopic(loaded,'soyul'),'soyul','personal');
 assert.deepEqual(again.state.relations,before);
 assert.equal(again.result.text,text);
});

test('respecting or ignoring a boundary leaves different private memories',()=>{
 const base=newGame('close');base.day=2;base.relations['soyul>taei'].trust=1;
 const started=choose(respond(base,'soyul','personal').state,'soyul','ask');
 const respectful=choose(started,'soyul','space'),pushy=choose(started,'soyul','insist');
 assert.equal(respectful.dialogue.observations.soyul.boundary,'respected');
 assert.equal(pushy.dialogue.observations.soyul.boundary,'ignored');
 assert.equal(socialIntent(pushy,'soyul').feelsSafe,false);
});

test('high intimacy does not bypass a broken commitment and apology is not full trust restoration',()=>{
 let s=nextDay(act(newGame('close'),'rehearsal'));
 s=acceptAppointment(s,'soyul');s=nextDay(act(s,'work'));s=act(s,'backstage');
 const before=relationship(s,'soyul').trust;
 const opened=openConversation(s,'soyul');assert.match(opened.result.text,/기다렸/);
 assert.deepEqual(dialogue(opened.state,'soyul').options.map(o=>o.id),['scene:apologize','scene:space']);
 const apologized=choose(opened.state,'soyul','apologize');
 assert.equal(relationship(apologized,'soyul').trust,before);
 assert.ok(apologized.dialogue.history.some(h=>h.choice==='scene:apologize'));
});

test('a past apology cannot erase a later broken commitment',()=>{
 let s=newGame('close');s.dialogue.history.push({person:'soyul',choice:'repair',day:1,phase:'evening'});
 s=nextDay(act(s,'rehearsal'));s=acceptAppointment(s,'soyul');
 s=nextDay(act(s,'work'));s=act(s,'backstage');
 assert.equal(socialIntent(s,'soyul').unresolved,true);
});

test('intimacy does not change speech register without consent',()=>{
 const s=newGame();s.relations['soyul>taei']={familiarity:8,trust:5,affection:5};
 assert.match(dialogue(s,'soyul').opening,/안녕하세요/);
 assert.match(respond(s,'soyul','personal').result.text,/봐주실래요/);
 const agreed=respond(s,'soyul','speech').state;
 assert.equal(agreed.dialogue.facts.soyul.speech,'casual');
 assert.match(respond(agreed,'soyul','personal').result.text,/너는 어느 쪽/);
});

test('every authored branch in all days and periods resolves to a valid node',()=>{
 let terminals=0;
 function walk(s,id,depth=0){
  assert.ok(depth<15,'unexpected conversation loop');
  const d=dialogue(s,id);assert.ok(d.opening?.length);
  for(const o of d.options){
   assert.ok(o.label?.length);assert.ok(o.id.startsWith('scene:'));
   const n=respond(s,id,o.id);assert.ok(n.result.text?.length);
   assert.deepEqual(restore(save(n.state)),n.state);
   if(n.result.leave)terminals++;else walk(n.state,id,depth+1);
  }
 }
 for(const profile of ['acquaintance','friend','close'])for(const day of [1,2,3])for(const phase of ['afternoon','evening'])for(const id of ['seoyeon','yeogyeong','soyul']){
  const s=newGame(profile);s.day=day;s.phase=phase;s.choice=phase==='evening'?({1:'rehearsal',2:'work',3:'backstage'}[day]):null;
  walk(respond(s,id,'personal').state,id);
 }
 assert.ok(terminals>150);
});
