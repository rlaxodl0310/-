// Clock-free input game: the activity commits its time/effects only after confirmation.
const miniClamp=n=>Math.max(0,Math.min(1,n));
export function needsActivityMiniGame(record){return record?.status==='active'&&record.step===1&&['basketball-open','cooking-open','carry-open'].includes(record.postId);}
export function createActivityMiniGame(record,choice){
 if(!needsActivityMiniGame(record))throw new Error('지금은 미니게임을 시작할 차례가 아닙니다.');
 const kind=record.postId==='basketball-open'?'basketball':record.postId==='cooking-open'?'cooking':'carry';
 const seed=((record.actionState?.rng??1)^Math.imul(record.choices.length+1,2654435761))>>>0;
 const targets=Array.from({length:kind==='basketball'?1:3},(_,i)=>.40+((seed>>>((i*7)%24))%25)/100);
 return {id:`${record.key}:${record.choices.length}`,kind,choice,phase:'ready',elapsed:0,segmentStart:0,lockedUntil:0,targets,hits:[],result:null};
}
export function startActivityMiniGame(mini){
 if(!['ready','paused'].includes(mini.phase))return mini;
 return {...mini,phase:'running'};
}
export function tickActivityMiniGame(mini,delta){
 if(mini.phase!=='running'||!Number.isFinite(delta)||delta<0)return mini;
 return {...mini,elapsed:mini.elapsed+delta};
}
export function pauseActivityMiniGame(mini){return mini?.phase==='running'?{...mini,phase:'paused'}:mini;}
export function activityMiniPosition(mini){
 const cycle=((mini.elapsed-mini.segmentStart)%1800)/900;
 return miniClamp(cycle<=1?cycle:2-cycle);
}
export function hitActivityMiniGame(mini){
 if(mini.phase!=='running'||mini.elapsed<mini.lockedUntil)return mini;
 const position=activityMiniPosition(mini),target=mini.targets[mini.hits.length];
 const score=Math.round(miniClamp(1-Math.abs(position-target)/.34)*100);
 const hits=[...mini.hits,{position,target,score,elapsed:mini.elapsed}];
 const next={...mini,hits,segmentStart:mini.elapsed,lockedUntil:mini.elapsed+240};
 if(hits.length===mini.targets.length){next.phase='result';next.result={mode:'played',score:Math.round(hits.reduce((n,h)=>n+h.score,0)/hits.length),hits:structuredClone(hits)};}
 return next;
}
export function skipActivityMiniGame(mini){
 if(mini.phase==='result')return mini;
 return {...mini,phase:'result',result:{mode:'assisted',score:null,hits:structuredClone(mini.hits)}};
}
export function activityMiniConfig(mini){
 if(mini.kind==='basketball')return {title:mini.choice==='shoot'?'슛 타이밍':'농구 타이밍',action:mini.choice==='shoot'?'공 놓기':mini.choice==='pass'?'패스 보내기':'발 내딛기',hint:'움직이는 표시가 목표 구간에 들어올 때 눌러주세요.',axis:'힘과 타이밍'};
 if(mini.kind==='cooking')return {title:'냄비 불 조절',action:'불 조절',hint:'목표 온도에 들어올 때 눌러 세 번 불을 맞춰주세요.',axis:'온도'};
 return {title:'상자 균형 잡기',action:'균형 잡기',hint:'표시가 안정 구간에 들어올 때 눌러 세 번 중심을 잡아주세요.',axis:'상자 기울기'};
}
export function activityMiniFeedback(score){return score>=85?'정확하게 맞췄어요!':score>=60?'잘 맞췄어요.':'목표 구간을 조금 벗어났어요.';}
