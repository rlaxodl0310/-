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
