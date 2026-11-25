"use strict";
const G = require("../ui/progression/model.js"),
  S = require("../ui/skills/system.js"),
  Common = require("../ui/skills/common.js");
function sync(state) {
  if (!state.player.progression) return state;
  const player = G.recalculate(state.player),
    book = S.read(state.skillBook),
    active = new Set(
      player.grantedAbilities.filter((a) => a.commonId).map((a) => a.commonId),
    );
  for (const sk of book.skills.filter(
    (s) => s.ownerId === "taei" && s.progressionGranted,
  )) {
    if (!active.has(sk.commonId)) {
      book.dormantProgressionSkills ??= {};
      book.dormantProgressionSkills[sk.id] = sk;
      book.skills = book.skills.filter((x) => x.id !== sk.id);
    }
  }
  for (const commonId of active) {
    if (!Common.get(commonId))
      throw Error("장비가 참조한 스킬이 도감에 없습니다.");
    const def = Common.definition(commonId, "taei", {sourceGranted:true});
    const present = book.skills.find((s) => s.id === def.id);
    if (present) {
      if(present.progressionGranted||def.requiredEssenceSpecies){Object.assign(present,def);present.progressionGranted=true;present.progressionSources = player.grantedAbilities
          .filter((a) => a.commonId === commonId)
          .map((a) => a.sourceId);}
      continue;
    }
    const old = book.dormantProgressionSkills?.[def.id];
    book.skills.push({
      ...(old || def),
      progressionGranted: true,
      progressionSources: player.grantedAbilities
        .filter((a) => a.commonId === commonId)
        .map((a) => a.sourceId),
    });
    book.progress[def.id] ??= { xp: 0, uses: 0, encounters: {} };
    if (book.dormantProgressionSkills)
      delete book.dormantProgressionSkills[def.id];
  }
  for (const cap of book.capabilities)
    if (cap.origin === "ego" && cap.equipmentId)
      cap.active = player.equipmentIds.includes(cap.equipmentId);
  const clean=common=>{if(!common)return common;return {...common,units:(common.units||[]).map(u=>({...u,statuses:(u.statuses||[]).filter(status=>{if(!status.commonId?.startsWith('essence-'))return true;const d=Common.get(status.commonId);return !!d&&(!d.revision||status.definitionRevision===d.revision);})}))};};
  let combat=state.combat?{...state.combat,commonState:clean(state.combat.commonState)}:undefined,utility=clean(state.skillUtilityState);
  if(combat?.status==='playing'&&!combat.commonState&&utility?.units?.some(u=>u.id==='taei'&&u.statuses.some(s=>Common.Embodied.supports(s.key)))){combat.commonState={...utility,units:utility.units.filter(u=>u.id==='taei'),props:[],fields:[],illusions:[]};utility=undefined;}
  const current=combat?.status==='playing'?combat.commonState:utility;
  if(current){const delta=Math.max(0,book.clock-(current.captureClock??book.clock)),start=current.time||0,end=start+delta;
    for(const actor of current.units||[])if(actor.id==='taei')actor.statuses=actor.statuses.filter(status=>{if(!Common.Embodied.supports(status.key))return true;const cost=Math.min(delta,Math.max(0,status.until-start))*(status.maintenance||0);if(player.mana+1e-8<cost){player.mana=0;return false;}player.mana=Math.max(0,Math.round((player.mana-cost)*1e6)/1e6);return status.until>end;});
    current.time=end;current.captureClock=book.clock;
  }
  return { ...state, player, skillBook: book,...(combat?{combat}:{}),...(state.skillUtilityState||utility?{skillUtilityState:utility}:{}) };

}
function context(state) {
  const XP=require("../ui/progression/experience.js");
  return {
    ...G.breakdown(state.player, state.skillBook?.clock || 0),
    experience:{level:state.player.level||1,current:state.player.experience?.xp||0,required:XP.required(state.player.level||1),policy:XP.policy,authority:"경험치는 실제 전투/검증된 의뢰 완료만 지급한다. AI가 묘사로 경험치/레벨/포인트를 발명하지 않는다."},
    rule: "합계는 이미 출처별 보너스를 포함한다. 정수/장비 보너스를 다시 더하지 않는다. 소지하지 않은 물품·포인트를 만들어 지급하지 않는다. pending-cost-and-mechanic 능력은 설명만 등록되었으며 사용 성공/소모량을 발명하지 않는다.",
  };
}
function apply(state, action) {
  if (state.era !== "fantasy") throw Error("전이 이후에 사용할 수 있습니다.");
  if (state.combat?.status === "playing")
    throw Error("전투를 마친 뒤 성장·장비를 변경해 주세요.");
  const player = G.apply(state.player, action, state.minutes || 0);
  return sync({ ...state, player });
}
module.exports = { sync, context, apply };
