(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.DistrictModel=api;})(globalThis,()=>{
const width=20,height=16,start={x:8,y:12};
const objects=[
 {id:'inn',kind:'inn',name:'달빛 여관',x:1,y:0,width:260,door:.64,solid:[-1,0,1,1]},
 {id:'shop',kind:'shop',name:'거리 잡화점',x:6,y:0,width:245,door:.64,solid:[-1,0,1,1]},
 {id:'guild',kind:'guild',name:'협회 접수소',x:17,y:0,width:280,door:.64,solid:[-1,0,1,1]},
 {id:'fountain',kind:'fountain',name:'광장 분수',x:7,y:4,width:130,door:.5,solid:[-2,-2,5,3]},
];
const npcs=[{id:'yeogyeong',name:'차여경',x:9,y:11},{id:'yui',name:'한유이',x:12,y:8}];
function project(p){return{x:(p.x-p.y)*42,y:(p.x+p.y)*21};}
function unproject(p){return{x:(p.x/42+p.y/21)/2,y:(p.y/21-p.x/42)/2};}
function blocked(streetObjects=objects,streetNPCs=npcs){const out=[];for(const o of streetObjects)if(o.solid){const [dx,dy,w,h]=o.solid;for(let x=0;x<w;x++)for(let y=0;y<h;y++)out.push({x:o.x+dx+x,y:o.y+dy+y});}for(const n of streetNPCs)out.push({x:n.x,y:n.y});return out;}
function direction(dx,dy,previous='se'){const p=project({x:dx,y:dy});if(Math.hypot(dx,dy)<.0001)return previous;return p.y>=0?(p.x>=0?'se':'sw'):(p.x>=0?'ne':'nw');}
function streetPoint(p){return{x:.075+p.x*.85/(width-1),y:.56+p.y*.36/(height-1)};}
function streetCell(p){return{x:Math.round((p.x-.075)*(width-1)/.85),y:Math.round((p.y-.56)*(height-1)/.36)};}
function depth(p){return p.x+p.y;}
// Shared hotspots for the current village illustration. The catalogue supplies the names and services.
const primarySpots={inn:0,exchange:1,hall:2,water:3};
const extraSpots=[{x:3,y:2},{x:11,y:2},{x:15,y:2},{x:18,y:4}];
const firstNPCSpots=npcs.map(({x,y})=>({x,y}));
const terrainViews=[
 {id:'farm',label:'농촌',pattern:/농촌|농장|곡물|보리|감자|경작|평야|농경/},
 {id:'coast',label:'해안',pattern:/해안|어촌|생선|해조|어업|항구|선착장|바닷/},
 {id:'forest',label:'숲',pattern:/숲|벌목|목재|양봉|약초|장작/},
 {id:'quarry',label:'광산',pattern:/광산|광부|광석|제련|채석|돌을|석공/},
 {id:'river',label:'강변',pattern:/강변|방앗간|물레|나루|강가|하천|수로/},
 {id:'pasture',label:'목축',pattern:/목축|목장|고원|구릉|양치기|짐가축|산촌/},
];
function visualFor(place){
 const text=[place?.location,place?.note].filter(Boolean).join(' ');
 // Specific water/industry descriptions take priority over generic surrounding terrain.
 const order=[1,4,3,2,5,0],index=order.find(index=>terrainViews[index].pattern.test(text));
 if(index===undefined)return null;
 const col=index%2,row=Math.floor(index/2),y=Math.floor(row*1024/3);
 return {id:terrainViews[index].id,label:terrainViews[index].label,src:'district/assets/terrain-villages.webp',
  frame:[col*768,y,768,Math.floor((row+1)*1024/3)-y]};
}
function storyStreet(state,geography,facilities,storyData){
 const village=geography.find(place=>place.id===state.location&&place.kind==='village');
 if(state.era!=='fantasy'||!village||state.combat?.status==='playing'||!state.visited?.includes('fantasy:'+village.id))return null;
 let extraIndex=0;
 const streetObjects=facilities.filter(facility=>facility.locationId===village.id).map(facility=>{
  const index=primarySpots[facility.type];
  const nextIndex=Object.hasOwn(primarySpots,facility.type)?null:extraIndex++;
  const spot=nextIndex===null?objects[index]:extraSpots[nextIndex]||{x:2+(nextIndex-extraSpots.length)*3%16,y:6};
  return {...spot,id:facility.id,name:facility.name,note:facility.note,services:facility.services};
 });
 const people=new Map();
 for(const id of state.present||[]){
  const person=storyData.catalog.find(entry=>entry.id===id);
  if(id!=='taei'&&person)people.set(id,storyData.content.displayName(state,id)||person.name);
 }
 for(const person of state.locals||[])if(!people.has(person.id))people.set(person.id,person.name);
 const streetNPCs=Array.from(people,([id,name],index)=>({id,name,
  ...(firstNPCSpots[index]||{x:2+((index-2)%6)*3,y:9+Math.floor((index-2)/6)*4}),
 }));
 return {location:village.id,name:village.name,visual:visualFor(village),objects:streetObjects,npcs:streetNPCs};
}
return{width,height,start,objects,npcs,project,unproject,blocked,direction,depth,streetPoint,streetCell,storyStreet,visualFor,terrainViews};
});
