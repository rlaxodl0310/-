const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {StoryDirector,initial}=require('../electron/story-director.cjs');
const {createCombat,resolveCombat}=require('../ui/story/combat.js');
const Outcomes=require('../electron/encounter-outcomes.cjs');

test('the same save boundary records a finished encounter in multiple locations and restores it with the slot',async()=>{
 for(const location of ['north-wild-02','east-wild-01']){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'encounter-outcome-'));
  let prompt;
  const d=new StoryDirector(path.join(dir,'story.json'),{
   check:async()=>({ready:true}),
   generateStructured:async messages=>{prompt=messages[0].content;throw Error('검수 완료');},
  });
  try{
   const before={...initial(),era:'fantasy',location,scene:'combat',party:['yeogyeong','dogyeom']};
   before.combat=createCombat(['goblin'],'chat','검수');
   before.combat.distance=4;
   await d.save(before);
   await d.saveSlotAction({action:'save',slot:1,revision:before.revision});
   const result=resolveCombat(before.combat,before.player,'flee');
   assert.equal(result.combat.status,'escaped');
   const after={...before,revision:1,combat:result.combat,player:result.player,present:['yeogyeong','dogyeom']};
   await d.save(after);
   const saved=await d.read();
   const [event]=Outcomes.context(saved);
   assert.equal(event.outcome.status,'escaped');
   assert.equal(event.outcome.remaining,1);
   assert.equal(event.outcome.player.hp,saved.player.hp);
   assert.deepEqual(event.witnesses,['taei','yeogyeong']);
   await d.save(saved);
   assert.equal(Outcomes.context(await d.read()).length,1);
   await assert.rejects(d.send({requestId:'outcome-prompt',revision:1,text:'방금 일을 떠올린다.'}),/검수 완료/);
   assert(prompt.includes(event.id));
   const restored=(await d.saveSlotAction({action:'load',slot:1,revision:1})).state;
   assert.deepEqual(Outcomes.context(restored),[]);
   await assert.rejects(d.send({requestId:'restored-outcome',revision:restored.revision,text:'주변을 바라본다.'}),/검수 완료/);
   assert(!prompt.includes(event.id));
  }finally{await fs.rm(dir,{recursive:true,force:true});}
 }
});

test('real-time withdrawal keeps survivors unknown while a settled win records zero',()=>{
 const before={...initial(),era:'fantasy',location:'north-wild-02'};
 before.combat=createCombat(['goblin'],'realtime','검수');
 for(const [status,remaining] of [['withdrawn',null],['won',0]]){
  const next={...structuredClone(before),revision:1};
  next.combat.status=status;
  Outcomes.record(before,next);
  assert.equal(Outcomes.context(next)[0].outcome.remaining,remaining);
 }
});
