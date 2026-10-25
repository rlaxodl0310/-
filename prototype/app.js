import {people,dialogue,respond,groupDialogue,respondGroup,endTopic,openConversation} from './dialogue.js';
import {newGame,act,nextDay,acceptAppointment,cancelAppointment,save,restore} from './simulation.js';
import {days,locations,availableRoutes,presentPeople} from './days.js';
let state=newGame(),screen='campus',selected=null,note='',returnTo='campus',speaker='seoyeon',reply=null,groupLines=[],groupIndex=0,groupAnswered=false;
const app=document.querySelector('#app');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,action,value='')=>`<button data-action="${action}" data-value="${value}">${text}</button>`;
const duration=n=>n%60?`${n}분`:`${n/60}시간`;
function portrait(column){return `<div class="portrait" style="--column:${column}" role="img" aria-label="${column===0?'김태이':Object.values(people).find(p=>p.column===column)?.name} 정면 초상화"></div>`;}
function page(title,body,back='campus'){return `<section class="page"><header>${btn('← 뒤로','go',back)}<h1>${title}</h1></header>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}${body}<p class="footnote">대학생활 3일 시제품 · 사건·요일·일정은 검증용 예시입니다.</p></section>`;}
function timeLabel(){return `${state.day}일차 · ${days[state.day].weekday} · ${state.phase==='evening'?'저녁':'오후'}`;}
function pending(){return state.appointments.filter(a=>a.status==='pending');}
function commitments(){return pending().map(a=>`<article class="list">${esc(state.npcs[a.person].name)} · ${a.day}일차 오후 · ${a.label} ${btn('미리 연락해 취소','cancelAppointment',a.person)}</article>`).join('')||'<p class="muted">예정된 약속이 없습니다.</p>';}
function atPlace(){return locations[state.location]?state.location:'hall';}
function render(){
 const evening=state.phase==='evening',day=days[state.day],routes=availableRoutes(state);
 if(screen==='campus')app.innerHTML=`<section class="explore"><div class="top"><span class="badge">${timeLabel()}</span><nav>${btn('휴대폰','phone')}${btn('메뉴','go','menu')}</nav></div>${portrait(0)}<div class="prompt"><span>${day.title}</span>${btn('학생회관 들어가기','visit','hall')}${btn('다른 장소로 이동','go','travel')}${evening?btn(state.day<3?'하루 마무리하기':'3일의 기록 보기','go','dayEnd'):''}</div></section>`;
 if(screen==='travel')app.innerHTML=page('캠퍼스 이동',`<p class="muted">인물은 각자의 일정에 따라 장소를 옮깁니다. 메뉴와 장소 확인은 시간을 소모하지 않으며, 오후 활동 실행 시 시간이 진행됩니다.</p><div class="grid">${Object.entries(locations).map(([id,label])=>`<button class="card" data-action="visit" data-value="${id}"><strong>${label}</strong>찾아가기</button>`).join('')}</div>`);
 if(screen==='place'){
  const here=atPlace(),present=presentPeople(state,here);
  app.innerHTML=page(locations[here],`<p class="lead">${timeLabel()}</p><p class="muted">${{hall:'봉사단의 물품과 활동 자료가 놓여 있다.',library:'책장을 넘기는 소리와 낮은 대화가 들린다.',cafe:'창가에 오후 햇빛이 들어온다.'}[here]}</p><div class="grid">${present.map(id=>`<button class="card person-card" data-action="talk" data-value="${id}"><strong>${people[id].name}</strong>이야기하기</button>`).join('')||'<p>지금은 아는 사람이 보이지 않는다.</p>'}</div><div class="actions">${present.includes('seoyeon')&&present.includes('soyul')?btn('서연과 소율의 대화에 다가간다','group'):''}${!evening?btn('오후 활동 고르기','go','activities'):btn(state.day<3?'하루 마무리하기':'3일의 기록 보기','go','dayEnd')}${btn('다른 장소로 이동','go','travel')}</div>`);
 }
 if(screen==='dialogue'){
  const d=dialogue(state,speaker),p=people[speaker];
  const invitation=reply?.choice==='invite'&&!state.appointments.some(a=>a.person===speaker&&a.status==='pending');
  app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','place')}<span class="badge">${timeLabel()} · ${locations[atPlace()]}</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${p.name}</p>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}<p class="muted">${esc(reply?.stage??d.stage)}</p>${reply?.playerLine?`<p class="player-line"><span>김태이</span>${esc(reply.playerLine)}</p>`:''}<blockquote>${esc(reply?.text??d.opening)}</blockquote>${reply?.followup?`<p class="inner-line">${esc(reply.followup)}</p>`:''}<div class="dialogue-options">${invitation?btn('내일 같이 하기로 약속한다','acceptAppointment',speaker):''}${d.options.map(o=>btn(esc(o.label),'answer',o.id)).join('')}</div><div class="actions">${d.scene?btn('다른 이야기로 넘어가기','endTopic'):''}${btn('활동 살펴보기','go','activities')}</div></article></div></section>`;
 }
 if(screen==='group'){
  const line=groupLines[groupIndex],p=people[line.person],end=groupIndex===groupLines.length-1;
  app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','place')}<span class="badge">${timeLabel()} · 함께 나누는 대화</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${p.name}</p><p class="muted">서연과 소율이 휴대폰의 사진을 함께 보고 있다.</p><blockquote>${esc(line.text)}</blockquote><div class="dialogue-options">${!end?btn('다음 대화','groupNext'):groupAnswered?btn('대화 마치기','go','place'):[btn('천천히 골라요. 아직 시간 있어요.','groupAnswer','wait'),btn('나도 같이 봐도 돼요?','groupAnswer','include'),btn('서연 씨가 먼저 골라주면 빠르겠네.','groupAnswer','speakFor')].join('')}</div></article></div></section>`;
 }
 if(screen==='activities')app.innerHTML=page(`${state.day}일차 오후 활동`,evening?'<p>이미 오후 활동을 완료했습니다.</p>':`<p class="muted">${Object.values(state.dialogue.promises).includes('pending')?'봉사 참석을 약속한 상태입니다. 다른 활동을 택하면 약속을 지키지 못합니다.':'활동 하나를 선택하면 저녁으로 이동합니다.'} 선택하지 않은 장소에서도 일정은 진행됩니다.</p>${pending().filter(a=>a.day===state.day).map(a=>`<p class="notice">${state.npcs[a.person].name}과 ${a.label} 약속이 있습니다.</p>`).join('')}<div class="grid">${routes.map(r=>`<button class="card" data-action="select" data-value="${r.id}" ${r.locked?'disabled':''}><strong>${r.name}</strong>${duration(r.duration)}${r.locked?'<p>이전 탐색으로 연결 통로를 알아야 합니다.</p>':''}</button>`).join('')}</div>`,'place');
 if(screen==='detail'&&selected){const r=routes.find(r=>r.id===selected);if(r)app.innerHTML=page(r.name,`<p class="lead">${r.description}</p><p>소요 시간: ${duration(r.duration)}</p><p class="muted">실행하면 저녁으로 이동합니다. 다른 활동에 직접 참여할 수 없습니다.${selected!=='volunteer'&&Object.values(state.dialogue.promises).includes('pending')?' 봉사 참석 약속을 지키지 못하게 됩니다.':''}</p>${pending().filter(a=>a.day===state.day&&a.activity!==selected).map(a=>`<p class="notice">${state.npcs[a.person].name}과 한 ${a.label} 약속을 지키지 못하게 됩니다. 일정 화면에서 먼저 연락해 취소할 수 있습니다.</p>`).join('')}<div class="actions">${btn('이 활동 진행','act',selected)}${btn('취소','go','activities')}</div>`,'activities');}
 if(screen==='result')app.innerHTML=page('활동 완료',`<p class="lead">${esc(state.lastResult)}</p><p class="muted">${state.minutes}분이 지났습니다. 새 메시지가 도착했습니다.</p><div class="actions">${btn('캠퍼스로 돌아가기','go','campus')}${btn('활동 후 사람들 만나기','visit','hall')}${btn(state.day<3?'하루 마무리하기':'3일의 기록 보기','go','dayEnd')}</div>`);
 if(screen==='phone')app.innerHTML=page('휴대폰',`<div class="grid">${[['일정','schedule'],['메시지','messages'],['지도','map'],['일지','journal']].map(([t,id])=>`<button class="card" data-action="go" data-value="${id}"><strong>${t}</strong></button>`).join('')}</div>`,returnTo);
 if(screen==='schedule')app.innerHTML=page('오늘의 일정',`<p>${timeLabel()} · ${day.title}</p>${routes.map(r=>`<div class="list">${r.name} · ${duration(r.duration)} ${state.choice===r.id?'— 완료':''}${r.locked?' — 경로 미확인':''}</div>`).join('')}<h2>잡아둔 약속</h2>${commitments()}`,'phone');
 if(screen==='messages')app.innerHTML=page('메시지',state.messages.length?state.messages.map(m=>`<article class="list"><strong>${esc(m.from)} · ${m.day??1}일차</strong><p>${esc(m.text)}</p></article>`).join(''):'<p class="muted">새 메시지가 없습니다.</p>','phone');
 if(screen==='map')app.innerHTML=page('알고 있는 정보',`<p class="muted">활동과 대화에서 확인한 장소와 정보입니다. 직접 본 것과 전해 들은 경위는 일지에 남습니다.</p>${state.known.map(x=>`<div class="list">${esc(x)}</div>`).join('')||'<p>아직 기록된 장소가 없습니다.</p>'}`,'phone');
 if(screen==='journal')app.innerHTML=page('지금까지의 기록',state.memory.map(x=>`<div class="list">${esc(x)}</div>`).join('')||'<p class="muted">아직 기록이 없습니다.</p>','phone');
 if(screen==='dayEnd'){
  const history=[...state.dayHistory,{day:state.day,choice:state.choice}];
  app.innerHTML=page(state.day===3?'3일간의 대학생활':`${state.day}일차 마무리`,!evening?'<p>오후 활동을 먼저 마쳐주세요.</p>':`<p class="lead">${state.day===3?'같은 시간을 보내도, 남은 관계와 기억은 다르다.':'오늘을 마치고 다음 날로 넘어갈까요?'}</p>${history.map(h=>`<div class="list">${h.day}일차 · ${days[h.day].routes[h.choice]?.name??'미완료'}</div>`).join('')}<p class="muted">관계·대화 기억·약속·알게 된 정보는 다음 날에도 유지됩니다. 보지 못한 사건의 내부 기록은 이 화면에 공개하지 않습니다.</p>${state.day<3?btn(`${state.day+1}일차 시작하기`,'nextDay'):btn('일지 돌아보기','go','journal')}`);
 }
 if(screen==='menu')app.innerHTML=page('메뉴',`<p>김태이 · ${timeLabel()}</p><div class="grid">${[1,2,3].map(i=>`<article class="list"><strong>저장 슬롯 ${i}</strong><div class="actions">${btn('저장','save',i)}${btn('불러오기','load',i)}</div></article>`).join('')}</div>${btn('새 하루 시작','go','reset')}<hr><p class="muted">관계별 대화 비교 · 아래 버튼은 1일차부터 새 예시를 시작합니다. 현재 진행은 초기화되며 저장 슬롯은 유지됩니다.</p><div class="actions">${btn('서먹한 사이','scenario','acquaintance')}${btn('친한 동료','scenario','friend')}${btn('호감이 쌓인 사이','scenario','close')}</div>`);
 if(screen==='reset')app.innerHTML=page('새로 시작',`<p>진행을 1일차로 초기화합니다. 기존 저장 슬롯은 유지합니다.</p>${btn('새로 시작','reset')}`,'menu');
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action,v=b.dataset.value;note='';try{
 if(a==='go'){screen=v;reply=null;}
 if(a==='visit'){if(!locations[v])throw new Error('알 수 없는 장소입니다.');state.location=v;screen='place';reply=null;}
 if(a==='talk'){if(!presentPeople(state,atPlace()).includes(v))throw new Error('지금 이 장소에 없는 사람입니다.');speaker=v;const opened=openConversation(state,v);state=opened.state;reply=opened.result;screen='dialogue';}
 if(a==='answer'){const next=respond(state,speaker,v);state=next.state;reply=next.result;if(reply.leave){reply=null;screen='place';}}
 if(a==='endTopic'){state=endTopic(state,speaker);reply=null;}
 if(a==='group'){
  const present=presentPeople(state,atPlace());if(!present.includes('seoyeon')||!present.includes('soyul'))throw new Error('지금은 두 사람이 함께 있지 않습니다.');
  groupLines=groupDialogue(state);groupIndex=0;groupAnswered=false;screen='group';
  if(state.day>=2&&!state.known.includes('소율과 여경의 사진 협업')){state.known.push('소율과 여경의 사진 협업');state.memory.push(`[${state.day}일차] 서연과 소율의 대화에서 여경과의 사진 협업 이야기를 들었다.`);}
 }
 if(a==='groupNext')groupIndex++;
 if(a==='groupAnswer'){const next=respondGroup(state,v);state=next.state;groupLines=next.lines;groupIndex=0;groupAnswered=true;}
 if(a==='acceptAppointment'){state=acceptAppointment(state,v);note='내일 약속을 잡았습니다. 겹치는 약속은 휴대폰 일정에서 확인하고 미리 취소할 수 있습니다.';}
 if(a==='cancelAppointment'){state=cancelAppointment(state,v);note='미리 연락해 약속을 취소했습니다.';}
 if(a==='nextDay'){state=nextDay(state);screen='campus';reply=null;selected=null;returnTo='campus';}
 if(a==='scenario'){state=newGame(v);state.location='hall';reply=null;screen='place';}
 if(a==='phone'){returnTo=screen;screen='phone';}
 if(a==='select'){selected=v;screen='detail';}
 if(a==='act'){state=act(state,v);screen='result';}
 if(a==='save'){localStorage.setItem('campus.slot.'+v,save(state));note=`슬롯 ${v}에 저장했습니다.`;}
 if(a==='load'){const raw=localStorage.getItem('campus.slot.'+v);if(!raw)throw new Error('비어 있는 슬롯입니다.');state=restore(raw);reply=null;selected=null;note=`슬롯 ${v}을 불러왔습니다.`;}
 if(a==='reset'){state=newGame();screen='campus';selected=null;reply=null;returnTo='campus';}
}catch(err){note=err.message;}render();});
render();
