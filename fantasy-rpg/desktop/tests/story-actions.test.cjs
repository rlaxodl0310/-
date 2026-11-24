const t=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const A=require('../electron/story-actions.cjs'),M=require('../electron/local-mind.cjs'),{initial,StoryDirector}=require('../electron/story-director.cjs'),G=require('../ui/map/geography.js'),{createCombat}=require('../ui/story/combat.js');
const table=()=>({id:'wood-table',name:'나무 탁자',weight:'medium',fixed:false,distance:1,condition:'intact',affordances:['tip','push','hide','inspect'],quote:'가까이에 나무 탁자가 놓여 있다.'});
function state(){const s={...initial(),era:'fantasy',location:G.records[0].id};s.combat=createCombat(['goblin'],'chat','일반 대치');s.combat.distance=1;s.actionWorld={locations:{['fantasy:'+s.location]:{objects:[table()]}},actors:{}};return s;}
const plan=(verb='tip',patch={})=>({verb,target:'wood-table',request:'none',confidence:.9,quote:'탁자를 엎는다',...patch});
function candidate(s,plans=[],objects=[],text='탁자가 넘어지자 고블린이 옆길을 찾는다.'){return{era:s.era,location:s.location,elapsedMinutes:0,scene:'combat',present:s.present,party:s.party,locals:[],focus:s.focus,panels:[{speaker:'narrator',text}],choices:[],facts:[{text,evidence:text}],threads:[],combat:{importance:'ordinary',reason:'',evidenceIds:[],monsters:['goblin'],intent:'observe',target:0,stakes:'danger'},mentalUpdates:[],knowledgeClaims:[],continuityUpdates:[],actionPlan:plans,sceneObjects:objects};}
t('tipping a witnessed reachable table delays one response and persists its state',()=>{const s=state(),r=A.resolve(s,[plan()],M.begin(s,'탁자를 엎는다'));a.equal(A.objects({...s,actionWorld:r.actionWorld})[0].condition,'toppled');a.equal(r.player.hp,100);a(r.resolution.enemyResponse.includes('옆으로'));a.equal(A.objects(s)[0].condition,'intact');const again=A.resolve({...s,...r},[plan()],M.begin(s,'다시 엎는다'));a.equal(again.resolution.steps[0].status,'blocked');});
t('missing, distant, fixed, heavy or unknown-weight objects cannot become effortless success',()=>{for(const patch of [null,{distance:4},{fixed:true},{weight:'heavy'},{weight:'unknown'}]){const s=state();if(patch)Object.assign(A.objects(s)[0],patch);else s.actionWorld.locations['fantasy:'+s.location].objects=[];const r=A.resolve(s,[plan()],M.begin(s,'탁자를 엎는다'));a.equal(r.resolution.steps[0].status,'blocked');a.equal(r.player.hp,100);}});
t('badly injured player cannot tip a table; approach reaches only actual recorded objects',()=>{const s=state();s.player.hp=15;let r=A.resolve(s,[plan()],M.begin(s,'탁자를 엎는다'));a.equal(r.resolution.steps[0].status,'blocked');s.player.hp=100;A.objects(s)[0].distance=3;r=A.resolve(s,[plan('approach',{quote:'탁자에 다가간다'})],M.begin(s,'탁자에 다가간다'));a.equal(A.objects({...s,actionWorld:r.actionWorld})[0].distance,1);});
t('request and physical action are separate; withdrawal is a response and not forced magical healing',()=>{const s=state(),p=plan('request',{target:'yeogyeong',request:'withdraw',quote:'여경은 뒤로 가'}),r=A.resolve(s,[p,plan()],M.begin(s,'여경은 뒤로 가. 탁자를 엎는다'));a.equal(r.resolution.npcReactions[0].response,'accept');a.equal(r.actionWorld.actors.yeogyeong.position,'behind-player');a.equal(r.player.hp,100);a.equal(s.present.length,1);});
t('NPCs can refuse dangerous unfamiliar requests or be absent; request-only turns do not freeze enemy',()=>{const s=state();s.present=['dogyeom'];let r=A.resolve(s,[plan('request',{target:'dogyeom',request:'protect',quote:'도겸아 지켜 줘'})],M.begin(s,'도겸아 지켜 줘'));a.equal(r.resolution.npcReactions[0].response,'refuse');a(r.player.hp<100);r=A.resolve(s,[plan('request',{target:'nea',request:'withdraw',quote:'네아 뒤로 가'})],M.begin(s,'네아 뒤로 가'));a.equal(r.resolution.npcReactions[0].response,'unavailable');});
t('model cannot invent a useful table in same response or rewrite its material properties',()=>{const s=state(),p=plan(),c=candidate(s,[p],[{...table(),id:'new-table',quote:'가까이에 나무 탁자가 놓여 있다.'}],'가까이에 나무 탁자가 놓여 있다.');c.actionPlan[0]={...p,target:'new-table'};a(A.review(c,s,'탁자를 엎는다').errors.length);const changed={...table(),fixed:true};a(A.review(candidate(s,[],[changed],changed.quote),s,'본다',{resolved:true}).errors.length);});
t('unsupported chains, fabricated intent quotes and negated commands are rejected',()=>{const s=state();a(A.review(candidate(s,[plan(),plan('attack',{target:'enemy-0',quote:'공격한다'})]),s,'탁자를 엎는다. 공격한다').errors.length);a(A.review(candidate(s,[plan('tip',{quote:'아예 다른 문장'})]),s,'안녕').errors.length);a(A.review(candidate(s,[plan('tip',{quote:'탁자를 엎지 마'})]),s,'탁자를 엎지 마').errors.length>0);const neg=plan('attack',{quote:'공격하지 마',target:'enemy-0'});a(A.review(candidate(s,[neg]),s,'공격하지 마').errors.length);});
t('low confidence plans ask for clarification without spending HP or a combat round',()=>{const s=state(),r=A.resolve(s,[plan('attack',{target:'enemy-0',confidence:.3,quote:'주먹으로 친다'})],M.begin(s,'주먹으로 친다'));a.equal(r.resolution.steps[0].status,'clarify');a.equal(r.combat.round,0);a.equal(r.player.hp,100);});
t('autonomous goals produce modest different observable actions without granting classes or skills',()=>{const s=state();s.present=['yeogyeong','dogyeom','nea'];const r=A.resolve(s,[],M.begin(s,'상황을 본다'));a.equal(r.resolution.npcReactions.find(n=>n.actor==='yeogyeong').action,'warn');a.equal(r.resolution.npcReactions.find(n=>n.actor==='dogyeom').action,'watch-flank');a.equal(r.resolution.npcReactions.find(n=>n.actor==='nea').action,'step-back');a.equal(r.player.mana,s.player.mana);});
t('full director resolves compound action before narration and preserves blocked object through reload',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'story-actions-')),file=path.join(dir,'story.json'),s=state();let calls=0;const plans=[plan('request',{target:'yeogyeong',request:'withdraw',quote:'여경은 뒤로 가'}),plan()];const d=new StoryDirector(file,{check:async()=>({ready:true}),generateStructured:async()=>{calls++;return candidate(s,plans,[]);}});try{await d.save(s);const next=await d.send({text:'여경은 뒤로 가. 탁자를 엎는다',requestId:'compound-action-1',revision:0});a.equal(calls,2);a.equal(A.objects(next)[0].condition,'toppled');a.equal(A.objects(await d.read())[0].condition,'toppled');a.equal(next.turns[0].resolution.incoming,0);a.equal(next.player.hp,100);}finally{await fs.rm(dir,{recursive:true});}});
t('narration that changes already resolved object state fails atomically',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'story-actions-')),s=state(),d=new StoryDirector(path.join(dir,'story.json'),{check:async()=>({ready:true}),generateStructured:async()=>candidate(s,[plan()],[table()],table().quote)});try{await d.save(s);await a.rejects(d.send({text:'탁자를 엎는다',requestId:'wrong-narration-1',revision:0}));a.equal(A.objects(await d.read())[0].condition,'intact');a.equal((await d.read()).revision,0);}finally{await fs.rm(dir,{recursive:true});}});
t('known strength can move a heavy unfixed obstacle without granting stats to the player',()=>{const s=state();s.player.stats={strength:25};A.objects(s)[0].weight='heavy';const r=A.resolve(s,[plan()],M.begin(s,'탁자를 엎는다'));a.equal(r.resolution.steps[0].status,'success');a.equal(r.player.stats.strength,25);});
t('locked doors remain locked and opening a known closed door survives later observations',()=>{const s=state(),door={...table(),id:'side-door',condition:'locked',fixed:true,affordances:['open','close','inspect']};s.actionWorld.locations['fantasy:'+s.location].objects=[door];let p=plan('open',{target:'side-door',quote:'문을 연다'}),r=A.resolve(s,[p],M.begin(s,'문을 연다'));a.equal(r.resolution.steps[0].status,'blocked');door.condition='closed';r=A.resolve(s,[p],M.begin(s,'문을 연다'));a.equal(A.objects({...s,actionWorld:r.actionWorld})[0].condition,'open');});
t('approaching a living enemy advances distance but does not claim an attack hit',()=>{const s=state();s.combat.distance=3;const p=plan('approach',{target:'enemy-0',quote:'적에게 다가간다'}),r=A.resolve(s,[p],M.begin(s,'적에게 다가간다'));a(r.combat.distance<3);a.equal(r.resolution.outgoing,0);a.equal(r.combat.enemies[0].hp,s.combat.enemies[0].hp);});
t('ordinary observation cannot reset an existing object without an action',()=>{const s=state(),changed={...table(),condition:'broken'};a(A.review(candidate(s,[],[changed],changed.quote),s,'주변을 살핀다').errors.length);});
t('engine object effects update continuity even when the model omits its own anchor update',()=>{const C=require('../electron/story-continuity.cjs'),s=state(),r=A.resolve(s,[plan()],M.begin(s,'탁자를 엎는다')),next={...s,...r,revision:1};next.ledger=[...s.ledger,...A.events(next,r.resolution)];next.continuity=C.commit(next,candidate(s));a.equal(C.activeAnchors(next).find(a=>a.subject==='wood-table').value,'toppled');a(next.ledger.some(e=>e.source==='engine-action'));a(C.audit(next).ok);});
t('grounded hints do not promise locked-door opening or moving fixed/heavy objects',()=>{const s=state(),o=A.objects(s)[0];o.fixed=true;o.weight='heavy';o.condition='locked';o.affordances=['tip','open','inspect'];const hints=A.suggestions(s);a(hints.some(h=>h.text.includes('살핀다')));a(!hints.some(h=>/넘어뜨|열어/.test(h.text)));});

t('questions and reported commands leave the encounter unchanged in two regions',async()=>{
 for(const location of ['north-wild-02','east-wild-01']){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'story-discussion-'));
  const s=state();
  s.location=location;
  s.scene='combat';
  s.actionWorld={locations:{['fantasy:'+location]:{objects:[{...table(),distance:2}]}},actors:{}};
  let evidence='뒤로 이동해';
  const d=new StoryDirector(path.join(dir,'story.json'),{
   check:async()=>({ready:true}),
   generateStructured:async()=>candidate(s,[plan('approach',{quote:evidence})],[],'거리가 줄었다.'),
  });
  try{
   await d.save(s);
   for(const text of ['지금 뒤로 이동해도 돼?','여경이 “뒤로 이동해”라고 말했다.','여경이 뒤로 이동하라고 말했다.']){
    evidence=text.includes('이동하라고')?'뒤로 이동하':'뒤로 이동해';
    const before=await d.read();
    const result=await d.send({text,requestId:'discussion-'+before.revision,revision:before.revision});
    a.deepEqual(result.combat,before.combat);
    a.deepEqual(result.player,before.player);
    a.deepEqual(result.actionWorld,before.actionWorld);
    a.deepEqual(result.ledger,before.ledger);
    a.equal(result.minutes,before.minutes);
    a.match(result.panels[0].text,/확인만/);
   }
  }finally{await fs.rm(dir,{recursive:true});}
 }
});

t('an explicit action after a question still executes and quoted words cannot support a second action',()=>{
 const input='여경이 “탁자를 엎는다”라고 말했다. 나무 쪽으로 이동한다.';
 const s=state();
 const approach=plan('approach',{quote:'나무 쪽으로 이동한다'});
 a.deepEqual(A.review(candidate(s,[approach]),s,input).errors,[]);
 a(A.review(candidate(s,[plan()]),s,input).errors.some(e=>e.includes('인용')));
 const mixed='지금 뒤로 이동해도 돼? 탁자를 엎는다.';
 a.deepEqual(A.review(candidate(s,[plan()]),s,mixed).errors,[]);
 a(A.review(candidate(s,[plan('approach',{quote:'뒤로 이동해'})]),s,mixed).errors.some(e=>e.includes('질문')));
});

t('observed clues reach the next chat context and a restored slot removes them in multiple regions',async()=>{
 for(const location of ['north-wild-02','east-wild-01']){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'story-observation-'));
  const s=state();
  s.location=location;
  s.scene='combat';
  s.combat.distance=3;
  s.actionWorld={locations:{['fantasy:'+location]:{objects:[{...table(),distance:2}]}},actors:{}};
  const observe=plan('observe',{target:'',quote:'귀를 기울인다'});
  const move=plan('approach',{quote:'탁자 쪽으로 이동한다'});
  let prompts=[];
  const d=new StoryDirector(path.join(dir,'story.json'),{
   check:async()=>({ready:true}),
   generateStructured:async messages=>{
    prompts.push(messages[0].content);
    return messages.at(-1).content.includes('귀를 기울인다')
      ?candidate(s,[move,observe],[],'탁자에 다가가 주변 소리를 살핀다.')
      :candidate(s,[],[],'정확한 방향은 아직 확인하지 못했다.');
   },
  });
  try{
   await d.save(s);
   await d.saveSlotAction({action:'save',slot:1,revision:0});
   const found=await d.send({text:'탁자 쪽으로 이동한다. 귀를 기울인다.',requestId:'observation-first',revision:0});
   const [clue]=found.turns.at(-1).resolution.observations;
   a.equal(clue.location,location);
   a.equal(clue.confirmed,found.turns.at(-1).resolution.enemyResponse);
   a.match(clue.uncertain,/정확한 방향/);
   a.deepEqual(found.turnReview.at(-1).observations,[clue]);
   a.equal(A.context(found,'아까 소리',M.begin(found,'아까 소리')).observations[0].freshness,'last-action');
   prompts=[];
   const answered=await d.send({text:'아까 소리 난 방향은 어디야?',requestId:'observation-query',revision:found.revision});
   a(prompts[0].includes(clue.id));
   a.equal(answered.combat.round,found.combat.round);
   const restored=(await d.saveSlotAction({action:'load',slot:1,revision:answered.revision})).state;
   a.deepEqual(A.context(restored,'아까 소리',M.begin(restored,'아까 소리')).observations,[]);
   a.equal(restored.turnReview,undefined);
  }finally{await fs.rm(dir,{recursive:true,force:true});}
 }
});

t('observed references bind the current scene object and slot restore removes later referents',async()=>{
 for(const location of ['north-wild-02','east-wild-01']){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'story-referent-'));
  const s=state();
  s.location=location;
  s.scene='combat';
  const site={objects:[table(),{...table(),id:'other-box',name:'상자'}]};
  s.actionWorld={locations:{['fantasy:'+location]:site},actors:{}};
  const inspect=plan('inspect',{quote:'탁자를 자세히 살핀다'});
  const hide=plan('hide',{quote:'아까 확인한 탁자 뒤에 숨는다'});
  let output=candidate(s,[inspect],[],'탁자를 자세히 살핀다.');
  let calls=0;
  const d=new StoryDirector(path.join(dir,'story.json'),{
   check:async()=>({ready:true}),generateStructured:async()=>{calls++;return output;},
  });
  const send=(text,revision)=>d.send({text,revision,requestId:'referent-'+revision});
  try{
   await d.save(s);
   await d.saveSlotAction({action:'save',slot:1,revision:0});
   const observed=await send(inspect.quote,0);
   a.equal(observed.turns.at(-1).resolution.observations[0].subject,'wood-table');

   output=candidate(s,[{...hide,target:'other-box'}],[],'상자 뒤에 숨는다.');
   const mismatch=await send(hide.quote,observed.revision);
   a.equal(mismatch.combat.round,observed.combat.round);
   a.match(mismatch.panels[0].text,/탁자/);

   output=candidate(s,[hide],[],'탁자 뒤에서 몸을 가린다.');
   const hidden=await send(hide.quote,mismatch.revision);
   a.match(hidden.turns.at(-1).resolution.steps[0].reason,/몸을 가렸다/);

   let current=await d.read();
   A.objects(current)[0].condition='broken';
   await d.save(current);
   output=candidate(s,[hide],[],'망가진 탁자는 엄폐에 쓸 수 없다.');
   const blocked=await send(hide.quote,current.revision);
   a.match(blocked.turns.at(-1).resolution.steps[0].reason,/파손/);
   a.equal(blocked.combat.round,current.combat.round);

   current=await d.read();
   Object.assign(A.objects(current)[0],{condition:'intact',distance:3});
   await d.save(current);
   output=candidate(s,[hide],[],'탁자는 너무 멀다.');
   const distant=await send(hide.quote,current.revision);
   a.match(distant.turns.at(-1).resolution.steps[0].reason,/손이 닿지 않는 거리/);
   a.equal(distant.combat.round,current.combat.round);

   const restored=(await d.saveSlotAction({action:'load',slot:1,revision:distant.revision})).state;
   const before=calls;
   const missing=await send(hide.quote,restored.revision);
   a.equal(calls,before);
   a.equal(missing.combat.round,restored.combat.round);
   a.equal(missing.minutes,restored.minutes);
   a.match(missing.panels[0].text,/어느 물건/);
  }finally{await fs.rm(dir,{recursive:true,force:true});}
 }
});

t('ambiguous objects and unconfirmed sound directions ask for clarification',()=>{
 const s=state();
 const site=s.actionWorld.locations['fantasy:'+s.location];
 site.objects.push({...table(),id:'box',name:'상자'});
 site.observations=[{subject:'wood-table'},{subject:'box'}];
 a.match(A.reference(s,'그 물건 뒤에 숨는다.').message,/탁자, 상자/);
 a.match(A.reference(s,'아까 소리 난 쪽으로 이동한다.').message,/정확한 방향/);
 a.equal(A.reference(s,'아까 확인한 그 탁자 뒤에 숨는다.').target,'wood-table');
 a.equal(A.reference(s,'아까 확인한 탁자가 어디야?'),null);
});
