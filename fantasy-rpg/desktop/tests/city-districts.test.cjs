const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../ui/map/geography.js'),F=require('../ui/map/facilities.js'),data=require('../ui/map/city-district-data.js');
test('every city has its own illustrated asset and three valid districts',()=>{
 const cities=G.records.filter(x=>x.kind==='city');assert.equal(data.length,cities.length);assert.equal(new Set(data.map(c=>c.asset)).size,cities.length);
 for(const c of cities){const art=data.find(a=>a.id===c.id);assert(art,c.id);assert.equal(art.name,c.name);assert.equal(art.districts.length,3);assert.deepEqual(art.infrastructure,c.infrastructure);assert.equal(new Set(art.districts.map(d=>d.name)).size,3);
 for(const [i,d]of art.districts.entries()){assert.equal(d.row,i);assert(Object.keys(d.points).length>=2);for(const [type,point]of Object.entries(d.points)){assert(F.records.some(f=>f.id===c.id+'-facility-'+type),c.id+' '+type);assert(point.every(n=>Number.isFinite(n)&&n>0&&n<100));}}
 const p=path.join(__dirname,'../ui',art.asset);assert(fs.existsSync(p),'Missing image '+p);assert(fs.statSync(p).size>100000);
 }
});
test('runtime and archived city district catalogues match',()=>{assert.deepEqual(data,JSON.parse(fs.readFileSync(path.join(__dirname,'../world/city-districts.json'),'utf8')));});
