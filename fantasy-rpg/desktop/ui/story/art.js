(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('../assets/combat/frames.json'),require('../characters/content.js'));
  }else root.StoryBattleArt=factory(root.StoryArtFrames,root.CharacterContent);
})(globalThis,(frames,Content)=>{
  const atlasPoses={ready:0,attack:5,hit:10,run:3,guard:7,dodge:8};
  const looks={ready:['ready','default'],attack:['attack','cast'],hit:['hit','fallen'],run:[],guard:['guard'],dodge:['dodge']};
  const records=Content?.records||[];
  for(const record of records){
    for(const [pose,index] of Object.entries(atlasPoses)){
      frames[pose]??={};
      const illustration=looks[pose].map(key=>record.looks[key]).find(Boolean);
      frames[pose][record.id]=illustration||(record.combatSprite
        ?Content.combatFrame(record.combatSprite,record.combatSprite.clips?.[pose==='ready'?'idle':pose==='run'?'move':pose]?.frames?.[pose==='attack'?2:0]??index)
        :record.looks[pose==='attack'?'help':'default']||record.looks.default);
    }
  }
  const rangedActors=new Set(records.filter(record=>['bow','magic'].includes(record.combatStyle)).map(record=>record.id));
  const ids=[...new Set([...Object.keys(frames.ready),...records.map(r=>r.id)])];

  function character(id,pose='ready'){
    return frames[pose]?.[id]||frames.ready[id]||null;
  }
  function layer(parent,id,side='ally',index=0,pose='ready'){
    const frame=character(id,pose);
    if(!frame)return;
    const outer=document.createElement('div'),image=document.createElement('img');
    outer.className='story-fighter '+side;
    outer.dataset.actor=id;
    outer.dataset.pose=pose;
    if(rangedActors.has(id))outer.dataset.ranged='true';
    if(frame.src.startsWith('battle/assets/'))outer.dataset.sd='true';
    outer.style.setProperty('--offset',index);
    outer.style.aspectRatio=frame.w+' / '+frame.h;
    outer.style.setProperty('--art-ratio',frame.w/frame.h);
    image.src=frame.src;
    image.alt='';
    image.style.width=frame.imageWidth/frame.w*100+'%';
    image.style.height=frame.imageHeight/frame.h*100+'%';
    image.style.left=-frame.x/frame.w*100+'%';
    image.style.top=-frame.y/frame.h*100+'%';
    outer.append(image);
    parent.append(outer);
    return outer;
  }

  // Use actual engine actors and targets, even when two enemies share the same art.
  function phases(resolution,actorIds){
    if(!resolution)return [];
    const participants=new Set(actorIds);
    const output=[];
    const events=(resolution.formulaEvents||[]).filter(e=>Number.isFinite(e.damage));
    const playerHit=events.some(e=>e.actor==='taei');
    const movement=['move','flee'].includes(resolution.intent)||resolution.moved||
      resolution.steps?.some(step=>step.verb==='approach'&&step.status==='success');
    const guard=resolution.intent==='defend'||['guard','barrier','one-hit-barrier'].includes(resolution.skillEffect);
    const initial={};
    if(participants.has('taei')){
      if(movement||resolution.skillEffect==='dash')initial.taei='run';
      else if(guard)initial.taei='guard';
      else if(resolution.visual&&!playerHit&&!resolution.skillEffect)initial.taei='attack';
      else if(!events.length&&resolution.outgoing>0)initial.taei='attack';
    }
    for(const reaction of resolution.npcReactions||[]){
      if(participants.has(reaction.actor)&&
        (reaction.response==='autonomous'&&reaction.action==='step-back'||
         reaction.response==='accept'&&reaction.action==='withdraw'))initial[reaction.actor]='run';
    }
    if(Object.keys(initial).length)output.push(initial);
    for(const event of events){
      const poses={};
      if(participants.has(event.actor))poses[event.actor]='attack';
      if(participants.has(event.target)&&event.target!==event.actor){
        poses[event.target]=event.damage>0?'hit':
          event.target==='taei'&&guard||event.verdict?.absorbed>0?'guard':'ready';
      }
      if(Object.keys(poses).length)output.push(poses);
    }
    if(!events.length&&participants.has('taei')&&resolution.incoming>0)output.push({taei:'hit'});
    return output;
  }
  return{ids,character,layer,phases};
});
