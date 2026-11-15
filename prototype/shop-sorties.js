// Authored survival encounters; these layouts do not assert real campus facilities.
export const shopSorties={
 kiosk:{name:'교내 매점',title:'매점에 남은 비상식량',description:'좁은 매점에서 식량과 생수를 챙긴다. 안쪽 보관함은 선택이다.',noise:0,stock:{food:3,water:3,energybar:4},reserve:{canned:2,water:2},obstacles:[[2,1,'계산대'],[3,1,'계산대'],[2,2,'계산대'],[5,2,'식품 진열대'],[5,3,'식품 진열대'],[5,5,'진열대'],[7,5,'음료 상자'],[8,5,'음료 상자'],[8,1,'보관장']],lines:['태이: “오늘 먹을 것과 물부터 확인하자. 가방에 다 들어가지는 않을 거야.”','동료: “안쪽 보관함까지 보면 더 챙길 수 있겠지만, 여는 소리가 날 것 같아.”']},
 convenience:{name:'편의점',title:'불 꺼진 편의점',description:'음료와 통조림이 남아 있지만 계산대 너머에서 감염체가 움직인다. 안쪽 보관함을 열면 추가 적이 접근한다.',noise:2,stock:{food:4,water:5,canned:3,energybar:4},reserve:{canned:3,water:3,energybar:4},obstacles:[[2,1,'계산대'],[3,1,'계산대'],[2,2,'계산대'],[5,2,'식품 진열대'],[5,3,'식품 진열대'],[5,5,'냉장 진열대'],[7,5,'냉장 진열대'],[8,5,'냉장 진열대'],[8,1,'보관장'],[7,3,'진열대']],lines:['태이: “물과 통조림이 남아 있어. 필요한 만큼만 담고 출구로 돌아오자.”','동료: “이미 안에서 소리가 나. 보관함까지 열면 뒤쪽에서도 몰려올 수 있어.”']}
};
export function prepareShopBattle(b,kind){
 const def=shopSorties[kind];if(!def)throw new Error('보급 장소를 확인하세요.');
 b.map={width:12,height:8,exit:[[11,3],[11,4]],door:[[10,3],[10,4]],obstacles:[...structuredClone(def.obstacles),[11,1,'벽'],[11,2,'벽'],[11,5,'벽'],[11,6,'벽']]};
 b.shop={kind,stock:structuredClone(def.stock),reserve:structuredClone(def.reserve),extra:{x:9,y:1,recovered:false}};b.supplyCache={id:'supply',x:6,y:1,recovered:false};b.noise=def.noise;
 b.enemies=[{id:1,x:8,y:3,balance:2,stun:0},{id:2,x:9,y:6,balance:2,stun:0}];if(kind==='convenience')b.enemies.push({id:3,x:7,y:6,balance:2,stun:0});
 b.survivalContext={kind,title:def.title,location:def.name};b.log=[def.description+' 식품 진열대를 확인한 뒤 두 사람 모두 출구로 이동하자.'];
}
export function canOpenShopReserve(b,a){const c=b?.shop?.extra;return !!c&&!c.recovered&&a&&!a.down&&!a.escaped&&a.ap>0&&Math.abs(a.x-c.x)+Math.abs(a.y-c.y)<=1&&!b.survivalPack?.pending;}
export function openShopReserve(b,a){
 if(!canOpenShopReserve(b,a))throw new Error('안쪽 보관함 옆에서 행동력 1이 필요해요. 먼저 발견 물자를 정리하세요.');
 const p=b.survivalPack;if(!p)throw new Error('원정 가방이 필요해요.');a.ap--;b.noise+=4;b.shop.extra.recovered=true;p.pending={id:++p.sequence,source:shopSorties[b.shop.kind].name+' 안쪽 보관함',position:{x:b.shop.extra.x,y:b.shop.extra.y},items:structuredClone(b.shop.reserve),bags:[]};
}
export function shopAftermath(b,won,name){const place=shopSorties[b.shop.kind].name;return !won?`${name}: “더 욕심내지 말고 돌아오길 잘했어. 챙긴 물자부터 확인하자.” ${place} 원정은 미완료로 기록했다.`:b.shop.extra.recovered?`${name}: “안쪽 물자까지 확인했어. 다음 배급을 준비하자.” ${place}에서 가방에 챙긴 물자와 함께 복귀했다.`:`${name}: “안쪽 보관함은 남겨두고 나왔어. 오늘 가져온 것부터 나누자.” ${place} 보급 원정을 마쳤다.`;}
