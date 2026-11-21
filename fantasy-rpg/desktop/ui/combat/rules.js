(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./stats.js"));
  else root.CombatRules = factory(root.StatRules);
})(globalThis, (Stats) => {
  "use strict";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)),
    clone = (x) => JSON.parse(JSON.stringify(x));
  const POLICY = Object.freeze({
    version: 1,
    defenseConstant: 100,
    levelBonusPerLevel: 0.01,
    breachBase: 0.5,
    breachMin: 0.05,
    breachMax: 0.95,
    attackBuffCap: 1,
    defenseBuffCap: 1,
    speedBuffCap: 0.5,
    weaknessCap: 0.5,
    slowCap: 0.6,
    healBonusCap: 1,
    healReductionCap: 0.75,
    damageReductionCap: 0.75,
    shieldHPCap: 0.5,
    shieldEfficiency: 1.25,
    oneHitEfficiency: 1.2,
    absorbDuration: 8,
    oneHitDuration: 5,
    controlWindow: 10,
    controlImmunity: 5,
    defaultCritMultiplier: 1.5,
    penetrationOrder: "percent-then-flat",
  });
  function number(v, fallback = 0) {
    return Number.isFinite(v) ? v : fallback;
  }
  function positive(v, fallback = 0) {
    return Math.max(0, number(v, fallback));
  }
  function ratio(v) {
    return clamp(number(v), 0, 1);
  }
  function round(v) {
    return Math.round(Math.max(0, v) * 1e6) / 1e6;
  }
  function rng(seed = 1) {
    let state = seed >>> 0 || 1;
    return {
      next() {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
      },
      get state() {
        return state >>> 0;
      },
      set state(v) {
        state = v >>> 0 || 1;
      },
    };
  }
  function hash(s) {
    let n = 2166136261;
    for (const c of String(s)) {
      n ^= c.charCodeAt(0);
      n = Math.imul(n, 16777619);
    }
    return n >>> 0;
  }
  function stat(actor, key, fallback = 0) {
    const mapping = {
      attack: "strength",
      magicAttack: "magicAttack",
      defense: "defense",
      magicDefense: "magicResistance",
      strength: "strength",
      agility: "agility",
      magicResistance: "magicResistance",
      health: "health",
      mana: "mana",
    };
    if (mapping[key]) return Stats.value(actor, mapping[key], fallback);
    if (key === "vitalAccuracy") return 0;
    return number(actor?.effectBonuses?.[key] ?? actor?.[key], fallback);
  }

  function strongest(statuses, now = 0) {
    const groups = new Map();
    for (const s of statuses || []) {
      if (!(s.until > now) || s.dispelled) continue;
      const key = s.effectKey || s.key;
      if (!key) continue;
      const old = groups.get(key);
      if (
        !old ||
        positive(s.potency) > positive(old.potency) ||
        (s.potency === old.potency && s.until > old.until)
      )
        groups.set(key, s);
    }
    return [...groups.values()];
  }
  function modifier(actor, keys, cap, now = 0) {
    return clamp(
      strongest(actor?.commonStatuses, now)
        .filter((s) => keys.includes(s.key))
        .reduce((n, s) => n + number(s.potency), 0),
      0,
      cap,
    );
  }
  function effectiveDefense(actor, type, now = 0) {
    const base = positive(
        stat(actor, type === "magic" ? "magicDefense" : "defense", 0),
      ),
      bonus = modifier(actor, ["defense"], POLICY.defenseBuffCap, now),
      weak = modifier(actor, ["defenseWeak"], POLICY.weaknessCap, now);
    return base * Math.max(0, 1 + bonus - weak);
  }
  function effectiveAttack(actor, type, now = 0) {
    const base = positive(
      stat(actor, type === "magic" ? "magicAttack" : "attack", 0),
    );
    const bonus = modifier(
        actor,
        ["attack", "strength", "weapon_edge", "enchant"],
        POLICY.attackBuffCap,
        now,
      ),
      weak = modifier(actor, ["weak"], POLICY.weaknessCap, now);
    return base * Math.max(0, 1 + bonus - weak);
  }
  function penetration(
    defense,
    percent = 0,
    flat = 0,
    order = POLICY.penetrationOrder,
  ) {
    const d = positive(defense),
      p = ratio(percent),
      f = positive(flat);
    return order === "flat-then-percent"
      ? Math.max(0, d - f) * (1 - p)
      : Math.max(0, d * (1 - p) - f);
  }
  function vitalContest(
    attack,
    defense,
    accuracy = 0,
    skillCoefficient = 1,
    armorReduction = 0,
  ) {
    const A =
        positive(attack) *
        (1 + positive(accuracy)) *
        positive(skillCoefficient),
      D = positive(defense) * (1 + ratio(armorReduction)),
      sum = A + D,
      E = sum > 0 ? (A - D) / sum : 0;
    return {
      attackScore: A,
      defenseScore: D,
      excess: E,
      chance: clamp(POLICY.breachBase + E, POLICY.breachMin, POLICY.breachMax),
    };
  }
  function levelMultiplier(a, b) {
    return (
      1 + Math.max(0, number(a, 1) - number(b, 1)) * POLICY.levelBonusPerLevel
    );
  }
  function activeShields(shields, now = 0) {
    const groups = new Map();
    for (const s of shields || []) {
      if (
        !(s.until > now) ||
        s.remaining <= 0 ||
        (s.mode === "one-hit" && s.used)
      )
        continue;
      const key = s.effectKey || s.id || s.commonId || "shield";
      const old = groups.get(key);
      if (
        !old ||
        s.capacity > old.capacity ||
        (s.capacity === old.capacity && s.until > old.until)
      )
        groups.set(key, s);
    }
    return [...groups.values()];
  }
  function grantShield(shields, incoming, { maxHP, now = 0 } = {}) {
    const next = clone(shields || []),
      s = clone(incoming);
    if (
      !Number.isFinite(s.capacity) ||
      s.capacity < 0 ||
      !Number.isFinite(s.until) ||
      s.until <= now ||
      !["absorb", "one-hit"].includes(s.mode)
    )
      throw Error("보호막 정의가 올바르지 않습니다.");
    s.effectKey ??= s.mode === "one-hit" ? "one-hit" : s.commonId || s.id;
    s.used = false;
    const budget = positive(maxHP) * POLICY.shieldHPCap,
      other = activeShields(next, now)
        .filter(
          (v) =>
            v.mode === "absorb" && v.effectKey !== s.effectKey && !v.capExempt,
        )
        .reduce((n, v) => n + v.remaining, 0);
    s.remaining =
      s.mode === "one-hit" || s.capExempt
        ? s.capacity
        : Math.min(s.capacity, Math.max(0, budget - other));
    const old = next.find(
      (v) =>
        v.effectKey === s.effectKey &&
        v.source === s.source &&
        v.capacity === s.capacity &&
        v.until > now &&
        v.remaining > 0 &&
        !v.used,
    );
    if (old) {
      old.until = Math.max(
        old.until,
        s.until,
      ); /* Equal recast never refills an existing shield. */
    } else next.push(s);
    return next.filter((v) => v.until > now).slice(-128);
  }
  function consumeShields(
    shields,
    damage,
    { now = 0, projectile = false, damageType = "physical", maxHP } = {},
  ) {
    const next = clone(shields || []);
    let left = positive(damage),
      absorbed = 0,
      blockEffects = false;
    const used = [];
    const live = activeShields(next, now).filter(
      (s) =>
        (!s.projectileOnly || projectile) &&
        (!s.damageType || s.damageType === damageType),
    );
    if (Number.isFinite(maxHP)) {
      let budget = positive(maxHP) * POLICY.shieldHPCap;
      for (const s of live.filter((s) => s.mode === "absorb" && !s.capExempt)) {
        s.remaining = Math.min(s.remaining, budget);
        budget -= s.remaining;
      }
    }
    const once = live
      .filter((s) => s.mode === "one-hit")
      .sort((a, b) => b.capacity - a.capacity)[0];
    if (left > 0 && once) {
      const n = Math.min(left, once.capacity);
      blockEffects = left <= once.capacity;
      left -= n;
      absorbed += n;
      once.used = true;
      once.remaining = 0;
      used.push({
        id: once.id,
        source: once.source,
        skillId: once.skillId,
        castId: once.castId,
        amount: n,
        mode: once.mode,
        fullBlock: blockEffects,
      });
    }
    for (const s of live
      .filter((v) => v.mode === "absorb")
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.until - b.until)) {
      if (left <= 0) break;
      const n = Math.min(left, s.remaining);
      s.remaining -= n;
      left -= n;
      absorbed += n;
      if (n > 0)
        used.push({
          id: s.id,
          source: s.source,
          skillId: s.skillId,
          castId: s.castId,
          amount: n,
          mode: s.mode,
        });
    }
    return {
      shields: next,
      hpDamage: round(left),
      absorbed: round(absorbed),
      blockEffects,
      used,
    };
  }
  function resolveHit(input, random = () => 0.999999) {
    const source = input.source || {},
      rawTarget = input.target || {},
      now = number(input.now),
      type = input.damageType === "magic" ? "magic" : "physical",
      target = {
        ...rawTarget,
        commonStatuses: (rawTarget.commonStatuses || []).filter(
          (s) => !s.damageType || s.damageType === type,
        ),
      },
      base = positive(input.basePower),
      coefficient = positive(input.coefficient, 1),
      mult = positive(input.hitMultiplier, 1),
      attack = effectiveAttack(source, type, now),
      defense = effectiveDefense(target, type, now),
      effective = penetration(
        defense,
        input.penetrationPercent,
        input.penetrationFlat,
        input.penetrationOrder,
      ),
      attackBase = positive(
        stat(source, type === "magic" ? "magicAttack" : "attack", 0),
      ),
      attackBonus =
        modifier(
          source,
          ["attack", "strength", "weapon_edge", "enchant"],
          1,
          now,
        ) - modifier(source, ["weak"], 0.5, now),
      raw =
        (base + attackBase * coefficient) * Math.max(0, 1 + attackBonus) * mult,
      part = input.part || "torso",
      armor = target.armor?.[part] || null,
      armorDR = armor ? ratio(armor.damageReduction) : 0,
      vital = vitalContest(
        attack,
        defense,
        input.vitalAccuracy ?? input.skillOptions?.vitalAccuracy ?? 0,
        input.vitalCoefficient ?? 1,
        armorDR,
      ),
      critChance = ratio(
        input.criticalChance ?? stat(source, "criticalChance"),
      ),
      critical = critChance > 0 && random() < critChance,
      breached = !!armor && armorDR > 0 && random() < vital.chance,
      critMultiplier = critical
        ? Math.max(
            1,
            number(
              input.criticalMultiplier,
              stat(source, "criticalMultiplier", POLICY.defaultCritMultiplier),
            ),
          )
        : 1,
      excess = !armor ? Math.max(0, vital.excess) : 0,
      level = levelMultiplier(source.level, target.level),
      generalDR = clamp(
        modifier(target, ["damageReduction"], POLICY.damageReductionCap, now) +
          positive(input.extraReduction),
        0,
        POLICY.damageReductionCap,
      ),
      vulnerability = modifier(target, ["vulnerable"], POLICY.weaknessCap, now),
      afterDefense =
        (raw * POLICY.defenseConstant) / (POLICY.defenseConstant + effective),
      preShield =
        afterDefense *
        (1 + vulnerability) *
        critMultiplier *
        (1 + excess) *
        level *
        (1 - (breached ? 0 : armorDR)) *
        (1 - generalDR),
      shield = consumeShields(input.shields, preShield, {
        now,
        maxHP: target.max ?? target.maxHP,
        projectile: !!input.projectile,
        damageType: type,
      });
    return {
      ...shield,
      part,
      rawPower: round(raw),
      defense,
      effectiveDefense: effective,
      afterDefense: round(afterDefense),
      critical,
      criticalMultiplier: critMultiplier,
      armorPresent: !!armor,
      armorReduction: armorDR,
      armorBreached: breached,
      breachChance: vital.chance,
      vitalAttackScore: vital.attackScore,
      vitalDefenseScore: vital.defenseScore,
      excessVital: excess,
      levelMultiplier: level,
      generalReduction: generalDR,
      preShieldDamage: round(preShield),
      contact: true,
    };
  }
  function efficiency(grade) {
    return grade <= 2 ? 2 : grade <= 4 ? 2.5 : grade <= 7 ? 3 : 3.5;
  }
  function healAmount({
    mana = 0,
    grade = 1,
    base,
    healingPower = 0,
    coefficient = 1,
    bonus = 0,
    reduction = 0,
    maxHP = 0,
    hp = 0,
  } = {}) {
    const raw =
      base === undefined
        ? positive(mana) * efficiency(grade) +
          positive(healingPower) * positive(coefficient)
        : positive(base);
    const factor = clamp(
        1 +
          clamp(number(bonus), 0, POLICY.healBonusCap) -
          clamp(number(reduction), 0, POLICY.healReductionCap),
        0.25,
        2,
      ),
      amount = round(Math.min(Math.max(0, maxHP - hp), raw * factor));
    return {
      base: raw,
      multiplier: factor,
      amount,
      overheal: round(Math.max(0, raw * factor - amount)),
    };
  }
  function shieldCapacity({
    mana = 0,
    grade = 1,
    base,
    shieldPower = 0,
    coefficient = 1,
    bonus = 0,
    mode = "absorb",
  } = {}) {
    const capacity =
      (base === undefined
        ? positive(mana) * efficiency(grade) * POLICY.shieldEfficiency +
          positive(shieldPower) * positive(coefficient)
        : positive(base)) *
      (1 + positive(bonus)) *
      (mode === "one-hit" ? POLICY.oneHitEfficiency : 1);
    return round(capacity);
  }
  const HARD = ["stun", "root", "freeze", "airborne"];
  function debuff(
    {
      key,
      grade = 1,
      duration,
      sourcePower = 100,
      resistance = 0,
      coefficient = 1,
      history = {},
      now = 0,
    },
    random = () => 0.999999,
  ) {
    const A = positive(sourcePower, 100) * positive(coefficient, 1),
      D = positive(resistance),
      chance = D === 0 ? 1 : clamp(A / (A + D || 1), 0.1, 0.95),
      state = clone(history);
    if (state.immuneUntil !== undefined && state.immuneUntil <= now) {
      state.count = 0;
      delete state.immuneUntil;
    }
    if (HARD.includes(key) && state.immuneUntil > now)
      return {
        applied: false,
        reason: "control-immunity",
        history: state,
        chance,
      };
    if (random() >= chance)
      return { applied: false, reason: "resisted", history: state, chance };
    let scale = 1 - (0.5 * D) / (A + D || 1);
    if (HARD.includes(key)) {
      if (now - number(state.lastAt, -Infinity) > POLICY.controlWindow)
        state.count = 0;
      const count = state.count || 0;
      if (count >= 3) {
        state.immuneUntil = now + POLICY.controlImmunity;
        state.lastAt = now;
        return {
          applied: false,
          reason: "control-immunity",
          history: state,
          chance,
        };
      }
      scale *= [1, 0.5, 0.25][count];
      state.count = count + 1;
      state.lastAt = now;
    }
    return {
      applied: true,
      duration: Math.max(0, number(duration)) * scale,
      history: state,
      chance,
      grade,
    };
  }
  function dispel(
    statuses,
    { categories = [], maxGrade = 1, now = 0, count = 1 } = {},
  ) {
    const next = clone(statuses || []),
      removed = [];
    for (const s of next) {
      if (removed.length >= count) break;
      if (
        s.until > now &&
        categories.includes(s.category) &&
        number(s.grade, 1) <= maxGrade &&
        s.dispellable !== false
      ) {
        s.dispelled = true;
        s.until = now;
        removed.push(s);
      }
    }
    return { statuses: next, removed };
  }
  function parseAim(text) {
    const pairs = [
      ["shoulder", "어깨"],
      ["head", "머리"],
      ["neck", "목"],
      ["chest", "가슴"],
      ["abdomen", "복부|배"],
      ["arm", "팔"],
      ["leg", "다리"],
    ];
    const clean = String(text).replace(
      /(?:어깨|머리|목|가슴|복부|배|팔|다리)(?:를|을|는|은|에)?\s*(?:말고|아니)[,\s]*/g,
      "",
    );
    for (const [part, words] of pairs)
      if (
        new RegExp(
          "(?:" + words + ")(?:를|을|에|쪽|부위|부터|만|로|\\s|$)",
        ).test(clean)
      )
        return part;
    return null;
  }
  function actorStats(actor = {}) {
    return Stats.derived(actor);
  }

  function context() {
    return {
      version: POLICY.version,
      statSystem: Stats.context(),
      authority:
        "코드의 판정 결과가 피해/방호/회복의 원본이며 AI가 수치·치명타·우회 성공을 발명하지 않는다.",
      damage:
        "(기본위력+관련공격력×기술계수)×100/(100+유효방어력)×상황×(1+max(0,공격자레벨-대상레벨)×0.01)",
      multiHit:
        "타격마다 계수·치명타·급소·피격부위 방호·보호막을 따로 계산한다. 0.33×3은0.99다.",
      vital:
        "A=공격력×(1+급소적중률)×급소계수, D=방어력×(1+피격부위피해감소), E=(A-D)/(A+D). 방어구 있음:우회확률clamp(0.5+E,.05,.95), 피해감소만우회. 없음:max(0,E) 추가피해. 방어력유지.",
      healing:
        "MP효율1~2등급2,3~4등급2.5,5~7등급3,8~10등급3.5. (기본+치유력×계수)×clamp(1+강화-감소,.25,2), 실제결손만회복; 부상자동치료아님.",
      shield:
        "흡수형=치유기본효율×1.25,8초,일반동시총량최대HP50%.1회형=같은MP방호한계×1.2,5초; 한타격이하완전차단,초과시한계만큼줄이고관통.빗나감소모없음.",
      stacking:
        "동일효과강한것만,다른효과합산.약한효과로강한효과연장금지.기절/속박/빙결반복100→50→25→잠시면역.",
      policy: POLICY,
      implementationChoices:
        "관통순서 비율→고정, 치명타 기본1.5배, 반복제어창10초/면역5초, 보호막차감순서1회형→흡수형은 미정사항의 조정가능한 구현값이다.",
    };
  }
  return {
    POLICY,
    normalizeActor: Stats.normalize,
    baseStats: Stats.base,
    baseFields: Stats.fields,
    actorStats,
    rng,
    hash,
    stat,
    strongest,
    modifier,
    effectiveDefense,
    effectiveAttack,
    penetration,
    vitalContest,
    levelMultiplier,
    grantShield,
    activeShields,
    consumeShields,
    resolveHit,
    efficiency,
    healAmount,
    shieldCapacity,
    debuff,
    dispel,
    parseAim,
    context,
  };
});
