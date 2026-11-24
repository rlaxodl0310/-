const UpdateBackup=require('./update-backup.cjs');
const {AIDiagnostics}=require('./ai-diagnostics.cjs');
const {app,BrowserWindow,ipcMain,dialog,shell,nativeImage,safeStorage}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),{existsSync}=require('node:fs');
const {pathToFileURL}=require('node:url');
const {assetURL}=require('./scene-art.cjs');
const {LookPacks}=require('./look-packs.cjs');
const {QuestBoard}=require('./quest-board.cjs');
const {StoryDirector}=require('./story-director.cjs');
const {StoryChat}=require('./story-chat.cjs');
const {BattleJudge}=require('./battle-judge.cjs');
const {RealtimeJudge}=require('./realtime-judge.cjs');
const {ChatGPTAPI}=require('./chatgpt-api.cjs');
const {CodexBridge}=require('./codex.cjs'),{Dialogue}=require('./dialogue.cjs');
let diagnostics,director,window,bridge,nativeBridge,apiBridge,apiSelected=false,switching=false,dialogue,battleJudge,realtimeJudge,quests,story,looks,deviceURL=null;
const battleEntry=pathToFileURL(path.join(__dirname,'../ui/battle/index.html')).href;
const realtimeEntry=pathToFileURL(path.join(__dirname,'../ui/realtime/index.html')).href;
const entry=pathToFileURL(path.join(__dirname,'../ui/index.html')).href;
function allowedURL(value){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='auth.openai.com'&&['/codex/device','/oauth/authorize','/authorize'].includes(url.pathname);}catch{return false;}}
async function executable(){if(process.env.FANTASY_CODEX_BIN&&existsSync(process.env.FANTASY_CODEX_BIN))return process.env.FANTASY_CODEX_BIN;let config={};try{config=JSON.parse(await fs.readFile(path.join(app.getPath('userData'),'settings.json'),'utf8'));}catch{}if(typeof config.cli==='string'&&existsSync(config.cli))return config.cli;const platform=process.platform,arch=process.arch;if(app.isPackaged){const native=path.join(process.resourcesPath,'codex-'+platform+'-'+arch,'bin',platform==='win32'?'codex.exe':'codex');if(existsSync(native))return native;}const triple={linux:'x86_64-unknown-linux-musl',win32:'x86_64-pc-windows-msvc',darwin:'x86_64-apple-darwin'}[platform];const native=path.join(__dirname,'../node_modules/@openai/codex-'+platform+'-'+arch,'vendor',triple||'', 'bin',platform==='win32'?'codex.exe':'codex');return existsSync(native)?native:(process.env.FANTASY_CODEX_BIN||'codex');}
async function rememberInstallation(){if(!app.isPackaged||process.platform!=='win32')return;try{const file=path.join(app.getPath('appData'),'FantasyStory','installations.txt');let prior=[];try{prior=(await fs.readFile(file,'utf8')).split(/\r?\n/).filter(Boolean).slice(0,20);}catch{}const current=path.dirname(process.execPath),rows=[current,...prior.filter(p=>p.toLowerCase()!==current.toLowerCase())].slice(0,20);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,rows.join('\r\n'));}catch{/* Discovery hint failure must not prevent playing. */}}
const apiFile=()=>path.join(app.getPath('userData'),'openai-api-key.enc');
const apiReady=()=>({ready:false,provider:'api',message:'저장된 API 키를 열 수 없습니다. 설정에서 키를 다시 입력해 주세요.'});
function activeBridge(){
 if(switching)throw Error('연결 방식 변경이 진행 중입니다.');
 if(!apiSelected)return nativeBridge;
 if(apiBridge)return apiBridge;
 throw Error(apiReady().message);
}
function makeStoryBridge(){
 return {
  get busy(){return switching||Boolean((apiSelected?apiBridge:nativeBridge)?.busy);},
  check:async()=>apiSelected&&!apiBridge?apiReady():activeBridge().check(),
  stop:()=>((apiSelected?apiBridge:nativeBridge)?.stop()),
  generate:(...args)=>activeBridge().generate(...args),
  generateStructured:(...args)=>activeBridge().generateStructured(...args),
 };
}
async function loadAPI(){
 let encrypted;
 try{encrypted=await fs.readFile(apiFile());}catch(error){if(error.code!=='ENOENT')apiSelected=true;return;}
 apiSelected=true;
 try{apiBridge=new ChatGPTAPI(safeStorage.decryptString(encrypted));}catch{/* Resupply the key without changing providers. */}
}
async function chooseAPI(key){
 if(bridge.busy||diagnostics.running||director.busy||dialogue.busy||quests.busy||story.busy)throw Error('진행 중인 요청이 끝난 뒤 연결 방식을 바꿔 주세요.');
 switching=true;
 try{
  if(key===null){
   await fs.rm(apiFile(),{force:true});
   apiBridge=null;apiSelected=false;
   return {ready:false,provider:'subscription',message:'구독 연결로 전환했습니다. 연결 상태를 확인해 주세요.'};
  }
  if(!safeStorage.isEncryptionAvailable()||(process.platform==='linux'&&safeStorage.getSelectedStorageBackend?.()==='basic_text'))throw Error('운영체제에서 API 키를 안전하게 저장할 수 없습니다.');
  const next=new ChatGPTAPI(key);
  const status=await next.check();
  if(!status.ready)throw Error(status.message);
  const file=apiFile(),temporary=file+'.tmp';
  try{
   await fs.writeFile(temporary,safeStorage.encryptString(key),{mode:0o600});
   await fs.rename(temporary,file);
  }finally{await fs.rm(temporary,{force:true});}
  apiBridge=next;apiSelected=true;
  return status;
 }finally{switching=false;}
}
async function configure(){looks=new LookPacks(path.join(app.getPath('userData'),'appearance-packs'),{validateImage:bytes=>{const image=nativeImage.createFromBuffer(bytes);if(image.isEmpty())throw Error('PNG 이미지를 해석하지 못했습니다.');}});nativeBridge=new CodexBridge(await executable(),{onLogin:info=>{if(allowedURL(info.url))deviceURL=info.url;window?.webContents.send('ai:progress',info);}});bridge=makeStoryBridge();await loadAPI();diagnostics=new AIDiagnostics(new CodexBridge(await executable()));battleJudge=new BattleJudge(bridge);realtimeJudge=new RealtimeJudge(bridge);quests=new QuestBoard(path.join(app.getPath('userData'),'quest-board-test.json'),bridge);director=new StoryDirector(path.join(app.getPath('userData'),'emergent-story.json'),bridge);story=new StoryChat(path.join(app.getPath('userData'),'story-chat-test.json'),bridge);dialogue=new Dialogue(path.join(app.getPath('userData'),'ai-dialogue.json'),bridge);}
async function currentSample(asset){if(asset?.packId==='official-example'&&asset.lookId==='yeogyeong-school')return {...asset,dataURL:'data:image/png;base64,'+(await fs.readFile(path.join(__dirname,'../ui/assets/yeogyeong-standing.png'))).toString('base64'),layout:{columns:1,rows:1}};return asset;}
function register(){for(const [channel,handler]of Object.entries({
 'diagnostics:status':()=>diagnostics.status(),
  'diagnostics:start':r=>{
  if(switching||diagnostics.running)throw Error('연결 변경이나 앞선 진단이 끝날 때까지 기다려 주세요.');
  diagnostics.bridge=apiSelected?new ChatGPTAPI(activeBridge().key):new CodexBridge(nativeBridge.executable);
  return diagnostics.start(r);
 },
 'diagnostics:cancel':()=>diagnostics.cancel(),
 'art:asset':key=>assetURL(path.join(__dirname,'../ui'),key),
 'quest:list':()=>quests.read(),
 'quest:refresh':r=>quests.refresh(r?.scenario,r?.ai===true),
 'quest:accept':r=>quests.accept(r?.id),
 'quest:expense':r=>quests.expense(r?.index,r?.scenario),
 'quest:simulate':r=>quests.simulate(r?.id),
 'quest:sell':r=>quests.sell(r?.item,r?.quantity),
 'quest:advance':()=>quests.advance(),
 'director:npcTell':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.npcTell(r);},
 'director:npcAppointment':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.npcAppointment(r);},
 'director:npcMeet':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.npcMeet(r);},
 'director:backups':()=>UpdateBackup.list(app.getPath('userData')),
 'director:slots':()=>director.saveSlots(),
 'director:slot':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.saveSlotAction(r);},
 'director:restore':r=>{if(bridge.busy)throw Error('진행 중인 AI 응답을 마친 뒤 복구해 주세요.');return director.restorePrevious(r?.revision??null);},
 'director:state':()=>director.read(),
 'director:recommendations':async()=>{
  const state=await director.read();
  return {revision:state.revision,choices:require('./story-recommendations.cjs').build(state)};
 },
 'director:streetReturn':r=>director.returnFromStreet(r),
 'director:enterMeadow':r=>director.enterMeadow(r),
 'director:send':r=>director.send(r),
 'director:command':r=>director.command(r),
 'director:boardRefresh':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.boardRefresh(r);},
 'director:transportView':()=>director.transportView(),
 'director:transport':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.transportAction(r);},
 'director:npcPartyView':()=>director.npcPartyView(),
 'director:npcParty':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.npcPartyAction(r);},
 'director:dungeon':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.dungeonAction(r);},
 'director:rescue':r=>{if(bridge.busy)throw Error('AI 응答을 먼저 마쳐 주세요.');return director.rescueAction(r);},
 'director:mining':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.miningAction(r);},
 'director:personalEscort':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.personalEscortAction(r);},
 'director:escort':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.escortAction(r);},
 'director:party':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.partyAction(r);},
 'director:service':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.serviceAction(r);},
 'director:trade':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.tradeAction(r);},
 'director:roles':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.assignRoles(r);},
 'director:adventure':r=>{if(bridge.busy)throw Error('AI 응답을 먼저 마쳐 주세요.');return director.adventureAction(r);},
 'director:progression':r=>{if(bridge.busy)throw Error('AI 응답이 끝난 뒤 변경해 주세요.');return director.progressionAction(r);},
 'director:launch':async r=>{if(bridge.busy)throw Error('진행 중인 입력을 마쳐 주세요.');await director.realtimeStart(r?.revision);await window.loadURL(realtimeEntry);return{ok:true};},
 'director:handoff':()=>director.activeHandoff?director.read().then(s=>({...director.activeHandoff,player:s.player,monsters:s.combat.monsters,enemies:s.combat.enemies,present:s.present,party:s.party||[],companionGrowth:Object.fromEntries((s.party||[]).filter(id=>s.present.includes(id)).map(id=>[id,{level:s.partyRewards?.members[id]?.level||1,points:s.partyRewards?.members[id]?.points||0}])),roleAssignments:s.roleAssignments||{},skillBook:s.skillBook,commonState:s.combat.commonState})):null,
 'director:finish':async r=>{const s=await director.realtimeFinish(r);await window.loadURL(entry);return s;},
 'story:state':()=>story.read(),
 'story:send':r=>story.send(r),
 'story:reset':()=>story.reset(),
 'looks:list':()=>looks.list(),
 'looks:import':async()=>{const picked=await dialog.showOpenDialog(window,{title:'외형팩 불러오기',properties:['openFile'],filters:[{name:'외형팩',extensions:['lookpack','json']}]});if(picked.canceled)return{cancelled:true};const f=picked.filePaths[0];if((await fs.stat(f)).size>32*1024*1024)throw Error('외형팩은 최대 32MB입니다.');return looks.importText(await fs.readFile(f,'utf8'));},
 'looks:sample':async()=>looks.importText(await fs.readFile(path.join(__dirname,'../ui/sample.lookpack'),'utf8')),
 'looks:toggle':request=>looks.toggle(request?.packId,request?.enabled),
 'looks:remove':request=>looks.remove(request?.packId),
 'looks:preview':async request=>currentSample(await looks.preview(request?.packId,request?.lookId)),
 'looks:resolve':async request=>currentSample(await looks.resolve(request)),
 'ai:status':()=>bridge.check(),
 'ai:choose-api':key=>chooseAPI(key),
 'ai:battle':async request=>{const status=await bridge.check();if(!status.ready)throw Error(status.message);return battleJudge.judge(request);},
 'ai:realtime':async request=>{const status=await bridge.check();if(!status.ready)throw Error(status.message);return realtimeJudge.judge(request);},
 'ai:open-realtime':async()=>{if(bridge.busy||realtimeJudge.busy)throw Error('진행 중인 입력을 마쳐 주세요.');await window.loadURL(realtimeEntry);return{ok:true};},
 'ai:open-battle':async()=>{if(bridge.busy||dialogue.busy||battleJudge.busy||quests.busy||story.busy)throw Error('진행 중인 요청을 마치거나 취소해 주세요.');await window.loadURL(battleEntry);return{ok:true};},
 'ai:open-story':async()=>{if(bridge.busy||realtimeJudge.busy||battleJudge.busy||quests.busy||story.busy)throw Error('진행 중인 요청을 마치거나 취소해 주세요.');await window.loadURL(entry);return{ok:true};},
 'ai:login':async(method='browser')=>{if(dialogue.busy)throw Error('대화가 끝난 뒤 로그인해 주세요.');if(apiSelected||switching)throw Error('먼저 구독 연결로 전환해 주세요.');deviceURL=null;await nativeBridge.login(method);return nativeBridge.check();},
 'ai:cancel':()=>{bridge.stop();return{ok:true};},
 'ai:chat':async request=>{const status=await bridge.check();if(!status.ready)throw Error(status.message);return dialogue.send(request);},
 'ai:reset':()=>dialogue.reset(),
 'ai:open-login':async()=>{if(!allowedURL(deviceURL))throw Error('먼저 로그인을 눌러 인증 코드를 받아 주세요.');await shell.openExternal(deviceURL);return{ok:true};},
 'ai:choose-cli':async()=>{if(bridge.busy||dialogue.busy||quests.busy||story.busy)throw Error('진행 중인 요청이 끝난 뒤 선택해 주세요.');const result=await dialog.showOpenDialog(window,{title:'공식 Codex 실행 파일 선택',properties:['openFile'],filters:process.platform==='win32'?[{name:'Codex 실행 파일',extensions:['exe']}]:[]});if(result.canceled)return{cancelled:true};const cli=result.filePaths[0];if(process.platform==='win32'&&!cli.toLowerCase().endsWith('.exe'))throw Error('공식 codex.exe를 선택해 주세요.');await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(path.join(app.getPath('userData'),'settings.json'),JSON.stringify({cli}));nativeBridge.executable=cli;return bridge.check();}
 }))ipcMain.handle(channel,async(event,...args)=>{if(event.sender!==window?.webContents||event.senderFrame!==window.webContents.mainFrame||![entry,battleEntry,realtimeEntry].includes(event.senderFrame.url.split('#')[0]))throw Error('허용하지 않는 요청입니다.');try{return{ok:true,data:await handler(...args)};}catch(error){return{ok:false,error:error.message};}});}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
 app.whenReady().then(async()=>{await UpdateBackup.prepare(app.getPath('userData'),app.getVersion());await configure();await rememberInstallation();register();window=new BrowserWindow({width:1380,height:940,minWidth:850,minHeight:700,title:'이세계 기록',backgroundColor:'#111613',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,url)=>{if(![entry,battleEntry,realtimeEntry].includes(url.split('#')[0]))event.preventDefault();});window.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));await window.loadURL(entry);window.on('closed',()=>{bridge.stop();window=null;});}).catch(()=>{dialog.showErrorBox('앱 시작 실패','앱 파일을 다시 확인해 주세요.');app.quit();});
 app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>bridge?.stop());
}
