const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function load(){const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../ui/characters/origins.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../ui/scene-stage.js'),'utf8')+';globalThis.Stage=SceneStage;',ctx);return ctx.Stage;}
const layer=()=>({style:{},dataset:{},setAttribute(k,v){this[k]=v;}});
test('background changes retain the same independent full-body character layer',()=>{const Stage=load(),background=layer(),portrait=layer();Stage.render({background,portrait,location:'subway',characterId:'yeogyeong',emotion:1});const url=portrait.style.backgroundImage;Stage.render({background,portrait,location:'platform',characterId:'yeogyeong',emotion:2});assert.equal(portrait.style.backgroundImage,url);assert.match(background.style.backgroundImage,/bg-platform/);assert.equal(portrait.style.backgroundSize,'contain');assert.equal(portrait.style.border,'none');assert.equal(portrait.hidden,false);Stage.render({background,portrait,location:'station',characterId:'yui'});assert.match(portrait.style.backgroundImage,/yui-standing/);});
test('cutscenes are explicit and returning to scene restores character and background',()=>{const Stage=load(),background=layer(),portrait=layer();Stage.render({background,portrait,location:'subway',characterId:'yui'});Stage.cutscene(background,portrait,'approved-cg.png',0);assert.equal(portrait.hidden,true);assert.equal(background.dataset.cutscene,'true');Stage.render({background,portrait,location:'subway',characterId:'yui'});assert.equal(portrait.hidden,false);assert.match(background.style.backgroundImage,/bg-subway/);});
test('unknown or absent character does not render a different person',()=>{const Stage=load(),background=layer(),portrait=layer();Stage.render({background,portrait,location:'bad',characterId:'missing'});assert.equal(portrait.hidden,true);assert.equal(portrait.style.backgroundImage,'none');assert.match(background.style.backgroundImage,/bg-subway/);});

test('original head cells retain their aspect ratio, including non-square reference cells',()=>{const Stage=load();for(const [cw,ch,crop]of [[512,512,378],[273,287,378],[512,512,340]]){const d=Stage.headDimensions(cw,ch,crop),sourceRatio=(430/512*cw)/(crop/512*ch);assert.ok(Math.abs(d.width/d.height-sourceRatio)<.004);}});

test('Soyun uses an integrated illustration without the old head overlay',()=>{const Stage=load();assert.equal(Stage.identityMode('dogyeom-childhood-friend'),'integrated');assert.equal(Stage.identityMode('yeogyeong'),'integrated');const D=require('../ui/data.js');assert.equal(D.catalog.find(c=>c.id==='dogyeom-childhood-friend').name,'임소윤');assert.ok(!D.initiallyKnown.includes('dogyeom-childhood-friend'));});

test('native Nea never renders on Earth or the unknown-background subway fallback',()=>{const Stage=load();for(const location of ['earth_subway','platform','station','unregistered'])for(const characterId of ['nea','nea-travel']){const background=layer(),portrait=layer();Stage.render({background,portrait,location,characterId});assert.equal(portrait.hidden,true);assert.equal(portrait.style.backgroundImage,'none');assert.equal(portrait.dataset.character,'');}});

test('every registered full-body portrait bypasses separate expression head overlays',()=>{const Stage=load();assert.equal(Object.keys(Stage.faces).length,0);for(const id of Object.keys(Stage.characters))assert.equal(Stage.identityMode(id),'integrated');assert.equal(Stage.identityMode('missing'),'none');});

test('dialogue framing matches faces across sources and trims the Earth Yeogyeong sheet border',()=>{
 const Stage=load(),size=Stage.portraitLayout;
 const samples=[
  ['taei',{src:'assets/taei-earth-expressions.webp',w:512,h:512},.51,.32,.22],
  ['yeogyeong',{src:'assets/yeogyeong-expressions.png',w:512,h:512},.535,.37,.22],
  ['fafnir',{src:'assets/dialogue/fafnir.webp',w:720,h:540},.51,.39,.126],
  ['janghwa',{src:'assets/dialogue/janghwa.webp',w:720,h:540},.52,.30,.141],
  ['reginleif',{src:'assets/reginleif-looks.webp',w:512,h:512},.46,.28,.175],
  ['milia',{src:'assets/dialogue/milia.webp',w:720,h:540},.47,.42,.153],
  ['taeo',{src:'assets/dialogue/taeo.webp',w:960,h:720},.47,.33,.14],
 ];
 for(const [id,frame,eyeX,eyeY,face] of samples){
  const g=Stage.portraitGeometry(id,frame);
  assert(Math.abs(g.x+eyeX*g.w-size.width/2)<1e-6);
  assert(Math.abs(g.y+eyeY*g.h-size.eyeLine)<1e-6);
  assert(Math.abs(g.h*face-size.faceHeight)<1e-6);
  assert.equal(g.inset,id==='yeogyeong'?4:0);
 }
});

test('light portrait matte is removed without changing alpha or opaque highlights',()=>{
 const data=new Uint8ClampedArray(7*7*4);
 const put=(x,y,rgba)=>data.set(rgba,(y*7+x)*4);
 const get=(x,y)=>Array.from(data.slice((y*7+x)*4,(y*7+x)*4+4));
 put(3,3,[65,47,34,255]);
 put(2,3,[210,204,201,93]);
 put(4,3,[233,230,229,255]);
 put(5,3,[235,232,229,95]);
 load().cleanPortraitEdge({data,width:7,height:7});
 assert.deepEqual(get(2,3),[65,47,34,93]);
 assert.deepEqual(get(4,3),[233,230,229,255]);
 assert.deepEqual(get(5,3),[235,232,229,95]);
});
