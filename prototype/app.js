import {newGame,act,save,restore} from './simulation.js';
let state=newGame(),screen='campus',selected=null,note='',returnTo='campus';
const app=document.querySelector('#app');
const activities={rehearsal:['','합주','2시간','연습실에서 합주하고 장비 위치를 익힙니다.'],volunteer:['','봉사 활동','3시간','물품 준비를 도우며 참여한 사람들과 시간을 보냅니다.'],explore:['','자유 탐색','1시간','학생회관 주변과 도서관으로 이어지는 길을 살펴봅니다.']};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,action,value='')=>`<button data-action="${action}" data-value="${value}">${text}</button>`;
function page(title,body,back='campus'){return `<section class="page"><header>${btn('← 뒤로','go',back)}<h1>${title}</h1></header>${note?`<p class="notice" role="status">${esc(note)}</p>`:''}${body}<p class="footnote">흐름 검증용 시제품 · 사건과 일정은 예시입니다.</p></section>`;}
function render(){
  const evening=state.phase==='evening';
  if(screen==='campus') app.innerHTML=`<section class="explore"><div class="top"><span class="badge">목요일 · ${evening?'저녁':'오후'}</span><nav>${btn('휴대폰','phone')}${btn('메뉴','go','menu')}</nav></div><div class="prompt"><span>캠퍼스 · 김태이</span>${btn('학생회관 들어가기','go','hall')}<small>이미지를 배경으로 사용한 화면 전환 시제품</small></div></section>`;
  if(screen==='hall') app.innerHTML=page('학생회관',`<p class="lead">${evening?'하루의 활동을 마쳤다.':'오늘 오후는 어떻게 보낼까?'}</p><p class="muted">${evening?'휴대폰에서 새 메시지와 오늘의 기록을 확인할 수 있습니다.':'봉사 준비실 쪽에서 학생들이 물품을 옮기고 있다.'}</p>${!evening?`<div class="actions">${btn('한서연과 이야기하기','go','dialogue')}${btn('오후 활동 고르기','go','activities')}</div>`:btn('오늘의 기록','go','journal')}`);
  if(screen==='dialogue') app.innerHTML=page('대화',`<div class="dialogue"><p>한서연</p><blockquote>“오늘 봉사 활동에 와요?”</blockquote><div class="actions">${btn('준비할 게 있어요?','go','reply')}${btn('아직 일정을 보고 있어요.','go','hall')}</div></div>`,'hall');
  if(screen==='reply') app.innerHTML=page('대화',`<div class="dialogue"><p>한서연</p><blockquote>“물품 준비를 같이 할 거예요. 시간 괜찮으면 들러요.”</blockquote>${btn('활동 살펴보기','go','activities')}</div>`,'hall');
  if(screen==='activities') app.innerHTML=page('오후 활동',evening?'<p>이미 오후 활동을 완료했습니다.</p>':`<p class="muted">이번 예시에는 사전 참석 약속이 없습니다. 선택하지 않은 장소에서도 일정은 진행됩니다.</p><div class="grid">${Object.entries(activities).map(([id,a])=>`<button class="card" data-action="select" data-value="${id}"><strong>${a[1]}</strong>${a[2]}</button>`).join('')}</div>`,'hall');
  if(screen==='detail'&&selected){const a=activities[selected];app.innerHTML=page(a[1],`<p class="lead">${a[3]}</p><p>소요 시간: ${a[2]}</p><p class="muted">실행하면 저녁으로 이동합니다. 다른 활동에 직접 참여할 수 없습니다.</p><div class="actions">${btn('이 활동 진행','act',selected)}${btn('취소','go','activities')}</div>`,'activities');}
  if(screen==='result') app.innerHTML=page('활동 완료',`<p class="lead">${esc(state.memory.at(-1))}</p><p class="muted">${state.minutes}분이 지났습니다. 새 메시지가 도착했습니다.</p>${btn('캠퍼스로 돌아가기','go','campus')}`);
  if(screen==='phone') app.innerHTML=page('휴대폰',`<div class="grid">${[['일정','schedule'],['메시지','messages'],['지도','map'],['일지','journal']].map(([t,id])=>`<button class="card" data-action="go" data-value="${id}"><strong>${t}</strong></button>`).join('')}</div>`,returnTo);
  if(screen==='schedule') app.innerHTML=page('오늘의 일정',`<p class="muted">오후의 세 활동 중 하나를 선택합니다. 시제품은 오후부터 시작합니다.</p>${Object.entries(activities).map(([id,a])=>`<div class="list">${a[1]} · ${a[2]} ${state.choice===id?'— 완료':''}</div>`).join('')}`,'phone');
  if(screen==='messages') app.innerHTML=page('메시지',state.messages.length?state.messages.map(m=>`<article class="list"><strong>${esc(m.from)}</strong><p>${esc(m.text)}</p></article>`).join(''):'<p class="muted">새 메시지가 없습니다.</p>','phone');
  if(screen==='map') app.innerHTML=page('알고 있는 장소',`<p class="muted">이번 활동에서 직접 확인한 장소와 정보입니다.</p>${state.known.map(x=>`<div class="list">${esc(x)}</div>`).join('')||'<p>아직 기록된 장소가 없습니다.</p>'}`,'phone');
  if(screen==='journal') app.innerHTML=page('오늘의 기록',state.memory.map(x=>`<div class="list">${esc(x)}</div>`).join('')||'<p class="muted">아직 기록이 없습니다.</p>','phone');
  if(screen==='menu') app.innerHTML=page('메뉴',`<p>김태이 · ${evening?'저녁':'오후'}</p><div class="grid">${[1,2,3].map(i=>`<article class="list"><strong>저장 슬롯 ${i}</strong><div class="actions">${btn('저장','save',i)}${btn('불러오기','load',i)}</div></article>`).join('')}</div>${btn('새 하루 시작','go','reset')}`);
  if(screen==='reset') app.innerHTML=page('새 하루 시작',`<p>현재 진행을 초기화합니다. 기존 저장 슬롯은 유지합니다.</p>${btn('새로 시작','reset')}`,'menu');
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action,v=b.dataset.value;note='';try{
  if(a==='go')screen=v;
  if(a==='phone'){returnTo=screen;screen='phone';}
  if(a==='select'){selected=v;screen='detail';}
  if(a==='act'){state=act(state,v);screen='result';}
  if(a==='save'){localStorage.setItem('campus.slot.'+v,save(state));note=`슬롯 ${v}에 저장했습니다.`;}
  if(a==='load'){const raw=localStorage.getItem('campus.slot.'+v);if(!raw)throw new Error('비어 있는 슬롯입니다.');state=restore(raw);note=`슬롯 ${v}을 불러왔습니다.`;}
  if(a==='reset'){state=newGame();screen='campus';selected=null;returnTo='campus';}
}catch(err){note=err.message;}render();});
render();
