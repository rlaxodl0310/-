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

test('targeted rewind retains five checkpoints, restores an earlier branch and keeps undo available',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'story-checkpoints-'));
 const file=path.join(dir,'story.json');
 let prompt='';
 const d=new StoryDirector(file,{
  check:async()=>({ready:true}),
  generateStructured:async messages=>{prompt=messages[0].content;throw Error('검수 완료');},
 });
 try{
  let state=initial();
  await d.save(state);
  for(let turn=1;turn<=6;turn++){
   const id='checkpoint-'+turn;
   const panels=[{speaker:'narrator',text:'장면 '+turn}];
   state={...state,revision:turn,minutes:turn*5,panels,turns:[...state.turns,{id,text:'행동 '+turn,panels}]};
   if(turn===4)state.actionWorld={actors:{yeogyeong:{lastRequest:'future-reaction'}},locations:{
    'earth:subway':{objects:[],observations:[{id:'future-clue',confirmed:'미래 관찰'}]},
   }};
   await d.save(state,{review:{requestId:id,input:'행동 '+turn}});
  }
  assert.deepEqual(state.checkpoints.map(item=>item.turn),[2,3,4,5,6]);
  const command=(text,revision=6)=>d.command({text,revision});
  await assert.rejects(command('/되돌리기 1'),/저장이 없습니다/);
  const original=await fs.readFile(file);
  const preview=(await command('/되돌리기 4')).preview;
  assert.equal(preview.selectedAction,'행동 4');
  assert.equal(preview.target.minutes,15);
  assert.equal(preview.removedTurnCount,3);
  assert.deepEqual(preview.removedObservations,['미래 관찰']);
  await command('/취소');
  assert(original.equals(await fs.readFile(file)));
  await command('/되돌리기 4');
  const {state:restored}=await command('/확인');
  assert.equal(restored.minutes,15);
  assert.deepEqual(restored.turns.map(t=>t.text),['행동 1','행동 2','행동 3']);
  assert.deepEqual(restored.checkpoints.map(item=>item.turn),[2,3]);
  assert(!JSON.stringify(restored.actionWorld||{}).includes('future-reaction'));
  await assert.rejects(d.send({text:'주변을 바라본다',revision:restored.revision,requestId:'checkpoint-next'}),/검수 완료/);
  assert(prompt.length>0);
  assert(!prompt.includes('future-reaction')&&!prompt.includes('future-clue'));
  const undo=(await command('/되돌리기',restored.revision)).preview;
  assert.equal(undo.target.minutes,30);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
