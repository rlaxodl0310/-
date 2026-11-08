// Authored campus floor plan; occupants and condition are private per-run state.
export const survivalBuildings={arts:'예술동',music:'음악관',gym:'체육관',creative:'창조관',academic:'은혜관',hall:'자유관',sculpture:'조형관',headquarters:'본부동'};
export const survivalRoomCatalog={
 arts401:{name:'예술동 401호',building:'arts',floor:'4층',capacity:4,slots:3,defense:35,cost:2,art:0,note:'문이 하나인 음악 강의실. 넓지는 않지만 출입을 살피기 쉽다.'},
 arts402:{name:'예술동 402호',building:'arts',floor:'4층',capacity:5,slots:3,defense:30,cost:2,art:0,note:'창이 길게 난 전공 강의실. 창가와 복도 양쪽을 살펴야 한다.'},
 arts409:{name:'예술동 409호 합주실',building:'arts',floor:'4층',capacity:6,slots:4,defense:32,cost:3,art:0,note:'방음문이 무겁고 바닥이 넓다. 안쪽 구석을 확인해야 한다.'},
 arts711:{name:'예술동 711호 연습실',building:'arts',floor:'7층',capacity:2,slots:2,defense:42,cost:2,art:0,note:'좁지만 문을 지키기 쉽다. 더 많은 사람을 받기 어렵다.'},
 music201:{name:'음악관 201호 연습실',building:'music',floor:'2층',capacity:4,slots:3,defense:34,cost:2,art:0,note:'중형 연습실. 출입구 앞 복도에 숨을 곳이 많다.'},
 music303:{name:'음악관 303호 연습실',building:'music',floor:'3층',capacity:3,slots:3,defense:38,cost:2,art:0,note:'복도 끝 방음문 안쪽 공간. 수용 인원은 적다.'},
 gymB102:{name:'체육관 지하 B102 합주실',building:'gym',floor:'지하',capacity:6,slots:4,defense:25,cost:3,art:2,note:'장비를 치우면 넓지만 지하 통로를 경계해야 한다.'},
 gym301:{name:'체육관 301호 강의실',building:'gym',floor:'3층',capacity:6,slots:4,defense:28,cost:2,art:1,note:'평평한 강의 공간. 계단으로 이어지는 복도 감시가 필요하다.'},
 library:{name:'창조관 도서관 세미나실',building:'creative',floor:'2층',capacity:6,slots:4,defense:25,cost:2,art:1,note:'생활 공간은 넓지만 복도로 통하는 길을 더 살펴야 한다.'},
 creative403:{name:'창조관 403호 강의실',building:'creative',floor:'4층',capacity:6,slots:4,defense:27,cost:2,art:1,note:'자료를 보관하던 강의실. 공간을 정리하기는 편하다.'},
 academic302:{name:'은혜관 302호 강의실',building:'academic',floor:'3층',capacity:7,slots:4,defense:24,cost:2,art:1,note:'넓은 교양 강의실. 복도를 오가는 접근을 막아야 한다.'},
 academic403:{name:'은혜관 403호 강의실',building:'academic',floor:'4층',capacity:5,slots:3,defense:32,cost:2,art:1,note:'계단에서 한 번 꺾어 들어가는 강의실. 문 앞을 살피기 좋다.'},
 hall204:{name:'자유관 204호 회의실',building:'hall',floor:'2층',capacity:4,slots:3,defense:33,cost:2,art:1,note:'작은 공용 회의실. 인원이 늘면 금방 비좁아진다.'},
 sculpture301:{name:'조형관 301호 강의실',building:'sculpture',floor:'3층',capacity:6,slots:4,defense:28,cost:2,art:1,note:'실습실이 아닌 일반 강의 공간. 여러 복도와 이어진 층이다.'},
 basement:{name:'본부동 지하 B102',building:'headquarters',floor:'지하',capacity:8,slots:5,defense:20,cost:3,art:2,note:'많은 인원을 받을 수 있지만 사각지대가 많고 방어 준비가 필요하다.'},
 headquarters603:{name:'본부동 603호 강의실',building:'headquarters',floor:'6층',capacity:7,slots:4,defense:26,cost:2,art:1,note:'넓은 강의 공간. 높은 층까지 물자를 나르는 수고가 든다.'}
};
function roomSeed(seed,id){let n=seed>>>0;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;}
function generateSurvivalRoom(seed,id){let n=roomSeed(seed,id);const roll=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const occupancy=roll();return {occupants:occupancy<.4?0:occupancy<.85?2:3,integrity:[65,80,90][Math.floor(roll()*3)],exposure:[0,6,12][Math.floor(roll()*3)],checkedDay:null,confirmed:false};}
export function createSurvivalExploration(seed){return {version:1,seed:seed>>>0,here:null,rooms:Object.fromEntries(Object.keys(survivalRoomCatalog).map(id=>[id,generateSurvivalRoom(seed,id)]))};}
export function ensureSurvivalExploration(run){
 if(run.exploration)return run.exploration;
 const world=createSurvivalExploration(run.story?.seed??726139);
 // Old observations keep the meaning they had when saved; never invent new danger.
 for(const id of Object.keys(run.scouted??{}))if(run.scouted[id]&&world.rooms[id])Object.assign(world.rooms[id],{occupants:run.secured?.[id]?0:2,integrity:80,exposure:0,checkedDay:run.day,confirmed:!!run.secured?.[id]});
 if(run.base&&world.rooms[run.base.site])Object.assign(world.rooms[run.base.site],{occupants:0,integrity:run.base.integrity,exposure:run.base.exposure??0,checkedDay:run.day,confirmed:true});
 run.exploration=world;return world;
}
export function survivalSiteObservation(run,id){
 if(!survivalRoomCatalog[id]||!run?.scouted?.[id])return null;
 const saved=run.exploration?.rooms?.[id];return saved?{...saved}:{occupants:run.secured?.[id]?0:2,integrity:80,exposure:0,checkedDay:run.day,confirmed:!!run.secured?.[id]};
}
export function inspectSurvivalRoom(run,id){
 const world=ensureSurvivalExploration(run),room=world.rooms[id];if(!room)throw new Error('지도에 없는 공간입니다.');
 world.here=id;room.checkedDay=run.day;run.scouted[id]=true;
 if(room.occupants===0){room.confirmed=true;run.secured[id]=true;}return room;
}
export function recordSurvivalClearance(run,id,battle,won){
 const world=ensureSurvivalExploration(run),room=world.rooms[id];if(!room)return;world.here=id;
 room.occupants=battle.enemies.filter(e=>e.balance>0).length;room.reinforced=!!battle.reinforced;room.checkedDay=run.day;
 if(won){room.occupants=0;room.confirmed=true;run.secured[id]=true;}
 else{room.confirmed=false;delete run.secured[id];}
}
