// Presentation-only pacing: these functions never advance the world or choose an answer.
export function splitNovelText(text,limit=180){
 if(!Number.isInteger(limit)||limit<1)throw new Error('올바른 문장 길이를 지정해야 합니다.');
 let remaining=String(text??'').replace(/\s+/g,' ').trim();const parts=[];
 while(remaining.length>limit){
  const window=remaining.slice(0,limit);let cut=-1;
  for(const match of window.matchAll(/[.!?。](?:[”’"']?)(?=\s)/g))cut=match.index+match[0].length;
  if(cut<Math.floor(limit/3))cut=window.lastIndexOf(' ');
  if(cut<=0)cut=limit;
  parts.push(remaining.slice(0,cut).trim());remaining=remaining.slice(cut).trim();
 }
 if(remaining)parts.push(remaining);return parts;
}
export function novelChoicePage(choices,page=0){
 const size=choices.length<=3?3:2,pages=Math.max(1,Math.ceil(choices.length/size));
 const index=((page%pages)+pages)%pages;
 return {items:choices.slice(index*size,(index+1)*size),page:index,pages,more:pages>1};
}
export function advanceNovel(view,beatCount){
 if(view.choosing)return {...view};
 return view.beat+1<beatCount?{...view,beat:view.beat+1}:{...view,choosing:true,page:0};
}
