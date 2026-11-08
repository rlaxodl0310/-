// Integer grams and stack counts keep capacity checks deterministic across saves.
export const survivalBags={
 campus:{name:'통학 백팩',slots:8,maxWeight:8000,description:'수업에 메고 다니던 가방. 가벼운 원정에 쓸 수 있다.'},
 messenger:{name:'메신저백',slots:6,maxWeight:5000,description:'작고 가벼운 가방. 짐이 적을 때 교체할 수 있다.'},
 hiking:{name:'등산 배낭',slots:14,maxWeight:15000,description:'수납 구획이 많고 무거운 물자를 나르기 좋다.'},
 duffel:{name:'대형 더플백',slots:18,maxWeight:20000,description:'부피 큰 장비까지 담을 수 있는 대용량 가방.'}
};
export const survivalPackItems={
 food:{name:'휴대 식량',icon:'▣',category:'식량',weight:300,stack:3,slots:1,use:'태이 피로 −8 · 부담 −2 / 전투 스태미나 +16·배고픔 −30 / 야간 배급 가능'},
 water:{name:'생수 500ml',icon:'◈',category:'식량',weight:550,stack:2,slots:1,use:'태이 피로 −6 / 전투 스태미나 +18 / 야간 배급 가능'},
 canned:{name:'밀봉 통조림',icon:'▤',category:'식량',weight:450,stack:2,slots:1,use:'태이 피로 −12 · 부담 −2 / 전투 스태미나 +16·배고픔 −40 / 야간 식량 1인분'},
 energybar:{name:'에너지바',icon:'▰',category:'식량',weight:60,stack:4,slots:1,use:'태이 피로 −8 / 전투 스태미나 +12 · 배고픔 −20'},
 bandage:{name:'붕대',icon:'✚',category:'의약품',weight:80,stack:4,slots:1,use:'부상 1 치료 · 여력 1 / 전투 행동력 1'},
 firstaid:{name:'구급 파우치',icon:'✚',category:'의약품',weight:450,stack:1,slots:2,use:'부상 1 · 부담 −10 · 여력 1 / 전투 행동력 1'},
 parts:{name:'정비 부품',icon:'⚙',category:'재료',weight:400,stack:3,slots:1,use:'공동 보관함에 옮겨 시설 공사·정비에 사용'},
 tape:{name:'보강 테이프',icon:'▧',category:'도구',weight:200,stack:2,slots:1,use:'거점 문 상태 +6 · 여력 1'},
 repairkit:{name:'휴대 수리 키트',icon:'⚒',category:'도구',weight:700,stack:1,slots:2,use:'거점 문 상태 +18 · 여력 1'},
 bottle:{name:'유인용 빈 병',icon:'◇',category:'도구',weight:180,stack:2,slots:1,use:'전투에서 기본 빈 병을 쓴 뒤 추가 유인에 사용'}
};
const packResourceIds=['food','water','bandage','parts'];
const packClamp=n=>Math.max(0,Math.min(100,n));
export function packWeightLabel(grams){return (grams/1000).toFixed(2).replace(/0$/,'').replace(/\.0$/,'')+'kg';}
export function survivalBagStats(bag,items){
 const def=survivalBags[bag]??survivalBags.campus;let slots=0,weight=0;
 for(const [id,q] of Object.entries(items??{})){const item=survivalPackItems[id];if(item&&q>0){slots+=Math.ceil(q/item.stack)*item.slots;weight+=q*item.weight;}}
 return {...def,usedSlots:slots,weight,over:slots>def.slots||weight>def.maxWeight};
}
export function survivalPackFit(bag,items,id,quantity=1){
 if(!survivalPackItems[id]||!Number.isSafeInteger(quantity)||quantity<1)return '아이템과 수량을 확인하세요.';
 const stats=survivalBagStats(bag,{...items,[id]:(items[id]??0)+quantity});
 return stats.usedSlots>stats.slots?'가방의 수납 칸이 부족해요.':stats.weight>stats.maxWeight?'가방의 최대 무게를 넘어요.':null;
}
function packInitialSeed(seed){let n=(seed^0x65a2f819)>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return (n^(n>>>16))>>>0;}
export function createSurvivalPack(seed){return {version:1,bag:'campus',items:{},stock:{},seed:packInitialSeed(seed),sequence:0,pending:null,history:[]};}
export function ensureSurvivalPack(run){return run.kit??=createSurvivalPack(run.exploration?.seed??run.story?.seed??726139);}
function packReady(state){const r=state.survivalRun;if(!r||r.status!=='active')throw new Error('진행 중인 생존 기록이 필요해요.');if(r.activeSortie)throw new Error('원정 가방은 전투 화면에서 정리하거나 복귀 후 이용하세요.');return r;}
export function initializeSurvivalPack(state){packReady(state);const s=structuredClone(state);ensureSurvivalPack(s.survivalRun);return s;}
function packRoll(kit){kit.seed=(Math.imul(kit.seed,1664525)+1013904223)>>>0;return kit.seed/4294967296;}
export function createPackLoot(kit,source='주변 물자',kind='search'){
 const roll=()=>packRoll(kit),items=kind==='search'?{food:2+Math.floor(roll()*2),water:1+Math.floor(roll()*2)}:{water:1+Math.floor(roll()*2),bandage:1};
 const extras=kind==='search'?['canned','energybar','parts','tape','bottle','bandage']:['firstaid','repairkit','energybar','parts','canned'];
 for(let i=0;i<2;i++){const id=extras[Math.floor(roll()*extras.length)];items[id]=(items[id]??0)+(id==='energybar'?2:1);}
 const bagRoll=roll(),bags=bagRoll<.08?['duffel']:bagRoll<.30?['hiking']:bagRoll<.40?['messenger']:[];
 return {id:++kit.sequence,source,items,bags};
}
export function survivalPackView(state){
 const r=state.survivalRun;if(!r)return null;const kit=r.kit??createSurvivalPack(0),stats=survivalBagStats(kit.bag,kit.items);
 return {...kit,items:{...kit.items},stock:{...kit.stock},pending:kit.pending?structuredClone(kit.pending):null,stats,initialized:!!r.kit,busy:!!r.activeSortie,common:{...r.resources},rationFood:(r.resources.food??0)+(kit.items.food??0)+(kit.items.canned??0)+(kit.stock.canned??0),rationWater:(r.resources.water??0)+(kit.items.water??0)};
}
function packHistory(run,text){run.log=[text];run.history.push({day:run.day,text});}
function packQty(q){if(!Number.isSafeInteger(q)||q<1)throw new Error('한 번에 옮길 수량을 확인하세요.');}
export function transferSurvivalPack(state,direction,id,quantity=1){
 const r0=packReady(state);packQty(quantity);if(!survivalPackItems[id])throw new Error('없는 아이템입니다.');
 const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);if(kit.pending)throw new Error('발견한 물자를 정리하고 수색을 마친 뒤 보관함을 이용하세요.');
 const stock=packResourceIds.includes(id)?r.resources:kit.stock;
 if(direction==='take'){if((stock[id]??0)<quantity)throw new Error('보관 중인 수량이 부족해요.');const blocked=survivalPackFit(kit.bag,kit.items,id,quantity);if(blocked)throw new Error(blocked);stock[id]-=quantity;kit.items[id]=(kit.items[id]??0)+quantity;}
 else if(direction==='store'){if((kit.items[id]??0)<quantity)throw new Error('가방에 그만큼 들어 있지 않아요.');kit.items[id]-=quantity;stock[id]=(stock[id]??0)+quantity;}
 else throw new Error('옮기는 방향을 확인하세요.');
 packHistory(r,`${survivalPackItems[id].name} ${quantity}개를 ${direction==='take'?'가방에 담았다':'공동 보관함으로 옮겼다'}.`);return s;
}
function packTakeLoot(container,id,quantity){
 packQty(quantity);if((container.pending?.items?.[id]??0)<quantity)throw new Error('발견한 물자 수량을 확인하세요.');const blocked=survivalPackFit(container.bag,container.items,id,quantity);if(blocked)throw new Error(blocked);
 container.pending.items[id]-=quantity;container.items[id]=(container.items[id]??0)+quantity;
}
function packSwapBag(container,id){
 const pool=container.pending;if(!pool?.bags.includes(id)||!survivalBags[id])throw new Error('발견한 가방이 아니에요.');
 if(survivalBagStats(id,container.items).over)throw new Error('새 가방에 현재 짐이 들어가지 않아요. 먼저 사용하거나 버려서 줄이세요.');
 pool.bags.splice(pool.bags.indexOf(id),1);pool.bags.push(container.bag);container.bag=id;
}
export function takeSurvivalLoot(state,id,quantity=1){
 packReady(state);const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);packTakeLoot(kit,id,quantity);packHistory(r,`${survivalPackItems[id].name} ${quantity}개를 가방에 챙겼다.`);return s;
}
export function equipSurvivalLootBag(state,id){packReady(state);const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);packSwapBag(kit,id);packHistory(r,`${survivalBags[id].name}으로 짐을 옮겼다. 이전 가방은 발견 장소에 남겨 두었다.`);return s;}
export function leaveSurvivalLoot(state){packReady(state);const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);if(!kit.pending)throw new Error('정리할 발견 물자가 없어요.');kit.history.push({day:r.day,source:kit.pending.source,left:structuredClone(kit.pending)});kit.pending=null;packHistory(r,'수색을 마치고 돌아왔다. 챙기지 않은 물자와 가방은 그 자리에 남겼다.');return s;}
export function dropSurvivalPackItem(state,id){packReady(state);const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);if(!(kit.items[id]>0))throw new Error('가방에 없는 물건입니다.');kit.items[id]--;packHistory(r,`${survivalPackItems[id].name} 1개를 버렸다. 되찾을 수 없다.`);return s;}
export function useSurvivalPackItem(state,id){
 packReady(state);const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);if(!(kit.items[id]>0))throw new Error('가방에 없는 물건입니다.');let effect;
 if(['food','canned','energybar','water'].includes(id)){const m=r.members.find(m=>m.key==='taei');m.fatigue=packClamp(m.fatigue-(id==='water'?6:id==='canned'?12:8));if(id!=='water')m.stress=packClamp(m.stress-2);effect='태이가 먹거나 마시며 피로를 회복했다.';}
 else if(['bandage','firstaid'].includes(id)){const m=r.members.find(m=>m.injury>0);if(!m)throw new Error('치료할 부상자가 없어요.');if(r.actions<1)throw new Error('치료에는 여력 1이 필요해요.');r.actions--;m.injury--;if(id==='firstaid')m.stress=packClamp(m.stress-10);effect='부상자 한 명을 치료했다.';}
 else if(['repairkit','tape'].includes(id)){if(!r.base||r.base.integrity>=100)throw new Error('보수할 거점 출입문이 필요해요.');if(r.actions<1)throw new Error('보수에는 여력 1이 필요해요.');r.actions--;r.base.integrity=Math.min(100,r.base.integrity+(id==='repairkit'?18:6));effect='출입문을 보수했다.';}
 else throw new Error('이 물건은 보관함에 옮겨 쓰거나 전투 중 사용하세요.');
 kit.items[id]--;packHistory(r,`${survivalPackItems[id].name} 사용 · ${effect}`);return s;
}
export function assertPackExplorationReady(run){if(run.kit?.pending)throw new Error('가방 탭에서 발견 물자를 정리하고 수색을 마쳐 주세요.');}
export function consumePackedRations(run,needed){
 const kit=run.kit,used=[];
 if(kit){for(const id of ['food','water']){let missing=Math.max(0,needed-run.resources[id]);const count=Math.min(missing,kit.items[id]??0);if(count){kit.items[id]-=count;run.resources[id]+=count;missing-=count;used.push(`${survivalPackItems[id].name} ${count}`);}
  if(id==='food')for(const source of [kit.items,kit.stock]){const cans=Math.min(missing,source.canned??0);if(cans){source.canned-=cans;run.resources.food+=cans;missing-=cans;used.push('통조림 '+cans);}}}}
 return used;
}
// A sortie has exclusive ownership of its carried items until return.
export function mountCombatPack(run,battle){const kit=run.kit;if(!kit)return;assertPackExplorationReady(run);if(survivalBagStats(kit.bag,kit.items).over)throw new Error('가방의 칸이나 무게를 초과했어요. 출발 전에 정리하세요.');battle.stash.items={...kit.items};battle.survivalPack={bag:kit.bag,seed:kit.seed,sequence:kit.sequence,pending:null};kit.items={};}
export function restoreCombatPack(run,battle){if(!battle.survivalPack||!run.kit)return false;run.kit.items={...battle.stash.items};run.kit.bag=battle.survivalPack.bag;run.kit.seed=battle.survivalPack.seed;run.kit.sequence=battle.survivalPack.sequence;return true;}
export function openCombatPackLoot(battle){if(!battle.survivalPack)return;const p=battle.survivalPack;if(p.pending)throw new Error('먼저 발견 물자를 정리하세요.');p.pending=createPackLoot(p,'연습실 구석 물자 상자','combat');}
export function queueCombatPackRewards(battle,items){
 if(!battle.survivalPack)return false;const p=battle.survivalPack;p.pending??={id:++p.sequence,source:'임무 확보 물자',items:{},bags:[]};
 for(const item of items)p.pending.items[item.id]=(p.pending.items[item.id]??0)+item.quantity;return true;
}
function combatPackReady(state){const b=state.combatTrial;if(!b?.survivalPack)throw new Error('이번 전투에는 원정 가방이 없어요.');return b;}
export function combatPackAction(state,action,id){
 const s=structuredClone(state),b=combatPackReady(s),meta=b.survivalPack,container={...meta,items:b.stash.items};
 const reach=b.status!=='active'||!b.supplyCache?.recovered||Object.values(b.actors).some(a=>!a.down&&!a.escaped&&Math.abs(a.x-b.supplyCache.x)+Math.abs(a.y-b.supplyCache.y)<=1);
 if(['take','bag'].includes(action)&&!reach)throw new Error('회수한 물자 상자 옆으로 돌아가야 더 챙길 수 있어요.');
 if(action==='take')packTakeLoot(container,id,1);
 else if(action==='bag'){packSwapBag(container,id);meta.bag=container.bag;}
 else if(action==='drop'){if(!(b.stash.items[id]>0))throw new Error('가방에 없는 물건입니다.');b.stash.items[id]--;}
 else if(action==='leave'){if(!meta.pending)throw new Error('발견 물자가 없어요.');meta.pending=null;}
 else throw new Error('가방 정리 행동을 확인하세요.');
 return s;
}
export function storeAllSurvivalPack(state){
 packReady(state);const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);if(kit.pending)throw new Error('발견 물자를 정리하고 먼저 수색을 마치세요.');
 for(const [id,q] of Object.entries(kit.items))if(q>0){const stock=packResourceIds.includes(id)?r.resources:kit.stock;stock[id]=(stock[id]??0)+q;kit.items[id]=0;}
 packHistory(r,'가방의 물건을 모두 공동 보관함으로 옮겼다. 다시 출발할 물품을 챙길 수 있다.');return s;
}
export function prepareSurvivalPack(state){
 packReady(state);const s=structuredClone(state),r=s.survivalRun,kit=ensureSurvivalPack(r);if(kit.pending)throw new Error('먼저 수색을 마쳐 주세요.');
 const added=[];for(const [id,target] of Object.entries({water:2,bandage:1,energybar:1})){const stock=packResourceIds.includes(id)?r.resources:kit.stock;let n=0;while((kit.items[id]??0)<target&&(stock[id]??0)>0&&!survivalPackFit(kit.bag,kit.items,id)){stock[id]--;kit.items[id]=(kit.items[id]??0)+1;n++;}if(n)added.push(survivalPackItems[id].name+' '+n);}
 packHistory(r,added.length?'기본 보급품을 준비했다: '+added.join(' · '):'추가로 챙길 수 있는 기본 보급품이 없다. 보관 수량과 가방 공간을 확인하자.');return s;
}
