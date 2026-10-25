import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,nextDay,save,restore} from './simulation.js';
import {knownGame} from './fixtures.js';
import {addSocialFact,updateSocialWorld,shareSocialFacts,socialNews,socialOpinion} from './social-memory.js';
import {evaluateInvitations} from './appointments.js';
import {arrive,resolveEncounter} from './encounters.js';

test('a photo exchange is firsthand knowledge only and does not instantly broadcast',()=>{
 const before=knownGame(),after=structuredClone(before);after.dialogue.facts={soyul:{photo:'empty'}};
 const s=updateSocialWorld(before,after);
 assert.equal(s.social.facts[0].type,'photo-talk');assert.equal(s.social.knowledge.soyul[0].via,'direct');
 assert.equal(s.social.knowledge.seoyeon,undefined);assert.deepEqual(s.known,[]);assert.deepEqual(s.relations,before.relations);
});
test('a time opportunity shares to a trusted friend and not to every nearby person',()=>{
 const before=knownGame(),after=structuredClone(before);after.dialogue.facts={soyul:{photo:'empty'}};
 let s=updateSocialWorld(before,after);s=updateSocialWorld(s,{...structuredClone(s),clock:{minute:810}});
 assert.equal(s.social.knowledge.seoyeon[0].source,'soyul');assert.equal(s.social.knowledge.seoyeon[0].via,'heard');
 assert.equal(s.social.knowledge.yeogyeong,undefined);assert.equal(s.social.shares.length,1);
 assert.equal(shareSocialFacts(s).social.shares.length,1);assert.equal(s.known.length,0);
});
test('private draft stays private even between close friends',()=>{
 const s=knownGame('close');addSocialFact(s,{id:'private-test',type:'private-draft',privacy:'private',witnesses:['soyul']});
 const after=shareSocialFacts(s);assert.equal(after.social.shares.length,0);assert.equal(after.social.knowledge.seoyeon,undefined);
 assert.equal(after.social.decisions['private-test:soyul:seoyeon'],'kept-private');
 assert.equal(socialNews(after,'seoyeon').news,null);
});
test('newly heard information is not retransmitted as a firsthand witness',()=>{
 const s=knownGame();s.relations['seoyeon>yeogyeong']={trust:12,familiarity:20};
 addSocialFact(s,{id:'photo',type:'photo-talk',witnesses:['soyul']});const heard=shareSocialFacts(s);
 assert.ok(heard.social.knowledge.seoyeon);assert.equal(shareSocialFacts(heard).social.knowledge.yeogyeong,undefined);
});
test('actual conversation reveals sourced hearsay, records it once and preserves private preferences',()=>{
 let s=knownGame();addSocialFact(s,{id:'photo',type:'photo-talk',witnesses:['soyul']});s=shareSocialFacts(s);
 const prior=structuredClone(s);const arrived=arrive(s,'hall','noticeboard');s=resolveEncounter(arrived.state,arrived.encounter,true).state;
 assert.ok(!prior.known.length);assert.match(s.known[0],/한서연에게 전해 들음/);assert.match(s.memory.at(-1),/직접 목격한 사실이 아니라/);
 assert.equal(s.dialogue.facts?.seoyeon?.photo,undefined);assert.equal(socialNews(s,'seoyeon').news,null);
 assert.deepEqual(restore(save(s)),s);
});
test('repeated hearsay changes initiative without a universal trust penalty; own experience can disagree',()=>{
 const s=knownGame('friend'),relations=structuredClone(s.relations);
 addSocialFact(s,{id:'miss-1',type:'missed',witnesses:['soyul']});let heard=shareSocialFacts(s);
 assert.equal(socialOpinion(heard,'seoyeon').cautious,false);assert.ok(evaluateInvitations(heard).appointments.some(a=>a.person==='seoyeon'));
 addSocialFact(heard,{id:'miss-2',type:'missed',witnesses:['soyul']});heard=shareSocialFacts(heard);
 assert.equal(socialOpinion(heard,'seoyeon').cautious,true);assert.ok(!evaluateInvitations(heard).appointments.some(a=>a.person==='seoyeon'));
 assert.deepEqual(heard.relations,relations);
 addSocialFact(heard,{id:'my-experience',type:'kept',witnesses:['seoyeon']});assert.equal(socialOpinion(heard,'seoyeon').cautious,false);
 assert.ok(evaluateInvitations(heard).appointments.some(a=>a.person==='seoyeon'));
 const answer=socialNews(heard,'seoyeon');assert.match(answer.news.text,/저랑 한 약속/);
});
test('only real accepted commitment outcomes are captured, and duplicated tracking is deduplicated',()=>{
 const before=knownGame();before.dialogue.promises.soyul='pending';before.appointments=[{id:'x',person:'soyul',day:1,activity:'volunteer',status:'pending'}];
 const after=act(before,'rehearsal');let s=updateSocialWorld(before,after);
 assert.equal(s.social.facts.filter(f=>f.type==='missed').length,1);
 const again=updateSocialWorld(before,s);assert.equal(again.social.facts.length,s.social.facts.length);
 const declined=knownGame();declined.appointments=[{id:'no',person:'soyul',day:1,status:'declined'}];
 assert.equal(updateSocialWorld(declined,act(declined,'rehearsal')).social.facts.length,0);
});
test('old save slots gain empty social records without reconstructing rumours',()=>{
 const old=newGame();delete old.social;old.dialogue.facts={soyul:{photo:'empty'}};
 const loaded=restore(save(old));assert.equal(loaded.social.facts.length,0);assert.equal(updateSocialWorld(loaded,loaded).social.facts.length,0);
});

test('new concerns can withdraw an unaccepted offer, but never cancel an accepted promise',()=>{
 let s=evaluateInvitations(knownGame('friend'));
 const accepted=s.appointments.find(a=>a.person==='soyul');accepted.status='pending';
 addSocialFact(s,{id:'m1',type:'missed',witnesses:['yeogyeong']});addSocialFact(s,{id:'m2',type:'missed',witnesses:['yeogyeong']});
 s=shareSocialFacts(s);s=evaluateInvitations(s);
 assert.equal(s.appointments.find(a=>a.person==='seoyeon').status,'withdrawn');assert.equal(s.appointments.find(a=>a.person==='soyul').status,'pending');
 const messages=s.messages.length;assert.equal(evaluateInvitations(s).messages.length,messages);
});

test('personal meeting outcomes stay private while task attendance can be shared',()=>{
 const before=knownGame();before.appointments=[{id:'personal',kind:'meeting',person:'soyul',day:1,status:'pending'}];
 const after=structuredClone(before);after.appointments[0].status='broken';after.phase='evening';
 const s=updateSocialWorld(before,after);assert.equal(s.social.facts[0].privacy,'private');assert.equal(s.social.shares.length,0);
 assert.equal(s.social.knowledge.seoyeon,undefined);
});

test('two witnesses describing one incident cannot turn it into repeated misconduct',()=>{
 const s=knownGame('friend');
 addSocialFact(s,{id:'account-1',incidentId:'same-day-same-activity',type:'missed',witnesses:['soyul']});
 addSocialFact(s,{id:'account-2',incidentId:'same-day-same-activity',type:'missed',witnesses:['yeogyeong']});
 const heard=shareSocialFacts(s);assert.equal(heard.social.knowledge.seoyeon.length,2);assert.equal(socialOpinion(heard,'seoyeon').cautious,false);
});
