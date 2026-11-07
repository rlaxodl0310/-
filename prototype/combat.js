import {contact,displayName} from './identity.js';
export const combatCast=['student','yeogyeong','seoyeon','soyul','iseo','dogyeom'];
export const combatZones=['연습실 문 앞','좁은 복도','방화문 앞','계단 · 안전 구역'];
export const combatActions={
 advance:{label:'앞으로 이동',cost:6,detail:'한 구역 전진 · 방화문 앞에서는 문을 열고, 열린 뒤에는 탈출'},
 shove:{label:'밀쳐서 틈 만들기',cost:10,detail:'가까운 적을 밀어 2턴 견제 · 소음 1'},
 strike:{label:'도구로 강하게 공격',cost:18,detail:'연습실 의자로 가까운 적 제압 시도 · 소음 2 · 실패 가능'},
 brace:{label:'방어하며 숨 고르기',cost:0,detail:'스태미나 12 회복 · 공포 6 감소 · 가까운 동료도 보호'},
 retreat:{label:'한 구역 물러나기',cost:4,detail:'이전 구역으로 이동 · 막힌 길에서는 이동 불가'},
 chair:{label:'예비 의자로 길 막기',cost:5,detail:'공용 의자 1개 소모 · 적의 이동과 접근 공격을 2턴 지연'},
 drink:{label:'생수 마시기',cost:0,detail:'공용 생수 1병 소모 · 스태미나 18 회복 · 목마름 25 감소'},
 rescue:{label:'동료 부축하기',cost:10,detail:'인접한 쓰러진 동료를 데리고 이동 · 이후 이동 부담 증가'}
};
const combatBound=n=>Math.max(0,Math.min(100,Math.round(n)));
export function combatName(s,id){return id==='taei'?'김태이':id==='student'?'함께 있던 학생':displayName(s,id);}
export function startCombat(state,ally='student'){
 if(!combatCast.includes(ally))throw new Error('함께할 인물을 다시 선택해 주세요.');
 const s=structuredClone(state),member=id=>({id,zone:0,stamina:id==='taei'?90:78,hunger:20,thirst:20,fear:id==='taei'?15:35,wounds:0,down:false,escaped:false,guard:false});
 s.combatTrial={version:1,status:'active',phase:'planning',turn:1,seed:726139,ally,actors:{taei:member('taei'),ally:member(ally)},enemies:[{id:1,zone:1,balance:2,stun:0},{id:2,zone:2,balance:2,stun:0}],door:0,noise:0,reinforced:false,barrier:0,items:{chair:1,water:1},carrying:false,plans:{taei:'brace',ally:'brace'},log:['연습실 밖에서 비틀거리는 두 사람이 다가온다. 방화문을 열고 둘 다 계단으로 나가야 한다.'],history:[]};return s;
}
export function combatOptions(state,key){
 const b=state.combatTrial,a=b?.actors[key];if(!b||!a)return [];
 return Object.entries(combatActions).map(([id,d])=>{let reason='';if(a.escaped)reason='이미 탈출했어요.';else if(a.down)reason='쓰러져 행동할 수 없어요.';else if(a.stamina<d.cost)reason='스태미나가 부족해요.';else if(id==='chair'&&!b.items.chair)reason='남은 의자가 없어요.';else if(id==='drink'&&!b.items.water)reason='생수가 없어요.';else if(['strike','shove'].includes(id)&&!combatTarget(b,a))reason='닿는 거리의 적이 없어요.';else if(id==='retreat'&&a.zone===0)reason='더 물러날 공간이 없어요.';else if(id==='rescue'&&(key!=='taei'||!b.actors.ally.down||Math.abs(a.zone-b.actors.ally.zone)>1||b.carrying))reason='지금 부축할 수 있는 동료가 없어요.';return {id,...d,disabled:!!reason,reason,label:id==='advance'?(a.zone===2?(b.door>=2?'방화문 넘어 탈출':'방화문 열기 · '+b.door+'/2'):'다음 구역으로 이동'):d.label};});
}
export function planCombat(state,key,action){const b=state.combatTrial;if(b?.status!=='active'||b.phase!=='planning')throw new Error('다음 턴의 행동을 고를 때입니다.');const option=combatOptions(state,key).find(o=>o.id===action);if(!option||option.disabled)throw new Error(option?.reason??'할 수 없는 행동입니다.');const s=structuredClone(state);s.combatTrial.plans[key]=action;return s;}
function combatRoll(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296;}
function combatTarget(b,a){return b.enemies.filter(e=>e.balance>0&&Math.abs(e.zone-a.zone)<=1).sort((x,y)=>(x.stun>0)-(y.stun>0)||x.zone-y.zone||x.id-y.id)[0];}
function combatAct(s,key){
 const b=s.combatTrial,a=b.actors[key];if(a.down||a.escaped||key==='ally'&&b.carrying)return;
 let action=b.plans[key],name=combatName(s,a.id);
 if(key==='ally'&&a.fear>=70&&['strike','shove'].includes(action)){
  b.log.push(`${name}: “지금 가까이 가는 건 못 하겠어요. 여기서 막을게요.”`);action='brace';
 }else if(key==='ally'&&a.id==='soyul'&&b.noise>=6&&action==='strike'){
  b.log.push(`${name}: “소리가 너무 커요. 잠깐만 막고 나가요.”`);action='brace';
 }
 if(!combatOptions(s,key).find(o=>o.id===action&&!o.disabled)){b.log.push(`${name}: 준비했던 행동을 할 여력이 없어 방어한다.`);action='brace';}
 a.stamina=combatBound(a.stamina-combatActions[action].cost);
 if(action==='brace'){a.stamina=combatBound(a.stamina+12);a.fear=combatBound(a.fear-6);a.guard=true;b.log.push(`${name}: 숨을 고르며 가까운 동료까지 살핀다.`);}
 if(action==='drink'){b.items.water--;a.stamina=combatBound(a.stamina+18);a.thirst=combatBound(a.thirst-25);b.log.push(`${name}: 생수를 마시고 호흡을 추스른다.`);}
 if(action==='chair'){b.items.chair--;b.barrier=2;b.noise++;b.log.push(`${name}: 예비 의자를 넘어뜨려 접근을 막는다.`);}
 if(action==='rescue'){b.carrying=true;b.actors.ally.zone=a.zone;b.log.push(`${name}: 쓰러진 동료를 부축한다. 이동할 때 스태미나가 8 더 든다.`);}
 if(['strike','shove'].includes(action)){
  const e=combatTarget(b,a);if(!e){b.log.push(`${name}: 닿는 거리의 적이 없어 자세를 유지한다.`);return;}
  b.noise+=action==='strike'?2:1;
  if(action==='shove'){e.stun=2;e.zone=Math.min(2,e.zone+1);const collision=b.enemies.filter(other=>other.id!==e.id&&other.balance>0&&other.zone===e.zone);for(const other of collision)other.stun=2;b.log.push(`${name}: 적을 밀쳐 잠깐 이동할 틈을 만든다.${collision.length?' 좁은 복도에서 뒤의 적과 엉켜 함께 멈춘다.':''}`);}
  else{const chance=Math.max(.35,.9-a.fear/250-a.wounds*.06);if(combatRoll(b)<chance){e.balance--;e.stun=1;b.log.push(`${name}: 의자로 적의 접근을 끊는다.${e.balance<=0?' 적이 바닥에 쓰러져 움직이지 않는다.':''}`);}else{a.fear=combatBound(a.fear+5);b.log.push(`${name}: 공격이 빗나가고 의자가 벽을 때린다.`);}}
 }
 if(action==='advance'){
  if(a.zone===2){if(b.door<2){b.door++;b.log.push(`${name}: 걸린 방화문을 당긴다. ${b.door}/2${b.door===2?' · 문이 열렸다!':''}`);}else{a.zone=3;a.escaped=true;b.log.push(`${name}: 방화문 너머 계단으로 빠져나간다.`);}}
  else{const next=a.zone+1,blocked=b.enemies.some(e=>e.balance>0&&e.zone===next&&e.stun===0);if(blocked)b.log.push(`${name}: 앞을 막은 적 때문에 전진하지 못한다. 먼저 견제가 필요하다.`);else{a.zone=next;b.log.push(`${name}: 다음 구역(${combatZones[next]})으로 이동한다.`);}}
  if(key==='taei'&&b.carrying){a.stamina=combatBound(a.stamina-8);b.actors.ally.zone=a.zone;b.actors.ally.escaped=a.escaped;}
 }
 if(action==='retreat'){const next=a.zone-1;if(b.enemies.some(e=>e.balance>0&&e.zone===next&&e.stun===0))b.log.push(`${name}: 뒤쪽의 적 때문에 물러나지 못한다.`);else{a.zone=next;b.log.push(`${name}: 한 구역 물러난다.`);}if(key==='taei'&&b.carrying){a.stamina=combatBound(a.stamina-8);b.actors.ally.zone=a.zone;}}
}
export function executeCombat(state){
 const source=state.combatTrial;if(source?.status!=='active'||source.phase!=='planning')throw new Error('이미 실행한 턴입니다. 결과를 확인해 주세요.');
 const s=structuredClone(state),b=s.combatTrial;b.log=[];for(const a of Object.values(b.actors))a.guard=false;
 combatAct(s,'taei');combatAct(s,'ally');
 if(Object.values(b.actors).every(a=>a.escaped)){b.status='escaped';b.log.push('둘 다 계단으로 빠져나와 방화문을 닫았다. 적을 모두 쓰러뜨릴 필요는 없었다.');}
 if(b.status==='active'){
  if(b.noise>=6&&!b.reinforced){b.enemies.push({id:3,zone:0,balance:2,stun:0});b.reinforced=true;b.log.push('큰 소리를 따라 뒤쪽에서도 한 명이 더 나타난다!');}
  for(const e of b.enemies){if(e.balance<=0)continue;if(e.stun>0){e.stun--;continue;}
   const targets=Object.values(b.actors).filter(a=>!a.escaped&&!a.down).sort((x,y)=>Math.abs(e.zone-x.zone)-Math.abs(e.zone-y.zone));const target=targets[0];if(!target)continue;
   if(b.barrier>0){b.log.push('넘어진 의자가 적의 접근을 늦춘다.');continue;}
   if(Math.abs(e.zone-target.zone)>1){e.zone+=Math.sign(target.zone-e.zone);b.log.push('복도 너머의 적이 가까워진다.');continue;}
   const shield=Object.values(b.actors).some(a=>a.guard&&!a.escaped&&!a.down&&Math.abs(a.zone-target.zone)<=1);
   if(shield){target.stamina=combatBound(target.stamina-3);b.log.push(`${combatName(s,target.id)}에게 뻗은 손을 막아낸다.`);}else{target.stamina=combatBound(target.stamina-8);target.fear=combatBound(target.fear+14);target.wounds++;target.down=target.wounds>=3;b.log.push(`${combatName(s,target.id)}: 균형을 잃으며 ${target.down?'넘어져 혼자 움직이지 못한다.':'벽에 부딪혀 찰과상을 입는다.'}`);}
  }
  if(b.barrier>0)b.barrier--;
  for(const a of Object.values(b.actors)){a.thirst=combatBound(a.thirst+2);if(b.turn%3===0)a.hunger=combatBound(a.hunger+1);if(a.thirst>=70||a.hunger>=70)a.stamina=combatBound(a.stamina-3);}
  if(b.actors.taei.down){b.status='failed';b.log.push('태이가 쓰러져 더는 탈출을 이끌 수 없다.');}
  else if(b.turn>=10){b.status='failed';b.log.push('복도 너머의 발소리가 너무 가까워졌다. 탈출 기회를 놓쳤다.');}
 }
 b.phase='result';b.history.push({turn:b.turn,plans:{...b.plans},log:[...b.log]});return s;
}
export function nextCombatTurn(state){const b=state.combatTrial;if(b?.status!=='active'||b.phase!=='result')throw new Error('이어갈 전투가 없습니다.');const s=structuredClone(state);s.combatTrial.turn++;s.combatTrial.phase='planning';s.combatTrial.plans={taei:'brace',ally:'brace'};return s;}
export function combatThreats(state){const b=state.combatTrial;if(!b)return [];return b.enemies.filter(e=>e.balance>0).map(e=>({id:e.id,zone:e.zone,label:e.stun?'견제당함 · 이번 적 행동 멈춤':b.barrier?'장애물에 막힘':'가까운 사람에게 접근 · 닿으면 붙잡기 시도'}));}
