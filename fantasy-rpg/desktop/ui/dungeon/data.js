(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('../map/geography.js'));else r.DungeonData=f(r.GameGeography);})(globalThis,Geo=>{
'use strict';
// Initial host data for the common engine; no mandatory encounter or player destination.
const sites=Geo.continents.map((c,i)=>{const location=Geo.records.find(p=>p.continent===c.id&&p.kind==='wilderness'&&!p.parent);if(!location)return null;return{id:'mana-site-'+location.id,locationId:location.id,name:location.name+' · 마나 응집 던전',management:i%2?'remove':'preserve',grade:'E',coreZone:'depths',objectives:{survey:{zoneId:'outer'},clear:{zoneId:'outer'},recover:{zoneId:'outer',resourceId:'sealed-sample'},core:{zoneId:'depths'}},zones:[{id:'entry',name:'입구 구역',neighbors:['outer'],monsters:[]},{id:'outer',name:'외곽 구역',neighbors:['entry','depths'],monsters:[i%2?'ant':'goblin'],resource:'sealed-sample'},{id:'depths',name:'핵 인접 구역',neighbors:['outer'],monsters:['goblin']}]};}).filter(Boolean);
return{sites};
});
