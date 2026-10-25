export function prepareWarnings(s){s.warnings??={evidence:[],resolved:{}};return s.warnings;}
export function noteWarning(s,{id,label,detail,source,kind='direct'}){
 const w=prepareWarnings(s),key=`${id}:${source}`;
 if(w.evidence.some(e=>e.key===key))return false;
 w.evidence.push({key,id,label,detail,source,kind,day:s.day,phase:s.phase});
 if(!s.known.includes(label))s.known.push(label);
 s.memory.push(`[${s.day}일차] ${label} · ${source}: ${detail}`);return true;
}
