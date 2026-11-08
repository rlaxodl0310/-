import {combatMissionWon} from './combat-missions.js';
export const combatLootItems={water:{name:'생수',use:'전투 중 스태미나·목마름 회복'},bandage:{name:'붕대',use:'전투 중 찰과상 1회 치료'},parts:{name:'정비 부품',use:'보관용 · 제작 기능은 추후 연결'}};
export function createCombatExtras(previous,mission){
 const stash=structuredClone(previous?.stash??{runs:0,items:{water:0,bandage:0,parts:0},claimed:[]});stash.runs=(stash.runs??0)+1;stash.items??={};for(const id of Object.keys(combatLootItems))stash.items[id]??=0;stash.claimed??=[];
 return {runId:stash.runs,stash,optional:{teamHurt:false},supplyCache:{id:'supply',x:3,y:1,recovered:false},rewardResult:null};
}
export function combatSideMissions(b){
 if(!b?.optional)return [];
 const mission=b.mission??'escape',special=mission==='protect'?{id:'ward',label:'보호 대상 추가 부상 없이 지키기',condition:(b.protection?.wounds??0)===0,progress:`추가 부상 ${b.protection?.wounds??0}회 · 0회 목표`,reward:[{id:'bandage',quantity:1}]}:mission==='eliminate'?{id:'quick',label:'6턴 이내 복도 확보',condition:b.turn<=6,progress:`현재 ${b.turn}/6턴`,reward:[{id:'parts',quantity:3}]}:{id:'quiet',label:'증원을 부르지 않고 탈출',condition:b.noise<6&&!b.reinforced,progress:`소음 ${b.noise}/6 미만`,reward:[{id:'parts',quantity:2}]};
 const specs=[{id:'cache',label:'연습실 구석 물자 회수',condition:!!b.supplyCache?.recovered,progress:b.supplyCache?.recovered?'회수 완료 · 클리어하면 확보':'상자에 인접해 회수 · 행동력 1',reward:[{id:'bandage',quantity:2},{id:'water',quantity:1}]},special,{id:'unhurt',label:'아군 둘 다 새 부상 없이 완료',condition:!b.optional.teamHurt&&Object.values(b.actors).every(a=>a.wounds===0),progress:b.optional.teamHurt||Object.values(b.actors).some(a=>a.wounds>0)?'부상 발생 · 이번 임무 달성 불가':'무부상 유지 중',reward:[{id:'water',quantity:1}]}];
 return specs.map(q=>({...q,status:combatMissionWon(b)?q.condition?'complete':'missed':b.status==='failed'?'lost':q.id==='cache'?'pending':q.condition?'pending':'missed'}));
}
export function settleCombatRewards(b){
 if(!b?.optional||!b.stash||b.status==='active'||b.rewardResult?.settled)return;
 const success=combatMissionWon(b),objectives=combatSideMissions(b).map(q=>({id:q.id,label:q.label,status:q.status,reward:q.reward}));
 if(!success){b.rewardResult={settled:true,success:false,objectives,items:[]};return;}
 const key=`mission:${b.runId}`;if(b.stash.claimed.includes(key))return;
 const items=[{id:'parts',quantity:1}];for(const q of objectives)if(q.status==='complete')items.push(...q.reward);
 const totals={};for(const item of items)totals[item.id]=(totals[item.id]??0)+item.quantity;
 const granted=Object.entries(totals).map(([id,quantity])=>({id,quantity}));for(const item of granted)b.stash.items[item.id]=(b.stash.items[item.id]??0)+item.quantity;b.stash.claimed.push(key);
 b.rewardResult={settled:true,success:true,objectives,items:granted};
}
export function combatLootLabel(items){return items.map(item=>`${combatLootItems[item.id]?.name??item.id} ×${item.quantity}`).join(' · ');}
export function combatWaterCount(b){return (b?.items?.water??0)+(b?.stash?.items?.water??0);}
