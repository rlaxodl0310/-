'use strict';
// Read approved structured character data; never infer missing ages from prose or stature.
const Data=require('../ui/data.js'),Origins=require('../ui/characters/origins.js');
const canon=Object.freeze(Object.fromEntries(Data.catalog.map(r=>[r.id,Object.freeze({name:r.name,...(Number.isInteger(r.age)?{age:String(r.age)}:{}),...((r.origin||Origins.origin(r.id))?{origin:r.origin||Origins.origin(r.id)}:{})})])));
const nativeOnes=['','한','두','세','네','다섯','여섯','일곱','여덟','아홉'];
const nativeTens=['','열','스물','서른','마흔','쉰','예순','일흔','여든','아흔'];
const sinoOnes=['','일','이','삼','사','오','육','칠','팔','구'];
const ages=new Map();
for(let n=0;n<=199;n++){
 const k=n%100,t=Math.floor(k/10),o=k%10;
 const sino=(n>=100?'백':'')+(t?(t===1?'':sinoOnes[t])+'십':'')+sinoOnes[o];
 if(sino)ages.set(sino,n);
 if(n<100){ages.set(nativeTens[t]+nativeOnes[o],n);if(n===20)ages.set('스무',20);}
}
ages.delete('');
const clean=x=>String(x).normalize('NFKC').replace(/\s+/g,'');
function ageValue(x){const value=clean(x).replace(/(?:살|세)$/,'');return /^\d{1,3}$/.test(value)?Number(value):ages.get(value);}
function equivalent(predicate,a,b){return predicate==='age'?ageValue(a)!==undefined&&ageValue(a)===ageValue(b):clean(a).toLowerCase()===clean(b).toLowerCase();}
const escape=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const ageWords=[...ages.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|');
const agePattern='(\\d{1,3}|'+ageWords+')(?:\\s*)(살|세)';
const names=Object.entries(canon).flatMap(([id,r])=>[...new Set([r.name,...(/^[가-힣]{3}$/.test(r.name)?[r.name.slice(1)]:[])])].map(name=>({id,name})));
const subjectPattern=new RegExp(names.map(n=>escape(n.name)).sort((a,b)=>b.length-a.length).join('|')+'|나는|내\\s*나이는|난(?=\\s)|나(?=\\s*\\d|\\s*(?:열|스|서른|마흔))','g');
function reviewPanels(panels){const errors=[];
 for(const panel of panels||[]){
  // Scope questions/history to their clause, so another sentence cannot disable checks.
  for(const clause of String(panel.text||'').normalize('NFKC').match(/[^.!?？,，\n]+[.!?？,，]?/g)||[]){
   const subjects=[...clause.matchAll(subjectPattern)];
   for(let i=0;i<subjects.length;i++){
    const m=subjects[i],id=names.find(n=>n.name===m[0])?.id||panel.speaker,record=canon[id];if(!record?.age)continue;
    const part=clause.slice(m.index+m[0].length,subjects[i+1]?.index??clause.length);
    const a=part.match(new RegExp('^(?:은|는|이|가)?\\s*(?:(?:지금|현재|올해|나이는|나이가|만)\\s*)*'+agePattern));if(!a)continue;
    const suffix=part.slice(a.index+a[0].length),before=clause.slice(0,m.index);
    if(/[?？]\s*$/.test(clause)||/(?:예전|당시|어릴|작년|그때)/.test(before)||/^\s*(?:때|시절|이었|였|이던|가\s*되면|이\s*되면|이\s*아니|가\s*아니|아니|은\s*아니|는\s*아니)/.test(suffix))continue;
    if(ageValue(a[1])!==Number(record.age))errors.push('대사의 나이가 확정 설정과 다릅니다: '+record.name);
   }
  }
 }
 return [...new Set(errors)];
}
module.exports={canon,ageValue,equivalent,reviewPanels};
