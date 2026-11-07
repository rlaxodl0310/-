import {combatCast,combatName,planCombat,executeCombat,nextCombatTurn} from './combat.js';
export const tacticalMap={width:12,height:8,exit:[[11,3],[11,4]],door:[[10,3],[10,4]],obstacles:[[1,1,'피아노'],[2,1,'피아노'],[1,2,'피아노 의자'],[4,1,'벽'],[4,2,'벽'],[4,6,'벽'],[8,1,'벽'],[8,2,'벽'],[8,6,'벽'],[6,2,'책상'],[6,5,'넘어진 책상'],[7,5,'의자'],[9,1,'화분'],[9,6,'화분'],[11,1,'벽'],[11,2,'벽'],[11,5,'벽'],[11,6,'벽']]};
const tacticalClamp=n=>Math.max(0,Math.min(100,Math.round(n)));
const tacticalDistance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const tacticalCell=(x,y)=>`${x},${y}`;
export function tacticalBlocked(x,y){return !Number.isInteger(x)||!Number.isInteger(y)||x<=0||x>=12||y<=0||y>=7||tacticalMap.obstacles.some(c=>c[0]===x&&c[1]===y);}
function tacticalDoor(x,y){return tacticalMap.door.some(c=>c[0]===x&&c[1]===y);}
function tacticalExit(x,y){return tacticalMap.exit.some(c=>c[0]===x&&c[1]===y);}
function tacticalOccupied(b,x,y,except){return Object.entries(b.actors).some(([key,a])=>key!==except&&!a.escaped&&!(b.carrying&&key==='ally')&&a.x===x&&a.y===y)||b.enemies.some(e=>e.balance>0&&e.id!==except&&e.x===x&&e.y===y);}
function tacticalWalkable(b,x,y,except){return !tacticalBlocked(x,y)&&!(b.door<2&&(tacticalDoor(x,y)||tacticalExit(x,y)))&&!tacticalOccupied(b,x,y,except)&&!b.cover?.some(c=>c.x===x&&c.y===y&&c.turns>0);}
export function startGridCombat(state,ally='student'){
 if(!combatCast.includes(ally))throw new Error('함께할 인물을 다시 골라 주세요.');
 const s=structuredClone(state),member=(id,x,y)=>({id,x,y,stamina:id==='taei'?90:80,fear:id==='taei'?15:30,hunger:20,thirst:20,wounds:0,down:false,escaped:false,guard:false,ap:2});
 s.combatTrial={version:2,status:'active',phase:'planning',turn:1,limit:12,seed:726139,ally,actors:{taei:member('taei',2,4),ally:member(ally,2,5)},enemies:[{id:1,x:6,y:4,balance:2,stun:0},{id:2,x:8,y:3,balance:2,stun:0}],door:0,noise:0,reinforced:false,items:{water:1,chair:1},cover:[],carrying:false,frames:[],history:[],log:['인물을 고른 뒤 파란 칸을 눌러 이동하세요. 한 번에 최대 3칸, 행동력 1을 사용합니다.']};return s;
}
// Breadth-first paths respect furniture, walls, living units and the locked exit.
export function tacticalPaths(state,key){
 const b=state.combatTrial,a=b?.actors[key];if(b?.version!==2||b.status!=='active'||!a||a.ap<1||a.down||a.escaped||key==='ally'&&b.carrying)return [];
 const cost=b.carrying&&key==='taei'?8:2,max=Math.min(3,Math.floor(a.stamina/cost)),queue=[{x:a.x,y:a.y,path:[]}],seen=new Set([tacticalCell(a.x,a.y)]),out=[];
 for(let i=0;i<queue.length;i++){const node=queue[i];if(node.path.length>=max)continue;for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=node.x+dx,y=node.y+dy,k=tacticalCell(x,y);if(seen.has(k)||!tacticalWalkable(b,x,y,key))continue;seen.add(k);const next={x,y,path:[...node.path,[x,y]]};queue.push(next);out.push({...next,cost:next.path.length*cost});}}
 return out;
}
export function tacticalTargets(state,key){const b=state.combatTrial,a=b?.actors[key];if(b?.version!==2||!a||a.ap<1||a.down||a.escaped||b.status!=='active')return [];return b.enemies.filter(e=>e.balance>0&&tacticalDistance(a,e)===1);}
export function tacticalCanOpen(state,key){const b=state.combatTrial,a=b?.actors[key];return b?.version===2&&b.status==='active'&&b.door<2&&a&&!a.down&&!a.escaped&&a.ap>0&&a.stamina>=4&&tacticalMap.door.some(([x,y])=>tacticalDistance(a,{x,y})===1);}
function tacticalRoll(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296;}
function tacticalRecord(b,text){b.log.push(text);b.history.push({turn:b.turn,text});}
function tacticalWin(b){if(Object.values(b.actors).every(a=>a.escaped)){b.status='escaped';tacticalRecord(b,'둘 다 방화문 너머로 탈출했다.');}}
function tacticalRequire(state,key){const b=state.combatTrial,a=b?.actors[key];if(b?.version!==2||b.status!=='active'||b.phase!=='planning'||!a||a.down||a.escaped||a.ap<1||key==='ally'&&b.carrying)throw new Error('지금 행동할 수 있는 인물을 선택하세요.');}
export function gridAct(state,key,action,target){
 tacticalRequire(state,key);const s=structuredClone(state),b=s.combatTrial,a=b.actors[key],name=combatName(s,a.id);b.frames=[];b.log=[];
 if(action==='move'){
  const path=tacticalPaths(s,key).find(p=>p.x===target?.x&&p.y===target?.y);if(!path)throw new Error('이동 범위의 빈 칸을 선택하세요. 벽이나 다른 인물은 통과할 수 없어요.');
  const from={x:a.x,y:a.y};a.x=path.x;a.y=path.y;a.stamina-=path.cost;a.ap--;b.frames.push({kind:'move',unit:key,from,to:{x:a.x,y:a.y},path:path.path});
  if(b.carrying&&key==='taei'){b.actors.ally.x=a.x;b.actors.ally.y=a.y;}
  tacticalRecord(b,`${name} · ${path.path.length}칸 이동`);
  if(tacticalExit(a.x,a.y)){a.escaped=true;if(b.carrying&&key==='taei')b.actors.ally.escaped=true;tacticalRecord(b,`${name} · 계단으로 탈출`);}
 }else if(action==='strike'||action==='shove'){
  const e=tacticalTargets(s,key).find(e=>e.id===target?.id),cost=action==='strike'?16:10;if(!e)throw new Error('상하좌우로 붙어 있는 적을 선택하세요.');if(a.stamina<cost)throw new Error('스태미나가 부족해요. 방어하거나 물을 마셔 주세요.');
  if(key==='ally'&&(a.fear>=70||a.id==='soyul'&&action==='strike'&&b.noise>=6)){a.ap--;a.guard=true;a.fear=tacticalClamp(a.fear-5);b.frames.push({kind:'guard',unit:key});tacticalRecord(b,`${name}: 가까이 가는 건 무리예요. 여기서 막을게요.`);return s;}
  a.ap--;a.stamina-=cost;b.noise+=action==='strike'?2:1;
  if(action==='strike'){const hit=tacticalRoll(b)<Math.max(.4,.92-a.fear/300-a.wounds*.05);if(hit){e.balance--;e.stun=1;}b.frames.push({kind:'strike',unit:key,target:'enemy-'+e.id,hit,defeated:e.balance<=0});tacticalRecord(b,`${name} · ${hit?(e.balance<=0?'적 제압':'타격 · 적 견제'):'공격 빗나감'}`);}
  else{e.stun=2;const dx=e.x-a.x,dy=e.y-a.y,nx=e.x+dx,ny=e.y+dy,from={x:e.x,y:e.y};if(tacticalWalkable(b,nx,ny,e.id)){e.x=nx;e.y=ny;}else{const other=b.enemies.find(z=>z.id!==e.id&&z.balance>0&&z.x===nx&&z.y===ny);if(other)other.stun=2;}b.frames.push({kind:'strike',unit:key,target:'enemy-'+e.id,hit:true},{kind:'move',unit:'enemy-'+e.id,from,to:{x:e.x,y:e.y},path:[[e.x,e.y]]});tacticalRecord(b,`${name} · 밀치기, 적 2회 행동 견제`);}
 }else if(action==='door'){
  if(!tacticalCanOpen(s,key))throw new Error('방화문 옆 칸으로 이동하세요.');a.ap--;a.stamina-=4;b.door++;b.frames.push({kind:'door',unit:key});tacticalRecord(b,b.door>=2?'방화문이 열렸다. 금색 출구 칸으로 이동하세요.':`${name} · 방화문 걸쇠 해제 1/2`);
 }else if(action==='guard'){
  a.ap--;a.guard=true;a.stamina=tacticalClamp(a.stamina+12);a.fear=tacticalClamp(a.fear-6);b.frames.push({kind:'guard',unit:key});tacticalRecord(b,`${name} · 방어, 스태미나 회복`);
 }else if(action==='drink'){
  if(b.items.water<1)throw new Error('남은 생수가 없어요.');b.items.water--;a.ap--;a.stamina=tacticalClamp(a.stamina+18);a.thirst=tacticalClamp(a.thirst-25);b.frames.push({kind:'guard',unit:key});tacticalRecord(b,`${name} · 생수 사용`);
 }else if(action==='cover'){
  if(b.items.chair<1||a.stamina<5||tacticalDistance(a,target??{})!==1||!tacticalWalkable(b,target.x,target.y,key))throw new Error('인접한 빈 칸에 의자를 놓을 수 있어요.');b.items.chair--;a.ap--;a.stamina-=5;b.noise++;b.cover.push({x:target.x,y:target.y,turns:2});b.frames.push({kind:'guard',unit:key});tacticalRecord(b,`${name} · 의자로 길 막기`);
 }else if(action==='rescue'){
  const ally=b.actors.ally;if(key!=='taei'||!ally.down||ally.escaped||b.carrying||tacticalDistance(a,ally)>1||a.stamina<10)throw new Error('쓰러진 동료 옆에서 태이가 부축할 수 있어요.');a.ap--;a.stamina-=10;b.carrying=true;ally.x=a.x;ally.y=a.y;b.frames.push({kind:'guard',unit:key});tacticalRecord(b,'동료를 부축했다. 함께 이동하며 스태미나를 더 사용한다.');
 }else throw new Error('알 수 없는 전투 행동입니다.');
 tacticalWin(b);return s;
}
function tacticalEnemyPath(b,e,target){
 const queue=[{x:e.x,y:e.y,path:[]}],seen=new Set([tacticalCell(e.x,e.y)]);
 for(let i=0;i<queue.length;i++){const n=queue[i];if(tacticalDistance(n,target)===1)return n.path;for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=n.x+dx,y=n.y+dy,k=tacticalCell(x,y);if(seen.has(k)||!tacticalWalkable(b,x,y,e.id))continue;seen.add(k);queue.push({x,y,path:[...n.path,[x,y]]});}}
 return null;
}
export function endGridTurn(state){
 const original=state.combatTrial;if(original?.version!==2||original.status!=='active')throw new Error('진행 중인 전투가 없습니다.');const s=structuredClone(state),b=s.combatTrial;b.frames=[];b.log=[];
 if(b.noise>=6&&!b.reinforced){const spawn=[[1,3],[1,4],[2,3],[3,3]].find(([x,y])=>tacticalWalkable(b,x,y));if(spawn){b.enemies.push({id:3,x:spawn[0],y:spawn[1],balance:2,stun:0});b.reinforced=true;b.frames.push({kind:'spawn',unit:'enemy-3'});tacticalRecord(b,'소음을 따라 뒤쪽에 적이 나타났다.');}}
 for(const e of b.enemies){if(e.balance<=0)continue;if(e.stun>0){e.stun--;continue;}
  const candidates=Object.values(b.actors).filter(a=>!a.escaped&&!a.down).map(a=>({a,path:tacticalEnemyPath(b,e,a)})).filter(c=>c.path!==null).sort((x,y)=>x.path.length-y.path.length);const choice=candidates[0];if(!choice)continue;
  const path=choice.path.slice(0,2);if(path.length){const from={x:e.x,y:e.y},last=path.at(-1);e.x=last[0];e.y=last[1];b.frames.push({kind:'move',unit:'enemy-'+e.id,from,to:{x:e.x,y:e.y},path});}
  const target=choice.a;if(tacticalDistance(e,target)===1){const shield=Object.values(b.actors).some(a=>!a.down&&!a.escaped&&a.guard&&tacticalDistance(a,target)<=1);const targetKey=target===b.actors.taei?'taei':'ally';if(shield){target.stamina=tacticalClamp(target.stamina-3);tacticalRecord(b,`${combatName(s,target.id)} · 접근을 막아냈다`);}else{target.stamina=tacticalClamp(target.stamina-8);target.fear=tacticalClamp(target.fear+14);target.wounds++;target.down=target.wounds>=3;tacticalRecord(b,`${combatName(s,target.id)} · ${target.down?'쓰러짐, 부축 필요':'충돌로 찰과상'}`);}b.frames.push({kind:'strike',unit:'enemy-'+e.id,target:targetKey,hit:!shield,down:target.down});}
 }
 for(const a of Object.values(b.actors)){a.guard=false;a.ap=a.down||a.escaped?0:2;a.thirst=tacticalClamp(a.thirst+2);if(b.turn%3===0)a.hunger=tacticalClamp(a.hunger+1);if(a.thirst>=70||a.hunger>=70)a.stamina=tacticalClamp(a.stamina-3);}
 b.cover=b.cover.map(c=>({...c,turns:c.turns-1})).filter(c=>c.turns>0);
 if(b.actors.taei.down){b.status='failed';tacticalRecord(b,'태이가 쓰러졌다. 탈출을 이어갈 수 없다.');}
 else if(b.turn>=b.limit){b.status='failed';tacticalRecord(b,'복도 끝의 무리가 몰려와 탈출로가 막혔다.');}else b.turn++;
 if(!b.log.length)tacticalRecord(b,'적의 움직임이 멈췄다. 다음 행동을 선택하세요.');return s;
}
// Old version-one saves keep their original rules and results.
export function planGridCombat(state,key,action){return planCombat(state,key,action);}
export function executeGridCombat(state){return executeCombat(state);}
export function nextGridTurn(state){return nextCombatTurn(state);}
