const {app,BrowserWindow,ipcMain,dialog,shell}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),{existsSync}=require('node:fs');
const {pathToFileURL}=require('node:url');
const {CodexBridge}=require('./codex.cjs'),{Dialogue}=require('./dialogue.cjs');
let window,bridge,dialogue,deviceURL=null;
const entry=pathToFileURL(path.join(__dirname,'../ui/index.html')).href;
function allowedURL(value){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='auth.openai.com'&&['/codex/device','/oauth/authorize','/authorize'].includes(url.pathname);}catch{return false;}}
async function executable(){if(process.env.FANTASY_CODEX_BIN&&existsSync(process.env.FANTASY_CODEX_BIN))return process.env.FANTASY_CODEX_BIN;let config={};try{config=JSON.parse(await fs.readFile(path.join(app.getPath('userData'),'settings.json'),'utf8'));}catch{}if(typeof config.cli==='string'&&existsSync(config.cli))return config.cli;const platform=process.platform,arch=process.arch;if(app.isPackaged){const native=path.join(process.resourcesPath,'codex-'+platform+'-'+arch,'bin',platform==='win32'?'codex.exe':'codex');if(existsSync(native))return native;}const triple={linux:'x86_64-unknown-linux-musl',win32:'x86_64-pc-windows-msvc',darwin:'x86_64-apple-darwin'}[platform];const native=path.join(__dirname,'../node_modules/@openai/codex-'+platform+'-'+arch,'vendor',triple||'', 'bin',platform==='win32'?'codex.exe':'codex');return existsSync(native)?native:(process.env.FANTASY_CODEX_BIN||'codex');}
async function configure(){bridge=new CodexBridge(await executable(),{onLogin:info=>{if(allowedURL(info.url))deviceURL=info.url;window?.webContents.send('ai:progress',info);}});dialogue=new Dialogue(path.join(app.getPath('userData'),'ai-dialogue.json'),bridge);}
function register(){for(const [channel,handler]of Object.entries({
 'ai:status':()=>bridge.check(),
 'ai:login':async(method='browser')=>{if(dialogue.busy)throw Error('대화가 끝난 뒤 로그인해 주세요.');deviceURL=null;await bridge.login(method);return bridge.check();},
 'ai:cancel':()=>{bridge.stop();return{ok:true};},
 'ai:chat':async request=>{const status=await bridge.check();if(!status.ready)throw Error(status.message);return dialogue.send(request);},
 'ai:reset':()=>dialogue.reset(),
 'ai:open-login':async()=>{if(!allowedURL(deviceURL))throw Error('먼저 로그인을 눌러 인증 코드를 받아 주세요.');await shell.openExternal(deviceURL);return{ok:true};},
 'ai:choose-cli':async()=>{if(bridge.busy||dialogue.busy)throw Error('진행 중인 요청이 끝난 뒤 선택해 주세요.');const result=await dialog.showOpenDialog(window,{title:'공식 Codex 실행 파일 선택',properties:['openFile'],filters:process.platform==='win32'?[{name:'Codex 실행 파일',extensions:['exe']}]:[]});if(result.canceled)return{cancelled:true};const cli=result.filePaths[0];if(process.platform==='win32'&&!cli.toLowerCase().endsWith('.exe'))throw Error('공식 codex.exe를 선택해 주세요.');await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(path.join(app.getPath('userData'),'settings.json'),JSON.stringify({cli}));await configure();return bridge.check();}
 }))ipcMain.handle(channel,async(event,...args)=>{if(event.sender!==window?.webContents||event.senderFrame!==window.webContents.mainFrame||event.senderFrame.url.split('#')[0]!==entry)throw Error('허용하지 않는 요청입니다.');try{return{ok:true,data:await handler(...args)};}catch(error){return{ok:false,error:error.message};}});}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
 app.whenReady().then(async()=>{await configure();register();window=new BrowserWindow({width:1380,height:940,minWidth:850,minHeight:700,title:'이세계 기록',backgroundColor:'#111613',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,url)=>{if(url.split('#')[0]!==entry)event.preventDefault();});window.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));await window.loadURL(entry);window.on('closed',()=>{bridge.stop();window=null;});}).catch(()=>{dialog.showErrorBox('앱 시작 실패','앱 파일을 다시 확인해 주세요.');app.quit();});
 app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>bridge?.stop());
}
