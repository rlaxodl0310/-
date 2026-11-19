(function(root,f){if(typeof module==='object'&&module.exports)module.exports=f();else root.CombatMotion=f();})(globalThis,()=>{
// Body language only: these profiles never assign equipment, damage or a party role.
const profiles={
 taei:{name:'가벼운 중심 이동',lean:3,step:5,turn:7,side:4,tempo:1},
 dogyeom:{name:'짧은 스텝과 깊은 중심 낮추기',lean:8,step:3,turn:12,side:9,tempo:1.25},
 yeogyeong:{name:'어깨를 모으고 조심스럽게 디디기',lean:-3,step:2,turn:-5,side:-5,tempo:.85},
 yui:{name:'한쪽에 체중을 싣고 비껴서기',lean:-5,step:4,turn:-11,side:16,tempo:1.1},
 seoha:{name:'상체를 세운 느린 체중 이동',lean:1,step:1,turn:4,side:-12,tempo:.75},
 woojin:{name:'넓게 버티고 절제된 방향 전환',lean:5,step:2,turn:3,side:2,tempo:.9},
 'dogyeom-childhood-friend':{name:'작은 보폭과 뒤늦게 균형 잡기',lean:-7,step:3,turn:-8,side:7,tempo:1.05},
 nea:{name:'낮게 움츠리고 옆으로 빠지기',lean:9,step:6,turn:14,side:-18,tempo:1.2},
 zero:{name:'작은 도약과 날개로 균형 잡기',lean:0,step:9,turn:-9,side:5,tempo:.8}
};
function keys(id,type,weapon='gauntlet',reach={x:26,y:0},reduced=false){
 const p=profiles[id]||profiles.taei;
 const k=(offset,x=0,y=0,r=0,sx=1,sy=1)=>({offset,transform:`translate(${x}px,${y}px) rotate(${r}deg) scale(${sx},${sy})`});
 if(reduced)return[k(0),k(1)];
 if(type==='move')return[k(0),k(.18,reach.x*.12,reach.y*.12+p.step,p.lean*.3),k(.52,reach.x*.53,reach.y*.53-p.step,p.lean*-.25),k(.83,reach.x*.88,reach.y*.88+p.step*.4,p.lean*.15),k(1,reach.x,reach.y)];
 if(type==='dodge')return[k(0),k(.16,0,3,p.lean,1.01,.96),k(.43,-24+p.side,-7-p.step,p.turn),k(.7,-17+p.side*.6,1,p.turn*.45),k(1)];
 if(type==='guard')return[k(0),k(.25,-3+p.side*.2,3,p.lean*.6,1,.95),k(.7,-3+p.side*.2,3,p.lean*.6,1,.95),k(1)];
 if(type==='attack'){
  // Weapon selects the action; identity contributes balance and recovery, never a fixed class.
  if(weapon==='bow')return[k(0),k(.25,-5,2,-3+p.turn*.2),k(.55,-7,0,-6+p.turn*.2),k(.63,2,-1,3),k(.82,-2,1,p.lean*.2),k(1)];
  if(weapon==='magic')return[k(0),k(.25,-2,4,p.turn*.3,1,.96),k(.51,0,-4,p.turn*.5),k(.65,3,-2,-p.turn*.25),k(.85,0,2,p.lean*.2),k(1)];
  return[k(0),k(.22,-5,p.step,p.turn*.6,1.02,.96),k(.38,-2,2,-p.turn*.3),k(.56,reach.x,reach.y-p.step*.4,-p.turn,1.03,.98),k(.73,reach.x*.65,reach.y*.65+2,-p.turn*.45),k(.9,-1,2,p.lean*.15),k(1)];
 }
 return[k(0),k(.5,0,p.step*.25,p.lean*.15),k(1)];
}
return Object.freeze({profiles:Object.freeze(profiles),keys});
});
