'use strict';

const lookLabels={
  default:'기본 의상',casual:'일상복 · 전신',street:'대체 의상',fallen:'앉은 장면',
  help:'대화 손짓',sleep:'잠옷',guard:'경계 자세',rear:'후면 전신',attack:'공격 자세',
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
  for(const era of Object.keys(record.expressions||{})){
    emotions.forEach((label,index)=>{portraits[era+' · '+label]=CharacterContent.transferExpression(person.id,era,index);});
  }
  for(const [label,file] of Object.entries(record.sd||{})){
    for(let i=0;i<6;i++)sd[label+' '+(i+1)]=sheetCell(file,1536,1024,3,2,i);
  }
  for(const index of record.solo||[])sd['개별 상호작용 '+(index<3?1:2)]=sheetCell('sd-solo.png',1536,1024,3,2,index);
  for(const [era,file] of Object.entries(record.sheets||{})){
    looks[era+' · 표정·컷신·SD 원화']=sheetCell(file,1216,era==='지구'?1293:1294,1,1,0);
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
  stage.style.cssText='display:grid;place-items:center;max-width:100%;margin:16px auto;background:#24332c;overflow:hidden';
  body.append(select,info,bio,controls,stage);
  function show(frame,pixel=false,kind='art'){
    stage.replaceChildren();
    const bounds={art:[420,560],portrait:[420,340],scene:[420,420],sd:[240,240]};
    const [width,height]=bounds[kind];
    stage.style.width=width+'px';
    stage.style.aspectRatio=width+'/'+height;
    stage.dataset.artKind=kind;
    const crop=node('div');
    const fit=Math.min(width/frame.w,height/frame.h);
    const scale=pixel&&fit>=1?Math.floor(fit):fit;
    crop.style.cssText='position:relative;overflow:hidden;width:'+(frame.w*scale/width*100)+'%;aspect-ratio:'+frame.w+'/'+frame.h;
    const image=node('img');
    image.alt='선택한 캐릭터 외형';
    image.src=frame.src;
    image.style.cssText='position:absolute;max-width:none;width:'+frame.imageWidth/frame.w*100+'%;height:'+frame.imageHeight/frame.h*100+'%;left:'+(-frame.x/frame.w*100)+'%;top:'+(-frame.y/frame.h*100)+'%;'+(pixel?'image-rendering:pixelated;':'');
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
    for(const [key,frame] of Object.entries(record.looks))button(record.lookLabels?.[key]||lookLabels[key]||key,frame,false,key.startsWith('컷신 · ')?'scene':'art');
    for(const [key,frame] of Object.entries(record.portraits||{}))button('초상화 · '+key,frame,false,'portrait');
    for(const [key,frame] of Object.entries(record.sd))button('SD · '+({default:'기본',alternate:'대체 의상'}[key]||key),frame,false,'sd');
    const pixel=record.pixel;
    pixel?.frames.forEach(([x,y,w,h],index)=>{
      const illustrated=pixel.format==='illustrated-sd';
      button((illustrated?'전투 SD ':'도트 ')+(index+1),{src:pixel.src,x,y,w,h,imageWidth:pixel.imageWidth,imageHeight:pixel.imageHeight},!illustrated,'sd');
    });
    if(record.combatSprite){
      const clips=['대기','이동','공격','방어','회피','피격'];
      record.combatSprite.frames.forEach((_,i)=>{
        const frame=CharacterContent.combatFrame(record.combatSprite,i);
        button('전투 · '+clips[Math.floor(i/2)]+' '+(i%2+1),frame,frame.w<=96,'sd');
      });
    }
    show(record.looks.default||Object.values(record.looks)[0]);
  }
  select.onchange=render;
  render();
}};
