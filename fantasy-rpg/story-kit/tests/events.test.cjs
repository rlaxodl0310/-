const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../data.js'),Engine=require('../engine.js');
const context=e=>({location:e.location,members:[...e.members],viewer:e.viewer});

test('every referenced graphic exists and every graph edge is valid',()=>{
  for(const file of Object.values(D.assets))assert.ok(fs.existsSync(path.join(__dirname,'..',file)),file);
  for(const e of D.events){
    assert.ok(e.nodes[e.entry]);assert.ok(D.assets[e.cg]);
    for(const n of Object.values(e.nodes)){
      assert.ok(D.actors[n.speaker]);assert.ok(Number.isInteger(n.emotion)&&n.emotion>=0&&n.emotion<6);
      if(n.sd!==undefined)assert.ok(n.sd>=0&&n.sd<6);
      for(const choice of n.choices||[])assert.ok(e.nodes[choice.next]);
      if(n.next)assert.ok(e.nodes[n.next]);
    }
  }
});
test('event conditions require correct place and all actual participants',()=>{
  const e=D.events[0],engine=new Engine(D);
  assert.throws(()=>engine.start(e.id,{location:'elsewhere',members:e.members}));
  assert.throws(()=>engine.start(e.id,{location:e.location,members:[]}));
  assert.equal(engine.state.active,null);assert.equal(engine.history.length,0);
});
test('every event branch completes, can restore every node, commits time only on completion',()=>{
  let endings=0;
  for(const e of D.events){
    const base=new Engine(D);base.start(e.id,context(e));
    function walk(engine,depth=0){
      assert.ok(depth<25,'cyclic event graph');
      const restored=Engine.restore(D,engine.serialize());assert.deepEqual(restored.state,engine.state);
      assert.equal(engine.state.minutes,0);assert.deepEqual(engine.state.completed,[]);
      const n=engine.current();
      if(n.end){
        const expected=engine.state.active.pendingMinutes;
        engine.advance();assert.equal(engine.state.minutes,expected);assert.deepEqual(engine.state.completed,[e.id]);
        assert.ok(engine.state.flags.includes(n.flags[0]));assert.throws(()=>engine.advance());assert.throws(()=>engine.start(e.id,context(e)));
        assert.deepEqual(Engine.restore(D,engine.serialize()).state,engine.state);endings++;return;
      }
      for(const choice of n.choices||[{id:null}]){const next=Engine.restore(D,engine.serialize());next.advance(choice.id);walk(next,depth+1);}
    }
    walk(base);
  }
  assert.equal(endings,14);
});
test('invalid choice cannot advance or charge time',()=>{
  const engine=new Engine(D),e=D.events[0];engine.start(e.id,context(e));const before=engine.serialize();
  assert.throws(()=>engine.advance('nonexistent'));assert.equal(engine.serialize(),before);
});
test('active event cannot be overwritten, reading never mutates state',()=>{
  const engine=new Engine(D),e=D.events[0];engine.start(e.id,context(e));const before=engine.serialize();
  assert.throws(()=>engine.start(D.events[2].id,context(D.events[2])));engine.current();engine.current();assert.equal(engine.serialize(),before);
});
test('malformed saves are rejected, not accepted as world state',()=>{
  for(const save of ['no json','{}',JSON.stringify({version:8,history:[]}),JSON.stringify({version:2,history:[{type:'grant_level',level:999}]})])assert.throws(()=>Engine.restore(D,save));
});
test('each event runs with only its owner and never speaks as another protagonist',()=>{
  for(const e of D.events){
    assert.deepEqual(e.members,[e.owner]);
    const engine=new Engine(D);engine.start(e.id,context(e));
    for(const n of Object.values(e.nodes)){
      assert.equal(n.speaker,e.owner);
      if(n.sd!==undefined&&!e.sdAsset)assert.equal(n.sd%3,['taei','dogyeom','seoha'].indexOf(e.owner));
    }
    assert.ok(e.cg.endsWith('Solo'));
  }
  assert.equal(D.version,2);
  assert.ok(!Object.values(D.assets).includes('../assets/sd-interactions.png'));
  assert.throws(()=>Engine.restore(D,JSON.stringify({version:1,history:[]})));
});

test('Yeogyeong events require Taei as viewer and preserve that condition on restore',()=>{
  for(const e of D.events.filter(e=>e.viewer==='taei')){
    const engine=new Engine(D);
    assert.throws(()=>engine.start(e.id,{location:e.location,members:e.members,viewer:'dogyeom'}));
    assert.equal(engine.history.length,0);
    engine.start(e.id,context(e));
    assert.deepEqual(Engine.restore(D,engine.serialize()).history,engine.history);
  }
});

test('fantasy scenes use matching costume sheets and preserve previous v2 saves',()=>{
 const old=Engine.restore(D,JSON.stringify({version:2,history:[{type:'start',id:'yeogyeong_notebook',context:{location:'classroom',members:['yeogyeong'],viewer:'taei'}}]}));
 assert.equal(old.state.active.id,'yeogyeong_notebook');
 for(const e of D.events.filter(e=>e.portraitAsset)){
  assert.ok(D.assets[e.portraitAsset]);assert.ok(D.assets[e.sdAsset]);assert.equal(e.viewer,undefined);
  assert.equal(e.owner,'yeogyeong');assert.ok(!JSON.stringify(e).includes('유예'));
 }
});
