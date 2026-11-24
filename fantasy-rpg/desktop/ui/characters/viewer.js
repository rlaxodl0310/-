'use strict';

const lookLabels={
  default:'기본 의상',casual:'일상복 · 전신',street:'대체 의상',fallen:'앉은 장면',
  help:'대화 손짓',cutscene:'컷신',sleep:'잠옷',guard:'경계 자세',rear:'후면 전신',attack:'공격 자세',
  irritated:'화를 참는 순간 · 컷신',laughing:'웃는 순간 · 컷신',startled:'벌레에 놀란 순간 · 컷신',
  ready:'준비 자세',sigh:'한숨 · 컷신',cast:'마력실 시전',hit:'피격 반응',
  flustered:'당황한 순간 · 컷신',alternate:'대체 의상 · 전신',alternateCast:'대체 의상 · 마력실 시전',
};
const weaponLabels={dagger:'단검류',magic:'마법',sword:'검',manaThread:'마력실',rapier:'레이피어',axe:'대형 도끼',shield:'대형 방패',greatsword:'대검',bow:'활',staff:'지팡이'};
const emotions=['기본','미소','당황','걱정','진지','고유 동작'];

function transferArt(person){
  const {sheetCell,legacyCasual,transfers}=CharacterContent;
  const record=transfers[person.id];
  const looks={...record.looks};
  if(legacyCasual[person.id])looks.casual=legacyCasual[person.id];
  for(const [title,file,width,height,columns=1,index=0] of record.cutscenes||[]){
    looks['컷신 · '+title]=sheetCell(file,width,height,columns,1,index);
  }
  const portraits={},sd={};
  if(record.earthPortrait)portraits['지구 · 대화 기본']=record.earthPortrait;
  if(record.dialoguePortrait)portraits['대화 기본']=record.dialoguePortrait;
  for(const era of Object.keys(record.expressions||{})){
    emotions.forEach((label,index)=>{portraits[era+' · '+label]=CharacterContent.transferExpression(person.id,era,index);});
  }
  for(const [label,file] of Object.entries(record.sd||{})){
    for(let i=0;i<6;i++)sd[label+' '+(i+1)]=sheetCell(file,1536,1024,3,2,i);
  }
  for(const index of record.solo||[])sd['개별 상호작용 '+(index<3?1:2)]=sheetCell('sd-solo.png',1536,1024,3,2,index);
  for(const [era,sheet] of Object.entries(record.gallerySheets||{})){
    const {file,height,portraits:faces,sd:poses}=sheet;
    const frame=(x,y,w,h)=>({src:'assets/'+file,imageWidth:1216,imageHeight:height,x,y,w,h});
    ['기본','미소','놀람','걱정','당황','진지'].forEach((label,index)=>{
      const column=index%3,row=Math.floor(index/3);
      const [x,y,width,fullHeight]=faces;
      const w=Math.floor(width/3),h=Math.floor(fullHeight/2);
      portraits[era+' · '+label]=frame(x+column*w,y+row*h,w,h);
    });
    const [x,y,width,h]=poses;
    const w=Math.floor(width/4);
    for(let i=0;i<4;i++)sd[era+' · '+(i+1)]=frame(x+w*i,y,w,h);
  }
  for(const [pose,label] of [['ready','대기'],['attack','공격'],['run','이동'],['hit','피격']]){
    const frame=StoryBattleArt.character(person.id,pose);
    if(frame)looks['전투 · '+label]=frame;
  }
  return {...person,...record,species:'인간족 · 전이자',preferredWeapons:[],looks,portraits,sd};
}

window.CharacterContentUI={open(body){
  const records=[
    ...CharacterContent.records,
    ...StoryKitData.catalog.filter(person=>CharacterContent.transfers[person.id]).map(transferArt),
  ];
  const node=(tag,text='')=>{const element=document.createElement(tag);element.textContent=text;return element;};
  const select=node('select');
  select.setAttribute('aria-label','미리 볼 캐릭터');
  for(const record of records){
    const option=node('option',record.name);
    option.value=record.id;
    select.append(option);
  }
  const info=node('p'),bio=node('p'),controls=node('div'),stage=node('div');
  stage.style.cssText='display:grid;place-items:center;max-width:100%;margin:16px auto;background:#24332c;overflow:hidden;position:relative';
  body.append(select,info,bio,stage,controls);
  const baseline=CharacterContent.appearance('cheona');
  const [referenceHead,referenceSoles]=baseline.body;
  const galleryBodyHeight=560*(referenceSoles-referenceHead)/baseline.h;
  function show(frame,pixel=false,kind='art'){
    stage.replaceChildren();
    const bounds={art:[600,560],portrait:[420,340],scene:[600,420],sd:[240,240]};
    let [width,height]=bounds[kind];
    const crop=node('div');
    const inset=frame.inset||0;
    const x=frame.x+inset,y=frame.y+inset,w=frame.w-2*inset,h=frame.h-2*inset;
    const fit=Math.min(width/w,height/h);
    let scale=pixel&&fit>=1?Math.floor(fit):fit;
    let position='position:relative;';
    if(kind==='art'&&frame.body){
      const [head,soles,artTop=head,artBottom=soles]=frame.body;
      const margin=16;
      width=720;
      scale=galleryBodyHeight/(soles-head);
      height=Math.ceil((artBottom-artTop)*scale)+2*margin;
      position='position:absolute;left:50%;transform:translateX(-50%);top:'+((margin-artTop*scale)/height*100)+'%;';
    }
    stage.style.width=width+'px';
    stage.style.aspectRatio=width+'/'+height;
    stage.dataset.artKind=kind;
    crop.style.cssText=position+'overflow:hidden;width:'+(w*scale/width*100)+'%;aspect-ratio:'+w+'/'+h;
    const image=node('img');
    image.alt='선택한 캐릭터 외형';
    image.src=frame.src;
    image.style.cssText='position:absolute;max-width:none;width:'+frame.imageWidth/w*100+'%;height:'+frame.imageHeight/h*100+'%;left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%;'+(pixel?'image-rendering:pixelated;':'');
    crop.append(image);
    stage.append(crop);
  }
  function render(){
    const record=records.find(entry=>entry.id===select.value);
    if(!record)return;
    controls.replaceChildren();
    const weapons=record.preferredWeapons.map(weapon=>weaponLabels[weapon]||weapon);
    info.textContent=[record.name,record.species||'종족 미정',weapons.length?'선호 무기 '+weapons.join(', '):null,
      record.age?record.age+'세':null,record.heightCm?record.heightCm+'cm':null,record.weightKg?record.weightKg+'kg':null].filter(Boolean).join(' · ');
    bio.textContent=record.bio?(record.trait?'고유 특성 '+record.trait+' · ':'')+record.bio:'';
    bio.hidden=!bio.textContent;
    const displayed=new Set();
    const button=(label,frame,pixel=false,kind='art')=>{
      const key=[frame.src,frame.x,frame.y,frame.w,frame.h].join(':');
      if(displayed.has(key))return;
      displayed.add(key);
      const control=node('button',label);
      control.onclick=()=>show(frame,pixel,kind);
      controls.append(control);
    };
    for(const [key,frame] of Object.entries(record.looks))button(record.lookLabels?.[key]||lookLabels[key]||key,frame,false,frame.kind||((key==='cutscene'||key.startsWith('컷신 · '))?'scene':'art'));
    for(const [key,frame] of Object.entries(record.portraits||{}))button('초상화 · '+key,frame,false,'portrait');
    for(const [key,frame] of Object.entries(record.sd))button('SD · '+({default:'기본',alternate:'대체 의상'}[key]||key),frame,false,'sd');
    const pixel=record.pixel;
    if(!record.combatSprite)pixel?.frames.forEach(([x,y,w,h],index)=>{
      const illustrated=pixel.format==='illustrated-sd';
      button((illustrated?'전투 SD ':'도트 ')+(index+1),{src:pixel.src,x,y,w,h,imageWidth:pixel.imageWidth,imageHeight:pixel.imageHeight},!illustrated,'sd');
    });
    if(record.combatSprite){
      const labels={idle:'대기',move:'이동',attack:'공격',guard:'방어',dodge:'회피',hit:'피격'};
      const definitions=record.combatSprite.clips||Object.fromEntries(Object.keys(labels).map((key,i)=>[key,{frames:[i*2,i*2+1]}]));
      for(const [key,clip]of Object.entries(definitions))for(const [phase,index]of clip.frames.entries()){
        const frame=CharacterContent.combatFrame(record.combatSprite,index);
        button('전투 · '+labels[key]+' '+(phase+1),frame,record.combatSprite.pixelated||frame.w<=96,'sd');
      }
    }
    show(record.looks.default||Object.values(record.looks)[0]);
  }
  select.onchange=render;
  render();
}};
