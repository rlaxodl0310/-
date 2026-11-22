(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('../assets/combat/frames.json'));else r.StoryBattleArt=f(r.StoryArtFrames);})(globalThis,frames=>{
const Content=typeof module==='object'&&module.exports?require('../characters/content.js'):globalThis.CharacterContent||{records:[]};
const combatPoses={ready:0,attack:5,hit:10,run:3};
for(const record of Content.records){
  for(const [pose,index] of Object.entries(combatPoses)){
    frames[pose]??={};
    frames[pose][record.id]=record.combatSprite
      ?Content.combatFrame(record.combatSprite,index)
      :record.looks[pose==='hit'?'fallen':pose==='attack'?'help':'default']||record.looks.default;
  }
}
const ids=[...Content.records.map(r=>r.id),'taei','dogyeom','yeogyeong','seoha','yui','woojin','dogyeom-childhood-friend','nea','zero'];
function character(id,pose='ready'){return frames[pose]?.[id]||null;}
function layer(parent,id,side='ally',index=0,pose='ready'){const frame=character(id,pose);if(!frame)return;const outer=document.createElement('div'),image=document.createElement('img');outer.className='story-fighter '+side;outer.dataset.actor=id;outer.dataset.pose=pose;outer.style.setProperty('--offset',index);outer.style.aspectRatio=frame.w+' / '+frame.h;image.src=frame.src;image.alt='';image.style.width=frame.imageWidth/frame.w*100+'%';image.style.height=frame.imageHeight/frame.h*100+'%';image.style.left=-frame.x/frame.w*100+'%';image.style.top=-frame.y/frame.h*100+'%';outer.append(image);parent.append(outer);return outer;}
return{ids,character,layer};});
