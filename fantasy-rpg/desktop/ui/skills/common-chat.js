(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(
      require("../realtime/engine.js"),
      require("./common.js"),
      require("../combat/rules.js"),
    );
  else r.CommonChat = f(r.RealTimeBattle, r.CommonSkills, r.CombatRules);
})(globalThis, (Battle, C, Rules) => {
  "use strict";
  const clone = (v) => JSON.parse(JSON.stringify(v)),
    distPoint = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function setup(state, book) {
    const c = state.combat,
      p = state.player,
      stats = Object.fromEntries(
        c.enemies.map((e) => [e.kind, { hp: e.max, name: e.kind }]),
      ),
      b = new Battle({
        monsters: c.monsters,
        stats,
        skillBook: book,
        resources: p,
        manaRegen: false,
        weapon:
          {
            unarmed: "gauntlet",
            sword: "gauntlet",
            spear: "gauntlet",
            shield: "gauntlet",
            bow: "bow",
            focus: "magic",
          }[p.weaponType] || "gauntlet",
        weaponType: p.weaponType || "unarmed",
      });
    const key = state.era + ":" + state.location,
      objects = state.actionWorld?.locations?.[key]?.objects || [];
    b.props = objects.map((o) => ({ ...clone(o), x: 5 + o.distance, y: 8 }));
    b.units[0].objectTarget =
      state.skillObjectTarget ||
      b.props.find((o) => !o.fixed && o.weight === "light")?.id;
    b.encounterId = c.id;
    b.serial = c.commonState?.serial || 0;
    Object.assign(b.units[0], {
      level: p.level || 1,
      aimPart: p.aimPart || "torso",
      stats:Rules.baseStats(p),effectBonuses:Rules.normalizeActor(p).effectBonuses,agility:Rules.baseStats(p).agility??b.units[0].agility,combatStats: Rules.actorStats(p),
      armor: clone(p.armor || {}),
    });
    b.units[0].x = 5;
    b.units[0].y = 8;
    b.units[0].sheathed = p.sheathed ?? true;
    if (p.weaponState) b.units[0].weaponState = clone(p.weaponState);
    if (Number.isFinite(p.stamina)) b.units[0].stamina = p.stamina;
    for (const [i, e] of c.enemies.entries()) {
      const u = b.units[i + 1];
      Object.assign(u, {
        level: e.level || 1,
        stats:Rules.baseStats(e),effectBonuses:Rules.normalizeActor(e).effectBonuses,agility:Rules.stat(e,"agility",u.agility),combatStats: Rules.actorStats(e),
        armor: clone(e.armor || {}),
      });
      u.hp = e.hp;
      u.max = e.max;
      u.x = 5 + c.distance + (i % 2) * 0.5;
      u.y = 8 + Math.floor(i / 2) * 0.7;
      u.speed = 0;
      u.cooldown = 1e8;
    }
    if (c.commonState) {
      for (const saved of c.commonState.units) {
        const u = b.units.find((u) => u.id === saved.id);
        if (u) {
          u.commonStatuses = clone(saved.statuses);
          u.controlHistory = clone(saved.controlHistory || {});
          if (u.id !== "taei") u.mana = saved.mana ?? u.mana;
          u.supportTarget = saved.supportTarget;
        }
      }
      if (c.commonState.rngState)
        b.formulaRng = Rules.rng(c.commonState.rngState);
      b.time =
        (c.commonState.time || 0) +
        (Number.isFinite(c.commonState.captureClock)
          ? Math.max(0, b.skillBook.clock - c.commonState.captureClock)
          : 0);
      b.bloodTrails = clone(c.commonState.bloodTrails || []);
      b.props = clone(c.commonState.props || b.props);
      b.commonFields = clone(c.commonState.fields || []);
      b.healingOverTime = clone(c.commonState.healingOverTime || []);
      for (const ghost of c.commonState.illusions || [])
        b.units.push(clone(ghost));
    }
    b.skillStart = b.skillBook.clock - b.time;
    return b;
  }
  function resolve(
    state,
    book,
    skill,
    castId,
    target = 0,
    basicIntent = null,
    tactical = {},
  ) {
    const previousCombat = state.combat,
      utility = state.combat?.status !== "playing";
    if (utility)
      state = {
        ...state,
        combat: {
          id: "utility-" + castId,
          mode: "chat",
          status: "playing",
          monsters: [],
          enemies: [],
          distance: 0,
          round: 0,
          commonState: state.skillUtilityState || state.combat?.commonState,
        },
      };
    const key = state.era + ":" + state.location,
      b = setup(state, book),
      p = b.units[0],
      c = clone(state.combat),
      t =
        b.units.find((u) => u.id === "enemy-" + target && u.hp > 0) ||
        b.living("enemy")[0];
    b.selected = t?.id;
    const start = b.time,
      oldHP = p.hp,
      oldMana = p.mana;
    let escaped = false,
      note = "";
    if (skill) {
      const out = b.castSkill(p, skill.id, t);
      if (!out.ok) throw Error(out.error);
      note = skill.name + " 실제 실행";
    } else if (basicIntent === "attack") {
      if (c.distance > 1) {
        c.distance--;
        for (const u of b.living("enemy")) u.x = Math.max(p.x + 1, u.x - 1);
        note = "타격 거리에 접근했다.";
      } else b.startAttack(p);
    } else if (basicIntent === "defend") {
      p.braceUntil = b.time + 3;
      note = "다음 물리 충격에 대비했다.";
    } else if (["move", "flee"].includes(basicIntent)) {
      if (basicIntent === "flee" && c.distance >= 3) {
        escaped = true;
        c.status = "escaped";
      } else c.distance = Math.min(4, c.distance + 2);
      for (const u of b.living("enemy")) u.x = p.x + c.distance;
    }
    for (let i = 0; i < 100; i++) {
      if (utility && p.hp > 0) b.status = "playing";
      b.step(0.02);
    }
    if (!escaped && b.living("enemy").length && p.hp > 0) {
      const actor =
        b.living("enemy")[((c.round || 0) + 1) % b.living("enemy").length];
      if (tactical.delayEnemy) note += " · 적이 우회로를 찾는다.";
      else if (b.hasStatus(actor, "root") || b.hasStatus(actor, "airborne"))
        note += " · 구속된 적이 움직임을 되찾으려 한다.";
      else if (c.distance > 1 && !["draven", "noxvern"].includes(actor.kind)) {
        c.distance--;
        note += " · 적이 거리를 좁힌다.";
      } else {
        b.damage(actor, p, state.enemyDamage?.[actor.kind] || 12, "gauntlet");
        note += " · 적이 반격한다.";
      }
    }
    const outgoing = (b.formulaLog || [])
        .filter((e) => e.actor === "taei")
        .reduce((n, e) => n + e.damage, 0),
      incoming = (b.formulaLog || [])
        .filter((e) => e.target === "taei")
        .reduce((n, e) => n + e.damage, 0);

    c.round = (c.round || 0) + 1;
    c.enemies = c.enemies.map((e, i) => ({
      ...e,
      hp: b.units.find((u) => u.id === "enemy-" + i)?.hp ?? e.hp,
    }));
    if (!c.enemies.some((e) => e.hp > 0)) c.status = "won";
    if (p.hp <= 0) c.status = "lost";
    c.commonState = {
      bloodTrails: clone(b.bloodTrails || []),
      props: clone(b.props || []),
      serial: b.serial,
      rngState: b.formulaRng?.state || Rules.hash(b.encounterId),
      captureClock: b.skillBook.clock,
      time: b.time,
      fields: clone(b.commonFields || []),
      healingOverTime: clone(b.healingOverTime || []),
      units: b.units
        .filter((u) => u.kind !== "illusion")
        .map((u) => ({
          id: u.id,
          statuses: clone(u.commonStatuses || []),
          controlHistory: clone(u.controlHistory || {}),
          mana: u.mana,
          weaponState: u.weaponState ? clone(u.weaponState) : undefined,
          stamina: u.stamina,
        })),
      illusions: clone(
        b.units.filter((u) => u.kind === "illusion" && u.hp > 0),
      ),
    };
    c.commonBook = b.skillBook;
    const player = {
      ...state.player,
      hp: p.hp,
      mana: p.mana,
      sheathed: p.sheathed,
      weaponState: p.weaponState ? clone(p.weaponState) : undefined,
      stamina: p.stamina,
    };
    const resolution = {
      engine: "common",
      formulaEvents: [...(b.formulaLog || []), ...(b.healingLog || [])],
      discoveredTrail: clone(b.revealedTrail || []),
      objectChanges: clone(b.props || []).filter(
        (p) => p.moved || p.vibratingUntil,
      ),
      activeStatuses: b.units
        .filter((u) => u.hp > 0)
        .map((u) => ({
          id: u.id,
          statuses: b
            .statuses(u)
            .map((s) => ({ key: s.key, remaining: s.until - b.time })),
        })),
      intent: basicIntent || "skill",
      outgoing,
      incoming,
      healed: (b.healingLog || [])
        .filter((e) => e.target === p.id)
        .reduce((n, e) => n + e.amount, 0),
      escaped,
      enemyResponse: note,
      note,
      manaSpent: oldMana - p.mana,
      ...(skill
        ? { skillId: skill.id, skillName: skill.name, visual: skill.visual }
        : {}),
    };
    const actionWorld = clone(
      state.actionWorld || { locations: {}, actors: {} },
    );
    if (actionWorld.locations?.[key])
      for (const o of actionWorld.locations[key].objects) {
        const prop = b.props.find((p) => p.id === o.id);
        if (prop) {
          o.distance = Math.min(4, Math.round(distPoint(prop, p)));
          o.moved = prop.moved || o.moved;
          if (prop.vibratingUntil) o.vibratingUntil = prop.vibratingUntil;
        }
      }
    return {
      player,
      combat: utility ? previousCombat : c,
      utilityState: utility ? c.commonState : undefined,
      skillBook: b.skillBook,
      resolution,
      actionWorld,
    };
  }
  return { resolve };
});
