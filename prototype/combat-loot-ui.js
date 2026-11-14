import {combatSideMissions,combatLootLabel,combatLootItems} from './combat-side-missions.js';
const lootEsc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function combatExtrasPanel(b){
 const quests=combatSideMissions(b);if(!quests.length)return '';
 const completed=quests.filter(q=>q.status==='complete').length;
 return `<details class="tactical-sidequests"><summary>서브미션 · 선택 목표 ${b.status==='active'?'':completed+'/'+quests.length}<small>놓쳐도 주 임무 성공 가능 · 달성하면 추가 전리품</small></summary>${quests.map(q=>`<article data-sidequest="${q.id}" data-side-status="${q.status}"><strong>${q.status==='complete'?'✓ ':q.status==='missed'?'— ':''}${q.label}</strong><p>${b.status==='failed'?'임무 실패 · 보상 없음':q.progress}</p><span>${q.reward.length?'보너스 · '+combatLootLabel(q.reward):'구조 성공 시 거점 인원에 합류'}</span>${b.status==='active'&&q.id==='cache'&&!b.supplyCache?.recovered?'<button data-action="combatLocateLoot">상자 위치 보기</button>':''}</article>`).join('')}</details>`;
}
export function combatStashPanel(b){
 if(!b?.stash||b.survivalPack)return '';
 return `<details class="combat-stash"><summary>전리품 보관함 · 다음 임무에서도 사용</summary>${Object.entries(combatLootItems).map(([id,item])=>`<p><b>${item.name} ×${b.stash.items[id]??0}</b><small>${id==='parts'&&b.survivalSortie?'거점 복귀 후 시설 공사에 사용':item.use}</small></p>`).join('')}</details>`;
}
export function combatRewardPanel(b){
 if(!b?.optional)return '';
 const r=b.rewardResult;if(!r?.settled)return '';
 return `<section class="combat-rewards" data-reward-status="${r.success?'secured':'lost'}"><h3>${r.success?b.survivalPack?'확보 물자 골라 담기':'전리품 확보':b.survivalPack?'임무 보너스 없음':'물자를 확보하지 못했다'}</h3><p>${r.success?'기본 보상 · 정비 부품 ×1':b.survivalPack?'임무 보너스는 없지만 이미 가방에 챙긴 물자는 가져갈 수 있어요.':'주 임무를 실패해 회수한 물자와 서브미션 보상은 지급되지 않았어요.'}</p>${r.success?`<p class="combat-reward-total">${b.survivalPack?'확보 물자 · 골라 담기':'이번 임무 획득'} · ${lootEsc(combatLootLabel(r.items))}</p><p>${b.survivalPack?'가방 패널에서 챙길 물건을 선택하세요. 남겨 둔 물자는 복귀하면 포기해요.':'보관함에 반영했어요.'} ${b.survivalSortie?b.survivalPack?'복귀 후 가방에서 공동 보관함으로 옮길 수 있어요.':'복귀하면 휴대 물자와 전리품을 거점 창고에 반영해요.':'생수와 붕대는 다음 임무에서 사용할 수 있어요.'}</p>`:''}${combatExtrasPanel(b)}${combatStashPanel(b)}</section>`;
}
export function combatCacheMarker(b,busy){const c=b.supplyCache;if(!c)return '';return `<button class="tactical-supply ${c.recovered?'supply-taken':''}" data-action="combatLoot" data-cache="${c.id}" style="left:${(c.x+.5)*100/12}%;top:${(c.y+.8)*100/8}%" aria-label="${c.recovered?'물자 회수 완료':'서브미션 물자 상자 · 인접해 회수 · 행동력 1'}" title="물자 상자에 인접해 회수하면 클리어 시 붕대 2개와 생수 1병 확보" ${busy||c.recovered||b.status!=='active'?'disabled':''}><svg viewBox="0 0 32 28" aria-hidden="true" shape-rendering="crispEdges"><path fill="#302b24" d="M2 7h28v19H2z"/><path fill="#bc9256" d="M4 9h24v14H4z"/><path fill="#725337" d="M4 2h24v9H4z"/><path fill="#e4c88a" d="M6 4h20v4H6zM8 11h3v12H8zM22 11h3v12h-3z"/><path fill="#e8dfb2" d="M14 10h5v7h-5z"/></svg><span>${c.recovered?'✓ 회수':'! 물자'}</span></button>`;}
