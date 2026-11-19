(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.WalkMap=f();})(globalThis,()=>{
class Map{
 constructor({width=20,height=12,blocked=[],start={x:10,y:8}}={}){this.width=width;this.height=height;this.blocked=new Set(blocked.map(p=>p.x+','+p.y));this.player={...start};this.route=[];}
 free(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<this.width&&y<this.height&&!this.blocked.has(x+','+y);}
 path(x,y){if(!this.free(x,y))return null;const from={x:Math.round(this.player.x),y:Math.round(this.player.y)},q=[{...from,path:[]}],seen=new Set([from.x+','+from.y]);for(let i=0;i<q.length;i++){const p=q[i];if(p.x===x&&p.y===y)return p.path;for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=p.x+dx,ny=p.y+dy,key=nx+','+ny;if(this.free(nx,ny)&&!seen.has(key)){seen.add(key);q.push({x:nx,y:ny,path:[...p.path,{x:nx,y:ny}]});}}}return null;}
 go(x,y){const p=this.path(x,y);if(p===null)return false;this.route=p;return true;}
 tick(seconds){let remaining=Math.max(0,Math.min(.1,seconds))*4.5;while(this.route.length&&remaining>0){const p=this.route[0],dx=p.x-this.player.x,dy=p.y-this.player.y,d=Math.hypot(dx,dy);if(d<=remaining){this.player={...p};this.route.shift();remaining-=d;}else{this.player.x+=dx/d*remaining;this.player.y+=dy/d*remaining;remaining=0;}}}
 nearest(targets,radius=1.5){return targets.map(t=>({t,d:Math.hypot(t.x-this.player.x,t.y-this.player.y)})).filter(v=>v.d<=radius).sort((a,b)=>a.d-b.d)[0]?.t||null;}
}
return{Map};
});
