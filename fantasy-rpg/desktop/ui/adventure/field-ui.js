(function(r){
'use strict';
function crop(parent,frame,label,cls){if(!frame)return;const box=document.createElement('div'),img=document.createElement('img');box.className=cls;box.style.aspectRatio=frame.w+'/'+frame.h;img.src=frame.src;img.alt=label;img.style.cssText=`width:${frame.imageWidth/frame.w*100}%;height:${frame.imageHeight/frame.h*100}%;left:${-frame.x/frame.w*100}%;top:${-frame.y/frame.h*100}%`;box.append(img);parent.append(box);return box;}
function open(initial,questId,onAction,{onTravel=()=>{},onCombat=()=>{}}={}){
let state=initial,busy=false,revision=0;const dialog=document.createElement('dialog');dialog.className='hunt-field';dialog.setAttribute('aria-label','의뢰 현장');document.body.append(dialog);dialog.addEventListener('close',()=>{revision++;dialog.remove();},{once:true});
function draw(feedback=''){
 const v=HuntField.view(state,questId);dialog.replaceChildren();if(!v){dialog.close();return;}
 const n=(tag,text,parent=dialog)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;};
 const head=n('header','');n('small','FIELD JOURNAL · '+v.label,head);const close=n('button','이야기로 돌아가기',head);close.disabled=busy;close.onclick=()=>dialog.close();n('h2',v.q.title,head);
 const steps=n('ol','',head);steps.className='hunt-steps';v.steps.forEach(([label,done])=>{const li=n('li',(done?'✓ ':'')+label,steps);li.dataset.complete=String(done);});
 const stage=n('section','');stage.className='hunt-landscape';stage.style.backgroundPosition=(v.biome%2*100)+'% '+(Math.floor(v.biome/2)*100)+'%';
 const title=n('div','',stage);title.className='hunt-location';n('strong',v.place?.name||state.location,title);n('span','경과 '+state.minutes+'분 · 기한 '+v.remaining+'분',title);
 if(typeof StoryBattleArt!=='undefined'){
  const layers=n('div','',stage);layers.className='hunt-actors';for(const [i,id]of ['taei',...(state.party||[]).filter(id=>state.present?.includes(id))].slice(0,3).entries())StoryBattleArt.layer(layers,id,'ally',i,'ready');
  if(!v.battle&&v.at&&v.tracking?.phase==='sighted'){const sight=crop(layers,StoryMonsterFrames[v.q.species],'확인한 대상의 대표 원화','hunt-monster');if(sight){sight.style.right='16%';sight.dataset.behaviour=v.tracking.behaviour;}}
  if(v.battle&&v.at){for(const [i,enemy]of v.battle.enemies.entries()){const sprite=crop(layers,StoryMonsterFrames[enemy.kind],CombatRoster.get(enemy.kind)?.name||enemy.kind,'hunt-monster');if(sprite){sprite.style.right=(8+i*13)+'%';sprite.dataset.defeated=String(enemy.hp<=0);}}}
 }
 const caption=n('p',v.tracking&&v.at&&['trail','sighted'].includes(v.tracking.phase)?(v.tracking.phase==='sighted'?'확인한 움직임을 보고 접근하거나 거리를 벌릴 수 있습니다.':'흔적을 더 살필지, 바로 접근할지, 추적을 멈출지 결정하세요.'):v.stage==='contract'?'의뢰서의 목표와 보수, 기한을 확인하세요.':v.stage==='travel'?'현장에 도착해야 주변을 확인할 수 있습니다.':v.stage==='field'?'지형을 확인하거나 대상을 추적하세요. 전투는 기존 대화창에서 진행됩니다.':v.stage==='loot'?'싸움이 멎었다. 남아 있는 전리품을 직접 확인하고 회수하세요.':v.stage==='return'?'목표 증빙을 확보했습니다. 회수할 전리품과 남은 기한을 확인하고 귀환하세요.':v.stage==='settled'?'증빙 제출과 보수 지급이 장부에 기록되었습니다.':v.stage==='combat'?'대치 중입니다. 대화창에서 행동을 결정하세요.':'계약이 종료되었습니다. 이미 획득한 전리품은 별도로 유지됩니다.',stage);caption.className='hunt-caption';
 const lower=n('section','');lower.className='hunt-details';const stats=n('div','',lower);stats.className='hunt-stats';n('strong','HP '+state.player.hp+'/'+state.player.max,stats);const bar=n('div','',stats);bar.className='hunt-health';bar.style.setProperty('--hp',Math.max(0,Math.min(100,state.player.hp/state.player.max*100))+'%');n('i','',bar);n('span','MP '+state.player.mana+'/'+state.player.maxMana+' · 피로 '+(state.player.fatigue?.value??state.player.fatigue??0),stats);
 const report=n('div','',lower);n('h3',v.label,report);const msg=n('p',feedback,report);msg.setAttribute('role','status');
 if(v.tracking&&v.at){if(feedback!==v.tracking.lastEvent.text)n('p',v.tracking.lastEvent.text,report);n('small',(v.tracking.source==='ai'?'탱탱 ↔ ChatGPT':'탱탱 ·로컬 판단')+' · 관찰 '+v.tracking.observations+'/2 · 흔적 파악 '+v.tracking.confidence+'/100 · 상대 경계 '+v.tracking.attention+'/100',report);}
 n('p','토벌 '+Math.min(v.q.progress,v.q.target)+'/'+v.q.target+' · 목적지 '+(v.destination?.name||v.q.destination)+' · 접수소 '+(v.issuer?.name||v.q.issuerLocation),report);
 const notes=n('details','',report);n('summary','의뢰서와 현장 기록',notes);n('p',v.q.description||'',notes);if(v.q.fieldNote){n('p','현장 확인 · '+v.q.fieldNote.at+'분 · '+(v.q.fieldNote.terrain||'등록된 세부 지형 없음'),notes);n('small','출몰 보고를 대조한 기록입니다. 적의 정확한 위치·수·약점이 확인된 것은 아닙니다.',notes);}
 const controls=n('div','',report);controls.className='hunt-controls';
 function button(label,action,off=false){const b=n('button',label,controls);b.disabled=busy||off;b.onclick=async()=>{if(busy)return;busy=true;const token=++revision;for(const el of dialog.querySelectorAll('button'))el.disabled=true;msg.textContent='행동 결과 확인 중…';try{const next=await onAction(action);if(!next)throw Error('갱신된 게임 상태를 받지 못했습니다.');if(token!==revision||!dialog.isConnected)return;state=next;busy=false;if(state.combat?.status==='playing'){dialog.close();onCombat();return;}draw(['track','trackStep'].includes(action.type)?state.adventure.quests.find(q=>q.id===questId).tracking.lastEvent.text:action.type==='pickup'?'전리품을 회수했습니다. 실제 소지품과 분배 기록에 반영되었습니다.':action.type==='submit'?'증빙을 제출하고 보수·경험치를 정산했습니다.':action.type==='scout'?'5분 동안 주변 지형을 살피고 의뢰서의 보고를 대조했습니다.':'의뢰를 수락했습니다.');}catch(error){if(token!==revision)return;busy=false;draw(error.message);}};return b;}
 const locked=state.era!=='fantasy'||state.player.hp<=0||v.playing;
 if(v.stage==='contract')button('의뢰 수락',{type:'accept',questId},locked||state.location!==v.q.issuerLocation);
 if(v.at&&!v.playing&&!v.done&&!v.failed&&v.q.status==='accepted'){
  const t=v.tracking,stale=t&&state.minutes-t.at>HuntTracking.policy.signalLifetime;
  if(!t||['withdrawn','aftermath'].includes(t.phase)||stale)button(t?.phase==='aftermath'?'남은 목표 계속 추적 ·5분':stale?'오래된 흔적 다시 확인 ·5분':'새 추적 상황 확인 ·5분',{type:'track',questId},locked);
  else if(['trail','sighted'].includes(t.phase)){button('흔적 더 관찰 ·10분 / 활동 피로+1',{type:'trackStep',questId,decision:'observe'},locked||t.observations>=2);button('대상에게 접근 ·5분 / 활동 피로+2',{type:'trackStep',questId,decision:'approach'},locked);button('추적 멈추고 거리 확보 ·5분',{type:'trackStep',questId,decision:'withdraw'},locked);}
 }
 if(v.at&&!v.playing&&!v.finished&&v.q.status==='accepted'&&state.location!==v.q.issuerLocation){const back=n('button','사냥 중단·귀환할 말 작성',controls);back.disabled=busy||locked;back.onclick=()=>{dialog.close();onTravel(Adventure.travelText(v.q.issuerLocation));};}

 for(const loot of v.loot){const rare=loot.essence&&state.minutes<loot.createdAt+30?' ·정수 '+(loot.createdAt+30-state.minutes)+'분 남음':loot.soulStone?' ·영혼석':'';button(loot.name+' 재료'+(loot.stone?' ·마석':'')+rare+' 회수',{type:'pickup',lootId:loot.id},locked);}
 if(v.done&&!v.finished&&!v.failed&&state.location===v.q.issuerLocation)button('접수소에 증빙 제출·정산',{type:'submit',questId},locked);
 if(!v.playing&&!v.finished&&!v.failed&&v.q.status==='accepted'&&((!v.at&&!v.done)||(v.done&&state.location!==v.q.issuerLocation))){const target=v.done?v.q.issuerLocation:v.q.destination;const b=n('button',v.done?'귀환할 말 작성':'현장으로 이동할 말 작성',controls);b.disabled=busy||locked;b.onclick=()=>{dialog.close();onTravel(Adventure.travelText(target));};}
 if(v.playing){const b=n('button','대화 전투 이어가기',controls);b.onclick=()=>{dialog.close();onCombat();};}
 if(v.finished)n('p','지급 기록 · '+GameEconomy.format(v.q.receipt.reward)+' / '+v.q.receipt.xp+'XP'+(v.q.sharedMoneyPool?' ·파티 공동 보수는 분배 대기':''),report);
 if(v.loot.length)n('small','전리품을 남기고 귀환할 수도 있습니다. 정수의 소멸 시간은 계속 흐릅니다.',report);
}
draw();dialog.showModal();return dialog;
}
r.HuntFieldUI={open};
})(globalThis);
