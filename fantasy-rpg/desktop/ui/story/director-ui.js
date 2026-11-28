'use strict';
const DirectorUI=(()=>{
let streetBoardLocation=null,journeyDestination=null,preparationReturn=false;
let companionTarget=null;
let state=null,working=false,pending=null,enabled=true,panelIndex=0,poseOverride=null,replayTimers=[];
const $=id=>document.getElementById(id),names=Object.fromEntries(StoryKitData.catalog.map(c=>[c.id,c.name]));
async function call(method,arg){if(!window.desktopAI?.[method])throw Error('AI 이야기는 데스크톱 앱의 ChatGPT 연결을 사용합니다.');const r=await window.desktopAI[method](arg);if(!r.ok)throw Error(r.error);return r.data;}
function monsterLayer(parent,id,index,actorId='enemy-'+index){const f=StoryMonsterFrames[id];if(!f)return;const frame=document.createElement('div'),im=document.createElement('img');frame.className='story-monster';frame.dataset.monster=id;frame.dataset.actor=actorId;frame.dataset.pose=poseFor(actorId);frame.style.setProperty('--offset',index);frame.style.aspectRatio=f.w+' / '+f.h;im.src=f.src;im.alt=CombatRoster.get(id).name;im.style.width=f.imageWidth/f.w*100+'%';im.style.height=f.imageHeight/f.h*100+'%';im.style.left=-f.x/f.w*100+'%';im.style.top=-f.y/f.h*100+'%';frame.append(im);const enemy=state?.combat?.enemies.find(e=>'enemy-'+e.id===actorId);if(enemy){const label=document.createElement('span'),meter=document.createElement('meter');label.className='story-health-label';label.textContent=CombatRoster.get(id).name+' '+enemy.hp+'/'+enemy.max;meter.min=0;meter.max=enemy.max;meter.value=enemy.hp;meter.setAttribute('aria-label',CombatRoster.get(id).name+' HP');label.append(meter);frame.append(label);}parent.append(frame);}
function poseFor(id){return poseOverride?.[id]||'ready';}
function streetEntry(){if(PassageHost.onboard(state))return null;
 const profile=DistrictModel.storyStreet(state,GameGeography.records,WorldFacilities.records,StoryKitData);
 if(!profile||!window.desktopAI?.directorStreetReturn)return null;
 return ()=>DistrictUI.open({...profile,
  position:state.streetVisits?.[profile.location]?.position,
  async onReturn({position,target}){
   state=await call('directorStreetReturn',{revision:state.revision,position,targetId:target?.id??null});
   panelIndex=0;
  },
  onClosed(target){
   render();
   if(target&&profile.npcs.includes(target))send(target.name+'에게 인사하고 말을 건다.');
   else if(target&&profile.objects.some(f=>f.id===target.id))arrivalFacility(target);
  },
 });
}
function sceneActor(panel){
 const id=names[panel.speaker]&&panel.speaker!=='taei'?panel.speaker:state.focus;
 return id&&id!=='taei'&&CharacterOrigins.allowed(id,state)?id:null;
}
function openDirectWalk(){
 if(working)return;
 const street=streetEntry();
 if(street){street();return;}
 const art=ArrivalModel.art(state),id=sceneActor(state.panels[panelIndex]||{});
 WalkUI.open({
  era:state.era,background:art?.src||SceneStage.backgrounds[state.location]||SceneStage.backgrounds.arrival_meadow,
  crop:art?.crop,npc:id&&names[id]?{id,name:names[id]}:null,
  label:art?.label||$('scene-place').textContent,onTalk:()=>$('chat-input').focus(),
 });
}
function render(){if(!state||!enabled)return;StoryIllustrations.clear();let companionHud=$('companion-hud');if(!companionHud){companionHud=document.createElement('button');companionHud.id='companion-hud';companionHud.onclick=()=>openPanel('companions');$('dialogue-content').prepend(companionHud);}companionHud.textContent='동료와 이야기';companionHud.hidden=state.era!=='fantasy'||!CompanionTalk.actors(state).length;companionHud.disabled=working||state.combat?.status==='playing';let target=$('companion-chat-target');if(!target){target=document.createElement('button');target.id='companion-chat-target';target.className='companion-chat-target';target.onclick=()=>{companionTarget=null;pending=null;render();};$('dialogue-content').append(target);}target.hidden=!companionTarget;target.textContent=companionTarget?(CompanionTalk.actors(state).find(a=>a.id===companionTarget.actorId)?.name||'동료')+'에게 · '+CompanionTalk.topics[companionTarget.topic]+' (눌러 해제)':'';let prepHud=$('preparation-hud');if(!prepHud){prepHud=document.createElement('button');prepHud.id='preparation-hud';prepHud.onclick=()=>openPanel('preparation');$('dialogue-content').prepend(prepHud);}prepHud.hidden=state.era!=='fantasy'||!Preparation.quests(state).length;prepHud.textContent='의뢰 출발 준비';prepHud.disabled=working;let arrivalHud=$('arrival-hud');if(!arrivalHud){arrivalHud=document.createElement('button');arrivalHud.id='arrival-hud';arrivalHud.onclick=()=>openPanel('arrival');$('dialogue-content').prepend(arrivalHud);}const local=ArrivalModel.view(state);arrivalHud.hidden=!local;arrivalHud.textContent=local?(local.pending?'도착 · ':'주변 안내 · ')+local.name:'';arrivalHud.disabled=working||!!local?.busy;$('chat-form').hidden=false;let escortHud=$('escort-hud');if(!escortHud){escortHud=document.createElement('button');escortHud.id='escort-hud';escortHud.onclick=()=>openPanel(escortHud.dataset.kind||'escort');$('dialogue-content').prepend(escortHud);}CaravanEscortUI.hud(escortHud,state);escortHud.dataset.kind='escort';if(escortHud.hidden){PersonalEscortUI.hud(escortHud,state);escortHud.dataset.kind='personalEscort';}if(escortHud.hidden){DungeonQuestUI.hud(escortHud,state);escortHud.dataset.kind='dungeon';}if(escortHud.hidden){RescueQuestUI.hud(escortHud,state);escortHud.dataset.kind='rescue';}if(escortHud.hidden){MiningQuestUI.hud(escortHud,state);escortHud.dataset.kind='mining';}let passageHud=$('passage-hud');if(!passageHud){passageHud=document.createElement('button');passageHud.id='passage-hud';passageHud.onclick=()=>openPanel('passage');$('dialogue-content').prepend(passageHud);}passageHud.hidden=state.era!=='fantasy';const activePassage=PassageEngine.active(state.passages);passageHud.textContent=activePassage?({reserved:'예약',onboard:'탑승 중',incident:'운항 안내'})[activePassage.phase]+' · '+activePassage.name:'운항편·탑승';let journeyHud=$('journey-hud');if(!journeyHud){journeyHud=document.createElement('button');journeyHud.id='journey-hud';journeyHud.onclick=()=>openPanel('journey');$('dialogue-content').prepend(journeyHud);}journeyHud.hidden=state.era!=='fantasy';journeyHud.textContent=state.journeys?.trip&&!['arrived','stopped'].includes(state.journeys.trip.phase)?'여정 · '+state.journeys.trip.index+'/'+state.journeys.trip.legs.length+'구간':'여정·야영';let huntHud=$('hunt-field-hud');if(!huntHud){huntHud=document.createElement('button');huntHud.id='hunt-field-hud';huntHud.className='hunt-hud';$('dialogue-content').prepend(huntHud);}const hunt=(state.adventure?.quests||[]).find(q=>q.type==='hunt'&&q.status==='accepted'&&(q.destination===state.location||q.issuerLocation===state.location))||(state.adventure?.quests||[]).find(q=>q.type==='hunt'&&q.status==='accepted');huntHud.hidden=!hunt||state.era!=='fantasy';if(hunt){const field=HuntField.view(state,hunt.id);huntHud.textContent=field.label+' · '+hunt.title+' · '+Math.min(hunt.progress,hunt.target)+'/'+hunt.target;huntHud.onclick=()=>HuntFieldUI.open(state,hunt.id,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;render();return state;}finally{working=false;render();}},{onTravel:planTravel,onCombat:()=>{closePanel();render();},onRewards:()=>openPanel('rewards'),onPassage:()=>openPanel('passage')});}let fatigueLabel=$('fatigue-status');if(!fatigueLabel){fatigueLabel=document.createElement('button');fatigueLabel.id='fatigue-status';fatigueLabel.className='outline';fatigueLabel.onclick=()=>openPanel('services');$('menu-system').append(fatigueLabel);}const f=StatRules.fatigue(state.player);fatigueLabel.textContent='피로 '+f.value.toFixed(1)+'/100 · '+f.name;let roleStrip=$('party-role-strip');if(!roleStrip){roleStrip=document.createElement('div');roleStrip.id='party-role-strip';roleStrip.setAttribute('aria-label','현재 파티 역할');$('dialogue-content').prepend(roleStrip);}RoleUI.strip(roleStrip,{...Object.fromEntries(StoryKitData.content.records.filter(r=>r.roles?.length).map(r=>[r.id,r.roles])),...(state.roleAssignments||{})},['taei',...(state.party||[]).filter(id=>state.present.includes(id))].map(id=>({id,name:names[id]||id})),{nameAbove:true});const p=state.panels[Math.min(panelIndex,state.panels.length-1)],combat=state.scene==='combat'&&state.combat;roleStrip.hidden=!state.combat||state.combat.mode!=='chat'||(state.combat.status!=='playing'&&state.scene!=='combat')||!roleStrip.children.length;document.body.dataset.storyMode='director';$('speaker').textContent=p.speaker==='narrator'?'상황':StoryKitData.content.displayName(state,p.speaker)||names[p.speaker]||state.locals?.find(n=>n.id===p.speaker)?.name||p.speaker;$('emotion').textContent=combat?'전투':'현재';if($('line').textContent!==p.text){$('line').textContent=p.text;$('dialogue-content').scrollTop=0;}let outcome=$('action-outcome');if(!outcome){outcome=document.createElement('p');outcome.id='action-outcome';outcome.setAttribute('role','status');$('line').after(outcome);}const actionResult=state.turns.at(-1)?.resolution;const npcResult=actionResult?.npcReactions?.find(r=>r.response!=='autonomous');outcome.hidden=!actionResult?.steps?.length&&!npcResult;const npcName=npcResult?(names[npcResult.actor]||state.locals?.find(n=>n.id===npcResult.actor)?.name||'주변 인물'):'';const last=npcName.charCodeAt(npcName.length-1);const particle=last>=0xac00&&last<=0xd7a3&&(last-0xac00)%28?'은':'는';const responseText=npcResult?npcName+particle+({accept:npcResult.request==='withdraw'?' 뒤로 물러섰다.':npcResult.request==='hold'?' 자리를 지키기로 했다.':' 가능한 범위에서 돕기로 했다.',refuse:' 부탁을 거절했다.',hesitate:' 바로 움직이지 못했다.',unavailable:' 지금 반응할 수 없다.'}[npcResult.response]||''):'';outcome.textContent=[actionResult?.steps?.[0]?.reason,responseText].filter(Boolean).join(' ');$('choices').replaceChildren();const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;$('choices').append(b);return b;};if(panelIndex<state.panels.length-1)button('이야기 계속 →',()=>{panelIndex++;render();});else{renderCompanionActions(button);renderObservationChoices(button);const enterStreet=streetEntry();if(enterStreet)button('마을 거리 들어가기',enterStreet);if(combat?.mode==='chat'&&combat.status==='playing')for(const sk of (state.skillBook?.skills||[]).filter(s=>s.ownerId==='taei'))button(sk.name+' 사용',()=>send(sk.name+' 사용'));if(combat?.mode==='realtime'&&combat.status==='playing')button('중요 전투 시작',launch);else button('주변의 반응을 기다린다',()=>send('잠시 기다리며 주변의 반응을 본다.'));if(combat?.mode==='chat'&&state.turns.at(-1)?.resolution&&JSON.stringify(state.panels)===JSON.stringify(state.turns.at(-1)?.panels))button('공방 다시 보기',playResolution);if(state.actionWorld?.suggestions?.length)button('행동 단서 보기',()=>{for(const old of $('choices').querySelectorAll('[data-action-hint]'))old.remove();for(const hint of state.actionWorld.suggestions){const b=button(hint.text,()=>{$('chat-input').value=hint.text;$('chat-input').focus();});b.dataset.actionHint='true';b.disabled=working;}});}
 const layer=$('story-battle-layers');layer.replaceChildren();layer.hidden=!combat;const portrait=$('scene-portrait'),player=$('scene-player'),background=$('scene-art');if(!combat){SceneStage.render({background,portrait,player,location:state.location,era:state.era,state,dialogue:true,characterId:sceneActor(p)});}else{portrait.hidden=true;player.hidden=true;background.style.backgroundImage=state.era==='earth'?'url("assets/bg-subway.png")':'url("assets/combat/locations.png")';background.style.backgroundSize=state.era==='earth'?'cover':'200% 200%';const place=GameGeography.records.find(x=>x.id===state.location);const label=(place?.note||'')+(place?.location||'');const biome=/동굴|지하|광산/.test(label)?2:/유적|폐허/.test(label)?1:(place?.kind==='city'||place?.kind==='village'||/도시|마을|성문/.test(label))?3:0;background.style.backgroundPosition=(biome%2*100)+'% '+(Math.floor(biome/2)*100)+'%';const art=state.era==='fantasy'?ArrivalModel.art(state):null;if(art){background.style.backgroundImage='url("'+art.src+'")';background.style.backgroundSize=art.size;background.style.backgroundPosition=art.position;}for(const [i,id]of ['taei',...(state.party||[]).filter(id=>state.present.includes(id))].slice(0,4).entries())StoryBattleArt.layer(layer,id,'ally',i,poseFor(id));for(const [i,m]of combat.enemies.entries()){const id='enemy-'+m.id;if(m.hp>0||['hit','guard'].includes(poseFor(id)))monsterLayer(layer,m.kind,i,id);}}
 if(state.era==='fantasy'&&!combat){
  const visible=(state.monsterAppearances||[]).filter(item=>item.panel===panelIndex&&p.speaker==='narrator'&&p.text.includes(item.evidence)&&Object.hasOwn(StoryMonsterFrames,item.id));
  if(visible.length){
   portrait.hidden=true;player.hidden=true;layer.hidden=false;layer.dataset.presentation='sighting';
   visible.forEach(({id},index)=>monsterLayer(layer,id,index,'sighting-'+id));
  }else delete layer.dataset.presentation;
 }else delete layer.dataset.presentation;
 if(state.era==='fantasy'&&!combat&&!PassageHost.onboard(state)){const art=ArrivalModel.art(state);if(art){background.style.backgroundImage='url("'+art.src+'")';background.style.backgroundSize=art.size;background.style.backgroundPosition=art.position;}else if(GameGeography.records.find(p=>p.id===state.location)?.kind==='village'){background.style.backgroundImage='linear-gradient(145deg,#1e3027,#3a4433,#192820)';background.style.backgroundSize='cover';}else if(state.location!=='arrival_meadow'){background.style.backgroundImage='url("assets/combat/locations.png")';background.style.backgroundSize='200% 200%';background.style.backgroundPosition='0% 0%';}}
 if(!combat)StoryIllustrations.attach({state,actorId:sceneActor(p),host:$('dialogue-content'),stage:background.parentElement,portrait,player,disabled:working});
 renderTurnContext();$('elapsed').textContent=(state.minutes||0)+'분';$('scene-era').textContent=state.era==='fantasy'?'이세계':'현실';$('episode-no').textContent='LIVE · '+String(state.revision).padStart(2,'0');$('scene-title').textContent=combat?(combat.mode==='realtime'?'중요한 대치':'엇갈리는 공방'):'이어지는 이야기';$('scene-place').textContent=state.era==='earth'?({subway:'현실 · 지하철',platform:'현실 · 승강장',station:'현실 · 역 대합실'})[state.location]:GameGeography.records.find(x=>x.id===state.location)?.name||(state.location==='arrival_meadow'?'이세계 · 낯선 풀밭':state.location);if(PassageHost.onboard(state)){const ride=PassageHost.onboard(state);$('scene-title').textContent=ride.phase==='incident'?'운항 조정 안내':'운항 중';$('scene-place').textContent=ride.name+' · '+ride.progress+'/'+ride.duration+'분';background.style.backgroundImage=ride.mode==='ship'?'linear-gradient(150deg,#122c39,#264d56,#182c32)':ride.mode==='airship'?'linear-gradient(150deg,#202a41,#414767,#243743)':'linear-gradient(150deg,#30271e,#4d4937,#202d26)';background.style.backgroundSize='cover';}$('save-state').textContent=working?'상황과 기억을 확인하는 중…':'이야기 자동 저장 · '+state.revision+'번째 대화';$('chat-input').disabled=working||combat?.mode==='realtime'&&combat.status==='playing';$('chat-input').maxLength=1000;document.querySelector('#chat-form button[type=submit]').disabled=working;showChatMode();renderRecommendations();showRestorePreview();showRestoredDraft();$('sd').hidden=true;$('scene-minimap').hidden=true;const footer=document.querySelector('main>footer');footer.querySelector('.footer-trait').textContent=combat?'HP '+state.player.hp+'/'+state.player.max:'실시간 생성 이야기';footer.children[2].textContent=$('scene-place').textContent;}
function skillFx(){const r=state?.turns.at(-1)?.resolution,parent=$('story-battle-layers')?.hidden?$('scene-art'):$('story-battle-layers');if(!r?.visual||!parent)return;const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';canvas.width=Math.max(1,parent.clientWidth);canvas.height=Math.max(1,parent.clientHeight);parent.append(canvas);const ctx=canvas.getContext('2d'),start=performance.now(),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;function frame(now){if(!canvas.isConnected)return;const age=(now-start)/1000;ctx.clearRect(0,0,canvas.width,canvas.height);SkillEffects.draw(ctx,{x:canvas.width*.63,y:canvas.height*.52,face:{x:1,y:0},visual:r.visual},p=>p,42,age,reduced);if(age<.55)requestAnimationFrame(frame);else canvas.remove();}requestAnimationFrame(frame);}
function stopReplay(){
  for(const timer of replayTimers)clearTimeout(timer);
  replayTimers=[];
  poseOverride=null;
}
function playResolution(){
  stopReplay();
  const resolution=state.turns.at(-1)?.resolution;
  if(!resolution||state.scene!=='combat'||state.combat?.mode!=='chat')return;
  const snapshot=state;
  const ids=['taei',...(state.party||[]).filter(id=>state.present.includes(id)),...state.combat.enemies.map(e=>'enemy-'+e.id)];
  const phases=StoryBattleArt.phases(resolution,ids);
  let showedSkill=false;
  const impacts=(resolution.formulaEvents||[]).filter(e=>Number.isFinite(e.damage));let impactIndex=0;
  const show=(i)=>{
    if(state!==snapshot){stopReplay();return;}
    poseOverride=phases[i]||null;
    render();
    const event=impacts[impactIndex];if(event&&poseOverride?.[event.actor]==='attack'&&['hit','guard','ready'].includes(poseOverride?.[event.target])){impactIndex++;const actor=[...$('story-battle-layers').querySelectorAll('[data-actor]')].find(e=>e.dataset.actor===event.target);if(actor){const text=document.createElement('span');text.className='battle-confirmed-hit';text.textContent=event.damage>0?'−'+event.damage:event.verdict?.absorbed>0?'차단':'피해 없음';actor.append(text);}}

    if(!showedSkill&&(poseOverride?.taei||!phases.length)){
      skillFx();
      showedSkill=true;
    }
    if(i<phases.length)replayTimers.push(setTimeout(()=>show(i+1),410));
  };
  show(0);
}
let chatMode='story';
const chatModes=[
 ['story','상황 진행','게임 속 대화나 행동 · /도움말'],
 ['direct','ChatGPT에게 직접','ChatGPT에게 직접 질문 · /도움말'],
 ['command','명령어','명령어 입력 (예: 정리)'],
];
const chatCommands=['도움말','정리','질문','되돌리기','확인','취소'];
function showChatMode(){
 let modes=$('story-chat-mode');
 if(!modes){
  modes=document.createElement('div');
  modes.id='story-chat-mode';
  modes.setAttribute('role','group');
  modes.setAttribute('aria-label','채팅 종류');
  for(const [mode,label] of chatModes){
   const button=document.createElement('button');
   button.type='button';
   button.textContent=label;
   button.dataset.mode=mode;
   button.onclick=()=>{chatMode=mode;showChatMode();renderRecommendations();$('chat-input').focus();};
   modes.append(button);
  }
  $('chat-form').prepend(modes);
 }
 let shortcuts=$('story-command-shortcuts');
 if(!shortcuts){
  shortcuts=document.createElement('div');
  shortcuts.id='story-command-shortcuts';
  shortcuts.setAttribute('role','group');
  shortcuts.setAttribute('aria-label','명령어 바로 입력');
  for(const command of chatCommands){
   const button=document.createElement('button');
   button.type='button';
   button.textContent='/'+command;
   button.onclick=()=>{
    $('chat-input').value=button.textContent+(command==='질문'?' ':'');
    $('chat-input').focus();
   };
   shortcuts.append(button);
  }
  $('dialogue-content').append(shortcuts);
 }
 for(const button of modes.children){
  button.setAttribute('aria-pressed',String(button.dataset.mode===chatMode));
  button.disabled=working;
 }
 shortcuts.hidden=chatMode!=='command';
 for(const button of shortcuts.children)button.disabled=working;
 $('chat-input').placeholder=chatModes.find(([mode])=>mode===chatMode)[2];
}
let restoredDraft=null;
function showRestoredDraft(){
 let button=$('story-restore-edit');
 if(!restoredDraft||restoredDraft.revision!==state.revision){
  if(button)button.hidden=true;
  return;
 }
 if(!button){
  button=document.createElement('button');
  button.id='story-restore-edit';
  button.type='button';
  button.textContent='이전 입력 수정하기';
  button.onclick=()=>{
   if(working||restoredDraft?.revision!==state.revision)return;
   chatMode='story';
   companionTarget=null;
   pending=null;
   $('chat-input').value=restoredDraft.text;
   restoredDraft=null;
   render();
   $('chat-input').focus();
   $('chat-input').setSelectionRange(0,$('chat-input').value.length);
  };
  $('story-command-result').after(button);
 }
 button.hidden=false;
 button.disabled=working;
}
let restorePreview=null;
function showRestorePreview(){
 let box=$('story-restore-preview');
 const preview=restorePreview?.revision===state.revision?restorePreview:null;
 if(!preview){
  if(box)box.hidden=true;
  return;
 }
 if(!box){
  box=document.createElement('section');
  box.id='story-restore-preview';
  box.setAttribute('aria-label','직전 저장 복구 미리보기');
  $('story-command-result').after(box);
 }
 box.hidden=false;
 box.replaceChildren();
 const add=(tag,text)=>{
  const element=document.createElement(tag);
  element.textContent=text;
  box.append(element);
  return element;
 };
 const {current,target}=preview;
 add('h3',preview.selectedTurn?'선택한 행동 직전으로 돌아가기':'직전 저장으로 돌아가기');
 if(preview.selectedAction)add('p','선택한 행동 · '+preview.selectedAction);
 const removed=[];
 if(preview.removedTurnCount)removed.push('채팅 '+preview.removedTurnCount+'턴');
 if(preview.removedActionCount)removed.push('그 외 행동 '+preview.removedActionCount+'개');
 if(removed.length)add('p','되돌아갈 기록 · '+removed.join(' · '));
 add('p','장소 '+(current.location===target.location?target.location:current.location+' → '+target.location));
 add('p','경과 시간 '+current.minutes+'분 → '+target.minutes+'분');
 if(current.round!==null||target.round!==null)
  add('p','전투 '+(current.round===null?'없음':current.round+'라운드')+' → '+(target.round===null?'없음':target.round+'라운드'));
 if(preview.lastAction)add('p','되돌아갈 마지막 행동 · '+preview.lastAction);
 if(preview.removedObservationCount){
  add('p','복구하면 관찰 기록 '+preview.removedObservationCount+'개가 현재 진행에서 되돌아가요.');
  const list=add('ul','');
  for(const clue of preview.removedObservations){
   const item=document.createElement('li');
   item.textContent=clue;
   list.append(item);
  }
 }
 for(const [label,command] of [['복구 확인','/확인'],['취소','/취소']]){
  const button=add('button',label);
  button.type='button';
  button.disabled=working;
  button.onclick=()=>sendCommand(command);
 }
}
async function sendCommand(text){
 if(working)return;
 stopReplay();
 working=true;
 render();
 let result=$('story-command-result');
 if(!result){
  result=document.createElement('p');
  result.id='story-command-result';
  result.setAttribute('role','status');
  $('dialogue-content').append(result);
 }
 try{
  const reply=await call('directorCommand',{text,revision:state.revision});
  if(reply.state){
   activate(reply.state);
   if(reply.draft)restoredDraft={revision:reply.state.revision,text:reply.draft};
  }
  restorePreview=reply.preview||null;
  result.textContent=reply.preview?'':reply.text;
  $('chat-input').value='';
 }catch(e){restorePreview=null;result.textContent=e.message;}
 finally{
  working=false;render();
  (restorePreview?$('story-restore-preview'):result).scrollIntoView({block:'nearest'});
  $('chat-input').focus({preventScroll:true});
 }
}
async function send(text){
  if(working||!text?.trim())return;
  if(text.trimStart().startsWith('/'))return sendCommand(text.trim());
  if($('story-command-result'))$('story-command-result').textContent='';
  if(companionTarget?.kind==='observe'){
    const {reason}=CompanionTalk.capability(state,companionTarget);
    if(reason){toast(reason);return;}
  }
  stopReplay();
  working=true;
  let received=false;
  if(!pending||pending.text!==text||pending.revision!==state.revision||JSON.stringify(pending.companion||null)!==JSON.stringify(companionTarget))pending={text,requestId:crypto.randomUUID(),revision:state.revision,...(companionTarget?{companion:companionTarget}:{})};
  render();
  try{
    state=await call('directorSend',pending);
    pending=null;companionTarget=null;
    panelIndex=0;
    $('chat-input').value='';
    received=true;
  }catch(e){$('save-state').textContent=e.message;toast(e.message);}
  finally{
    working=false;
    render();
    if(received&&state.scene==='combat')playResolution();
    else if(received)skillFx();
  }
}
async function launch(){if(working)return;working=true;try{await call('directorLaunch',{revision:state.revision});}catch(e){toast(e.message);}finally{working=false;}}
function activate(next){
 companionTarget=null;pending=null;restorePreview=null;restoredDraft=null;state=next;panelIndex=0;
 $('walk-launch').onclick=openDirectWalk;
 $('chat-form').onsubmit=e=>{
  e.preventDefault();
  const text=$('chat-input').value.trim();
    if(!text)return;
  if(text.startsWith('/')||chatMode==='story')send(text);
  else send((chatMode==='direct'?'/질문 ':'/')+text);
 };
 render();
}
async function enterMeadow(prologue){
 if(working)return;
 working=true;
 $('save-state').textContent='탱탱과 ChatGPT가 첫 상황을 만드는 중…';
 try{const next=await call('directorEnterMeadow',{prologue});activate(next);}
 finally{working=false;if(document.body.dataset.storyMode==='director')render();}
}
async function init(){
 const layer=document.createElement('div');layer.id='story-battle-layers';layer.hidden=true;$('scene-art').after(layer);
 if(!window.desktopAI?.directorState)return;
 try{
  const next=await call('directorState');
  if(next.revision>0||next.era==='fantasy')activate(next);
 }catch(e){$('save-state').textContent=e.message;}
}
function roleEditor(body){const gallery=document.createElement('button');gallery.textContent='역할 아이콘·배치 검증실';gallery.onclick=()=>location.href='roles/lab.html';body.append(gallery);const box=document.createElement('div');body.append(box);RoleUI.editor(box,state.roleAssignments||{},['taei',...(state.party||[])].map(id=>({id,name:names[id]||id})),async(actorId,roles)=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorRoles',{requestId:crypto.randomUUID(),revision:state.revision,actorId,roles});}finally{working=false;}render();body.replaceChildren();roleEditor(body);},{disabled:working||state.combat?.status==='playing'});}
let transportPanelSerial=0;
async function transportPanel(body){const token=++transportPanelSerial;body.textContent='현장 구조 정보를 확인하는 중…';try{const view=await call('directorTransportView');if(token!==transportPanelSerial||$('panel').dataset.mode!=='transport')return;body.replaceChildren();TransportUI.render(body,state,view,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorTransport',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();await transportPanel(body);},{disabled:working});}catch(e){if(token===transportPanelSerial)body.textContent=e.message;}}
let npcPartyPanelSerial=0;
async function npcPartiesPanel(body){const token=++npcPartyPanelSerial;body.textContent='공략 파티 정보를 확인하는 중…';try{const view=await call('directorNPCPartyView');if(token!==npcPartyPanelSerial||$('panel').dataset.mode!=='npcParties')return;body.replaceChildren();NPCExpeditionUI.render(body,state,view,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorNPCParty',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();await npcPartiesPanel(body);},{disabled:working,onDungeon:()=>openPanel('dungeon')});}catch(e){if(token===npcPartyPanelSerial)body.textContent=e.message;}}
function dungeonPanel(body){DungeonQuestUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call(action.type==='submit'?'directorAdventure':'directorDungeon',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();dungeonPanel(body);},{disabled:working,onTransport:()=>openPanel('transport'),onParties:()=>openPanel('npcParties'),onBoard:()=>openPanel('adventure')});}
function rescuePanel(body){RescueQuestUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call(action.type==='submit'?'directorAdventure':'directorRescue',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();rescuePanel(body);},{disabled:working,onTransport:()=>openPanel('transport'),onBoard:()=>openPanel('adventure')});}
function miningPanel(body){MiningQuestUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call(action.type==='submit'?'directorAdventure':'directorMining',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();miningPanel(body);},{disabled:working,onBoard:()=>openPanel('adventure')});}
function personalEscortPanel(body){PersonalEscortUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call(action.type==='submit'?'directorAdventure':'directorPersonalEscort',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();personalEscortPanel(body);},{disabled:working,onBoard:()=>openPanel('adventure')});}
function escortPanel(body){CaravanEscortUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call(action.type==='submit'?'directorAdventure':'directorEscort',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();escortPanel(body);},{disabled:working,onBoard:()=>openPanel('adventure')});}
function rewardPanel(body){PartyRewardsUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorParty',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();rewardPanel(body);},{disabled:working});}
function servicePanel(body){preparationBack(body);RestServicesUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorService',{requestId:crypto.randomUUID(),revision:state.revision,action});}finally{working=false;}render();body.replaceChildren();servicePanel(body);},{disabled:working});}
function tradePanel(body){preparationBack(body);CommerceUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorTrade',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=Math.min(panelIndex,state.panels.length-1);}finally{working=false;}render();body.replaceChildren();tradePanel(body);},{disabled:working});}
function planTravel(text){const target=GameGeography.records.find(p=>Adventure.travelText(p.id)===text);if(target){journeyDestination=target.id;openPanel('journey');}else{closePanel();$('chat-input').value=text;$('chat-input').focus();}}
function renderCompanionActions(button){
 const actors=CompanionTalk.actors(state);
 for(const agreement of state.companions?.agreements||[]){
  if(!CompanionTalk.isExecutableAgreement(state,agreement))continue;
  const actor=actors.find(a=>a.id===agreement.actorId);
  const action=button(actor.name+'의 관찰 실행 · '+HuntTracking.policy.observeMinutes+'분',async()=>{
   try{await executeCompanionObservation(agreement.id);}catch(e){toast(e.message);}
  });
  action.disabled=working;
 }
}
function reviewChanges(row){
 const labels={minutes:'시간',hp:'HP',mana:'MP',fatigue:'피로',location:'장소',combat:'전투'};
 const statuses={playing:'진행 중',won:'승리',lost:'패배',escaped:'이탈',withdrawn:'철수'};
 const format=(key,value)=>key==='location'?(GameGeography.records.find(p=>p.id===value)?.name||value):
  key==='combat'?(statuses[value]||'종료 또는 미개시'):Number.isInteger(value)?String(value):value.toFixed(1);
 return Object.entries(row.changes||{}).map(([key,{before,after}])=>labels[key]+' '+format(key,before)+' → '+format(key,after));
}
let recommendationState=null,recommendationChoices=null;
async function runRecommendedAction(action){
 if(working)return;
 working=true;render();
 try{
  state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action});
  panelIndex=0;
 }catch(e){toast(e.message);}
 finally{working=false;render();}
}
function renderRecommendations(){
 let list=$('story-recommendations');
 if(!list){
  list=document.createElement('div');
  list.id='story-recommendations';
  list.setAttribute('role','group');
  list.setAttribute('aria-label','추천 행동');
  $('dialogue-content').append(list);
 }
 list.replaceChildren();
 const combat=state.combat?.status==='playing';
 list.hidden=panelIndex<state.panels.length-1||Boolean(companionTarget)||chatMode!=='story'||combat&&state.combat.mode==='realtime';
 if(list.hidden)return;
 if(window.desktopAI?.directorRecommendations&&recommendationState!==state){
  const snapshot=state;
  recommendationState=snapshot;
  recommendationChoices=null;
  call('directorRecommendations').then(result=>{
   if(state!==snapshot||result.revision!==snapshot.revision)return;
   recommendationChoices=result.choices;
   renderRecommendations();
  }).catch(()=>{
   if(state!==snapshot)return;
   recommendationChoices=undefined;
   renderRecommendations();
  });
 }
 const fallback=['주변 단서를 살핀다.','곁에 있는 인물에게 말을 건다.','잠시 기다리며 주변 반응을 본다.'];
 const choices=recommendationChoices||[...new Set([...(state.choices||[]),...fallback])]
  .slice(0,3).map(input=>({label:input,input}));
 function addButton(choice,parent){
  const button=document.createElement('button');
  button.type='button';
  button.textContent=choice.label;
  button.disabled=working;
  if(Number.isFinite(choice.minutes)||choice.condition){
   const info=document.createElement('small');
   info.textContent=[Number.isFinite(choice.minutes)?choice.minutes+'분':null,choice.condition].filter(Boolean).join(' · ');
   button.append(info);
  }
  button.onclick=()=>choice.action?runRecommendedAction(choice.action):send(choice.input);
  parent.append(button);
 }
 const encounter=state.freeEncounter;
 if(state.era==='fantasy'&&encounter&&state.minutes<encounter.expiresAt&&state.combat?.status!=='playing'){
  if(encounter.location===state.location&&state.player.hp>0){
   if(globalThis.MonsterCatalog?.researchMonsters.some(monster=>monster.id===encounter.species&&monster.research))
    addButton({label:'안전한 거리에서 더 관찰한다',input:'안전한 거리에서 더 관찰한다',minutes:10},list);
   const input=encounter.phase==='withdrawn'?'마지막 조우에 재접근한다':'조우에서 물러난다';
   addButton({label:input,input,minutes:5},list);
  }
  addButton({label:'조우 추적을 그만둔다',input:'조우 추적을 그만둔다'},list);
 }
 const completedResearch=globalThis.MonsterCatalog?.researchMonsters.some(monster=>{
  const record=state.fieldResearch?.[monster.id];
  return monster.research&&record&&!record.submitted&&Object.keys(monster.research).every(id=>record.observations?.[id]);
 });
 if(completedResearch&&state.combat?.status!=='playing'&&state.player.hp>0&&globalThis.RestServices?.facilities(state).some(f=>f.type==='association')){
  const input='협회에 현장 조사 기록을 제출한다';
  addButton({label:input,input},list);
 }
 if(recommendationChoices===null&&window.desktopAI?.directorRecommendations)return;
 for(const choice of choices.slice(0,3)){
  if(!choice.compare){addButton(choice,list);continue;}
  const details=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent=choice.label;
  details.append(summary);
  for(const offer of choice.compare)addButton(offer,details);
  list.append(details);
 }
}
function renderTurnContext(){
 let hint=$('turn-context'),summary=$('turn-summary');
 if(!hint){
  hint=document.createElement('p');hint.id='turn-context';$('dialogue-content').append(hint);
  summary=document.createElement('p');summary.id='turn-summary';summary.setAttribute('role','status');hint.before(summary);
 }
 const active=(state.adventure?.quests||[]).filter(q=>q.type==='hunt'&&q.status==='accepted'&&q.destination===state.location&&['trail','sighted'].includes(q.tracking?.phase));
 const context=active.map(q=>HuntTracking.context(state,q.id));
 const facts=context.map(c=>c.stale?'오래된 흔적 · 현재 위치와 수 미확인':c.encounter?.confirmed?('확인한 대상 '+c.encounter.count+'마리 · 관찰 거리 '+c.encounter.distance+'칸'):'단서가 남아 있음 · 대상 위치와 수 미확인');
 const row=state.turnReview?.at(-1);
 const ride=PassageHost.onboard(state);
 const sceneKey=ride?'vehicle:'+ride.id:state.era+':'+state.location;
 const observed=state.actionWorld?.locations?.[sceneKey]?.observations?.at(-1);
 if(observed)facts.push('마지막 관찰: '+observed.confirmed+' '+observed.uncertain);
 hint.textContent=[...new Set(facts),state.combat?.status==='playing'?'예: 동료에게 기다리라고 말하고, 주변에서 몸을 숨길 곳을 찾는다.':context.length?'예: 동료에게 무엇을 봤는지 묻고, 들리는 소리에 귀를 기울인다.':''].filter(Boolean).join(' / ');
 hint.hidden=!hint.textContent;
 const changes=row?.revision===state.revision?[...reviewChanges(row),...(row.steps||[]).slice(0,2)]:[];
 summary.textContent=changes.length?'이번 턴 · '+changes.join(' · '):'';
 summary.hidden=!summary.textContent;
}
function renderReview(body){
 const records=state.turnReview||[];
 const recorded=new Set(records.map(row=>row.requestId));
 const old=state.turns.filter(t=>!recorded.has(t.id));
 for(const row of [...old.map(t=>({input:t.text,panels:t.panels,changes:{}})),...records]){
  const details=document.createElement('details'),header=document.createElement('summary');
  header.textContent=row.input||'장면 기록';details.append(header);
  for(const text of [
   ...row.panels.map(p=>(names[p.speaker]||'상황')+': '+p.text),
   ...reviewChanges(row),...(row.steps||[]),
   ...(row.observations||[]).map(o=>'관찰 · '+o.confirmed+' '+o.uncertain),
   ...(row.reactions||[]).map(r=>(names[r.actor]||'동료')+' · '+({accept:'수락',refuse:'거절',hesitate:'망설임',unavailable:'응답 불가'}[r.response]||r.response)),
  ]){const p=document.createElement('p');p.textContent=text;details.append(p);}
  if(window.desktopAI?.directorCommand&&state.checkpoints?.some(item=>item.turn===row.revision)){
   const rewind=document.createElement('button');
   rewind.type='button';
   rewind.textContent='이 행동 직전으로';
   rewind.disabled=working;
   rewind.onclick=()=>{if(!working){closePanel();sendCommand('/되돌리기 '+row.revision);}};
   details.append(rewind);
  }
  body.append(details);
 }
 body.lastElementChild?.setAttribute('open','');
}
async function renderBackups(body){
 if(!window.desktopAI?.directorBackups)return;
 const section=document.createElement('section');body.append(section);
 const title=document.createElement('h3');title.textContent='업데이트 백업';section.append(title);
 try{
  const backups=await call('directorBackups');
  for(const b of backups){
   const p=document.createElement('p');
   const place=GameGeography.records.find(p=>p.id===b.location)?.name||b.location;
   p.textContent=[(b.previousVersion?'v'+b.previousVersion:'이전 버전 미기록')+' → v'+b.version,place,b.minutes==null?null:b.minutes+'분',new Date(b.savedAt).toLocaleString()].filter(Boolean).join(' · ');
   section.append(p);
  }
  if(!backups.length){const p=document.createElement('p');p.textContent='아직 업데이트 백업이 없습니다.';section.append(p);}
 }catch(e){const p=document.createElement('p');p.textContent=e.message;section.append(p);}
}
function renderObservationChoices(button){
 const quests=(state.adventure?.quests||[]).filter(q=>q.type==='hunt'&&q.tracking?.observations>0&&q.destination===state.location);
 const available=quests.filter(q=>q.status==='accepted'&&q.progress<q.target&&state.combat?.status!=='playing')
  .map(q=>({q,actions:HuntTracking.options(state,q.id),stale:HuntTracking.expired(state,q.tracking)&&['trail','sighted'].includes(q.tracking.phase)}))
  .filter(entry=>entry.actions.length||entry.stale);
 for(const {q,actions,stale} of available){
  const choices=stale?[{label:'오래된 흔적 다시 확인',minutes:HuntTracking.policy.searchMinutes}]:actions;
  for(const {decision,label,minutes} of choices){
   const caption=(available.length>1?q.title+' · ':'')+label+' · '+minutes+'분';
   const control=button(caption,()=>runRecommendedAction(decision?{type:'trackStep',questId:q.id,decision}:{type:'track',questId:q.id}));
   control.disabled=working;
  }
 }
}
async function executeCompanionObservation(agreementId){
 if(working)throw Error('앞선 요청을 마쳐 주세요.');
 working=true;
 render();
 try{
  state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action:{type:'companionObserve',agreementId}});
  panelIndex=0;
 }finally{
  working=false;
  render();
 }
}
function companionPanel(body){CompanionUI.render(body,state,{disabled:working,onTalk:(req,text)=>{companionTarget=req;pending=null;closePanel();$('chat-input').value=text;render();$('chat-input').focus();},onDivision:()=>openPanel('rewards'),onExecute:async agreementId=>{await executeCompanionObservation(agreementId);if($('panel').dataset.mode==='companions'&&!$('panel').hidden){body.replaceChildren();companionPanel(body);}}});}
function preparationBack(body){if(!(preparationReturn||state.preparations?.questId)||body.querySelector('[data-preparation-back]'))return;const b=document.createElement('button');b.dataset.preparationBack='true';b.textContent='출발 준비로 돌아가기';b.onclick=()=>openPanel('preparation');body.append(b);}
async function choosePreparation(questId){if(working)return;working=true;try{state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action:{type:'prepSelect',questId}});preparationReturn=true;panelIndex=0;render();openPanel('preparation');}catch(e){toast(e.message);}finally{working=false;render();if($('panel').dataset.mode==='preparation'){const body=$('panel-body');body.replaceChildren();preparationPanel(body);}}}
function preparationPanel(body){preparationReturn=true;PreparationUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();preparationPanel(body);return state;},{disabled:working,onPanel:kind=>openPanel(kind),onJourney:id=>{journeyDestination=id;openPanel('journey');},onPerform:kind=>openPanel(kind),onBoard:()=>openPanel('adventure')});}
function arrivalFacility(f){const current=ArrivalModel.view(state);if(working||!current||current.busy||!current.facilities.some(x=>x.id===f.id))return;const service=current.facilities.find(x=>x.id===f.id);if(service.action==='board'){streetBoardLocation=state.location;openPanel('adventure');}else if(service.action){openPanel(service.action);if(service.action==='shop'){const body=$('panel-body');body.dataset.tradeShop=service.id;body.replaceChildren();tradePanel(body);}}else toast(service.name+' · '+service.note);}
function arrivalExplore(body){const v=ArrivalModel.view(state);if(working||!v||v.busy)return;if(v.city){body.replaceChildren();body.classList.add('arrival-panel');CityPanorama.render(body,{...state,visitedLocations:[...new Set([...(state.visitedLocations||[]),state.location])]},state.location,{onFacility:arrivalFacility});const b=document.createElement('button');b.textContent='지역 안내로 돌아가기';b.onclick=()=>{body.replaceChildren();arrivalPanel(body);};body.append(b);}else{const enter=streetEntry();if(enter){closePanel();enter();}}}
function arrivalPanel(body){ArrivalUI.render(body,state,{disabled:working,onFacility:arrivalFacility,onExplore:()=>arrivalExplore(body),onJourney:()=>openPanel('journey'),onHunt:()=>openPanel('adventure'),onDismiss:async arrivalId=>{if(working)return;working=true;try{state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action:{type:'arrivalDismiss',arrivalId}});panelIndex=0;}catch(e){toast(e.message);}finally{working=false;render();body.replaceChildren();arrivalPanel(body);}}});}
function passagePanel(body){preparationBack(body);PassageUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();if(ArrivalModel.view(state)?.pending&&!PassageHost.onboard(state)){$('panel').dataset.mode='arrival';$('panel-title').textContent='도착·지역 안내';arrivalPanel(body);}else passagePanel(body);return state;},{disabled:working,onJourney:id=>{journeyDestination=id;openPanel('journey');},onServices:()=>openPanel('services')});}
function journeyPanel(body){preparationBack(body);JourneyUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();if(ArrivalModel.view(state)?.pending&&state.journeys?.trip?.phase==='arrived'){$('panel').dataset.mode='arrival';$('panel-title').textContent='도착·지역 안내';arrivalPanel(body);}else journeyPanel(body);return state;},{destination:journeyDestination,onNetwork:()=>openPanel('network'),onPassage:()=>openPanel('passage'),onServices:()=>openPanel('services'),onTrade:()=>openPanel('shop'),onCombat:()=>{closePanel();render();},disabled:working});}
function adventurePanel(body,auto=true){const fromStreet=streetBoardLocation===state.location;
 if(fromStreet){
  const back=document.createElement('button');
  back.textContent='지역 안내로 돌아가기';
  back.onclick=()=>{
   if(working)return;
   streetBoardLocation=null;
   openPanel('arrival');
  };
  body.append(back);
 }
 const travel=document.createElement('button');travel.textContent='여정·야영';travel.onclick=()=>openPanel('journey');body.append(travel);const shop=document.createElement('button');shop.textContent='상점·거래';shop.onclick=()=>{body.replaceChildren();tradePanel(body);};body.append(shop);AdventureUI.render(body,state,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorAdventure',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=0;}finally{working=false;}render();body.replaceChildren();adventurePanel(body);if(state.combat?.status==='playing')closePanel();return state;},{onCombat:()=>{closePanel();render();},onDungeon:()=>openPanel('dungeon'),onRescue:()=>openPanel('rescue'),onMining:()=>openPanel('mining'),onEscort:type=>openPanel(type==='escort'?'personalEscort':'escort'),onTravel:planTravel,onAbsorb:async itemId=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorProgression',{requestId:crypto.randomUUID(),revision:state.revision,action:{type:'absorb',itemId}});}finally{working=false;}render();body.replaceChildren();adventurePanel(body);},disabled:working,onRewards:()=>openPanel('rewards'),onPassage:()=>openPanel('passage'),onPrepare:id=>choosePreparation(id),showLab:!fromStreet});if(auto&&!working&&window.desktopAI?.directorBoardRefresh&&DynamicContracts.due(state)){const status=document.createElement('p');status.textContent='탱탱이 새 계약을 준비하고 있어요…';status.setAttribute('role','status');body.prepend(status);queueMicrotask(async()=>{if(working||!body.isConnected)return;working=true;try{state=await call('directorBoardRefresh',{requestId:crypto.randomUUID(),revision:state.revision});panelIndex=0;working=false;render();if($('panel').dataset.mode==='adventure'&&!$('panel').hidden){body.replaceChildren();adventurePanel(body,false);}}catch(e){status.textContent=e.message;}finally{working=false;}});}}
function skillList(body){const heading=document.createElement('h3');heading.textContent='김태이 · 스킬 기록';body.append(heading);const owned=(state?.skillBook?.skills||[]).filter(s=>s.ownerId==='taei');if(!owned.length){const p=document.createElement('p');p.textContent='아직 등록된 스킬이 없습니다. 실제 능력과 수련 기록을 쌓은 뒤 개인 기술을 정리할 수 있습니다. 공용 도감은 별도이며 습득한 기술만 여기에 표시합니다.';body.append(p);}for(const s of owned){const d=SkillSystem.describe(state.skillBook,s),p=document.createElement('p');p.textContent=d.name+(s.progressionGranted?' · 장비 제공':'')+' · '+d.text+' · 경험 '+d.masteryXP+' · 유효 사용 '+d.uses+'회';body.append(p);}}
function open(body){const adventureLab=document.createElement('button');adventureLab.textContent='의뢰·전리품 검증실';adventureLab.onclick=()=>location.href='adventure/lab.html';body.append(adventureLab);const adventure=document.createElement('button');adventure.textContent='본편 의뢰·소지품';adventure.onclick=()=>{body.replaceChildren();adventurePanel(body);};body.append(adventure);const growth=document.createElement('button');growth.textContent='성장·장비 검증실';growth.onclick=()=>location.href='progression/lab.html';body.append(growth);const formulas=document.createElement('button');formulas.textContent='전투 공식 검증실';formulas.onclick=()=>location.href='combat/lab.html';body.append(formulas);const catalog=document.createElement('button');catalog.textContent='공용 스킬 181항목 · 도감과 이펙트 시험';catalog.onclick=()=>location.href='skills/catalog.html';body.append(catalog);skillList(body);const lab=document.createElement('button');lab.textContent='스킬 실험실 · 본편 저장과 분리';lab.onclick=()=>location.href='skills/lab.html';body.append(lab);const title=document.createElement('p');title.textContent='말과 행동에 따라 이야기가 이어집니다. 평소 전투는 채팅으로, 중요한 전투는 직접 조작으로 진행합니다. 확인한 물건과 인물의 반응이 다음 장면에 남습니다.';body.append(title);if(state){const detail=document.createElement('p');detail.textContent='기억 묶음 '+(state.continuity?.chapters?.length||0)+'개 · 누적 대화 '+state.turns.length+'회 · 기록된 사건 '+state.ledger.length+'개 · 미해결 사건 '+state.threads.filter(t=>t.status==='open').length+'개';body.append(detail);const b=document.createElement('button');b.textContent='이야기 화면으로 돌아가기';b.onclick=()=>{closePanel();render();};body.append(b);}const gallery=document.createElement('button');gallery.textContent='전투 원화와 자세 확인';gallery.onclick=()=>galleryOpen();body.append(gallery);const memory=document.createElement('details'),summary=document.createElement('summary');summary.textContent='확인한 이야기 기억';memory.append(summary);for(const e of (state?.ledger||[]).filter(e=>(e.witnesses||['taei']).includes('taei')).slice(-12)){const line=document.createElement('p');line.textContent=e.text;memory.append(line);}body.append(memory);const restore=document.createElement('button');restore.textContent='직전 저장으로 되돌리기';restore.onclick=async()=>{if(working||!confirm('직전 저장으로 돌아갈까요? 현재 기록은 별도로 보관됩니다.'))return;working=true;try{state=await call('directorRestore',{revision:state?.revision??null});pending=null;panelIndex=0;closePanel();render();}catch(e){toast(e.message);}finally{working=false;render();}};body.append(restore);}
function galleryOpen(){const dialog=document.createElement('dialog');dialog.className='story-art-gallery';const controls=document.createElement('div'),select=document.createElement('select'),bg=document.createElement('select'),pose=document.createElement('select'),monster=document.createElement('select'),stage=document.createElement('div'),back=document.createElement('div'),layers=document.createElement('div');stage.className='story-gallery-stage';back.className='story-gallery-background';layers.className='story-gallery-layers';stage.append(back,layers);for(const id of StoryBattleArt.ids){const o=document.createElement('option');o.value=id;o.textContent=names[id]||CombatRoster.get(id)?.name||id;select.append(o);}['숲','달빛 유적','수정 동굴','성문 앞'].forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=n;bg.append(o);});for(const m of CombatRoster.monsters){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;monster.append(o);}for(const [v,n]of [['ready','대치'],['attack','공격 / 대응'],['hit','피격'],['run','이동 / 도주'],['guard','방어'],['dodge','회피']]){const o=document.createElement('option');o.value=v;o.textContent=n;pose.append(o);}pose.setAttribute('aria-label','전투 자세');select.setAttribute('aria-label','전투 원화 캐릭터');bg.setAttribute('aria-label','전투 배경');monster.setAttribute('aria-label','상대 몬스터');const draw=()=>{layers.replaceChildren();StoryBattleArt.layer(layers,select.value,'ally',0,pose.value);monsterLayer(layers,monster.value,0);back.style.backgroundPosition=(Number(bg.value)%2*100)+'% '+(Math.floor(Number(bg.value)/2)*100)+'%';};select.onchange=bg.onchange=monster.onchange=pose.onchange=draw;const close=document.createElement('button');close.textContent='닫기';close.onclick=()=>dialog.close();controls.append(select,pose,bg,monster,close);dialog.append(controls,stage);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());draw();dialog.showModal();}
function villageLifePanel(body){if(state.era!=='fantasy'||PassageHost.onboard(state))return;const title=document.createElement('h3');title.textContent='현재 장소의 인물';body.append(title);for(const actor of state.npcLife?.actors||[]){const line=document.createElement('p');line.textContent=actor.name+' · '+actor.place+' · '+({work:'근무',explore:'탐색',travel:'이동',appointment:'약속',meal:'식사',sleep:'수면',protect:'경계',shelter:'대피'})[actor.activity];const button=document.createElement('button');button.textContent='다가가 말 걸기';button.disabled=working||!actor.available;button.onclick=async()=>{if(working)return;working=true;button.disabled=true;try{state=await call('directorNPCMeet',{revision:state.revision,id:actor.id});pending=null;panelIndex=0;render();toast('주민을 만났어요. 대화창에 말을 입력하세요.');}catch(e){toast(e.message);}finally{working=false;render();body.replaceChildren();panel('cast',body);}};body.append(line,button);if((state.npcRegistry||[]).some(n=>n.id===actor.id)){const events=(state.ledger||[]).filter(e=>(e.witnesses||[]).includes('taei')&&e.source!=='engine-information').slice(-12);if(events.length){const details=document.createElement('details'),summary=document.createElement('summary'),select=document.createElement('select'),label=document.createElement('label'),forward=document.createElement('input'),tell=document.createElement('button');summary.textContent='관측한 사건 전하기';select.setAttribute('aria-label','전달할 사건');for(const e of events){const option=document.createElement('option');option.value=e.id;option.textContent=e.text.slice(0,100);select.append(option);}forward.type='checkbox';label.append(forward,document.createTextNode('다른 사람에게 전해도 된다고 허락'));tell.textContent='선택한 사건 전하기';tell.disabled=working||!actor.available;tell.onclick=async()=>{if(working)return;working=true;tell.disabled=true;try{state=await call('directorNPCTell',{revision:state.revision,requestId:crypto.randomUUID(),to:actor.id,eventId:select.value,allowForward:forward.checked});pending=null;panelIndex=0;toast('상대가 전해 들은 내용으로 기억합니다.');}catch(e){toast(e.message);}finally{working=false;render();body.replaceChildren();panel('cast',body);}};details.append(summary,select,label,tell);body.append(details);}const appointment=document.createElement('button');appointment.textContent='내일 같은 시각에 만나기';appointment.disabled=working||!actor.available;appointment.onclick=async()=>{if(working)return;working=true;appointment.disabled=true;try{state=await call('directorNPCAppointment',{revision:state.revision,id:actor.id,at:(state.minutes||0)+1440});pending=null;panelIndex=0;}catch(e){toast(e.message);}finally{working=false;render();body.replaceChildren();panel('cast',body);}};body.append(appointment);}if(actor.intent){const progress=document.createElement('p');progress.textContent='용무: '+actor.intent.status+' · '+(actor.intent.reason||'진행 중');body.append(progress);}}}
async function saveSlotsPanel(body){const box=document.createElement('section');body.append(box);const message=document.createElement('p');message.textContent='게임 상태·사건·인물 기억·미해결 사건을 함께 저장합니다. 불러오면 해당 시점의 기억으로 돌아갑니다.';box.append(message);try{const rows=await call('directorSlots');for(const row of rows){const line=document.createElement('div'),label=document.createElement('p');label.textContent='슬롯 '+row.slot+' · '+(row.status==='saved'?row.location+' · '+row.minutes+'분 · '+new Date(row.savedAt).toLocaleString():row.status==='invalid'?'읽을 수 없는 저장':'비어 있음');line.append(label);for(const action of ['save','load']){const button=document.createElement('button');button.textContent=action==='save'?'현재 진행 저장':'불러오기';button.disabled=working||action==='load'&&row.status!=='saved';button.onclick=async()=>{if(working)return;if(action==='save'&&row.status!=='empty'&&!confirm('이 슬롯을 현재 진행으로 덮어쓸까요?'))return;if(action==='load'&&!confirm('현재 자동 저장을 이 슬롯으로 교체할까요? 현재 진행을 보존하려면 다른 슬롯에 먼저 저장하세요.'))return;working=true;for(const b of box.querySelectorAll('button'))b.disabled=true;try{const result=await call('directorSlot',{action,slot:row.slot,revision:state.revision});state=result.state;pending=null;companionTarget=null;panelIndex=0;for(const timer of replayTimers)clearTimeout(timer);poseOverride=null;render();toast(action==='save'?'게임과 기억 저장 완료':'게임과 기억 불러오기 완료');}catch(e){toast(e.message);}finally{working=false;render();body.replaceChildren();panel('saves',body);}};line.append(button);}box.append(line);}}catch(e){message.textContent=e.message;}}
function panel(kind,body){body.classList.remove('escort-panel','arrival-panel','preparation-panel','companion-panel');if(!state||!['companions','preparation','arrival','passage','network','journey','transport','npcParties','dungeon','rescue','mining','personalEscort','escort','rewards','services','shop','roles','adventure','chapters','status','cast','codex','journal','saves'].includes(kind))return false;const n=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;body.append(e);return e;};if(kind==='companions')companionPanel(body);if(kind==='preparation')preparationPanel(body);if(kind==='arrival')arrivalPanel(body);if(kind==='passage')passagePanel(body);if(kind==='network')TransportNetworkUI.render(body,state);if(kind==='journey')journeyPanel(body);if(kind==='transport')transportPanel(body);if(kind==='npcParties')npcPartiesPanel(body);if(kind==='dungeon')dungeonPanel(body);if(kind==='rescue')rescuePanel(body);if(kind==='mining')miningPanel(body);if(kind==='personalEscort')personalEscortPanel(body);if(kind==='escort')escortPanel(body);if(kind==='rewards')rewardPanel(body);if(kind==='services')servicePanel(body);if(kind==='shop')tradePanel(body);if(kind==='roles')roleEditor(body);if(kind==='adventure')adventurePanel(body);if(kind==='chapters'){n('p','정해진 장면 목록 없이 현재 대화에서 다음 사건을 이어갑니다.');n('p','현재 '+state.revision+'번째 대화');}if(kind==='status'){const adventure=n('button','본편 의뢰·소지품');adventure.onclick=()=>{body.replaceChildren();adventurePanel(body);};const growth=n('div','');growth.id='progression';ProgressionUI.render(growth,state.player,state.minutes||0,async action=>{if(working)throw Error('앞선 요청을 마쳐 주세요.');working=true;try{state=await call('directorProgression',{requestId:crypto.randomUUID(),revision:state.revision,action});panelIndex=Math.min(panelIndex,state.panels.length-1);}finally{working=false;}render();body.replaceChildren();panel('status',body);},{combatClock:state.skillBook?.clock||0,disabled:working||state.era!=='fantasy'||state.combat?.status==='playing'});skillList(body);n('h3','김태이 · 플레이어');n('p','18세 · 고등학교 2학년');if(state.era==='fantasy')n('p','체력 '+state.player.stats.health+' → HP '+state.player.hp+'/'+state.player.max+' · 마나 '+state.player.stats.mana+' → MP '+state.player.mana+'/'+state.player.maxMana);n('p',$('scene-place').textContent);}if(kind==='cast'){villageLifePanel(body);const roles=n('button','파티 역할 배치');roles.onclick=()=>{body.replaceChildren();roleEditor(body);};if(!state.party?.length)n('p','현재 동행이 확정된 파티원은 없습니다. 장면에 등장했다는 이유로 자동 합류하지 않습니다.');for(const id of state.party||[]){n('h3',names[id]);n('p','나이 · 아직 확인하지 못함');}}if(kind==='codex'){const known=new Set(['taei','yeogyeong','dogyeom',...state.present,...state.turns.flatMap(t=>t.present||[])]);for(const c of StoryKitData.catalog){n('h3',known.has(c.id)?StoryKitData.content.displayName(state,c.id)||c.name:'미발견');if(known.has(c.id))n('p',c.id==='taei'?'18세':'나이 · 아직 확인하지 못함');}}if(kind==='journal')renderReview(body);if(kind==='saves'){saveSlotsPanel(body);renderBackups(body);n('p','AI 이야기는 앱에 매 응답 후 자동 저장됩니다. 기존 고정 이벤트 저장과 별도로 보존합니다.');const b=n('button','이야기 기록 내보내기');b.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='fantasy-emergent-story.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};}return true;}
return{init,enterMeadow,open,galleryOpen,panel,get state(){return state;}};
})();
const legacyStoryRender=render;render=function(){if(document.body.dataset.storyMode!=='director')legacyStoryRender();};
DirectorUI.init();
