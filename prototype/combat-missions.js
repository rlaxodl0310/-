// Mission rules are saved with the battle; viewing them never advances a turn.
export const combatMissions={
 escape:{label:'동반 탈출',title:'방화문 너머로',description:'길을 열고 두 사람 모두 계단으로 빠져나간다. 적을 전부 쓰러뜨릴 필요는 없다.',goal:'방화문을 열고 둘 다 출구로 이동',failure:'태이가 쓰러지거나 12번째 적 턴까지 탈출하지 못하면 실패',success:'두 사람 모두 탈출 성공'},
 eliminate:{label:'적 제압',title:'복도 확보',description:'복도를 막은 적을 모두 제압한다. 소음으로 추가 적이 오면 그 적도 처리해야 한다.',goal:'복도의 모든 적 제압',failure:'태이가 쓰러지거나 12번째 적 턴까지 적이 남으면 실패',success:'복도 확보 성공'},
 protect:{label:'대상 보호',title:'여기서 버텨야 해',description:'이동할 수 없는 부상 학생을 지키며 구조 준비가 끝날 때까지 적 턴 4번을 버틴다. 좀비는 보호 대상을 우선 노린다.',goal:'부상 학생을 지키며 적 턴 4번 버티기',failure:'태이가 쓰러지거나 보호 대상이 3번 다치면 실패',success:'보호 임무 성공'}
};
export function combatMissionInfo(b){if(b?.clinic)return {label:'보건실 보급',title:'보건실에 남은 사람',description:'물자함을 확인하고 두 사람 모두 탈출한다. 학생 구조는 선택이다.',goal:'보건실 물자함 확인 → 두 사람 모두 탈출',failure:'태이가 쓰러지거나 12번째 적 턴까지 탈출하지 못하면 실패',success:'보건실 원정 완료'};return combatMissions[b?.mission]??combatMissions.escape;}
export function combatMissionWon(b){return b?.status==='escaped'||b?.status==='victory';}
export function combatMissionProgress(b){
 if(b?.clinic)return `물자함 ${b.supplyCache.recovered?'확인':'미확인'} · 학생 ${b.clinic.rescued?'동행 중':b.clinic.canRescue?'구조 선택 가능':'거점 자리 부족'} · 탈출 ${Object.values(b.actors).filter(a=>a.escaped).length}/2명`;
 if(b?.mission==='eliminate'){const pending=b.noise>=6&&!b.reinforced?1:0;return `제압 ${b.enemies.filter(e=>e.balance<=0).length}/${b.enemies.length+pending}${pending?' · 소음으로 추가 적 접근 중':''}`;}
 if(b?.mission==='protect'){const p=b.protection;return `보호 ${p?.held??0}/4턴 · 대상 부상 ${p?.wounds??0}/3`;}
 return `방화문 ${b?.door??0}/2 · 탈출 ${Object.values(b?.actors??{}).filter(a=>a.escaped).length}/2명`;
}
