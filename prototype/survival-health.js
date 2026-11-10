// Positive meters: full stomach / hydration fall as supplies run short.
const healthClamp=n=>Math.max(0,Math.min(100,Math.round(n)));
export function survivalHealth(member){
 return {nutrition:member.nutrition??80,hydration:member.hydration??80,woundDays:member.injury>0?member.woundDays??0:0,woundRisk:member.injury>0?member.woundRisk??0:0,caredDay:member.caredDay??null,starveNights:member.starveNights??0,dryNights:member.dryNights??0};
}
export function ensureSurvivalHealth(member){Object.assign(member,survivalHealth(member));return member;}
export function survivalStaminaCap(nutrition,hydration){return 100-(nutrition<=15?20:nutrition<=35?10:0)-(hydration<=15?30:hydration<=35?15:0);}
export function survivalCondition(member){
 const h=survivalHealth(member),food=h.nutrition<=15?12:h.nutrition<=35?6:0,water=h.hydration<=15?20:h.hydration<=35?10:0,wound=h.woundRisk>=80?15:h.woundRisk>=50?7:0;
 const staminaCap=survivalStaminaCap(h.nutrition,h.hydration);
 return {...h,staminaCap,stamina:Math.min(staminaCap,Math.max(10,100-Math.floor(member.fatigue/2)-food-water-wound)),fear:Math.min(90,15+Math.floor(member.stress/2)+Math.floor((food+water)/2)+Math.floor(wound/2)),critical:member.injury>=3||h.woundRisk>=80||h.hydration===0&&h.dryNights>=3||h.nutrition===0&&h.starveNights>=5,warning:[h.nutrition<=35?'식량 부족':null,h.hydration<=35?'수분 부족':null,h.woundRisk>=50?'상처 악화 위험':null].filter(Boolean)};
}
export function spendSurvivalEffort(run,food=3,water=5,keys=['taei','ally']){
 for(const m of run.members.filter(m=>keys.includes(m.key))){ensureSurvivalHealth(m);m.nutrition=healthClamp(m.nutrition-food);m.hydration=healthClamp(m.hydration-water);const c=survivalCondition(m);if(c.nutrition<=35||c.hydration<=35){m.fatigue=healthClamp(m.fatigue+(c.nutrition<=15?4:c.nutrition<=35?2:0)+(c.hydration<=15?6:c.hydration<=35?3:0));m.stress=healthClamp(m.stress+(c.nutrition<=35?2:0)+(c.hydration<=35?3:0));}}
}
export function feedSurvivalMember(member,id){
 ensureSurvivalHealth(member);if(id==='water')member.hydration=healthClamp(member.hydration+40);else member.nutrition=healthClamp(member.nutrition+({food:35,canned:45,energybar:15}[id]??0));
}
export function careSurvivalWound(member,day,{strong=false,reduce=1}={}){
 ensureSurvivalHealth(member);member.injury=Math.max(0,member.injury-reduce);member.woundDays=0;member.woundRisk=member.injury>0?healthClamp(member.woundRisk-(strong?40:20)):0;member.caredDay=day;
}
export function advanceSurvivalHealth(run,foodCount,waterCount,day){
 const events=[],order=run.members.map((_,i)=>run.members[(i+day%run.members.length)%run.members.length]);
 for(let i=0;i<order.length;i++){
  const m=ensureSurvivalHealth(order[i]),fed=i<foodCount,drank=i<waterCount;m.nutrition=healthClamp(m.nutrition-22+(fed?40:0));m.hydration=healthClamp(m.hydration-28+(drank?48:0));
  const foodPenalty=m.nutrition<=15?10:m.nutrition<=35?5:0,waterPenalty=m.hydration<=15?16:m.hydration<=35?8:0;
  m.fatigue=healthClamp(m.fatigue+foodPenalty+waterPenalty);m.stress=healthClamp(m.stress+Math.ceil(foodPenalty/2)+Math.ceil(waterPenalty/2));
  m.starveNights=m.nutrition===0?m.starveNights+1:0;m.dryNights=m.hydration===0?m.dryNights+1:0;
  if(m.key==='taei'&&(m.dryNights>=3||m.starveNights>=5)){run.status='overrun';events.push('태이가 장기간의 '+(m.dryNights>=3?'수분 고갈':'영양 고갈')+'로 더는 움직일 수 없다. 이번 생존 기록이 끝났다.');}
  if(!fed||!drank)events.push(`${m.key} · ${!fed?'식량 부족 ':''}${!drank?'물 부족 ':''}(포만감 ${m.nutrition} · 수분 ${m.hydration}).`);
  if(m.injury>0){
   if(m.caredDay===day){m.woundRisk=healthClamp(m.woundRisk-4);events.push(`${m.key} · 상처를 돌봐 오늘은 방치 악화가 멈췄다.`);}
   else{m.woundDays++;m.woundRisk=healthClamp(m.woundRisk+12+m.injury*4+(m.hydration<=35?6:0)+(m.nutrition<=35?4:0));
    if(m.woundDays>=3&&m.woundDays%3===0&&m.woundRisk>=45){m.injury=Math.min(3,m.injury+1);events.push(`${m.key} · 오래 방치한 상처가 악화되어 부상이 늘었다.`);}
    if(m.woundRisk>=50){m.fatigue=healthClamp(m.fatigue+8);m.stress=healthClamp(m.stress+6);events.push(`${m.key} · 상처 악화 위험 ${m.woundRisk}/100. 치료가 필요하다.`);}
    if(m.key==='taei'&&m.woundRisk>=100&&m.woundDays>=5){run.status='overrun';events.push('태이가 방치한 상처의 악화로 더는 움직일 수 없다. 이번 생존 기록이 끝났다.');}
   }
  }else{m.woundDays=0;m.woundRisk=0;}
 }
 return events;
}
