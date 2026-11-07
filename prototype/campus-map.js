// Game schematic only: these positions are not surveyed real-world geography.
export const campusMapPositions={headquarters:[2,1],baekseok:[3,1],academic:[4,1],creative:[1,2],library:[1,3],sculpture:[2,2],arts:[3,2],music:[4,2],hall:[2,3],gym:[3,3],field:[3,4],outdoorCourt:[4,4],cafeteria:[1,4],dorm:[4,3],market:[1,5],restaurant:[2,5],cafe:[3,5],pub:[4,5]};
export function choicePurpose(action,value){
 if(action==='classTravel')return ['수업 장소로 이동','도착 후 입실 여부를 결정'];
 if(action==='classPrepare')return ['수업 입실','수업 내용과 참여 방식 확인'];
 if(action==='buildingArea'||action==='buildingFloor')return ['실내 이동','이 공간으로 이동해 주변 확인'];
 if(action==='walk')return ['가까이 살펴보기','이곳의 구역으로 이동 · 상황 확인'];
 if(action==='select')return ['활동 알아보기','내용·소요 시간 확인 후 시작 결정'];
 if(action==='openShop')return ['매장 메뉴','상품·가격 확인 · 아직 결제하지 않음'];
 if(action==='buildingActivity')return ['이곳에서 행동','선택한 행동을 바로 실행'];
 if(action==='libraryActivity')return ['도서관 활동','선택한 행동을 바로 실행'];
 if(action==='openFortnight')return ['일상 활동','진행 내용을 보고 참여 결정'];
 if(action==='outdoorActivity')return ['야외 활동','표시된 시간만큼 운동·휴식'];
 if(action==='onsiteEvent')return ['참여 안내 듣기','활동 설명 확인 · 아직 참여하지 않음'];
 if(action==='wait')return ['시간 보내기','잠시 쉬며 다음 시간대로 진행'];
 if(action==='go'&&['travel','map'].includes(value))return ['지도에서 이동','장소를 고르기 전에는 이동하지 않음'];
 if(action==='go'&&value==='dayEnd')return ['하루 마무리','귀가 전 남은 수업·일정 확인'];
 return null;
}
export function choiceSection(action,value){
 if(['classTravel','classPrepare','classChoice'].includes(action))return '수업';
 if(action==='go'&&['travel','map','campus','buildingDirectory'].includes(value)||['buildingFloor','buildingArea','walk'].includes(action))return '이동·탐색';
 if(['select','openFortnight','outdoorActivity','buildingActivity','libraryActivity','openShop','onsiteEvent'].includes(action))return '활동';
 return '기타';
}

export const minimapSites={headquarters:[45,12,13,10],baekseok:[66,13,13,9],academic:[84,22,10,8],creative:[17,24,13,10],library:[17,39,11,8],sculpture:[38,31,10,9],arts:[61,35,12,10],music:[81,41,9,8],hall:[37,50,10,8],gym:[62,56,13,9],field:[61,74,19,13],outdoorCourt:[85,69,12,10],cafeteria:[17,58,12,8],dorm:[85,55,10,8],market:[15,91,12,6],restaurant:[36,91,12,6],cafe:[58,91,12,6],pub:[81,91,12,6]};
export function minimapTerrain(){
 const treePoints=[[5,8],[9,11],[22,8],[28,14],[8,34],[28,40],[30,65],[9,73],[16,77],[26,72],[47,42],[49,58],[74,7],[91,9],[94,32],[73,28],[73,60],[91,78],[42,75],[44,80],[4,54],[5,62]];
 return `<svg class="minimap-terrain" viewBox="0 0 900 760" aria-hidden="true"><defs><pattern id="mapGrass" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M4 7l2-3m14 15 2-3" stroke="#6f915b" opacity=".18"/></pattern><pattern id="mapPaving" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 0h16v16" fill="none" stroke="#c7c8b5" stroke-width=".6"/></pattern><filter id="mapShadow"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".12"/></filter></defs><rect width="900" height="760" fill="#b8c8a1"/><rect width="900" height="760" fill="url(#mapGrass)"/><path d="M0 80Q160 0 300 70T630 45T900 100V0H0Z M0 490Q120 480 260 620L0 630Z" fill="#a3b98c"/><path d="M456 0V630M0 629H900M270 80V552M735 70V590M100 343H831M267 175H760M120 490H760" fill="none" stroke="#8a9c80" stroke-width="29"/><path d="M456 0V630M0 629H900M270 80V552M735 70V590M100 343H831M267 175H760M120 490H760" fill="none" stroke="#e7e2cd" stroke-width="23" stroke-linejoin="round"/><path d="M456 0V630M0 629H900M270 80V552M735 70V590M100 343H831M267 175H760M120 490H760" fill="none" stroke="url(#mapPaving)" stroke-width="20"/><circle cx="456" cy="343" r="37" fill="#dedac7" stroke="#b8bfa7" stroke-width="3"/><circle cx="456" cy="343" r="19" fill="#8db7b2" stroke="#f1edde" stroke-width="6"/><path d="M410 629h90v22h-90z" fill="#6f7c68"/><path d="M414 618v35m82-35v35" stroke="#f3edd5" stroke-width="8"/><rect x="0" y="658" width="900" height="102" fill="#c7c2af"/><path d="M0 649h900" stroke="#737f7c" stroke-width="26"/><path d="M0 649h900" stroke="#b7bba9" stroke-width="1.5" stroke-dasharray="16 14"/><g fill="#52674f" font-size="12" font-family="sans-serif" letter-spacing="2"><text x="475" y="606">정문</text><text x="24" y="679">대학가</text><text x="475" y="292">중앙광장</text></g>${treePoints.map(([x,y],i)=>`<g transform="translate(${x*9} ${y*7.6})" filter="url(#mapShadow)"><ellipse cy="9" rx="14" ry="8" fill="#58734e" opacity=".15"/><circle r="${13+i%4}" fill="${i%3===0?'#81996a':'#6d8c60'}"/><circle cx="-4" cy="-4" r="8" fill="#93aa7b" opacity=".7"/></g>`).join('')}<g transform="translate(852 53)" fill="#4f6556"><path d="M0-21 8 9 0 3-8 9Z"/><text y="-28" text-anchor="middle" font-size="12">N</text></g><g transform="translate(25 721)" stroke="#4e6255" fill="#4e6255"><path d="M0 0h80m-80-4v8m80-8v8"/><text y="20" stroke="none" font-size="10">CAMPUS MAP · 게임 배치도</text></g></svg>`;
}
export function minimapBuilding(id){
 if(id==='field')return '<svg viewBox="0 0 150 100" aria-hidden="true"><rect x="3" y="3" width="144" height="94" rx="42" fill="#a77e68" stroke="#ebd7b8" stroke-width="3"/><rect x="13" y="13" width="124" height="74" rx="32" fill="none" stroke="#e7cbb1"/><rect x="22" y="24" width="106" height="52" fill="#79936a" stroke="#e0e8cf"/><path d="M75 24v52m-53-41h15v30H22m106-30h-15v30h15" fill="none" stroke="#e0e8cf"/><circle cx="75" cy="50" r="13" fill="none" stroke="#e0e8cf"/></svg>';
 if(id==='outdoorCourt')return '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="3" y="3" width="114" height="84" fill="#75918c" stroke="#e2dfc7" stroke-width="3"/><path d="M60 3v84M3 25h23v40H3m114-40H94v40h23" fill="none" stroke="#e2dfc7" stroke-width="2"/><circle cx="60" cy="45" r="15" fill="none" stroke="#e2dfc7" stroke-width="2"/></svg>';
 const warm=['arts','music','baekseok'].includes(id),roof=warm?'#ad8c7b':'#8c9c9c',edge=warm?'#7f675d':'#637778';
 return `<svg viewBox="0 0 140 100" aria-hidden="true"><path d="M12 20h116v65H12z" fill="${edge}"/><path d="M8 12h116v60H8z" fill="${roof}" stroke="#e7e5d2" stroke-width="2"/><path d="M8 12 20 24h92l12-12M20 24v36h92V24" fill="none" stroke="${edge}" stroke-width="3"/><path d="M29 34h22v14H29zm33 0h22v14H62zm32 0h10v14H94z" fill="#c0cec9" opacity=".7"/><path d="M53 72h27v13H53z" fill="#d9d6be"/></svg>`;
}
