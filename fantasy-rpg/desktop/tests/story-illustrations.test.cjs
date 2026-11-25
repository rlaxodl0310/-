const test=require('node:test'),a=require('node:assert/strict'),I=require('../ui/story/illustrations.js'),Art=require('../electron/scene-art.cjs'),path=require('node:path');
test('narrative layers require actual presence and obey Earth exclusion without advancing state',()=>{
 const s={era:'fantasy',location:'arrival_meadow',present:['vanessa','kiriel'],minutes:65,revision:5};const before=JSON.stringify(s);
 for(const id of s.present){const options=I.options(s,id);a.equal(options.length,1);a.equal(options[0].key,'cutscene');a.equal(options[0].frame.presentation,'cinematic');for(const o of options)a(Art.ALLOWED.includes(o.frame.src));}
 a.deepEqual(I.options(s,'milia'),[]);a.deepEqual(I.options({...s,era:'earth',location:'subway'},'kiriel'),[]);a.deepEqual(I.options({...s,present:[]},'vanessa'),[]);a.equal(JSON.stringify(s),before);
});
test('desktop asset bridge loads actual registered new narrative frames',async()=>{
 for(const id of ['vanessa','kiriel'])for(const option of I.options({era:'fantasy',present:[id]},id))a((await Art.assetURL(path.resolve(__dirname,'../ui'),option.frame.src)).startsWith('data:image/webp;base64,'));
 await a.rejects(()=>Art.assetURL(path.resolve(__dirname,'../ui'),'../../private.png'));
});

test('all native content records retain fantasy origin for every Earth appearance guard',()=>{const C=require('../ui/characters/content.js'),O=require('../ui/characters/origins.js');for(const c of C.records){a.equal(c.origin,'fantasy',c.id);a.equal(O.allowed(c.id,{era:'earth',location:'subway'}),false,c.id);}});
