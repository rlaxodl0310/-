const D=StoryKitData,E=StoryKitEngine,C=GameCore,$=id=>document.getElementById(id),KEY='fantasy-desktop-story-v2';
let engine=new E(D),logs=[],large=false,motion=true,sdOpen=false,blocked=false,returnFocus=null,busy=false;
const places={arrival_meadow:'이세계 · 낯선 풀밭',earth_subway:'현실 · 등굣길 지하철',signpost:'낯선 세계의 갈림길',leather_bench:'가죽 작업대',well:'마을의 우물가',classroom:'전송 전 · 교실',school_corridor:'전송 전 · 학교 복도',inn_practice_table:'여관 · 창가 테이블',village_gate:'마을 성문',storeroom_table:'창고의 작업대',inn_step:'여관 앞 돌계단'};
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3600);}
function payload(){return {version:D.saveVersion,engine:engine.serialize(),logs,large,motion,appearanceEquipment:LookPacksUI.getEquipment(),savedAt:new Date().toISOString()};}
function persist(key=KEY){if(blocked&&key===KEY){$('save-state').textContent='손상된 자동 저장 보존 중';return false;}try{localStorage.setItem(key,JSON.stringify(payload()));$('save-state').textContent='저장됨 · 이 브라우저';return true;}catch{$('save-state').textContent='저장 공간 사용 불가';return false;}}
function apply(raw){const state=C.validateSave(raw,D,E);engine=state.engine;logs=state.logs;large=state.large;motion=state.motion;LookPacksUI.setEquipment(raw.appearanceEquipment||{});sdOpen=false;}
function actorName(id){return id==='yui'&&!engine.state.flags.includes('known_person_yui')&&['opening','recognize'].includes(engine.state.active?.node)?D.actors.yuiUnknown:D.actors[id];}
function note(speaker,text){logs.push({speaker,text});if(logs.length>300)logs.shift();}
function start(id){try{if(engine.state.active){toast('현재 장면을 마치거나 새 장면으로 전환해 주세요.');return;}const e=engine.event(id);engine.start(id,{location:e.location,members:[...e.members],viewer:e.viewer});note('장면',e.title);note(actorName(engine.current().speaker),engine.current().text);persist();closePanel();render();}catch(error){toast(error.message);}}
function advance(choice=null){try{const finished=engine.state.active.id;const n=engine.current();if(n?.choices){const selected=n.choices.find(c=>c.id===choice);if(selected)note('선택',selected.label);}engine.advance(choice);if(engine.current())note(actorName(engine.current().speaker),engine.current().text);else{note('기록','장면을 마쳤습니다.');const next=engine.event(finished).nextEvent;if(next){start(next);return;}}persist();render();}catch(error){toast(error.message);}}
function render(){document.body.classList.toggle('large-text',large);document.body.classList.toggle('no-motion',!motion);const a=engine.state.active,n=engine.current();$('elapsed').textContent=engine.state.minutes+'분';$('choices').replaceChildren();if(!GeographyUI.mini($('scene-minimap'),engine.state,()=>openPanel('map'))) ExplorationMap.render($('scene-minimap'),engine.state,{compact:true,view:engine.state.currentLocation?.startsWith('earth_')?'local':'world',onOpen:()=>openPanel('map')});
 const event=a?engine.event(a.id):D.events.find(event=>event.location===engine.state.currentLocation);
 const inFantasy=event?.era==='fantasy';
 $('scene-era').textContent=inFantasy?'CHAPTER 1 · 이세계':'PROLOGUE · EARTH';
 $('footer-place').textContent=places[engine.state.currentLocation]||'현실 · 지하철';
 document.querySelector('.footer-trait').textContent=inFantasy?'첫걸음':'등굣길';
 if(!a){renderChapterEnd(inFantasy);return;}
 if(event.id==='fantasy_arrival'){
  SceneStage.render({background:$('scene-art'),portrait:$('scene-portrait'),location:event.location,characterId:null});
  $('scene-title').textContent='낯선 풀밭';
  $('scene-place').textContent=places[event.location];
  $('speaker').textContent='상황';$('emotion').textContent='';
  $('line').textContent=event.nodes.opening.text;
  showMeadowHandoff();
  return;
 }
 const e=event;$('scene-title').textContent=e.title.split(' · ')[1]||e.title;$('scene-place').textContent=places[e.location]||e.location;$('episode-no').textContent=String(D.events.indexOf(e)+1).padStart(2,'0');const art=$('scene-art');SceneStage.render({background:art,portrait:$('scene-portrait'),location:e.location,characterId:e.chat===false?null:e.owner,emotion:n.emotion,state:engine.state,era:e.era,dialogue:true});LookPacksUI.renderPortrait({element:$('scene-portrait'),characterId:e.owner,era:e.era||'earth',emotion:n.emotion});const last=logs.at(-1),lastIsNPC=last&&last.speaker===actorName(e.owner),shown=lastIsNPC?e.owner:n.speaker;$('speaker').textContent=actorName(shown);$('emotion').textContent=shown==='narrator'?'':D.emotions[n.emotion];$('line').textContent=lastIsNPC?last.text:n.text;$('chat-form').hidden=e.chat===false;$('chat-input').disabled=e.chat===false;$('chat-form').querySelector('button').disabled=e.chat===false;
 $('sd').hidden=!sdOpen||n.sd===undefined;if(n.sd!==undefined){$('sd').style.backgroundImage='url("'+D.assets[e.sdAsset||'sd']+'")';$('sd').style.backgroundPosition=(n.sd%3*50)+'% '+Math.floor(n.sd/3)*100+'%';}$('sd-toggle').setAttribute('aria-pressed',String(sdOpen));$('sd-toggle').hidden=n.sd===undefined;
 if(n.choices)for(const c of n.choices)$('choices').append(button(c.label,()=>advance(c.id)));else $('choices').append(button(n.end?'장면 마치기 →':'이야기 계속 →',()=>advance()));if(e.cg){let viewing=false;const cgButton=button('이벤트 컷신 보기',()=>{viewing=!viewing;if(viewing)SceneStage.cutscene(art,$('scene-portrait'),D.assets[e.cg],e.cgPanel);else SceneStage.render({background:art,portrait:$('scene-portrait'),location:e.location,characterId:e.chat===false?null:e.owner,emotion:n.emotion,state:engine.state,era:e.era,dialogue:true});cgButton.textContent=viewing?'기본 장면으로 돌아가기':'이벤트 컷신 보기';});$('choices').append(cgButton);}}
function renderChapterEnd(inFantasy){
 const location=engine.state.currentLocation||'earth_subway';
 SceneStage.render({background:$('scene-art'),portrait:$('scene-portrait'),location,characterId:null});
 $('scene-title').textContent=inFantasy?'이세계에서의 첫걸음':'현실 도입부 완료';
 $('scene-place').textContent=places[location]||location;
 $('speaker').textContent='이야기 기록';
 $('emotion').textContent='';
 const choices=$('choices');
 const arrival=D.events.find(event=>event.id==='fantasy_arrival');
 const canEnter=arrival.requiresCompleted.every(id=>engine.state.completed.includes(id))&&!engine.state.completed.includes(arrival.id);
 if(canEnter){
  $('line').textContent='등굣길 도입부를 마쳤습니다. 이어서 전이 장면을 시작할 수 있습니다.';
  choices.append(button('이세계로 이어가기 →',()=>start(arrival.id)));
 }else if(inFantasy){
  $('line').textContent='눈앞에 낯선 풀밭이 펼쳐져 있습니다.';
  showMeadowHandoff();
  return;
 }else{
  $('line').textContent='장면 목록에서 다음 등굣길 장면을 진행할 수 있습니다.';
  choices.append(button('장면 목록 열기',()=>openPanel('chapters')));
 }
 choices.append(button('진행 저장',()=>openPanel('saves')),button('대화 기록 보기',()=>openPanel('journal')));
 if(window.desktopAI?.directorState)choices.append(button('별도 AI 이야기 열기',()=>openPanel('storychat')));
 $('chat-form').hidden=true;
 $('chat-input').disabled=true;
 $('chat-form').querySelector('button').disabled=true;
 $('sd').hidden=true;
 $('sd-toggle').hidden=true;
}

function showMeadowHandoff(){
 $('chat-form').hidden=true;$('sd').hidden=true;$('sd-toggle').hidden=true;
 const choices=$('choices'),go=button('주변 살펴보기 →',async()=>{
  go.disabled=true;
  try{
   await DirectorUI.enterMeadow(engine.serialize());
  }catch(error){
   $('save-state').textContent=error.message;toast(error.message);
   go.disabled=false;
  }
 });
 if(window.desktopAI?.directorEnterMeadow)choices.append(go);
 else choices.append(el('p','데스크톱 앱에서 ChatGPT를 연결하면 풀밭에서 이야기를 이어갈 수 있습니다.'));
 choices.append(button('진행 저장',()=>openPanel('saves')));
}

function button(text,fn,cls){const b=document.createElement('button');b.textContent=text;b.onclick=fn;if(cls)b.className=cls;return b;}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function closePanel(){$('panel').hidden=true;$('scrim').hidden=true;returnFocus?.focus();}
let developerMode=false;
function openPanel(kind){
 if(kind==='developer'&&!developerMode)kind='settings';if(busy){toast("AI 응답을 기다리는 중입니다. 완료 후 이동해 주세요.");return;}returnFocus=document.activeElement;const body=$('panel-body');$('panel').dataset.mode=kind;body.replaceChildren();const title={preparation:'의뢰 출발 준비',arrival:'도착·지역 안내',passage:'운항편·탑승',journey:'여정·야영',network:'도로망·항로',developer:'개발자 모드',characterlab:'캐릭터 외형 미리보기',diagnostics:'AI 협업 진단',chapters:'이야기 장면',status:'플레이어 정보',cast:'파티 / 동행',codex:'캐릭터 도감',monsters:'몬스터 도감',journal:'지나온 대화',saves:'저장과 불러오기',settings:'환경 설정',appearance:'평소 일러스트 · 외형팩',transport:'부축·운반·인계',npcParties:'독립 공략 파티',dungeon:'던전 공략',rescue:'구조 의뢰',mining:'마석 채굴 의뢰',personalEscort:'학자 개인 호위',escort:'상인단 호위 여정',rewards:'파티 경험치·전리품 분배',services:'휴식·장비 수리',shop:'상점·협회 거래',roles:'파티 역할 배치',adventure:'본편 의뢰·소지품',quests:'협회 의뢰 게시판',storychat:'실시간 AI 이야기',world:'알게 된 세계',map:'탐험 지도',maptest:'도시·마을 탐험 테스트'};$('panel-title').textContent=title[kind];if(kind==='characterlab'){CharacterContentUI.open(body);$('panel').hidden=false;$('scrim').hidden=false;$('close-panel').focus();return;}if(kind==='diagnostics'){AIDiagnosticsUI.open(body);$('panel').hidden=false;$('scrim').hidden=false;$('close-panel').focus();return;}if(typeof DirectorUI!=='undefined'&&DirectorUI.panel(kind,body)){$('panel').hidden=false;$('scrim').hidden=false;$('close-panel').focus();return;}
 if(kind==='chapters'){body.append(el('p','플레이어는 김태이입니다. 현실의 등굣길부터 순서대로 진행합니다.','muted'));for(const e of D.events){const done=engine.state.completed.includes(e.id),active=engine.state.active?.id===e.id;const b=button((done?'✓ ':active?'▶ ':'')+e.title+(done?' · 완료':''),()=>{if(active){closePanel();return;}if(engine.state.active){if(!confirm('현재 장면을 중단하고 새 장면으로 전환할까요? 현재까지의 대화는 기록에 남습니다.'))return;engine.abandon();}start(e.id);},'scene-card');b.disabled=done||(e.requiresCompleted||[]).some(id=>!engine.state.completed.includes(id));body.append(b);}body.append(button('처음부터 새로 시작',()=>{if(confirm('현실의 등굣길부터 다시 시작할까요? 수동 저장 슬롯은 유지됩니다.')){engine=new E(D);logs=[];LookPacksUI.setEquipment({});blocked=false;start(D.events[0].id);}}));}
 if(kind==='map')GeographyUI.panel(body,()=>engine.state,{onTest:developerMode?()=>openPanel('maptest'):null});
 if(kind==='maptest')GeographyUI.testPanel(body);
 if(kind==='developer'){
  const previews=[
   ['전체 캐릭터 도감','codex'],['캐릭터 외형과 동작','characterlab'],['이야기 장면','chapters'],
   ['별도 AI 이야기','storychat'],['도시·마을 탐험','maptest'],['의뢰와 소지품','adventure'],
   ['협회 의뢰','quests'],['상점','shop'],['휴식·수리','services'],['마석 채굴','mining'],
   ['부축·운반·인계','transport'],['독립 공략 파티','npcParties'],['던전 공략','dungeon'],['구조 여정','rescue'],['개인 호위','personalEscort'],['상인단 호위','escort'],['역할 배치','roles'],
   ['파티 보상 분배','rewards'],['외형팩','appearance'],['저장과 불러오기','saves'],
   ['몬스터 도감','monsters'],['AI 협업 진단','diagnostics'],
  ];
  body.append(el('p','도감의 미발견 인물을 미리 볼 수 있습니다. 이야기·의뢰·저장 메뉴에서 실행하는 작업은 현재 진행에 반영됩니다.','muted'));
  for(const [label,panel] of previews)body.append(button(label,()=>openPanel(panel)));
  body.append(el('h3','플레이 테스트'));
  body.append(button('마을 거리 · 2D 탐색',()=>{closePanel();DistrictUI.open();}));
  for(const theme of DistrictModel.terrainViews)body.append(button('거리 배경 · '+theme.label,()=>{closePanel();const visual=DistrictModel.visualFor({note:({farm:'농촌',coast:'해안',forest:'숲',quarry:'광산',river:'강변',pasture:'목축'})[theme.id]});DistrictUI.open(null,{visual});}));
  for(const [label,href,method] of [['턴제 전투 테스트','battle/','openBattle'],['실시간 전투 테스트','realtime/','openRealtime']]){
   if(window.desktopAI?.[method]){
    body.append(button(label,async()=>{
     const result=await window.desktopAI[method]();
     if(!result.ok)toast(result.error);
    }));
   }else{
    const link=el('a',label,'outline');
    link.href=href;
    body.append(link);
   }
  }
  body.append(button('개발자 모드 끄기',()=>{developerMode=false;openPanel('settings');}));
 }

 if(kind==='world')WorldRules.journal(body,engine.state.flags);
 if(kind==='quests')AssociationUI.panel(body);
 if(kind==='storychat')DirectorUI.open(body);
 if(kind==='appearance'){LookPacksUI.panel(body,D,engine.state,()=>{persist();render();});}
 if(kind==='status'){body.append(el('h3','김태이 · 플레이어'),el('p','18세 · 고등학교 2학년'),el('p','현재 · '+(places[engine.state.currentLocation]||'현실 · 지하철')),el('p','태이의 대사와 행동은 직접 입력하거나 선택합니다.','muted'));}
 if(kind==='cast'){const party=C.partyInfo(D,engine.state);if(!party.length)body.append(el('p','현재 함께 이동하기로 한 일행이 없습니다.'));for(const person of party){body.append(el('h3',person.name),el('p','나이 · '+(person.age===null?'아직 확인하지 못함':person.age+'세')));}}
 if(kind==='monsters')MonsterUI.render(body,engine.state);
 if(kind==='codex'){body.append(button('몬스터 도감',()=>openPanel('monsters')));body.append(button('알게 된 세계 기록',()=>openPanel('world')));body.append(button('인물 제작 자료',()=>{body.replaceChildren();NeaUI.render(body,engine.state);}));const entries=C.codexInfo(D,engine.state);body.append(el('p',developerMode?'개발자 미리보기 · 전체 '+entries.length+'명':'알고 있는 인물 '+entries.filter(e=>e.known).length+' / '+entries.length));for(const entry of entries){const person=developerMode?{...entry,...D.catalog[entry.index-1]}:entry;const visible=developerMode||person.known;const card=el('div',undefined,'codex-card');card.append(el('span',String(person.index).padStart(2,'0'), 'codex-number'),el('h3',visible?person.name:'미발견'),el('p',visible?'나이 · '+(person.age===null?'아직 확인하지 못함':person.age+'세'):'이야기에서 만나면 기록됩니다.'));if(developerMode&&person.classification){const transfer=CharacterContent.transfers[person.id];card.append(el('p',person.classification+(transfer.trait?' · 고유 특성 '+transfer.trait:'')),el('p',transfer.bio));}if(developerMode){const image=el('img');image.src='assets/dialogue/'+person.id+'.webp';image.alt=person.name+' 대화 초상화';image.loading='lazy';image.width=120;image.height=90;card.append(image);}if(person.id==='nea'&&visible)card.append(button('네아 일러스트 보기',()=>{body.replaceChildren();NeaUI.render(body,engine.state);}));body.append(card);}}
 if(kind==='journal'){if(!logs.length)body.append(el('p','아직 기록이 없습니다.'));for(const row of logs){const r=el('div',undefined,'log');r.append(el('b',row.speaker),el('p',row.text));body.append(r);}}
 if(kind==='saves'){body.append(el('p','이 브라우저에 저장됩니다. 다른 기기로 옮기려면 파일로 내보내세요.','muted'));for(let i=1;i<=3;i++){const key=KEY+'-slot-'+i,slot=el('div',undefined,'slot');let saved=null;try{saved=JSON.parse(localStorage.getItem(key));}catch{}slot.append(el('h3','슬롯 '+i),el('p',saved?.savedAt?new Date(saved.savedAt).toLocaleString('ko-KR'):'비어 있음','muted'),button('저장',()=>{if(saved&&!confirm('이 슬롯을 덮어쓸까요?'))return;if(persist(key)){toast('슬롯 '+i+' 저장 완료');openPanel('saves');}}));const load=button('불러오기',()=>{try{apply(JSON.parse(localStorage.getItem(key)));blocked=false;persist();closePanel();render();toast('기록을 불러왔습니다.');}catch(error){toast(error.message);}});load.disabled=!saved;slot.append(load);body.append(slot);}body.append(button('저장 파일 내보내기',()=>{const blob=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='fantasy-story-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));const label=el('label','저장 파일 가져오기 '),input=el('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>1000000)throw Error('저장 파일이 너무 큽니다.');const raw=JSON.parse(await file.text());C.validateSave(raw,D,E);if(!confirm('현재 진행을 가져온 기록으로 바꿀까요?'))return;apply(raw);blocked=false;persist();closePanel();render();toast('저장 파일을 가져왔습니다.');}catch(error){toast(error.message);}};label.append(input);body.append(label);}
 if(kind==='settings'){
  body.append(el('h3','개발자 도구'),button(developerMode?'개발자 도구 열기':'개발자 모드 켜기',()=>{developerMode=true;openPanel('developer');}));
  body.append(el('h3','읽기 설정'),button(large?'기본 글자 크기로':'큰 글자로 읽기',()=>{large=!large;persist();render();openPanel('settings');}),button(motion?'화면 전환 효과 끄기':'화면 전환 효과 켜기',()=>{motion=!motion;persist();render();openPanel('settings');}),el('h3','AI 연결'));
  const card=el('div',undefined,'connection-card');card.append(el('strong','ChatGPT 구독'),el('small','공식 Codex CLI'));const badge=el('span',GameAI.state.ready?'로그인됨':'로그인 필요');badge.id='connection-badge';card.append(badge);body.append(card);
  const status=el('p',GameAI.state.message);status.id='ai-load-message';body.append(status);const code=el('pre',GameAI.state.deviceCode||'');code.id='login-code';code.hidden=!GameAI.state.deviceCode;body.append(code);
  const action=(label,fn)=>button(label,async()=>{try{await fn();}catch(error){toast(error.message);}finally{openPanel('settings');}});
  const login=action(GameAI.state.ready?'다른 ChatGPT 계정으로 로그인':'ChatGPT로 로그인',()=>GameAI.login('browser'));login.id='login-button';login.disabled=GameAI.state.phase==='login';body.append(login,action('연결 확인',()=>GameAI.start()));
  const open=action('공식 로그인 페이지 열기',()=>GameAI.openLogin());open.id='open-login';open.hidden=GameAI.state.phase!=='login';body.append(open);
  const cancel=action('로그인 취소',()=>GameAI.stop());cancel.id='cancel-login';cancel.hidden=GameAI.state.phase!=='login';body.append(cancel,action('인증 코드로 로그인',()=>GameAI.login('device')),action('Codex 실행 파일 직접 선택',()=>GameAI.chooseCLI()),action('작성형 체험 모드',()=>GameAI.demo()),el('p','비밀번호는 앱에서 받지 않습니다. 공식 OpenAI 인증 화면에서 로그인하며, 앱은 ChatGPT로 로그인한 Codex를 호출합니다. API 키 입력이나 유료 API 자동 전환은 없습니다.','muted'),el('p','ChatGPT 구독의 Codex 사용 한도가 적용됩니다. 입력과 현재 장면의 대화는 OpenAI로 전송됩니다. 기존 Codex 로그인과 같은 계정을 사용할 수 있습니다.','muted'),el('p','로그인 창이 열리지 않으면 공식 로그인 페이지 열기 또는 인증 코드로 로그인을 사용하세요. 코드 인증은 계정 설정에서 허용해야 할 수 있습니다.','muted'),el('p','AI는 대사와 짧은 행동만 생성합니다. 스탯·시간·아이템·장면 완료는 게임 엔진이 처리합니다.','muted'),action('AI 대화 기억 초기화',async()=>{if(confirm('앱의 AI 대화 기억을 지울까요? 게임 저장 슬롯은 유지됩니다.'))await GameAI.reset();}));
 }

 $('panel').hidden=false;$('scrim').hidden=false;$('close-panel').focus();}
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));$('close-panel').onclick=closePanel;$('scrim').onclick=closePanel;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();if(e.key==='Tab'&&!$('panel').hidden){const items=[...$('panel').querySelectorAll('button,input,a')].filter(x=>!x.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('save-now').onclick=()=>{if(document.body.dataset.storyMode==='director'){toast('AI 이야기는 매 응답 후 앱에 자동 저장됩니다.');return;}if(persist())toast('빠른 저장 완료');else toast('자동 저장을 사용할 수 없습니다. 저장 메뉴에서 파일로 내보내세요.');};$('sd-toggle').onclick=()=>{sdOpen=!sdOpen;render();};
function setBusy(value){busy=value;$('chat-input').disabled=value;for(const b of document.querySelectorAll('#choices button,#sd-toggle'))b.disabled=value;const send=$('chat-form').querySelector('button');send.disabled=false;send.textContent=value?'■':'↗';send.setAttribute('aria-label',value?'AI 답변 생성 중단':'메시지 보내기');$('save-state').textContent=value?'ChatGPT가 답변하는 중 · ■ 버튼으로 중단':'저장됨 · 이 브라우저';}
$('chat-form').onsubmit=async e=>{e.preventDefault();if(busy){GameAI.stop();return;}const input=$('chat-input'),text=input.value.trim(),n=engine.current(),active=engine.state.active;if(!text||!n||engine.event(active.id).chat===false)return;
 if(!GameAI.state.enabled&&GameAI.state.phase!=='demo'){toast('연결 메뉴에서 ChatGPT로 로그인해 주세요.');openPanel('settings');return;}
 if(!GameAI.state.enabled){note('나의 입력',text);const respondent=engine.event(active.id).owner,response=C.reply(respondent,text);note(response.startsWith('[체험')?'체험 안내':actorName(engine.event(active.id).owner),response);input.value='';persist();render();return;}
 const scene=active.id,node=active.node;setBusy(true);
 try{const response=await GameAI.send(scene,node,text);if(engine.state.active?.id!==scene||engine.state.active?.node!==node)throw Error('장면이 바뀌어 응답을 적용하지 않았습니다.');note('나의 입력',text);note(actorName(engine.event(active.id).owner),response);input.value='';persist();render();}
 catch(error){toast(error.message);$('save-state').textContent='응답 실패 · 입력 유지됨';}
 finally{setBusy(false);input.focus();}
};
document.addEventListener('ai-status',()=>{const state=GameAI.state;$('ai-mode').textContent=state.enabled?'● ChatGPT 구독 · 연결됨':state.phase==='login'?'◌ 로그인 대기 중':state.phase==='demo'?'○ 작성형 체험 모드':'○ ChatGPT 연결';if($('ai-load-message'))$('ai-load-message').textContent=state.message;if($('connection-badge'))$('connection-badge').textContent=state.ready?'로그인됨':'로그인 필요';if($('login-code')){$('login-code').textContent=state.deviceCode||'';$('login-code').hidden=!state.deviceCode;}if($('open-login'))$('open-login').hidden=state.phase!=='login';if($('cancel-login'))$('cancel-login').hidden=state.phase!=='login';if($('login-button'))$('login-button').disabled=state.phase==='login';});


try{const raw=localStorage.getItem(KEY);if(raw)apply(JSON.parse(raw));else start(D.events[0].id);}catch{blocked=true;toast('자동 저장을 읽지 못해 원본을 보존했습니다. 저장 메뉴에서 다른 기록을 불러올 수 있습니다.');engine=new E(D);start(D.events[0].id);}render();

const unfinished=GameAI.pending();if(unfinished&&unfinished.scene===engine.state.active?.id&&unfinished.node===engine.state.active?.node)$("chat-input").value=unfinished.text;
GameAI.check();


function walkBuilding(target){
 const old=document.querySelector('.walk-dialogue');old?.remove();const box=document.createElement('section');box.className='walk-dialogue';box.setAttribute('role','dialog');box.setAttribute('aria-label',target.label+' 상호작용');const name=document.createElement('strong');name.textContent=target.label;const text=document.createElement('p');text.textContent=target.note||'건물 앞에 도착했다. 내부 사건과 실제 이용 기능은 아직 연결되지 않았다.';const back=document.createElement('button');back.textContent='탐색으로 돌아가기';back.onclick=()=>box.remove();box.append(name,text,back);document.body.append(box);back.focus();
}
$('walk-launch').onclick=()=>{if(busy){toast('대화 응답을 기다리는 중입니다.');return;}const event=engine.state.active?engine.event(engine.state.active.id):null;const owner=event?.owner;const allowed=event?.chat!==false&&owner&&owner!=='taei'&&CharacterOrigins.allowed(owner,{era:event?.era||'earth',location:event?.location||'earth_subway'});WalkUI.open({background:SceneStage.backgrounds[engine.state.currentLocation]||SceneStage.backgrounds.earth_subway,npc:allowed?{id:owner,name:actorName(owner)}:null,label:'현재 장면 · 이동 시제품',onTalk:()=>{$('chat-input').focus();toast('기존 대화 화면으로 돌아왔습니다.');}});};


const quickToolsToggle=$('quick-tools-toggle'),quickTools=$('quick-tools');
function setQuickTools(open){quickToolsToggle.setAttribute('aria-expanded',String(open));}
quickToolsToggle.onclick=()=>setQuickTools(quickToolsToggle.getAttribute('aria-expanded')!=='true');
quickTools.addEventListener('click',event=>{if(event.target.closest('button'))setQuickTools(false);});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&quickToolsToggle.getAttribute('aria-expanded')==='true'){
  setQuickTools(false);quickToolsToggle.focus();
 }
});
