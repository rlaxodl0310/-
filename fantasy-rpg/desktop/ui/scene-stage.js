const SceneStage=(()=>{
 const backgrounds={arrival_meadow:'assets/bg-arrival.webp',earth_subway:'assets/bg-subway.png',subway:'assets/bg-subway.png',earth_platform:'assets/bg-platform.png',platform:'assets/bg-platform.png',earth_station:'assets/bg-station.png',station:'assets/bg-station.png'};
 const characters={nea:'assets/nea-atlas.png','nea-travel':'assets/nea-atlas.png',yeogyeong:'assets/yeogyeong-standing.png',yui:'assets/yui-standing.png',seoha:'assets/seoha-standing.png','dogyeom-childhood-friend':'assets/childhood-friend-standing.png'};
 // Portraits are complete approved illustrations; never paste separate heads over bodies.
 for(const r of globalThis.StoryKitData?.content?.records||[])for(const [look,f]of Object.entries(r.looks))characters[look==='default'?r.id:r.id+'-'+look]=f.src;
 const dialogueIds=new Set([
  'nea','nea-travel','yui','taei','yeogyeong','dogyeom','seoha','woojin','zero','dogyeom-childhood-friend',
  ...(globalThis.StoryKitData?.content?.records||[]).map(record=>record.id),
 ]);
 const faces={},cache=new Map(),ready=new Map(),tokens=new WeakMap();
 const load=async url=>{if(typeof window!=='undefined'&&window.sceneArtAPI&&!url.startsWith('data:')){const r=await window.sceneArtAPI.asset(url);if(!r.ok)throw Error(r.error);url=r.data;}return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('캐릭터 원화를 불러오지 못했습니다.'));im.src=url;});};
 function headDimensions(cw,ch,cropHeight){return{width:430,height:Math.round(cropHeight*ch/cw)};}
 function identityMode(characterId){return characters[characterId]?'integrated':'none';}
 // Each anchor gives the eye midpoint and eye-to-chin distance in source-frame fractions.
 const expressionFraming={
  'taei-earth-expressions.webp':[.51,.32,.22],
  'taei-fighter-expressions.webp':[.51,.315,.22],
  'dogyeom-expressions.png':[.53,.38,.18],
  'yeogyeong-expressions.png':[.535,.37,.22],
  'yeogyeong-fantasy-expressions.png':[.54,.34,.235],
  'seoha-expressions.png':[.51,.37,.19],
  'yui-expressions.png':[.55,.39,.22],
  'woojin-expressions.png':[.50,.32,.19],
 };
 const portraitFraming={
  ace:[.47,.39,.20],aquila:[.50,.37,.19],ariel:[.52,.40,.18],biscuit:[.51,.355,.145],cheona:[.52,.38,.20],
  'dogyeom-childhood-friend':[.50,.36,.19],dogyeom:[.51,.35,.19],espada:[.49,.38,.20],
  evan:[.50,.35,.20],fafnir:[.51,.39,.126],fenri:[.50,.36,.156],halo:[.48,.36,.19],hebnia:[.53,.38,.20],
  hellenia:[.52,.38,.20],janghwa:[.52,.30,.141],jave:[.50,.36,.20],karin:[.58,.37,.20],
  kiriel:[.52,.38,.21],lir:[.54,.38,.20],milia:[.55,.40,.20],nadan:[.51,.34,.20],
  nea:[.49,.40,.18],'nea-travel':[.49,.40,.18],palanus:[.52,.38,.19],rachel:[.51,.36,.20],
  reginleif:[.53,.39,.235],horin:[.50,.31,.195],restia:[.52,.39,.18],rosie:[.51,.37,.18],
  selsi:[.50,.30,.22],seoha:[.50,.31,.19],spike:[.54,.43,.20],spina:[.50,.40,.18],
  taei:[.50,.34,.185],taeo:[.52,.38,.19],trude:[.51,.40,.19],woojin:[.51,.36,.20],
  yeogyeong:[.50,.34,.22],yui:[.50,.32,.20],yunseol:[.51,.37,.20],
 };
 const portraitLayout=Object.freeze({width:600,height:460,eyeLine:196,faceHeight:110});
 function portraitGeometry(characterId,frame){
  const file=frame.src.split('/').at(-1);
  const anchor=expressionFraming[file]||portraitFraming[characterId];
  const {width,height,eyeLine,faceHeight}=portraitLayout;
  if(!anchor){
   const ratio=Math.min(width/frame.w,height/frame.h),w=frame.w*ratio,h=frame.h*ratio;
   return {inset:0,x:(width-w)/2,y:height-h,w,h};
  }
  const [eyeX,eyeY,face]=anchor;
  const h=faceHeight/face,w=h*frame.w/frame.h;
  // The Earth expression sheet includes a faint line at the edge of each cell.
  const inset=file==='yeogyeong-expressions.png'?4:0;
  return {inset,x:width/2-eyeX*w,y:eyeLine-eyeY*h,w,h};
 }
 function drawExpression(canvas,body,frame,characterId){
  canvas.width=portraitLayout.width;canvas.height=portraitLayout.height;
  const {x,y,w,h,inset}=portraitGeometry(characterId,frame);
  canvas.getContext('2d').drawImage(body,frame.x+inset,frame.y+inset,frame.w-2*inset,frame.h-2*inset,
   x+inset*w/frame.w,y+inset*h/frame.h,w*(1-2*inset/frame.w),h*(1-2*inset/frame.h));
 }
 // Replace light matte contamination at the alpha edge with the adjacent artwork color.
 // Keep the alpha coverage and all opaque pixels to preserve antialiasing and light clothing.
 function cleanPortraitEdge({data,width,height}){
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
   const i=(y*width+x)*4,alpha=data[i+3];
   if(alpha<10||alpha>215)continue;
   const low=Math.min(data[i],data[i+1],data[i+2]),high=Math.max(data[i],data[i+1],data[i+2]);
   if(low<125||high-low>35)continue;
   if([-4,4,-width*4,width*4].every(offset=>data[i+offset+3]>alpha-12))continue;
   let neighbor=-1,distance=10;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const d=dx*dx+dy*dy;
    if(d>=distance||x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue;
    const j=i+(dy*width+dx)*4;
    if(data[j+3]<235)continue;
    neighbor=j;distance=d;
   }
   if(neighbor<0||(data[i]+data[i+1]+data[i+2])-(data[neighbor]+data[neighbor+1]+data[neighbor+2])<54)continue;
   for(let c=0;c<3;c++)data[i+c]=data[neighbor+c];
  }
 }
 function sprite(characterId,emotion=0,frame=null){const key=frame?[characterId,frame.src,frame.x,frame.y,frame.w,frame.h].join(':'):characterId+':0';if(cache.has(key))return cache.get(key);const task=(async()=>{const body=await load(frame?.src||characters[characterId]),canvas=document.createElement('canvas'),record=(globalThis.StoryKitData?.content?.records||[]).find(r=>characterId===r.id||characterId.startsWith(r.id+'-'));if(frame){drawExpression(canvas,body,{...frame,w:frame.w||body.naturalWidth,h:frame.h||body.naturalHeight},characterId);}else if(record){const key=characterId===record.id?'default':characterId.slice(record.id.length+1),f=record.looks[key]||record.looks.default;canvas.width=f.w;canvas.height=f.h;canvas.getContext('2d').drawImage(body,f.x,f.y,f.w,f.h,0,0,f.w,f.h);}else if(['nea','nea-travel'].includes(characterId)){const f=NeaData.record.frames[characterId==='nea-travel'?'travel':'poor'];canvas.width=f.w;canvas.height=f.h;canvas.getContext('2d').drawImage(body,f.x,f.y,f.w,f.h,0,0,f.w,f.h);}else{canvas.width=body.naturalWidth||body.width;canvas.height=body.naturalHeight||body.height;canvas.getContext('2d').drawImage(body,0,0);}const context=canvas.getContext('2d');const pixels=context.getImageData(0,0,canvas.width,canvas.height);cleanPortraitEdge(pixels);context.putImageData(pixels,0,0);const url=canvas.toDataURL('image/png');ready.set(key,url);return url;})();cache.set(key,task);task.catch(()=>cache.delete(key));if(cache.size>24){const oldest=cache.keys().next().value;cache.delete(oldest);ready.delete(oldest);}return task;}
 function lockPortrait(portrait,characterId,emotion=0){const token=(tokens.get(portrait)||0)+1;tokens.set(portrait,token);if(!characters[characterId]||typeof Image==='undefined'||typeof document==='undefined')return;emotion=Math.max(0,Math.min(5,Number.isInteger(emotion)?emotion:0));if(identityMode(characterId)==='integrated')emotion=0;portrait.dataset.identityMode=identityMode(characterId);const key=characterId+':'+emotion;portrait.style.backgroundSize='contain';portrait.style.backgroundPosition='center bottom';if(ready.has(key)){portrait.style.backgroundImage='url("'+ready.get(key)+'")';portrait.style.visibility='visible';portrait.dataset.faceLocked=String(identityMode(characterId)==='original-head');portrait.dataset.spriteReady='true';return;}portrait.dataset.spriteReady='loading';portrait.style.visibility='hidden';sprite(characterId,emotion).then(url=>{if(tokens.get(portrait)!==token)return;portrait.style.backgroundImage='url("'+url+'")';portrait.style.visibility='visible';portrait.dataset.faceLocked=String(identityMode(characterId)==='original-head');portrait.dataset.spriteReady='true';}).catch(()=>{if(tokens.get(portrait)!==token)return;portrait.style.visibility='visible';portrait.dataset.spriteReady='error';});}
 function render({background,portrait,location,characterId,emotion=0,state=null,era=null,dialogue=false,player=null}){const bg=backgrounds[location]||backgrounds.earth_subway;
  background.style.backgroundImage='url("'+bg+'")';background.style.backgroundSize='cover';background.style.backgroundPosition='center';background.dataset.location=location;background.dataset.cutscene='false';
  const context={location,emotion,state,era,dialogue};
  drawPortrait(portrait,characterId==='taei'&&player?null:characterId,context);
  if(player)drawPortrait(player,dialogue?'taei':null,{...context,emotion:0});
 }
 function drawPortrait(portrait,characterId,{location,emotion=0,state,era,dialogue}){
  const earth=CharacterOrigins.isEarth(era,location)||(era!=='fantasy'&&!backgrounds[location]);if(!CharacterOrigins.allowed(characterId,{era:earth?'earth':era,location})){tokens.set(portrait,(tokens.get(portrait)||0)+1);characterId=null;}if(characterId==='nea'&&state&&NeaData.outfit(state)==='travel')characterId='nea-travel';const upperBody=dialogue&&dialogueIds.has(characterId);const portraitFrame=globalThis.StoryKitData?.content?.get?.(characterId)?.portraits?.default;const character=upperBody?(portraitFrame?.src||'assets/dialogue/'+characterId+'.webp'):characters[characterId];portrait.hidden=!character;portrait.dataset.character=characterId||'';portrait.dataset.emotion=String(emotion);portrait.dataset.framing=upperBody?'upper-body':'full';portrait.style.backgroundImage=character?'url("'+character+'")':'none';portrait.style.backgroundSize='contain';portrait.style.backgroundPosition='center bottom';portrait.style.backgroundRepeat='no-repeat';portrait.style.border='none';portrait.style.outline='none';portrait.setAttribute('aria-label',characterId?({...Object.fromEntries((globalThis.StoryKitData?.content?.records||[]).map(r=>[r.id,r.unknownName])),taei:'김태이',nea:'네아','nea-travel':'네아',yui:'한유이',yeogyeong:'차여경',seoha:'윤서하','dogyeom-childhood-friend':'임소윤'})[characterId]||'등장 인물':'등장 인물 없음');if(upperBody){tokens.set(portrait,(tokens.get(portrait)||0)+1);portrait.style.visibility='hidden';portrait.dataset.spriteReady='loading';
    const frame=globalThis.StoryKitData?.content?.dialogueFrame?.(characterId,earth?'지구':'이세계',emotion)||{src:character,x:0,y:0};
    const token=tokens.get(portrait),fallback=portrait.style.backgroundImage;
    sprite(characterId,emotion,frame).then(url=>{
      if(tokens.get(portrait)!==token)return;
      if(portrait.style.backgroundImage===fallback)portrait.style.backgroundImage='url("'+url+'")';
      portrait.style.visibility='visible';portrait.dataset.spriteReady='true';
    }).catch(()=>{
      if(tokens.get(portrait)!==token)return;
      portrait.style.visibility='visible';portrait.dataset.spriteReady='error';
    });
  }else lockPortrait(portrait,characterId,emotion);}
 function cutscene(background,portrait,url,panel,player){background.style.backgroundImage='url("'+url+'")';background.style.backgroundSize=panel===undefined?'cover':'200% 100%';background.style.backgroundPosition=panel===undefined?'center':panel*100+'% center';background.dataset.cutscene='true';portrait.hidden=true;if(player)player.hidden=true;}
 return {render,cutscene,backgrounds,characters,faces,lockPortrait,headDimensions,identityMode,portraitLayout,portraitGeometry,drawPortrait,cleanPortraitEdge};
})();
