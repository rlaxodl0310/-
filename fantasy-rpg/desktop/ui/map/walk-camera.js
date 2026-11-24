(function(root){
'use strict';
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
class Camera{
 constructor(){this.offset={x:0,y:0};}
 follow({width,height,ratio,point,zoom=1.2,seconds=0,snap=false}){
  this.artHeight=Math.max(height,width/ratio)*zoom;
  this.artWidth=this.artHeight*ratio;
  const x=clamp(width*.5-point.x*this.artWidth,width-this.artWidth,0);
  const y=clamp(height*.70-point.y*this.artHeight,height-this.artHeight,0);
  const blend=snap?1:1-Math.exp(-11*Math.min(.1,seconds));
  this.offset.x+=(x-this.offset.x)*blend;
  this.offset.y+=(y-this.offset.y)*blend;
  this.offset.x=clamp(this.offset.x,width-this.artWidth,0);
  this.offset.y=clamp(this.offset.y,height-this.artHeight,0);
 }
 project(p){return{x:p.x*this.artWidth+this.offset.x,y:p.y*this.artHeight+this.offset.y};}
 unproject(p){return{x:(p.x-this.offset.x)/this.artWidth,y:(p.y-this.offset.y)/this.artHeight};}
}
class Walker{
 constructor(){this.distance=0;this.back=false;this.flip=false;this.moving=false;}
 update(p){
  const dx=this.previous?p.x-this.previous.x:0,dy=this.previous?p.y-this.previous.y:0;
  const step=Math.hypot(dx,dy);
  this.moving=step>.0001;
  if(this.moving){
   this.distance+=step;
   if(Math.abs(dx)>.0001)this.flip=dx<0;
   if(Math.abs(dy)>.0001)this.back=dy<0;
  }
  this.previous={...p};
 }
 draw(ctx,image,art,point,height,reduced){
  if(!image?.naturalWidth||!art)return;
  const gait=[1,2,3,2];
  const frame=this.moving&&!reduced?gait[Math.floor(this.distance*2.8)%gait.length]:0;
  const [sx,sy,w,h]=(this.back?art.back:art.front)[frame];
  const width=w*height/h;
  ctx.save();
  ctx.translate(point.x,point.y);
  ctx.fillStyle='#1c180d47';
  ctx.beginPath();ctx.ellipse(0,0,width*.38,height*.031,0,0,Math.PI*2);ctx.fill();
  if(this.flip)ctx.scale(-1,1);
  ctx.drawImage(image,sx,sy,w,h,-width/2,-height,width,height);
  ctx.restore();
 }
}
root.WalkCamera={Camera,Walker};
})(globalThis);
