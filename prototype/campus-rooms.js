// Game-authored room assignments, not surveyed university room numbers.
const gameRoom=(id,floor,number,use,extra='')=>({id,floor,number,name:`${number}호 ${use}`,kind:/강의실/.test(use)?'classroom':'facility',text:`${floor} ${number}호 문 앞에 선다. 문 옆 안내에는 ${use}이라고 적혀 있다. ${extra||'안쪽에서 수업이나 작업 중이면 문을 열지 않고 복도에서 안내를 확인한다.'}`,provisional:true});
const roomSeries=(floor,numbers,use='강의실')=>numbers.map(number=>gameRoom('room'+number,`${floor}층`,String(number),use));
export const gameRoomLayouts={
 arts:[
  gameRoom('av','1층','101','시청각실'),gameRoom('musical','1층','102','뮤지컬홀·대형 무대'),
  ...[2,3,5,6].flatMap(f=>roomSeries(f,[f*100+1,f*100+2,f*100+3])),
  gameRoom('classes','4층','401','응용 화성학 강의실'),...roomSeries(4,[402,403]),
  gameRoom('band','4층 구석','409','대형 합주실','복도 끝 방음문 너머로 넓은 합주 공간이 이어진다.'),
  gameRoom('small7','7층','701','소형 연습실'),...roomSeries(7,[702,703]),
  ...roomSeries(7,[711,712],'소형 연습실'),gameRoom('small8','8층','801','소형 연습실'),...roomSeries(8,[802,803,804],'소형 연습실')
 ],
 headquarters:[
  {id:'basement',floor:'지하',name:'지하 공용 복도',text:'지하 공용 복도에서 식당과 위층으로 돌아가는 계단을 확인한다.',provisional:true},
  gameRoom('bank','1층','101','은행'),gameRoom('store','1층','102','편의점'),gameRoom('dining','지하','B101','식당'),
  gameRoom('classrooms','3층','301','강의실'),
  ...Array.from({length:9},(_,i)=>i+2).flatMap(f=>roomSeries(f,[f*100+1,f*100+2,f*100+3])).filter(r=>r.number!=='301')
 ],
 music:[gameRoom('medium','2층','201','중형 연습실'),...roomSeries(2,[202,203,204],'중형 연습실'),...roomSeries(3,[301,302,303,304],'중형 연습실')],
 gym:[gameRoom('basement','지하','B101','연습실'),gameRoom('basementBand','지하','B102','합주실'),gameRoom('first','1층','101','연습실'),...roomSeries(1,[102,103],'합주실'),gameRoom('court','2층','201','대형 실내체육관'),gameRoom('fitness','2층','202','체력단련실'),gameRoom('classes','3층','301','강의실'),...roomSeries(3,[302,303])],
 cafeteria:[gameRoom('dining','1층','101','학식당'),gameRoom('cafe','1층','102','카페'),gameRoom('store','1층','103','편의점'),gameRoom('kitchen','2층','201','조리실습실'),gameRoom('room202','2층','202','조리실습실'),...roomSeries(3,[301,302])],
 creative:[{id:'library',floor:'2층',name:'도서관 출입구',text:'2층 도서관 출입구에서 반납대와 자료실 안내를 확인한다.',provisional:true},gameRoom('art','4층','401','미대 작업실'),...roomSeries(4,[402,403],'미대 강의실'),gameRoom('nursing','5층','503','기본간호 실습실'),gameRoom('room504','5층','504','간호학 강의실'),gameRoom('fashion','6층','601','패션디자인 실습실'),...roomSeries(6,[602,603],'패션디자인 강의실')],
 academic:[gameRoom('store','1층','101','큰 편의점'),...roomSeries(2,[201,202,203],'교양 강의실'),gameRoom('classes','3층','302','교양 강의실'),...roomSeries(3,[301,303],'교양 강의실'),...roomSeries(4,[401,402,403],'교양 강의실')],
 hall:[gameRoom('footballClub','2층','201','축구 동아리실'),gameRoom('clubs','2층','202','봉사단 준비실'),gameRoom('musicClub','2층','203','음악 동아리실'),gameRoom('meeting','2층','204','공용 회의실')],
 sculpture:[gameRoom('store','1층','101','편의점'),gameRoom('facilities','2층','201','공용 학습실'),gameRoom('classes','3층','301','치위생학 강의실'),...roomSeries(3,[302,303],'치위생학 강의실'),...roomSeries(4,[401,402,403],'치위생학 강의실')]
};
export function roomFloorLabel(area){const match=area.floor.match(/^(\d+)층/);return match?match[1]+'층':area.floor;}
export function roomFloorList(building){return [...new Set((building?.areas??[]).map(roomFloorLabel))].sort((a,b)=>(a==='지하'?-1:parseInt(a)||100)-(b==='지하'?-1:parseInt(b)||100));}
