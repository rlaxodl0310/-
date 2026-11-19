const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const G=require('../ui/map/geography.js'),F=require('../ui/map/facilities.js'),data=require('../ui/map/city-district-data.js');
test('every city has its own architectural plan and three valid district service lists',()=>{
 const cities=G.records.filter(x=>x.kind==='city');assert.equal(data.length,cities.length);assert.equal(new Set(data.map(c=>c.asset)).size,cities.length);assert.equal(new Set(data.map(c=>c.layoutDraft)).size,cities.length);
 for(const c of cities){const art=data.find(a=>a.id===c.id);assert(art,c.id);assert.equal(art.name,c.name);assert.equal(art.districts.length,3);assert.deepEqual(art.infrastructure,c.infrastructure);assert(art.layoutDraft.length>20);assert.equal(new Set(art.districts.map(d=>d.name)).size,3);
 for(const [i,d]of art.districts.entries()){assert.equal(d.row,i);assert(d.facilities.length>=2);assert.equal(new Set(d.facilities).size,d.facilities.length);assert.equal(d.points,undefined);for(const type of d.facilities)assert(F.records.some(f=>f.id===c.id+'-facility-'+type),c.id+' '+type);}
 const b=fs.readFileSync(path.join(__dirname,'../ui',art.asset));assert.equal(b.readUInt32BE(16),1024);assert.equal(b.readUInt32BE(20),1536);
 }
});
test('runtime and archived city district catalogues match',()=>assert.deepEqual(data,JSON.parse(fs.readFileSync(path.join(__dirname,'../world/city-districts.json'),'utf8'))));
test('all36 completed city artworks match validated independent-layout asset hashes',()=>{const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../world/city-layout-manifest.json'),'utf8'));assert.equal(m.length,36);assert.equal(new Set(m.map(x=>x.id)).size,36);assert.equal(new Set(m.map(x=>x.sha256)).size,36);for(const a of m){const c=data.find(c=>c.id===a.id);assert(c);assert.equal(a.target,c.asset);const b=fs.readFileSync(path.join(__dirname,'../ui',a.target));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,a.id);}});
