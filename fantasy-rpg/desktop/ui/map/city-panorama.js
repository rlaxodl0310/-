(function(r){
'use strict';
const points={general_store:[39,45],inn:[51,73],eatery:[58,75],equipment_shop:[62,45],smith:[12,50],guard:[89,65],clinic:[79,42],school:[39,17],administration:[71,15],association:[50,26],prayer:[88,42],armory:[23,56],mage_tower:[51,14]};
function render(container,state,id,{artwork=false,imageURL='assets/city-valk.png'}={}){
 container.replaceChildren();if(id!=='west-city-01')return false;
 const place=GameGeography.detail(state,id,{artwork});if(!place||(!place.known&&!artwork))return false;
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const root=make('section'),heading=make('h3','발크 · 도시 내부 지도'),controls=make('div'),viewport=make('div'),scene=make('div'),detail=make('p','서부 공방 지구 · 중앙 시장 지구 · 동부 강변 지구');
 root.className='city-panorama';controls.className='map-toolbar';viewport.className='city-panorama-viewport';scene.className='city-panorama-scene';detail.setAttribute('aria-live','polite');
 const img=make('img');img.src=imageURL;img.alt='산기슭 광산과 대장간, 중앙 시장, 강변 진료소와 경비 구역을 잇는 발크 조감도';img.draggable=false;scene.append(img);
 for(const f of WorldFacilities.list(state,id,{artwork})){const type=f.id.slice((id+'-facility-').length),point=points[type];if(!point)continue;const pin=make('button',f.name.replace(place.name+' · ',''));pin.type='button';pin.className='city-building';pin.dataset.cityFacility=f.id;pin.style.left=point[0]+'%';pin.style.top=point[1]+'%';pin.onclick=()=>{detail.textContent=f.name+' · '+f.note;for(const p of scene.querySelectorAll('button'))p.setAttribute('aria-pressed',String(p===pin));};scene.append(pin);}
 viewport.append(scene);let zoom=1.65;
 for(const [label,fn]of [['← 서쪽',()=>viewport.scrollBy({left:-viewport.clientWidth*.65,behavior:'smooth'})],['동쪽 →',()=>viewport.scrollBy({left:viewport.clientWidth*.65,behavior:'smooth'})],['전체 보기',()=>{zoom=1;scene.style.width='100%';}],['가까이 보기',()=>{zoom=zoom>=2.3?1.65:Math.min(2.3,zoom+.35);scene.style.width=zoom*100+'%';}]]){const btn=make('button',label);btn.type='button';btn.onclick=fn;controls.append(btn);}
 scene.style.width=zoom*100+'%';
 let drag=null;viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,left:viewport.scrollLeft};viewport.setPointerCapture(e.pointerId);});viewport.addEventListener('pointermove',e=>{if(drag)viewport.scrollLeft=drag.left+drag.x-e.clientX;});const end=()=>{drag=null;};viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 root.append(heading,controls,viewport,detail);container.append(root);return true;
}
r.CityPanorama={render};
})(globalThis);
