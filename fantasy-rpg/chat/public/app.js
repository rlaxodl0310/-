let state, busy = false, pending = null;
const $ = id => document.getElementById(id);
const draftKey = 'fantasy-chat-draft-v1';
async function api(path, data) {
  const response = await fetch(path, data ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)} : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '요청을 처리하지 못했습니다.');
  return result;
}
function node(tag, text, cls) { const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e; }
function setBusy(value) {
  busy=value;
  document.querySelectorAll('button').forEach(b=>b.disabled=value);
  $('message').disabled=value;
  $('send').textContent=value?'답변을 기다리는 중…':'말 건네기 ↗';
}
function draw() {
  const scene=state.scenes[state.scene];
  $('title').textContent=scene.title;$('caption').textContent=scene.caption;$('opening').textContent=scene.opening;
  document.querySelectorAll('.scene').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===state.scene)));
  $('turns').replaceChildren();
  for(const turn of state.turns){
    const row=node('div','','turn');row.append(node('div',turn.text,'player'),node('p',scene.speaker,'speaker'));
    for(const panel of turn.panels)row.append(node('div',panel.text,panel.kind));
    $('turns').append(row);
  }
  $('empty').hidden=state.turns.length>0;
  $('connection').textContent=state.configured?`대화 자동 저장 · ${state.turns.length} / ${state.max_turns}회`:'대화 모델 연결 준비 중 · 현재는 화면과 입력을 확인할 수 있어요.';
  $('suggestions').replaceChildren();
  if(!state.turns.length)for(const text of scene.suggestions){const b=node('button',text);b.type='button';b.onclick=()=>{$('message').value=text;changed();$('message').focus();};$('suggestions').append(b);}
}
function changed(){
  $('counter').textContent=`${$('message').value.length} / 800`;
  try{localStorage.setItem(draftKey,$('message').value);}catch{}
}
async function refresh(){state=await api('/api/state');draw();}
$('form').onsubmit=async event=>{
  event.preventDefault();const text=$('message').value.trim();if(busy||!text||!state)return;
  if(!pending||pending.text!==text||pending.scene!==state.scene)pending={text,scene:state.scene,id:crypto.randomUUID()};
  setBusy(true);$('error').textContent='';
  try{
    await api('/api/chat',{text,request_id:pending.id,expected_turn:state.turns.length});
    await refresh(); // Keep request ID until successful read-back, so a retry cannot duplicate a turn.
    pending=null;$('message').value='';changed();
    $('turns').lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(error){$('error').textContent=error.message;}
  finally{setBusy(false);$('message').focus();}
};
$('message').oninput=changed;
$('message').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('form').requestSubmit();}};
async function start(scene){
  if(busy)return;
  if((state.turns.length||$('message').value.trim())&&!confirm('새 대화를 시작할까요? 현재 기록은 먼저 내려받아 보관할 수 있어요.'))return;
  setBusy(true);$('error').textContent='';
  try{await api('/api/session',{scene});await refresh();pending=null;$('message').value='';changed();}catch(error){$('error').textContent=error.message;}finally{setBusy(false);}
}
document.querySelectorAll('.scene').forEach(b=>b.onclick=()=>start(b.dataset.scene));
$('restart').onclick=()=>start(state.scene);
$('export').onclick=async()=>{try{const data=await api('/api/export');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=node('a','');a.href=url;a.download='taei-dialogue.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){$('error').textContent=error.message;}};
setBusy(true);
refresh().then(()=>{try{$('message').value=localStorage.getItem(draftKey)||'';}catch{}changed();setBusy(false);}).catch(error=>{$('error').textContent=error.message+' 새로고침해 주세요.';});
