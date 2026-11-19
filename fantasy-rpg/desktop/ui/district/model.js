(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.DistrictModel=api;})(globalThis,()=>{
const width=20,height=16,start={x:8,y:12};
const objects=[
 {id:'inn',kind:'inn',name:'달빛 여관',x:3,y:5,width:260,door:.64,solid:[-1,-3,3,3]},
 {id:'shop',kind:'shop',name:'거리 잡화점',x:9,y:3,width:245,door:.64,solid:[-1,-3,3,3]},
 {id:'guild',kind:'guild',name:'협회 접수소',x:15,y:7,width:280,door:.64,solid:[-1,-3,3,3]},
 {id:'tree-a',kind:'tree',x:2,y:11,width:200,door:.5,solid:[0,0,1,1]},
 {id:'tree-b',kind:'tree',x:16,y:1,width:175,door:.5,solid:[0,0,1,1]},
 {id:'fountain',kind:'fountain',name:'광장 분수',x:8,y:8,width:130,door:.5,solid:[0,0,1,1]},
 {id:'lamp-a',kind:'lamp',x:5,y:7,width:42,door:.5},
 {id:'lamp-b',kind:'lamp',x:12,y:10,width:42,door:.5},
 {id:'lamp-c',kind:'lamp',x:6,y:14,width:42,door:.5}
];
const npcs=[{id:'yeogyeong',name:'차여경',x:9,y:11},{id:'yui',name:'한유이',x:12,y:8}];
function project(p){return{x:(p.x-p.y)*42,y:(p.x+p.y)*21};}
function unproject(p){return{x:(p.x/42+p.y/21)/2,y:(p.y/21-p.x/42)/2};}
function blocked(){const out=[];for(const o of objects)if(o.solid){const [dx,dy,w,h]=o.solid;for(let x=0;x<w;x++)for(let y=0;y<h;y++)out.push({x:o.x+dx+x,y:o.y+dy+y});}for(const n of npcs)out.push({x:n.x,y:n.y});return out;}
function direction(dx,dy,previous='se'){const p=project({x:dx,y:dy});if(Math.hypot(dx,dy)<.0001)return previous;return p.y>=0?(p.x>=0?'se':'sw'):(p.x>=0?'ne':'nw');}
function depth(p){return p.x+p.y;}
return{width,height,start,objects,npcs,project,unproject,blocked,direction,depth};
});
