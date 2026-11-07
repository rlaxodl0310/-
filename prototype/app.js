import {personalEventsAt,personalEventRecord,personalEventView,beginPersonalEvent,progressPersonalEvent,pausePersonalEvent,personalEventDefinition} from './personal-events.js';
import {conversationCast,speakingActor,castPositions} from './dialogue-cast.js';
import {mapEventsAt} from './map-events.js';
import {placeBackground} from './place-backgrounds.js';
import {neighborhoodEventsAt,beginNeighborhoodEvent,neighborhoodEventView,resolveNeighborhoodEvent} from './neighborhood-events.js';
import {surroundingPlaces} from './surroundings-data.js';
import {surroundingsAtmosphere,surroundingsActions,performSurroundingsAction} from './surroundings.js';
import {mapRegions,regionSites,regionForPlace,adjacentRegion} from './region-map.js';
import {campusMapPositions,minimapSites,minimapTerrain,minimapBuilding,choicePurpose,choiceSection} from './campus-map.js';
import {screenNames,screenGuides,navigationBackLabel,forecastDays} from './navigation-copy.js';
import {updateOpportunityHints,currentOpportunity,dismissOpportunity} from './opportunity-hints.js';
import {returningOpeningView,progressReturningOpening,initialReturningScreen} from './returning-opening.js';
import {fortnightActivities,fortnightActivityView,progressFortnightActivity} from './fortnight-life.js';
import {registrationCourses,registrationCatalog,generalCourseOptions,registeredCourseIds,registrationLocked,registrationProblems,confirmRegistration} from './timetable.js';
import {moneyBalance} from './wallet.js';
import {shopGoods,shopView,stockLeft,chooseShopItem,payShopItem,consumeShopItem,cancelShopDraft} from './shops.js';
import {newIseoPreview,iseoPreviewView,advanceIseoPreview} from './iseo-preview.js';
import {canDiscussSupplyAftermath,activeSupplyAftermath,pauseSupplyAftermath,beginSupplyAftermath,supplyAftermathScene,progressSupplyAftermath} from './supply-aftermath.js';
import {usesSupplyStory,supplyPeople,supplyIntro,canAskSupplyReport,supplyReport} from './supply-story.js';
import {varyEverydayAction,everydayEventView,resolveEverydayEvent,abandonEverydayEvent} from './everyday-life.js';
import {cafeMenu,cafeOrderView,chooseCafeDrink,setCafeTemperature,payCafeOrder,collectCafeOrder,drinkCafeOrder,cancelCafeDraft} from './cafe-life.js';
import {characterActing} from './character-acting.js';
import {outdoorActivities,outdoorActivity,outdoorScene} from './outdoor-life.js';
import {needsActivityMiniGame,startActivityMiniGame,tickActivityMiniGame,pauseActivityMiniGame,hitActivityMiniGame,skipActivityMiniGame,activityMiniPosition,activityMiniConfig,activityMiniFeedback} from './activity-minigame.js';
import {activityScene} from './activity-scene.js';
import {lunchEpisode,rainLunchView,rainLunchAction,interruptRainLunch} from './rain-lunch.js';
import {utilityIcon,utilityShortcut} from './utility-ui.js';
import {submitClubApplication,interviewAvailability,clubInterviewView,answerClubInterview,settleClubAdmissions,clubInterviewRooms} from './club-admissions.js';
import {roomFloorLabel,roomFloorList} from './campus-rooms.js';
import {createDialogueService,dialogueServiceContext,applyServiceDialogue} from './dialogue-service.js';
import {communityActivityDefinitions,queueActivityMiniGame,onsiteCommunityActivities,hearOnsiteActivity,activityAvailability,currentCommunityActivity,communityActivityStage,beginCommunityActivity,progressCommunityActivity,pauseCommunityActivity,resumeCommunityActivity} from './community-activities.js';
import {splitNovelText,novelChoicePage,advanceNovel} from './vn-flow.js';
import {timetable,nextLesson,lessonStatus,classPlace,schoolTime,schoolEnabled,classConflicts,roomUseLabel} from './timetable.js';
import {attendLesson} from './classes.js';
import {campusBuildings,buildingActions,buildingActivity,buildingAtmosphere,enterBuildingArea,selectedBuildingArea} from './campus-buildings.js';
import {libraryActivities,libraryActivity,libraryAtmosphere} from './library-life.js';
import {advanceFreeTime,freeActivity,goHome} from './free-roam.js';
import {advanceCommunity,communityState} from './community-simulation.js';
import {visibleCommunityPosts,readCommunityPost} from './community.js';
import {campusScene,placeContinuations,markFlow,visibleSpatialActions} from './scene-flow.js';
import {evolveRisk,requestEscort,riskScene} from './risk-decisions.js';
import {finishWarningSite,discussWarnings,warningPhase} from './warnings.js';
import {weatherTypes,weatherNow,weatherAtmosphere,hasUmbrella,borrowUmbrella,setWeatherExample,weatherAdjustAppointments} from './weather.js';
import {updateSocialWorld} from './social-memory.js';
import {clubs,joinClub,evaluateInvitations,replyOffer,suggestMeeting,appointmentConflicts,meetAppointments} from './appointments.js';
import {timeCost,canSpendTime,clockLabel,placeAtmosphere,paceAction,paceSummary} from './campus-time.js';
import {recordDiscoveries} from './discoveries.js';
import {eventApproaches,planEvent} from './event-engine.js';
import {readMessages} from './event-view.js';
import {arrive,resolveEncounter,placeActions} from './encounters.js';
import {contact,displayName,presentationText,seePeople,hearGroupLine,introduce,normalizeNpcAddress} from './identity.js';
import {people,dialogue,respond,groupDialogue,respondGroup,endTopic,openConversation} from './dialogue.js';
import {newGame,newReturningGame,newAfternoonScenario,nextDay,acceptAppointment,cancelAppointment,save,restore} from './simulation.js';
import {days,schoolDays,locations,availableRoutes,presentPeople,currentSchedule} from './days.js';
let state=newReturningGame(),screen='opening',selected=null,note='',returnTo='campus',speaker='seoyeon',reply=null,groupLines=[],groupIndex=0,groupAnswered=false,encounter=null;
let registrationDraft=registeredCourseIds(state);
let travelRegion='north',travelQuery='',travelFilter='all',artAngle='front',iseoAudition=newIseoPreview();
let gains=[],paceNotice='',weatherReturn='campus',warningScene=null,activityReturn='campus',clubReturn='communityPost',selectedClub=null,communityReturn='campus',communityPhoneReturn='campus',selectedPost=null,feedIds=null,visibleCommentCount=0,communityFilter='all';
const app=document.querySelector('#app');
const dialogueService=createDialogueService();dialogueService.probe();
let modelPending=false,modelAbort=null,miniFrame=null,miniFrameTime=0;
let miniAudio=null,miniSoundEnabled=localStorage.getItem('campus.mini.sound')!=='off';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameOf=id=>displayName(state,id);
const narrative=text=>{
 const value=presentationText(state,text);
 const terms=[...new Set([...(state.known??[]),...(state.inventory??[]).map(i=>i.name)])].filter(Boolean).sort((a,b)=>b.length-a.length);
 if(!terms.length)return esc(value);
 const pattern=new RegExp(terms.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 let html='',start=0;
 for(const match of value.matchAll(pattern)){html+=esc(value.slice(start,match.index));const item=(state.inventory??[]).some(i=>i.name===match[0]);html+=`<strong class="${item?'item-text':'information-text'}">${esc(match[0])}</strong>`;start=match.index+match[0].length;}
 return html+esc(value.slice(start));
};
const buttonLabel=text=>{const node=document.createElement('span');node.innerHTML=text;return esc(node.textContent);};
const btn=(text,action,value='')=>{const cost=action==='encounter'&&value==='pass'?0:timeCost(state,action,value);return `<button aria-label="${buttonLabel(text)}" aria-description="${action.startsWith('vn')||['openQuick','closeQuick','quickTab'].includes(action)?'화면만 바뀌며 게임 시간은 흐르지 않습니다.':cost?cost+'분 소요':'여러 활동을 마친 뒤 시간을 묶어서 진행'}" data-action="${action}" data-value="${esc(value)}" ${action==='wait'&&state.clock.minute>=1320?'disabled':''}>${text}${cost?`<small class="time-cost">${cost}분</small>`:''}</button>`;};
const duration=n=>n%60?`${n}분`:`${n/60}시간`;
function portrait(column){
 const id=column===0?'taei':Object.entries(people).find(([,p])=>p.column===column)?.[0],acting=characterActing(state,id,{scene:screen,text:reply?.text??''});
 return `<div class="portrait ${acting.row===null?'':'expression-portrait'}" data-actor="${id}" data-emotion="${acting.emotion}" data-emotion-atlas="${acting.atlas}" data-expression="${acting.row??'neutral'}" style="--column:${column};--expression:${acting.row??0}" role="img" aria-label="${id==='taei'?'김태이':nameOf(id)} · ${acting.name}"></div>`;
}
function portraitActor(id){if(id==='dogyeom'){return `<div class="portrait dogyeom-cast-portrait" data-actor="dogyeom" data-expression="0" style="--expression:0" role="img" aria-label="${esc(nameOf(id))}"></div>`;}if(id==='iseo'){const a=characterActing(state,id,{scene:screen,text:''});return `<div class="portrait iseo-cast-portrait" data-actor="iseo" data-expression="${a.row}" style="--expression:${a.row}" role="img" aria-label="${esc(nameOf(id))} · ${a.name}"></div>`;}return portrait(id==='taei'?0:people[id].column);}
const storyScreens=new Set(['place','encounter','warningScene','classLesson','detail','result','buildingDirectory','dayEnd','clubDetail','warningShare','neighborhoodEvent','personalEvent','communityEvent','communityActivity','clubApply','clubInterview','rainLunch','cafeOrder','everydayEvent','supplyAftermath']);
function readableText(text){
 const value=String(text??'');if(value.length<110)return esc(value);
 const sentences=value.split(/(?<=[.!?])\s+/),chunks=[];
 for(let i=0;i<sentences.length;i+=2)chunks.push(`<span class="story-sentence">${esc(sentences.slice(i,i+2).join(' '))}</span>`);
 return chunks.join('');
}
function sceneVisual(){
 const session=screen==='communityActivity'?currentCommunityActivity(state):null;
 const lunch=screen==='rainLunch'?lunchEpisode(state):null;
 const aftermath=screen==='supplyAftermath'?activeSupplyAftermath(state):null;
 const personal=screen==='personalEvent'?personalEventRecord(state):null;
 const person=personal?personal.person:aftermath?aftermath.person:lunch?lunch.person:session?.supplyGroup?(supplyPeople(state).includes(session.supplySpeaker)?session.supplySpeaker:supplyPeople(state)[0]??'taei'):session?.postId==='volunteer-recruit'?'yeogyeong':['dialogue','warningShare'].includes(screen)?speaker:screen==='group'?groupLines[groupIndex].person:screen==='encounter'&&encounter?.person?encounter.person:'taei';
 const column=person==='taei'?0:people[person]?.column??0;
 const cast=conversationCast({scene:screen,speaker,contextPerson:person,groupParticipants:groupLines.map(line=>line.person)});
 const positions=castPositions(cast.length);
 const castArt=cast.length?`<div class="dialogue-cast" data-count="${cast.length}" aria-label="이 대화에 함께 있는 인물">${cast.map((id,i)=>`<figure class="cast-member" data-cast-id="${id}" data-speaking="false" style="--cast-x:${positions[i]}%">${portraitActor(id)}<figcaption><span>${esc(id==='taei'?'김태이':nameOf(id))}</span><small class="cast-speaking-label">말하는 중</small></figcaption></figure>`).join('')}</div>`:'';
 const cafeCinematic=screen==='cafeOrder';
 const background=placeBackground(state.location);
 const atHome=screen==='dayEnd'&&state.freeDay?.home;
 const area=atHome?null:selectedBuildingArea(state);
 const caption=personal?personalEventView(state).title+' · '+(personal.status==='completed'?'마친 이야기':(personal.stage+1)+'/2'):aftermath?'이어지는 시간':lunch?'비 오는 점심시간':session?communityActivityDefinitions[session.postId].title+' · '+Math.min(session.step+1,3)+'/3':{classLesson:'수업',encounter:'우연한 만남',warningScene:'눈앞의 상황',detail:'활동 준비',result:'활동을 마친 뒤',buildingDirectory:'건물 안에서',dayEnd:'하루의 끝'}[screen]??'캠퍼스의 일상';
 const sceneLocation=atHome?'자취방':session?locations[session.venue.location]:screen==='campus'?'캠퍼스':locations[state.location]??'캠퍼스';
 const detail=session?session.venue.label.replace(sceneLocation,'').replace(/^\s*·?\s*/,''):area?((area.floor==='층 미확정'?'':area.floor+' · ')+area.name):'';
 return `<aside data-district="${surroundingPlaces[state.location]?.region??''}" class="scene-visual ${cast.length?'has-dialogue-cast':''} ${cafeCinematic?'cafe-cinematic':''}" aria-label="현재 장면">${background&&!atHome?`<div class="place-backdrop" data-background="${state.location}" data-set="${background.set}" style="--bg-x:${background.x}%;--bg-y:${background.y}%;--bg-rows:${background.rows}" role="img" aria-label="${esc(locations[state.location])} 배경 일러스트"></div>`:''}<div class="scene-context"><span class="scene-kicker">${caption}</span><p class="scene-location">${esc(sceneLocation)}${detail?`<small>${esc(detail)}</small>`:''}</p><p class="scene-time"><span>${state.day}일차 · ${clockLabel(state)}</span><span class="scene-weather">${weatherNow(state).icon} ${weatherNow(state).name} · ${weatherNow(state).temperature}°C</span></p></div>${castArt|| (cafeCinematic?'<div class="cafe-cinematic-art" role="img" aria-label="봄빛이 드는 카페 카운터에서 주문하는 김태이와 직원"></div>':!session&&campusBuildings[state.location]?.outdoor&&!background?outdoorScene(state.location):session&&(session.postId==='music-recruit'||communityActivityDefinitions[session.postId]?.physical)?activityScene(session):portrait(column))}<p class="scene-person">${esc(person==='taei'?'김태이':nameOf(person))}</p></aside>`;
}
function page(title,body,back='campus',backAction='go'){
 if(['quickMenu','menu'].includes(screen)){if(quickReturn){back='';backAction='closeQuick';}body=menuTabs()+body;}
 if(screen===quickTool&&quickReturn){back='quickMenu';backAction='go';}
 const scenic=storyScreens.has(screen);
 if(!scenic&&screen!=='phone'&&backAction==='go'&&utilityOrigins.has(screen))back=utilityOrigins.get(screen);
 const content=`<header>${`<button data-action="${backAction}" data-value="${back}" data-navigation-back="true">${esc(navigationBackLabel(back,backAction))}</button>`}<h1 tabindex="-1">${title}</h1>${btn('휴대폰','phone')}${!['quickMenu','menu'].includes(screen)?btn('메뉴','openQuick'):''}</header>${scenic?'<div class="scene-feedback"></div>':screenGuides[screen]?`<p class="screen-guide">${esc(screenGuides[screen])}</p>`:''}${note?`<p class="notice" role="status" tabindex="-1">${scenic?'<span class="note-label">지금의 이야기</span>':''}${scenic?readableText(note):esc(note)}</p>`:''}${state.day===1&&state.phase==='afternoon'&&['place','encounter'].includes(screen)?`<p class="pace-summary">${paceSummary(state)}</p>`:''}${screen==='place'?schoolPanel():''}<div class="${scenic?'story-reading':'page-reading'}">${body}</div><p class="footnote">복학 후 2주 학교생활 · 게임용 일정과 장소입니다.</p>`;
 return scenic?`<section class="page story-page" data-scene="${screen}">${sceneVisual()}<div class="story-content">${content}</div></section>`:`<section class="page utility-page ${screen==='phone'?'phone-home':['quickMenu','menu'].includes(screen)?'game-menu':''}" data-utility="${screen}">${content}</section>`;
}
function timeLabel(){return `${state.day}일차 · ${days[state.day].weekday} · ${clockLabel(state)} ·  ${state.phase==='evening'?'저녁':state.clock.minute<720?'오전':'오후'}`;}
const classStatuses={present:'출석',late:'지각',partial:'일부 참석',absent:'결석',untracked:'이전 저장 · 출석 기록 없음','in-progress':'수업 진행 중',upcoming:'예정'};
function schoolPanel(){
 if(!schoolEnabled(state))return '';
 const c=nextLesson(state);return `<section class="school-summary"><strong>${c?c.start>state.clock.minute?'다음 수업':'수업 진행 중':'오늘 예정된 수업이 끝났습니다'}</strong>${c?`<p>${schoolTime(c.start)}~${schoolTime(c.end)} · ${esc(c.name)}<br>${esc(classPlace(c))}</p><div class="actions">${state.location===c.location&&state.buildingArea?.id===c.area?btn('입실해 수업을 듣는다.','classPrepare',c.key):btn('수업 장소로 간다.','classTravel',c.key)}${btn('시간표 · 출석','go','timetable')}</div>`:`<p>공강에는 자유롭게 움직일 수 있습니다.</p>${btn('시간표 · 출석','go','timetable')}`}</section>`;
}
function schoolDaySummary(day){return schoolEnabled(state)?`<p>수업: ${timetable(state,'taei',day).map(c=>esc(c.name)+' · '+(classStatuses[state.academics.records[c.key]?.status]??'기록 없음')).join(' / ')}</p>`:'';}
function pending(){return state.appointments.filter(a=>a.status==='pending');}
const appointmentStatuses={offered:'응답 전',pending:'참석 예정',declined:'거절함',cancelled:'미리 취소함',kept:'지킴',broken:'지키지 못함',expired:'제안 기한 지남',withdrawn:'상대가 제안 보류','weather-cancelled':'날씨로 취소'};
function appointmentCard(a){
 const who=a.person?nameOf(a.person):clubs[a.club]?.name??'동아리';
 const conflicts=appointmentConflicts(state,a);
 return `<article class="list" data-appointment-id="${esc(a.id??a.person??'legacy')}"><strong>${esc(who)} · ${esc(a.label)}</strong><p>${a.day}일차 ${a.minute?schoolTime(a.minute):'오후'}${a.location?' · '+esc(locations[a.location]??a.location):''} · ${appointmentStatuses[a.status]??a.status}</p><p class="muted">${a.proposer==='npc'?'상대가 먼저 제안':a.proposer==='club'?'가입한 동아리의 활동 안내':a.proposer==='player'?'태이가 제안':'대화에서 잡은 약속'}</p>${a.text?`<p>${esc(a.text)}</p>`:''}${['offered','pending'].includes(a.status)&&conflicts.length?`<p class="notice">${conflicts.map(c=>esc(c.label)).join(', ')} 일정과 시간이 겹칠 수 있습니다. 차례로 참여할 시간이 있는지 확인해 주세요.</p>`:''}<div class="actions">${a.status==='offered'?btn(conflicts.length?'겹치는 일정 확인 후 수락':'수락하기','acceptOffer',a.id)+btn('정중히 거절하기','declineOffer',a.id):a.status==='pending'?btn('미리 연락해 취소','cancelAppointment',a.id??a.person):''}</div></article>`;
}
function commitments(){return state.appointments.map(appointmentCard).join('')||'<p class="muted">아직 약속이나 제안이 없습니다.</p>';}
function atPlace(){return locations[state.location]?state.location:'hall';}
let vnView={key:'',beat:0,choosing:false,page:0,branch:'main'},vnModel=null,vnResumeView=null;
const vnCursors=new Map();
let selectedCommunityEvent=null,buildingFloorView=null;
let quickReturn=null,quickSnapshot=null,quickTool='';
const utilityOrigins=new Map();
const readingSnapshots=new Map();
const utilityScreens=new Set(['phone','timetable','schedule','messages','map','journal','discoveries','observations','weather','community','communityPost','clubs','travel','menu','quickMenu','reset','peopleRecord','characterArt','iseoDialogue','wallet','shop','enrollment','calendar','fortnightActivity','personalStories','opening']);
function rememberReading(){if(vnModel&&!utilityScreens.has(screen))readingSnapshots.set(screen,{screen,note,reply,paceNotice,view:{...vnView}});}
function plainNode(node){const copy=node.cloneNode(true);if(copy.classList.contains('player-line'))copy.querySelector('span')?.remove();copy.querySelectorAll('.note-label,.time-cost,button').forEach(n=>n.remove());return copy.textContent.replace(/\s+/g,' ').trim();}
function novelPresentation(){
 const raw=app.querySelector('.story-page,.explore,.conversation');
 if(!raw||utilityScreens.has(screen)){vnModel=null;return;}
 const beats=[],push=(text,kind='narrator',who='',actor='')=>{for(const part of splitNovelText(text))beats.push({text:part,kind,who,actor});};
 let primary=[],aux=[],plans=[];
 const nodeButtons=nodes=>Array.from(nodes).map(n=>n.cloneNode(true));
 if(screen==='campus'){
  push(raw.querySelector('.prompt>p')?.textContent??'');primary=nodeButtons(raw.querySelectorAll('.prompt button'));
 }else if(screen==='dialogue'||screen==='group'){
  const panel=raw.querySelector('.dialogue-panel');
  if(panel.querySelector('.player-line'))push(plainNode(panel.querySelector('.player-line')),'player','김태이','taei');
  const stage=panel.querySelector(':scope>.muted');if(stage)push(plainNode(stage));
  const heard=panel.querySelector('.heard-report');if(heard)push(plainNode(heard),'speech',nameOf(speaker),speaker);
  const quote=panel.querySelector('blockquote');if(quote)push(quote.textContent,'speech',screen==='group'?nameOf(groupLines[groupIndex].person):nameOf(speaker),screen==='group'?groupLines[groupIndex].person:speaker);
  const follow=panel.querySelector('.inner-line');if(follow)push(plainNode(follow));
  primary=nodeButtons(panel.querySelectorAll('.dialogue-options button'));aux=nodeButtons(panel.querySelectorAll(':scope>.actions button'));
 }else{
  const content=raw.querySelector('.story-content'),reading=content.querySelector('.story-reading');
  const outcome=content.querySelector(':scope>.notice');if(outcome)push(plainNode(outcome),'outcome');
  for(const node of reading.children){
   if(node.matches('p,.story-prose,.list')){
    if(screen==='place'){const observedRisk=node.matches('.muted')&&node.previousElementSibling?.matches('.weather-scene');if((outcome&&!observedRisk)||node.matches('.lead,.weather-scene'))continue;}
    if(screen==='classLesson'&&node.matches('.lead'))continue;
    if(screen==='detail'&&node.matches('.muted'))continue;
    if(node.matches('.scene-caption'))continue;
    const voice=node.dataset.voice??'',actor=voice==='김태이'?'taei':Object.keys(people).find(id=>nameOf(id)===voice)??'';
    push(plainNode(node),voice?'speech':node.matches('.notice')?'warning':'narrator',voice,actor);
   }
  }
  primary=nodeButtons(reading.querySelectorAll('button'));
  if(screen==='place'){
   primary=primary.filter(n=>n.dataset.action!=='visit'&&!(n.dataset.action==='go'&&['timetable','schedule','map','phone'].includes(n.dataset.value)));
   const course=content.querySelector('.school-summary [data-action="classPrepare"],.school-summary [data-action="classTravel"]');
   if(course)primary.unshift(course.cloneNode(true));
   const exit=document.createElement('button');exit.dataset.action='go';exit.dataset.value='campus';exit.textContent='건물 밖으로 나와 잠깐 주변을 본다.';primary.push(exit);
  }
  if(screen==='personalEvent'&&personalEventRecord(state)?.status==='active')primary=primary.filter(n=>n.dataset.action!=='pausePersonalEvent');
  if(screen==='detail'){plans=primary.filter(n=>n.dataset.action==='plan');primary=primary.filter(n=>n.dataset.action!=='plan');}
 }
 if(['campus','place'].includes(screen)){
  const hadTravel=primary.some(n=>n.dataset.action==='visit'||n.dataset.action==='go'&&['travel','campus'].includes(n.dataset.value));
  primary=primary.filter(n=>n.dataset.action!=='visit'&&!(n.dataset.action==='go'&&['travel','campus'].includes(n.dataset.value)));
  if(hadTravel||screen==='place'){const mapButton=document.createElement('button');mapButton.dataset.action='go';mapButton.dataset.value='travel';mapButton.textContent='지도에서 다른 장소 고르기';primary.push(mapButton);}
  primary=primary.filter((n,i,all)=>all.findIndex(x=>x.dataset.action===n.dataset.action&&x.dataset.value===n.dataset.value)===i);
 }
 if(paceNotice)push(paceNotice);
 // Utility commands are always available in the upper menu instead of the answer list.
 primary=primary.filter(n=>!(n.dataset.action==='go'&&['timetable','schedule','map','phone','discoveries'].includes(n.dataset.value)));
 if(!beats.length)push(screen==='buildingDirectory'?'안내를 보며 어느 공간으로 갈지 생각한다.':'잠깐 생각을 정리한다.');
 const branchButton=(text,value)=>{const n=document.createElement('button');n.dataset.action='vnBranch';n.dataset.value=value;n.textContent=text;return n;};
 if(['clubDetail','buildingDirectory','classLesson'].includes(screen)){const back=raw.querySelector('.story-content>header button');if(back){const n=back.cloneNode(true);n.textContent=screen==='clubDetail'?'안내를 덮고 돌아간다.':screen==='buildingDirectory'?'일단 복도로 돌아간다.':'아직 수업에 들어가지 않고 돌아간다.';n.setAttribute('aria-label',n.textContent);primary.push(n);}}
 if(!primary.length&&!aux.length){const back=raw.querySelector('.story-content>header button');if(back){const n=back.cloneNode(true);n.textContent='하던 곳으로 돌아간다.';n.setAttribute('aria-label','하던 곳으로 돌아간다.');primary.push(n);}}
 if(aux.length)primary.push(branchButton('조금 다른 이야기를 꺼낸다.','conversation'));
 if(plans.length)primary.push(branchButton('어떻게 참여할지 조금 더 생각한다.','plans'));
 const key=JSON.stringify([screen,state.day,state.clock.minute,state.location,selected,beats,primary.map(n=>[n.dataset.action,n.dataset.value,n.textContent])]);
 if(vnResumeView){vnView={...vnResumeView,key,beat:Math.min(vnResumeView.beat,beats.length-1)};vnResumeView=null;}
 else if(vnView.key!==key)vnView=vnCursors.get(key)??{key,beat:0,choosing:false,page:0,branch:'main'};
 vnModel={beats,primary,aux,plans,title:raw.querySelector('h1')?.textContent??(screen==='dialogue'?nameOf(speaker):'캠퍼스')};
 const notices=Array.from(raw.querySelectorAll('.discovery-notice p')).map(n=>n.textContent.trim());
 app.innerHTML=`<section class="vn-stage ${['dialogue','group','warningShare','rainLunch','supplyAftermath','personalEvent'].includes(screen)?'dialogue-stage':''}" data-vn-screen="${screen}">${sceneVisual()}<nav class="vn-toolbar" aria-label="상단 메뉴">${btn(utilityIcon('map')+'<span>지도·이동</span>','go','travel')}${btn(utilityIcon('phone')+'<span>휴대폰</span>','phone')}${btn(utilityIcon('journal')+'<span>메뉴'+(state.appointments.some(a=>a.status==='offered')?' · 새 제안':'')+'</span>','openQuick')}${screen==='personalEvent'&&personalEventRecord(state)?.status==='active'?btn('나중에 이어하기','pausePersonalEvent'):''}</nav>${notices.length?`<div class="vn-acquisition"><span>${esc(notices[0])}${notices.length>1?' 외 '+(notices.length-1)+'개':''}</span>${btn('정보 보기','go','discoveries')}</div>`:''}<article class="vn-panel" aria-label="이야기와 선택" tabindex="0"><div class="vn-copy"></div><div class="vn-controls"></div></article></section>`;
 drawNovelBeat();
}
function drawNovelBeat(){
 if(!vnModel)return;
 vnCursors.set(vnView.key,{...vnView});
 const current=vnModel.beats[Math.min(vnView.beat,vnModel.beats.length-1)],copy=app.querySelector('.vn-copy'),controls=app.querySelector('.vn-controls');if(!copy||!controls)return;
 const participants=[...app.querySelectorAll('.cast-member')].map(n=>n.dataset.castId);
 const activeActor=speakingActor(current,participants,participants.find(id=>id!=='taei')??speaker);
 const castLayer=app.querySelector('.dialogue-cast');if(castLayer)castLayer.dataset.activeActor=activeActor;
 for(const member of app.querySelectorAll('.cast-member')){const active=member.dataset.castId===activeActor;member.dataset.speaking=String(active);member.classList.toggle('cast-listening',!!activeActor&&!active);}
 for(const node of app.querySelectorAll('.portrait[data-actor]')){
  const acting=characterActing(state,node.dataset.actor,{scene:screen,text:current.text,listening:!!activeActor&&node.dataset.actor!==activeActor,heardText:current.text,emotion:node.dataset.actor===activeActor?current.emotion:undefined});node.classList.toggle('expression-portrait',acting.row!==null);node.style.setProperty('--expression',acting.row??0);node.dataset.expression=acting.row??'neutral';node.dataset.emotion=acting.emotion;node.dataset.emotionAtlas=acting.atlas;node.setAttribute('aria-label',(node.dataset.actor==='taei'?'김태이':nameOf(node.dataset.actor))+' · '+acting.name);
 }
 const label=current.who||(current.kind==='outcome'?'그 뒤의 이야기':current.kind==='warning'?'잠깐, 확인할 일':'이야기');
 copy.innerHTML=`<div class="vn-reading-meta"><p class="vn-speaker">${esc(label)}</p><span class="vn-reading-progress" aria-label="문장 진행 ${vnView.beat+1}/${vnModel.beats.length}">${vnView.beat+1} / ${vnModel.beats.length}</span></div><p class="vn-line ${current.kind==='player'?'vn-player':''}">${narrative(current.text)}</p>`;
 if(!vnView.choosing){controls.innerHTML=`<div class="vn-reading-controls">${vnView.beat>0?btn('이전 문장','vnPrevious'):''}${btn(vnView.beat+1<vnModel.beats.length?'다음':'선택지 보기','vnNext')}</div>`;return;}
 let choices=vnView.branch==='conversation'?vnModel.aux:vnView.branch==='plans'?vnModel.plans:vnModel.primary;
 if(vnView.branch!=='main'){
  const back=document.createElement('button');back.dataset.action='vnBranch';back.dataset.value='main';back.textContent='앞의 이야기로 돌아간다.';choices=[...choices,back];
 }
 const overview=['campus','place','buildingDirectory'].includes(screen);
 const group=overview?{items:choices,page:0,pages:1,more:false}:novelChoicePage(choices,vnView.page);vnView.page=group.page;
 controls.classList.toggle('exploration-controls',overview);
 controls.innerHTML=`<p class="vn-choice-caption">${vnView.branch==='conversation'?'어떤 이야기를 꺼낼까?':vnView.branch==='plans'?'어떻게 참여할까?':'어떻게 할까?'}${group.more?' · '+(group.page+1)+'/'+group.pages:''}${screen==='personalEvent'?personalEventRecord(state)?.status==='completed'?' · 완료':personalEventRecord(state)?.stage?' · 20분 진행':' · 10분 진행':''}</p><div class="vn-choices"></div>`;
 const container=controls.querySelector('.vn-choices');
 if(overview){
  container.classList.add('action-overview');
  for(const section of ['수업','이동·탐색','활동','기타']){
   const items=group.items.filter(n=>choiceSection(n.dataset.action,n.dataset.value)===section);if(!items.length)continue;
   const heading=document.createElement('h3');heading.textContent=section;container.append(heading);
   for(const n of items){const card=n.cloneNode(true),purpose=choicePurpose(n.dataset.action,n.dataset.value);if(items.length===1)card.style.gridColumn='1 / -1';if(purpose){const desc=document.createElement('small');desc.className='choice-purpose';desc.textContent=purpose[1];card.append(desc);}container.append(card);}
  }
 }else for(const n of group.items)container.append(n.cloneNode(true));
 if(group.more)container.insertAdjacentHTML('beforeend',btn(`다른 행동 보기 · ${group.page+1}/${group.pages}`,'vnCycle'));
}
function unreadMessages(){return state.messages.filter(m=>!m.read).length;}
function newOffers(){return state.appointments.filter(a=>a.status==='offered').length;}
function quickMenuBody(){
 const groups=[['지금 할 일',[{label:'장소 이동',id:'travel',hint:'건물과 호실 찾기'},{label:'휴대폰',id:'phone',hint:'캠퍼스톡 · 메시지 · 일정',badge:unreadMessages()+newOffers()}]],['학교생활',[...(schoolEnabled(state)?[{label:'시간표 · 출석',id:'timetable',hint:'수업 장소와 출석 확인'},{label:'수강 계획 변경',id:'enrollment',hint:'앞으로 들을 수업 고르기'},{label:'2주 달력',id:'calendar',hint:'날짜별 일상과 주말 계획'}]:[]),{label:'약속',id:'schedule',hint:'제안과 참석 일정',badge:newOffers()},{label:'지도',id:'map',hint:'교내 공간 살펴보기'},{label:'날씨 · 예보',id:'weather',hint:'오늘 날씨와 준비물',action:'openWeather'}]],['내 기록',[{label:'소지금 · 구매 내역',id:'wallet',hint:moneyBalance(state).toLocaleString()+'원'},{label:'정보 · 소지품',id:'discoveries',hint:'발견한 정보와 가진 물건'},{label:'알게 된 사람들',id:'peopleRecord',hint:'만난 사람과 마지막 목격'},{label:'캐릭터 일러스트',id:'characterArt',hint:'정이서 · 외형 미리보기'},{label:'메시지',id:'messages',hint:'받은 연락 확인',badge:unreadMessages()},{label:'개인 이야기 기록',id:'personalStories',hint:'함께한 이야기 · 멈춘 이야기'},{label:'일지',id:'journal',hint:'지나온 선택 돌아보기'}]]];
 const lunch=lunchEpisode(state);
 const resume=Object.values(state.activitySessions?.records??{}).filter(r=>r.day===state.day&&['active','paused'].includes(r.status));
 return `<div class="menu-dashboard"><aside class="menu-context"><span class="utility-overline">CAMPUS LIFE</span><div class="menu-avatar">태</div><h2>김태이</h2><p>${esc(locations[state.location]??'캠퍼스')}</p><span class="context-time">${clockLabel(state)}</span><p>${state.day}일차 · ${days[state.day].weekday}</p><div class="context-weather">${weatherNow(state).icon} ${weatherNow(state).name} · ${weatherNow(state).temperature}°C</div><small>다음 행동을 골라보세요.</small></aside><div class="menu-sections">${Object.values(state.personalEvents?.records??{}).filter(r=>r.status!=='completed').map(r=>`<article class="resume-card"><strong>${r.person==='taei'?'김태이':esc(nameOf(r.person))} · 이어가던 이야기</strong><p>현재 같은 장소에서 만났을 때 이어갈 수 있어요.</p>${personalEventsAt(state).some(e=>e.eventId===(r.eventId??r.person))?btn('이어가기','openPersonalEvent',r.eventId??r.person):''}</article>`).join('')}${Object.values(state.supplyAftermath?.records??{}).filter(r=>r.day===state.day&&['active','paused'].includes(r.status)).map(r=>`<article class="resume-card"><span>이어서 할 수 있어요</span><strong>${esc(nameOf(r.person))}과 짧게 함께한 시간</strong>${btn('같이 하던 일을 이어간다.','startSupplyAftermath',r.person)}</article>`).join('')}${everydayEventView(state)?`<article class="resume-card"><span>이어서 볼 수 있어요</span><strong>잠깐 생긴 일</strong>${btn('상황으로 돌아간다.','resumeEveryday')}</article>`:''}${lunch?.status==='active'&&lunch.day===state.day?`<article class="resume-card"><span>이어서 할 수 있어요</span><strong>비 오는 점심시간</strong>${btn('함께하던 일로 돌아간다.','resumeLunch')}</article>`:''}${resume.map(r=>`<article class="resume-card"><span>이어서 할 수 있어요</span><strong>${esc(communityActivityDefinitions[r.postId].title)}</strong><p>${r.spent}/${r.duration}분 참여</p>${activityAvailability(state,r.postId,r).ok?btn('현장에서 이어서 한다.','eventResume',r.key):`<p>${esc(activityAvailability(state,r.postId,r).reason)}</p>`}</article>`).join('')}${groups.map(([title,items],i)=>`<section class="shortcut-section"><h2>${title}</h2><div class="grid shortcut-grid ${i===0?'featured-shortcuts':''}">${items.map(item=>utilityShortcut({...item,style:i===0?'feature':'row'})).join('')}</div></section>`).join('')}</div></div>`;
}
function phoneHomeBody(){
 const lesson=nextLesson(state),weather=weatherNow(state);
 const campus=[...(schoolEnabled(state)?[{label:'시간표 · 출석',id:'timetable'}]:[]),{label:'날씨와 예보',id:'weather'},...((state.flow?.seen?.community||Object.keys(state.memberships??{}).length)?[{label:'읽어둔 동아리 안내',id:'clubs'}]:[])];
 const personal=[{label:'약속 · 일정',id:'schedule',badge:newOffers()},{label:'알게 된 사람들',id:'peopleRecord'},{label:'지도',id:'map'},{label:'알게 된 정보 · 소지품',id:'discoveries'},{label:'일지',id:'journal'},...((state.warnings?.evidence?.length??0)>0?[{label:'확인한 일',id:'observations'}]:[])];
 return `<div class="phone-screen"><div class="phone-brand"><strong>나의 캠퍼스</strong><span>김태이의 휴대폰</span></div><div class="phone-clock"><span>${state.day}일차 · ${days[state.day].weekday}</span><strong>${clockLabel(state)}</strong><span class="phone-location">${utilityIcon('map')}${esc(locations[state.location]??'캠퍼스')}</span></div><div class="phone-widgets"><button class="phone-class-widget" data-action="go" data-value="${lesson?'timetable':'schedule'}" aria-label="${lesson?'다음 수업 확인':'다가오는 약속 확인'}"><span class="widget-label">${lesson?(lesson.start<=state.clock.minute?'수업 진행 중':'다음 수업'):'예정된 수업 없음'}</span><strong>${lesson?esc(lesson.name):'잠깐의 여유'}</strong><small>${lesson?schoolTime(lesson.start)+' · '+esc(classPlace(lesson)):newOffers()?'새 약속 제안 '+newOffers()+'개':'일정을 확인하고 자유롭게 움직여요.'}</small>${utilityIcon('arrow')}</button><button class="phone-weather-widget" data-action="go" data-value="weather" aria-label="날씨 자세히 보기"><span>${weather.icon}</span><strong>${weather.temperature}°</strong><small>${weather.name}</small></button></div>${`<section class="phone-priority" aria-label="자주 쓰는 앱">${utilityShortcut({label:'캠퍼스톡',id:'community',hint:'학내 소식 · 모집글',style:'row'})}${utilityShortcut({label:'메시지',id:'messages',hint:unreadMessages()?'읽지 않은 연락 '+unreadMessages()+'개':'받은 연락 확인',badge:unreadMessages(),style:'row'})}</section>${newOffers()?`<button class="phone-offer" data-action="go" data-value="schedule">새 약속 제안 ${newOffers()}개 <span>확인하기 →</span></button>`:''}`} ${[["학교생활",campus],["내 기록과 일정",personal]].map(([label,items])=>`<section class="phone-app-section"><h2>${label}</h2><div class="phone-app-grid">${items.map(item=>utilityShortcut({...item,style:'app'})).join('')}</div></section>`).join('')}<div class="phone-home-indicator" aria-hidden="true"></div></div>`;
}
function menuTabs(){return `<nav class="menu-tabs" aria-label="메뉴 탭"><button data-action="quickTab" data-value="tools" aria-pressed="${screen==='quickMenu'}">학교생활 메뉴</button><button data-action="quickTab" data-value="save" aria-pressed="${screen==='menu'}">저장 · 불러오기</button></nav>`;}
function resumeQuick(){if(!quickReturn){screen='campus';note='';reply=null;render();return;}screen=quickReturn;note=quickSnapshot?.note??'';reply=quickSnapshot?.reply??null;paceNotice=quickSnapshot?.paceNotice??'';vnResumeView=quickSnapshot?.view??null;quickReturn=null;quickSnapshot=null;quickTool='';if(!utilityScreens.has(screen))readingSnapshots.delete(screen);render();(app.querySelector('.vn-panel')??app.querySelector('h1'))?.focus({preventScroll:true});}

function render(){
 document.body.dataset.utilityScreen=['phone','quickMenu','menu'].includes(screen)?screen:'';
 const evening=state.phase==='evening',day=days[state.day],routes=availableRoutes(state);
 if(screen==='campus'){const scene=campusScene(state);app.innerHTML=`<section class="explore"><div class="top"><span class="badge">${timeLabel()}</span><nav>${btn('휴대폰','phone')}${btn('메뉴','go','menu')}</nav></div>${portrait(0)}<div class="prompt scene-prompt"><p>${narrative(scene.text)}</p>${scene.choices.map(c=>btn(narrative(c.label),c.action,c.value)).join('')}</div></section>`;}
 if(screen==='quickMenu')app.innerHTML=page('메뉴',quickMenuBody(),'','closeQuick');
 if(screen==='community')app.innerHTML=page('캠퍼스톡',`<p class="community-intro">학내 커뮤니티 · 모집글과 공지, 익명 이야기가 함께 올라옵니다.</p><nav class="community-tabs">${[['all','전체'],['anonymous','자유'],['club','모집'],['activity','체험'],['notice','공지']].map(([id,label])=>`<button data-action="communityFilter" data-value="${id}" aria-pressed="${communityFilter===id}">${label}</button>`).join('')}</nav><div class="community-live" aria-live="polite"></div><div class="community-feed">${visibleCommunityPosts(state).filter(p=>(!feedIds||feedIds.includes(p.id))&&(communityFilter==='all'||p.kind===communityFilter)).map(p=>`<button class="community-post" data-action="readPost" data-value="${p.id}"><span class="post-meta">${esc(p.board)} · ${p.kind==='anonymous'?'익명글':p.kind==='notice'?'교내 공지':p.kind==='activity'?esc(p.author):'동아리 운영진'} · ${p.day===state.day?'오늘':p.day+'일차'}${p.generated?' · '+(communityState(state).beat-p.createdBeat<4?'방금':'조금 전'):''}</span><strong>${esc(p.title)}</strong><span class="post-preview">${esc(p.body)}</span><span class="post-meta">댓글 ${p.comments.length}${p.likes?' · 공감 '+p.likes:''}${state.flow.postsRead?.[p.id]?' · 읽음':''}</span></button>`).join('')}</div>`,communityReturn,'closeCommunity');
 if(screen==='communityEvent'&&selectedCommunityEvent){const def=communityActivityDefinitions[selectedCommunityEvent],availability=activityAvailability(state,selectedCommunityEvent),record=currentCommunityActivity(state,`${state.day}:${selectedCommunityEvent}`);app.innerHTML=page(def.title,`<p class="lead">${state.flow?.postsRead?.[selectedCommunityEvent]?'모집글에서':'현장에서'} ${esc(def.title)} 공개 체험에 참여할 수 있다는 안내를 ${state.flow?.postsRead?.[selectedCommunityEvent]?'읽었다':'들었다'}. 현장에서 준비·실제 활동·마무리를 차례로 맡아볼 수 있다.</p><p>${def.physical?'1~14일차':def.days?'1~3일차':def.day+'일차'} ${def.physical?'09:00~18:00':def.club==='volunteer'&&usesSupplyStory(state)?'13:00~16:00':'13:00~18:00'} 공개 활동 · ${def.venue.label}${def.club==='football'?' (우천 시 체육관 실내 대체)':''}</p><p>준비부터 마무리까지 약 ${availability.route?.duration??record?.duration??def.duration??days[def.day].routes[def.route].duration}분. 가입하지 않아도 체험할 수 있으며, 읽거나 참여한 것만으로 가입·약속이 생기지는 않습니다.</p>${!availability.ok?`<p class="notice">${esc(availability.reason)}</p>`:''}<div class="actions">${availability.ok?btn(record?'현장으로 돌아가 이어서 한다.':'현장에 가서 공개 활동에 참여한다.','eventBegin',selectedCommunityEvent):''}${btn('아직 시작하지 않고 돌아간다.','go',state.flow?.postsRead?.[selectedCommunityEvent]?'communityPost':'place')}</div>`,state.flow?.postsRead?.[selectedCommunityEvent]?'communityPost':'place');}
 if(screen==='rainLunch'){
  const scene=rainLunchView(state),last=scene?.last??{};
  app.innerHTML=page('비 오는 점심시간',`${last.player?`<p data-voice="김태이">${esc(last.player)}</p>`:''}${last.text?`<p data-voice="${esc(nameOf(lunchEpisode(state).person))}">${narrative(last.text)}</p>`:''}${last.narration?`<p>${narrative(last.narration)}</p>`:''}<div class="actions">${scene?.options.map(o=>btn(o.label,'lunchAction',o.id)).join('')??''}</div>`,'place');
 }
 if(screen==='supplyAftermath'){
  const scene=supplyAftermathScene(state),record=activeSupplyAftermath(state);
  app.innerHTML=page('이어지는 시간',scene?`${scene.last?`<p data-voice="김태이">${esc(scene.last.player)}</p><p data-voice="${esc(nameOf(record.person))}">${narrative(scene.last.text)}</p>`:''}<p>${scene.completed?'서로의 다음 일정 전에 짧은 시간을 마무리한다.':narrative(scene.prompt)}</p><div class="actions">${scene.completed?btn('각자 하던 일로 돌아간다.','leaveSupplyAftermath'):scene.choices.map(c=>btn(c.label,'stepSupplyAftermath',c.id)).join('')}${!scene.completed?btn('지금은 여기까지 하고 다음 일을 본다.','leaveSupplyAftermath'):''}</div>`:'<p>함께 진행하던 일이 없습니다.</p>','place');
 }
 if(screen==='cafeOrder'){
  const view=cafeOrderView(state),active=view.active?.day===state.day?view.active:null,draft=view.draft,drink=cafeMenu.find(d=>d.id===draft?.drink);
  let body='';
  if(active?.status==='ready')body=`<p>${esc(active.text)}</p><p>주문한 ${esc(active.name)}이 준비됐다. 번호와 음료를 확인하고 받는다.</p><div class="actions">${btn('수령대에서 주문한 음료를 받는다.','cafeCollect')}</div>`;
  else if(active?.status==='collected'&&!draft)body=`<p>${esc(active.name)}을 받았다. 다른 사람의 테이블 대신 빈자리를 찾아 쉬거나 음료를 가지고 이동할 수 있다.</p><div class="actions">${btn('빈자리를 확인하고 음료를 마신다.','cafeDrink')}${btn('음료를 가지고 하던 일로 돌아간다.','go','place')}</div>`;
  else if(draft&&!draft.temperature)body=`<p>${esc(drink.name)} · ${drink.price.toLocaleString()}원. 어떻게 준비해 달라고 할까?</p><div class="actions">${btn('따뜻하게 부탁한다.','cafeTemperature','hot')}${btn('얼음을 넣어 달라고 한다.','cafeTemperature','iced')}${btn('아직 주문하지 않고 메뉴를 다시 본다.','cafeCancel')}</div>`;
  else if(draft)body=`<p>${draft.temperature==='iced'?'아이스':'따뜻한'} ${esc(drink.name)} 한 잔 · ${drink.price.toLocaleString()}원. 주문하면 결제 내역이 남고 준비하는 동안 몇 분이 지난다.</p><div class="actions">${btn('결제하고 음료가 준비되기를 기다린다.','cafePay')}${btn('결제하지 않고 메뉴를 다시 본다.','cafeCancel')}</div>`;
  else body=`<p>${active?.status==='drunk'?'컵을 정리한 뒤 메뉴판을 다시 본다.':'주문대 앞에서 메뉴판과 줄을 확인한다.'} 음료를 고른 뒤 온도를 정하고 주문할 수 있다.</p>${state.clock.minute>=1260?'<p>오늘 주문은 마감했다.</p>':`<div class="actions">${cafeMenu.map(d=>btn(d.name+' · '+d.price.toLocaleString()+'원','cafeChoose',d.id)).join('')}</div>`}`;
  app.innerHTML=page('카페 주문대',body+`<div class="actions">${btn('지금은 주문대를 떠난다.','go','place')}</div>`,'place');
 }
 if(screen==='everydayEvent'){const event=everydayEventView(state);app.innerHTML=page('잠깐 생긴 일',event?`<p>${narrative(event.text)}</p><div class="actions">${event.choices.map(c=>btn(c.label,'everydayChoice',c.id)).join('')}</div>`:'<p>주변은 다시 조용해졌다.</p>','place');}
 if(screen==='communityActivity'){const record=currentCommunityActivity(state),def=record?communityActivityDefinitions[record.postId]:null,stage=communityActivityStage(state);app.innerHTML=page(def?.title??'공개 활동',record?`${record.last?`<p data-voice="김태이">${esc(record.last.player)}</p><p ${def.physical?'':`data-voice="${esc(record.last.speaker)}"`}>${narrative(record.last.text)}</p>`:`<p>${narrative(record.supplyGroup?supplyIntro(state):def.intro)}</p>`}${stage?`<p>${narrative(stage.prompt)}</p><div class="actions">${stage.choices.map(c=>btn(narrative(c.label),'eventStep',c.id)).join('')}${btn('여기까지 하고 잠깐 나온다.','eventPause')}</div>`:`<p class="lead">${narrative(record.result??'공개 활동을 마쳤다.')}</p><p>실제로 참여한 시간 ${record.spent}분. 가입 여부와 다음 약속은 직접 결정할 수 있다.</p><div class="actions">${def.club?btn('동아리 안내를 읽어본다.','clubDetail',def.club):''}${btn('현장을 나와 주변을 둘러본다.','eventLeave')}</div>`}`:'<p>이어갈 활동이 없습니다.</p>','campus');}
 if(screen==='communityPost'&&selectedPost){const p=visibleCommunityPosts(state).find(p=>p.id===selectedPost);if(p)app.innerHTML=page(p.board,`<article class="community-detail"><p class="post-meta">${esc(p.author)} · ${p.day===state.day?'오늘':p.day+'일차'}${p.kind==='anonymous'?' · 작성자·내용 미확인':''}</p><h2>${esc(p.title)}</h2><p>${esc(p.body)}</p>${p.kind==='anonymous'?'<p class="source-note">익명 작성자의 글입니다. 직접 본 일이나 공식 안내와 구분해 기억합니다.</p>':''}</article><div class="dialogue-options">${p.club?btn('이 글의 모집 안내를 자세히 읽는다.','clubDetail',p.club):''}${communityActivityDefinitions[p.id]?btn('이 공개 활동을 자세히 살펴본다.','communityEventView',p.id):''}${p.id==='ambulance-post'?btn('지나갈 일이 있는 카페 쪽에서 직접 확인해본다.','visit','cafe'):''}</div><div class="community-live" aria-live="polite"></div>${` <h3>댓글 ${p.comments.length}</h3>${p.comments.map(c=>`<p class="community-comment ${c.reply?'reply':''}"><strong>${typeof c==='string'?'익명':esc(c.author)}</strong>${esc(typeof c==='string'?c:c.text)}</p>`).join('')}`}`, 'community');}
 if(screen==='travel')app.innerHTML=page('캠퍼스 이동',travelPage());
 if(screen==='opening'){
  const v=returningOpeningView(state);
  app.innerHTML=`<section class="opening-stage scene-visual"><nav class="vn-toolbar opening-tools" aria-label="시작 메뉴">${btn('저장 · 불러오기','openQuick')}</nav><header class="opening-heading"><small>복학을 앞두고</small><h1>다시, 캠퍼스로</h1></header><div class="portrait opening-taei" data-actor="taei" style="--column:0;--expression:0" role="img" aria-label="캠퍼스로 돌아온 김태이"></div><article class="opening-panel"><p class="opening-speaker">${v.speaker?esc(v.speaker):'익숙한 길, 낯선 시작'}</p><p class="opening-copy">${esc(v.text)}</p><footer><span class="opening-progress" aria-label="이야기 ${v.step+1} / ${v.total}">${Array.from({length:v.total},(_,n)=>`<i class="${n<=v.step?'read':''}"></i>`).join('')}</span><button data-action="openingNext">${v.last?'휴대폰에서 수강 계획을 확인한다.':'계속 읽기 · Space'}</button></footer></article></section>`;
 }
 if(screen==='enrollment'){
  const all=registrationCatalog(state),selected=all.filter(c=>registrationDraft.includes(c.registrationId)),fixed=selected.filter(c=>c.required),generals=selected.filter(c=>c.category==='general'),available=generalCourseOptions(state,registrationDraft),errors=registrationProblems(state,registrationDraft),credits=selected.reduce((n,c)=>n+c.credits,0);
  const courseCard=c=>`<article class="general-course"><div><span>${days[c.day].weekday} ${schoolTime(c.start)}–${schoolTime(c.end)} · ${c.credits}학점</span><h3>${esc(c.name)}</h3><p>${esc(classPlace(c))}</p></div><button data-action="courseToggle" data-value="${c.registrationId}" aria-pressed="${registrationDraft.includes(c.registrationId)}" ${registrationLocked(state,c)?'disabled':''}>${registrationDraft.includes(c.registrationId)?'빼기':'추가'}</button></article>`;
  app.innerHTML=`<section class="registration-page"><header class="registration-header"><span>김태이 · 복학생 수강신청</span><h1>공강에 어떤 수업을 넣을까?</h1><p>필수 수업 ${fixed.length}개는 이미 신청됐어요. 빈 시간에 들을 교양만 골라보세요.</p></header><div class="registration-summary"><strong>${credits}<small> / 18학점</small></strong><span>필수 신청 완료 · 교양 ${generals.length}개 선택</span></div>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}${errors.map(x=>`<p class="notice">${esc(x)}</p>`).join('')}<div class="registration-layout"><section class="registration-board"><h2>나의 주간 시간표</h2><p class="registration-legend"><span>● 필수 · 변경 불가</span><span>● 선택한 교양</span></p><div class="week-scroll" tabindex="0" aria-label="월요일부터 금요일 시간표. 좁은 화면에서는 가로로 이동할 수 있습니다."><div class="week-grid"><div class="week-hours"><strong>시간</strong><div>${Array.from({length:8},(_,n)=>`<span style="top:${n*48}px">${n+9}:00</span>`).join('')}</div></div>${[1,2,3,4,5].map(day=>`<div class="week-day"><strong>${days[day].weekday.slice(0,1)}</strong><div class="week-day-body">${selected.filter(c=>c.day===day).map(c=>`<article class="week-course ${c.required?'fixed':'elective'}" style="top:${(c.start-540)/60*48}px;height:${(c.end-c.start)/60*48-3}px"><b>${esc(c.name)}</b><small>${schoolTime(c.start)}–${schoolTime(c.end)}</small><small>${esc(c.required?'신청 완료':'교양')}</small></article>`).join('')}</div></div>`).join('')}</div></div><p class="week-hint">월~금 수업은 둘째 주에도 반복돼요. 주말에는 정규 수업이 없어요.</p></section><section class="registration-electives"><h2>추가할 수 있는 교양 <small>${available.length}</small></h2><p>현재 시간표와 겹치지 않고 남은 학점에 맞는 수업만 보여요.</p><div class="general-options">${available.map(courseCard).join('')||'<p class="empty-courses">지금 추가할 수 있는 교양이 없어요. 선택한 교양을 빼면 다른 수업을 볼 수 있어요.</p>'}</div><h2>선택한 교양</h2>${generals.map(courseCard).join('')||'<p class="empty-courses">아직 없어요. 교양을 추가하지 않고 시작해도 괜찮아요.</p>'}</section></div><footer class="registration-footer"><p>필수 수업은 그대로 유지돼요.</p><button data-action="courseConfirm" ${errors.length?'disabled':''}>${state.academics.registrationPending?'이 시간표로 학교생활 시작':'시간표 변경 확정'}</button>${!state.academics.registrationPending?btn('변경하지 않고 돌아가기','courseCancel'):''}</footer></section>`;
 }
 if(screen==='timetable')app.innerHTML=page('시간표 · 출석',`<p>${timeLabel()}</p><p class="muted">수업 참석 여부도 직접 정할 수 있습니다. 다른 활동을 해도 진행되며, 실제 참석 여부에 따라 지각·결석이 기록됩니다.</p>${[state.day,...schoolDays.filter(d=>d!==state.day)].map(day=>`<details class="timetable-day" ${day===state.day?'open':''}><summary>${day===state.day?'오늘 · ':''}${day}일차 · ${days[day].weekday}${days[day].weekend?' · 주말 자유시간':''}</summary>${timetable(state,'taei',day).map(c=>`<article class="list"><strong>${esc(c.name)} · ${schoolTime(c.start)}~${schoolTime(c.end)}</strong><p>${esc(classPlace(c))}</p><p>${day<state.day?(classStatuses[state.academics.records[c.key]?.status]??'기록 없음'):day>state.day?'예정':classStatuses[lessonStatus(state,c)]}</p>${day===state.day&&state.clock.minute<c.end&&!state.academics.records[c.key]?btn('수업 장소로 간다.','classTravel',c.key):''}</article>`).join('')||'<p class="empty-state">정규 수업이 없는 날이에요. 자유롭게 학교생활을 보낼 수 있어요.</p>'}</details>`).join('')}`,'phone');
 if(screen==='classLesson'){const c=timetable(state).find(c=>c.key===state.academics?.lesson);app.innerHTML=page(c?.name??'수업',c?`<p class="lead">${esc(classPlace(c))}</p><div class="story-prose">${readableText(c.topic)}</div><p class="muted">${schoolTime(c.start)}~${schoolTime(c.end)} · ${state.clock.minute<c.start?'시작 전까지 준비한 뒤 수업을 듣습니다.':state.clock.minute>c.start?'늦게 들어가면 실제 참석 시각에 따라 지각 또는 일부 참석으로 기록합니다.':'수업을 끝까지 듣습니다.'}</p><div class="dialogue-options">${c.choices.map(a=>btn(a.label,'classChoice',a.id)).join('')}</div>`:'<p>수업 장소와 시간을 다시 확인해 주세요.</p>','place');}
 if(screen==='buildingDirectory'){
  const b=campusBuildings[atPlace()],floor=buildingFloorView?.place===atPlace()?buildingFloorView.floor:null;
  const hasRooms=b?.areas?.some(a=>a.number),areas=(b?.areas??[]).filter(a=>!floor||roomFloorLabel(a)===floor);
  app.innerHTML=page((b?.name??'건물')+' · '+(floor??'내부 안내'),`<p class="muted">${esc(floor?floor+' 안내에서 갈 곳을 고른다.':'입구 안내에서 층을 고른다.')}</p><div class="actions">${hasRooms&&!floor?roomFloorList(b).map(f=>btn(f+' 안내를 본다.','buildingFloor',f)).join(''):areas.map(a=>btn(a.name+(a.kind==='classroom'?' · '+roomUseLabel(state,atPlace(),a.id):''),'buildingArea',a.id)).join('')}${floor?btn('다른 층 안내를 본다.','buildingFloor',''):''}</div>`,'place');
 }
 if(screen==='place'){
  const here=atPlace();
  app.innerHTML=page(locations[here],`<p class="lead">${timeLabel()}</p><p class="muted">${narrative((surroundingsAtmosphere(state)||buildingAtmosphere(state,here)||(here==='library'?libraryAtmosphere(state):placeAtmosphere(state,here)))||{hall:'복도에는 물품 상자와 활동 안내문이 놓여 있다. 안쪽에서 종이를 넘기는 소리가 들린다.',library:'책장을 넘기는 소리와 낮은 대화가 들린다. 사람들은 각자 하던 일을 이어간다.',cafe:'주문을 부르는 목소리가 들린다. 창가의 햇빛이 조금 길어졌다.'}[here])}</p><p class="weather-scene">${weatherAtmosphere(state,here)}</p>${riskScene(state,here)?`<p class="muted">${narrative(riskScene(state,here))}</p>`:''}<div class="actions">${campusBuildings[here]?.areas?btn('층·호실 안내 보기','go','buildingDirectory'):''}${here==='hall'?Object.entries(state.clubApplications??{}).filter(([,a])=>a.status==='submitted').map(([id])=>btn(clubs[id].name+' 모집 담당자에게 말을 건다.','openInterview',id)).join(''):''}${fortnightActivityView(state)?btn('! '+fortnightActivityView(state).title+' · 잠깐 해본다.','openFortnight'):''}${personalEventsAt(state).map(e=>btn('! '+e.title+(e.resuming?' · 이어서 하기':e.person==='taei'?' · 작업 시작':' · 상황 살펴보기'),'openPersonalEvent',e.eventId)).join('')}${mapEventsAt(state,here).filter(e=>e.kind==='public').map(e=>btn('! '+e.title+' · 참여 안내','knownPublicEvent',e.id)).join('')}${neighborhoodEventsAt(state).map(e=>btn('! '+e.title+' · 상황 살펴보기','openNeighborhood',e.id)).join('')}${surroundingsActions(state).map(a=>btn(a.label+' · '+a.minutes+'분','surroundingsAction',a.id)).join('')}${shopView(state)?btn('매장 메뉴와 가격을 확인한다.','openShop'):''}${state.clock.minute<1320?buildingActions(state,here).map(a=>btn(a.label+(a.meal?' · 5,000원':''),'buildingActivity',a.id)).join(''):''}${here==='library'&&state.clock.minute<1320?libraryActivities.map(a=>btn(a.label,'libraryActivity',a.id)).join(''):''}</div><div class="actions">${visibleSpatialActions(state,placeActions[here]??[]).map(a=>btn(a.label,'walk',a.id)).join('')}</div><div class="actions">${state.appointments.filter(a=>a.kind==='supply-followup'&&a.status==='pending'&&a.day===state.day&&a.location===here&&Math.abs(state.clock.minute-a.minute)<=15&&presentPeople(state,here).includes(a.person)).map(a=>btn(nameOf(a.person)+'과 약속한 짧은 시간을 함께한다.','startSupplyAftermath',a.person)).join('')}${outdoorActivities(state).map(c=>btn(c.label+' · '+c.minutes+'분','outdoorActivity',c.id)).join('')}${onsiteCommunityActivities(state).map(c=>btn(narrative(c.label),'onsiteEvent',c.id)).join('')}${placeContinuations(state,here).map(c=>btn(narrative(c.label),c.action,c.value)).join('')}${evening?btn(state.day<14?'자취방으로 돌아가 하루를 마친다.':'지난 며칠의 기록을 떠올린다.','go','dayEnd'):''}${state.clock.minute<1320?btn('잠시 쉬며 시간을 보낸다','wait'):''}</div>`);
 }
 if(screen==='encounter'&&encounter){
  app.innerHTML=page(locations[atPlace()],`<p class="muted">${timeLabel()}</p><p class="lead">${narrative(encounter.text)}</p><div class="dialogue-options">${btn(narrative(encounter.action),'encounter','engage')}${btn('하던 일을 계속하며 지나간다.','encounter','pass')}</div>`);
 }
 if(screen==='warningScene'&&warningScene)app.innerHTML=page(locations[atPlace()],`<p class="muted">${timeLabel()}</p><p class="lead">${narrative(warningScene.text)}</p><div class="dialogue-options">${btn(narrative(warningScene.action),'warningChoice','inspect')}${btn('더 확인하지 않고 원래 가던 길로 돌아간다.','warningChoice','pass')}</div>`,'place');
 if(screen==='warningShare')app.innerHTML=page('어떤 일을 이야기할까',`<p class="muted">직접 본 것과 전달받은 내용을 구분해 말합니다. 말하지 않은 내용은 상대가 자동으로 알지 못합니다.</p><div class="dialogue-options">${state.warnings.evidence.map(e=>btn(narrative(e.label)+`<small>${narrative(e.source)}</small>`,'shareWarning',e.key)).join('')}</div>`,'dialogue');
 if(screen==='observations')app.innerHTML=page('확인한 일',`<p class="muted">직접 본 것, 안내문에 적힌 내용, 다른 사람에게 들은 내용을 구분해 기록합니다. 같은 원인이라고 단정할 근거는 아직 없습니다.</p>${(state.warnings?.evidence??[]).map(e=>`<article class="list"><strong class="information-text">${narrative(e.label)}</strong><p class="muted">${e.day}일차 · ${e.kind==='direct'?'직접 목격':e.kind==='notice'?'안내 확인':'전해 들음'} · ${narrative(e.source)}</p><p>${narrative(e.detail)}</p></article>`).join('')||'<p>아직 따로 기록한 일이 없습니다.</p>'}`,'phone');
 if(screen==='dialogue'){
  const d=dialogue(state,speaker),p=people[speaker],riskReply=reply?.riskEscort||reply?.riskReport;
  const riskOptions=reply?.riskEscort?(reply.willing?btn('같이 현장 안내를 확인하러 간다.','select','checkCampus'):btn('알겠어요. 맡은 일 먼저 마무리해요.','resumeConversation'))+btn('약속과 일정 확인','go','schedule')+btn('남은 이야기를 이어간다','resumeConversation'):reply?.riskReport?(!evening?btn('안내 확인에 동행 제안하기','requestEscort',speaker):'')+btn('알려줘서 고마워요. 남은 이야기 마저 해요.','resumeConversation')+btn('이야기를 마치고 돌아간다','go','place'):'';
  const invitation=reply?.choice==='invite'&&!state.appointments.some(a=>a.person===speaker&&a.status==='pending');
  app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','place')}${btn('휴대폰','phone')}<span class="badge">${timeLabel()} · ${locations[atPlace()]}</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${esc(nameOf(screen==='group'?line.person:speaker))}</p>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}<p class="muted">${narrative(reply?.stage??d.stage)}</p>${reply?.socialNews?`<p class="heard-report"><span>전해 들은 이야기</span>${narrative(reply.socialNews)}</p>`:''}${reply?.playerLine?`<p class="player-line"><span>김태이</span>${narrative(reply.playerLine)}</p>`:''}<blockquote>${esc(normalizeNpcAddress(state,speaker,reply?.text??d.opening))}</blockquote>${reply?.followup?`<p class="inner-line">${esc(reply.followup)}</p>`:''}<div class="dialogue-options">${invitation?btn('내일 같이 하기로 약속한다','acceptAppointment',speaker):''}${riskReply?riskOptions:d.options.map(o=>btn(narrative(o.label),'answer',o.id)).join('')}</div>${!riskReply?`<div class="actions">${personalEventsAt(state).some(e=>e.person===speaker)?btn('! '+personalEventsAt(state).find(e=>e.person===speaker).title,'openPersonalEvent',personalEventsAt(state).find(e=>e.person===speaker).eventId):''}${canDiscussSupplyAftermath(state,speaker)?btn('함께했던 일을 바탕으로 잠깐 시간을 보내자고 한다.','startSupplyAftermath',speaker):''}${canAskSupplyReport(state,speaker)?btn('지난 봉사 준비가 어떻게 됐는지 물어본다.','supplyReport',speaker):''}${d.scene?btn('다른 이야기로 넘어가기','endTopic'):''}${state.day<14&&contact(state,speaker).introduced?btn('따로 만날 시간 물어보기','suggestMeeting',speaker):''}${state.day===3&&(state.warnings?.evidence?.length??0)>0?btn('주변에서 접한 일 이야기하기','warningTalk',speaker)+(!evening?btn('안내 확인에 동행 제안하기','requestEscort',speaker):''):''}${btn('이야기를 마치고 하던 일로 돌아간다.','go','place')}</div>`:''}</article></div></section>`;
 }
 if(screen==='group'){
  const line=groupLines[groupIndex],p=people[line.person],end=groupIndex===groupLines.length-1;
  app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','place')}${btn('휴대폰','phone')}<span class="badge">${timeLabel()} · 함께 나누는 대화</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${esc(nameOf(screen==='group'?line.person:speaker))}</p><p class="muted">${narrative(`${nameOf('seoyeon')}과 ${nameOf('soyul')}이 휴대폰의 사진을 함께 보고 있다.`)}</p><blockquote>${esc(line.text)}</blockquote><div class="dialogue-options">${!end?btn('다음 대화','groupNext'):groupAnswered?btn('대화 마치기','go','place'):[btn('천천히 골라요. 아직 시간 있어요.','groupAnswer','wait'),btn('나도 같이 봐도 돼요?','groupAnswer','include'),btn(contact(state,'seoyeon').nameLevel==='unknown'?'옆에 있는 분이 먼저 골라주면 빠르겠네.':'서연 씨가 먼저 골라주면 빠르겠네.','groupAnswer','speakFor')].join('')}</div></article></div></section>`;
 }
 if(screen==='detail'&&selected){const r=routes.find(r=>r.id===selected);if(r)app.innerHTML=page(r.name,`<p class="lead">${narrative(r.description)}</p>${r.weatherNote?`<p class="weather-note">${esc(r.weatherNote)}</p>`:''}<p>소요 시간: ${duration(r.duration)} · 지금 시작하면 ${String(Math.floor((state.clock.minute+r.duration)/60)).padStart(2,'0')}:${String((state.clock.minute+r.duration)%60).padStart(2,'0')}에 마칩니다.</p>${classConflicts(state,r.duration).map(c=>`<p class="notice">수업과 겹칩니다: ${esc(c.name)} (${schoolTime(c.start)}~${schoolTime(c.end)}). 계속하면 지각하거나 결석할 수 있습니다.</p>`).join('')}${eventApproaches(state,selected).length?`<h2>어떻게 참여할까?</h2><div class="dialogue-options">${eventApproaches(state,selected).map(o=>`<button data-action="plan" data-value="${o.id}" aria-pressed="${(state.eventState?.plans?.[`${state.day}:${selected}`]??'listen')===o.id}">${o.label}</button>`).join('')}</div>`:''}<p class="muted">시간은 실제로 들인 만큼 흐릅니다. 마친 뒤에도 자유롭게 행동하거나 귀가할 수 있습니다.${selected!=='volunteer'&&Object.values(state.dialogue.promises).includes('pending')?' 봉사 참석 약속이 남아 있습니다. 시간을 맞출 수 있는지 확인해 주세요.':''}</p>${pending().filter(a=>a.day===state.day&&a.activity!==selected).map(a=>`<p class="notice">${esc(a.person?nameOf(a.person):clubs[a.club]?.name??'동아리')}과 한 ${a.label} 약속도 남아 있습니다. 이 일을 마친 뒤 시간을 맞출지, 미리 연락할지 확인해 주세요.</p>`).join('')}<div class="actions">${btn(classConflicts(state,r.duration).length?'수업과 겹치는 것을 알고 활동 진행':'이 활동 진행','act',selected)}${btn('아직 시작하지 않고 돌아간다.','cancelActivity')}</div>`,activityReturn,'cancelActivity');}
 if(screen==='result')app.innerHTML=page('활동 완료',`<p class="scene-caption">오늘의 활동 결과</p><p class="lead">${narrative(state.lastResult)}</p><p class="muted">${state.minutes}분을 보냈습니다. 다음 행동은 직접 정할 수 있습니다.</p><div class="actions">${btn('건물 밖으로 나와 주변을 둘러본다.','go','campus')}${btn('정리 중인 자유관 쪽으로 돌아간다.','visit','hall')}${btn(state.day<14?'하루 마무리하기':'두 주의 기록 보기','go','dayEnd')}</div>`);
 if(screen==='phone')app.innerHTML=page('휴대폰',phoneHomeBody(),returnTo);
 if(screen==='weather')app.innerHTML=page('날씨와 예보',`<p class="lead">${weatherNow(state).icon} ${weatherNow(state).name} · ${weatherNow(state).temperature}°C</p><p>${weatherAtmosphere(state)}</p><p class="muted">다가오는 날씨를 확인하고 활동과 준비물을 정해 보세요.</p><h2>다가오는 날씨</h2>${forecastDays(state.day).map(day=>`<article class="list"><strong>${day===state.day?'오늘':day+'일차'} · ${days[day].weekday}</strong><p>오후 ${weatherNow(state,day,'afternoon').icon} ${weatherNow(state,day,'afternoon').name} · 저녁 ${weatherNow(state,day,'evening').name}</p></article>`).join('')}<h2>오늘의 준비</h2><p class="${hasUmbrella(state)?'item-text':'muted'}">${hasUmbrella(state)?'대여 우산을 가지고 있습니다. 비가 올 때 일반 이동·탐색의 추가 시간을 줄입니다.':'자유관 공용 대여대에서 우산을 빌릴 수 있습니다. 비를 맞지 않으려고 기다리는 시간을 줄일 수 있습니다.'}</p><p class="muted">우산 없이 비 오는 날 야외를 오간 경우 행동 묶음은 약 40분(강한 비 45분), 우산이 있거나 실내에만 머문 경우 약 30분입니다. 짧은 답변마다 시간을 차감하지 않습니다. 야외 활동에도 준비 상태를 반영합니다. 강한 비의 야외 활동 제한은 우산으로 해제되지 않습니다.</p>${state.location==='hall'?btn(hasUmbrella(state)?'대여 우산 반납하기':'공용 우산 빌리기',hasUmbrella(state)?'returnUmbrella':'borrowUmbrella'):'<p class="muted">우산 대여·반납은 자유관에서 할 수 있습니다.</p>'}`,weatherReturn,'closeWeather');
 if(screen==='schedule')app.innerHTML=page('약속과 기록',`<p>${timeLabel()}</p><p class="muted">직접 잡거나 수락한 약속을 확인합니다. 약속이 없는 시간은 자유롭게 보낼 수 있습니다.</p><h2>약속</h2>${commitments()}<h2>오늘 한 일</h2>${(state.freeDay?.completed??[]).map(x=>`<div class="list">${esc(days[state.day].routes[x.id]?.name??x.id)} · ${x.activeMinutes??x.end-x.start}분</div>`).join('')||'<p class="muted">아직 기록된 긴 활동이 없습니다. 주변을 둘러보며 자유롭게 시작할 수 있습니다.</p>'}`,'phone');
 if(screen==='clubs')app.innerHTML=page('동아리 살펴보기',`<p class="muted">${Object.keys(state.memberships??{}).length?'가입한 동아리와 다른 곳의 안내를 확인할 수 있습니다.':'복학 후 아직 가입한 동아리는 없습니다. 관심 있는 곳에 신청하고 현장 면접을 볼 수 있습니다.'} 가입과 활동 참석은 별개입니다.</p><div class="grid">${Object.entries(clubs).map(([id,c])=>`<button class="card" data-action="clubDetail" data-value="${id}"><strong>${esc(c.name)}</strong>${state.memberships?.[id]?'가입 중':'모집 안내 보기'} · ${esc(c.place)}</button>`).join('')}</div>`);
 if(screen==='clubDetail'&&clubs[selectedClub]){const c=clubs[selectedClub];app.innerHTML=page(c.name,`<p class="lead">${esc(c.description)}</p><p>주요 활동 장소 · ${esc(c.place)}</p><p class="muted">신청서 제출 후 자유관 현장 면접과 결과 안내를 거쳐 가입합니다. 가입하면 예정된 공개 활동을 약속 제안으로 안내받습니다. 수락해야 참석 약속이 됩니다. 공개 체험 활동은 가입 전에도 참여할 수 있습니다.</p>${state.memberships?.[selectedClub]?'<p class="information-text">가입 중입니다. 활동 참석 여부는 휴대폰 일정에서 정할 수 있습니다.</p>':(state.clubApplications?.[selectedClub]?.status==='offered'?btn('안내를 확인하고 가입 의사를 전한다.','joinClub',selectedClub):state.clubApplications?.[selectedClub]?`<p>${esc(clubInterviewView(state,selectedClub)?.text??'신청 처리 중입니다.')}</p>${state.clubApplications[selectedClub].status==='submitted'?btn('면접 장소와 접수 상태 확인','openInterview',selectedClub):''}`:btn('신청서를 작성한다.','openClubApply',selectedClub))}<div class="actions">${btn('약속과 일정 보기','go','schedule')}</div>`,clubReturn);}
 if(screen==='iseoDialogue'){
  const v=iseoPreviewView(iseoAudition),reading=iseoAudition.beat<v.lines.length-1;
  app.innerHTML=page('이서 · 대화 미리보기',`<p class="muted">독립된 대화 시안 · 실제 만남·시간·관계 기록에는 반영되지 않습니다.</p><section class="iseo-conversation"><div class="iseo-talk-art" style="--pose:${v.expression}" role="img" aria-label="이서 · ${['차분함','밝은 미소','쑥스러움'][v.expression]}"></div><div class="iseo-talk-box" aria-live="polite"><strong>${esc(v.name)}</strong><p>${esc(v.lines[iseoAudition.beat])}</p><div class="actions">${reading?btn('다음 · Space','iseoChoice','next'):v.options.map(([id,label])=>btn(label,'iseoChoice',id)).join('')}${!reading&&!v.options.length?btn('다른 대화로 다시 보기','iseoRestart'):''}</div></div></section>`,'characterArt');
 }
 if(screen==='calendar')app.innerHTML=page('복학 후 2주',`<p>정해진 사건을 전부 따라갈 필요는 없습니다. 장소별 활동은 오후에 자유롭게 참여하고, 수업·구매·개인 약속을 함께 진행할 수 있어요.</p>${schoolDays.map(day=>`<article class="list"><strong>${day}일차 · ${days[day].weekday} · ${esc(days[day].title)}</strong><p>${days[day].weekend?'정규 수업 없는 주말':'수업 '+timetable(state,'taei',day).length+'개'}${state.fortnightLife?.[day]?.done?' · 일상 기록 완료':''}</p>${fortnightActivities[day]?`<p>${esc(fortnightActivities[day].title)} · ${esc(locations[fortnightActivities[day].place])}</p>${day===state.day?btn('이 장소로 이동한다.','visit',fortnightActivities[day].place):''}`:''}</article>`).join('')}`,'quickMenu');
 if(screen==='personalEvent'){const e=personalEventView(state),who=e?.person==='taei'?'김태이':e?nameOf(e.person):'';app.innerHTML=page(e?.title??'개인 이벤트',e?`${e.last?`<p data-voice="김태이">${esc(e.last.player)}</p>${e.last.narration?`<p>${narrative(e.last.narration)}</p>`:''}<p data-voice="${esc(who)}">${narrative(e.last.text)}</p>`:`<p>${narrative(e.intro)}</p><p data-voice="${esc(who)}">${narrative(e.opening)}</p>`}${e.result?`<p>${narrative(e.result)}</p>`:''}<p class="scene-caption personal-event-progress">${e.status==='completed'?'기록에 남겼어요. 완료한 개인 이벤트는 반복하지 않아요.':e.stage?'남은 이야기와 마무리 · 20분':'첫 선택 10분 + 마무리 20분 · 총 30분'}</p><div class="actions">${e.options.map(o=>btn(o[1],'personalEventChoice',o[0])).join('')}${btn(e.status==='completed'?'각자 하던 일로 돌아간다.':'지금은 여기까지 하고 다음에 이어간다.','pausePersonalEvent')}</div>`:'<p>지금 이어갈 개인 이벤트가 없습니다.</p>','place');}
 if(screen==='neighborhoodEvent'){const e=neighborhoodEventView(state);app.innerHTML=page(e?.title??'지나간 상황',e?`<p class="lead">${esc(e.text)}</p><p class="muted">참여하면 15분 · 지금 지나가면 오늘 같은 상황을 다시 권하지 않아요.</p><div class="actions">${e.choices.map(c=>btn(c[1],'neighborhoodChoice',c[0])).join('')}${btn('이번에는 지나친다.','neighborhoodChoice','pass')}</div>`:`<p>시간이나 장소가 바뀌어 상황이 끝났습니다.</p>${btn('주변으로 돌아간다.','go','place')}`,'place');}
 if(screen==='fortnightActivity'){const v=fortnightActivityView(state);app.innerHTML=page(v?.title??'일상의 기록',v?`<p class="lead">${esc(v.step===0?v.text:state.lastResult)}</p><p>한 단계 15분 · 총 30분, 선택한 결과가 기록에 남습니다.</p><div class="actions">${v.step===0?v.choices.map(c=>btn(c[1],'fortnightChoice',c[0])).join(''):btn('메모와 자리를 정리하며 마친다.','fortnightChoice','finish')}${btn('잠깐 멈추고 주변으로 돌아간다.','go','place')}</div>`:`<p>${esc(state.lastResult)}</p>${btn('주변으로 돌아간다.','go','place')}`,'place');}
 if(screen==='wallet')app.innerHTML=page('소지금',`<h2>${moneyBalance(state).toLocaleString()}원</h2><p class="muted">시제품 시작 자금 100,000원 · 카페와 상점의 결제에 공통으로 사용합니다.</p><h2>구매 내역</h2>${(state.wallet?.ledger??[]).slice().reverse().map(x=>`<article class="list"><strong>${esc(x.label)} · −${x.amount.toLocaleString()}원</strong><p>${x.day}일차 · ${schoolTime(x.minute)}</p></article>`).join('')||'<p>아직 새 결제 기록이 없습니다. 이전 카페 지출은 잔액에 반영됩니다.</p>'}<h2>먹고 마실 소지품</h2>${(state.inventory??[]).filter(x=>x.shopGood&&x.consumable&&x.quantity>0).map(x=>`<div class="list"><strong class="item-text">${esc(x.name)} × ${x.quantity}</strong>${btn('먹거나 마신다. · 5분','consumePurchase',x.id)}</div>`).join('')||'<p>편의점에서 구입한 식음료가 없습니다.</p>'}`,'quickMenu');
 if(screen==='shop'){
  const v=shopView(state),draft=state.shopping?.draft,g=shopGoods[draft?.item];
  app.innerHTML=page(v?.name??'매장',!v?'<p>매장으로 이동해 주세요.</p>':`<p class="lead">소지금 ${moneyBalance(state).toLocaleString()}원</p><p>${schoolTime(v.open)}–${schoolTime(v.close)} · ${v.available?'영업 중':'지금은 영업 시간이 아닙니다.'}</p>${draft?.shop===v.id&&g?`<article class="list"><h2>${esc(g.name)}</h2><p>${g.price.toLocaleString()}원 · ${g.minutes??5}분 · ${g.kind==='item'?'결제 후 소지품에 추가':'결제 후 실제 이용'}</p>${g.kind==='alcohol'?'<p>맥주 한 잔과 안주를 먹으며 머무릅니다. 오늘 술 주문은 한 번만 가능합니다.</p>':''}<div class="actions">${btn('결제하고 이용한다.','shopPay')}${btn('선택을 취소한다.','shopCancel')}</div></article>`:v.available?`<div class="grid">${v.items.map(id=>{const x=shopGoods[id];return `<button class="card" data-action="shopChoose" data-value="${id}" ${x.kind==='item'&&!stockLeft(state,id)?'disabled':''}><strong>${esc(x.name)}</strong>${x.price.toLocaleString()}원 · ${x.kind==='item'?'재고 '+stockLeft(state,id)+'개':(x.minutes+'분')}</button>`;}).join('')}</div>`:''}`,'place');
 }
 if(screen==='characterArt')app.innerHTML=page('캐릭터 일러스트',`<article class="character-art-card"><p class="eyebrow">외형 미리보기</p><h2>정이서</h2><p class="muted">정이서는 운동 시간대의 첫 개인 이벤트에서 만날 수 있어요. 아래 대화 미리보기는 실제 진행과 분리된 시안이에요.</p>${btn('이서와 대화 미리보기','iseoTalk')}<nav class="art-angle-tabs" aria-label="일러스트 방향">${[['front','정면'],['side','측면'],['back','뒷모습']].map(([id,label])=>`<button data-action="artAngle" data-value="${id}" aria-pressed="${artAngle===id}">${label}</button>`).join('')}</nav><div class="iseo-art iseo-art-${artAngle}" role="img" aria-label="정이서 ${artAngle==='front'?'정면':artAngle==='side'?'측면':'뒷모습'} 전신 일러스트"></div></article>`,'quickMenu');
 if(screen==='personalStories')app.innerHTML=page('개인 이야기 기록',`<p class="muted">직접 시작한 이야기만 보여요. 후속편은 앞 이야기를 마친 다음 날부터, 같은 장소에서 다시 만났을 때 열려요.</p>${Object.entries(state.personalEvents?.records??{}).reverse().map(([id,r])=>`<article class="list"><strong>${r.person==='taei'?'김태이':esc(nameOf(r.person))} · ${esc(personalEventDefinition(id)?.title??'이어가던 이야기')}</strong><p>${r.episode??1}번째 이야기 · ${r.status==='completed'?'완료':'진행 중'}</p>${r.result?`<p>${narrative(r.result)}</p>`:'<p>중간 선택을 저장했어요. 같은 장소에서 여유가 있을 때 이어갈 수 있어요.</p>'}${personalEventsAt(state).some(e=>e.eventId===id)?btn('이 이야기 이어가기','openPersonalEvent',id):''}</article>`).join('')||'<p class="empty-state">아직 시작한 개인 이야기가 없어요. 직접 만난 사람과 대화하거나 지도에서 ! 표시를 확인해보세요.</p>'}`,'quickMenu');
 if(screen==='peopleRecord')app.innerHTML=page('알게 된 사람들',Object.entries(state.contacts??{}).filter(([,c])=>c.seen).map(([id,c])=>`<article class="list"><strong>${esc(nameOf(id))}</strong><p>${c.details?.major?esc(c.details.major):'전공은 아직 듣지 못했다.'}</p><p>${c.lastSeen?'마지막으로 본 곳 · '+esc(locations[c.lastSeen.location]??'교내')+' · '+c.lastSeen.day+'일차 '+schoolTime(c.lastSeen.minute):''}</p></article>`).join('')||'<p>아직 따로 기억해둔 사람이 없다.</p>');
 if(screen==='clubApply')app.innerHTML=page('가입 신청서',`<p>${esc(clubs[selectedClub].name)}에 신청하는 이유를 적는다. 제출만으로 가입되는 것은 아니다.</p><div class="actions">${btn('활동에 관심이 있어 배우고 싶다고 적는다.','submitClubApply','interest')}${btn('지금까지 해본 일과 가능한 역할을 적는다.','submitClubApply','experience')}${btn('아직 제출하지 않는다.','go','clubDetail')}</div>`,'clubDetail');
 if(screen==='clubInterview'){const a=state.clubApplications?.[selectedClub],view=clubInterviewView(state,selectedClub),reason=interviewAvailability(state,selectedClub);app.innerHTML=page('동아리 면접',`<p>${esc(a?.status!=='submitted'?(view?.text??'신청서를 먼저 제출해야 한다.'):(reason??view?.text))}</p><div class="actions">${!reason?view.options.map(o=>btn(o.label,'interviewAnswer',o.id)).join(''):''}${a?.status==='submitted'&&state.location==='hall'&&state.buildingArea?.id!==a.room?btn('안내받은 동아리실로 간다.','interviewTravel',selectedClub):''}${btn('지금은 하던 일로 돌아간다.','go','place')}</div>`,'place');}
 if(screen==='messages')app.innerHTML=page('메시지',state.messages.length?state.messages.map(m=>`<article class="list"><strong>${esc(Object.entries(people).find(([,p])=>p.name===m.from)?nameOf(Object.entries(people).find(([,p])=>p.name===m.from)[0]):m.from)} · ${m.day??1}일차</strong><p>${narrative(m.text)}</p>${m.appointmentId?btn('약속 제안 보기','go','schedule'):''}</article>`).join(''):'<p class="muted">새 메시지가 없습니다.</p>','phone');
 if(screen==='discoveries')app.innerHTML=page('알게 된 정보 · 소지품',`<p class="muted">직접 확인하거나 전해 들은 정보와 실제로 보유한 물건을 구분합니다. 보관 위치를 알았다고 물건을 얻은 것은 아닙니다.</p><h2 class="information-text">◇ 알게 된 정보 · ${state.known.length}개</h2>${state.known.map(x=>{const record=(state.discoveries??[]).find(d=>d.kind==='information'&&d.name===x);return `<article class="list"><strong class="information-text">${esc(x)}</strong><p class="muted">${record?`${record.day}일차 · ${record.phase==='evening'?'저녁':'오후'} · ${esc(locations[record.location]??'활동 중')}에 확인`:'이전 진행에서 확인한 정보'}${record?.action?`<br>행동: ${esc(record.action)}`:''}</p></article>`;}).join('')||'<p class="muted">아직 확인한 정보가 없습니다.</p>'}<h2 class="item-text">▣ 소지품</h2>${(state.inventory??[]).map(i=>`<article class="list item-text">${esc(i.name)} × ${i.quantity}</article>`).join('')||'<p class="muted">획득한 아이템이 없습니다.</p>'}`,'phone');
 if(screen==='map')app.innerHTML=page('캠퍼스 지도 · 장소 이동',travelPage(),'phone');
 if(screen==='journal')app.innerHTML=page('지금까지의 기록',[...state.memory].reverse().map(x=>`<div class="list">${narrative(x)}</div>`).join('')||'<p class="muted">아직 기록이 없습니다.</p>','phone');
 if(screen==='dayEnd'){
  const history=[...state.dayHistory,{day:state.day,choice:state.choice,activities:state.freeDay?.completed??[]}];
  app.innerHTML=page(state.day===14?'두 주의 기록':`${state.day}일차 마무리`,!state.freeDay?.home?`<p class="lead">오늘은 집으로 돌아갈까요?</p><p class="muted">지금까지 한 일과 맺은 관계는 남습니다. 귀가한 뒤에도 학교의 일은 이어지며, 남은 약속을 지키지 못할 수 있습니다.${nextLesson(state)?' 남은 수업에 참석하지 않으면 결석으로 기록됩니다.':''}</p><div class="actions">${btn('오늘은 귀가한다.','freeHome')}${btn('아직 학교에 더 머문다.','go','campus')}</div>`:`<p class="lead">집으로 돌아와 오늘을 떠올린다.</p>${history.map(h=>`<div class="list">${h.day}일차 · ${h.activities?.length?h.activities.map(x=>esc(days[h.day].routes[x.id]?.name??x.id)).join(' · '):h.choice?esc(days[h.day].routes[h.choice]?.name??'자유행동'):schoolEnabled(state)?'수업 외 긴 활동 없음':'자유롭게 주변을 둘러봄'}${schoolDaySummary(h.day)}</div>`).join('')}${state.day<14?btn(`${state.day+1}일차 시작하기`,'nextDay'):btn('일지를 펼쳐본다.','go','journal')}`);
 }
 if(screen==='menu')app.innerHTML=page('메뉴',`<div class="save-heading"><span class="utility-overline">SAVE & CONTINUE</span><h2>이야기를 남겨두세요.</h2><p>김태이 · ${timeLabel()}</p></div><div class="grid save-slots">${[1,2,3].map(i=>{let slot=null;try{slot=JSON.parse(localStorage.getItem('campus.slot.'+i));}catch{}return `<article class="list save-slot"><span class="slot-number">0${i}</span><strong>저장 슬롯 ${i}</strong><p>${slot?esc(`${slot.day}일차 · ${schoolTime(slot.clock?.minute??780)} · ${locations[slot.location]??'교내'}`):'아직 저장한 이야기가 없습니다.'}</p><div class="actions">${btn('저장','save',i)}${slot?btn('불러오기','load',i):'<button disabled>불러오기</button>'}</div></article>`;}).join('')}</div><div class="save-restart">${btn('새 게임 시작','go','reset')}<small>다시 시작해도 저장 슬롯은 유지됩니다.</small></div><details class="example-settings"><summary>시제품 비교 설정</summary><p class="muted">관계별 대화 비교 · 아래 버튼은 수업을 마친 1일차 13:00의 관계 예시를 시작합니다. 현재 진행은 초기화되며 저장 슬롯은 유지됩니다.</p><div class="actions">${btn('서먹한 사이','scenario','acquaintance')}${btn('친한 동료','scenario','friend')}${btn('호감이 쌓인 사이','scenario','close')}</div><p class="muted">날씨 비교 예시 · 관계와 저장 슬롯은 초기화하지 않습니다.</p><div class="actions">${Object.entries(weatherTypes).map(([id,w])=>btn(w.name+' 예시','weatherExample',id)).join('')}</div></details>`);
 if(screen==='reset')app.innerHTML=page('새로 시작',`<p>진행을 1일차로 초기화합니다. 기존 저장 슬롯은 유지합니다.</p>${btn('새로 시작','reset')}`,'menu');
 document.body.dataset.weather=weatherNow(state).kind;
 if(screen!=='opening')app.insertAdjacentHTML('afterbegin',`<div class="weather-strip">${btn(`${weatherNow(state).icon} ${weatherNow(state).name} · ${weatherNow(state).temperature}°C · 예보`,'openWeather')}</div>`);
 const feedback=app.querySelector('.scene-feedback')??app;
 const offers=state.appointments.filter(a=>a.status==='offered');if(offers.length&&!['schedule','community','communityPost'].includes(screen))feedback.insertAdjacentHTML('afterbegin',`<section class="invitation-alert">${btn(`약속 제안 ${offers.length}개 확인`,'go','schedule')}<span>수락하기 전에는 참석 약속이 아닙니다.</span></section>`);
 if(paceNotice)feedback.insertAdjacentHTML('afterbegin',`<section class="time-summary" role="status">${esc(paceNotice)}</section>`);
 if(gains.length)feedback.insertAdjacentHTML('afterbegin',`<section class="discovery-notice" aria-label="새로 얻은 정보와 아이템"><div role="status" aria-live="polite">${gains.map(g=>`<p class="${g.kind==='item'?'item-text':'information-text'}"><strong>${g.kind==='item'?'▣ 아이템 획득':'◇ 새 정보'}</strong> · ${esc(g.name)}${g.quantity?` × ${g.quantity}`:''}</p>`).join('')}</div><div class="actions">${btn('정보 · 소지품 확인','go','discoveries')}${btn('확인','dismissDiscoveries')}</div></section>`);
 novelPresentation();
 if(['campus','place'].includes(screen)&&!activeMiniGame()){
  updateOpportunityHints(state);const hint=currentOpportunity(state);
  if(hint)app.insertAdjacentHTML('beforeend',`<aside class="opportunity-hint" aria-label="행동 힌트"><div><span>문득 떠오른 생각</span><strong>${esc(hint.title)}</strong><p>${esc(hint.text)}</p><small>관심이 간다면 · ${esc(locations[hint.place])} · 참여 여부는 직접 결정</small></div><div class="hint-actions">${btn('주변 살펴보기','hintExplore')}${btn('지금은 넘어간다','hintDismiss')}</div></aside>`);
 }

 if(['travel','map'].includes(screen))applyTravelFilter();
 renderActivityMiniGame();
 if(modelPending){const panel=app.querySelector('.vn-panel');if(panel)panel.innerHTML=`<p role="status" aria-live="polite">잠시 말을 고르고 있다…</p><div class="vn-controls">${btn('기다리지 않고 이어가기','skipModel')}</div>`;}
}
app.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b){if(modelPending)return;if(e.target.closest('.vn-copy')&&vnModel&&!vnView.choosing){vnView=advanceNovel(vnView,vnModel.beats.length);drawNovelBeat();}return;}let a=b.dataset.action,v=b.dataset.value;
 if(a==='go'&&utilityScreens.has(v)&&v!==screen&&['quickMenu','phone'].includes(screen)&&!b.dataset.navigationBack){utilityOrigins.set(v,screen);}
 if(a==='hintDismiss'){dismissOpportunity(state);render();return;}
 if(a==='hintExplore'){const hint=currentOpportunity(state);if(!hint){render();return;}travelQuery=locations[hint.place]??'';travelRegion=regionForPlace(hint.place);dismissOpportunity(state);rememberReading();screen='travel';render();return;}
 if(a==='mapRegion'){const target=Object.values(mapRegions[travelRegion].links).includes(v)?v:null;if(target){travelRegion=target;travelQuery='';travelFilter='all';render();app.querySelector('[data-action=mapCurrent]')?.focus({preventScroll:true});}return;}
 if(a==='mapCurrent'){travelRegion=regionForPlace(state.location);travelQuery='';travelFilter='all';render();return;}
 if(a==='travelFilter'){travelFilter=v;applyTravelFilter();return;}
 if(a.startsWith('mini')&&a!=='miniContinue'){handleMiniAction(a);return;}
 if(a==='miniContinue'){const mini=activeMiniGame();if(mini?.phase!=='result')return;a='eventStep';v=mini.choice;}
 else if(!['miniStart','miniHit'].includes(a))freezeActivityMiniGame();
 if(a==='buildingFloor'){const floors=roomFloorList(campusBuildings[atPlace()]);if(v&&!floors.includes(v))return;buildingFloorView=v?{place:atPlace(),floor:v}:null;vnCursors.clear();vnView.key='';render();return;}
 if(a==='skipModel'){modelAbort?.abort();return;}
 if(modelPending)return;
 if(['vnNext','vnPrevious','vnCycle','vnBranch'].includes(a)){
  if(a==='vnNext')vnView=advanceNovel(vnView,vnModel.beats.length);
  if(a==='vnPrevious'){vnView.beat=Math.max(0,vnView.beat-1);vnView.choosing=false;}
  if(a==='vnCycle')vnView.page++;
  if(a==='vnBranch'){vnView.branch=v;vnView.page=0;}
  drawNovelBeat();app.querySelector('.vn-panel')?.focus({preventScroll:true});return;
 }
 if(a==='openQuick'){rememberReading();quickReturn=screen;quickSnapshot={note,reply,paceNotice,view:utilityScreens.has(screen)?null:{...vnView}};screen=quickReturn==='opening'?'menu':'quickMenu';note='';render();window.scrollTo(0,0);return;}
 if(a==='closeQuick'){resumeQuick();return;}
 if(a==='go'&&v==='enrollment'){rememberReading();registrationDraft=[...registeredCourseIds(state)];screen='enrollment';note='';render();return;}
 if(a==='courseToggle'){const c=registrationCatalog(state).find(x=>x.registrationId===v);if(c&&c.category==='general'&&!c.required&&!registrationLocked(state,c)&&(registrationDraft.includes(v)||generalCourseOptions(state,registrationDraft).some(x=>x.registrationId===v)))registrationDraft=registrationDraft.includes(v)?registrationDraft.filter(x=>x!==v):[...registrationDraft,v];render();return;}
 if(a==='openingNext'){state=progressReturningOpening(state);screen=initialReturningScreen(state);render();return;}
 if(a==='courseCancel'){screen='quickMenu';note='';render();return;}
 if(a==='courseConfirm'){try{const firstRegistration=state.academics.registrationPending;state=confirmRegistration(state,registrationDraft);screen='campus';note=firstRegistration?'복학 후 첫 등교. 정해둔 수업과 공강 사이에서 오늘을 시작한다.':'앞으로 들을 수업의 시간표를 변경했다. 이미 지난 수업 기록은 그대로 남는다.';quickReturn=null;quickSnapshot=null;readingSnapshots.clear();}catch(error){note=error.message;}render();return;}
 if(a==='openFortnight'){if(fortnightActivityView(state)){screen='fortnightActivity';render();}return;}
 if(a==='fortnightChoice'){try{state=progressFortnightActivity(state,v);note='';}catch(error){note=error.message;}render();return;}
 if(['openShop','shopChoose','shopPay','shopCancel','consumePurchase'].includes(a)){
  try{if(a==='openShop'){if(!shopView(state))throw new Error('편의점·매점 공간이나 대학가 매장으로 이동해 주세요.');state=cancelShopDraft(state);screen='shop';}
   if(a==='shopChoose'){state=chooseShopItem(state,v);screen='shop';}
   if(a==='shopCancel')state=cancelShopDraft(state);
   if(a==='shopPay'){state=payShopItem(state);note='결제를 마쳤어요. 잔액과 구매·이용 내역에 반영했습니다.';}
   if(a==='consumePurchase'){state=consumeShopItem(state,v);quickReturn=null;quickSnapshot=null;readingSnapshots.clear();quickTool='';note='소지품을 사용하고 잠깐 시간을 보냈어요.';}
  }catch(error){note=error.message;}render();return;
 }
 if(a==='iseoTalk'){iseoAudition=newIseoPreview(iseoAudition.round);screen='iseoDialogue';render();return;}
 if(a==='iseoChoice'){try{iseoAudition=advanceIseoPreview(iseoAudition,v);}catch{}render();return;}
 if(a==='iseoRestart'){iseoAudition=newIseoPreview(iseoAudition.round+1);render();return;}
 if(a==='go'&&(v==='characterArt'||screen==='characterArt'&&v==='quickMenu')){if(v==='characterArt'){rememberReading();quickTool=v;}screen=v;note='';render();window.scrollTo(0,0);return;}
 if(a==='artAngle'){if(['front','side','back'].includes(v))artAngle=v;render();return;}
 if(a==='quickTab'){screen=v==='save'?'menu':'quickMenu';note='';render();return;}
 if(a==='phone'||(a==='go'&&utilityScreens.has(v)))rememberReading();
 if(screen==='quickMenu'&&a==='go'){quickTool=v;if(v==='phone')returnTo='quickMenu';}
 if(['visit','walk','classTravel','act','answer','nextDay','scenario','reset','load','buildingArea','libraryActivity','buildingActivity','classChoice','encounter','freeHome','groupAnswer','eventBegin','eventStep','eventResume','eventPause','eventLeave','cafeChoose','cafeTemperature','cafePay','cafeCollect','cafeDrink','cafeCancel','everydayChoice','resumeEveryday','startSupplyAftermath','stepSupplyAftermath','leaveSupplyAftermath','lunchAction','resumeLunch'].includes(a)){quickReturn=null;quickSnapshot=null;readingSnapshots.clear();quickTool='';}
 if(!['phone','go','openWeather','closeWeather','save','load','dismissDiscoveries','plan','closeCommunity','communityFilter','readPost','applyCommunityUpdates','clubDetail','communityEventView'].includes(a)){vnCursors.clear();vnView.key='';}
 if(['visit','walk','classTravel','act','wait','freeHome','nextDay','buildingActivity','libraryActivity','outdoorActivity','surroundingsAction','shopPay','consumePurchase','cafePay','cafeCollect','cafeDrink','eventBegin','eventResume','lunchAction'].includes(a))state=pausePersonalEvent(state);
 if(['visit','walk','buildingArea','libraryActivity','buildingActivity','classTravel','classChoice','act','wait','freeHome','nextDay','interviewAnswer'].includes(a)){state=pauseCommunityActivity(state);state=interruptRainLunch(state);}
 if(['visit','walk','buildingArea','libraryActivity','buildingActivity','act','eventBegin','eventResume','outdoorActivity','classTravel','classChoice','wait','freeHome','nextDay'].includes(a))pauseSupplyAftermath(state);
 if(['act','eventBegin','eventResume','outdoorActivity','buildingArea','libraryActivity','buildingActivity','classTravel','wait','freeHome','nextDay'].includes(a))state=abandonEverydayEvent(state);
 note='';const before=structuredClone(state);const fromScreen=screen;paceNotice='';try{
 if(a==='openWeather'){if(screen!=='weather')weatherReturn=screen;screen='weather';}
 if(a==='closeWeather')screen=weatherReturn;
 if(a==='go'){if(['travel','map'].includes(v)&&!b.dataset.navigationBack){travelRegion=regionForPlace(state.location);travelQuery='';travelFilter='all';}if(v==='phone'&&screen!=='phone'&&!b.dataset.navigationBack)returnTo=screen;if(screen==='supplyAftermath'&&['place','campus'].includes(v))pauseSupplyAftermath(state);
  if(screen==='everydayEvent'&&['place','campus','travel'].includes(v))state=abandonEverydayEvent(state);
  if(screen==='rainLunch'&&['place','campus'].includes(v))state=interruptRainLunch(state);
  if(v==='buildingDirectory')buildingFloorView=null;
  if(screen==='dialogue'&&v==='place'&&state.dialogue?.sessions?.[`${state.day}:${state.phase}:${speaker}`]?.generated)state=endTopic(state,speaker);
  if(v==='weather')weatherReturn=screen;
  if(v==='community'){if(state.community)state.community.focusPostId=null;if(screen!=='communityPost'&&!(screen==='phone'&&['community','communityPost'].includes(returnTo))){communityReturn=screen;communityPhoneReturn=returnTo;}state=advanceCommunity(markFlow(state,'community'));feedIds=visibleCommunityPosts(state).map(p=>p.id);}
  const records=['timetable','schedule','messages','map','journal','observations','discoveries'];if(records.includes(v)&&screen!=='phone'&&!records.includes(screen))returnTo=screen;
  if(screen==='warningScene'&&warningScene&&!records.includes(v)){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}
  if(screen==='encounter'&&encounter&&!records.includes(v)){state=resolveEncounter(state,encounter,false).state;encounter=null;}
  if(v==='discoveries'&&screen!=='phone'&&screen!=='discoveries')returnTo=screen;
  screen=v;reply=null;if(readingSnapshots.has(v)){const snapshot=readingSnapshots.get(v);note=snapshot.note;reply=snapshot.reply;paceNotice=snapshot.paceNotice??'';vnResumeView=snapshot.view;readingSnapshots.delete(v);}if(v==='messages')state=readMessages(state);
 }
 if(a==='visit'||a==='walk'){state=abandonEverydayEvent(state);
  const destination=a==='walk'?atPlace():v;
  if(!locations[destination])throw new Error('알 수 없는 장소입니다.');
  if(encounter){state=resolveEncounter(state,encounter,false).state;encounter=null;}
  if(warningScene){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}
  if(state.location!==destination)state.buildingArea=null;
  state=markFlow(state,'visit',destination);
  const arrived=arrive(state,destination,a==='walk'?v:'entry');state=arrived.state;encounter=arrived.encounter;warningScene=arrived.warning??null;screen=a==='walk'&&destination==='cafe'&&v==='counter'?'cafeOrder':warningScene?'warningScene':encounter?'encounter':'place';reply=null;note=arrived.observation??'';
 }
 if(a==='openPersonalEvent'){state=beginPersonalEvent(state,v);speaker=personalEventRecord(state).person==='taei'?speaker:personalEventRecord(state).person;screen='personalEvent';}
 if(a==='personalEventChoice'){state=progressPersonalEvent(state,v);screen='personalEvent';}
 if(a==='pausePersonalEvent'){state=pausePersonalEvent(state);screen='place';note='';}
 if(a==='knownPublicEvent'){if(!mapEventsAt(state,state.location).some(e=>e.kind==='public'&&e.id===v))throw new Error('지금 확인할 수 있는 공개 활동이 아닙니다.');selectedCommunityEvent=v;selectedPost=v;screen='communityEvent';}
 if(a==='openNeighborhood'){state=beginNeighborhoodEvent(state,v);screen='neighborhoodEvent';}
 if(a==='neighborhoodChoice'){state=resolveNeighborhoodEvent(state,v);note=state.lastResult;screen='place';}
 if(a==='surroundingsAction'){state=performSurroundingsAction(state,v);note=state.lastResult;screen='place';}
 if(a==='cafeChoose'){state=chooseCafeDrink(state,v);screen='cafeOrder';}
 if(a==='cafeTemperature'){state=setCafeTemperature(state,v);screen='cafeOrder';}
 if(a==='cafePay'){state=payCafeOrder(state);screen='cafeOrder';}
 if(a==='cafeCollect'){state=collectCafeOrder(state);screen='cafeOrder';}
 if(a==='cafeDrink'){state=drinkCafeOrder(state);screen='place';note='빈자리에 앉아 음료를 마시고 컵을 정리했다.';}
 if(a==='cafeCancel'){state=cancelCafeDraft(state);screen='cafeOrder';}
 if(a==='startSupplyAftermath'){
  if(!presentPeople(state,state.location).includes(v))throw new Error('지금 같은 장소에 있는 동료와 시작할 수 있습니다.');
  const result=beginSupplyAftermath(state,v);state=result.state;if(result.ok){state=pauseCommunityActivity(state);state=interruptRainLunch(state);encounter=null;reply=null;screen='supplyAftermath';}else note=result.text;
 }
 if(a==='stepSupplyAftermath'){const minutes=progressSupplyAftermath(state,v);state=advanceFreeTime(state,minutes);state.pace={count:0,seen:{}};screen='supplyAftermath';}
 if(a==='leaveSupplyAftermath'){pauseSupplyAftermath(state);screen='place';reply=null;}
 if(a==='supplyReport'){const result=supplyReport(state,v);state=result.state;reply={text:result.text,playerLine:'“그날 물품 준비는 어떻게 됐어요?”'};screen='dialogue';}
 if(a==='resumeEveryday'){if(!everydayEventView(state))throw new Error('지금 이어갈 상황이 없습니다.');screen='everydayEvent';}
 if(a==='everydayChoice'){const result=resolveEverydayEvent(state,v);state=result.state;note=result.text;screen=result.returnScreen;}
 if(a==='buildingArea'){const result=enterBuildingArea(state,v);state=result.state;note=result.text;screen='place';if(result.destination){state=markFlow(state,'visit',result.destination);const r=arrive(state,result.destination);state=r.state;encounter=r.encounter;note=r.observation??result.text;screen=encounter?'encounter':'place';}}
 if(a==='outdoorActivity'){state=pauseCommunityActivity(state);state=interruptRainLunch(state);const result=outdoorActivity(state,v);state=result.state;note=result.text;screen='place';}
 if(a==='buildingActivity'){const result=buildingActivity(state,v);state=result.state;note=result.text;screen='place';}
 if(a==='libraryActivity'){const result=libraryActivity(state,v);state=result.state;note=result.text;screen='place';}
 if(a==='onsiteEvent'){if(!onsiteCommunityActivities(state).some(c=>c.id===v))throw new Error('현재 공간에서는 참여할 수 없습니다.');state=hearOnsiteActivity(state,v);selectedPost=v;selectedCommunityEvent=v;screen='communityEvent';reply=null;}
 if(a==='communityEventView'){if(!communityActivityDefinitions[v]||!state.flow?.postsRead?.[v])throw new Error('해당 모집글을 먼저 읽어 주세요.');selectedCommunityEvent=v;screen='communityEvent';}
 if(a==='eventBegin'||a==='eventResume'){
  state=interruptRainLunch(state);
  if(encounter){state=resolveEncounter(state,encounter,false).state;encounter=null;}
  if(warningScene){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}
  state=a==='eventBegin'?beginCommunityActivity(state,v):resumeCommunityActivity(state,v);screen='communityActivity';reply=null;
 }
 if(a==='eventStep'){const r=currentCommunityActivity(state);state=needsActivityMiniGame(r)&&!r.mini?queueActivityMiniGame(state,v):progressCommunityActivity(state,v);screen='communityActivity';}
 if(a==='eventPause'||a==='eventLeave'){state=pauseCommunityActivity(state);if(state.activitySessions)state.activitySessions.active=null;screen='campus';reply=null;}
 if(a==='classTravel'){
  const c=timetable(state).find(c=>c.key===v);if(!c||state.clock.minute>=c.end||state.academics.records[v])throw new Error('이미 끝난 수업입니다.');
  if(encounter){state=resolveEncounter(state,encounter,false).state;encounter=null;}
  if(warningScene){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}
  state.location=c.location;state=enterBuildingArea(state,c.area).state;if(!state.known.includes(campusBuildings[c.location].fact))state.known.push(campusBuildings[c.location].fact);state=markFlow(state,'visit',c.location);screen='place';reply=null;note=`${classPlace(c)}에 도착했다. 수업은 ${schoolTime(c.start)}에 시작한다.`;
 }
 if(a==='classPrepare'){const c=timetable(state).find(c=>c.key===v);if(!c||state.location!==c.location||state.buildingArea?.id!==c.area)throw new Error('수업 장소를 확인해 주세요.');state.academics.lesson=v;screen='classLesson';}
 if(a==='classChoice'){const result=attendLesson(state,state.academics.lesson,v);state=result.state;note=result.text;screen='place';}
 if(a==='warningChoice'){const result=finishWarningSite(state,warningScene,v==='inspect');state=result.state;note=result.text;warningScene=null;screen='place';}
 if(a==='resumeConversation')reply=null;
 if(a==='warningTalk'){speaker=v;screen='warningShare';}
 if(a==='shareWarning'){const result=discussWarnings(state,speaker,v);state=result.state;reply=result.result;screen='dialogue';}
 if(a==='requestEscort'){const result=requestEscort(state,v);state=result.state;reply=result.result;}
 if(a==='encounter'){
  const happened=resolveEncounter(state,encounter,v==='engage');state=happened.state;
  if(v!=='engage'){encounter=null;screen='place';}
  else if(happened.rainLunch){screen='rainLunch';reply=null;encounter=null;}
  else if(happened.group){
   groupLines=groupDialogue(state);groupIndex=0;groupAnswered=false;hearGroupLine(state,groupLines[0]);screen='group';encounter=null;
   if(state.day>=2&&!state.known.includes('소율과 여경의 사진 협업')){state.known.push('소율과 여경의 사진 협업');state.memory.push(`[${state.day}일차] 휴게공간을 지나다 서연과 소율의 사진 이야기를 들었다.`);}
  }else {speaker=encounter.person;reply=happened.result;screen='dialogue';encounter=null;}
 }
 if(a==='resumeLunch'){screen='rainLunch';reply=null;}
 if(a==='lunchAction'){const result=rainLunchAction(state,v);state=result.state;screen=result.leave?'place':'rainLunch';reply=null;}
 if(a==='answer'){const next=respond(state,speaker,v);state=next.state;reply=next.result;if(reply.leave){reply=null;screen='place';}}
 if(a==='endTopic'){state=endTopic(state,speaker);reply=null;}
 if(a==='groupNext'){groupIndex++;hearGroupLine(state,groupLines[groupIndex]);}
 if(a==='groupAnswer'){for(const id of ['seoyeon','soyul'])introduce(state,id,'incidental-group-exchange');const next=respondGroup(state,v);state=next.state;for(const id of ['seoyeon','soyul'])state=meetAppointments(state,id);groupLines=next.lines;groupIndex=0;groupAnswered=true;hearGroupLine(state,groupLines[0]);}
 if(a==='acceptAppointment'){state=acceptAppointment(state,v);note='내일 약속을 잡았습니다. 겹치는 약속은 휴대폰 일정에서 확인하고 미리 취소할 수 있습니다.';}
 if(a==='cancelAppointment'){if(activeSupplyAftermath(state)?.offer===v)pauseSupplyAftermath(state);state=cancelAppointment(state,v);note='미리 연락해 약속을 취소했습니다.';}
 if(a==='freeHome'){state=goHome(state);screen='dayEnd';}
 if(a==='nextDay'){state=nextDay(state);screen='campus';reply=null;selected=null;encounter=null;returnTo='campus';}
 if(a==='scenario'){const arrived=arrive(markFlow(newAfternoonScenario(v),'visit','hall'),'hall');state=arrived.state;encounter=arrived.encounter;reply=null;screen=encounter?'encounter':'place';}
 if(a==='phone'&&screen!=='phone'){returnTo=screen;screen='phone';}
 if(a==='borrowUmbrella'){state=borrowUmbrella(state);note='공용 우산을 빌렸습니다. 소지품에 기록했습니다.';}
 if(a==='returnUmbrella'){state=borrowUmbrella(state,true);note='대여 우산을 반납했습니다.';}
 if(a==='weatherExample'){state=setWeatherExample(state,v);for(const [id,place] of Object.entries(currentSchedule(state)))state.npcs[id].location=place;state=weatherAdjustAppointments(state,availableRoutes(state));note='날씨 비교 예시를 적용했습니다.';}
 if(a==='clubDetail'){clubReturn=screen;selectedClub=v;screen='clubDetail';}
 if(a==='openClubApply'){selectedClub=v;screen='clubApply';}
 if(a==='submitClubApply'){state=submitClubApplication(state,selectedClub,v);screen='clubDetail';note='신청서를 제출했다. 접수 확인과 면접 안내를 기다린다.';}
 if(a==='openInterview'){selectedClub=v;screen='clubInterview';}
 if(a==='interviewTravel'){state=enterBuildingArea(state,clubInterviewRooms[selectedClub]).state;screen='clubInterview';}
 if(a==='interviewAnswer'){state=answerClubInterview(state,selectedClub,v);screen='clubInterview';}
 if(a==='joinClub'){state=joinClub(state,v);note='가입했습니다. 남아 있는 활동 제안이 있다면 일정에서 참석 여부를 선택해 주세요.';}
 if(a==='acceptOffer'){state=replyOffer(state,v,true);note='약속을 수락했습니다. 겹치는 일정은 미리 연락해 취소할 수 있습니다.';}
 if(a==='declineOffer'){state=replyOffer(state,v,false);note='정중히 거절했습니다. 수락 전의 거절은 약속 불이행으로 처리하지 않습니다.';}
 if(a==='suggestMeeting'){const result=suggestMeeting(state,v);state=result.state;note=result.accepted?'상대가 수락했습니다. 휴대폰 일정에 기록했습니다.':'상대가 이번에는 어렵다고 답했습니다. 같은 날 다시 조르지는 않기로 합니다.';}
 if(a==='communityFilter'){communityFilter=v;feedIds=visibleCommunityPosts(state).map(p=>p.id);}
 if(a==='applyCommunityUpdates'){feedIds=visibleCommunityPosts(state).map(p=>p.id);visibleCommentCount=visibleCommunityPosts(state).find(p=>p.id===selectedPost)?.comments.length??0;}
 if(a==='closeCommunity'){if(state.community)state.community.focusPostId=null;screen=communityReturn;if(communityReturn==='phone')returnTo=communityPhoneReturn;}
 if(a==='readPost'){state=readCommunityPost(state,v);selectedPost=v;visibleCommentCount=visibleCommunityPosts(state).find(p=>p.id===v).comments.length;screen='communityPost';}
 if(a==='cancelActivity')screen=activityReturn;
 if(a==='select'){if(!availableRoutes(state).some(r=>r.id===v&&!r.locked))throw new Error('지금 진행할 수 없는 일입니다.');if(screen!=='detail')activityReturn=screen;selected=v;screen='detail';}
 if(a==='plan'){state=planEvent(state,selected,v);vnView.branch='main';vnView.page=0;}
 if(a==='act'){if(encounter){state=resolveEncounter(state,encounter,false).state;encounter=null;}if(warningScene){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}if(v==='volunteer'&&usesSupplyStory(state)){state.location='hall';state=beginCommunityActivity(state,'volunteer-recruit');screen='communityActivity';}else{state=freeActivity(state,v);screen='result';}}
 if(a==='save'){localStorage.setItem('campus.slot.'+v,save(state));note=`슬롯 ${v}에 저장했습니다.`;}
 if(a==='load'){utilityOrigins.clear();const raw=localStorage.getItem('campus.slot.'+v);if(!raw)throw new Error('비어 있는 슬롯입니다.');state=warningPhase(restore(raw));registrationDraft=[...registeredCourseIds(state)];if(state.academics?.registrationPending)screen=initialReturningScreen(state);warningScene=null;reply=null;selected=null;encounter=null;note=`슬롯 ${v}을 불러왔습니다.`;}
 if(a==='reset'){state=newReturningGame();registrationDraft=[...registeredCourseIds(state)];screen='opening';selected=null;reply=null;encounter=null;returnTo='campus';}
 if(!['load','reset','scenario','nextDay','act','classChoice','personalEventChoice','openPersonalEvent','pausePersonalEvent','neighborhoodChoice','openNeighborhood','surroundingsAction','eventBegin','eventStep','eventResume','eventPause','eventLeave','communityEventView','knownPublicEvent','onsiteEvent','outdoorActivity','cafeChoose','cafeTemperature','cafePay','cafeCollect','cafeDrink','cafeCancel','everydayChoice','resumeEveryday','startSupplyAftermath','stepSupplyAftermath','leaveSupplyAftermath','lunchAction','resumeLunch'].includes(a)){
  const paced=paceAction(before,state,{action:a,value:v,from:fromScreen,to:screen,person:fromScreen==='group'?'group':speaker});state=paced.state;
  if(paced.minutes)paceNotice=`${a==='wait'?'잠시 쉬고 나니':'여러 일을 마치고 나니'} 어느새 ${clockLabel(state)}. 약 ${paced.minutes}분이 지났다.`;
 }
 if(!['load','save','reset','scenario'].includes(a))state=warningPhase(state);
 if(!['load','save','reset','scenario'].includes(a))state=updateSocialWorld(before,state);
 if(!['load','save','reset','scenario'].includes(a)){state=evolveRisk(state,{allowMove:['place','campus','travel','activities','result'].includes(screen)});for(const [id,place] of Object.entries(currentSchedule(state)))state.npcs[id].location=place;}
 if(!['load','save','reset'].includes(a))state=evaluateInvitations(state);
 if(!['load','save','reset','scenario'].includes(a)){state=advanceCommunity(state);state=settleClubAdmissions(state);}
 if((['buildingActivity','libraryActivity','outdoorActivity','cafeDrink'].includes(a)&&screen==='place')||(a==='act'&&screen==='result')||(a==='eventStep'&&screen==='communityActivity'&&currentCommunityActivity(state)?.status==='completed')){
  const varied=varyEverydayAction(state,{action:v||a,text:note||state.lastResult,minute:before.clock.minute,returnScreen:screen});state=varied.state;note=varied.text;if(screen==='result')state.lastResult=varied.text;if(screen==='communityActivity'){currentCommunityActivity(state).result=varied.text;note='';}
  if(everydayEventView(state))screen='everydayEvent';
 }
 if(a==='dismissDiscoveries')gains=[];
 if(['load','reset','scenario'].includes(a))gains=[];else {const found=recordDiscoveries(before,state,b.textContent.trim());if(found.length)gains=found;}
}catch(err){note=err.message;}
 if(dialogueService.enabled&&screen==='dialogue'&&reply?.generated&&!reply.leave){
  const turnId=reply.turnId,id=speaker;
  const isNew=!before.dialogue?.history?.some(h=>h.generated&&h.person===id&&h.turnId===turnId);
  if(isNew){
   modelPending=true;modelAbort=new AbortController();render();
   try{
    const generatedText=await dialogueService.reply(dialogueServiceContext(state,id,reply),{signal:modelAbort.signal});
    const addressed=generatedText?normalizeNpcAddress(state,id,generatedText):null;
    const text=addressed?(reply.requiredPrefix&&!addressed.startsWith(reply.requiredPrefix)?reply.requiredPrefix+addressed:addressed):null;
    if(text&&applyServiceDialogue(state,id,turnId,text)){reply={...reply,text,source:'server-model'};}
   }finally{modelPending=false;modelAbort=null;}
  }
 }
 render();if(screen!==fromScreen||(note&&storyScreens.has(screen))){window.scrollTo(0,0);const focus=app.querySelector('.vn-panel')??app.querySelector('.story-content > .notice')??app.querySelector('h1');focus?.focus({preventScroll:true});}});
render();

// Background residents continue writing while the game is open. This does not advance Tae-i's clock.
setInterval(()=>{
 if(document.hidden||['menu','quickMenu','reset','characterArt','iseoDialogue','enrollment','opening'].includes(screen))return;
 state=advanceCommunity(state,{ambient:true});
 const live=app.querySelector('.community-live');if(!live)return;
 const count=screen==='community'?visibleCommunityPosts(state).filter(p=>!feedIds?.includes(p.id)&&(communityFilter==='all'||p.kind===communityFilter)).length:Math.max(0,(visibleCommunityPosts(state).find(p=>p.id===selectedPost)?.comments.length??0)-visibleCommentCount);
 live.innerHTML=count?btn(screen==='community'?`새 글 ${count}개 도착 · 확인하기`:`새 댓글 ${count}개 · 확인하기`,'applyCommunityUpdates'):'';
},15000);

app.addEventListener('keydown',e=>{if(modelPending||e.code!=='Space'||e.target.closest('button,input,textarea,select')||!vnModel||vnView.choosing)return;e.preventDefault();vnView=advanceNovel(vnView,vnModel.beats.length);drawNovelBeat();});


function activeMiniGame(){return screen==='communityActivity'?currentCommunityActivity(state)?.mini:null;}
function stopActivityMiniLoop(){if(miniFrame!==null)cancelAnimationFrame(miniFrame);miniFrame=null;miniFrameTime=0;}
function freezeActivityMiniGame(){
 stopActivityMiniLoop();const record=currentCommunityActivity(state);if(record?.mini)record.mini=pauseActivityMiniGame(record.mini);
}
function handleMiniAction(action){
 const mini=activeMiniGame();if(!mini)return;
 const record=currentCommunityActivity(state);
 if(action==='miniSound'){miniSoundEnabled=!miniSoundEnabled;localStorage.setItem('campus.mini.sound',miniSoundEnabled?'on':'off');render();return;}
 if(action==='miniStart')record.mini=startActivityMiniGame(mini);
 if(action==='miniHit'){record.mini=hitActivityMiniGame(mini);if(record.mini.hits.length>mini.hits.length)playMiniFeedback(record.mini.hits.at(-1).score);}
 if(action==='miniPause')record.mini=pauseActivityMiniGame(mini);
 if(action==='miniSkip')record.mini=skipActivityMiniGame(mini);
 render();app.querySelector('.vn-panel')?.focus({preventScroll:true});
}
function renderActivityMiniGame(){
 stopActivityMiniLoop();const mini=activeMiniGame();if(!mini)return;
 const panel=app.querySelector('.vn-panel');if(!panel)return;
 vnModel=null;panel.classList.add('mini-panel');panel.setAttribute('aria-label','활동 미니게임');
 const config=activityMiniConfig(mini),result=mini.phase==='result',last=mini.hits.at(-1),target=mini.targets[Math.min(mini.hits.length,mini.targets.length-1)];
 panel.innerHTML=`<div class="mini-heading"><span class="mini-tag">가벼운 미니게임</span><h2>${config.title}</h2><span>${Math.min(mini.hits.length+1,mini.targets.length)} / ${mini.targets.length}</span></div>
 <div class="mini-attempts" aria-label="입력 결과">${mini.targets.map((_,i)=>`<span class="${mini.hits[i]?(mini.hits[i].score>=85?'perfect':'hit'):''}">${mini.hits[i]?mini.hits[i].score+'점':i+1}</span>`).join('')}${btn(miniSoundEnabled?'소리 켜짐':'소리 꺼짐','miniSound')}</div>
 <p class="mini-instructions">${esc(config.hint)} <kbd>Space</kbd> 또는 아래 버튼</p>
 <div class="mini-gauge" data-kind="${mini.kind}" aria-hidden="true"><div class="mini-target" style="left:${(target-.13)*100}%;width:26%"><span>목표</span></div><div class="mini-marker" data-mini-position style="left:${activityMiniPosition(mini)*100}%"></div></div>
 <div class="mini-scale"><span>${mini.kind==='cooking'?'약한 불':'왼쪽'}</span><span>${config.axis}</span><span>${mini.kind==='cooking'?'센 불':'오른쪽'}</span></div>
 <p class="mini-feedback" role="status" aria-live="polite">${result?(mini.result.mode==='assisted'?'타이밍 조작 없이 기존 활동 방식으로 진행합니다.':activityMiniFeedback(mini.result.score)+' · '+mini.result.score+'점'):mini.phase==='paused'?'잠시 멈췄어요. 이어서 시작하면 같은 지점에서 계속합니다.':last?activityMiniFeedback(last.score)+' · '+last.score+'점':mini.phase==='running'?'목표 구간을 보고 눌러주세요.':'시작 버튼을 누르면 표시가 움직입니다.'}</p>
 <div class="mini-controls">${result?btn('결과를 확인하고 이어간다.','miniContinue'):mini.phase==='running'?btn(config.action+' · Space / 클릭','miniHit'):btn(mini.phase==='paused'?'이어서 시작 · Space':'시작 · Space','miniStart')}${!result&&mini.phase==='running'?btn('잠깐 멈추기','miniPause'):''}${!result?btn('타이밍 조작 없이 진행','miniSkip'):''}</div>`;
 if(mini.phase!=='running')return;
 const id=mini.id;
 const frame=now=>{
  const current=activeMiniGame();if(!current||current.id!==id||current.phase!=='running'||document.hidden){freezeActivityMiniGame();return;}
  const delta=miniFrameTime?Math.min(80,Math.max(0,now-miniFrameTime)):0;miniFrameTime=now;
  currentCommunityActivity(state).mini=tickActivityMiniGame(current,delta);
  const marker=app.querySelector('[data-mini-position]');if(marker)marker.style.left=activityMiniPosition(currentCommunityActivity(state).mini)*100+'%';
  miniFrame=requestAnimationFrame(frame);
 };
 miniFrame=requestAnimationFrame(frame);
}
document.addEventListener('keydown',e=>{
 const mini=activeMiniGame();if(!mini||e.code!=='Space'||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 const button=e.target.closest('button');if(button&&!['miniStart','miniHit'].includes(button.dataset.action))return;
 e.preventDefault();e.stopImmediatePropagation();if(e.repeat||mini.phase==='result')return;
 handleMiniAction(mini.phase==='running'?'miniHit':'miniStart');
},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&activeMiniGame()?.phase==='running'){freezeActivityMiniGame();render();}});
window.addEventListener('blur',()=>{if(activeMiniGame()?.phase==='running'){freezeActivityMiniGame();render();}});

function playMiniFeedback(score){
 if(!miniSoundEnabled)return;
 try{const AudioClass=window.AudioContext||window.webkitAudioContext;if(!AudioClass)return;miniAudio??=new AudioClass();miniAudio.resume().catch(()=>{});const tone=miniAudio.createOscillator(),volume=miniAudio.createGain(),now=miniAudio.currentTime;tone.type='sine';tone.frequency.setValueAtTime(score>=85?880:score>=60?660:330,now);volume.gain.setValueAtTime(.0001,now);volume.gain.exponentialRampToValueAtTime(.05,now+.012);volume.gain.exponentialRampToValueAtTime(.0001,now+.16);tone.connect(volume);volume.connect(miniAudio.destination);tone.start(now);tone.stop(now+.17);}catch{}
}

function travelCategory(id){return surroundingPlaces[id]?(['riversideWalk','footbridge','underpass','pocketPark'].includes(id)?'outdoor':'life'):campusBuildings[id]?.outdoor?'outdoor':['cafeteria','dorm','cafe','library','hall'].includes(id)?'life':'study';}
function travelPage(){
 const hints={field:'트랙 · 그늘 벤치',outdoorCourt:'야외 코트 · 가벼운 연습',gym:'실내 코트 · 체력단련실',arts:'강의실 · 합주실 · 무대',music:'중형 연습실',headquarters:'강의실 · 은행 · 편의점',creative:'실습실 · 도서관',academic:'교양 강의실',sculpture:'강의실 · 실습실',baekseok:'채플 · 대형 좌석 공간',cafeteria:'학식당 · 카페 · 조리실',hall:'동아리실 · 공용 회의실',library:'책 · 열람 좌석 · 자료실',cafe:'음료 · 휴식 · 개인 작업',dorm:'현관 안내 · 바깥 쉼터'};
 return `<div class="travel-intro"><p><strong>지도에서 목적지를 눌러 이동하세요.</strong><br>건물 안의 층·호실은 도착한 뒤 고를 수 있어요.</p><span class="travel-current">현재 · ${esc(locations[state.location]??'캠퍼스')}</span></div><label class="travel-search">${utilityIcon('travel')}<input type="search" id="travel-search" aria-label="장소 검색" placeholder="건물 이름이나 시설 검색" value="${esc(travelQuery)}" autocomplete="off"></label><nav class="travel-tabs" aria-label="장소 분류">${[['all','전체'],['outdoor','야외'],['study','강의 · 연습'],['life','생활 · 모임']].map(([id,label])=>`<button data-action="travelFilter" data-value="${id}" aria-pressed="${travelFilter===id}">${label}</button>`).join('')}</nav><div class="map-key"><span>● 현재 위치</span><span>건물을 누르면 이동</span><span>! 지금 참여할 수 있는 이벤트</span><small>게임용 배치도 · 실제 지리와 다를 수 있어요</small></div><span class="travel-count" role="status" aria-live="polite"></span><div class="campus-map-scroll" tabindex="0" aria-label="캠퍼스 지도. 좁은 화면에서는 좌우로 움직여 모든 건물을 볼 수 있습니다."><div class="campus-map regional-map" data-region="${travelRegion}" aria-label="클릭해서 이동하는 캠퍼스 배치도"><div class="regional-map-art" data-art-set="${mapRegions[travelRegion].artSet??'campus'}" data-atlas="${mapRegions[travelRegion].atlas}" aria-hidden="true"></div><div class="region-heading"><span>지역 지도</span><strong>${esc(mapRegions[travelRegion].name)}</strong><small>화살표: 옆 지도 보기 · 이름표: 실제 이동</small></div>${state.location==='campus'&&travelRegion==='north'?'<span class="region-player">● 현재 위치 · 중앙 계단길</span>':''}${Object.entries(mapRegions[travelRegion].links).map(([direction,target])=>`<button class="region-arrow region-${direction}" data-action="mapRegion" data-value="${target}" aria-label="${mapRegions[target].name} 지도 보기"><span>${{north:'↑',south:'↓',east:'→',west:'←'}[direction]}</span>${mapRegions[target].name}</button>`).join('')}<button class="region-current" data-action="mapCurrent">◎ 내 위치 지도</button>${Object.entries(locations).map(([id,label],index)=>{const pos=campusMapPositions[id]??[index%4+1,Math.floor(index/4)+1],site=minimapSites[id],regionSite=regionSites[id],events=mapEventsAt(state,id);return `<button class="travel-card map-building" style="grid-column:${pos[0]};grid-row:${pos[1]};--map-x:${regionSite[1]}%;--map-y:${regionSite[2]}%;--map-w:12%;--map-h:9%" data-region="${regionSite[0]}" data-category="${travelCategory(id)}" aria-label="${label} 찾아가기${events.length?' · 참여 가능한 이벤트 '+events.length+'개':''}" data-action="visit" data-value="${id}" ${id===state.location?'aria-current="location"':''} ${!canSpendTime(state,timeCost(state,'visit',id))?'disabled':''}>${events.length?`<span class="map-event-marker" aria-hidden="true">!</span>`:'<span class="region-pin" aria-hidden="true">◇</span>'}<strong>${esc(label)}</strong><small>${esc(hints[id]??surroundingPlaces[id]?.summary??({'market':'식음료 · 생활용품','restaurant':'식사 · 쉬어가기','pub':'저녁 식사 · 모임'}[id]??'캠퍼스 공간'))}</small>${id===state.location?'<span class="map-you">● 여기</span>':''}<span class="map-move">${id===state.location?'주변 보기':'이동 →'}</span></button>`;}).join('')}</div></div><p class="map-scroll-hint">↔ 좁은 화면에서는 지도를 좌우로 밀어보세요.</p><p class="travel-empty" hidden>조건에 맞는 장소가 없어요. 검색어나 분류를 바꿔보세요.</p>`;
}
function applyTravelFilter(){
 const cards=[...app.querySelectorAll('.travel-card')],query=travelQuery.trim().toLocaleLowerCase();let visible=0;
 for(const card of cards){card.hidden=card.dataset.region!==travelRegion||!(travelFilter==='all'||card.dataset.category===travelFilter)||!card.textContent.toLocaleLowerCase().includes(query);if(!card.hidden)visible++;}
 for(const button of app.querySelectorAll('[data-action="travelFilter"]'))button.setAttribute('aria-pressed',String(button.dataset.value===travelFilter));
 const count=app.querySelector('.travel-count');if(count)count.textContent=visible+'개 장소';const empty=app.querySelector('.travel-empty');if(empty)empty.hidden=visible!==0;
}
app.addEventListener('input',e=>{if(e.target.id==='travel-search'){travelQuery=e.target.value;const match=[...app.querySelectorAll('.travel-card')].find(n=>n.textContent.toLocaleLowerCase().includes(travelQuery.trim().toLocaleLowerCase()));if(travelQuery.trim()&&match&&match.dataset.region!==travelRegion){const focus=e.target.selectionStart;travelRegion=match.dataset.region;render();const input=app.querySelector('#travel-search');input.focus();input.setSelectionRange(focus,focus);}else applyTravelFilter();}});

document.addEventListener('keydown',e=>{if(screen!=='iseoDialogue'||e.code!=='Space'||e.target.closest('button,input,textarea,select'))return;const v=iseoPreviewView(iseoAudition);if(iseoAudition.beat<v.lines.length-1){e.preventDefault();iseoAudition=advanceIseoPreview(iseoAudition,'next');render();}});

document.addEventListener('keydown',e=>{if(screen==='opening'&&e.code==='Space'&&!e.target.closest('button,input,textarea,select')){e.preventDefault();state=progressReturningOpening(state);screen=initialReturningScreen(state);render();}});
