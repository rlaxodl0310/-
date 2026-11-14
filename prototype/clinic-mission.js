// Saved, authored encounter; no new real-world campus location is asserted.
export const clinicMap={width:12,height:8,exit:[[11,3],[11,4]],door:[[10,3],[10,4]],obstacles:[[2,1,'진료 침상'],[3,1,'진료 침상'],[2,2,'진료 침상'],[5,2,'약품장'],[5,3,'약품장'],[5,5,'칸막이'],[7,5,'진료 침상'],[8,5,'진료 침상'],[8,1,'보관장'],[11,1,'벽'],[11,2,'벽'],[11,5,'벽'],[11,6,'벽']]};
export const clinicBriefing={title:'보건실에 남은 사람',lines:['태이: “붕대와 구급 파우치를 찾아보자. 가방에 다 넣지 못하면 필요한 것부터 골라야 해.”','동료: “약품장 뒤에서 사람이 부르는 소리가 나. 먼저 가서 상태를 확인하자.”','태이: “물자함을 확인하고 출구로 돌아오자. 학생을 데려오려면 거점에 쉴 자리도 있어야 해.”'],note:'물자함 확인 후 두 사람 모두 탈출하면 완료. 동행을 도운 학생은 일행을 따라 이동하며, 함께 탈출할 때 구조가 확정돼요. 학생 구조는 선택이며 여유 자리 1개가 필요해요.'};
export function prepareClinicBattle(b,canRescue){
 b.map=structuredClone(clinicMap);b.door=0;b.clinic={student:{id:'student',x:7,y:2},rescued:false,canRescue};
 b.supplyCache={id:'supply',x:6,y:1,recovered:false};
 b.enemies=[{id:1,x:8,y:3,balance:2,stun:0},{id:2,x:9,y:6,balance:2,stun:0}];
 b.log=['약품장과 침상 사이로 길이 나 있다. 물자함 옆에서 회수하고, 학생 옆에서 동행을 도울 수 있다.'];
}
export function canRescueClinicStudent(b,a){return !!b?.clinic&&!b.clinic.rescued&&b.clinic.canRescue&&a&&!a.down&&!a.escaped&&a.ap>0&&a.stamina>=8&&Math.abs(a.x-b.clinic.student.x)+Math.abs(a.y-b.clinic.student.y)===1;}
export function clinicAftermath(b,won,allyName){
 if(!won)return `${allyName}: “오늘은 더 들어갈 수 없었어. 챙겨 온 물건부터 확인하고, 상처를 돌보자.” 보건실 원정은 미완료로 기록했다.`;
 if(b.clinic.rescued)return `${allyName}: “물건만 들고 나오는 줄 알았는데, 같이 돌아올 사람이 한 명 늘었네.” 구조한 학생을 쉬게 하고 치료할 자리를 마련했다.`;
 return `${allyName}: “약품장은 확인했어. 그 학생은 아직 거기 있어. 다음에 갈 땐 쉴 자리를 마련하고 가자.” 보건실에 남은 학생의 위치를 기록했다.`;
}
