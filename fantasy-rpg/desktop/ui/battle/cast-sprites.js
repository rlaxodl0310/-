(function(root){
const entries={"yeogyeong": {"src": "assets/cast-stances.png", "frames": [[184, 14, 184, 498]]}, "yui": {"src": "assets/cast-stances.png", "frames": [[649, 21, 215, 469]]}, "seoha": {"src": "assets/cast-stances.png", "frames": [[1125, 9, 257, 483]]}, "woojin": {"src": "assets/cast-stances.png", "frames": [[131, 512, 290, 495]]}, "dogyeom-childhood-friend": {"src": "assets/cast-stances.png", "frames": [[647, 538, 223, 466]]}, "nea": {"src": "assets/cast-stances.png", "frames": [[1079, 564, 291, 443]]}, "zero": {"src": "assets/zero-pixels.png", "frames": [[70, 86, 521, 580], [747, 64, 634, 556], [1508, 79, 555, 587]]}},images=new Map();
function has(id){return Object.prototype.hasOwnProperty.call(entries,id);}
function ready(id){return images.has(entries[id]?.src);}
async function load(){await Promise.all([...new Set(Object.values(entries).map(e=>e.src))].map(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images.set(src,im);resolve(true);};im.onerror=()=>resolve(false);im.src=src;})));}
function draw(ctx,id,t=0,moving=false,pose=null,progress=0){ctx.clearRect(0,0,86,86);const e=entries[id],im=images.get(e?.src);if(!im)return false;
const frame=id==='zero'?(moving?1:['guard','dodge'].includes(pose)?2:0):0;const [x,y,w,h]=e.frames[frame],scale=Math.min(78/w,(id==='zero'?60:76)/h),dw=w*scale,dh=h*scale;
ctx.imageSmoothingEnabled=false;ctx.save();const breath=Math.sin(t*(id==='yui'?1.5:id==='nea'?3:2))*.35;ctx.translate(43,81+breath);ctx.drawImage(im,x,y,w,h,-dw/2,-dh,dw,dh);ctx.restore();return true;}
root.CastSprites={has,ready,load,draw,entries};
})(globalThis);
