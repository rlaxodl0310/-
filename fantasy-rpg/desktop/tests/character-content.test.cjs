const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../ui/characters/content.js'),D=require('../ui/data.js'),O=require('../ui/characters/origins.js'),R=require('../ui/battle/roster.js');
test('native content hides identity and rejects Earth without granting powers',()=>{const c=C.get('cheona');a.deepEqual(c.preferredWeapons,['dagger']);a.equal(c.trait,null);a.equal(c.age,19);a(D.catalog.some(x=>x.id===c.id));a.equal(C.displayName({turns:[{}]},c.id),c.unknownName);a.equal(C.displayName({knownIdentities:{cheona:true}},c.id),c.name);for(const id of [c.id,...Object.keys(c.looks).map(k=>c.id+'-'+k)]){a.equal(O.allowed(id,{era:'earth',location:'earth_subway'}),false);a.equal(O.allowed(id,{era:'fantasy'}),true);}a.deepEqual(R.get(c.id).preferredWeapons,['dagger']);});
test('appearance bounds and files include separate corrected seated art',()=>{for(const c of C.records){for(const f of [...Object.values(c.looks),...Object.values(c.sd)]){a(fs.existsSync(path.resolve(__dirname,'../ui',f.src)));a(f.x>=0&&f.y>=0&&f.x+f.w<=f.imageWidth&&f.y+f.h<=f.imageHeight);}for(const [x,y,w,h] of c.pixel?.frames||[])a(x+w<=c.pixel.imageWidth&&y+h<=c.pixel.imageHeight);if(c.id==='cheona'){a.equal(C.appearance(c.id,{pose:'fallen'}).src,'assets/cheona-fallen.webp');a.notEqual(c.looks.fallen.src,c.looks.default.src);a(c.persona.includes('검정 이너를 새로 추가하지 않는다'));}}});
test('sleep appearance is native-only and separate from default, portrait and SD are bounded',()=>{const c=C.get('cheona');a.equal(C.appearance(c.id,{look:'sleep'}),c.looks.sleep);a.notEqual(c.looks.default.src,c.looks.sleep.src);a.equal(O.allowed('cheona-sleep',{era:'earth'}),false);for(const f of [c.looks.sleep,c.sd.sleep,c.portraits.sleep]){a(fs.existsSync(path.resolve(__dirname,'../ui',f.src)));a(f.x+f.w<=f.imageWidth&&f.y+f.h<=f.imageHeight);}a(c.persona.includes('발끝을 덮는 스타킹'));});
test('Fafnir is a 20-year-old native mage with ranged magic events and dedicated combat art',()=>{const c=C.get('fafnir');a.equal(c.age,20);a.deepEqual(c.roles,['mage']);a.equal(c.trait,null);a.equal(R.get(c.id).temporaryArt,false);a.equal(O.allowed(c.id,{era:'earth'}),false);a.equal(C.displayName({},c.id),c.unknownName);const B=require('../ui/battle/engine.js'),b=new B({allies:[c.id],count:1});const u=b.units.find(x=>x.id===c.id);a.equal(u.weapon,'magic');const events=[...b.act('guard'),...b.act('guard')];a(events.some(e=>e.actor===c.id&&e.type==='cast'));a(events.some(e=>e.actor===c.id&&e.type==='projectile'&&e.weapon==='magic'));a.equal(B.restore(b.save()).units.find(x=>x.id===c.id).weapon,'magic');});

test('confirmed measurements are shared data without initial identity disclosure',()=>{a.equal(C.get('cheona').heightCm,167);a.equal(C.get('cheona').weightKg,46);a.equal(C.get('fafnir').heightCm,154);a.equal(C.get('fafnir').weightKg,53);a.equal(D.catalog.find(c=>c.id==='fafnir').heightCm,154);a.equal(C.displayName({},'fafnir'),C.get('fafnir').unknownName);});

test('combat atlas selects both frames of all six clips and preserves legacy save data', async () => {
  const vm = require('node:vm');
  const loaded = [];
  class Image {
    set src(value) { loaded.push(value); this.onload(); }
  }
  const context = {Image, CharacterContent: C};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../ui/battle/cast-sprites.js'), 'utf8'), context);
  const sprites = context.CastSprites;
  await sprites.load('../battle/');
  const calls = [];
  const canvas = {clearRect() {}, drawImage(_image, ...args) { calls.push(args); }};
  const clips = ['idle', 'move', 'attack', 'guard', 'dodge', 'hit'];
  const Battle = require('../ui/battle/engine.js');
  const legacy = new Battle({allies:['cheona','fafnir'],count:1}).save();
  for (const id of ['fenri', 'cheona', 'fafnir', 'janghwa', 'selsi']) {
    const atlas = C.get(id).combatSprite;
    a(loaded.includes('../battle/' + atlas.src));
    const png = fs.readFileSync(path.resolve(__dirname, '../ui/battle', atlas.src));
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    a.equal(png[25], 6);
    for (const [index, pose] of clips.entries()) {
      for (const phase of [0, 1]) {
        const fps = pose === 'idle' ? 3 : 9;
        a(sprites.draw(canvas, id, phase * 1.25 / (fps * atlas.tempo), pose === 'move', pose, phase));
        const [x, y, w, h] = calls.at(-1);
        a.deepEqual([x,y,w,h], atlas.frames[index * 2 + phase]);
        a(x + w <= width && y + h <= height);
      }
    }
  }
  a.deepEqual(Battle.restore(legacy).save(), legacy);
});
