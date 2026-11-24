const fs=require('node:fs');(async()=>{const target=await(await fetch('http://127.0.0.1:9229/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let serial=0;const waiting=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=waiting.get(m.id);waiting.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;waiting.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};const delay=ms=>new Promise(r=>setTimeout(r,ms)),shot=async file=>{const p=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(file,Buffer.from(p.data,'base64'));};await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:8767/?review=companion74'});await delay(1600);

const H=require('../tests/helpers/companion-talk.cjs'),assert=require('node:assert/strict');const h=await H.ready();try{
await run(`window.qaState=${JSON.stringify(h.s)};window.qaRequest=null;window.desktopAI={directorState:async()=>({ok:true,data:qaState})};`);
for(const[api,method]of Object.entries({directorAdventure:'adventureAction',directorSend:'send',directorCommand:'command'}))await run(`desktopAI[${JSON.stringify(api)}]=async req=>{qaRequest={method:${JSON.stringify(method)},req};return await new Promise(resolve=>window.qaResolve=resolve);};`);
await run('DirectorUI.init()');await delay(120);
async function processAction(){const {method,req}=await run('qaRequest');h.s=await h.d[method](req);await run(`qaState=${JSON.stringify(h.s)};qaResolve({ok:true,data:qaState});`);await delay(90);}
async function press(text){await run(`[...document.querySelectorAll('#panel-body button')].find(b=>!b.disabled&&b.textContent===${JSON.stringify(text)}).click()`);}
await run("document.getElementById('companion-hud').click()");await run(`(() => {const select=document.querySelector('[aria-label="동료와 의논할 의뢰"]');select.dataset.previous=select.value;select.value='';select.dispatchEvent(new Event('change'));})()`);
assert(await run(`[...document.querySelectorAll('#panel-body button')].find(b=>b.textContent==='단서 관찰 부탁하기').disabled`));
await run(`(() => {const select=document.querySelector('[aria-label="동료와 의논할 의뢰"]');select.value=select.dataset.previous;select.dispatchEvent(new Event('change'));})()`);
await press('의견 물어보기');assert(await run("!document.getElementById('companion-chat-target').hidden"));await run("document.getElementById('chat-form').requestSubmit()");await processAction();assert.equal(h.s.panels[0].speaker,'yeogyeong');assert.equal(h.s.companions.exchanges.at(-1).stance,'discuss');await shot('/dev/shm/companion74-dialogue.png');
h.stance='accept';h.quote='좋아, 내가 흔적을 살펴볼게. 잠깐만 기다려.';await run("document.getElementById('companion-hud').click()");await press('단서 관찰 부탁하기');await run("document.getElementById('chat-form').requestSubmit()");await processAction();assert.equal(h.q().tracking.observations,0);await run("document.getElementById('companion-hud').click()");assert(await run("document.getElementById('panel-body').textContent.includes('아직 실행하지 않음')"));await shot('/dev/shm/companion74-agreement.png');await run(`document.querySelector('#panel button[aria-label="닫기"]').click()`);
await run(`[...document.querySelectorAll('#choices button')].find(b=>b.textContent==='차여경의 관찰 실행 · 10분').click()`);
await processAction();
for(const label of ['흔적 더 관찰','조심스럽게 접근','엄폐 따라 우회','물러나 거리 확보']){
 assert(await run(`[...document.querySelectorAll('#choices button')].some(b=>!b.disabled&&b.textContent.startsWith(${JSON.stringify(label)}))`));
}
assert(await run(`![...document.querySelectorAll('#choices button')].some(b=>b.textContent.includes('관찰 실행'))`));
await run("document.getElementById('companion-hud').click()");
assert(await run(`[...document.querySelectorAll("#panel-body p")].some(p=>p.textContent.endsWith("피로 11.3"))`));
assert(await run("!document.getElementById('panel-body').textContent.includes('11.333')"));assert.equal(h.q().tracking.observations,1);assert.equal(h.q().tracking.lastObserver,'yeogyeong');await shot('/dev/shm/companion74-executed.png');
h.stance='refuse';h.quote='지금은 싫어. 조금만 쉬었다가 보자.';await press('단서 관찰 부탁하기');await run("document.getElementById('chat-form').requestSubmit()");await processAction();await run("document.getElementById('companion-hud').click()");assert(await run("document.getElementById('panel-body').textContent.includes('거절')"));assert.equal(h.q().tracking.observations,1);assert.equal(await run("[...document.querySelectorAll('#panel-body button')].filter(b=>b.textContent.includes('관찰 실행')&&!b.disabled).length"),0);
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(100);assert(!await run("document.getElementById('panel-body').scrollWidth>document.getElementById('panel-body').clientWidth+2"));await shot('/dev/shm/companion74-mobile.png');
await run("document.getElementById('close-panel').click()");
const freeInput='여경에게 뒤로 빠지라고 말하고 나는 나무 뒤에서 상대를 살핀다.';
await run(`document.getElementById('chat-input').value=${JSON.stringify(freeInput)};document.getElementById('chat-form').requestSubmit()`);
assert.deepEqual(await run('({method:qaRequest.method,text:qaRequest.req.text})'),{method:'send',text:freeInput});
await run("qaResolve({ok:false,error:'시험용 응답 중단'})");
await delay(90);
assert.equal(await run("document.getElementById('chat-input').value"),freeInput);
const beforeWithdrawal=h.s.minutes;
await run(`[...document.querySelectorAll('#choices button')].find(b=>b.textContent==='물러나 거리 확보 · 5분').click()`);
await processAction();
assert.equal(h.q().tracking.phase,'withdrawn');
assert.equal(h.s.minutes,beforeWithdrawal+5);
assert.equal(h.s.turnReview.at(-1).changes.minutes.after,beforeWithdrawal+5);
assert(await run("document.getElementById('turn-summary').textContent.includes('시간')"));

assert(await run(`![...document.querySelectorAll('#choices button')].some(b=>b.textContent.startsWith('조심스럽게 접근'))`));
assert(await run("document.querySelector('#chat-form').firstElementChild.id==='story-chat-mode'"));
await run("document.querySelector('#story-chat-mode button[data-mode=direct]').click();document.getElementById('chat-input').value='지금 어디야?';document.getElementById('chat-form').requestSubmit()");
assert.deepEqual(await run('({method:qaRequest.method,text:qaRequest.req.text})'),{method:'command',text:'/질문 지금 어디야?'});
await run("qaResolve({ok:true,data:{text:'검수용 직접 답변'}})");
await delay(90);
assert(await run("document.getElementById('story-command-result').textContent==='검수용 직접 답변'"));
assert(await run("document.querySelector('#story-chat-mode button[data-mode=direct]').getAttribute('aria-pressed')==='true'"));
await run("document.querySelector('#story-chat-mode button[data-mode=command]').click()");
assert(await run("!document.getElementById('story-command-shortcuts').hidden"));
await run(`[...document.querySelectorAll('#story-command-shortcuts button')].find(b=>b.textContent==='/되돌리기').click()`);
assert.equal(await run("document.getElementById('chat-input').value"),'/되돌리기');
assert.equal(await run("qaRequest.req.text"),'/질문 지금 어디야?');
await run("document.getElementById('chat-input').value='정리';document.getElementById('chat-form').requestSubmit()");
assert.deepEqual(await run('({method:qaRequest.method,text:qaRequest.req.text})'),{method:'command',text:'/정리'});
await run("qaResolve({ok:true,data:{text:'검수용 상황 정리'}})");
await delay(90);
assert(await run("document.getElementById('story-command-result').textContent==='검수용 상황 정리'"));
await run("document.querySelector('#story-chat-mode button:first-child').click()");
await run("document.getElementById('chat-input').value='/되돌리기';document.getElementById('chat-form').requestSubmit()");
await run(`qaResolve({ok:true,data:{text:'미리보기',preview:{revision:qaState.revision,current:{location:'수림',minutes:70,round:2},target:{location:'수림',minutes:65,round:1},lastAction:'상자 뒤에 숨는다',removedObservationCount:1,removedObservations:['발소리 확인']}}})`);
await delay(90);
assert(await run("document.getElementById('story-restore-preview').textContent.includes('2라운드 → 1라운드')"));
await run("document.querySelector('#story-restore-preview button:last-child').click()");
assert.equal(await run("qaRequest.req.text"),'/취소');
await run("qaResolve({ok:true,data:{text:'복구를 취소했어요.'}})");
await delay(90);
assert(await run("document.getElementById('story-restore-preview').hidden"));
await run("document.getElementById('chat-input').value='/되돌리기';document.getElementById('chat-form').requestSubmit()");
await run(`qaResolve({ok:true,data:{text:'미리보기',preview:{revision:qaState.revision,current:{location:'수림',minutes:70,round:2},target:{location:'수림',minutes:65,round:1},removedObservationCount:0,removedObservations:[]}}})`);
await delay(90);
await run("document.querySelector('#story-restore-preview button:first-of-type').click()");
assert.equal(await run("qaRequest.req.text"),'/확인');
await run("qaResolve({ok:true,data:{text:'복구 완료',state:{...qaState,minutes:65,revision:qaState.revision+1}}})");
await delay(90);
assert(await run("document.getElementById('story-restore-preview').hidden && document.getElementById('elapsed').textContent==='65분'"));

await run("document.querySelector('[data-panel=journal]').click()");
const checkpoint=await run("qaState.checkpoints.at(-1).turn");
await run(`[...document.querySelectorAll('#panel-body button')].filter(b=>b.textContent==='이 행동 직전으로').at(-1).click()`);
assert.equal(await run("qaRequest.req.text"),'/되돌리기 '+checkpoint);
await run(`qaResolve({ok:true,data:{text:'미리보기',preview:{revision:qaState.revision+1,selectedTurn:qaState.checkpoints.at(-1).turn,selectedAction:'거리 확보',current:{location:'수림',minutes:65,round:null},target:{location:'수림',minutes:60,round:null},removedTurnCount:2,removedActionCount:1,removedObservationCount:0,removedObservations:[]}}})`);
await delay(90);
assert(await run("document.getElementById('story-restore-preview').textContent.includes('채팅 2턴')"));
assert.equal(errors.length,0);console.log(JSON.stringify({passed:true,provider:'controlled fixture, not live ChatGPT account',checks:['main NPC dialogue','target request survives UI routing','consent without observation','disabled observation without eligible clues','explicit ten minute observation from main screen','companion fatigue rounded for display','refusal without action','mobile390 no panel overflow','compound input reaches the story director unchanged','main-story withdrawal produces a turn summary','three chat modes route inputs and shortcuts separately','restore preview renders changes and both buttons follow the command path','journal actions open a targeted rewind preview','no JavaScript exceptions'],exchanges:h.s.companions.exchanges.length,observations:h.q().tracking.observations,minutes:h.s.minutes}));
}finally{await h.close();}await call('Page.close');ws.close();})().catch(e=>{console.error(e);process.exit(1);});
