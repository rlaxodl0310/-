const campusBackgroundIds=['headquarters','baekseok','creative','sculpture','academic','library','arts','music','hall'];
const lifeBackgroundIds=['gym','dorm','field','outdoorCourt','cafeteria','market','restaurant','cafe','pub'];
const surroundingBackgroundIds=['studioAlley','laundry','pocketPark','neighborhoodMart','clinicJunction','communitySquare','riversideWalk','footbridge','underpass','busStop','serviceStreet','stationPlaza'];
export const placeBackgrounds=Object.fromEntries([['campus',campusBackgroundIds,3],['life',lifeBackgroundIds,3],['surroundings',surroundingBackgroundIds,4]].flatMap(([set,ids,rows])=>ids.map((id,i)=>[id,{set,index:i,columns:3,rows,x:(i%3)*50,y:Math.floor(i/3)*100/(rows-1)}])));
export function placeBackground(id){return placeBackgrounds[id]??null;}

// Reusable authored interior references, not permission to enter a room.
export const interiorBackgroundNames=['음악 강의실','합주실','개인 연습실','패션 작업실','간호 실습실','미술 작업실','치위생 실습실','실내체육관','체력단련실','일반 강의실','인문 세미나실','과학 실험실','컴퓨터 실습실','동아리실','조리 실습실','채플홀','생활관 공용 로비','도서관'];
export function interiorBackground(place,area){
 const name=area?.name??'',id=area?.id??'';let index=null;
 if(place==='library')index=17;
 else if(place==='dorm')index=16;
 else if(place==='baekseok')index=15;
 else if(!area)return null;
 else if(/편의점|은행|식당|카페|복도|공용 학습/.test(name))return null;
 else if(/합주/.test(name))index=1;
 else if(/연습실/.test(name))index=2;
 else if(place==='arts')index=/홀|무대|시청각/.test(name)?null:0;
 else if(place==='creative')index=/패션/.test(name)?3:/간호.*실습/.test(name)?4:/미대/.test(name)?5:/도서관/.test(name)?17:9;
 else if(place==='gym')index=id==='court'?7:id==='fitness'?8:9;
 else if(place==='sculpture')index=/실습/.test(name)?6:9;
 else if(place==='cafeteria')index=/조리/.test(name)?14:9;
 else if(place==='hall')index=13;
 else if(place==='humanities')index=10;
 else if(place==='science')index=/실험|실습/.test(name)?11:9;
 else if(place==='engineering')index=/실습|작업/.test(name)?12:9;
 else if(['headquarters','academic'].includes(place))index=9;
 if(index===null)return null;
 const tile=index%9;return {set:index<9?'specialist':'common',index,name:interiorBackgroundNames[index],rows:3,columns:3,x:tile%3*50,y:Math.floor(tile/3)*50};
}

export function commerceBackground(place,area){
 const name=area?.name??'';let index=null;
 if(['market','neighborhoodMart'].includes(place))index=0;
 else if(place==='restaurant')index=3;
 else if(place==='cafe')index=4;
 else if(place==='pub')index=5;
 else if(/편의점|매점/.test(name))index=place==='cafeteria'?1:0;
 else if(/식당/.test(name))index=2;
 else if(/카페/.test(name))index=4;
 if(index===null)return null;
 return {set:'commerce',index,name:['편의점','교내 매점','학식당','대학가 밥집','카페','대학가 술집'][index],columns:2,rows:3,x:index%2*100,y:Math.floor(index/2)*50};
}
