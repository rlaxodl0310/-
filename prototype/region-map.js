import {surroundingPlaces} from './surroundings-data.js';
// Game map art and screen coordinates; not a surveyed university plan.
export const mapRegions={
 north:{name:'북캠퍼스',atlas:0,links:{east:'arts',south:'athletics'}},
 arts:{name:'예술 구역',atlas:1,links:{west:'north',south:'town'}},
 athletics:{name:'체육·생활 구역',atlas:2,links:{north:'north',east:'town',west:'housing'}},
 town:{name:'정문 밖 대학가',atlas:3,links:{north:'arts',west:'athletics',south:'riverside',east:'transit'}},
 housing:{name:'자취촌',atlas:0,artSet:'surroundings',links:{east:'athletics',west:'residential'}},
 residential:{name:'서쪽 주택가',atlas:1,artSet:'surroundings',links:{east:'housing',south:'riverside'}},
 riverside:{name:'하천 산책로',atlas:2,artSet:'surroundings',links:{north:'town',west:'residential',east:'transit'}},
 transit:{name:'정류장 생활권',atlas:3,artSet:'surroundings',links:{west:'town',south:'riverside'}}
};
export const regionSites={headquarters:['north',25,28],baekseok:['north',70,28],creative:['north',20,65],sculpture:['north',48,65],academic:['north',80,65],library:['north',20,85],arts:['arts',28,40],music:['arts',75,35],hall:['arts',55,76],gym:['athletics',27,25],dorm:['athletics',78,22],field:['athletics',45,70],outdoorCourt:['athletics',82,70],cafeteria:['athletics',15,65],market:['town',18,45],restaurant:['town',42,47],cafe:['town',66,40],pub:['town',84,70],...Object.fromEntries(Object.entries(surroundingPlaces).map(([id,p])=>[id,[p.region,...p.pin]]))};
export function regionForPlace(place){return regionSites[place]?.[0]??'north';}
export function adjacentRegion(region,direction){return mapRegions[region]?.links[direction]??null;}
