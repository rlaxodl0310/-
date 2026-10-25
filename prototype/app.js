import {people,dialogue,respond,groupDialogue,respondGroup} from './dialogue.js';
import {newGame,act,save,restore} from './simulation.js';
let state=newGame(),screen='campus',selected=null,note='',returnTo='campus',speaker='seoyeon',reply=null,groupLines=[],groupIndex=0,groupAnswered=false;
const app=document.querySelector('#app');
const activities={rehearsal:['','합주','2시간','연습실에서 합주하고 장비 위치를 익힙니다.'],volunteer:['','봉사 활동','3시간','물품 준비를 도우며 참여한 사람들과 시간을 보냅니다.'],explore:['','자유 탐색','1시간','학생회관 주변과 도서관으로 이어지는 길을 살펴봅니다.']};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,action,value='')=>`<button data-action="${action}" data-value="${value}">${text}</button>`;
function portrait(column){return `<div class="portrait" style="--column:${column}" role="img" aria-label="${column===0?'김태이':Object.values(people).find(p=>p.column===column)?.name} 정면 초상화"></div>`;}
function page(title,body,back='campus'){return `<section class="page"><header>${btn('← 뒤로','go',back)}<h1>${title}</h1></header>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}${body}<p class="footnote">흐름 검증용 시제품 · 사건과 일정은 예시입니다.</p></section>`;}
function render(){
  const evening=state.phase==='evening';
  if(screen==='campus') app.innerHTML=`<section class="explore"><div class="top"><span class="badge">목요일 · ${evening?'저녁':'오후'}</span><nav>${btn('휴대폰','phone')}${btn('메뉴','go','menu')}</nav></div>${portrait(0)}<div class="prompt"><span>캠퍼스 · 김태이</span>${btn('학생회관 들어가기','go','hall')}<small>이미지를 배경으로 사용한 화면 전환 시제품</small></div></section>`;
  if(screen==='hall') app.innerHTML=page('학생회관',`<p class="lead">${evening?'활동을 마친 사람들이 귀가를 준비하고 있다.':'봉사 준비실 쪽에서 학생들이 물품을 정리하고 있다.'}</p><div class="grid">${Object.entries(people).map(([id,p])=>`<button class="card person-card" data-action="talk" data-value="${id}"><strong>${p.name}</strong>이야기하기</button>`).join('')}</div><div class="actions">${btn('서연과 소율의 대화에 다가간다','group')}${evening?btn('오늘의 기록','go','journal'):btn('오후 활동 고르기','go','activities')}</div>`);
  if(screen==='dialogue'){
    const d=dialogue(state,speaker),p=people[speaker];
    app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','hall')}<span class="badge">학생회관 · ${evening?'저녁':'오후'}</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${p.name}</p><p class="muted">${esc(reply?.stage??d.stage)}</p><blockquote>${esc(reply?.text??d.opening)}</blockquote>${reply?.followup?`<p class="inner-line">${esc(reply.followup)}</p>`:''}<div class="dialogue-options">${reply?btn('이야기를 이어간다','continue'):d.options.map(o=>btn(esc(o.label),'answer',o.id)).join('')}</div><div class="actions">${btn('활동 살펴보기','go','activities')}</div></article></div></section>`;
  }
  if(screen==='group'){
    const line=groupLines[groupIndex],p=people[line.person];
    const end=groupIndex===groupLines.length-1;
    app.innerHTML=`<section class="conversation"><header class="top">${btn('← 대화 마치기','go','hall')}<span class="badge">학생회관 · 함께 나누는 대화</span></header><div class="conversation-body">${portrait(p.column)}<article class="dialogue-panel"><p class="eyebrow">${p.name}</p><p class="muted">서연과 소율이 휴대폰의 사진을 함께 보고 있다.</p><blockquote>${esc(line.text)}</blockquote><div class="dialogue-options">${!end?btn('다음 대화','groupNext'):groupAnswered?btn('대화 마치기','go','hall'):[btn('소율이 고를 때까지 기다린다.','groupAnswer','wait'),btn('나도 같이 봐도 돼요?','groupAnswer','include'),btn('서연이가 대신 설명해주면 되겠네.','groupAnswer','speakFor')].join('')}</div></article></div></section>`;
  }
  if(screen==='activities') app.innerHTML=page('오후 활동',evening?'<p>이미 오후 활동을 완료했습니다.</p>':`<p class="muted">${Object.values(state.dialogue.promises).includes('pending')?'봉사 참석을 약속한 상태입니다. 다른 활동을 택하면 약속을 지키지 못합니다.':'현재 참석 약속은 없습니다.'} 선택하지 않은 장소에서도 일정은 진행됩니다.</p><div class="grid">${Object.entries(activities).map(([id,a])=>`<button class="card" data-action="select" data-value="${id}"><strong>${a[1]}</strong>${a[2]}</button>`).join('')}</div>`,'hall');
  if(screen==='detail'&&selected){const a=activities[selected];app.innerHTML=page(a[1],`<p class="lead">${a[3]}</p><p>소요 시간: ${a[2]}</p><p class="muted">실행하면 저녁으로 이동합니다. 다른 활동에 직접 참여할 수 없습니다.${selected!=='volunteer'&&Object.values(state.dialogue.promises).includes('pending')?' 봉사 참석 약속을 지키지 못하게 됩니다.':''}</p><div class="actions">${btn('이 활동 진행','act',selected)}${btn('취소','go','activities')}</div>`,'activities');}
  if(screen==='result') app.innerHTML=page('활동 완료',`<p class="lead">${esc(state.memory.at(-1))}</p><p class="muted">${state.minutes}분이 지났습니다. 새 메시지가 도착했습니다.</p>${btn('캠퍼스로 돌아가기','go','campus')}`);
  if(screen==='phone') app.innerHTML=page('휴대폰',`<div class="grid">${[['일정','schedule'],['메시지','messages'],['지도','map'],['일지','journal']].map(([t,id])=>`<button class="card" data-action="go" data-value="${id}"><strong>${t}</strong></button>`).join('')}</div>`,returnTo);
  if(screen==='schedule') app.innerHTML=page('오늘의 일정',`<p class="muted">오후의 세 활동 중 하나를 선택합니다. 시제품은 오후부터 시작합니다.</p>${Object.entries(activities).map(([id,a])=>`<div class="list">${a[1]} · ${a[2]} ${state.choice===id?'— 완료':''}</div>`).join('')}`,'phone');
  if(screen==='messages') app.innerHTML=page('메시지',state.messages.length?state.messages.map(m=>`<article class="list"><strong>${esc(m.from)}</strong><p>${esc(m.text)}</p></article>`).join(''):'<p class="muted">새 메시지가 없습니다.</p>','phone');
  if(screen==='map') app.innerHTML=page('알고 있는 장소',`<p class="muted">이번 활동에서 직접 확인한 장소와 정보입니다.</p>${state.known.map(x=>`<div class="list">${esc(x)}</div>`).join('')||'<p>아직 기록된 장소가 없습니다.</p>'}`,'phone');
  if(screen==='journal') app.innerHTML=page('오늘의 기록',state.memory.map(x=>`<div class="list">${esc(x)}</div>`).join('')||'<p class="muted">아직 기록이 없습니다.</p>','phone');
  if(screen==='menu') app.innerHTML=page('메뉴',`<p>김태이 · ${evening?'저녁':'오후'}</p><div class="grid">${[1,2,3].map(i=>`<article class="list"><strong>저장 슬롯 ${i}</strong><div class="actions">${btn('저장','save',i)}${btn('불러오기','load',i)}</div></article>`).join('')}</div>${btn('새 하루 시작','go','reset')}<hr><p class="muted">관계별 대화 비교 · 아래 버튼은 새 예시를 시작합니다. 현재 진행은 초기화되며 저장 슬롯은 유지됩니다.</p><div class="actions">${btn('서먹한 사이','scenario','acquaintance')}${btn('친한 동료','scenario','friend')}${btn('호감이 쌓인 사이','scenario','close')}</div>`);
  if(screen==='reset') app.innerHTML=page('새 하루 시작',`<p>현재 진행을 초기화합니다. 기존 저장 슬롯은 유지합니다.</p>${btn('새로 시작','reset')}`,'menu');
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action,v=b.dataset.value;note='';try{
  if(a==='go'){screen=v;reply=null;}
  if(a==='talk'){speaker=v;reply=null;screen='dialogue';}
  if(a==='answer'){const next=respond(state,speaker,v);state=next.state;reply=next.result;}
  if(a==='continue')reply=null;
  if(a==='group'){groupLines=groupDialogue(state);groupIndex=0;groupAnswered=false;screen='group';}
  if(a==='groupNext')groupIndex++;
  if(a==='groupAnswer'){const next=respondGroup(state,v);state=next.state;groupLines=next.lines;groupIndex=0;groupAnswered=true;}
  if(a==='scenario'){state=newGame(v);reply=null;screen='hall';}
  if(a==='phone'){returnTo=screen;screen='phone';}
  if(a==='select'){selected=v;screen='detail';}
  if(a==='act'){state=act(state,v);screen='result';}
  if(a==='save'){localStorage.setItem('campus.slot.'+v,save(state));note=`슬롯 ${v}에 저장했습니다.`;}
  if(a==='load'){const raw=localStorage.getItem('campus.slot.'+v);if(!raw)throw new Error('비어 있는 슬롯입니다.');state=restore(raw);note=`슬롯 ${v}을 불러왔습니다.`;}
  if(a==='reset'){state=newGame();screen='campus';selected=null;returnTo='campus';}
}catch(err){note=err.message;}render();});
render();
