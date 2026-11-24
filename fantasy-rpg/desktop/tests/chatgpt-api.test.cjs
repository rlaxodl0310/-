const test=require('node:test'),assert=require('node:assert/strict');
const {ChatGPTAPI}=require('../electron/chatgpt-api.cjs');

const key='sk-test-fake-for-unit-test';
const messages=[{role:'system',content:'Game rules'},{role:'user',content:'가까이 가서 인사한다.'}];
const response=value=>({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}]});

test('direct game requests use the official API, with no tools or storage',async()=>{
 const requests=[];
 const result={panels:[{kind:'speech',text:'안녕하세요.'}]};
 const api=new ChatGPTAPI(key,{fetchImpl:async(url,options)=>{
  requests.push({url,options});
  return new Response(JSON.stringify(options.method==='GET'?{id:'gpt-4.1-mini'}:response(result)));
 }});
 assert.equal((await api.check()).provider,'api');
 assert.equal((await api.check()).ready,true);
 assert.deepEqual(await api.generate(messages),result.panels);
 assert.deepEqual(await api.generateStructured(messages,{type:'object'}),result);
 assert.equal(requests.filter(r=>r.options.method==='GET').length,1);
 for(const {url,options} of requests.slice(1)){
  assert.equal(url,'https://api.openai.com/v1/responses');
  assert.equal(options.redirect,'error');
  const body=JSON.parse(options.body);
  assert.deepEqual(body.input,messages);
  assert.equal(body.store,false);
  assert.equal(body.tools,undefined);
  assert.equal(body.text.format.type,'json_object');
 }
});

test('API key errors, incomplete turns, and cancellation surface without a reply',async()=>{
 const invalid=new ChatGPTAPI(key,{fetchImpl:async()=>new Response('',{status:401})});
 assert.equal((await invalid.check()).ready,false);
 const incomplete=new ChatGPTAPI(key,{fetchImpl:async()=>new Response('{"status":"incomplete"}')});
 await assert.rejects(incomplete.generateStructured(messages,{}),/완료된/);
 const pending=new ChatGPTAPI(key,{fetchImpl:async(_url,{signal})=>new Promise((_resolve,reject)=>{
  signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
 })});
 const generation=pending.generate(messages);
 pending.stop();
 await assert.rejects(generation,/중단/);
 assert.equal(pending.busy,false);
});
