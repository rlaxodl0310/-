const test=require('node:test'),a=require('node:assert/strict'),M=require('../ui/monsters/catalog.js'),B=require('../ui/battle/engine.js'),meta=require('../world/new-monster-sprites.json');
test('new monsters stay hidden until discovered and retain one fixed essence',()=>{for(const [id,stars,effect]of [['velum',2,'드리프트'],['draven',2,'펄스'],['noxvern',4,'셰이드']]){const s={flags:[]};a.equal(M.detail(s,id).name,'미발견');const m=M.detail(s,id,{creator:true});a.equal(m.stars,stars);a.equal(m.essences.length,1);a.equal(m.essences[0].name,effect);a.equal(s.flags.length,0);for(const f of meta.records[id])a(f.w>0&&f.h>0&&f.x+f.w<=meta.width&&f.y+f.h<=meta.height);}});
test('each new monster supports save/load, approach and unique attack preparation',()=>{for(const [kind,phrase]of [['velum','갈고리'],['draven','브레스'],['noxvern','검은 안개']]){const b=B.restore(new B({kind,count:3}).save()),e=b.units[1],p=b.units[0];a.equal(e.kind,kind);a.equal(b.decide(e,'attack').type,'approach');e.x=p.x+1;e.y=p.y;p.guard=false;a(b.decide(e,'attack').reason.includes(phrase));a(b.act('guard',e.id).some(e=>e.type==='think'));}});

require('node:test')('adult averages and ecology agree between codex and world data',()=>{
  const assert=require('node:assert/strict');
  const catalog=require('../ui/monsters/catalog.js');
  const world=require('../world/monsters.json');
  assert.equal(world.length,catalog.records.length);
  for(const monster of world){
    const record=catalog.detail({flags:['known_monster_'+monster.id]},monster.id);
    assert.deepEqual(record.profile,monster.profile);
    const {heightM,lengthM,massKg}=record.profile.adultAverage;
    assert([heightM,lengthM,massKg].every(value=>Number.isFinite(value)&&value>0));
    assert.equal(catalog.detail({},monster.id).profile,undefined);
  }
  assert.deepEqual(catalog.detail({},'viridion',{creator:true}).profile.adultAverage,
    {heightM:2.4,lengthM:5.5,massKg:380});
});

test('all fixed-essence monsters have a codex entry and discovered seeds persist once',()=>{
  const E=require('../ui/monsters/essence-rules.js');
  const fs=require('node:fs'),path=require('node:path');
  a.deepEqual(M.records.map(m=>m.id).sort(),E.records.map(m=>m.id).sort());
  const seeds=M.records.filter(m=>m.stars===1);
  a.equal(seeds.length,11);
  for(const m of seeds.filter(m=>m.id!=='ant')){
    for(const f of Object.values(m.artFrames)){
      a(fs.existsSync(path.join(__dirname,'../ui',f.src)));
      a(f.x+f.w<=f.imageWidth&&f.y+f.h<=f.imageHeight);
    }
    a.equal(m.essences[0].id,E.records.find(e=>e.id===m.id).effect.id);
  }
  const state={era:'fantasy',flags:['existing'],monsterAppearances:[{id:'por'},{id:'unknown'}],
    combat:{enemies:[{kind:'por'},{kind:'chitin'}]}};
  const next=M.observe(state);
  a.deepEqual(next.flags,['existing','known_monster_por','known_monster_chitin']);
  a.equal(M.observe(next),next);
  a.equal(M.observe({...state,era:'earth'}).flags,state.flags);
  a.deepEqual(state.flags,['existing']);
});
