'use strict';
window.AIDiagnosticsUI={open(body){
 const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
 body.append(node('p','실제 ChatGPT와 의뢰 생성·오류 수정·두 턴 대화를 시험합니다. 본편 저장은 사용하지 않으며 구독 사용 한도가 소모됩니다.'));
 const mode=node('select','');for(const [value,label]of [['quick','기본 진단'],['long','24턴 대화·저장 복원']]){const option=node('option',label);option.value=value;mode.append(option);}body.append(mode,node('p','장기 진단은 최소 24개 장면을 생성하며, 수정 호출이 추가될 수 있어 시간과 구독 한도를 더 사용합니다.'));
 const start=node('button','실제 AI 진단 시작'),cancel=node('button','진단 중단'),download=node('button','결과 JSON 저장'),out=node('div','');out.setAttribute('aria-live','polite');body.append(start,cancel,download,out);let timer,report;
 const invoke=async(method,arg)=>{const r=await window.desktopAI[method](arg);if(!r.ok)throw Error(r.error);return r.data;};
 const paint=r=>{report=r;mode.disabled=r.status==='running';start.disabled=r.status==='running';cancel.disabled=r.status!=='running';download.disabled=!r.cases?.length;out.replaceChildren(node('p','상태: '+r.status));if(r.error)out.append(node('p',r.error));for(const row of r.cases||[]){const box=node('section','');box.append(node('h3',({board:'의뢰 생성',repair:'탱탱 수정 피드백',dialogue:'대화 연속성','long-dialogue':'24턴 기억·저장 복원'})[row.kind]+' · '+row.status),node('p',row.message||(row.totalTurns?(row.phase+' · '+row.completedTurns+'/'+row.totalTurns+'턴'):'모델 응답 대기 중…')));const details=node('details',''),summary=node('summary','응답·검토 기록 보기'),pre=node('pre',JSON.stringify(row,null,2));pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';details.append(summary,pre);box.append(details);out.append(box);}};
 const poll=async()=>{if(!body.isConnected)return;try{const r=await invoke('diagnosticsStatus');paint(r);if(r.status==='running')timer=setTimeout(poll,1200);}catch(e){out.textContent=e.message;start.disabled=false;}};
 start.onclick=async()=>{clearTimeout(timer);start.disabled=true;try{paint(await invoke('diagnosticsStart',{mode:mode.value}));poll();}catch(e){out.textContent=e.message;start.disabled=false;}};
 cancel.onclick=async()=>{try{paint(await invoke('diagnosticsCancel'));poll();}catch(e){out.textContent=e.message;}};
 download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=node('a','');a.href=url;a.download='fantasy-ai-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 if(!window.desktopAI?.diagnosticsStart){out.textContent='진단은 데스크톱 앱에서 실행할 수 있습니다.';start.disabled=cancel.disabled=download.disabled=true;}else poll();
}};
