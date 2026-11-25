(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(
      require("../combat/stats.js"),
      require("../combat/rules.js"),
      require("../monsters/essence-rules.js"),
    );
  else r.Progression = f(r.StatRules, r.CombatRules, r.EssenceRules);
})(globalThis, (Stats, Rules, Essences) => {
  "use strict";
  const clone = (x) => JSON.parse(JSON.stringify(x)),
    slots = [
      "weapon",
      "offhand",
      "head",
      "torso",
      "shoulder",
      "arm",
      "leg",
      "feet",
      "accessory1",
      "accessory2",
    ];
  const id = (v) => typeof v === "string" && /^[-a-zA-Z0-9_:]{1,100}$/.test(v),
    fail = (m) => {
      throw Error(m);
    };
  const effectKeys = [
    "healingPower",
    "shieldPower",
    "controlPower",
    "controlResistance",
    "criticalChance",
    "criticalMultiplier",
  ];
  function ensure(actor) {
    const p = Stats.normalize(actor);
    if (!p.progression)
      p.progression = {
        version: 1,
        base: clone(p.stats),
        allocated: {},
        points:
          Number.isInteger(p.statPoints) && p.statPoints >= 0
            ? p.statPoints
            : 0,
        inventory: [],
        equipped: {},
        absorbed: [],
        receipts: [],
        legacyArmor: clone(p.armor || {}),
        legacyEffects: clone(p.effectBonuses || {}),
        legacyWeapon: {
          weaponType: p.weaponType || "unarmed",
          weaponState: clone(p.weaponState || null),
          equipmentIds: clone(p.equipmentIds || []),
        },
      };
    validate(p.progression);
    return p;
  }
  function validate(g) {
    if (
      g.version !== 1 ||
      !Array.isArray(g.inventory) ||
      g.inventory.length > 1024 ||
      !Array.isArray(g.absorbed) ||
      !Array.isArray(g.receipts) ||
      !g.equipped ||
      !Number.isSafeInteger(g.points) ||
      g.points < 0
    )
      fail("성장 기록이 잘못되었습니다.");
    Stats.validateAllocation(g.base);
    Stats.validateAllocation(g.allocated);
    const seen = new Set();
    for (const item of g.inventory) {
      validateItem(item);
      if (seen.has(item.id)) fail("중복 물품 ID입니다.");
      seen.add(item.id);
    }
    const worn = new Set();
    for (const [slot, itemId] of Object.entries(g.equipped)) {
      const item = g.inventory.find((i) => i.id === itemId);
      if (
        !slots.includes(slot) ||
        !item ||
        item.kind !== "equipment" ||
        item.slot !== slot ||
        worn.has(itemId)
      )
        fail("장착 기록이 잘못되었습니다.");
      worn.add(itemId);
    }
    const absorbed = new Set();
    for (const x of g.absorbed) {
      if (
        !id(x.id) ||
        absorbed.has(x.id) ||
        seen.has(x.id) ||
        !Essences.records.some((e) => e.id === x.species)
      )
        fail("정수 흡수 기록이 잘못되었습니다.");
      absorbed.add(x.id);
    }
    return g;
  }
  function validateItem(item) {
    if (
      !item ||
      !id(item.id) ||
      typeof item.name !== "string" ||
      item.name.length > 100 ||
      !["equipment", "essence"].includes(item.kind) ||
      !id(item.receipt)
    )
      fail("물품 형식이 잘못되었습니다.");
    if (item.kind === "essence") {
      if (
        !Essences.records.some((e) => e.id === item.species) ||
        !Number.isFinite(item.expiresAt)
      )
        fail("정수 기록이 잘못되었습니다.");
      return;
    }
    if (
      !slots.includes(item.slot) ||
      !["weapon", "armor", "artifact"].includes(item.category) ||
      (item.category === "artifact" && !item.slot.startsWith("accessory")) ||
      (item.category === "weapon" &&
        !["weapon", "offhand"].includes(item.slot)) ||
      !Number.isFinite(item.durability) ||
      !Number.isFinite(item.maxDurability) ||
      item.durability < 0 ||
      item.durability > item.maxDurability ||
      item.maxDurability <= 0
    )
      fail("장비 기록이 잘못되었습니다.");
    Stats.validateAllocation(item.stats || {});
    for (const [key, value] of Object.entries(item.effects || {}))
      if (!effectKeys.includes(key) || !Number.isFinite(value) || value < 0)
        fail("장비 보조 효과가 잘못되었습니다.");
    for (const [part, value] of Object.entries(item.armor || {}))
      if (
        ![
          "head",
          "neck",
          "torso",
          "chest",
          "abdomen",
          "shoulder",
          "arm",
          "leg",
          "feet",
        ].includes(part) ||
        !Number.isFinite(value.damageReduction) ||
        value.damageReduction < 0 ||
        value.damageReduction > 1
      )
        fail("부위 방호가 잘못되었습니다.");
    if (
      item.weaponType &&
      ![
        "unarmed",
        "sword",
        "dagger",
        "axe",
        "spear",
        "shield",
        "bow",
        "crossbow",
        "throwing",
        "focus",
      ].includes(item.weaponType)
    )
      fail("무기 종류가 잘못되었습니다.");
    if (
      item.commonSkills !== undefined &&
      (!Array.isArray(item.commonSkills) ||
        item.commonSkills.some((x) => !id(x)))
    )
      fail("장비 스킬 형식이 잘못되었습니다.");
  }
  function essenceStats(e) {
    const result = {};
    for (const [name, value] of Object.entries(e.stats || {})) {
      const f = Stats.fields.find(
        (f) => f.name.replaceAll(" ", "") === name.replaceAll(" ", ""),
      );
      if (!f) fail("정수에 미등록 스탯이 있습니다.");
      result[f.key] = value;
    }
    return result;
  }
  function sources(p) {
    const g = p.progression,
      out = [
        { id: "base", name: "기본", kind: "base", stats: g.base },
        {
          id: "allocated",
          name: "포인트 배분",
          kind: "allocated",
          stats: g.allocated,
        },
      ];
    for (const a of g.absorbed) {
      const e = Essences.records.find((e) => e.id === a.species);
      out.push({
        id: a.id,
        name: e.name + " 정수",
        kind: "essence",
        stats: essenceStats(e),
        effect: e.effect,
        activeSkill: e.activeSkill,
      });
    }
    for (const itemId of Object.values(g.equipped)) {
      const item = g.inventory.find((i) => i.id === itemId);
      if (item.durability > 0) out.push({ ...item, kind: "equipment" });
    }
    return out;
  }
  function recalculate(actor) {
    const p = ensure(actor),
      g = p.progression;
    const wielded = g.inventory.find((i) => i.id === p.weaponState?.id);
    if (wielded && Number.isFinite(p.weaponState.durability))
      wielded.durability = Math.min(
        wielded.durability,
        p.weaponState.durability,
      );
    if(!wielded&&p.weaponState&&Number.isFinite(p.weaponState.durability)&&g.legacyWeapon?.weaponState?.id===p.weaponState.id)g.legacyWeapon.weaponState.durability=Math.min(g.legacyWeapon.weaponState.durability,p.weaponState.durability);
    const list = sources(p),
      stats = {};
    for (const source of list)
      for (const [key, value] of Object.entries(source.stats || {}))
        stats[key] = (stats[key] || 0) + value;
    const max = (stats.health ?? 0) * 100,
      maxMana = (stats.mana ?? 0) * 100;
    p.hp = Math.min(p.hp, max);
    p.mana = Math.min(p.mana, maxMana);
    p.stats = stats;
    p.max = max;
    p.maxMana = maxMana;
    p.combatStats = Stats.derived({ stats });
    p.statPoints = g.points;
    p.effectBonuses = clone(g.legacyEffects);
    p.armor = clone(g.legacyArmor);
    p.equipmentIds = [...g.legacyWeapon.equipmentIds];
    p.weaponType = g.legacyWeapon.weaponType;
    p.weaponState = clone(g.legacyWeapon.weaponState);
    p.abilitySourceIds = (p.progression?.absorbed||[]).map(a=>a.id);
    p.essenceSpecies = (p.progression?.absorbed||[]).map(a=>a.species);
    p.grantedAbilities = [];
    for (const source of list) {
      if (source.kind === "essence") {
        p.grantedAbilities.push({
          id: source.id + ":effect",
          sourceId: source.id,
          name: source.effect.name,
          description: source.effect.effect,
          kind: "essence-effect",
          ...(source.effect.runtime?{commonId:source.effect.runtime.id,execution:"ready"}:{}),
        });
        if (source.activeSkill)
          p.grantedAbilities.push({
            id: source.id + ":active",
            sourceId: source.id,
            name: source.activeSkill.name,
            description: source.activeSkill.effect,
            limits: source.activeSkill.limits,
            cost: source.activeSkill.cost,
            kind: "essence-active",
            execution: source.activeSkill.runtime?"ready":"pending-cost-and-mechanic",
            ...(source.activeSkill.runtime?{commonId:source.activeSkill.runtime.id}:{}),
          });
      }
      if (source.kind !== "equipment") continue;
      p.equipmentIds.push(source.id);
      for (const [key, value] of Object.entries(source.effects || {}))
        p.effectBonuses[key] = (p.effectBonuses[key] || 0) + value;
      for (const [part, armor] of Object.entries(source.armor || {}))
        if ((p.armor[part]?.damageReduction || 0) < armor.damageReduction)
          p.armor[part] = clone(armor);
      if (source.slot === "weapon") {
        p.weaponType = source.weaponType || "unarmed";
        p.weaponState = {
          id: source.id,
          durability: source.durability,
          max: source.maxDurability,
        };
      }
      for (const commonId of source.commonSkills || [])
        p.grantedAbilities.push({
          id: source.id + ":" + commonId,
          sourceId: source.id,
          commonId,
          kind: "equipment-skill",
        });
    }
    const broken = g.inventory.find(
      (i) => g.equipped.weapon === i.id && i.durability === 0,
    );
    if (broken) {
      p.weaponType = broken.weaponType || "unarmed";
      p.weaponState = {
        id: broken.id,
        durability: 0,
        max: broken.maxDurability,
      };
    }
    return p;
  }
  function grant(actor, item, receipt, now = 0) {
    if (!id(receipt)) fail("획득 사건 ID가 필요합니다.");
    if (!Number.isFinite(now) || now < 0) fail("세계 시간이 잘못되었습니다.");
    const p = ensure(actor),
      g = p.progression,
      signature = JSON.stringify(item),
      prior = g.receipts.find((r) => r.id === receipt);
    if (prior) {
      if (prior.signature !== signature)
        fail("같은 획득 사건의 내용이 다릅니다.");
      return recalculate(p);
    }
    const next = clone({ ...item, receipt });
    if (next.kind === "essence") {
      const e = Essences.records.find((e) => e.id === next.species);
      next.name = e?.name + " 정수";
      const createdAt = next.createdAt ?? now;
      if (!Number.isFinite(createdAt) || createdAt < 0 || createdAt > now)
        fail("정수 생성 시간이 잘못되었습니다.");
      next.createdAt = createdAt;
      next.expiresAt = createdAt + 30;
    }
    validateItem(next);
    if (
      g.inventory.some((i) => i.id === next.id) ||
      g.absorbed.some((i) => i.id === next.id)
    )
      fail("이미 존재하는 물품입니다.");
    g.inventory.push(next);
    g.receipts.push({ id: receipt, signature });
    return recalculate(p);
  }
  function apply(actor, action, now = 0) {
    const p = ensure(actor),
      g = p.progression;
    if (!Number.isFinite(now) || now < 0) fail("세계 시간이 잘못되었습니다.");
    if (action.type === "allocate") {
      const values = Stats.validateAllocation(action.values);
      let total = 0;
      for (const v of Object.values(values)) {
        if (!Number.isSafeInteger(v)) fail("배분은 정수 포인트만 가능합니다.");
        total += v;
      }
      if (total <= 0 || total > g.points)
        fail("사용 가능한 스탯 포인트가 부족합니다.");
      for (const [k, v] of Object.entries(values))
        g.allocated[k] = (g.allocated[k] || 0) + v;
      g.points -= total;
    } else if (action.type === "unequip") {
      if (!slots.includes(action.slot) || !g.equipped[action.slot])
        fail("장착한 장비가 없습니다.");
      delete g.equipped[action.slot];
    } else {
      const item = g.inventory.find((i) => i.id === action.itemId);
      if (!item) fail("소지하지 않은 물품입니다.");
      if (action.type === "equip") {
        if (item.kind !== "equipment" || item.durability <= 0)
          fail("장착할 수 없는 장비입니다.");
        if (
          (item.twoHanded && g.equipped.offhand) ||
          (item.slot === "offhand" &&
            g.inventory.find((i) => i.id === g.equipped.weapon)?.twoHanded)
        )
          fail("양손 무기와 보조 장비를 함께 장착할 수 없습니다.");
        g.equipped[item.slot] = item.id;
      } else if (action.type === "absorb") {
        if (item.kind !== "essence" || now >= item.expiresAt)
          fail("흡수할 수 없거나 소멸한 정수입니다.");
        const limit = Number.isInteger(p.essenceSlots) ? p.essenceSlots : 1;
        if (g.absorbed.length >= limit)
          fail("사용 가능한 정수 슬롯이 없습니다.");
        g.absorbed.push({
          id: item.id,
          species: item.species,
          absorbedAt: now,
        });
        g.inventory = g.inventory.filter((i) => i.id !== item.id);
      } else fail("지원하지 않는 성장 행동입니다.");
    }
    return recalculate(p);
  }
  function awardLevel(actor, newLevel, receipt) {
    const p = ensure(actor),
      g = p.progression,
      previous = p.level ?? 1;
    if (
      !id(receipt) ||
      !Number.isSafeInteger(newLevel) ||
      newLevel < 1 ||
      !Number.isSafeInteger(previous) ||
      previous < 1
    )
      fail("레벨 보상 형식이 잘못되었습니다.");
    const signature = "level:" + newLevel,
      old = g.receipts.find((r) => r.id === receipt);
    if (old) {
      if (old.signature !== signature)
        fail("같은 레벨 보상 사건의 내용이 다릅니다.");
      return recalculate(p);
    }
    if (newLevel <= previous) fail("이미 도달했거나 이전인 레벨입니다.");
    const points = (newLevel - previous) * 3;
    if (!Number.isSafeInteger(g.points + points))
      fail("포인트 계산 범위를 초과했습니다.");
    g.points += points;
    p.level = newLevel;
    g.receipts.push({ id: receipt, signature });
    return recalculate(p);
  }
  function damageEquipment(actor, itemId, amount) {
    const p = ensure(actor),
      item = p.progression.inventory.find((i) => i.id === itemId);
    if (
      !item ||
      item.kind !== "equipment" ||
      !Number.isFinite(amount) ||
      amount < 0
    )
      fail("내구도 변경이 잘못되었습니다.");
    item.durability = Math.max(0, item.durability - amount);
    return recalculate(p);
  }
  function breakdown(actor, now = 0) {
    const p = actor.progression ? recalculate(actor) : Stats.normalize(actor),
      list = p.progression
        ? sources(p)
        : [{ id: "base", name: "기본", kind: "base", stats: p.stats }],
      attack = Rules.effectiveAttack(p, "physical", now),
      magic = Rules.effectiveAttack(p, "magic", now),
      defense = Rules.effectiveDefense(p, "physical", now),
      resistance = Rules.effectiveDefense(p, "magic", now),
      effective = {
        ...p.stats,
        strength: attack,
        magicAttack: magic,
        defense,
        magicResistance: resistance,
      };
    return {
      temporaryEffects: Rules.strongest(p.commonStatuses, now).map((s) => ({
        key: s.key,
        potency: s.potency,
        until: s.until,
      })),
      fields: Stats.fields.map((f) => ({
        ...f,
        known: p.stats[f.key] !== undefined,
        total: p.stats[f.key],
        effective: effective[f.key],
        sources: list
          .filter((x) => x.stats?.[f.key] !== undefined)
          .map((x) => ({ id: x.id, name: x.name, value: x.stats[f.key] })),
        temporary: (effective[f.key] || 0) - (p.stats[f.key] || 0),
      })),
      effects: p.effectBonuses,
      abilities: p.grantedAbilities || [],
      points: p.progression?.points ?? p.statPoints ?? 0,
      slots: p.essenceSlots ?? 1,
      absorbed: p.progression?.absorbed.length || 0,
    };
  }
  return {
    slots,
    ensure,
    validate,
    recalculate,
    grant,
    apply,
    damageEquipment,
    awardLevel,
    breakdown,
    sources,
  };
});
