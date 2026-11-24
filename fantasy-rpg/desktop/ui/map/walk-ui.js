(function(r){
let closeActive=null;
function open({background,crop=[0,0,1,1],era,npc,onTalk,onBuilding,buildings=[],label='현재 장면 탐색'}){
 closeActive?.();const root=document.createElement('section');root.className='walk-overlay';root.setAttribute('role','dialog');root.setAttribute('aria-label',label);root.tabIndex=-1;
 const bar=document.createElement('div');bar.className='walk-toolbar';const title=document.createElement('strong');title.textContent=label;const help=document.createElement('span');help.textContent='클릭·방향키 이동 · 가까이에서 Space 상호작용';const exit=document.createElement('button');exit.textContent='대화 화면으로';bar.append(title,help,exit);
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=600;canvas.setAttribute('aria-label','마우스로 목적지나 상호작용 대상을 선택하는 탐색 지도');const ctx=canvas.getContext('2d');const status=document.createElement('p');status.setAttribute('role','status');root.append(bar,canvas,status);document.body.append(root);
 const targets=[...(npc?[{id:npc.id,label:npc.name,type:'npc',x:12,y:7}]:[]),...buildings.map((b,i)=>({...b,type:'building',x:3+i*3,y:3}))];const blocked=[];for(const t of targets)if(t.type==='building')for(let x=t.x-1;x<=t.x+1;x++)for(let y=t.y-2;y<t.y;y++)blocked.push({x,y});const map=new WalkMap.Map({blocked});let pending=null,closed=false,last=0,raf=0,keys=new Set();const im=new Image();im.src=background||'';const art=r.WalkCharacter[era]||r.WalkCharacter.earth,playerImage=new Image();playerImage.src=art.src;
 const camera=new r.WalkCamera.Camera(),walker=new r.WalkCamera.Walker();
 const cast=r.WalkCharacter.standing(npc?.id),npcImage=cast&&new Image();
 if(npcImage)npcImage.src=cast.src;
 const project=p=>({x:.06+p.x*.88/(map.width-1),y:.48+p.y*.46/(map.height-1)});
 const screen=p=>camera.project(project(p));
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let size=null;
 function close(){if(closed)return;closed=true;cancelAnimationFrame(raf);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.querySelector('.walk-dialogue')?.remove();root.remove();closeActive=null;exit.returnFocus?.focus();}
 closeActive=close;exit.returnFocus=document.activeElement;exit.onclick=close;
 function interact(t){pending=null;keys.clear();map.route=[];if(t.type==='npc'){close();onTalk?.(t.id);}else{onBuilding?.(t);status.textContent=t.label+' · 문 앞에 도착했습니다.';}}
 function approach(t){if(document.querySelector('.walk-dialogue'))return;if(map.nearest([t]))return interact(t);const candidates=[[0,1],[-1,0],[1,0],[0,-1]].map(([dx,dy])=>({x:t.x+dx,y:t.y+dy})).map(p=>({p,path:map.path(p.x,p.y)})).filter(v=>v.path!==null).sort((a,b)=>a.path.length-b.path.length);if(!candidates.length){status.textContent='접근할 수 있는 길이 없습니다.';return;}map.route=candidates[0].path;pending=t;}
 canvas.onclick=e=>{if(document.querySelector('.walk-dialogue'))return;if(!size)return;const rect=canvas.getBoundingClientRect(),p=camera.unproject({x:e.clientX-rect.left,y:e.clientY-rect.top});
  const x=(p.x-.06)*(map.width-1)/.88,y=(p.y-.48)*(map.height-1)/.46;const t=targets.find(t=>Math.hypot(t.x-x,t.y-y)<1.2);keys.clear();if(t)approach(t);else{pending=null;if(!map.go(Math.round(x),Math.round(y)))status.textContent='그곳으로는 이동할 수 없습니다.';}};
 const controls=document.createElement('div');controls.className='walk-targets';for(const t of targets){const b=document.createElement('button');b.textContent=t.label;b.onclick=()=>approach(t);controls.append(b);}const interactButton=document.createElement('button');interactButton.textContent='상호작용 · Space';interactButton.onclick=()=>{const t=map.nearest(targets);if(t)interact(t);else status.textContent='대상 가까이 이동해 주세요.';};controls.append(interactButton);root.append(controls);
 function keydown(e){if(document.querySelector('.walk-dialogue'))return;if(e.target?.matches?.('input,textarea,select')||e.repeat&&e.code==='Space')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();if(e.code==='Space')interactButton.click();else{keys.add(e.code);pending=null;}}if(e.code==='Escape')close();}
 function keyup(e){keys.delete(e.code);}function blur(){keys.clear();}window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
 function draw(time){if(closed)return;const dt=last?(time-last)/1000:0;last=time;if(!map.route.length&&keys.size){const key=[...keys].at(-1),dir={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[key];if(dir)map.go(Math.round(map.player.x)+dir[0],Math.round(map.player.y)+dir[1]);}map.tick(dt);root.dataset.playerX=String(map.player.x);root.dataset.playerY=String(map.player.y);if(pending&&!map.route.length&&map.nearest([pending])){interact(pending);if(closed)return;}
 const width=canvas.clientWidth,height=canvas.clientHeight,pixelRatio=Math.min(2,window.devicePixelRatio||1);
 if(!width||!height){raf=requestAnimationFrame(draw);return;}
 const resize=size?.width!==width||size?.height!==height||size?.pixelRatio!==pixelRatio;
 if(resize){size={width,height,pixelRatio};canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);}
 ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
 const [sx,sy,sw,sh]=crop.map((fraction,i)=>fraction*(i%2?im.naturalHeight:im.naturalWidth));
 camera.follow({width,height,ratio:sw&&sh?sw/sh:16/9,point:project(map.player),seconds:dt,snap:resize||reduced.matches});
 walker.update(map.player);
 const {offset,artWidth,artHeight}=camera;
 ctx.fillStyle='#26382b';ctx.fillRect(0,0,width,height);
 if(sw&&sh)ctx.drawImage(im,sx,sy,sw,sh,offset.x,offset.y,artWidth,artHeight);
 const heightAt=p=>Math.max(64,Math.min(235,artHeight*(.135+.13*p.y/(map.height-1))));
 function drawTarget(t){
  const {x,y}=screen(t);
  let anchor=y-24;
  if(t.type==='npc'&&npcImage?.naturalWidth){
   const [sx,sy,w,h]=cast.frame,height=heightAt(t),width=w*height/h;
   ctx.drawImage(npcImage,sx,sy,w,h,x-width/2,y-height,width,height);
   anchor=y-height-9;
  }else{
   ctx.fillStyle='#f0d598';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
  }
  ctx.font='13px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;
  ctx.strokeStyle='#18251e';ctx.fillStyle='#ffebbd';ctx.strokeText(t.label,x,anchor);ctx.fillText(t.label,x,anchor);
 }
 const characters=[...targets,map.player].sort((a,b)=>a.y-b.y);
 for(const character of characters){
  if(character===map.player)walker.draw(ctx,playerImage,art,screen(character),heightAt(character),reduced.matches);
  else drawTarget(character);
 }
 const near=map.nearest(targets);if(near)status.textContent=near.label+' · Space로 상호작용';raf=requestAnimationFrame(draw);}
 root.focus();raf=requestAnimationFrame(draw);return{close,map};
}
r.WalkUI={open};
})(globalThis);
