const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../data.js'),Engine=require('../engine.js');
const context=e=>({location:e.location,members:[...e.members]});

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
  assert.throws(()=>engine.start(e.id,{location:e.location,members:['taei']}));
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
  assert.equal(endings,10);
});
test('invalid choice cannot advance or charge time',()=>{
  const engine=new Engine(D),e=D.events[0];engine.start(e.id,context(e));const before=engine.serialize();
  assert.throws(()=>engine.advance('nonexistent'));assert.equal(engine.serialize(),before);
});
test('active event cannot be overwritten, reading never mutates state',()=>{
  const engine=new Engine(D),e=D.events[0];engine.start(e.id,context(e));const before=engine.serialize();
  assert.throws(()=>engine.start('rain',context(D.events[2])));engine.current();engine.current();assert.equal(engine.serialize(),before);
});
test('malformed saves are rejected, not accepted as world state',()=>{
  for(const save of ['no json','{}',JSON.stringify({version:8,history:[]}),JSON.stringify({version:1,history:[{type:'grant_level',level:999}]})])assert.throws(()=>Engine.restore(D,save));
});
