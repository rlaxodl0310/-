(function(r){'use strict';
function render(body,state,onAction,{disabled=false,onBoard=()=>{}}={}){
body.classList.add('escort-panel');const n=(tag,text,parent=body)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;},locked=disabled||state.era!=='fantasy'||state.combat?.status==='playing'||state.player.hp<=0;let pending=false;
n('small','MINING CONTRACT');n('h3','얕은 광맥 · 마석 채굴');const message=n('p','캐낼 물량과 돌아올 시간을 함께 확인하세요.');message.setAttribute('role','status');const board=n('button','협회 게시판');board.onclick=onBoard;board.disabled=disabled;
async function run(action){if(locked||pending)return;pending=true;const controls=[...body.querySelectorAll('button,select')].map(e=>[e,e.disabled]);controls.forEach(([e])=>e.disabled=true);try{await onAction(action);}catch(e){message.textContent=e.message;controls.forEach(([e,v])=>e.disabled=v);}finally{pending=false;}}
function button(text,action,parent=body,off=false){const b=n('button',text,parent);b.disabled=locked||off;b.onclick=()=>run(action);return b;}
const quests=(state.adventure?.quests||[]).filter(q=>q.type==='mining');if(!quests.length){n('p','카르덴의 도시 협회에서 박락 입구 채굴 의뢰를 확인할 수 있습니다. 이번 시제품의 지정 광맥은 유한하며, 다른 대륙에 광산을 자동 생성하지 않습니다.');return;}
const select=n('select','');select.setAttribute('aria-label','채굴 의뢰');for(const q of quests){const o=n('option',q.title+' · '+({open:'모집 중',accepted:'수행 중',completed:'정산 완료',expired:'기한 종료',failed:'실패'}[q.status]||q.status),select);o.value=q.id;}select.value=quests.some(q=>q.id===body.dataset.miningQuest)?body.dataset.miningQuest:MiningQuest.active(state)?.id||quests.at(-1).id;const content=n('div','');
function draw(){content.replaceChildren();const q=quests.find(q=>q.id===select.value),m=q.mining,v=MiningQuest.site(state),act=type=>({type,questId:q.id});n('h4',q.title,content);n('p',Adventure.locationName(q.issuerLocation)+' ↔ '+Adventure.locationName(q.destination)+' · 편도45분',content);n('p','보수 '+GameEconomy.format(q.reward)+' / '+q.experienceReward+'XP (파티 총량) · 남은 기한 '+Math.max(0,q.deadline-state.minutes).toFixed(1)+'분',content);n('p','계약 · 의뢰분1등급 마석4개와 대여 곡괭이 반납. 의뢰분은 협회 소유·판매 불가. 초과분은 실제 채굴자 태이 소유,귀환 후 회수.',content);
const stats=n('div','',content);stats.className='escort-stats';for(const [label,value,max]of[['곡괭이 내구도',m.tool,100],['의뢰분',m.contractOre+m.deliveredOre,q.target]]){const group=n('div','',stats);n('span',label+' '+value+'/'+max,group);const bar=n('progress','',group);bar.max=max;bar.value=value;bar.setAttribute('aria-label',label);}
n('p','운반 중 초과분 '+m.surplus+'개 / 귀환 회수 '+m.recovered+'개 · 광맥 잔량 '+(m.surveyCycle!==null||m.phase==='returned'?v.remaining:'미조사'),content);
if(m.surveyCycle!==null)n('p','소음 '+v.noise+'/100 · 안정도 '+v.stability+'/100 · 조사 후 작업 변화가 기록됩니다.',content);
n('strong',({planned:'출발 전',onsite:'현장 작업 가능',incident:'현장 신호에 대응',combat:'대화창 전투 중',returned:'귀환·반납 완료'}[m.phase])+' · '+({accepted:'계약 수행 중',completed:'정산 완료',failed:'미완수',expired:'기한 종료',open:'모집 중'}[q.status]||q.status),content);if(m.failureReason)n('p',m.failureReason,content);
if(locked)n('p',state.combat?.status==='playing'?'이 창을 닫고 대화창에서 전투를 진행해 주세요.':'이세계에서 장면 생성과 전투를 마친 뒤 이용해 주세요.',content);
if(q.status==='accepted'&&m.phase==='planned')button('곡괭이 대여 확인·채굴지 출발 ·45분',act('enter'),content);
if(['onsite','incident'].includes(m.phase)){
 if(['accepted','failed','expired'].includes(q.status)){
 button('광맥·주변 조사 ·10분',act('survey'),content,m.surveyCycle===v.cycles);
 if(q.status==='accepted'&&m.phase==='onsite')button('마석1개 채굴 ·25분 / 피로6·내구20',act('mine'),content,m.surveyCycle===null||m.tool<20||v.remaining===0||v.stability<=40);
 if(m.phase==='incident'){n('blockquote',m.incident.description,content);n('small',m.incident.source==='ai'?'현장 묘사 · AI / 판정 · 엔진':'현장 묘사·판정 · 로컬',content);}
 if(m.incident?.kind==='ambush'&&!m.incident.resolved)button('접근한 앤트 대응 ·대화창 전투',act('engage'),content);
 if(m.incident?.kind!=='unstable'||m.incident.resolved)button('조용히 주변 경계 ·15분 / 소음25 감소',act('wait'),content);
 button('지지대 보강 ·20분 / 내구10·안정도25',act('brace'),content,v.stability>=100||m.bracedCycle===v.cycles||m.tool<10||m.incident?.kind==='ambush'&&!m.incident.resolved);
 if(m.incident?.kind!=='ambush'||m.incident.resolved)button('안전한 지점 휴식 ·120분 / 피로25 회복',act('rest'),content);
 }
 if(['accepted','failed','expired'].includes(q.status))button('작업 종료·접수소 귀환 ·45분',act('return'),content,m.incident?.kind==='ambush'&&!m.incident.resolved);
}
if(q.status==='accepted'&&m.phase==='returned')button('실제 납품 증빙 제출·정산',act('submit'),content,!Adventure.ready(state,q));
if(q.status==='accepted'&&m.phase!=='combat'&&m.phase!=='returned')button('계약 중단 ·보상 없음·귀환 필요',act('abandon'),content);
if(m.returnReceipt)n('p','귀환 증빙 · '+m.returnReceipt.id+' / 납품 '+m.returnReceipt.quantity+'개 / '+m.returnReceipt.at+'분',content);if(q.receipt)n('p','정산 완료 · '+GameEconomy.format(q.receipt.reward)+' / '+q.receipt.xp+'XP',content);const history=n('details','',content);n('summary','채굴·소유권·귀환 기록',history);for(const h of m.history.slice(-14))n('p',h.at+'분 · '+h.text,history);
}
select.onchange=()=>{body.dataset.miningQuest=select.value;draw();};draw();const lab=n('a','본편 저장과 분리된 채굴 테스트');lab.href='mining/lab.html';
}
function hud(parent,state){const q=MiningQuest.active(state);parent.hidden=!q;if(!q)return;const m=q.mining;parent.textContent='채굴 · 의뢰분 '+m.contractOre+'/'+q.target+' · 곡괭이 '+m.tool+'/100 · 남은 기한 '+Math.max(0,q.deadline-state.minutes).toFixed(0)+'분';parent.setAttribute('aria-label','채굴 상태 확인 및 작업 여정 열기');}
r.MiningQuestUI={render,hud};})(globalThis);
