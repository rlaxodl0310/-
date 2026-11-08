import {survivalSites,survivalFacilities} from './survival-base.js';
// Presentation anchors match the room illustration. Saved facilities own visibility.
const shelterArtRooms={arts401:0,library:1,basement:2};
const shelterArtProps={
 barricade:{tile:0,x:24,y:65,width:28,depth:1},
 beds:{tile:1,x:28,y:93,width:34,depth:3},
 clinic:{tile:2,x:77,y:70,width:22,depth:2},
 workshop:{tile:3,x:73,y:97,width:27,depth:4}
};
export function shelterSceneView(run){
 if(!run?.base)return null;
 const base=run.base,site=survivalSites[base.site];if(!site)return null;
 return {name:site.name,room:site.art??shelterArtRooms[base.site]??0,integrity:base.integrity,used:base.facilities.length,capacity:site.slots,props:base.facilities.filter(id=>shelterArtProps[id]).map(id=>({id,...shelterArtProps[id],...survivalFacilities[id]}))};
}
export function renderShelterScene(run,selected='',compact=false){
 const view=shelterSceneView(run);if(!view)return '';
 const chosen=view.props.find(p=>p.id===selected);
 return `<section class="shelter-scene-card ${compact?'scene-compact':''}"><header><div><small>우리의 거점</small><h2>${view.name}</h2></div><span>시설 ${view.used}/${view.capacity} · 문 상태 ${view.integrity}/100</span></header><div class="shelter-scene" data-room="${run.base.site}" role="group" aria-label="${view.name} 거점 내부"><div class="shelter-room-art" style="--room-x:${view.room%2*100}%;--room-y:${Math.floor(view.room/2)*100}%" role="img" aria-label="${view.name} 빈 공간 배경"></div>${view.props.map(p=>`<button class="shelter-prop ${selected===p.id?'prop-selected':''}" data-facility="${p.id}" data-action="survivalInspect" data-value="${p.id}" style="--prop-x:${p.x}%;--prop-y:${p.y}%;--prop-width:${p.width}%;--prop-depth:${p.depth};--prop-tile-x:${p.tile%2*100}%;--prop-tile-y:${Math.floor(p.tile/2)*100}%" aria-label="설치된 ${p.name} · ${p.effect}" title="${p.name} · ${p.effect}"><span class="shelter-prop-art" role="img" aria-label="${p.name} 시설 그림"></span><span class="shelter-prop-label">${p.name}</span></button>`).join('')}${!view.props.length?'<p class="shelter-empty-room">아직 비어 있는 공간<br><small>시설을 설치하면 이곳에 나타나요.</small></p>':''}</div><footer aria-live="polite">${chosen?`<strong>${chosen.name}</strong><span>${chosen.effect}</span>`:'<span>설치한 시설을 누르면 기능을 확인할 수 있어요.</span>'}</footer></section>`;
}
