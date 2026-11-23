(function(root){
'use strict';
const model=root.DistrictModel;
const background='district/assets/lantern-street.webp';
const images=new Map();
function load(npcs=model.npcs){
 const stances=root.CastSprites.entries;
 const urls=[background,root.DistrictArt.se.src,...npcs.filter(npc=>stances[npc.id]?.src).map(npc=>'battle/'+stances[npc.id].src)];
 return Promise.all([...new Set(urls)].map(url=>new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{images.set(url,image);resolve(true);};
  image.onerror=()=>resolve(false);
  image.src=url;
 })));
}
class Renderer{
 constructor(canvas,{objects=model.objects,npcs=model.npcs}={}){
  this.canvas=canvas;
  this.ctx=canvas.getContext('2d');
  if(!this.ctx)throw Error('Canvas unavailable');
  this.distance=0;
  this.direction='se';
  this.zoomFactor=1;

  this.offset={x:0,y:0};
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
 focus(player,instant=false){
  const image=images.get(background);
  const ratio=image?image.width/image.height:16/9;
  this.artHeight=Math.max(this.height,this.width/ratio)*this.zoomFactor;
  this.artWidth=this.artHeight*ratio;
  const p=model.streetPoint(player);
  const x=Math.min(0,Math.max(this.width-this.artWidth,this.width*.5-p.x*this.artWidth));
  const y=Math.min(0,Math.max(this.height-this.artHeight,this.height*.72-p.y*this.artHeight));
  const blend=instant?1:.16;
  this.offset.x+=(x-this.offset.x)*blend;
  this.offset.y+=(y-this.offset.y)*blend;
 }
 screen(pos){
  const p=model.streetPoint(pos);
  return {x:p.x*this.artWidth+this.offset.x,y:p.y*this.artHeight+this.offset.y};
 }
 cell(x,y){
  return model.streetCell({x:(x-this.offset.x)/this.artWidth,y:(y-this.offset.y)/this.artHeight});
 }
 objectAt(x,y){
  return this.targets.find(target=>{
   const p=this.screen(target);
   if(this.npcs.includes(target))return Math.hypot(x-p.x,y-p.y+this.spriteHeight(target)*.55)<26;
   return Math.abs(x-p.x)<45&&Math.abs(y-p.y+23)<22;
  });
 }
 zoom(factor){this.zoomFactor=Math.min(1.55,Math.max(1,this.zoomFactor*factor));}
 spriteHeight(pos){
  const baseArtHeight=this.artHeight/this.zoomFactor;
  return Math.max(47,Math.min(142,baseArtHeight*(.068+.055*pos.y/(model.height-1))))*this.zoomFactor;
 }
 sprite(pos,entry,index){
  const im=images.get(entry.src);
  if(!im)return;
  const {x,y}=this.screen(pos);
  const [sx,sy,w,h]=entry.frames[index];
  const height=this.spriteHeight(pos);
  const width=w*height/h,c=this.ctx;
  c.fillStyle='#221b1855';
  c.beginPath();c.ellipse(x,y,width*.42,height*.045,0,0,2*Math.PI);c.fill();
  c.drawImage(im,sx,sy,w,h,x-width/2,y-height,width,height);
 }
 render(map,time,near,{reduced=false}={}){
  this.focus(map.player,reduced||!this.lastPlayer);
  const p=map.player;
  if(this.lastPlayer){
   const dx=p.x-this.lastPlayer.x,dy=p.y-this.lastPlayer.y;
   const step=Math.hypot(dx,dy);
   this.distance+=step;
   if(step>.0001)this.direction=dy<0?(dx<0?'nw':'ne'):(dx<0?'sw':'se');
  }
  this.lastPlayer={...p};
  const c=this.ctx;
  c.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);
  c.fillStyle='#263b33';c.fillRect(0,0,this.width,this.height);
  const bg=images.get(background);
  if(bg)c.drawImage(bg,this.offset.x,this.offset.y,this.artWidth,this.artHeight);
  const terrainTargets=this.targets.filter(target=>!this.npcs.includes(target));
  for(const target of terrainTargets){
   const point=this.screen(target);
   c.fillStyle=near===target?'#ffe0a1':'#eace97';
   c.strokeStyle='#293126';c.lineWidth=2;
   c.beginPath();c.arc(point.x,point.y-10,4,0,Math.PI*2);c.fill();c.stroke();
   if(near!==target)this.label(target.name,point.x,point.y-22);
  }
  const walk=map.route.length?[1,2,3,2][Math.floor(this.distance*3.6)%4]:0;
  const sprites=this.npcs.flatMap(npc=>{
   const entry=root.CastSprites.entries[npc.id];
   if(!entry?.src){const p=this.screen(npc);this.label(npc.name,p.x,p.y-45);return [];}
   return [{pos:npc,entry:{src:'battle/'+entry.src,frames:entry.frames},index:0}];
  });
  sprites.push({pos:p,entry:root.DistrictArt[this.direction],index:walk});
  sprites.sort((a,b)=>a.pos.y-b.pos.y);
  for(const sprite of sprites)this.sprite(sprite.pos,sprite.entry,sprite.index);
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
