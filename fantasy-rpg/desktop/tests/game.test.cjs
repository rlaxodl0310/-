const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../ui/data.js'),Engine=require('../ui/engine.js'),C=require('../ui/core.js');
const ctx=e=>({location:e.location,members:e.members,viewer:e.viewer});
function complete(engine){while(engine.state.active){const n=engine.current();engine.advance(n.choices?n.choices[0].id:null);}}
function before(event){const engine=new Engine(D);for(const prior of D.events){if(prior.id===event.id)break;engine.start(prior.id,ctx(prior));complete(engine);}return engine;}
test('playable scenes start on Earth and never assign the player to AI',()=>{assert.equal(D.player.id,'taei');assert.equal(D.events[0].id,'earth_commute');assert.ok(!D.actors.taei);for(const asset of Object.values(D.assets))assert.ok(fs.existsSync(path.join(__dirname,'../ui',asset)));for(const e of D.events){assert.ok(e.era==='earth'||e.id==='fantasy_arrival');assert.notEqual(e.owner,D.player.id);assert.ok(e.chat===false?e.owner==='narrator':D.profiles[e.owner]);assert.ok(!e.members.includes('taei'));for(const n of Object.values(e.nodes)){assert.notEqual(n.speaker,'taei');for(const c of n.choices||[])assert.ok(e.nodes[c.next]);if(n.next)assert.ok(e.nodes[n.next]);}}});
test('prologue and arrival branches restore and complete once in sequence',()=>{let endings=0;for(const e of D.events){const initial=before(e);initial.start(e.id,ctx(e));function walk(engine){const next=Engine.restore(D,engine.serialize());assert.deepEqual(next.state,engine.state);const n=next.current();if(n.end){next.advance();assert.ok(next.state.completed.includes(e.id));assert.throws(()=>next.start(e.id,ctx(e)));endings++;return;}for(const c of n.choices||[{id:null}]){const branch=Engine.restore(D,next.serialize());branch.advance(c.id);walk(branch);}}walk(initial);}assert.equal(endings,12);});
test('later scenes are locked; abandon preserves prior time and restores',()=>{const engine=new Engine(D),first=D.events[0];assert.throws(()=>engine.start(D.events[1].id,ctx(D.events[1])));engine.start(first.id,ctx(first));engine.advance();engine.advance('hello');assert.ok(engine.state.active.pendingMinutes>0);engine.abandon();assert.equal(engine.state.minutes,0);assert.deepEqual(engine.state.completed,[]);engine.start(first.id,ctx(first));assert.deepEqual(Engine.restore(D,engine.serialize()).state,engine.state);});
test('new story saves round trip while old prototype saves are rejected',()=>{const e=new Engine(D);e.start(D.events[0].id,ctx(D.events[0]));const payload={version:D.saveVersion,engine:e.serialize(),logs:[{speaker:'나',text:'<script>alert(1)</script>'}],large:false,motion:true};assert.deepEqual(C.validateSave(payload,D,Engine).engine.state,e.state);for(const raw of [{},null,{...payload,logs:[{speaker:'x',text:7}]},{...payload,version:1}])assert.throws(()=>C.validateSave(raw,D,Engine));});
test('party information requires actual companionship and exposes only simple known facts',()=>{const a=new Engine(D);assert.deepEqual(C.partyInfo(D,a.state),[]);a.start(D.events[0].id,ctx(D.events[0]));a.advance();a.advance('school');complete(a);assert.deepEqual(C.partyInfo(D,a.state),[]);const b=new Engine(D);b.start(D.events[0].id,ctx(D.events[0]));b.advance();b.advance('hello');complete(b);const rows=C.partyInfo(D,b.state);assert.equal(rows.length,1);assert.equal(rows[0].name,'차여경');assert.equal(rows[0].age,null);assert.deepEqual(Object.keys(rows[0]),['id','name','age']);assert.ok(!JSON.stringify(rows).includes('유예'));});
test('age stays hidden until learned even if author data contains it',()=>{const d={...D,publicFacts:{yeogyeong:{name:'차여경',age:18}}};assert.equal(C.partyInfo(d,{flags:['companion_yeogyeong']})[0].age,null);assert.equal(C.partyInfo(d,{flags:['companion_yeogyeong','known_age_yeogyeong']})[0].age,18);});

test('separate codex lists all slots while concealing unknown identities and ages',()=>{const state={flags:[]},rows=C.codexInfo(D,state);assert.equal(rows.length,D.catalog.length);assert.ok(!JSON.stringify(rows).includes('네아'));assert.ok(!JSON.stringify(rows).includes('임소윤'));assert.equal(rows.find(p=>p.id==='taei').age,18);assert.ok(!JSON.stringify(rows).includes('제로'));assert.ok(!JSON.stringify(rows).includes('윤서하'));assert.ok(!JSON.stringify(rows).includes('유예'));const unlocked=C.codexInfo(D,{flags:['known_person_seoha']});assert.equal(unlocked.find(p=>p.id==='seoha').name,'윤서하');assert.equal(unlocked.find(p=>p.id==='seoha').age,null);assert.deepEqual(C.partyInfo(D,{flags:['known_person_seoha']}),[]);});

test('an existing completed prologue can enter either arrival branch without adding a companion',()=>{
 const arrival=D.events.find(event=>event.id==='fantasy_arrival');
 const oldData={...D,events:D.events.filter(event=>event.id!==arrival.id)};
 const old=new Engine(oldData);
 for(const event of oldData.events){old.start(event.id,ctx(event));complete(old);}
 const previous=C.partyInfo(D,old.state);
 for(const [choice,flag,cost] of [['path','arrival_checked_path',2],['listen','arrival_listened',1]]){
  const next=Engine.restore(D,old.serialize());
  next.start(arrival.id,ctx(arrival));
  next.advance();
  next.advance(choice);
  complete(next);
  assert.equal(next.state.currentLocation,arrival.location);
  assert.equal(next.state.minutes,old.state.minutes+cost);
  assert.ok(next.state.flags.includes(flag));
  assert.deepEqual(C.partyInfo(D,next.state),previous);
  assert.deepEqual(Engine.restore(D,next.serialize()).state,next.state);
 }
});
