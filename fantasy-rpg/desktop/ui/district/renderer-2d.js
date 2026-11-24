(function(root){
'use strict';
const model=root.DistrictModel;
const background='district/assets/lantern-street.webp';
const images=new Map();
function load(npcs=model.npcs,visual=null){
 const urls=[background,...(visual?[visual.src]:[]),root.WalkCharacter.fantasy.src,...npcs.map(npc=>root.WalkCharacter.standing(npc.id,'fantasy')?.src).filter(Boolean)];
 return Promise.all([...new Set(urls)].map(url=>new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{images.set(url,image);resolve(true);};
  image.onerror=()=>resolve(false);
  image.src=url;
 })));
}
class Renderer{
 constructor(canvas,{objects=model.objects,npcs=model.npcs,visual=null}={}){
  this.canvas=canvas;
  this.visual=visual;
  this.ctx=canvas.getContext('2d');
  if(!this.ctx)throw Error('Canvas unavailable');
  this.walker=new root.WalkCamera.Walker();
  this.camera=new root.WalkCamera.Camera();
  this.zoomFactor=1.25;
  this.npcs=npcs;
  this.targets=[...objects.filter(item=>item.name),...npcs];
  this.resize();
 }
 resize(){
  const {width,height}=this.canvas.getBoundingClientRect();
  this.width=Math.max(1,width);
  this.height=Math.max(1,height);
  this.pixelRatio=Math.min(2,root.devicePixelRatio||1);
  this.canvas.width=Math.round(this.width*this.pixelRatio);
  this.canvas.height=Math.round(this.height*this.pixelRatio);
 }
 backdrop(){return images.get(this.visual?.src||background)||images.get(background);}
 focus(player,snap=false,seconds=0){
  const bg=this.backdrop(),ratio=this.visual?this.visual.frame[2]/this.visual.frame[3]:bg?bg.width/bg.height:16/9;
  this.camera.follow({width:this.width,height:this.height,ratio,point:model.streetPoint(player),zoom:this.zoomFactor,seconds,snap});
 }
 get distance(){return this.walker.distance;}
 screen(pos){return this.camera.project(model.streetPoint(pos));}
 cell(x,y){return model.streetCell(this.camera.unproject({x,y}));}
 objectAt(x,y){
  return this.targets.find(target=>{
   const p=this.screen(target);
   if(this.npcs.includes(target))return Math.hypot(x-p.x,y-p.y+this.spriteHeight(target)*.55)<26;
   return Math.abs(x-p.x)<45&&Math.abs(y-p.y+23)<22;
  });
 }
 zoom(factor){this.zoomFactor=Math.min(1.55,Math.max(1.12,this.zoomFactor*factor));}
 spriteHeight(pos){
  return Math.max(64,Math.min(235,this.camera.artHeight*(.14+.13*pos.y/(model.height-1))));
 }
 sprite(pos,entry){
  const im=images.get(entry.src);
  if(!im)return;
  const {x,y}=this.screen(pos);
  const [sx,sy,w,h]=entry.frame;
  const height=this.spriteHeight(pos);
  const width=w*height/h,c=this.ctx;
  c.fillStyle='#221b1855';
  c.beginPath();c.ellipse(x,y,width*.42,height*.045,0,0,2*Math.PI);c.fill();
  c.drawImage(im,sx,sy,w,h,x-width/2,y-height,width,height);
 }
 render(map,time,near,{reduced=false}={}){
  const p=map.player;
  this.focus(p,reduced||this.lastTime===undefined,(time-this.lastTime)/1000);
  this.lastTime=time;
  this.walker.update(p);
  const bg=this.backdrop();
  const {artWidth,artHeight,offset}=this.camera;
  const c=this.ctx;
  c.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);
  c.fillStyle='#263b33';c.fillRect(0,0,this.width,this.height);
  if(bg){if(this.visual&&images.has(this.visual.src))c.drawImage(bg,...this.visual.frame,offset.x,offset.y,artWidth,artHeight);else c.drawImage(bg,offset.x,offset.y,artWidth,artHeight);}
  const terrainTargets=this.targets.filter(target=>!this.npcs.includes(target));
  for(const target of terrainTargets){
   const point=this.screen(target);
   c.fillStyle=near===target?'#ffe0a1':'#eace97';
   c.strokeStyle='#293126';c.lineWidth=2;
   c.beginPath();c.arc(point.x,point.y-10,4,0,Math.PI*2);c.fill();c.stroke();
   if(near!==target)this.label(target.name,point.x,point.y-22);
  }
  const sprites=this.npcs.flatMap(npc=>{
   const entry=root.WalkCharacter.standing(npc.id,'fantasy');
   if(!entry?.src){const p=this.screen(npc);this.label(npc.name,p.x,p.y-45);return [];}
   return [{pos:npc,entry}];
  });
  sprites.push({pos:p,player:true});
  sprites.sort((a,b)=>a.pos.y-b.pos.y);
  const art=root.WalkCharacter.fantasy;
  for(const sprite of sprites){
   if(sprite.player)this.walker.draw(c,images.get(art.src),art,this.screen(p),this.spriteHeight(p),reduced);
   else this.sprite(sprite.pos,sprite.entry);
  }
  if(near){
   const point=this.screen(near),lift=this.npcs.includes(near)?this.spriteHeight(near)+15:36;
   this.label(near.name+' · Space',point.x,point.y-lift);
  }
 }
 label(text,x,y){
  const c=this.ctx;
  c.font='13px sans-serif';c.textAlign='center';c.lineJoin='round';c.lineWidth=4;
  c.strokeStyle='#18251e';c.fillStyle='#ffebbd';
  c.strokeText(text,x,y);c.fillText(text,x,y);
 }
 dispose(){}
}
root.DistrictRenderer={load,Renderer};
})(globalThis);
