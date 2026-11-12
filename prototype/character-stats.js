// Base abilities are separate from current hunger, thirst, fear, injury and trust.
export const abilityNames={strength:'힘',agility:'민첩',vitality:'체력',endurance:'인내',mentality:'정신력'};
export const abilityDescriptions={strength:'밀기·버티기·타격 등 신체의 힘',agility:'짧은 이동·방향 전환·몸의 협응',vitality:'같은 활동을 지속할 수 있는 신체 여력',endurance:'허기·갈증의 부담 누적과 공포 상황을 견디는 정도',mentality:'부상·허기·갈증·공포가 행동에 주는 페널티 완화'};
const abilityProfiles={
 taei:[7,9,8,6,7],seoha:[4,4,5,5,5],doyun:[6,5,6,5,5],nakyeong:[2,3,4,4,5],haerin:[2,3,3,4,5],subin:[5,6,6,5,5],
 yeogyeong:[2,3,4,4,4],seoyeon:[2,3,3,4,5],soyul:[2,3,3,3,4],iseo:[5,7,7,5,5],dogyeom:[6,5,6,5,4],
 jihoo:[3,4,4,3,3],naeun:[2,3,3,4,4],dohyun:[5,4,5,4,4],dayeon:[2,3,4,4,4],chaerin:[2,4,4,3,3],junseo:[3,3,3,3,4]
};
export const characterAbilityIds=Object.keys(abilityProfiles);
export const abilityMaximums={strength:20,agility:20,vitality:50,endurance:50,mentality:50};
const potentialProfiles={taei:[18,20,46,38,42],seoha:[12,13,36,38,40],doyun:[16,14,42,35,34],nakyeong:[9,12,32,36,38],haerin:[8,11,28,34,42],subin:[15,18,44,40,38],yeogyeong:[10,12,34,38,36],seoyeon:[8,12,30,38,42],soyul:[9,13,32,32,36],iseo:[15,19,46,38,38],dogyeom:[18,15,44,38,34],jihoo:[11,14,34,30,32],naeun:[8,12,30,36,38],dohyun:[17,14,42,36,34],dayeon:[9,13,34,36,38],chaerin:[10,16,36,32,32],junseo:[11,12,30,34,38]};
const neutralAbilities={strength:4,agility:4,vitality:4,endurance:4,mentality:4};
export function normalizeAbilities(value={}){return Object.fromEntries(Object.keys(abilityNames).map(k=>[k,Number.isFinite(value[k])?Math.max(1,Math.min(abilityMaximums[k],Math.round(value[k]))):4]));}
export function characterAbilities(id){return abilityProfiles[id]?Object.fromEntries(Object.keys(abilityNames).map((k,i)=>[k,abilityProfiles[id][i]])):{...neutralAbilities};}
export function savedCharacterAbilities(state,id){return normalizeAbilities(state.characterSystem?.profiles?.[id]??characterAbilities(id));}
export function entityAbilities(entity){return normalizeAbilities(entity?.attributes??neutralAbilities);}
export function rarityForAbilities(stats){const score=Object.values(normalizeAbilities(stats)).reduce((a,b)=>a+b,0);const tier=score>=35?4:score>=30?3:score>=25?2:score>=20?1:0;return {score,tier,label:['보통','드문 편','희귀','매우 희귀','극히 희귀'][tier],probability:[.95,.8,.6,.4,.2][tier]};}
export function abilityPenaltyFactors(entity){const a=entityAbilities(entity);return {endurance:Math.max(.4,Math.min(1.18,1-(Math.min(10,a.endurance)-4)*.06-Math.max(0,a.endurance-10)*.006)),mentality:Math.max(.38,Math.min(1.21,1-(Math.min(10,a.mentality)-4)*.07-Math.max(0,a.mentality-10)*.005)),effort:Math.max(.5,Math.min(1.15,1-(Math.min(10,a.vitality)-4)*.05-Math.max(0,a.vitality-10)*.005))};}
export function attributeEffortCost(entity,base){return Math.max(1,Math.round(base*abilityPenaltyFactors(entity).effort));}
export function attributeMoveRange(entity){const a=entityAbilities(entity);return a.agility>=7?4:a.agility<=2?2:3;}
export function attributeAttackChance(entity){const a=entityAbilities(entity),f=abilityPenaltyFactors(entity);return Math.max(.25,Math.min(.97,.92+(a.strength-4)*.015+(a.agility-4)*.01-((entity.fear??0)/300+(entity.wounds??0)*.05)*f.mentality));}
export function attributeFearLoad(entity){return (entity.fear??0)*abilityPenaltyFactors(entity).endurance;}
// Counter-based deterministic rolls: rendering never consumes a random stream.
function abilityAppearanceRoll(seed,id){let h=seed>>>0;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return ((h^(h>>>16))>>>0)/4294967296;}
export function initializeCharacterSystem(state,{seed=state.campusVariation?.seed??417193,protagonist='taei'}={}){
 if(state.characterSystem)return state;
 const profiles=Object.fromEntries(characterAbilityIds.map(id=>[id,characterAbilities(id)]));
 state.characterSystem={version:2,seed:seed>>>0,protagonist,profiles,initialProfiles:structuredClone(profiles),potentials:Object.fromEntries(characterAbilityIds.map(id=>[id,characterPotential(id)])),practice:{},presence:Object.fromEntries(characterAbilityIds.map(id=>[id,id===protagonist||abilityAppearanceRoll(seed,id)<rarityForAbilities(profiles[id]).probability]))};return state;
}
export function characterPresent(state,id){
 if(!id||id==='taei'||id===state.characterSystem?.protagonist)return true;
 // Established contacts/events survive old-save migration and retained relationships.
 if(state.contacts?.[id]?.seen||state.contacts?.[id]?.introduced)return true;
 return state.characterSystem?.presence?.[id]!==false;
}
export function enabledAttributes(state,id){return state.characterSystem?{attributes:savedCharacterAbilities(state,id)}:{};}

// Potential is an individual ceiling, not a current ability or a recruitment promise.
export function characterPotential(id){return Object.fromEntries(Object.keys(abilityNames).map((key,i)=>[key,potentialProfiles[id]?.[i]??abilityMaximums[key]]));}
export function savedCharacterPotential(state,id){const current=savedCharacterAbilities(state,id),raw=state.characterSystem?.potentials?.[id]??characterPotential(id);return Object.fromEntries(Object.keys(abilityNames).map(key=>[key,Math.max(current[key],normalizeAbilities(raw)[key])]));}
export function gainCharacterPractice(state,id,key,amount=1){
 if(!state.characterSystem||!abilityNames[key]||!Number.isFinite(amount)||amount<=0)return 0;
 const system=state.characterSystem;system.initialProfiles??=structuredClone(system.profiles);system.potentials??=Object.fromEntries(characterAbilityIds.map(id=>[id,characterPotential(id)]));system.practice??={};
 const current=savedCharacterAbilities(state,id),cap=savedCharacterPotential(state,id)[key];system.profiles[id]=current;system.practice[id]??={};
 let xp=(system.practice[id][key]??0)+Math.min(20,amount),gained=0;
 while(current[key]<cap&&xp>=10+current[key]*2){xp-=10+current[key]*2;current[key]++;gained++;}
 system.practice[id][key]=current[key]>=cap?0:xp;
 for(const member of state.survivalRun?.members??[])if(member.character===id)member.attributes={...current};
 return gained;
}
export function characterStartingRarity(state,id){return rarityForAbilities(state.characterSystem?.initialProfiles?.[id]??savedCharacterAbilities(state,id));}
