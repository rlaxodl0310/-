const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {StoryDirector,initial}=require('../electron/story-director.cjs');

test('direct commands do not advance play and confirmed restore preserves both save states',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'story-commands-'));
 const file=path.join(dir,'story.json');
 const questions=[];
 const director=new StoryDirector(file,{
  check:async()=>({ready:true}),
  generateStructured:async messages=>{questions.push(messages.at(-1).content);return{text:'상황을 정리했어요.'};},
 });
 try{
  const first=initial();
  first.combat=require('../ui/story/combat.js').createCombat(['goblin'],'chat','검수');
  first.combat.round=1;
  await director.save(first);
  const current={...first,revision:1,minutes:15,combat:{...first.combat,round:2},
   turnReview:[{input:'상자 뒤에 숨는다'}],
   actionWorld:{actors:{},locations:{'earth:subway':{objects:[],observations:[{id:'clue-1',confirmed:'발소리 확인'}]}}},
  };
  await director.save(current);
  const command=(text,revision=1)=>director.command({text,revision});
  const source=await fs.readFile(file);
  assert.match((await command('/정리')).text,/정리/);
  await command('/질문 여긴 어디야?');
  assert.equal(questions.at(-1),'여긴 어디야?');
  await assert.rejects(director.send({text:'/되돌리기',requestId:'slash-guard-1',revision:1}),/슬래시/);
  assert.match((await command('/확인')).text,/먼저/);
  const {preview}=await command('/되돌리기');
  assert.equal(preview.current.minutes,15);
  assert.equal(preview.target.minutes,0);
  assert.equal(preview.current.round,2);
  assert.equal(preview.target.round,1);
  assert.equal(preview.lastAction,'상자 뒤에 숨는다');
  assert.equal(preview.removedObservationCount,1);
  assert.deepEqual(preview.removedObservations,['발소리 확인']);
  assert(source.equals(await fs.readFile(file)));
  await command('/취소');
  assert(source.equals(await fs.readFile(file)));
  assert.match((await command('/확인')).text,/먼저/);
  await command('/되돌리기');
  const restored=await command('/확인');
  assert.equal(restored.state.minutes,0);
  assert.equal(restored.state.revision,2);
  assert.equal(restored.state.combat.round,preview.target.round);
  assert.equal(restored.state.actionWorld?.locations['earth:subway']?.observations,undefined);
  assert.equal(JSON.parse(await fs.readFile(file+'.previous','utf8')).minutes,15);
  assert.match((await command('/확인',2)).text,/먼저/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
