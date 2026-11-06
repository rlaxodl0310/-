import {advanceFreeTime} from './free-roam.js';
import {moneyBalance,debitMoney} from './wallet.js';
export const shopGoods={
 water:{name:'생수',price:1000,kind:'item'},rice:{name:'삼각김밥',price:1500,kind:'item'},bar:{name:'시리얼바',price:1800,kind:'item'},tissue:{name:'휴대용 물티슈',price:1200,kind:'item'},
 noodles:{name:'잔치국수',price:6000,kind:'meal',minutes:25},ricebowl:{name:'제육덮밥',price:7500,kind:'meal',minutes:30},set:{name:'백반 정식',price:8000,kind:'meal',minutes:35},
 soda:{name:'탄산음료와 간단한 안주',price:6000,kind:'pub',minutes:30},beer:{name:'생맥주 한 잔과 안주',price:10000,kind:'alcohol',minutes:40}
};
export const shopPlaces={market:{name:'대학가 편의점',open:540,close:1320,items:['water','rice','bar','tissue']},restaurant:{name:'대학가 작은 밥집',open:660,close:1260,items:['noodles','ricebowl','set']},pub:{name:'대학가 골목 술집',open:1080,close:1320,items:['soda','beer']}};
export function localShop(s){if(shopPlaces[s.location])return s.location;const a=s.buildingArea;if(a?.place===s.location&&a.id==='store')return 'campus';return null;}
export function shopView(s){const id=localShop(s),shop=id==='campus'?{name:'교내 편의점 · 매점',open:540,close:1140,items:['water','rice','bar','tissue']}:shopPlaces[id];if(!shop)return null;const minute=s.clock.minute;return {id,...shop,available:minute>=shop.open&&minute<shop.close,balance:moneyBalance(s)};}
export function stockLeft(s,id){return Math.max(0,5-(s.shopping?.stock?.[`${s.day}:${localShop(s)}:${id}`]??0));}
export function chooseShopItem(state,id){const v=shopView(state),g=shopGoods[id];if(!v?.available||!v.items.includes(id)||!g)throw new Error('지금 이 매장에서 고를 수 없는 메뉴입니다.');if(g.kind==='item'&&!stockLeft(state,id))throw new Error('오늘 준비된 상품이 품절됐습니다.');const s=structuredClone(state);s.shopping??={stock:{},draft:null,sequence:0,history:[]};s.shopping.draft={shop:v.id,item:id};return s;}
export function payShopItem(state){
 const v=shopView(state),draft=state.shopping?.draft,g=shopGoods[draft?.item];if(!draft||!v?.available||draft.shop!==v.id||!v.items.includes(draft.item))throw new Error('구매 장소와 주문을 다시 확인해 주세요.');
 if(g.kind==='item'&&!stockLeft(state,draft.item))throw new Error('품절된 상품입니다.');
 if(g.kind==='alcohol'&&state.shopping.history.some(x=>x.day===state.day&&x.kind==='alcohol'))throw new Error('오늘 술 주문은 마쳤습니다. 다른 메뉴를 고를 수 있어요.');
 const minutes=g.minutes??5;if(state.clock.minute+minutes>Math.min(v.close,1320))throw new Error('마감 전에 이용을 마칠 시간이 부족합니다.');
 let s=structuredClone(state);debitMoney(s,g.price,g.name);const life=s.shopping,id=`shop-${s.day}-${++life.sequence}`;life.draft=null;life.stock??={};life.history??=[];
 if(g.kind==='item'){const key=`${s.day}:${v.id}:${draft.item}`;life.stock[key]=(life.stock[key]??0)+1;s.inventory??=[];const existing=s.inventory.find(x=>x.shopGood===draft.item);if(existing)existing.quantity++;else s.inventory.push({id,shopGood:draft.item,name:g.name,quantity:1,consumable:['water','rice','bar'].includes(draft.item)});}
 life.history.push({id,day:s.day,item:draft.item,kind:g.kind,price:g.price,minutes});
 s.memory.push(`[${s.day}일차] ${v.name}에서 ${g.name} ${g.price.toLocaleString()}원 ${g.kind==='item'?'구매':'결제 후 이용'} · ${minutes}분.`);
 s=advanceFreeTime(s,minutes);s.pace={count:0,seen:{}};return s;
}
export function consumeShopItem(state,id){const item=state.inventory?.find(x=>x.id===id&&x.shopGood&&x.consumable&&x.quantity>0);if(!item)throw new Error('사용할 수 있는 소지품이 없습니다.');let s=advanceFreeTime(state,5);const found=s.inventory.find(x=>x.id===id);found.quantity--;s.inventory=s.inventory.filter(x=>x.quantity>0);s.memory.push(`[${s.day}일차] ${item.name}을 ${item.shopGood==='water'?'마셨다':'먹었다'}.`);s.pace={count:0,seen:{}};return s;}
export function cancelShopDraft(state){const s=structuredClone(state);if(s.shopping)s.shopping.draft=null;return s;}
