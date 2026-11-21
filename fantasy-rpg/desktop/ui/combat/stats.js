(function (r, f) {
  if (typeof module === "object" && module.exports) module.exports = f();
  else r.StatRules = f();
})(globalThis, () => {
  "use strict";
  const fields = Object.freeze(
    [
      { key: "strength", name: "힘" },
      { key: "agility", name: "민첩" },
      { key: "defense", name: "방어력" },
      { key: "magicAttack", name: "마법 공격력" },
      { key: "magicResistance", name: "마법 저항력" },
      { key: "health", name: "체력" },
      { key: "mana", name: "마나" },
    ].map(Object.freeze),
  );
  const aliases = {
    strength: ["strength", "힘", "attack"],
    agility: ["agility", "민첩"],
    defense: ["defense", "방어력"],
    magicAttack: [
      "magicAttack",
      "마법 공격력",
      "마법공격력",
      "intelligence",
      "지능",
    ],
    magicResistance: [
      "magicResistance",
      "마법 저항력",
      "마법저항력",
      "magicDefense",
      "magicResist",
    ],
    health: ["health", "체력"],
    mana: ["mana", "마나"],
  };
  const effects = [
    "healingPower",
    "shieldPower",
    "controlPower",
    "controlResistance",
    "criticalChance",
    "criticalMultiplier",
  ];
  const clone = (v) => JSON.parse(JSON.stringify(v));
  function base(actor = {}) {
    const result = {};
    for (const { key } of fields) {
      const keys = aliases[key];
      let value;
      for (const source of [
        actor.stats || {},
        actor.baseStats || {},
        actor.combatStats || {},
        actor,
      ]) {
        if (source === actor && ["mana", "health"].includes(key)) continue;
        const found = keys.find((k) => Object.hasOwn(source, k));
        if (found !== undefined) {
          value = source[found];
          break;
        }
      }
      if (value !== undefined) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
          throw Error("스탯 값이 올바르지 않습니다: " + key);
        result[key] = value;
      }
    }
    return result;
  }
  function value(actor, key, fallback = 0) {
    return base(actor)[key] ?? fallback;
  }
  function derived(actor = {}) {
    const b = base(actor),
      r = {};
    for (const [key, from] of Object.entries({
      attack: "strength",
      defense: "defense",
      magicAttack: "magicAttack",
      magicDefense: "magicResistance",
    }))
      if (b[from] !== undefined) r[key] = b[from];
    return r;
  }
  function normalize(actor = {}) {
    const p = clone(actor),
      old = p.stats || {},
      stats = base(p),
      legacy = { ...(p.legacyStatFields || {}) },
      bonuses = { ...(p.effectBonuses || {}) },
      legacyOptions = { ...(p.legacyCombatOptions || {}) };
    for (const [k, v] of Object.entries(old))
      if (!fields.some((f) => f.key === k)) legacy[k] = v;
    for (const [k, v] of Object.entries(p.combatStats || {})) {
      if (["vitalAccuracy", "급소적중률", "급소 적중률"].includes(k))
        legacyOptions[k] = v;
      else if (effects.includes(k) && bonuses[k] === undefined) bonuses[k] = v;
    }
    for (const k of effects) {
      if (Number.isFinite(p[k]) && bonuses[k] === undefined) bonuses[k] = p[k];
      delete p[k];
    }
    for (const k of ["vitalAccuracy", "급소적중률", "급소 적중률"]) {
      if (p[k] !== undefined) legacyOptions[k] = p[k];
      delete p[k];
    }
    for (const list of Object.values(aliases))
      for (const k of list) if (k !== "mana" && p[k] !== undefined) delete p[k];
    if (p.statVersion !== 1 && Object.keys(p.combatStats || {}).length)
      p.legacyCombatStats = clone(p.combatStats);
    p.stats = stats;
    p.combatStats = derived({ stats });
    p.effectBonuses = bonuses;
    p.statVersion = 1;
    if (Object.keys(legacy).length) p.legacyStatFields = legacy;
    if (Object.keys(legacyOptions).length)
      p.legacyCombatOptions = legacyOptions;
    delete p.baseStats;
    return p;
  }
  function validateAllocation(input) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw Error("스탯 배분 형식이 올바르지 않습니다.");
    for (const [key, v] of Object.entries(input)) {
      if (!fields.some((f) => f.key === key))
        throw Error("기본 스탯이 아닙니다: " + key);
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0)
        throw Error("스탯 값이 올바르지 않습니다: " + key);
    }
    return { ...input };
  }
  function context() {
    return {
      baseStats: fields.map((f) => f.name),
      resourceRule: "체력1=최대HP100, 마나1=최대MP100",
      physical: "힘 → 물리 공격의 관련 능력치",
      magical:
        "마법 공격력 → 마법 공격, 마법 저항력 → 마법 피해 방어. 방어력을 마법 저항력 대신 쓰지 않는다.",
      agility: "민첩 → 기존 이동·동작·회피 충전 계산",
      options:
        "급소 적중률은 스킬 옵션이다. 기본 스탯이나 인물 전체의 기본 급소 수치로 추가하지 않는다. 치유/보호막 강화 등 효과 수치는 별도 보조 효과이며 투자 가능한 기본 스탯이 아니다.",
      unknown:
        "미확정 수치를 임의로 채우거나 지급하지 않는다. 이전 지능 표기는 마법 공격력으로 정정되었다.",
    };
  }
  return {
    fields,
    aliases,
    base,
    value,
    derived,
    normalize,
    validateAllocation,
    context,
  };
});
