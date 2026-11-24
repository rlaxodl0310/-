const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const Risk=require('../electron/npc-risk-actions.cjs');
const Knowledge=require('../electron/information-engine.cjs');
const {initial,StoryDirector}=require('../electron/story-director.cjs');

function scene(){
 const s={...initial(),era:'fantasy',location:'north-city-01',scene:'exploration',
  present:['yeogyeong','dogyeom'],party:['yeogyeong','dogyeom'],visitedLocations:['north-wild-02','north-village-01']};
 s.ledger=[{id:'hazard',turn:0,text:'위협에서 물러났다.',risk:{location:'north-wild-02'},witnesses:['taei','yeogyeong']}];
 return s;
}
const proposal=(action,target,quote,actorId='yeogyeong')=>({
 panels:[{speaker:actorId,text:quote}],npcRiskActions:[{actorId,eventId:'hazard',action,target,quote}],
});

test('warning creates hearsay, unknown actors cannot act, and detour must use a registered route',()=>{
 const s=scene();
 assert.throws(()=>Risk.apply(s,proposal('verify',null,'확인해 보자.','dogyeom')),/알고 있는/);
 assert.throws(()=>Risk.apply(s,proposal('warn','absent','조심하라고 알려 주자.')),/실제 상대/);
 const warned=Risk.apply(s,proposal('warn','dogyeom','위험하니 조심해.'),{requestId:'warn-test'});
 assert.equal(Knowledge.provenance(warned,'dogyeom',s.ledger[0]).from,'yeogyeong');
 assert.equal(Knowledge.provenance(warned,'dogyeom',s.ledger[0]).kind,'heard');
 assert.throws(()=>Risk.apply(warned,proposal('warn','taei','위험하니 조심해.','dogyeom')),/재전달/);
 assert.throws(()=>Risk.apply(s,proposal('detour','north-wild-02','다른 길로 우회하자.')),/등록 경로/);
 const reviewed=Risk.apply(s,proposal('detour','north-village-01','다른 길로 우회하자.'),{requestId:'detour-test'});
 assert.equal(reviewed.npcRiskResponses[0].route.at(-1),'north-village-01');
 assert.equal(reviewed.location,s.location);
 assert.equal(reviewed.journeys,s.journeys);
});

test('the story director commits risk responses and slot restoration rewinds knowledge and reactions',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'npc-risk-'));
 const state=scene();
 let answer;
 const d=new StoryDirector(path.join(dir,'story.json'),{
  check:async()=>({ready:true}),generateStructured:async()=>answer,
 });
 try{
  await d.save(state);
  await d.saveSlotAction({action:'save',slot:1,revision:0});
  const patch=proposal('warn','dogyeom','위험하니 조심해.');
  answer={...patch,era:state.era,location:state.location,elapsedMinutes:0,scene:'exploration',
   present:state.present,party:state.party,locals:[],focus:'yeogyeong',choices:[],facts:[],threads:[],
   combat:{importance:'none',reason:'',evidenceIds:[],monsters:[],intent:'talk',target:0,stakes:'none'}};
  const after=await d.send({text:'서로 주의할 점을 이야기하자.',requestId:'warn-director',revision:0});
  assert.equal(after.npcRiskResponses.at(-1).kind,'warn');
  assert.equal(Knowledge.provenance(after,'dogyeom',state.ledger[0]).kind,'heard');
  const restored=(await d.saveSlotAction({action:'load',slot:1,revision:after.revision})).state;
  assert.equal(restored.npcRiskResponses,undefined);
  assert.equal(Knowledge.provenance(restored,'dogyeom',state.ledger[0]),null);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
