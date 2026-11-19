(function(r){
'use strict';
const districts=[{name:'중앙 시장',row:0,points:{general_store:[13,49],association:[53,41],equipment_shop:[88,48]}},{name:'서부 공방 골목',row:1,points:{smith:[20,56],armory:[83,48]}},{name:'동부 강변',row:2,points:{clinic:[17,50],prayer:[84,43]}}];
function render(container,state,id,{artwork=false,imageURL='assets/city-valk-districts.png'}={}){
 container.replaceChildren();if(id!=='west-city-01')return false;
 const place=GameGeography.detail(state,id,{artwork});if(!place||(!place.known&&!artwork))return false;
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;},root=make('section'),heading=make('h3'),scene=make('div'),detail=make('p','건물을 선택하면 역할을 확인합니다.'),controls=make('div');
 root.className='city-district';scene.className='city-district-scene';controls.className='map-toolbar';detail.setAttribute('aria-live','polite');let current=0;
 const facilities=WorldFacilities.list(state,id,{artwork});
 const show=i=>{current=i;const district=districts[i];heading.textContent='발크 · '+district.name;scene.replaceChildren();scene.style.backgroundImage='url("'+imageURL+'")';scene.style.backgroundPosition='center '+(district.row*50)+'%';scene.setAttribute('role','group');scene.setAttribute('aria-label',district.name+' 거리와 건물');detail.textContent='건물을 선택하면 역할을 확인합니다.';
 for(const [type,xy]of Object.entries(district.points)){const f=facilities.find(f=>f.id===id+'-facility-'+type);if(!f)continue;const pin=make('button',f.name.replace(place.name+' · ',''));pin.type='button';pin.className='city-district-building';pin.dataset.cityFacility=f.id;pin.style.left=xy[0]+'%';pin.style.top=xy[1]+'%';pin.onclick=()=>{detail.textContent=f.name+' · '+f.note;};scene.append(pin);}
 const destinations=i===0?[[1,'← 공방 골목'],[2,'강변 →']]:[[0,i===1?'시장으로 →':'← 시장으로']];for(const [dest,label]of destinations){const arrow=make('button',label);arrow.type='button';arrow.className='city-exit';arrow.dataset.destination=String(dest);arrow.style[dest===1||i===2?'left':'right']='2%';arrow.onclick=()=>show(dest);scene.append(arrow);}
 for(const b of controls.children)b.setAttribute('aria-pressed',String(Number(b.dataset.district)===i));
 };
 districts.forEach((d,i)=>{const b=make('button',d.name);b.type='button';b.dataset.district=String(i);b.onclick=()=>show(i);controls.append(b);});
 root.append(heading,controls,scene,detail);container.append(root);show(current);return true;
}
r.CityPanorama={render};
})(globalThis);
