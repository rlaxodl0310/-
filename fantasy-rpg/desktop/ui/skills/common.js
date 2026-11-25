(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(require("./common-data.js"), require("../monsters/essence-rules.js"), require("./embodied.js"));
  else r.CommonSkills = f(r.CommonSkillData, r.EssenceRules, r.EmbodiedSkills);
})(globalThis, (records, Essences, Embodied) => {
  "use strict";
  const clone = (v) => JSON.parse(JSON.stringify(v));
  for (const d of records) {
    Object.freeze(d.mechanic);
    Object.freeze(d.visual);
    Object.freeze(d);
  }
  Object.freeze(records);
  const byId = new Map(records.map((d) => [d.id, d]));
  // Configured essence abilities use the same executor without entering the public skill catalog.
  for(const e of Essences?.records||[])for(const ability of [e.effect,e.activeSkill]){
    const config=ability?.runtime;if(!config)continue;
    if(byId.has(config.id))throw Error('중복 정수 스킬 ID');
    byId.set(config.id,Object.freeze({...clone(config),name:ability.name,description:ability.effect,category:'정수',type:'active',cooldown:0,support:'combat',essenceSpecies:e.id}));
  }
  const bands = [
    [5, 15],
    [16, 30],
    [31, 55],
    [56, 90],
    [90, 150],
    [150, 250],
    [250, 400],
    [400, 650],
    [650, 1000],
    [1000, Infinity],
  ];
  const selfKinds = [
    "strength",
    "speed",
    "defense",
    "sense",
    "pain",
    "attack",
    "stamina",
    "resistance",
    "mana_regen",
    "weapon_edge",
    "weapon_durable",
    "enchant",
    "resonance",
    "shield",
    "counter",
    "impact",
    "illusion",
    "clone",
  ];
  function get(id) {
    return byId.get(id) || null;
  }
  function prepare(skill, ctx) {
    const d = get(skill.commonId);
    if (!d) throw Error("등록된 공용 기술이 아닙니다.");
    const custom=Embodied.prepare(d,ctx);if(custom)return custom;
    const m = d.mechanic,
      type =
        ctx.weaponType ||
        { gauntlet: "unarmed", bow: "bow", magic: "focus" }[ctx.weapon] ||
        ctx.weapon ||
        "unarmed";
    if (m.weapon && ctx.weaponState?.durability === 0)
      throw Error("파손된 무기를 사용할 수 없습니다.");
    if (m.weapon) {
      const compatible =
        m.weapon === "any"
          ? type !== "unarmed"
          : m.weapon === "ranged"
            ? ["bow", "crossbow", "throwing"].includes(type)
            : m.weapon === "blade"
              ? ["sword", "dagger", "axe"].includes(type)
              : type === m.weapon;
      if (!compatible)
        throw Error(
          "필요한 무기를 실제로 장착해야 합니다: " +
            ({
              sword: "검",
              spear: "창",
              shield: "방패",
              ranged: "원거리 무기",
              blade: "날붙이",
              any: "무기",
            }[m.weapon] || m.weapon),
        );
    }
    if (m.requiresSheathed && !ctx.sheathed)
      throw Error("발도 전 납도 상태가 필요합니다.");
    if (
      ctx.silenced &&
      [
        "arcane",
        "fire",
        "frost",
        "lightning",
        "light",
        "shadow",
        "wind",
        "water",
        "poison",
      ].includes(m.element)
    )
      throw Error("시전 방해 상태입니다.");
    if (ctx.disarmed && m.weapon)
      throw Error("현재 무기 공격을 할 수 없습니다.");
    if (
      ["dash", "charge", "leap", "teleport", "swap"].includes(m.kind) &&
      ctx.anchored
    )
      throw Error("공간/이동 구속으로 이동기를 사용할 수 없습니다.");
    if (
      ["throw"].includes(m.kind) &&
      (!ctx.targetAlive ||
        ctx.targetMass > (ctx.actorMass || 80) * 1.5 ||
        ctx.distance > 1.5)
    )
      throw Error("잡을 수 있는 크기의 가까운 대상이 필요합니다.");
    if (
      !selfKinds.includes(m.kind) &&
      ![
        "heal",
        "transfer",
        "link",
        "swap",
        "teleport",
        "dash",
        "leap",
        "fog",
        "wall",
        "snare_field",
        "poison_field",
        "pull_object",
        "vibrate_object",
      ].includes(m.kind) &&
      ctx.targetAlive !== true
    )
      throw Error("살아 있는 유효한 대상이 필요합니다.");
    if (
      !selfKinds.includes(m.kind) &&
      m.kind !== "heal" &&
      m.kind !== "transfer" &&
      m.kind !== "link" &&
      ctx.targetAlive &&
      ctx.distance > m.range + 0.01
    )
      throw Error("스킬 사거리 밖입니다.");
    if (m.kind === "swap" && !ctx.hasIllusion)
      throw Error("교체할 활성 허상이 없습니다.");
    if (m.kind === "transfer" && (!ctx.hasAlly || ctx.hp <= d.mechanic.amount))
      throw Error("생명력을 전달할 아군과 남길 체력이 필요합니다.");
    if (m.kind === "link" && !ctx.hasAlly)
      throw Error("연결할 아군 두 명이 필요합니다.");
    if (m.kind === "heal" && ctx.targetHP >= ctx.targetMax)
      throw Error("회복할 손상이 없습니다.");
    if (m.kind === "drain" && !(ctx.targetMana > 0))
      throw Error("흡수할 대상 마나가 없습니다.");
    if (["pull_object", "vibrate_object"].includes(m.kind)) {
      if (!ctx.object || ctx.object.distance > m.range)
        throw Error("사거리 안에 실제 확인된 물건이 필요합니다.");
      if (
        m.kind === "pull_object" &&
        (ctx.object.fixed || ctx.object.weight !== "light")
      )
        throw Error("고정되지 않은 가벼운 물건만 끌어올 수 있습니다.");
    }
    if (m.kind === "track" && d.name === "혈흔 추적" && !(ctx.bloodTrails > 0))
      throw Error("실제 피격으로 남은 혈흔이 없습니다.");
    if (m.kind === "weapon_durable" && !ctx.weaponState)
      throw Error("내구도가 기록된 실제 장비가 필요합니다.");
    if (m.kind === "stamina" && !Number.isFinite(ctx.stamina))
      throw Error("현재 스태미나 자료가 없습니다.");
    const extra = ctx.manaLeak ? Math.ceil(d.mana * 0.25) : 0;
    return {
      mana: d.mana + extra,
      cooldown: 0,
      windup: m.windup,
      amount: m.amount,
      distance: m.range,
      common: clone(d),
    };
  }
  function definition(id, ownerId, options={}) {
    const d = get(id);
    if (!d) throw Error("없는 공용 기술입니다.");
    if(d.essenceSpecies&&!options.sourceGranted)throw Error("정수를 실제 흡수한 출처가 필요합니다.");
    return {
      id: "learned:" + ownerId + ":" + d.id,
      ownerId,
      name: d.name,
      origin: "common",
      commonId: d.id,
      ...(d.essenceSpecies?{requiredEssenceSpecies:d.essenceSpecies}:{}),
      grade: d.grade,
      fixedGrade: true,
      basisIds: [],
      evidenceIds: [],
      effect: "common",
      element: d.mechanic.element,
      power: d.grade,
      range: d.mechanic.range,
      condition: "none",
      cost: { mana: d.mana, cooldown: 0, windup: d.mechanic.windup, impact: 0 },
      visual: clone(d.visual),
      fingerprint: "common:" + ownerId + ":" + d.id,
    };
  }
  function describe(skill, progress = {}) {
    const d = get(skill.commonId);
    if (!d) return null;
    return {
      id: skill.id,
      ownerId: skill.ownerId,
      name: d.name,
      grade: d.grade,
      rank:
        [0, 20, 80, 200, 500].filter((n) => (progress.xp || 0) >= n).length - 1,
      masteryXP: progress.xp || 0,
      uses: progress.uses || 0,
      text:
        d.grade +
        "등급 고정 · MP " +
        d.mana +
        " · 쿨타임 없음 · " +
        d.description +
        (d.mechanic.weapon ? " · 필요 무기 " + d.mechanic.weapon : "") +
        (d.support === "context-required" ? " · 현장 자료 필요" : ""),
      visual: clone(d.visual),
    };
  }
  return { records, get, prepare, definition, describe, bands, Embodied, actionCost:(s,u)=>Embodied.actionCost(get(s.commonId),u)??s.cost.mana, actionLabel:(s,u)=>{const d=get(s.commonId);return d&&Embodied.supports(d.mechanic.kind)?Embodied.actionLabel(d,u):s.name;} };
});
