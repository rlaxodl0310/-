import {characterAge} from './character-profiles.js';
import {contact,displayName} from './identity.js';
import {presentPeople} from './days.js';
import {personalEventPosition} from './personal-event-presence.js';
import {characterPresent,characterAbilities} from './character-stats.js';
import {relationship} from './dialogue.js';
import {chaewonLocation} from './chaewon-events.js';
import {iseoEventLocation} from './personal-events.js';
import {dogyeomLocation} from './dogyeom-events.js';
import {advanceFreeTime} from './free-roam.js';
// Canonical stature is presentation data, separate from abilities and saved appearance rolls.
export const characterHeightProfiles={
 nursingStudent:{name:'백지안',cm:null},
 taei:{name:'김태이',cm:179},seoha:{name:'윤서하',cm:167},doyun:{name:'박도윤',cm:182},nakyeong:{name:'최나경',cm:161},haerin:{name:'문해린',cm:163},subin:{name:'오수빈',cm:172},
 yeogyeong:{name:'차여경',cm:162},seoyeon:{name:'한서연',cm:160},soyul:{name:'박소율',cm:165},iseo:{name:'정이서',cm:158},chaewon:{name:'유채원',cm:164},
 dogyeom:{name:'윤도겸',cm:183,proposed:true},jihoo:{name:'서지후',cm:176,proposed:true},naeun:{name:'이나은',cm:163,proposed:true},dohyun:{name:'권도현',cm:181,proposed:true},dayeon:{name:'강다연',cm:165,proposed:true},chaerin:{name:'오채린',cm:161,proposed:true},junseo:{name:'신준서',cm:173,proposed:true}
};
export function characterHeightCm(id){const p=characterHeightProfiles[id];return p&&!p.proposed?p.cm:null;}
export function characterHeightScale(id){return (characterHeightCm(id)??183)/183;}
export function knownCharacterHeight(s,id){return id==='taei'?characterHeightCm(id):contact(s,id).introduced?(s.contacts?.[id]?.details?.heightCm??null):null;}
export function canAskCharacterHeight(s,id){
 if(!characterHeightCm(id)||id==='taei'||knownCharacterHeight(s,id)||!contact(s,id).introduced||!characterPresent(s,id)||(s.world?.stage??'campus')!=='campus'||s.academics?.registrationPending)return false;
 const r=relationship(s,id);if(r.familiarity<3||r.trust<2||r.tension>=3)return false;
 const here=personalEventPosition(s,id)??(id==='chaewon'?chaewonLocation(s):id==='iseo'?iseoEventLocation(s):id==='dogyeom'?dogyeomLocation(s):null);
 if(here!==s.location&&!presentPeople(s,s.location).includes(id))return false;
 if((s.appointments??[]).some(a=>a.status==='pending'&&a.day===s.day&&a.minute>=s.clock.minute&&a.minute<s.clock.minute+2))return false;
 return s.clock.minute+2<=1320;
}
export function askCharacterHeight(state,id){
 if(!canAskCharacterHeight(state,id))throw new Error('지금 같은 장소에서 편하게 물어볼 수 있는지 확인해 주세요.');
 const s=advanceFreeTime(state,2),height=characterHeightCm(id);s.contacts[id].details={...s.contacts[id].details,heightCm:height};s.contacts[id].heightSource={kind:'direct-conversation',day:s.day,minute:s.clock.minute,location:s.location};
 const text=`${displayName(s,id)}: “저 ${height}cm예요.”`;s.memory.push(`[${s.day}일차] 키를 물어보자 ${text}`);return {state:s,text};
}
export function characterHeightCatalog(){return `<section class="height-catalog" aria-label="캐릭터 키 설정"><h2>캐릭터 기본 설정</h2><p>이름·키·나이·기본 스탯 설정이에요. 스탯은 힘 / 민첩 / 체력 / 인내 / 정신력 순서예요. 실제 진행에서 알아낸 정보와는 별개예요.</p><div class="height-roster">${Object.entries(characterHeightProfiles).map(([id,p])=>`<div data-height-character="${id}"><strong>${p.name}</strong><span>${p.cm===null?'키 미정':p.cm+'cm'}${p.proposed?' · 제안':''}</span><span class="profile-age">${characterAge(id)}살</span><span class="profile-base-stats" aria-label="힘 민첩 체력 인내 정신력">${Object.values(characterAbilities(id)).join(' / ')}</span></div>`).join('')}</div></section>`;}
