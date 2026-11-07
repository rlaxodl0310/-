import {npcNow} from './npc-state.js';
const actingCore=new Set(['yeogyeong','seoyeon','soyul']);
const actingNames={neutral:'차분히 듣는 표정',warm:'편안한 미소',worried:'걱정하며 생각하는 표정',serious:'진지한 표정',bashful:'쑥스러운 표정',surprised:'놀란 표정',happy:'즐거운 표정'};
export function characterActing(state,id,{scene='',text='',listening=false,heardText='',emotion}={}){
 // Pure presentation: observing a beat never changes world state or consumes RNG.
 const mood=actingCore.has(id)?npcNow(state,id).mood:'steady';
 const source=listening?heardText:text;
 const relation=state.relations?.[`${id}>taei`]??{};
 let feeling=emotion;
 if(!Object.hasOwn(actingNames,feeling)){
  if(/걱정|미안|피곤|불안|무섭|죄책|아프|다쳤|울먹/.test(source))feeling='worried';
  else if(/그만|곤란|안 돼|서두|급해|싫어|불편/.test(source))feeling='serious';
  else if(/깜짝|설마|진짜\?|정말\?|놀랐|처음 듣/.test(source))feeling='surprised';
  else if(/부끄|쑥스|민망|얼굴.*빨|귀엽|예쁘|멋있/.test(source))feeling=listening&&(relation.tension??0)>=3?'serious':'bashful';
  else if(/하하|웃음|재밌|재미있|신난|즐거|장난/.test(source))feeling='happy';
  else if(/고마|반가|다행|괜찮아|잘했|덕분/.test(source))feeling='warm';
  else if(['overwhelmed','drained'].includes(mood))feeling='worried';
  else if(['rushed','focused'].includes(mood)||['warningScene','warningShare','classLesson'].includes(scene))feeling='serious';
  else if(mood==='bright')feeling='warm';
  else feeling='neutral';
 }
 // Iseo keeps her own three-pose atlas; never index it as the four-person sheet.
 if(id==='iseo')return {row:feeling==='bashful'?2:['happy','warm'].includes(feeling)?1:0,atlas:'iseo',emotion:feeling,name:actingNames[feeling]};
 const extra={bashful:0,surprised:1,happy:2};
 return {row:extra[feeling]??({warm:0,worried:1,serious:2}[feeling]??null),atlas:Object.hasOwn(extra,feeling)?'extra':'base',emotion:feeling,name:actingNames[feeling]};
}
