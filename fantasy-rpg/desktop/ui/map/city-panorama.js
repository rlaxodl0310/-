(function(r){
'use strict';
const catalog=globalThis.CityDistrictData||[];
function render(container,state,id,{artwork=false,imageURL=null,onFacility=null}={}){
 container.replaceChildren();const city=catalog.find(c=>c.id===id);if(!city)return false;const districts=city.districts;imageURL=imageURL||city.asset;
 const place=GameGeography.detail(state,id,{artwork});if(!place||(!place.known&&!artwork))return false;
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;},root=make('section'),heading=make('h3'),scene=make('div'),detail=make('p','시설을 선택하면 역할을 확인합니다.'),controls=make('div'),facilityList=make('div');
 facilityList.className='city-district-facilities';root.className='city-district';scene.className='city-district-scene';controls.className='map-toolbar';detail.setAttribute('aria-live','polite');let current=0;
 const facilities=WorldFacilities.list(state,id,{artwork});
 const continent=GameGeography.continent?.(city.continent);const provenance=make('p',(continent?continent.direction+' '+continent.name+' · ':'')+city.location);provenance.className='city-district-location';
 const show=i=>{current=i;const district=districts[i];heading.textContent=city.name+' · '+district.name;scene.replaceChildren();scene.style.backgroundImage='url("'+imageURL+'")';scene.style.backgroundPosition='center '+(district.row*50)+'%';scene.setAttribute('role','group');scene.setAttribute('aria-label',district.name+' 거리와 건물');detail.textContent='시설을 선택하면 역할을 확인합니다.';facilityList.replaceChildren();const caption=make('span',city.name+' | '+district.name);caption.className='city-district-caption';scene.append(caption);
 for(const type of district.facilities){const f=facilities.find(f=>f.id===id+'-facility-'+type);if(!f)continue;const btn=make('button',f.name.replace(place.name+' · ',''));btn.type='button';btn.dataset.cityFacility=f.id;btn.onclick=()=>{detail.textContent=f.name+' · '+f.note;if(onFacility)onFacility(f);};facilityList.append(btn);}
 const destinations=i===0?[[1,'← '+districts[1].name],[2,districts[2].name+' →']]:[[0,i===1?districts[0].name+' →':'← '+districts[0].name]];for(const [dest,label]of destinations){const arrow=make('button',label);arrow.type='button';arrow.className='city-exit';arrow.dataset.destination=String(dest);arrow.style[dest===1||i===2?'left':'right']='2%';arrow.onclick=()=>show(dest);scene.append(arrow);}
 for(const b of controls.children)b.setAttribute('aria-pressed',String(Number(b.dataset.district)===i));
 };
 districts.forEach((d,i)=>{const b=make('button',d.name);b.type='button';b.dataset.district=String(i);b.onclick=()=>show(i);controls.append(b);});
 root.append(heading,provenance,controls,scene,facilityList,detail);container.append(root);show(current);return true;
}
r.CityPanorama={render};
})(globalThis);
