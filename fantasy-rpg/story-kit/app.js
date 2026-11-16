const D=StoryKitData,E=StoryKitEngine,$=id=>document.getElementById(id),KEY='fantasy-story-kit-v2-solo';
let engine=new E(D),paused=false,storageBlocked=false;
try{const saved=localStorage.getItem(KEY);if(saved)engine=E.restore(D,saved);}catch{storageBlocked=true;$('error').textContent='저장 기록을 읽지 못했습니다. 원본은 덮어쓰지 않습니다. 필요하면 초기화해 주세요.';}
function save(){if(storageBlocked)return;try{localStorage.setItem(KEY,engine.serialize());}catch{$('error').textContent='브라우저 저장이 불가능합니다. 이 창에서는 계속 진행할 수 있습니다.';}}
function element(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
function tile(node,path,index){node.style.backgroundImage=`url("${path}")`;node.style.backgroundPosition=`${(index%3)*50}% ${Math.floor(index/3)*100}%`;}
function run(action){try{action();save();draw();}catch(error){$('error').textContent=error.message;}}
function draw(){
  const a=engine.state.active,n=engine.current();$('menu').hidden=!!a&&!paused;$('player').hidden=!a||paused;
  $('status').textContent=`완료 ${engine.state.completed.length}/${D.events.length} · 연습 시간 ${engine.state.minutes}분 · ${a?'대화 진행 중 · 자동 저장':'준비됨'}`;
  $('resume').hidden=!a;$('events').replaceChildren();
  for(const e of D.events){const b=element('button',e.title+(engine.state.completed.includes(e.id)?' · 완료':''));b.disabled=!!a||engine.state.completed.includes(e.id);b.onclick=()=>run(()=>{engine.start(e.id,{location:e.location,members:e.members,viewer:e.viewer});paused=false;});$('events').append(b);}
  if(!a)return;const event=engine.event(a.id);$('event-title').textContent=event.title;$('cg').src=D.assets[event.cg];
  tile($('portrait'),D.assets[event.portraitAsset||n.speaker],n.emotion||0);$('portrait').setAttribute('aria-label',D.actors[n.speaker]+' '+D.emotions[n.emotion||0]);
  $('speaker').textContent=D.actors[n.speaker];$('line').textContent=n.text;$('emotion').textContent=D.emotions[n.emotion||0];
  $('sd').hidden=n.sd===undefined;if(n.sd!==undefined)tile($('sd'),D.assets[event.sdAsset||'sd'],n.sd);
  $('choices').replaceChildren();
  if(n.choices)for(const c of n.choices){const b=element('button',c.label);b.onclick=()=>run(()=>engine.advance(c.id));$('choices').append(b);}
  else{const b=element('button',n.end?'대화 마치기':'계속');b.onclick=()=>run(()=>engine.advance());$('choices').append(b);}
}
$('pause').onclick=()=>{paused=true;save();draw();};$('resume').onclick=()=>{paused=false;draw();};
$('reset').onclick=()=>{if(confirm('연습 이벤트 기록을 초기화할까요?')){engine=new E(D);paused=false;storageBlocked=false;$('error').textContent='';save();draw();}};
for(const id of Object.keys(D.actors)){const article=document.createElement('article');article.append(element('h3',D.actors[id]));const image=document.createElement('img');image.src=D.assets[id];image.alt=D.actors[id]+' 표정 여섯 가지';article.append(image);$('sheets').append(article);}
$('sd-sheet').src=D.assets.sd;$('yeogyeong-sd-sheet').src=D.assets.yeogyeongSD;draw();

for(const [key,label] of [['yeogyeongOutfit','차여경 이세계 여행복'],['yeogyeongFantasy','차여경 이세계 표정 6종'],['yeogyeongFantasySD','차여경 이세계 SD 6종']]){
  const article=document.createElement('article');article.append(element('h3',label));const picture=document.createElement('img');picture.src=D.assets[key];picture.alt=label;article.append(picture);$('sheets').append(article);
}
