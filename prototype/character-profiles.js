export const characterAges={nursingStudent:22,taei:23,seoha:22,doyun:24,nakyeong:21,haerin:22,subin:23,yeogyeong:21,seoyeon:21,soyul:21,iseo:21,dogyeom:21,chaewon:21,jihoo:19,naeun:19,dohyun:19,dayeon:19,chaerin:19,junseo:19};
export const fairStudentAgeIds=['jihoo','naeun','dohyun','dayeon','chaerin','junseo'];
export function characterAge(id){return characterAges[id]??null;}
export function knownCharacterAge(s,id){if(id==='taei')return characterAge(id);const c=s.contacts?.[id];if(!c?.introduced&&!c?.seen)return null;if(c?.introduced&&fairStudentAgeIds.includes(id)&&c.details?.grade===3)return 19;return c.details?.age??null;}
