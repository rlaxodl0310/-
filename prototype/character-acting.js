import {npcNow} from './npc-state.js';
export function characterActing(state,id,{scene='',text=''}={}){
 // Visual direction only: no relationship, knowledge, RNG or clock mutations.
 const mood=id==='taei'?'steady':npcNow(state,id).mood;
 let row=null;
 if(/걱정|미안|피곤|불안|무섭|죄책/.test(text)||['overwhelmed','drained'].includes(mood))row=1;
 else if(/그만|곤란|안 돼|서두|급해/.test(text)||['rushed','focused'].includes(mood)||['warningScene','warningShare','classLesson'].includes(scene))row=2;
 else if(/웃|고마|반가|다행|즐거/.test(text)||mood==='bright'||scene==='result')row=0;
 return {row,name:row===0?'미소와 편안한 자세':row===1?'걱정하거나 생각하는 자세':row===2?'진지하게 반응하는 자세':'기본 자세'};
}
