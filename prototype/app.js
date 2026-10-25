import {timetable,nextLesson,lessonStatus,classPlace,schoolTime,schoolEnabled,classConflicts} from './timetable.js';
import {attendLesson} from './classes.js';
import {campusBuildings,buildingActions,buildingActivity,buildingAtmosphere,enterBuildingArea} from './campus-buildings.js';
import {libraryActivities,libraryActivity,libraryAtmosphere} from './library-life.js';
import {freeActivity,goHome} from './free-roam.js';
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
import {contact,displayName,presentationText,seePeople,hearGroupLine,introduce} from './identity.js';
import {people,dialogue,respond,groupDialogue,respondGroup,endTopic,openConversation} from './dialogue.js';
import {newGame,newAfternoonScenario,nextDay,acceptAppointment,cancelAppointment,save,restore} from './simulation.js';
import {days,locations,availableRoutes,presentPeople,currentSchedule} from './days.js';
let state=newGame(),screen='campus',selected=null,note='',returnTo='campus',speaker='seoyeon',reply=null,groupLines=[],groupIndex=0,groupAnswered=false,encounter=null;
let gains=[],paceNotice='',weatherReturn='campus',warningScene=null,activityReturn='campus',clubReturn='communityPost',selectedClub=null,communityReturn='campus',communityPhoneReturn='campus',selectedPost=null,feedIds=null,visibleCommentCount=0,communityFilter='all';
const app=document.querySelector('#app');
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
const btn=(text,action,value='')=>{const cost=action==='encounter'&&value==='pass'?0:timeCost(state,action,value);return `<button aria-label="${buttonLabel(text)}" aria-description="${cost?cost+'분 소요':'여러 활동을 마친 뒤 시간을 묶어서 진행'}" data-action="${action}" data-value="${esc(value)}" ${action==='wait'&&state.clock.minute>=1320?'disabled':''}>${text}${cost?`<small class="time-cost">${cost}분</small>`:''}</button>`;};
const duration=n=>n%60?`${n}분`:`${n/60}시간`;
function portrait(column){return `<div class="portrait" style="--column:${column}" role="img" aria-label="${column===0?'김태이':nameOf(Object.entries(people).find(([,p])=>p.column===column)?.[0])} 정면 초상화"></div>`;}
function page(title,body,back='campus',backAction='go'){return `<section class="page"><header>${btn('← 뒤로',backAction,back)}<h1>${title}</h1>${btn('휴대폰','phone')}</header>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}${state.day===1&&state.phase==='afternoon'&&['place','encounter'].includes(screen)?`<p class="pace-summary">${paceSummary(state)}</p>`:''}${screen==='place'?schoolPanel():''}${body}<p class="footnote">대학생활 3일 시제품 · 사건·요일·일정은 검증용 예시입니다.</p></section>`;}
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
 return `<article class="list" data-appointment-id="${esc(a.id??a.person??'legacy')}"><strong>${esc(who)} · ${esc(a.label)}</strong><p>${a.day}일차 오후${a.location?' · '+esc(locations[a.location]??a.location):''} · ${appointmentStatuses[a.status]??a.status}</p><p class="muted">${a.proposer==='npc'?'상대가 먼저 제안':a.proposer==='club'?'가입한 동아리의 활동 안내':a.proposer==='player'?'태이가 제안':'대화에서 잡은 약속'}</p>${a.text?`<p>${esc(a.text)}</p>`:''}${['offered','pending'].includes(a.status)&&conflicts.length?`<p class="notice">${conflicts.map(c=>esc(c.label)).join(', ')} 일정과 시간이 겹칠 수 있습니다. 차례로 참여할 시간이 있는지 확인해 주세요.</p>`:''}<div class="actions">${a.status==='offered'?btn(conflicts.length?'겹치는 일정 확인 후 수락':'수락하기','acceptOffer',a.id)+btn('정중히 거절하기','declineOffer',a.id):a.status==='pending'?btn('미리 연락해 취소','cancelAppointment',a.id??a.person):''}</div></article>`;
}
function commitments(){return state.appointments.map(appointmentCard).join('')||'<p class="muted">아직 약속이나 제안이 없습니다.</p>';}
function atPlace(){return locations[state.location]?state.location:'hall';}
function render(){
 const evening=state.phase==='evening',day=days[state.day],routes=availableRoutes(state);
 if(screen==='campus'){const scene=campusScene(state);app.innerHTML=`<section class="explore"><div class="top"><span class="badge">${timeLabel()}</span><nav>${btn('휴대폰','phone')}${btn('메뉴','go','menu')}</nav></div>${portrait(0)}<div class="prompt scene-prompt"><p>${narrative(scene.text)}</p>${scene.choices.map(c=>btn(narrative(c.label),c.action,c.value)).join('')}</div></section>`;}
 if(screen==='community')app.innerHTML=page('캠퍼스톡',`<p class="community-intro">학내 커뮤니티 · 모집글과 공지, 익명 이야기가 함께 올라옵니다.</p><nav class="community-tabs">${[['all','전체'],['anonymous','자유'],['club','모집'],['notice','공지']].map(([id,label])=>`<button data-action="communityFilter" data-value="${id}" aria-pressed="${communityFilter===id}">${label}</button>`).join('')}</nav><div class="community-live" aria-live="polite"></div><div class="community-feed">${visibleCommunityPosts(state).filter(p=>(!feedIds||feedIds.includes(p.id))&&(communityFilter==='all'||p.kind===communityFilter)).map(p=>`<button class="community-post" data-action="readPost" data-value="${p.id}"><span class="post-meta">${esc(p.board)} · ${p.kind==='anonymous'?'익명글':p.kind==='notice'?'교내 공지':'동아리 운영진'} · ${p.day===state.day?'오늘':p.day+'일차'}${p.generated?' · '+(communityState(state).beat-p.createdBeat<4?'방금':'조금 전'):''}</span><strong>${esc(p.title)}</strong><span class="post-preview">${esc(p.body)}</span><span class="post-meta">댓글 ${p.comments.length}${p.likes?' · 공감 '+p.likes:''}${state.flow.postsRead?.[p.id]?' · 읽음':''}</span></button>`).join('')}</div>`,communityReturn,'closeCommunity');
 if(screen==='communityPost'&&selectedPost){const p=visibleCommunityPosts(state).find(p=>p.id===selectedPost);if(p)app.innerHTML=page(p.board,`<article class="community-detail"><p class="post-meta">${esc(p.author)} · ${p.day===state.day?'오늘':p.day+'일차'}${p.kind==='anonymous'?' · 작성자·내용 미확인':''}</p><h2>${esc(p.title)}</h2><p>${esc(p.body)}</p>${p.kind==='anonymous'?'<p class="source-note">익명 작성자의 글입니다. 직접 본 일이나 공식 안내와 구분해 기억합니다.</p>':''}</article><div class="dialogue-options">${p.club?btn('이 글의 모집 안내를 자세히 읽는다.','clubDetail',p.club):''}${p.club==='volunteer'?btn('글에서 말한 자유관 쪽으로 가본다.','visit','hall'):''}${p.club==='music'&&state.day===1&&state.phase==='afternoon'?btn('휴대폰을 넣고 연습실 소리가 나는 쪽으로 간다.','select','rehearsal'):''}${p.club==='football'&&state.day===2&&state.phase==='afternoon'?btn('안내받은 공개 체험 장소로 향한다.','select','football'):''}${p.id==='ambulance-post'?btn('지나갈 일이 있는 카페 쪽에서 직접 확인해본다.','visit','cafe'):''}</div><div class="community-live" aria-live="polite"></div>${` <h3>댓글 ${p.comments.length}</h3>${p.comments.map(c=>`<p class="community-comment ${c.reply?'reply':''}"><strong>${typeof c==='string'?'익명':esc(c.author)}</strong>${esc(typeof c==='string'?c:c.text)}</p>`).join('')}`}`, 'community');}
 if(screen==='travel')app.innerHTML=page('캠퍼스 이동',`<p class="muted">인물은 각자의 일정에 따라 장소를 옮깁니다. 1일차에는 여러 이동·탐색·대화를 묶어 시간이 한 번에 흐릅니다. 보통 약 30분이며, 비 오는 날의 야외 이동과 우산 준비에 따라 달라집니다. 짧은 대답마다 시간이 차감되지는 않습니다. 머물 곳과 할 일은 직접 정할 수 있습니다. 휴대폰과 메뉴를 확인하는 동안에는 시간이 들지 않습니다.</p><div class="grid">${Object.entries(locations).map(([id,label])=>`<button class="card" aria-label="${label} 찾아가기" data-action="visit" data-value="${id}" ${!canSpendTime(state,timeCost(state,'visit',id))?'disabled':''}><strong>${label}</strong>찾아가기</button>`).join('')}</div>`);
 if(screen==='timetable')app.innerHTML=page('시간표 · 출석',`<p>${timeLabel()}</p><p class="muted">수업이 없는 시간은 자유행동 시간입니다. 수업 장소에서 실제로 참석해야 출석이 남습니다.</p>${[1,2,3].map(day=>`<h2>${day}일차 · ${days[day].weekday}</h2>${timetable(state,'taei',day).map(c=>`<article class="list"><strong>${esc(c.name)} · ${schoolTime(c.start)}~${schoolTime(c.end)}</strong><p>${esc(classPlace(c))}</p><p>${day<state.day?(classStatuses[state.academics.records[c.key]?.status]??'기록 없음'):day>state.day?'예정':classStatuses[lessonStatus(state,c)]}</p>${day===state.day&&state.clock.minute<c.end&&!state.academics.records[c.key]?btn('수업 장소로 간다.','classTravel',c.key):''}</article>`).join('')}`).join('')}`,'phone');
 if(screen==='classLesson'){const c=timetable(state).find(c=>c.key===state.academics?.lesson);app.innerHTML=page(c?.name??'수업',c?`<p class="lead">${esc(classPlace(c))}</p><p>${esc(c.topic)}</p><p class="muted">${schoolTime(c.start)}~${schoolTime(c.end)} · ${state.clock.minute<c.start?'시작 전까지 준비한 뒤 수업을 듣습니다.':state.clock.minute>c.start?'늦게 들어가면 실제 참석 시각에 따라 지각 또는 일부 참석으로 기록합니다.':'수업을 끝까지 듣습니다.'}</p><div class="dialogue-options">${c.choices.map(a=>btn(a.label,'classChoice',a.id)).join('')}</div>`:'<p>수업 장소와 시간을 다시 확인해 주세요.</p>','place');}
 if(screen==='buildingDirectory'){const b=campusBuildings[atPlace()];app.innerHTML=page((b?.name??'건물')+' · 내부 안내',`<p class="muted">${esc(b?.description??'')}</p><div class="actions">${(b?.areas??[]).map(a=>btn((a.floor==='층 미확정'?'':a.floor+' · ')+a.name,'buildingArea',a.id)).join('')}</div>`,'place');}
 if(screen==='place'){
  const here=atPlace();
  app.innerHTML=page(locations[here],`<p class="lead">${timeLabel()}</p><p class="muted">${narrative((buildingAtmosphere(state,here)||(here==='library'?libraryAtmosphere(state):placeAtmosphere(state,here)))||{hall:'복도에는 물품 상자와 활동 안내문이 놓여 있다. 안쪽에서 종이를 넘기는 소리가 들린다.',library:'책장을 넘기는 소리와 낮은 대화가 들린다. 사람들은 각자 하던 일을 이어간다.',cafe:'주문을 부르는 목소리가 들린다. 창가의 햇빛이 조금 길어졌다.'}[here])}</p><p class="weather-scene">${weatherAtmosphere(state,here)}</p>${riskScene(state,here)?`<p class="muted">${narrative(riskScene(state,here))}</p>`:''}<div class="actions">${campusBuildings[here]?.areas?btn('건물 안의 다른 공간으로 간다.','go','buildingDirectory'):''}${state.clock.minute<1320?buildingActions(state,here).map(a=>btn(a.label,'buildingActivity',a.id)).join(''):''}${here==='library'&&state.clock.minute<1320?libraryActivities.map(a=>btn(a.label,'libraryActivity',a.id)).join(''):''}</div><div class="actions">${visibleSpatialActions(state,placeActions[here]??[]).map(a=>btn(a.label,'walk',a.id)).join('')}</div><div class="actions">${placeContinuations(state,here).map(c=>btn(narrative(c.label),c.action,c.value)).join('')}${evening?btn(state.day<3?'자취방으로 돌아가 하루를 마친다.':'지난 며칠의 기록을 떠올린다.','go','dayEnd'):''}${state.clock.minute<1320?btn('잠시 쉬며 시간을 보낸다','wait'):''}</div>`);
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
  app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','place')}${btn('휴대폰','phone')}<span class="badge">${timeLabel()} · ${locations[atPlace()]}</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${esc(nameOf(screen==='group'?line.person:speaker))}</p>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}<p class="muted">${narrative(reply?.stage??d.stage)}</p>${reply?.socialNews?`<p class="heard-report"><span>전해 들은 이야기</span>${narrative(reply.socialNews)}</p>`:''}${reply?.playerLine?`<p class="player-line"><span>김태이</span>${narrative(reply.playerLine)}</p>`:''}<blockquote>${esc(reply?.text??d.opening)}</blockquote>${reply?.followup?`<p class="inner-line">${esc(reply.followup)}</p>`:''}<div class="dialogue-options">${invitation?btn('내일 같이 하기로 약속한다','acceptAppointment',speaker):''}${riskReply?riskOptions:d.options.map(o=>btn(narrative(o.label),'answer',o.id)).join('')}</div>${!riskReply?`<div class="actions">${d.scene?btn('다른 이야기로 넘어가기','endTopic'):''}${state.day<3&&contact(state,speaker).introduced?btn('따로 만날 시간 물어보기','suggestMeeting',speaker):''}${state.day===3&&(state.warnings?.evidence?.length??0)>0?btn('주변에서 접한 일 이야기하기','warningTalk',speaker)+(!evening?btn('안내 확인에 동행 제안하기','requestEscort',speaker):''):''}${btn('이야기를 마치고 하던 일로 돌아간다.','go','place')}</div>`:''}</article></div></section>`;
 }
 if(screen==='group'){
  const line=groupLines[groupIndex],p=people[line.person],end=groupIndex===groupLines.length-1;
  app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','place')}${btn('휴대폰','phone')}<span class="badge">${timeLabel()} · 함께 나누는 대화</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${esc(nameOf(screen==='group'?line.person:speaker))}</p><p class="muted">${narrative(`${nameOf('seoyeon')}과 ${nameOf('soyul')}이 휴대폰의 사진을 함께 보고 있다.`)}</p><blockquote>${esc(line.text)}</blockquote><div class="dialogue-options">${!end?btn('다음 대화','groupNext'):groupAnswered?btn('대화 마치기','go','place'):[btn('천천히 골라요. 아직 시간 있어요.','groupAnswer','wait'),btn('나도 같이 봐도 돼요?','groupAnswer','include'),btn(contact(state,'seoyeon').nameLevel==='unknown'?'옆에 있는 분이 먼저 골라주면 빠르겠네.':'서연 씨가 먼저 골라주면 빠르겠네.','groupAnswer','speakFor')].join('')}</div></article></div></section>`;
 }
 if(screen==='detail'&&selected){const r=routes.find(r=>r.id===selected);if(r)app.innerHTML=page(r.name,`<p class="lead">${narrative(r.description)}</p>${r.weatherNote?`<p class="weather-note">${esc(r.weatherNote)}</p>`:''}<p>소요 시간: ${duration(r.duration)} · 지금 시작하면 ${String(Math.floor((state.clock.minute+r.duration)/60)).padStart(2,'0')}:${String((state.clock.minute+r.duration)%60).padStart(2,'0')}에 마칩니다.</p>${classConflicts(state,r.duration).map(c=>`<p class="notice">수업과 겹칩니다: ${esc(c.name)} (${schoolTime(c.start)}~${schoolTime(c.end)}). 계속하면 지각하거나 결석할 수 있습니다.</p>`).join('')}${eventApproaches(state,selected).length?`<h2>어떻게 참여할까?</h2><div class="dialogue-options">${eventApproaches(state,selected).map(o=>`<button data-action="plan" data-value="${o.id}" aria-pressed="${(state.eventState?.plans?.[`${state.day}:${selected}`]??'listen')===o.id}">${o.label}</button>`).join('')}</div>`:''}<p class="muted">시간은 실제로 들인 만큼 흐릅니다. 마친 뒤에도 자유롭게 행동하거나 귀가할 수 있습니다.${selected!=='volunteer'&&Object.values(state.dialogue.promises).includes('pending')?' 봉사 참석 약속이 남아 있습니다. 시간을 맞출 수 있는지 확인해 주세요.':''}</p>${pending().filter(a=>a.day===state.day&&a.activity!==selected).map(a=>`<p class="notice">${esc(a.person?nameOf(a.person):clubs[a.club]?.name??'동아리')}과 한 ${a.label} 약속도 남아 있습니다. 이 일을 마친 뒤 시간을 맞출지, 미리 연락할지 확인해 주세요.</p>`).join('')}<div class="actions">${btn(classConflicts(state,r.duration).length?'수업과 겹치는 것을 알고 활동 진행':'이 활동 진행','act',selected)}${btn('아직 시작하지 않고 돌아간다.','cancelActivity')}</div>`,activityReturn,'cancelActivity');}
 if(screen==='result')app.innerHTML=page('활동 완료',`<p class="lead">${narrative(state.lastResult)}</p><p class="muted">${state.minutes}분을 보냈습니다. 다음 행동은 직접 정할 수 있습니다.</p><div class="actions">${btn('건물 밖으로 나와 주변을 둘러본다.','go','campus')}${btn('정리 중인 자유관 쪽으로 돌아간다.','visit','hall')}${btn(state.day<3?'하루 마무리하기':'3일의 기록 보기','go','dayEnd')}</div>`);
 if(screen==='phone')app.innerHTML=page('휴대폰',`<div class="grid">${[...(schoolEnabled(state)?[['시간표 · 출석','timetable']]:[]),['학내 커뮤니티','community'],['날씨와 예보','weather'],...((state.warnings?.evidence?.length??0)>0?[['확인한 일','observations']]:[]),['일정','schedule'],['메시지','messages'],['알게 된 정보 · 소지품','discoveries'],...((state.flow?.seen?.community||Object.keys(state.memberships??{}).length)?[['읽어둔 동아리 안내','clubs']]:[]),['지도','map'],['일지','journal']].map(([t,id])=>`<button class="card" data-action="go" data-value="${id}"><strong>${t}</strong></button>`).join('')}</div>`,returnTo);
 if(screen==='weather')app.innerHTML=page('날씨와 예보',`<p class="lead">${weatherNow(state).icon} ${weatherNow(state).name} · ${weatherNow(state).temperature}°C</p><p>${weatherAtmosphere(state)}</p><p class="muted">시제품용 교내 예보입니다. 다가오는 날씨를 확인하고 활동과 준비물을 정해 보세요.</p><h2>다가오는 날씨</h2>${[state.day,...Array.from({length:3-state.day},(_,i)=>state.day+i+1)].map(day=>`<article class="list"><strong>${day===state.day?'오늘':day+'일차'} · ${days[day].weekday}</strong><p>오후 ${weatherNow(state,day,'afternoon').icon} ${weatherNow(state,day,'afternoon').name} · 저녁 ${weatherNow(state,day,'evening').name}</p></article>`).join('')}<h2>오늘의 준비</h2><p class="${hasUmbrella(state)?'item-text':'muted'}">${hasUmbrella(state)?'대여 우산을 가지고 있습니다. 비가 올 때 일반 이동·탐색의 추가 시간을 줄입니다.':'자유관 공용 대여대에서 우산을 빌릴 수 있습니다. 비를 맞지 않으려고 기다리는 시간을 줄일 수 있습니다.'}</p><p class="muted">우산 없이 비 오는 날 야외를 오간 경우 행동 묶음은 약 40분(강한 비 45분), 우산이 있거나 실내에만 머문 경우 약 30분입니다. 짧은 답변마다 시간을 차감하지 않습니다. 야외 활동에도 준비 상태를 반영합니다. 강한 비의 야외 활동 제한은 우산으로 해제되지 않습니다.</p>${state.location==='hall'?btn(hasUmbrella(state)?'대여 우산 반납하기':'공용 우산 빌리기',hasUmbrella(state)?'returnUmbrella':'borrowUmbrella'):'<p class="muted">우산 대여·반납은 자유관에서 할 수 있습니다.</p>'}`,weatherReturn,'closeWeather');
 if(screen==='schedule')app.innerHTML=page('약속과 기록',`<p>${timeLabel()}</p><p class="muted">직접 잡거나 수락한 약속을 확인합니다. 약속이 없는 시간은 자유롭게 보낼 수 있습니다.</p><h2>약속</h2>${commitments()}<h2>오늘 한 일</h2>${(state.freeDay?.completed??[]).map(x=>`<div class="list">${esc(days[state.day].routes[x.id]?.name??x.id)} · ${x.end-x.start}분</div>`).join('')||'<p class="muted">아직 기록된 긴 활동이 없습니다. 주변을 둘러보며 자유롭게 시작할 수 있습니다.</p>'}`,'phone');
 if(screen==='clubs')app.innerHTML=page('동아리 살펴보기',`<p class="muted">${Object.keys(state.memberships??{}).length?'가입한 동아리와 다른 곳의 안내를 확인할 수 있습니다.':'복학 후 아직 가입한 동아리는 없습니다. 관심 있는 곳의 안내를 읽고 직접 가입할 수 있습니다.'} 가입과 활동 참석은 별개입니다.</p><div class="grid">${Object.entries(clubs).map(([id,c])=>`<button class="card" data-action="clubDetail" data-value="${id}"><strong>${esc(c.name)}</strong>${state.memberships?.[id]?'가입 중':'모집 안내 보기'} · ${esc(c.place)}</button>`).join('')}</div>`);
 if(screen==='clubDetail'&&clubs[selectedClub]){const c=clubs[selectedClub];app.innerHTML=page(c.name,`<p class="lead">${esc(c.description)}</p><p>주요 활동 장소 · ${esc(c.place)}</p><p class="muted">가입하면 예정된 공개 활동을 약속 제안으로 안내받습니다. 수락해야 참석 약속이 됩니다. 공개 체험 활동은 가입 전에도 참여할 수 있습니다.</p>${state.memberships?.[selectedClub]?'<p class="information-text">가입 중입니다. 활동 참석 여부는 휴대폰 일정에서 정할 수 있습니다.</p>':btn('이 동아리에 가입하기','joinClub',selectedClub)}<div class="actions">${btn('약속과 일정 보기','go','schedule')}</div>`,clubReturn);}
 if(screen==='messages')app.innerHTML=page('메시지',state.messages.length?state.messages.map(m=>`<article class="list"><strong>${esc(Object.entries(people).find(([,p])=>p.name===m.from)?nameOf(Object.entries(people).find(([,p])=>p.name===m.from)[0]):m.from)} · ${m.day??1}일차</strong><p>${narrative(m.text)}</p>${m.appointmentId?btn('약속 제안 보기','go','schedule'):''}</article>`).join(''):'<p class="muted">새 메시지가 없습니다.</p>','phone');
 if(screen==='discoveries')app.innerHTML=page('알게 된 정보 · 소지품',`<p class="muted">직접 확인하거나 전해 들은 정보와 실제로 보유한 물건을 구분합니다. 보관 위치를 알았다고 물건을 얻은 것은 아닙니다.</p><h2 class="information-text">◇ 알게 된 정보 · ${state.known.length}개</h2>${state.known.map(x=>{const record=(state.discoveries??[]).find(d=>d.kind==='information'&&d.name===x);return `<article class="list"><strong class="information-text">${esc(x)}</strong><p class="muted">${record?`${record.day}일차 · ${record.phase==='evening'?'저녁':'오후'} · ${esc(locations[record.location]??'활동 중')}에 확인`:'이전 진행에서 확인한 정보'}${record?.action?`<br>행동: ${esc(record.action)}`:''}</p></article>`;}).join('')||'<p class="muted">아직 확인한 정보가 없습니다.</p>'}<h2 class="item-text">▣ 소지품</h2>${(state.inventory??[]).map(i=>`<article class="list item-text">${esc(i.name)} × ${i.quantity}</article>`).join('')||'<p class="muted">획득한 아이템이 없습니다.</p>'}`,'phone');
 if(screen==='map')app.innerHTML=page('교내 지도와 장소',`<p class="muted">교내 공개 길 안내입니다. 건물 안에서 직접 확인한 시설과 동선은 아래에 따로 기록됩니다.</p><h2>교내 길 안내</h2><div class="grid">${Object.entries(locations).filter(([id])=>campusBuildings[id]?.primary).map(([id,label])=>`<button class="card" data-action="visit" data-value="${id}"><strong>${label}</strong>${campusBuildings[id]?.description??'생활과 교류 공간'}${state.location===id?' · 현재 위치':''}</button>`).join('')}</div><h2>건물 내부·주변 생활 공간</h2><div class="grid">${Object.entries(locations).filter(([id])=>!campusBuildings[id]?.primary).map(([id,label])=>`<button class="card" data-action="visit" data-value="${id}"><strong>${label}</strong>${id==='library'?'창조관 내부':id==='dorm'?'명칭·세부 배치 미정':'학교 주변'}${state.location===id?' · 현재 위치':''}</button>`).join('')}</div><h2>직접 알아둔 정보</h2>${state.known.map(x=>`<div class="list">${narrative(x)}</div>`).join('')||'<p>아직 기록된 장소가 없습니다.</p>'}<div class="actions">${btn('학교 길 안내를 확인한다.','go','travel')}</div>`,'phone');
 if(screen==='journal')app.innerHTML=page('지금까지의 기록',state.memory.map(x=>`<div class="list">${narrative(x)}</div>`).join('')||'<p class="muted">아직 기록이 없습니다.</p>','phone');
 if(screen==='dayEnd'){
  const history=[...state.dayHistory,{day:state.day,choice:state.choice,activities:state.freeDay?.completed??[]}];
  app.innerHTML=page(state.day===3?'며칠간의 기록':`${state.day}일차 마무리`,!state.freeDay?.home?`<p class="lead">오늘은 집으로 돌아갈까요?</p><p class="muted">지금까지 한 일과 맺은 관계는 남습니다. 귀가한 뒤에도 학교의 일은 이어지며, 남은 약속을 지키지 못할 수 있습니다.${nextLesson(state)?' 남은 수업에 참석하지 않으면 결석으로 기록됩니다.':''}</p><div class="actions">${btn('오늘은 귀가한다.','freeHome')}${btn('아직 학교에 더 머문다.','go','campus')}</div>`:`<p class="lead">집으로 돌아와 오늘을 떠올린다.</p>${history.map(h=>`<div class="list">${h.day}일차 · ${h.activities?.length?h.activities.map(x=>esc(days[h.day].routes[x.id]?.name??x.id)).join(' · '):h.choice?esc(days[h.day].routes[h.choice]?.name??'자유행동'):schoolEnabled(state)?'수업 외 긴 활동 없음':'자유롭게 주변을 둘러봄'}${schoolDaySummary(h.day)}</div>`).join('')}${state.day<3?btn(`${state.day+1}일차 시작하기`,'nextDay'):btn('일지를 펼쳐본다.','go','journal')}`);
 }
 if(screen==='menu')app.innerHTML=page('메뉴',`<p>김태이 · ${timeLabel()}</p><div class="grid">${[1,2,3].map(i=>`<article class="list"><strong>저장 슬롯 ${i}</strong><div class="actions">${btn('저장','save',i)}${btn('불러오기','load',i)}</div></article>`).join('')}</div>${btn('새 하루 시작','go','reset')}<hr><p class="muted">관계별 대화 비교 · 아래 버튼은 수업을 마친 1일차 13:00의 관계 예시를 시작합니다. 현재 진행은 초기화되며 저장 슬롯은 유지됩니다.</p><div class="actions">${btn('서먹한 사이','scenario','acquaintance')}${btn('친한 동료','scenario','friend')}${btn('호감이 쌓인 사이','scenario','close')}</div><hr><p class="muted">날씨 비교 예시 · 현재 날짜와 시간대의 날씨를 바꿉니다. 관계와 저장 슬롯은 초기화하지 않습니다.</p><div class="actions">${Object.entries(weatherTypes).map(([id,w])=>btn(w.name+' 예시','weatherExample',id)).join('')}</div>`);
 if(screen==='reset')app.innerHTML=page('새로 시작',`<p>진행을 1일차로 초기화합니다. 기존 저장 슬롯은 유지합니다.</p>${btn('새로 시작','reset')}`,'menu');
 document.body.dataset.weather=weatherNow(state).kind;
 app.insertAdjacentHTML('afterbegin',`<div class="weather-strip">${btn(`${weatherNow(state).icon} ${weatherNow(state).name} · ${weatherNow(state).temperature}°C · 예보`,'openWeather')}</div>`);
 const offers=state.appointments.filter(a=>a.status==='offered');if(offers.length&&!['schedule','community','communityPost'].includes(screen))app.insertAdjacentHTML('afterbegin',`<section class="invitation-alert">${btn(`약속 제안 ${offers.length}개 확인`,'go','schedule')}<span>수락하기 전에는 참석 약속이 아닙니다.</span></section>`);
 if(paceNotice)app.insertAdjacentHTML('afterbegin',`<section class="time-summary" role="status">${esc(paceNotice)}</section>`);
 if(gains.length)app.insertAdjacentHTML('afterbegin',`<section class="discovery-notice" aria-label="새로 얻은 정보와 아이템"><div role="status" aria-live="polite">${gains.map(g=>`<p class="${g.kind==='item'?'item-text':'information-text'}"><strong>${g.kind==='item'?'▣ 아이템 획득':'◇ 새 정보'}</strong> · ${esc(g.name)}${g.quantity?` × ${g.quantity}`:''}</p>`).join('')}</div><div class="actions">${btn('정보 · 소지품 확인','go','discoveries')}${btn('확인','dismissDiscoveries')}</div></section>`);
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action,v=b.dataset.value;note='';const before=structuredClone(state);const fromScreen=screen;paceNotice='';try{
 if(a==='openWeather'){if(screen!=='weather')weatherReturn=screen;screen='weather';}
 if(a==='closeWeather')screen=weatherReturn;
 if(a==='go'){
  if(v==='weather')weatherReturn=screen;
  if(v==='community'){if(state.community)state.community.focusPostId=null;if(screen!=='communityPost'&&!(screen==='phone'&&['community','communityPost'].includes(returnTo))){communityReturn=screen;communityPhoneReturn=returnTo;}state=advanceCommunity(markFlow(state,'community'));feedIds=visibleCommunityPosts(state).map(p=>p.id);}
  const records=['timetable','schedule','messages','map','journal','observations','discoveries'];if(records.includes(v)&&screen!=='phone'&&!records.includes(screen))returnTo=screen;
  if(screen==='warningScene'&&warningScene&&!records.includes(v)){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}
  if(screen==='encounter'&&encounter&&!records.includes(v)){state=resolveEncounter(state,encounter,false).state;encounter=null;}
  if(v==='discoveries'&&screen!=='phone'&&screen!=='discoveries')returnTo=screen;
  screen=v;reply=null;if(v==='messages')state=readMessages(state);
 }
 if(a==='visit'||a==='walk'){
  const destination=a==='walk'?atPlace():v;
  if(!locations[destination])throw new Error('알 수 없는 장소입니다.');
  if(encounter){state=resolveEncounter(state,encounter,false).state;encounter=null;}
  if(warningScene){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}
  if(state.location!==destination)state.buildingArea=null;
  state=markFlow(state,'visit',destination);
  const arrived=arrive(state,destination,a==='walk'?v:'entry');state=arrived.state;encounter=arrived.encounter;warningScene=arrived.warning??null;screen=warningScene?'warningScene':encounter?'encounter':'place';reply=null;note=arrived.observation??'';
 }
 if(a==='buildingArea'){const result=enterBuildingArea(state,v);state=result.state;note=result.text;screen='place';if(result.destination){state=markFlow(state,'visit',result.destination);const r=arrive(state,result.destination);state=r.state;encounter=r.encounter;note=r.observation??result.text;screen=encounter?'encounter':'place';}}
 if(a==='buildingActivity'){const result=buildingActivity(state,v);state=result.state;note=result.text;screen='place';}
 if(a==='libraryActivity'){const result=libraryActivity(state,v);state=result.state;note=result.text;screen='place';}
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
  else if(happened.group){
   groupLines=groupDialogue(state);groupIndex=0;groupAnswered=false;hearGroupLine(state,groupLines[0]);screen='group';encounter=null;
   if(state.day>=2&&!state.known.includes('소율과 여경의 사진 협업')){state.known.push('소율과 여경의 사진 협업');state.memory.push(`[${state.day}일차] 휴게공간을 지나다 서연과 소율의 사진 이야기를 들었다.`);}
  }else {speaker=encounter.person;reply=happened.result;screen='dialogue';encounter=null;}
 }
 if(a==='answer'){const next=respond(state,speaker,v);state=next.state;reply=next.result;if(reply.leave){reply=null;screen='place';}}
 if(a==='endTopic'){state=endTopic(state,speaker);reply=null;}
 if(a==='groupNext'){groupIndex++;hearGroupLine(state,groupLines[groupIndex]);}
 if(a==='groupAnswer'){for(const id of ['seoyeon','soyul'])introduce(state,id,'incidental-group-exchange');const next=respondGroup(state,v);state=next.state;for(const id of ['seoyeon','soyul'])state=meetAppointments(state,id);groupLines=next.lines;groupIndex=0;groupAnswered=true;hearGroupLine(state,groupLines[0]);}
 if(a==='acceptAppointment'){state=acceptAppointment(state,v);note='내일 약속을 잡았습니다. 겹치는 약속은 휴대폰 일정에서 확인하고 미리 취소할 수 있습니다.';}
 if(a==='cancelAppointment'){state=cancelAppointment(state,v);note='미리 연락해 약속을 취소했습니다.';}
 if(a==='freeHome'){state=goHome(state);screen='dayEnd';}
 if(a==='nextDay'){state=nextDay(state);screen='campus';reply=null;selected=null;encounter=null;returnTo='campus';}
 if(a==='scenario'){const arrived=arrive(markFlow(newAfternoonScenario(v),'visit','hall'),'hall');state=arrived.state;encounter=arrived.encounter;reply=null;screen=encounter?'encounter':'place';}
 if(a==='phone'&&screen!=='phone'){returnTo=screen;screen='phone';}
 if(a==='borrowUmbrella'){state=borrowUmbrella(state);note='공용 우산을 빌렸습니다. 소지품에 기록했습니다.';}
 if(a==='returnUmbrella'){state=borrowUmbrella(state,true);note='대여 우산을 반납했습니다.';}
 if(a==='weatherExample'){state=setWeatherExample(state,v);for(const [id,place] of Object.entries(currentSchedule(state)))state.npcs[id].location=place;state=weatherAdjustAppointments(state,availableRoutes(state));note='날씨 비교 예시를 적용했습니다.';}
 if(a==='clubDetail'){clubReturn=screen;selectedClub=v;screen='clubDetail';}
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
 if(a==='plan')state=planEvent(state,selected,v);
 if(a==='act'){if(encounter){state=resolveEncounter(state,encounter,false).state;encounter=null;}if(warningScene){state=finishWarningSite(state,warningScene,false).state;warningScene=null;}state=freeActivity(state,v);screen='result';}
 if(a==='save'){localStorage.setItem('campus.slot.'+v,save(state));note=`슬롯 ${v}에 저장했습니다.`;}
 if(a==='load'){const raw=localStorage.getItem('campus.slot.'+v);if(!raw)throw new Error('비어 있는 슬롯입니다.');state=warningPhase(restore(raw));warningScene=null;reply=null;selected=null;encounter=null;note=`슬롯 ${v}을 불러왔습니다.`;}
 if(a==='reset'){state=newGame();screen='campus';selected=null;reply=null;encounter=null;returnTo='campus';}
 if(!['load','reset','scenario','nextDay','act','classChoice'].includes(a)){
  const paced=paceAction(before,state,{action:a,value:v,from:fromScreen,to:screen,person:fromScreen==='group'?'group':speaker});state=paced.state;
  if(paced.minutes)paceNotice=`${a==='wait'?'잠시 쉬고 나니':'여러 일을 마치고 나니'} 어느새 ${clockLabel(state)}. 약 ${paced.minutes}분이 지났다.`;
 }
 if(!['load','save','reset','scenario'].includes(a))state=warningPhase(state);
 if(!['load','save','reset','scenario'].includes(a))state=updateSocialWorld(before,state);
 if(!['load','save','reset','scenario'].includes(a)){state=evolveRisk(state,{allowMove:['place','campus','travel','activities','result'].includes(screen)});for(const [id,place] of Object.entries(currentSchedule(state)))state.npcs[id].location=place;}
 if(!['load','save','reset'].includes(a))state=evaluateInvitations(state);
 if(!['load','save','reset','scenario'].includes(a))state=advanceCommunity(state);
 if(a==='dismissDiscoveries')gains=[];
 if(['load','reset','scenario'].includes(a))gains=[];else {const found=recordDiscoveries(before,state,b.textContent.trim());if(found.length)gains=found;}
}catch(err){note=err.message;}render();});
render();

// Background residents continue writing while the game is open. This does not advance Tae-i's clock.
setInterval(()=>{
 if(document.hidden||['menu','reset'].includes(screen))return;
 state=advanceCommunity(state,{ambient:true});
 const live=app.querySelector('.community-live');if(!live)return;
 const count=screen==='community'?visibleCommunityPosts(state).filter(p=>!feedIds?.includes(p.id)&&(communityFilter==='all'||p.kind===communityFilter)).length:Math.max(0,(visibleCommunityPosts(state).find(p=>p.id===selectedPost)?.comments.length??0)-visibleCommentCount);
 live.innerHTML=count?btn(screen==='community'?`새 글 ${count}개 도착 · 확인하기`:`새 댓글 ${count}개 · 확인하기`,'applyCommunityUpdates'):'';
},15000);
