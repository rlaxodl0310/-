const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopAI',Object.freeze({
 battleJudge:request=>ipcRenderer.invoke('ai:battle',request),openBattle:()=>ipcRenderer.invoke('ai:open-battle'),openStory:()=>ipcRenderer.invoke('ai:open-story'),
 status:()=>ipcRenderer.invoke('ai:status'),login:method=>ipcRenderer.invoke('ai:login',method),cancel:()=>ipcRenderer.invoke('ai:cancel'),send:request=>ipcRenderer.invoke('ai:chat',request),reset:()=>ipcRenderer.invoke('ai:reset'),chooseCLI:()=>ipcRenderer.invoke('ai:choose-cli'),openLogin:()=>ipcRenderer.invoke('ai:open-login'),
 onStatus:callback=>{const listener=(_event,state)=>callback(state);ipcRenderer.on('ai:progress',listener);return()=>ipcRenderer.removeListener('ai:progress',listener);}
}));
