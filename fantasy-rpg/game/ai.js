(function(root){
 let state={ready:false,enabled:false,message:'로컬 실행기를 연결하면 ChatGPT 구독으로 대화할 수 있습니다.'};
 const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 function notify(){document.dispatchEvent(new CustomEvent('ai-status',{detail:{...state}}));}
 async function check(){
  if(!local){state={ready:false,enabled:false,message:'배포 링크는 체험 모드입니다. 저장소의 fantasy-rpg/game에서 start-game.cmd를 실행한 뒤 http://127.0.0.1:8092를 열어 주세요.'};notify();return state;}
  try{const response=await fetch('/api/health',{signal:AbortSignal.timeout(15000),cache:'no-store'});if(!response.ok)throw Error();const body=await response.json();if(body.provider!=='codex')throw Error();state={ready:body.ready===true,enabled:body.ready===true,message:body.message};}
  catch{state={ready:false,enabled:false,message:'로컬 AI 서버에 연결할 수 없습니다. Python 서버와 Codex 로그인 상태를 확인해 주세요.'};}
  notify();return state;
 }
 function demo(){state.enabled=false;notify();}
 function pending(){try{return JSON.parse(localStorage.getItem('fantasy-ai-pending-v1'));}catch{return null;}}
 async function send(scene,node,text){
  if(!state.ready||!state.enabled)throw Error('AI 연결을 먼저 확인해 주세요. 입력은 유지됩니다.');
  const prev=pending(),request=prev&&prev.scene===scene&&prev.node===node&&prev.text===text?prev:{scene,node,text,request_id:crypto.randomUUID()};
  try{localStorage.setItem('fantasy-ai-pending-v1',JSON.stringify(request));}catch{}
  let response;try{response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(195000)});}catch{throw Error('연결이 끊겼거나 응답 시간이 지났습니다. 같은 입력으로 다시 보내면 요청 번호를 재사용합니다.');}
  const body=await response.json();if(!response.ok)throw Error(body.error||'AI 응답에 실패했습니다.');
  if(!Array.isArray(body.panels)||!body.panels.length||body.panels.some(p=>!['speech','action'].includes(p.kind)||typeof p.text!=='string'||p.text.length>180))throw Error('AI 응답 형식이 올바르지 않습니다.');
  try{localStorage.removeItem('fantasy-ai-pending-v1');}catch{}
  return body.panels.map(p=>p.kind==='action'?'('+p.text+')':p.text).join('\n');
 }
 async function reset(){const r=await fetch('/api/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error('AI 대화 초기화에 실패했습니다.');try{localStorage.removeItem('fantasy-ai-pending-v1');}catch{}}
 root.GameAI={check,demo,send,reset,pending,get state(){return {...state};}};
})(globalThis);
