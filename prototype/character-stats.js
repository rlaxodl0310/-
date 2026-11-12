// Base abilities are separate from current hunger, thirst, fear, injury and trust.
export const abilityNames={strength:'힘',agility:'민첩',vitality:'체력',endurance:'인내',mentality:'정신력'};
export const abilityDescriptions={strength:'밀기·버티기·타격 등 신체의 힘',agility:'짧은 이동·방향 전환·몸의 협응',vitality:'같은 활동을 지속할 수 있는 신체 여력',endurance:'허기·갈증의 부담 누적과 공포 상황을 견디는 정도',mentality:'부상·허기·갈증·공포가 행동에 주는 페널티 완화'};
const abilityProfiles={
 taei:[7,9,8,6,7],seoha:[4,4,5,5,5],doyun:[6,5,6,5,5],nakyeong:[2,3,4,4,5],haerin:[2,3,3,4,5],subin:[5,6,6,5,5],
 yeogyeong:[2,3,4,4,4],seoyeon:[2,3,3,4,5],soyul:[2,3,3,3,4],iseo:[5,7,7,5,5],dogyeom:[6,5,6,5,4],
 jihoo:[3,4,4,3,3],naeun:[2,3,3,4,4],dohyun:[5,4,5,4,4],dayeon:[2,3,4,4,4],chaerin:[2,4,4,3,3],junseo:[3,3,3,3,4]
};
export const characterAbilityIds=Object.keys(abilityProfiles);
const neutralAbilities={strength:4,agility:4,vitality:4,endurance:4,mentality:4};
export function normalizeAbilities(value={}){return Object.fromEntries(Object.keys(abilityNames).map(k=>[k,Number.isFinite(value[k])?Math.max(1,Math.min(10,Math.round(value[k]))):4]));}
export function characterAbilities(id){return abilityProfiles[id]?Object.fromEntries(Object.keys(abilityNames).map((k,i)=>[k,abilityProfiles[id][i]])):{...neutralAbilities};}
export function savedCharacterAbilities(state,id){return normalizeAbilities(state.characterSystem?.profiles?.[id]??characterAbilities(id));}
export function entityAbilities(entity){return normalizeAbilities(entity?.attributes??neutralAbilities);}
export function rarityForAbilities(stats){const score=Object.values(normalizeAbilities(stats)).reduce((a,b)=>a+b,0);const tier=score>=35?4:score>=30?3:score>=25?2:score>=20?1:0;return {score,tier,label:['보통','드문 편','희귀','매우 희귀','극히 희귀'][tier],probability:[.95,.8,.6,.4,.2][tier]};}
export function abilityPenaltyFactors(entity){const a=entityAbilities(entity);return {endurance:Math.max(.64,Math.min(1.18,1-(a.endurance-4)*.06)),mentality:Math.max(.58,Math.min(1.21,1-(a.mentality-4)*.07)),effort:Math.max(.7,Math.min(1.15,1-(a.vitality-4)*.05))};}
export function attributeEffortCost(entity,base){return Math.max(1,Math.round(base*abilityPenaltyFactors(entity).effort));}
export function attributeMoveRange(entity){const a=entityAbilities(entity);return a.agility>=7?4:a.agility<=2?2:3;}
export function attributeAttackChance(entity){const a=entityAbilities(entity),f=abilityPenaltyFactors(entity);return Math.max(.25,Math.min(.97,.92+(a.strength-4)*.015+(a.agility-4)*.01-((entity.fear??0)/300+(entity.wounds??0)*.05)*f.mentality));}
export function attributeFearLoad(entity){return (entity.fear??0)*abilityPenaltyFactors(entity).endurance;}
// Counter-based deterministic rolls: rendering never consumes a random stream.
function abilityAppearanceRoll(seed,id){let h=seed>>>0;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return ((h^(h>>>16))>>>0)/4294967296;}
export function initializeCharacterSystem(state,{seed=state.campusVariation?.seed??417193,protagonist='taei'}={}){
 if(state.characterSystem)return state;
 const profiles=Object.fromEntries(characterAbilityIds.map(id=>[id,characterAbilities(id)]));
 state.characterSystem={version:1,seed:seed>>>0,protagonist,profiles,presence:Object.fromEntries(characterAbilityIds.map(id=>[id,id===protagonist||abilityAppearanceRoll(seed,id)<rarityForAbilities(profiles[id]).probability]))};return state;
}
export function characterPresent(state,id){
 if(!id||id==='taei'||id===state.characterSystem?.protagonist)return true;
 // Established contacts/events survive old-save migration and retained relationships.
 if(state.contacts?.[id]?.seen||state.contacts?.[id]?.introduced)return true;
 return state.characterSystem?.presence?.[id]!==false;
}
export function enabledAttributes(state,id){return state.characterSystem?{attributes:savedCharacterAbilities(state,id)}:{};}
