const t=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),D=require('../ui/district/model.js'),Map=require('../ui/map/walk.js').Map;
t('isometric projection and inverse agree for integer and interpolated positions',()=>{for(const p of [{x:0,y:0},{x:8,y:12},{x:4.21,y:7.82},{x:-3,y:18}]){const q=D.unproject(D.project(p));a(Math.abs(q.x-p.x)<1e-9);a(Math.abs(q.y-p.y)<1e-9);}a.equal(D.direction(1,0),'se');a.equal(D.direction(0,1),'sw');a.equal(D.direction(-1,0),'nw');a.equal(D.direction(0,-1),'ne');});
t('street doors and all NPC interaction points are reachable around solid buildings',()=>{const m=new Map({width:D.width,height:D.height,start:D.start,blocked:D.blocked(),diagonal:true});for(const o of D.objects.filter(o=>['inn','shop','guild'].includes(o.kind))){a(m.free(o.x,o.y),o.id+' door free');a(m.path(o.x,o.y),o.id+' reachable');const [dx,dy]=o.solid;a(!m.free(o.x+dx,o.y+dy),o.id+' walls block');}for(const n of D.npcs){a(!m.free(n.x,n.y));a([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>m.path(n.x+dx,n.y+dy)!==null));}});
t('midstep retargeting preserves the current edge; diagonal movement cannot cut solid corners',()=>{const m=new Map({width:10,height:10,start:{x:2,y:2},diagonal:true,blocked:[{x:3,y:2}]});a.notDeepEqual(m.path(3,3)?.[0],{x:3,y:3});m.go(2,4);m.tick(.04);const next={...m.route[0]};m.go(5,5);a.deepEqual(m.route[0],next);for(let i=0;i<200;i++)m.tick(.05);a.deepEqual(m.player,{x:5,y:5});});
t('all props and four-direction walking frames fit their image sources',()=>{const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../ui/district/art.js'),'utf8'),context);const entries=context.DistrictArt;for(const [id,e]of Object.entries(entries)){const buf=fs.readFileSync(path.join(__dirname,'../ui',e.src)),w=buf.readUInt32BE(16),h=buf.readUInt32BE(20);a.equal(e.frames.length,['se','sw','nw','ne'].includes(id)?4:1);for(const [x,y,fw,fh]of e.frames){a(x>=0&&y>=0&&fw>0&&fh>0&&x+fw<=w&&y+fh<=h,id);}}});
t('illustrated street coordinates map a clicked tile back to the same walking cell',()=>{
 for(let y=0;y<D.height;y++)for(let x=0;x<D.width;x++){
  const point=D.streetPoint({x,y});
  a(point.x>0&&point.x<1&&point.y>.5&&point.y<1);
  a.deepEqual(D.streetCell(point),{x,y});
 }
});

t('every registered village reuses the walk map with its own reachable facilities',()=>{
 const G=require('../ui/map/geography.js'),F=require('../ui/map/facilities.js'),data=require('../ui/data.js');
 const villages=G.records.filter(place=>place.kind==='village');
 a(villages.length>1);
 for(const village of villages){
  const state={era:'fantasy',location:village.id,visited:['fantasy:'+village.id],present:['taeo'],locals:[{id:'npc_current',name:'길을 지나던 주민'}]};
  const street=D.storyStreet(state,G.records,F.records,data);
  a.equal(street.name,village.name);
  a.deepEqual(street.objects.map(object=>object.id),F.records.filter(f=>f.locationId===village.id).map(f=>f.id));
  a.deepEqual(street.npcs.map(person=>person.id),['taeo','npc_current']);
  const map=new Map({width:D.width,height:D.height,start:D.start,blocked:D.blocked(street.objects,street.npcs),diagonal:true});
  for(const object of street.objects){
   const access=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>map.path(object.x+dx,object.y+dy)!==null);
   a(access,village.id+' '+object.id);
  }
  a.equal(D.storyStreet({...state,visited:[]},G.records,F.records,data),null);
 }
});
