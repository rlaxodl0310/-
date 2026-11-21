(function(r){'use strict';
const labels={planned:'경로 협의·출발 전',travelling:'이동 가능',incident:'현장 대응',combat:'대화창 전투 중',arrived:'접수처 인계 대기',delivered:'인계 확인·정산 가능',failed:'계약 실패',abandoned:'중단'};
function hud(parent,state){const q=PersonalEscort.active(state);parent.hidden=!q;if(!q)return;const e=q.personal;parent.textContent='학자 호위 '+e.leg+'/3 · 의뢰인HP '+Math.ceil(e.clientHP)+' · 자료 '+Math.ceil(e.notes)+'%';parent.setAttribute('aria-label','학자 상태와 개인 호위 열기');}
function render(body,state,onAction,{disabled=false,onBoard=()=>{}}={}){
body.classList.add('escort-panel');const n=(tag,text,parent=body)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;},locked=disabled||state.era!=='fantasy'||state.combat?.status==='playing'||state.player.hp<=0;let pending=false;
n('small','PERSONAL ESCORT');n('h3','자료 운반 학자');const message=n('p',locked?'진행 중인 장면·전투를 마친 뒤 이용해 주세요.':'경로를 제안하면 학자가 현재 사정에 따라 응답합니다.');message.setAttribute('role','status');const board=n('button','협회 게시판');board.onclick=onBoard;board.disabled=disabled;
async function run(action){if(locked||pending)return;pending=true;const controls=[...body.querySelectorAll('button,select')].map(e=>[e,e.disabled]);controls.forEach(([e])=>e.disabled=true);try{await onAction(action);}catch(e){message.textContent=e.message;controls.forEach(([e,v])=>e.disabled=v);}finally{pending=false;}}
function button(text,action,parent=body){const b=n('button',text,parent);b.disabled=locked;b.onclick=()=>run(action);return b;}
const quests=(state.adventure?.quests||[]).filter(q=>q.type==='escort');if(!quests.length)n('p','협회가 있는 도시에서 개인 호위 의뢰를 수락하세요.');
if(quests.length){const select=n('select','');select.setAttribute('aria-label','개인 호위 의뢰');for(const q of quests){const o=n('option',q.title+' · '+({open:'모집 중',accepted:'수행 중',completed:'정산 완료',expired:'기한 종료',failed:'실패'}[q.status]||q.status),select);o.value=q.id;}select.value=quests.some(q=>q.id===body.dataset.personalQuest)?body.dataset.personalQuest:PersonalEscort.active(state)?.id||quests.at(-1).id;const content=n('div','');
function draw(){content.replaceChildren();const q=quests.find(q=>q.id===select.value),e=q.personal,c=e.contract,act=type=>({type,questId:q.id});n('h4',q.title,content);n('p',Adventure.locationName(q.issuerLocation)+' → '+Adventure.locationName(q.destination),content);n('p',c.name+' · 남은 기한 '+Math.max(0,q.deadline-state.minutes).toFixed(1)+'분 · '+GameEconomy.format(q.reward)+' / '+q.experienceReward+'XP (파티 총량)',content);n('p','계약 조건 · 의뢰인HP '+c.minHP+' 이상 / 자료 '+c.minNotes+' 이상'+(c.visitLeg?' / 첫 구간 현장 대조30분':'')+' / 기한 내 인계',content);
const stats=n('div','',content);stats.className='escort-stats';for(const[key,label]of[['clientHP','의뢰인HP'],['notes','자료 보존']]){const g=n('div','',stats);n('span',label+' '+Math.ceil(e[key])+'/100',g);const bar=n('progress','',g);bar.max=100;bar.value=e[key];bar.setAttribute('aria-label',label);}
n('p','학자 상태 · '+(e.stress>=80?'이동을 망설임·휴식 필요':e.stress>=45?'긴장한 모습':'차분함')+' / 합의 경로 · '+({safe:'안전한 길',fast:'빠른 길'}[e.path]||'미정'),content);n('strong',q.status==='completed'?'정산 완료':labels[e.phase],content);if(e.failureReason)n('p',e.failureReason,content);
const route=n('ol','',content);route.className='escort-route';for(const[i,id]of e.route.legs.entries()){const li=n('li',(i+1)+'구간 · '+Adventure.locationName(id)+' / 안전 '+PersonalEscort.policy.safeMinutes[i]+'분 · 빠른 '+PersonalEscort.policy.fastMinutes[i]+'분',route);li.dataset.done=String(e.leg>i);}
if(q.status==='accepted'){
 if(['planned','travelling'].includes(e.phase)){n('p','경로 논의5분 · 위험한 길은 거절할 수 있습니다. 경로별 상황과 대응 시간은 달라집니다.',content);button('안전한 길 제안',{...act('propose-route'),path:'safe'},content);button('빠른 길 제안',{...act('propose-route'),path:'fast'},content);}
 if(e.phase==='planned'){const b=button('합의한 경로로 출발',act('start'),content);b.disabled=locked||!e.path;}
 if(e.phase==='travelling'){if(c.visitLeg===e.leg&&!e.studyProof)button('계약 현장 대조 · 30분',act('study'),content);else button('다음 구간으로 이동 · '+(e.path?PersonalEscort.policy[e.path+'Minutes'][e.leg]:0)+'분',act('advance'),content);}
 if(e.phase==='incident'){n('p',e.incident.description,content);if(!e.incident.reassured)button('안심시키며 대응 의논 · 5분',act('reassure'),content);button('함께 우회 · 25분',act('detour'),content);if(e.incident.kind==='ambush')button('의뢰인 보호·대화창 전투',act('engage'),content);}
 if(['travelling','arrived'].includes(e.phase)||e.phase==='incident'&&e.incident.kind==='roadblock')button('함께 휴식 · 120분 / 피로25·불안30 회복',act('rest'),content);
 if(e.phase==='arrived')button('학자·자료 접수처 인계',act('handover'),content);if(e.phase==='delivered')button('계약 증빙 제출·정산',act('submit'),content);
 if(!['delivered','combat','failed','abandoned'].includes(e.phase))button('계약 중단 · 보상 없음',act('abandon'),content);
}
if(e.phase==='combat')n('p','대화창에서 공격·방어 등의 행동을 입력하세요. 방어하면 의뢰인 대신 태이가 공격을 받아냅니다. 학자가 다치면 자료도 손상될 수 있습니다.',content);
if(e.opinions.length){const o=e.opinions.at(-1);n('blockquote','학자: “'+o.text+'” · '+(o.decision==='accept'?'동의':'거절')+' ('+(o.source==='ai'?'AI 응답':'로컬 판단')+')',content);}
if(q.receipt)n('p','정산 완료 · '+GameEconomy.format(q.receipt.reward)+' / '+q.receipt.xp+'XP',content);const history=n('details','',content);n('summary','협의·이동 기록',history);for(const h of e.history.slice(-12))n('p',h.at+'분 · '+h.text,history);
}
select.onchange=()=>{body.dataset.personalQuest=select.value;draw();};draw();}
const contacts=(state.personalContacts||[]).filter(c=>c.location===state.location);if(contacts.length){n('h4','이 도시에서 다시 만날 수 있는 의뢰인');for(const c of contacts){n('p',c.name+' · 이전 인계 '+c.completedJobs+'회');button('다시 만나 이야기 · 5분',{type:'reunite',contactId:c.id});const b=button('다음 이동 부탁 확인',{type:'followup',contactId:c.id});b.disabled=locked||c.lastReunionAt===null;}}
const lab=n('a','개인 호위 테스트 · 본편 저장과 분리');lab.href='escort/personal-lab.html';
}
r.PersonalEscortUI={render,hud};})(globalThis);
