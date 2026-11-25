(function(root,f){if(typeof module==='object'&&module.exports)module.exports=f(require('../characters/content.js'),require('../characters/origins.js'));else root.StoryIllustrations=f(root.CharacterContent,root.CharacterOrigins);})(globalThis,(Content,Origins)=>{
 function options(state,id){
  if(!state||!state.present?.includes(id)||!Origins.allowed(id,state))return [];
  const record=Content.get(id);if(!record)return [];
  return Object.entries(record.looks).filter(([key])=>key==='cutscene'||key.startsWith('컷신 · ')).map(([key,frame])=>({key,label:record.lookLabels?.[key]||(key==='cutscene'?'기본 장면':key.replace(/^컷신 · /,'')),frame}));
 }
 let cleanup=null;
 function clear(){if(cleanup)cleanup();cleanup=null;}
 function attach({state,actorId,host,stage,portrait,player,disabled=false}){
  const choices=options(state,actorId);if(!choices.length)return;
  const row=document.createElement('div'),select=document.createElement('select'),button=document.createElement('button');row.id='story-illustration-controls';row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:6px 0';select.setAttribute('aria-label','현재 인물의 장면 일러스트');select.style.maxWidth='100%';
  for(const item of choices){const option=document.createElement('option');option.value=item.key;option.textContent=item.label;select.append(option);}
  button.type='button';button.textContent='장면 일러스트';button.disabled=select.disabled=disabled;row.append(select,button);host.prepend(row);
  let layer=null,hidden=null;
  function close(){layer?.remove();layer=null;if(hidden){[portrait.hidden,player.hidden]=hidden;hidden=null;}button.textContent='장면 일러스트';}
  function show(){if(!hidden)hidden=[portrait.hidden,player.hidden];portrait.hidden=player.hidden=true;layer?.remove();const f=choices.find(item=>item.key===select.value).frame;layer=document.createElement('div');layer.id='story-illustration-layer';layer.style.cssText='position:absolute;inset:10% 6% 43%;display:flex;justify-content:center;align-items:center;pointer-events:none;z-index:2';const crop=document.createElement('div'),im=document.createElement('img');crop.style.cssText='position:relative;overflow:hidden;height:100%;max-width:100%;aspect-ratio:'+f.w+'/'+f.h;im.src=f.src;im.alt='현재 장면의 인물 일러스트';im.style.cssText='position:absolute;max-width:none;width:'+(f.imageWidth/f.w*100)+'%;height:'+(f.imageHeight/f.h*100)+'%;left:'+(-f.x/f.w*100)+'%;top:'+(-f.y/f.h*100)+'%';crop.append(im);layer.append(crop);stage.append(layer);button.textContent='대화 화면으로';}
  button.onclick=()=>layer?close():show();select.onchange=()=>{if(layer)show();};cleanup=()=>{close();row.remove();};
 }
 return{options,attach,clear};
});
