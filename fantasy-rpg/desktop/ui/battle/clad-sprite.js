(function(r){
const meta={"width": 2172, "height": 724, "frames": [{"x": 28, "y": 136, "w": 639, "h": 464}, {"x": 754, "y": 136, "w": 645, "h": 461}, {"x": 1449, "y": 151, "w": 695, "h": 446}]};let art=null;
function load(url){return new Promise(resolve=>{const i=new Image();i.onload=()=>{art=i;resolve(true);};i.onerror=()=>resolve(false);i.src=url;});}
function draw(ctx,t=0,moving=false,pose=null){ctx.clearRect(0,0,86,86);if(!art)return;const f=meta.frames[pose==='attack'?2:moving?Math.floor(t*7)%2:0],scale=Math.min(80/695,66/464),w=f.w*scale,h=f.h*scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(art,f.x,f.y,f.w,f.h,(86-w)/2,78-h,w,h);}
r.CladSprite={load,draw,ready:()=>!!art};
})(globalThis);
