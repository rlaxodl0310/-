const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),R=require('../ui/battle/roster.js'),B=require('../ui/battle/engine.js'),E=require('../ui/monsters/essence-rules.js'),D=require('../ui/data.js');
test('every registered monster and character has a combat profile and explicit art status',()=>{a.deepEqual(R.monsters.map(m=>m.id),E.records.map(m=>m.id));a.deepEqual(R.characters.map(c=>c.id),D.catalog.map(c=>c.id));a.equal(R.monsters.length,E.records.length);for(const p of [...R.monsters,...R.characters]){a(p.hp>0);a(p.dedicated||p.art||p.temporaryArt);if(p.art)a(fs.existsSync(path.resolve(__dirname,'../ui/battle',p.art.src)));}});
test('all monster species execute turns, restore saves and remain their own species',()=>{for(const m of R.monsters){const b=B.restore(new B({kind:m.id,count:1}).save());a.equal(b.units[1].kind,m.id);a(b.units[1].name.startsWith(m.name));for(let i=0;i<12&&b.status==='playing';i++)a(b.act('guard','enemy-0').length>0);a(b.round>1);a.equal(B.restore(b.save()).units[1].kind,m.id);}});
test('all nine characters and mixed enemies coexist without claiming main companions or new skills',()=>{const b=new B({kind:'lairon',count:1,allies:R.characters.map(c=>c.id)});a.equal(b.living('ally').length,9);a.equal(new Set(b.living('ally').map(u=>u.x+','+u.y)).size,9);a.equal(B.restore(b.save()).units.length,10);const zero=b.units.find(u=>u.kind==='zero');a(zero);a.equal(R.get('zero').damage,0);const events=b.act('guard','enemy-0');a(events.some(e=>e.actor==='zero'&&e.type==='guard'));a(!events.some(e=>e.actor==='zero'&&e.type==='hit'));const mixed=new B({enemies:['por','chitin','moa','lairon','rat'],allies:R.characters.map(c=>c.id)});a.equal(mixed.units.length,14);a.deepEqual(B.restore(mixed.save()).living('enemy').map(u=>u.kind),['por','chitin','moa','lairon','rat']);a.equal(B.skills.filter(s=>s.id==='iron-rush').length,0);});

test('previous preview-only characters can fight and restore in the tactical lab',()=>{const b=new B({allies:['janghwa','selsi'],count:1});const restored=B.restore(b.save());for(const id of ['janghwa','selsi']){a.equal(restored.units.find(u=>u.id===id).kind,id);a.equal(R.get(id).dedicated,true);}a.equal(restored.units.find(u=>u.id==='janghwa').weapon,'magic');a.equal(restored.units.find(u=>u.id==='selsi').weapon,'gauntlet');});

test('a bow companion fires from range instead of entering melee',()=>{
  const battle=new B({allies:['kiriel'],count:1});
  const archer=battle.units.find(u=>u.id==='kiriel'),enemy=battle.units.find(u=>u.team==='enemy');
  enemy.x=archer.x+3;
  enemy.y=archer.y;
  const events=battle.act('guard');
  a(events.some(e=>e.type==='projectile'&&e.actor===archer.id&&e.target===enemy.id&&e.weapon==='bow'));
  a(!events.some(e=>e.type==='move'&&e.actor===archer.id));
  a.equal(B.restore(battle.save()).units.find(u=>u.id===archer.id).weapon,'bow');
});
