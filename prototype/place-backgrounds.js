const campusBackgroundIds=['headquarters','baekseok','creative','sculpture','academic','library','arts','music','hall'];
const lifeBackgroundIds=['gym','dorm','field','outdoorCourt','cafeteria','market','restaurant','cafe','pub'];
const surroundingBackgroundIds=['studioAlley','laundry','pocketPark','neighborhoodMart','clinicJunction','communitySquare','riversideWalk','footbridge','underpass','busStop','serviceStreet','stationPlaza'];
export const placeBackgrounds=Object.fromEntries([['campus',campusBackgroundIds,3],['life',lifeBackgroundIds,3],['surroundings',surroundingBackgroundIds,4]].flatMap(([set,ids,rows])=>ids.map((id,i)=>[id,{set,index:i,columns:3,rows,x:(i%3)*50,y:Math.floor(i/3)*100/(rows-1)}])));
export function placeBackground(id){return placeBackgrounds[id]??null;}
