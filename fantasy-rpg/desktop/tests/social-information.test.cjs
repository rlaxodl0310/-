const t=require('node:test'),a=require('node:assert/strict'),E=require('../electron/information-engine.cjs'),S=require('../electron/social-information.cjs'),L=require('../electron/npc-life.cjs'),Mind=require('../electron/local-mind.cjs'),{initial,StoryDirector}=require('../electron/story-director.cjs'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const contact={id:'contact-1',participants:['a','b','c'],minutes:10,location:'site'};
t('information requires actual source knowledge and contact, retains one origin and prevents loops',()=>{let d=E.observe(null,{eventId:'event-1',witnesses:['a']});a.throws(()=>E.tell(d,{id:'bad',eventId:'unknown',from:'a',to:'b',contact}));a.throws(()=>E.tell(d,{id:'bad',eventId:'event-1',from:'a',to:'outsider',contact}));const args={id:'receipt-1',eventId:'event-1',from:'a',to:'b',contact,explicit:true,allowForward:true};d=E.tell(d,args);a.equal(d.actors.b['event-1'].kind,'heard');a.equal(d.actors.a['event-1'].kind,'observed');a.deepEqual(E.tell(d,args),d);a.throws(()=>E.tell(d,{...args,to:'c'}));d=E.tell(d,{id:'receipt-2',eventId:'event-1',from:'b',to:'c',contact,allowForward:true});a.deepEqual(d.actors.c['event-1'].trail,['a','b','c']);a(d.actors.c['event-1'].confidence<d.actors.b['event-1'].confidence);a.throws(()=>E.tell(d,{id:'cycle',eventId:'event-1',from:'c',to:'a',contact}));});
t('privacy and caution can withhold; stress lowers confidence without rewriting the source',()=>{let d=E.observe(null,{eventId:'event-1',witnesses:['a']});let hidden=E.tell(d,{id:'private',eventId:'event-1',from:'a',to:'b',contact});a.equal(hidden.receipts.private.status,'withheld');a.equal(hidden.actors.b,undefined);d=E.tell(d,{id:'stress',eventId:'event-1',from:'a',to:'b',contact,explicit:true,allowForward:true,policy:{stress:.9}});const withheld=E.tell(d,{id:'caution',eventId:'event-1',from:'b',to:'c',contact,policy:{caution:.9}});a.equal(withheld.receipts.caution.status,'withheld');a.equal(d.receipts.stress.reaction,'consider');});
t('automatic propagation requires the same physical place and forwarding permission',()=>{const base=initial(),event={id:'secret',turn:0,text:'확인한 사건',witnesses:['taei']};base.ledger.push(event);let d=E.observe(null,{eventId:'secret',witnesses:['taei']});d=E.tell(d,{id:'first',eventId:'secret',from:'taei',to:'npc_a',contact:{id:'c',participants:['taei','npc_a'],minutes:0},explicit:true,allowForward:true});const state={...base,socialInformation:d,npcLife:{actors:[{id:'npc_a',available:true,locationId:'x',place:'market'},{id:'npc_b',available:true,locationId:'x',place:'gate'}]}};a.equal(S.advance(state).socialInformation.actors.npc_b,undefined);state.npcLife.actors[1].place='market';const next=S.advance(state);a.equal(next.socialInformation.actors.npc_b.secret.kind,'heard');a.equal(state.socialInformation.actors.npc_b,undefined);a.deepEqual(S.advance(next).socialInformation,next.socialInformation);});
t('sharing through the director saves hearsay, protects absent knowledge and rewinds with slots',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'social-test-'));try{const director=new StoryDirector(path.join(dir,'story.json'),{});let s=await director.save({...initial(),era:'fantasy',location:'north-village-01'});const id=s.npcLife.actors[0].id;s=await director.npcMeet({revision:s.revision,id});const event={id:'past-event',turn:s.revision,text:'길에서 낙석을 보았다.',witnesses:['taei']};s.ledger.push(event);await director.save(s);await director.saveSlotAction({action:'save',slot:1,revision:s.revision});s=await director.npcTell({revision:s.revision,requestId:'social-share-001',to:id,eventId:event.id,allowForward:false});a.equal(s.socialInformation.actors[id][event.id].kind,'heard');const frame=Mind.begin(s,'그 일 기억나요?');const good={panels:[{speaker:id,text:'태이에게 전해 들었어요.'}],mentalUpdates:[],knowledgeClaims:[{actorId:id,eventId:event.id,quote:'전해 들었어요.'}]};a.equal(Mind.review(good,s,frame,'그 일 기억나요?').errors.length,0);const bad={...good,panels:[{speaker:id,text:'제가 직접 봤어요.'}],knowledgeClaims:[{actorId:id,eventId:event.id,quote:'직접 봤어요.'}]};a(Mind.review(bad,s,frame,'그 일 기억나요?').errors.length>0);const prev=await fs.readFile(director.file);await a.rejects(director.npcTell({revision:s.revision,requestId:'social-share-002',to:'npc_absent',eventId:event.id}));a(prev.equals(await fs.readFile(director.file)));s=(await director.saveSlotAction({action:'load',slot:1,revision:s.revision})).state;a.equal(s.socialInformation,undefined);}finally{await fs.rm(dir,{recursive:true,force:true});}});

t('generic information engine rejects unsafe identifiers and non-boolean forwarding policy',()=>{a.throws(()=>E.observe(null,{eventId:'__proto__',witnesses:['a']}));const d=E.observe(null,{eventId:'event',witnesses:['a']});a.throws(()=>E.tell(d,{id:'x',eventId:'event',from:'a',to:'b',contact,allowForward:'false'}));});

t('host-provided low trust can withhold an otherwise forwardable rumor',()=>{let d=E.observe(null,{eventId:'event-1',witnesses:['a']});d=E.tell(d,{id:'first',eventId:'event-1',from:'a',to:'b',contact,explicit:true,allowForward:true});d=E.tell(d,{id:'second',eventId:'event-1',from:'b',to:'c',contact,policy:{trust:.1}});a.equal(d.receipts.second.status,'withheld');a.equal(d.actors.c,undefined);});

t('narrator rules explicitly distinguish verified hearsay from direct observation',()=>{const {RULES}=require('../electron/story-director.cjs');a(RULES.includes('socialInformationContext'));a(RULES.includes('전언을 직접 목격이나 확정 사실처럼 말하지 않는다'));});

t('encounter outcomes and observations use the same witnessed and reported knowledge rules',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'shared-knowledge-'));
 try{
  const d=new StoryDirector(path.join(dir,'story.json'),{});
  let state=await d.save({...initial(),era:'fantasy',location:'north-village-01',party:['yeogyeong']});
  const listener=state.npcLife.actors[0].id;
  state=await d.npcMeet({revision:state.revision,id:listener});
  state.combat=require('../ui/story/combat.js').createCombat(['goblin'],'chat','검수');
  await d.save(state);
  const action=require('../electron/story-actions.cjs');
  const after={...state,revision:state.revision+1,combat:{...state.combat,status:'escaped'}};
  after.ledger.push(...action.events(after,{observations:[{
   id:'clue-knowledge',location:state.location,confirmed:'발소리를 확인했다.',uncertain:'정확한 방향은 미확인.',
  }]}));
  await d.save(after);
  state=await d.read();
  const events=state.ledger.filter(e=>['engine-observation','engine-encounter-outcome'].includes(e.source));
  a.equal(events.length,2);
  a.equal(E.provenance(state,'yeogyeong',events.find(e=>e.source==='engine-encounter-outcome')).kind,'observed');
  state=await d.npcMeet({revision:state.revision,id:listener});
  await d.saveSlotAction({action:'save',slot:1,revision:state.revision});
  for(const event of events){
   a.equal(E.provenance(state,listener,event),null);
   state=await d.npcTell({revision:state.revision,requestId:'share-'+event.id,to:listener,eventId:event.id});
   const source=S.context(state).actors.find(actor=>actor.id===listener).heard.find(row=>row.eventId===event.id);
   a.equal(source.kind,'heard');
   a.equal(source.from,'taei');
   const frame=Mind.begin(state,'그 일을 기억해요?');
   for(const [quote,valid] of [['태이에게 전해 들었어요.',true],['내 눈으로 보았어요.',false]]){
    const reply={panels:[{speaker:listener,text:quote}],knowledgeClaims:[{actorId:listener,eventId:event.id,quote}]};
    a.equal(Mind.review(reply,state,frame,'그 일을 기억해요?').errors.length===0,valid);
   }
  }
  const restored=(await d.saveSlotAction({action:'load',slot:1,revision:state.revision})).state;
  a.deepEqual(S.context(restored).actors.find(actor=>actor.id===listener).heard,[]);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
