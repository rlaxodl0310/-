import test from 'node:test';
import assert from 'node:assert/strict';
import {newAfternoonScenario as newGame,act,nextDay,save,restore} from './simulation.js';
import {advanceCommunity,publicCommunityContext} from './community-simulation.js';
import {visibleCommunityPosts,readCommunityPost} from './community.js';
import {knownSceneRoutes} from './scene-flow.js';
const beat=(s,n)=>{for(let i=0;i<n;i++)s=advanceCommunity(s,{ambient:true});return s;};
test('opening a feed is not reading every recruitment post or joining a club',()=>{
 const s=advanceCommunity(newGame());assert.ok(visibleCommunityPosts(s).some(p=>p.club==='football'));
 const day2=nextDay(act(s,'rehearsal'));assert.ok(!knownSceneRoutes(day2).some(r=>r.id==='football'));
 const read=readCommunityPost(day2,'football-recruit');assert.ok(knownSceneRoutes(read).some(r=>r.id==='football'));assert.deepEqual(read.memberships,{});
});
test('independent writers add threads, delayed replies and reactions without advancing the protagonist',()=>{
 const initial=newGame(),s=beat(initial,40);assert.ok(s.community.posts.length>=4);
 assert.ok(new Set(s.community.posts.map(p=>p.actor)).size>=3);assert.ok(s.community.posts.some(p=>p.comments.length));
 assert.ok(s.community.posts.some(p=>p.comments.some(c=>c.author==='글쓴이')));assert.equal(s.clock.minute,initial.clock.minute);assert.deepEqual(s.relations,initial.relations);
 const ids=s.community.posts.map(p=>p.id);assert.equal(new Set(ids).size,ids.length);
});
test('save and reload preserve pending jobs and future writing rather than rerolling',()=>{
 const s=beat(newGame(),12),loaded=restore(save(s));assert.deepEqual(loaded,s);assert.deepEqual(beat(loaded,15),beat(s,15));
 assert.equal(advanceCommunity(advanceCommunity(s)).community.beat,advanceCommunity(s).community.beat);
});
test('public context excludes personal relationships, decisions and private memories',()=>{
 const s=newGame();s.dialogue.facts={soyul:{secret:'비공개 초안'}};s.risk.knowledge={soyul:[{label:'비밀'}]};
 const text=JSON.stringify(publicCommunityContext(s));assert.ok(!text.includes('비공개'));assert.ok(!text.includes('soyul'));assert.deepEqual(Object.keys(publicCommunityContext(s)).sort(),['day','exhibit','hour','notice','phase','weather']);
 const generated=JSON.stringify(beat(s,60).community.posts);assert.ok(!generated.includes('비공개'));assert.ok(!generated.includes('김태이'));assert.ok(!generated.includes('좀비'));
});
test('issue posts follow actual public event availability, not future plot knowledge',()=>{
 let s=beat(newGame(),100);assert.ok(!s.community.posts.some(p=>['notice','ambulance','exhibit'].includes(p.topic)));
 assert.throws(()=>readCommunityPost(s,'ambulance-post'));
 s=nextDay(act(nextDay(act(s,'rehearsal')),'work'));s=beat(s,120);assert.ok(s.community.posts.some(p=>p.topic==='ambulance'));
 const read=readCommunityPost(s,s.community.posts.find(p=>p.topic==='ambulance').id);
 assert.ok(read.warnings.evidence.some(e=>e.kind==='report'&&e.source==='캠퍼스톡 익명글'));
 assert.ok(!read.warnings.evidence.some(e=>e.kind==='direct'));assert.equal(read.world.stage,'campus');
});
test('long-running simulation remains bounded and does not exhaust all writing topics',()=>{
 const s=beat(newGame(),1000);assert.ok(s.community.posts.length<=50);assert.ok(s.community.sequence>50);assert.ok(s.community.jobs.length<100);
 assert.ok(s.community.posts.every(p=>p.comments.length<=3));
});
test('older board knowledge migrates without inventing membership or new rumours',()=>{
 const old=newGame();old.flow.seen.board=true;delete old.community;
 const s=restore(save(old));assert.ok(s.flow.seen.community);assert.ok(s.flow.seen['club:football']);assert.equal(s.community.posts.length,0);assert.deepEqual(s.memberships,{});
});

test('a thread being read stays available when the bounded feed rotates older posts out',()=>{
 let s=beat(newGame(),8);const id=s.community.posts[0].id;s=readCommunityPost(s,id);s=beat(s,1000);
 assert.ok(s.community.posts.some(p=>p.id===id));assert.ok(s.community.posts.length<=50);
});
