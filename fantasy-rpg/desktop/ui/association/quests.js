(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.QuestEngine=factory();})(globalThis,()=>{
const RANKS=['F','E','D','C','B','A','S','SSS','EX'];
const TYPES={caravan:'상인단 호위',escort:'의뢰인 호위',hunt:'몬스터 토벌',dungeon:'던전 공략',ecology:'생태계 조사',mining:'마석 채굴',supply:'재료 조달',rescue:'구조'};
const SCENARIOS={
 road:{name:'교역로 · 운송 지연',facts:['숲길에서 고블린 무리의 출몰이 보고됐다.','상인단의 출발이 지연되고 약초 재고가 부족하다.'],sites:['숲길','역참','약초 군락'],types:['caravan','escort','hunt','ecology','supply'],rank:'E'},
 dungeon:{name:'신규 던전 · 공동 탐사',facts:['폐광에 던전이 발견됐다.','입구의 마석 광맥은 확인됐으나 깊은 구역은 미조사다.','핵 파괴 허가는 발행되지 않았다.'],sites:['폐광 던전 입구','폐광 던전 외곽'],types:['dungeon','ecology','mining','supply','escort'],rank:'D'},
 collapse:{name:'핵 파괴 · 철수 진행',facts:['협회의 핵 파괴 의뢰가 완료됐다.','핵은 세계 시각 0시에 파괴됐다. 48시에 던전이 붕괴한다.','던전 내부에 미귀환 파티가 있다.'],sites:['던전 철수로','입구 임시 거점'],types:['rescue','escort','supply'],rank:'C'},
 aftermath:{name:'붕괴 이후 · 새 생태계',facts:['핵 파괴 48시간 후 던전이 붕괴해 마나로 변했다.','그 자리에 새로운 생태계가 형성됐다.','새 생태계의 생물과 자원은 아직 조사되지 않았다.'],sites:['신생 생태계 경계','관측 야영지'],types:['ecology','escort','supply'],rank:'D'}
};
function clone(v){return JSON.parse(JSON.stringify(v));}
function initial(){return {version:1,hour:8,sequence:0,revision:0,quests:[]};}
function scenario(id,hour){if(!SCENARIOS[id])throw Error('없는 지역 상황입니다.');return SCENARIOS[id==='collapse'&&hour>=48?'aftermath':id];}
function candidates(id,hour){const s=scenario(id,hour);return s.types.map((type,i)=>({key:type,type,rank:s.rank,site:s.sites[i%s.sites.length],facts:s.facts,capacity:['hunt','dungeon','ecology','rescue'].includes(type)?4:1}));}
function drafts(id,hour,round=0){return candidates(id,hour).map((c,i)=>({key:c.key,title:c.site+' · '+TYPES[c.type]+' '+['모집','요청','추가 접수'][(round+i)%3],description:c.facts.join(' ')+' '+({caravan:'상인단과 화물을 지정 역참까지 호위해 주세요.',escort:'의뢰인이 목적지에 도착할 때까지 동행해 주세요.',hunt:'보고된 출몰 구역을 수색하고 위협을 제거해 주세요.',dungeon:'다른 파티와 구역을 나눠 외곽을 조사해 주세요. 핵 파괴는 허용되지 않습니다.',ecology:'생물의 흔적과 환경 변화를 기록해 제출해 주세요.',mining:'확인된 입구 광맥에서 마석을 채굴해 인계해 주세요.',supply:'거점에서 요청한 물자를 조달해 인계해 주세요.',rescue:'미귀환 파티를 수색하고 철수를 도와주세요.'}[c.type]),risk:'보고되지 않은 위험이 있을 수 있습니다. 현장 정보는 미확인입니다.'}));}
function refresh(state,id,rows,source){const next=clone(state);if(id==='collapse'&&next.hour>=48)id='aftermath';const cs=candidates(id,next.hour);if(!Array.isArray(rows)||rows.length<1||rows.length>8)throw Error('의뢰는 1~8개여야 합니다.');const used=new Set();
 for(const row of rows){const c=cs.find(c=>c.key===row.key);if(!c||used.has(row.key)||Object.keys(row).some(k=>!['key','title','description','risk'].includes(k)))throw Error('지역 상황과 맞지 않는 의뢰입니다.');used.add(row.key);for(const [k,max]of [['title',80],['description',700],['risk',240]])if(typeof row[k]!=='string'||!row[k].trim()||row[k].length>max)throw Error('의뢰 설명 형식이 잘못되었습니다.');
 const signature=id+':'+c.key;if(next.quests.some(q=>q.signature===signature&&['open','accepted'].includes(q.status)))continue;
 const rank=RANKS.indexOf(c.rank);next.quests.push({...clone(row),id:'quest-'+(++next.sequence),signature,scenario:id,type:c.type,rank:c.rank,site:c.site,client:['caravan','supply'].includes(c.type)?'지역 상인 조합':'협회 접수처',reward:20*(rank+1)*(c.type==='dungeon'?3:1),merit:5*(rank+1),capacity:c.capacity,joined:0,accepted:false,status:'open',source,postedAt:next.hour,deadline:Math.min(next.hour+24,id==='collapse'?48:Infinity),coreDestructionAuthorized:false,objective:TYPES[c.type]+' 수행 후 증빙 제출'});}
 next.revision++;next.quests=next.quests.slice(-120);return next;}
function advance(state,hours=6){if(!Number.isInteger(hours)||hours<1||hours>48)throw Error('시간 범위를 확인해 주세요.');const n=clone(state);n.hour+=hours;n.revision++;for(const q of n.quests){if(['open','accepted'].includes(q.status)&&q.deadline<=n.hour)q.status=q.accepted?'overdue':'expired';}return n;}
function accept(state,id,rank='D'){const n=clone(state),q=n.quests.find(q=>q.id===id);if(!q||q.status!=='open'||q.deadline<=n.hour)throw Error('접수가 마감된 의뢰입니다.');if(q.accepted)throw Error('이미 수락한 의뢰입니다.');if(!RANKS.includes(rank)||RANKS.indexOf(rank)<RANKS.indexOf(q.rank))throw Error('신청 랭크가 부족합니다.');if(q.joined>=q.capacity)throw Error('모집 인원이 찼습니다.');q.accepted=true;q.joined++;q.status='accepted';n.revision++;return n;}
return {RANKS,TYPES,SCENARIOS,initial,scenario,candidates,drafts,refresh,advance,accept};
});
