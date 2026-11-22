(function(root){
const entries={"yeogyeong": {"src": "assets/cast-stances.png", "frames": [[184, 14, 184, 498]]}, "yui": {"src": "assets/cast-stances.png", "frames": [[649, 21, 215, 469]]}, "seoha": {"src": "assets/cast-stances.png", "frames": [[1125, 9, 257, 483]]}, "woojin": {"src": "assets/cast-stances.png", "frames": [[131, 512, 290, 495]]}, "dogyeom-childhood-friend": {"src": "assets/cast-stances.png", "frames": [[647, 538, 223, 466]]}, "nea": {"src": "assets/cast-stances.png", "frames": [[1079, 564, 291, 443]]}, "zero": {"src": "assets/zero-pixels.png", "frames": [[70, 86, 521, 580], [747, 64, 634, 556], [1508, 79, 555, 587]]}},images=new Map();
const movement={"yeogyeong": {"frames": [[79, 10, 120, 241], [319, 11, 139, 238], [570, 26, 138, 228], [821, 20, 149, 231]], "height": 241}, "yui": {"frames": [[83, 268, 115, 238], [327, 265, 124, 240], [577, 282, 126, 220], [830, 272, 140, 232]], "height": 238}, "seoha": {"frames": [[60, 521, 150, 243], [313, 520, 142, 244], [560, 536, 152, 230], [817, 526, 155, 237]], "height": 243}, "woojin": {"frames": [[41, 776, 168, 242], [302, 779, 146, 239], [546, 795, 161, 226], [799, 779, 180, 238]], "height": 242}, "dogyeom-childhood-friend": {"frames": [[49, 1033, 145, 233], [312, 1034, 141, 246], [560, 1056, 147, 213], [814, 1036, 143, 231]], "height": 233}, "nea": {"frames": [[23, 1283, 195, 241], [282, 1280, 173, 244], [525, 1311, 183, 213], [795, 1291, 198, 233]], "height": 241}};
const Content=root.CharacterContent||{records:[],get:()=>null};for(const r of Content.records)entries[r.id]={src:r.pixel.src,frames:r.pixel.frames};
function has(id){return Object.prototype.hasOwnProperty.call(entries,id);}
function ready(id){return images.has(entries[id]?.src);}
async function load(prefix=''){return Promise.all([...new Set([...Object.values(entries).map(e=>e.src),'assets/cast-movement.png'])].map(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images.set(src,im);resolve(true);};im.onerror=()=>resolve(false);im.src=prefix+src;})));}
function draw(ctx,id,t=0,moving=false,pose=null,progress=0){ctx.clearRect(0,0,86,86);const e=entries[id],im=images.get(e?.src);if(!im)return false;
const custom=Content.get(id);const frame=custom?.pixel.frames.length===1?0:custom?(pose==='hit'?6:pose==='attack'?3:pose==='dodge'?(progress<.5?4:5):moving?1+Math.floor(t*7)%2:0):id==='zero'?(moving?1:['guard','dodge'].includes(pose)?2:0):0;
let source=im,box=e.frames[frame];const m=movement[id],walking=!custom&&moving&&m,evading=!custom&&pose==='dodge'&&m;
if((walking||evading)&&images.has('assets/cast-movement.png')){source=images.get('assets/cast-movement.png');const f=evading?(progress<.5?2:3):Math.floor(t*7*(id==='seoha'?.8:id==='nea'?1.2:1))%2;box=m.frames[f];}
const [x,y,w,h]=box;
// Shared scale for every frame keeps the head/body size stable as legs bend.
const referenceHeight=(walking||evading)?m.height:e.frames[0][3],scale=Math.min(78/w,(id==='zero'?60:76)/referenceHeight),dw=w*scale,dh=h*scale;
ctx.imageSmoothingEnabled=false;ctx.save();const breath=Math.sin(t*(id==='yui'?1.5:id==='nea'?3:2))*.35;ctx.translate(43,81+breath);ctx.drawImage(source,x,y,w,h,-dw/2,-dh,dw,dh);ctx.restore();return true;}
root.CastSprites={has,ready,load,draw,entries};
})(globalThis);
