(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.PartyPlanner=f();})(globalThis,()=>{
'use strict';
const actions=['travel','enter','move','survey','recover','fight','flee','rest','request-help','wait','exit','return','core'];
function choose(frame){const options=frame.options||[],find=kind=>options.find(o=>o.action===kind);let selected;
 const urgent=frame.retreat===true||frame.observedDanger==='high'||frame.healthRatio!==null&&frame.healthRatio<.35||frame.remainingMinutes!==null&&frame.remainingMinutes<=frame.escapeMinutes+20||frame.dangerKnown&&frame.dangerKnown.remaining<=frame.escapeMinutes+20;
 if(urgent)selected=options.find(o=>o.retreat)||find('request-help')||find('wait');
 if(!selected&&frame.fatigue>=75)selected=find('rest')||options.find(o=>o.retreat)||find('request-help');
 if(!selected&&frame.advice&&!urgent&&frame.fatigue<75)selected=options.find(o=>o.action===frame.advice.action&&(o.zoneId||null)===(frame.advice.zoneId||null));
 if(!selected)selected=find('travel')||find('enter')||find('recover')||find('core')||find('survey')||options.find(o=>o.action==='move'&&!o.retreat)||options.find(o=>o.action==='fight'&&!o.retreat)||find('request-help')||options.find(o=>o.retreat)||find('return')||find('exit')||find('wait');
 return selected?{...selected,reason:urgent?'안전·기한을 고려한 철수':frame.fatigue>=75?'피로를 고려한 행동':frame.advice&&selected.action===frame.advice.action?'검증된 AI 제안':'현재 목표와 가능한 행동'}:{action:'wait',reason:'수행 가능한 행동 없음'};
}
function validateAdvice(frame,p){if(!p||!actions.includes(p.action)||!frame.options.some(o=>o.action===p.action&&(o.zoneId||null)===(p.zoneId||null)))throw Error('현재 파티가 실제로 수행할 수 없는 행동 제안입니다.');return p;}
return{actions,choose,validateAdvice};
});
