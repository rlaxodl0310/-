import {initializeRisk,tellRiskEvidence,rememberRisk} from './risk-decisions.js';
import {learnEvent} from './event-view.js';
import {recordEvent} from './event-engine.js';
import {contact,identities} from './identity.js';
import {socialIntent} from './social-reasoning.js';
import {noteWarning,prepareWarnings} from './warning-records.js';

export const warningSites={
 sidegate:{location:'hall',label:'자유관 뒤편 출입구의 임시 통제',text:'뒤편 출입문 앞에 이동식 안내대가 놓여 있다. 직원이 지나가던 사람들에게 정문을 이용해 달라고 말한다. 종이 안내문은 가까이 가야 읽을 수 있다.',action:'출입문을 막지 않는 쪽에서 안내문을 읽는다.',detail:'안내문에는 응급 차량 동선 확보를 위해 잠시 다른 출입구를 이용해 달라고 적혀 있다. 누구를 위한 조치인지는 나와 있지 않다.',extra:'응급 차량 동선 확보 안내'},
 entrance:{location:'library',label:'도서관의 임시 운영 변경',text:'로비 전광판의 자료실 운영 시간이 평소보다 짧게 표시되어 있다. 옆에는 새 안내문이 붙어 있고, 열람실로 들어가는 사람들은 계속 보인다.',action:'안내문에서 바뀐 운영 범위를 확인한다.',detail:'일부 지원 인력의 부재로 자료실 운영을 단축한다는 내용이다. 열람실은 정상 운영한다. 부재 이유는 적혀 있지 않다.',extra:'도서관 지원 인력 공백 안내'},
 street:{location:'cafe',label:'정류장 앞에 정차한 구급차',text:'창밖 정류장 쪽에 구급차 한 대가 서 있다. 몇몇 사람이 거리를 두고 바라보고, 다른 학생들은 옆으로 돌아 지나간다. 이 자리에서는 무슨 일인지 알 수 없다.',action:'길을 막지 않고 창가에서 잠깐 상황을 지켜본다.',detail:'구급대원들이 한 사람을 들것에 옮긴다. 차 문이 닫히고 주변 사람들이 흩어진다. 쓰러진 이유나 상태를 확인할 수는 없었다.',extra:'정류장에서 목격한 응급 이송'}
};
export function warningPhase(state){
 const s=initializeRisk(state);prepareWarnings(s);
 if(s.day!==3||s.phase!=='afternoon'||(s.world?.stage??'campus')!=='campus')return s;
 const scheduled=recordEvent(s,{id:'campus-staff-delay',kind:'scheduled',participants:[],status:'resolved',visibility:'notice',result:'행사 지원 인력 일부의 도착이 늦어져 남은 인원으로 준비를 이어가기로 했다.',warning:{id:'staff-delay',label:'행사 지원 인력의 도착 지연',detail:'행사 안내에는 지원 인력 일부가 늦으며 준비는 예정대로 진행한다고 적혀 있다. 이유는 안내되지 않았다.',source:'교내 행사 안내',kind:'notice'}});
 if(scheduled.created)s.messages.push({day:s.day,from:'교내 행사 안내',read:false,eventKey:`campus:3:campus-staff-delay`,text:'오늘 행사 지원 인력 일부의 도착이 늦고 있습니다. 준비는 예정대로 진행하며 담당 구역은 현장에서 다시 안내하겠습니다.'});
 const id=['yeogyeong','soyul','seoyeon'].find(id=>contact(s,id).introduced&&socialIntent(s,id).feelsSafe&&(s.relations[`${id}>taei`]?.familiarity??0)>=3);
 if(!id)return s;
 const reports={
 yeogyeong:{label:'물품 담당자와 연락이 닿지 않는다는 이야기',detail:'차여경은 물품 전달 담당자가 오지 않아 직접 연락했지만 아직 답을 받지 못했다고 말했다. 담당자의 사정은 모른다.',text:'아침에 오기로 한 물품 담당자가 아직 안 왔어요. 제가 연락해봤는데 답이 없네요. 일단 남은 사람끼리 준비해볼게요. 혹시 오면 안내문부터 봐주세요.'},
 soyul:{label:'학교 앞 구급차를 봤다는 이야기',detail:'박소율은 학교 앞에서 구급차를 봤다고 말했다. 이송 이유나 환자의 상태는 모른다고 덧붙였다.',text:'학교 앞에서 구급차를 봤어요. 사람들이 좀 모여 있었는데 저는 그냥 지나왔어요. 무슨 일인지는 몰라요. 혹시 그쪽 지나가면 길 막힌 건 없는지 봐주세요.'},
 seoyeon:{label:'출입구 통제를 전해 들었다는 이야기',detail:'한서연은 뒤편 출입구가 막혔다는 말을 다른 학생에게 들었다고 말했다. 직접 확인한 내용은 아니다.',text:'다른 학생한테 뒤편 출입구를 잠깐 막았다는 말을 들었어요. 저는 직접 못 봤고요. 그쪽으로 갈 거면 안내문을 먼저 봐요. 그냥 다른 문으로 가도 되고요.'}
 };
 const report=reports[id],r=recordEvent(s,{id:'trusted-campus-message',kind:'conditional',participants:[id],status:'resolved',visibility:'message',result:report.detail,warning:{id:'trusted-report',label:report.label,detail:report.detail,source:identities[id].name+'의 메시지',kind:'report'}});
 if(r.created)s.messages.push({day:s.day,from:identities[id].name,eventKey:'campus:3:trusted-campus-message',read:false,text:report.text});
 return s;
}
export function beginWarningSite(state,location,spot){
 const site=warningSites[spot];if((state.world?.stage??'campus')!=='campus'||state.day!==3||site?.location!==location)return null;
 const s=structuredClone(state),w=prepareWarnings(s);
 if(w.resolved[spot])return {state:s,scene:null,observation:'다시 확인했지만 새 안내는 없었다. '+site.text};
 const event=recordEvent(s,{id:'campus-observation:'+spot,kind:'situational',participants:['taei'],status:'pending',visibility:'observed',result:site.text});learnEvent(s,event.event,'observed');
 noteWarning(s,{id:spot,label:site.label,detail:site.text,source:'직접 목격',kind:'direct'});
 return {state:s,scene:{spot,location,day:s.day,phase:s.phase,text:site.text,action:site.action}};
}
export function finishWarningSite(state,scene,inspect){
 if(!scene||scene.day!==state.day||scene.phase!==state.phase||scene.location!==state.location)throw new Error('지금 확인할 수 있는 장면이 아닙니다.');
 const s=structuredClone(state),w=prepareWarnings(s),site=warningSites[scene.spot];
 if(!site||w.resolved[scene.spot])throw new Error('이미 확인한 장면입니다.');
 w.resolved[scene.spot]=inspect?'checked':'passed';
 const event=s.events.find(e=>e.id==='campus-observation:'+scene.spot);if(event){event.status='resolved';event.outcome=inspect?'checked':'passed';}
 if(inspect)noteWarning(s,{id:scene.spot+'-detail',label:site.extra,detail:site.detail,source:scene.spot==='street'?'직접 목격':'현장 안내문',kind:scene.spot==='street'?'direct':'notice'});
 return {state:s,text:inspect?site.detail:'더 가까이 확인하지 않고 원래 가던 길로 돌아왔다.'};
}
export function warningActivity(state,choice){
 if(state.day!==3||(state.world?.stage??'campus')!=='campus')return state;
 const s=structuredClone(state);
 if(['backstage','exhibit'].includes(choice)){noteWarning(s,{id:'staff-delay',label:'행사 지원 인력의 도착 지연',detail:'현장 담당자가 아직 오지 않은 지원 인력의 구역을 나누어 맡아 달라고 안내했다. 지연 이유는 듣지 못했다.',source:'행사 준비 현장',kind:'direct'});const delay=s.events.find(e=>e.id==='campus-staff-delay');if(delay)learnEvent(s,delay,'participated');}
 if(choice==='checkCampus'){
  for(const spot of ['sidegate','entrance']){
   const site=warningSites[spot];
   const registered=recordEvent(s,{id:'campus-observation:'+spot,kind:'situational',phase:'afternoon',participants:['taei'],status:'resolved',outcome:'checked',result:site.detail});registered.event.status='resolved';registered.event.outcome='checked';learnEvent(s,registered.event,'observed');
   noteWarning(s,{id:spot,label:site.label,detail:site.text,source:'직접 목격',kind:'direct'});
   noteWarning(s,{id:spot+'-detail',label:site.extra,detail:site.detail,source:'현장 안내문',kind:'notice'});
   prepareWarnings(s).resolved[spot]='checked';
  }
  const companions=s.appointments.filter(a=>a.id?.startsWith('risk-escort:')&&a.status==='kept'&&a.activity==='checkCampus').map(a=>a.person);
  for(const id of companions){rememberRisk(s,id,{topic:'gate',kind:'direct',source:'self',label:'출입구 통제 안내'});rememberRisk(s,id,{topic:'library',kind:'direct',source:'self',label:'자료실 운영 변경'});s.risk.actions.push({id:`escort:${id}:3`,day:3,actor:id,kind:'accompanied-check'});}
  s.location='library';s.lastResult='자유관과 도서관의 현장 안내를 확인했다. 응급 차량 동선 확보와 자료실 운영 단축은 알게 됐지만, 같은 원인인지 확인할 근거는 없었다.';
  if(companions.length)s.lastResult+=' '+companions.map(id=>identities[id].name).join(', ')+'과 함께 안내를 확인하고 각자의 정리 일정으로 돌아갔다.';
  s.memory.push('[3일차] 현장 안내를 확인했다. 남은 시간에는 다른 일을 이어갈 수 있다.');
 }
 return s;
}

export function discussWarnings(state,id,evidenceKey){
 if(state.day!==3||!contact(state,id).introduced||!(state.warnings?.evidence?.length))throw new Error('먼저 직접 확인하거나 전달받은 일이 있어야 이야기할 수 있습니다.');
 let s=structuredClone(state);const chosen=evidenceKey?s.warnings.evidence.find(e=>e.key===evidenceKey):null;if(evidenceKey&&!chosen)throw new Error('접한 내용만 이야기할 수 있습니다.');const direct=s.warnings.evidence.find(e=>e.kind==='direct'),e=chosen??direct??s.warnings.evidence[0];s=tellRiskEvidence(s,id,e.key);
 const playerLine=e.kind==='direct'?`아까 ${e.label} 상황을 직접 봤어요. 혹시 무슨 일인지 들은 거 있어요?`:`${e.source}에서 ${e.label} 이야기를 접했어요. 혹시 더 들은 건 있어요?`;
 const safe=socialIntent(s,id).feelsSafe;
 const text={yeogyeong:safe?'저도 연락 안 되는 담당자 때문에 확인 중이에요. 근데 서로 같은 일인지는 모르겠어요. 일단 인원부터 다시 맞춰보려고요. 선배도 일정 바뀌면 먼저 알려줘요.':'자세한 사정은 저도 몰라요. 지금 안내된 내용대로 준비하고 있어요.',soyul:safe?'뭔가 신경 쓰이기는 해요. 그래도 무슨 일인지 모르는 상태에서 찍거나 올리고 싶지는 않아요. 확인된 얘기 있으면 그때 말해줘요.':'저는 아직 아는 게 없어요. 그냥 보고 지나간 걸로 단정하고 싶지는 않아요.',seoyeon:safe?'신경 쓰이죠. 그래도 지금은 확실한 것부터 보자고요. 가던 길 바꿀 거면 연락하고, 막힌 문은 다른 쪽으로 돌아가요.':'안내문에 적힌 것부터 확인해봐요. 저도 이유는 모르니까요.'}[id];
 const result={riskReport:true,person:id,day:s.day,phase:s.phase,choice:'warning:discuss',playerLine,text,stage:'태이는 자신이 확인하거나 전해 들은 범위에서만 이야기를 꺼낸다.'};
 s.dialogue.history.push(result);return {state:s,result};
}
