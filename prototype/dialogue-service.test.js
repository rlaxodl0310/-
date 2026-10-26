import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {introduce} from './identity.js';
import {generateDialogueTurn} from './dialogue-generator.js';
import {dialogueServiceContext,applyServiceDialogue,createDialogueService} from './dialogue-service.js';
function ready(){const s=newGame();s.clock.minute=820;introduce(s,'yeogyeong','test');const result=generateDialogueTurn(s,'yeogyeong');return {s,result};}
test('model context contains only this conversation and information the listener actually heard',()=>{
 const {s,result}=ready();s.memory.push('secret');s.events.push({result:'private secret'});s.dialogue.history.push({person:'soyul',text:'other private conversation',generated:true});
 const context=dialogueServiceContext(s,'yeogyeong',result);
 assert.ok(!JSON.stringify(context).includes('secret'));assert.ok(!JSON.stringify(context).includes('other private'));
 assert.equal(context.known.playerWork,null);assert.equal(context.playerLine,result.playerLine);
});
test('model reply changes spoken text only and survives save/load without further inference',()=>{
 const {s,result}=ready(),before=structuredClone(s);
 assert.equal(applyServiceDialogue(s,'yeogyeong',result.turnId,'오늘은 그냥 이야기만 해도 괜찮겠네요.'),true);
 assert.deepEqual(s.clock,before.clock);assert.deepEqual(s.inventory,before.inventory);assert.deepEqual(s.appointments,before.appointments);assert.deepEqual(s.relations,before.relations);
 assert.deepEqual(s.dialogue.sessions['1:afternoon:yeogyeong'].response.options,result.options);
 assert.equal(restore(save(s)).dialogue.history.at(-1).source,'server-model');
 assert.equal(applyServiceDialogue(s,'yeogyeong',9999,'stale'),false);
});
test('file downloads never probe or transmit conversation to a server',async()=>{
 let called=0;const service=createDialogueService({protocol:'file:',fetcher:async()=>{called++;}});
 assert.equal(await service.probe(),false);assert.equal(await service.reply({}),null);assert.equal(called,0);
});
test('configured game host is used automatically without player settings',async()=>{
 const calls=[];const service=createDialogueService({protocol:'https:',fetcher:async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>url.endsWith('/status')?{configured:true}:{text:'오늘은 조금 천천히 이야기해요.'}};}});
 assert.equal(await service.probe(),true);assert.equal(await service.probe(),true);assert.equal(calls.length,1);
 assert.equal(await service.reply({playerLine:'안녕'}),'오늘은 조금 천천히 이야기해요.');assert.equal(calls[1].url,'/api/dialogue');
});
test('unavailable/invalid model and cancelled replies keep the ordinary generator working',async()=>{
 const service=createDialogueService({protocol:'http:',fetcher:async(url)=>({ok:true,json:async()=>url.endsWith('/status')?{configured:true}:{text:{bad:true}}})});
 await service.probe();assert.equal(await service.reply({}),null);
 const controller=new AbortController();controller.abort();assert.equal(await service.reply({},{signal:controller.signal}),null);
 const down=createDialogueService({protocol:'http:',fetcher:async()=>{throw new Error('offline');}});assert.equal(await down.probe(),false);
});
