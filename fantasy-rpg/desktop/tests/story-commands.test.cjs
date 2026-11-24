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
  await director.save(initial());
  const current={...initial(),revision:1,minutes:15};
  await director.save(current);
  const command=(text,revision=1)=>director.command({text,revision});
  const source=await fs.readFile(file);
  assert.match((await command('/정리')).text,/정리/);
  await command('/질문 여긴 어디야?');
  assert.equal(questions.at(-1),'여긴 어디야?');
  await assert.rejects(director.send({text:'/되돌리기',requestId:'slash-guard-1',revision:1}),/슬래시/);
  assert.match((await command('/확인')).text,/먼저/);
  assert.match((await command('/되돌리기')).text,/0분/);
  assert(source.equals(await fs.readFile(file)));
  await command('/취소');
  assert.match((await command('/확인')).text,/먼저/);
  await command('/되돌리기');
  const restored=await command('/확인');
  assert.equal(restored.state.minutes,0);
  assert.equal(restored.state.revision,2);
  assert.equal(JSON.parse(await fs.readFile(file+'.previous','utf8')).minutes,15);
  assert.match((await command('/확인',2)).text,/먼저/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
