(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('../map/geography.js'),require('../monsters/essence-rules.js'));else r.HuntField=f(r.GameGeography,r.EssenceRules);})(globalThis,(Geo,Essences)=>{
'use strict';
function view(s,id){const q=s.adventure?.quests.find(q=>q.id===id&&q.type==='hunt');if(!q)return null;const place=Geo.records.find(p=>p.id===s.location),destination=Geo.records.find(p=>p.id===q.destination),issuer=Geo.records.find(p=>p.id===q.issuerLocation),m=Essences?.records.find(m=>m.id===q.species),at=s.location===q.destination;
const loot=(s.adventure.ground||[]).filter(l=>l.location===s.location&&!l.claimed&&q.proofs.includes(l.id)),battle=s.combat?.adventureQuestId===q.id?s.combat:null,done=q.progress>=q.target,finished=q.status==='completed',failed=['failed','expired'].includes(q.status),playing=s.combat?.status==='playing';
const stage=finished?'settled':failed?'closed':q.status==='open'?'contract':playing&&battle?'combat':loot.length?'loot':done?'return':at?'field':'travel';
const label={contract:'의뢰 수락',travel:'현장으로 이동',field:q.fieldNote?'대치 준비':'현장 확인',combat:'대화 전투',loot:'전리품 확보',return:'귀환·증빙 제출',settled:'정산 완료',closed:'계약 종료'}[stage];
const text=(place?.note||'')+(place?.name||'');const biome=/동굴|지하|광산/.test(text)?2:/유적|폐허/.test(text)?1:['city','village'].includes(place?.kind)?3:0;
return{q,place,destination,issuer,monster:m,at,stage,label,biome,battle,loot,done,finished,failed,playing,remaining:Math.max(0,q.deadline-s.minutes),steps:[['수락',q.status!=='open'],['현장',!!q.fieldNote||q.progress>0||!!battle],['토벌',done],['회수',q.proofs.length>0&&q.proofs.every(id=>s.adventure.ground.find(l=>l.id===id)?.claimed)],['정산',finished]]};}
return{view};});
