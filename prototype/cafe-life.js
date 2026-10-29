import {advanceFreeTime} from './free-roam.js';
import {everydayRoll} from './everyday-life.js';
import {wetWeather} from './weather.js';
export const cafeMenu=[{id:'americano',name:'아메리카노',price:3000},{id:'latte',name:'카페라테',price:3800},{id:'tea',name:'차',price:3500}];
function requireCafe(s){if(s.location!=='cafe')throw new Error('카페 주문대에서 할 수 있는 행동입니다.');if(s.clock.minute>=1260)throw new Error('오늘 주문은 마감했습니다.');}
function cafeStore(s){s.cafeLife??={orders:[],draft:null,active:null,spent:0,sequence:0};return s.cafeLife;}
export function cafeOrderView(s){const life=s.cafeLife,active=life?.orders.find(o=>o.id===life.active);return {draft:life?.draft??null,active:active??null,menu:cafeMenu,spent:life?.spent??0};}
export function chooseCafeDrink(state,id){requireCafe(state);const drink=cafeMenu.find(d=>d.id===id);if(!drink)throw new Error('메뉴를 다시 확인해 주세요.');if(cafeOrderView(state).active?.status==='ready'&&cafeOrderView(state).active?.day===state.day)throw new Error('먼저 주문한 음료를 받아 주세요.');const s=structuredClone(state);cafeStore(s).draft={drink:id,temperature:null};return s;}
export function setCafeTemperature(state,value){requireCafe(state);if(!['hot','iced'].includes(value)||!state.cafeLife?.draft)throw new Error('음료부터 골라 주세요.');const s=structuredClone(state);s.cafeLife.draft.temperature=value;return s;}
export function payCafeOrder(state){
 requireCafe(state);const draft=state.cafeLife?.draft,drink=cafeMenu.find(d=>d.id===draft?.drink);if(!drink||!draft.temperature)throw new Error('음료와 온도를 골라 주세요.');
 const s=structuredClone(state),life=cafeStore(s),busy=s.clock.minute>=720&&s.clock.minute<840,wait=(busy?8:4)+Math.floor(everydayRoll(s)*4);if(s.clock.minute+wait>1260)throw new Error('주문 마감 전까지 준비가 어렵습니다.');
 const order={id:`cafe-${s.day}-${++life.sequence}`,day:s.day,minute:s.clock.minute,drink:drink.id,name:(draft.temperature==='iced'?'아이스 ':'따뜻한 ')+drink.name,price:drink.price,temperature:draft.temperature,status:'ready',wait};
 order.text=(busy?'앞선 주문이 있어 진동벨을 받고 옆에서 기다렸다.':'결제한 뒤 수령대 옆에서 조금 기다렸다.')+' '+(wetWeather(s)&&draft.temperature==='hot'?'창에 맺힌 빗방울을 보는 동안 컵에서 김이 올라온다.':draft.temperature==='iced'?'얼음 담는 소리 뒤로 주문한 음료의 진동벨이 울린다.':'직원이 잔을 준비해 주문 번호를 부른다.');
 life.orders.push(order);life.active=order.id;life.spent+=order.price;life.draft=null;s.memory.push(`[${s.day}일차] ${order.name}을 ${order.price.toLocaleString()}원에 주문하고 ${wait}분 기다렸다.`);
 const next=advanceFreeTime(s,wait);next.pace={count:0,seen:{}};return next;
}
export function collectCafeOrder(state){if(state.location!=='cafe')throw new Error('카페 수령대로 돌아가 주세요.');const active=cafeOrderView(state).active;if(!active||active.status!=='ready'||active.day!==state.day)throw new Error('받을 음료가 없습니다.');const s=structuredClone(state),order=s.cafeLife.orders.find(o=>o.id===active.id);order.status='collected';s.inventory??=[];s.inventory.push({id:order.id,name:order.name,quantity:1,consumable:true});s.memory.push(`[${s.day}일차] 주문 번호를 확인하고 ${order.name} 한 잔을 받았다.`);return s;}
export function drinkCafeOrder(state){if(state.location!=='cafe')throw new Error('음료를 마실 자리를 먼저 잡아 주세요.');const active=cafeOrderView(state).active,item=state.inventory?.find(i=>i.id===active?.id&&i.quantity>0);if(!active||active.status!=='collected'||!item)throw new Error('받아둔 음료가 없습니다.');const s=structuredClone(state);s.inventory=s.inventory.filter(i=>i.id!==active.id);s.cafeLife.orders.find(o=>o.id===active.id).status='drunk';s.memory.push(`[${s.day}일차] ${active.name}을 마시며 잠깐 쉬었다.`);return s;}
export function cancelCafeDraft(state){const s=structuredClone(state);if(s.cafeLife)s.cafeLife.draft=null;return s;}
