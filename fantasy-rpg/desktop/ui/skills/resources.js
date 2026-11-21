(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(require("../combat/stats.js"));
  else r.ResourceRules = f(r.StatRules);
})(globalThis, (Stats) => {
  "use strict";
  const valid = (n) => Number.isFinite(n) && n > 0 && n <= 10000;
  const stat = (n) => Number.isFinite(n) && n >= 0 && n <= 10000;
  function normalise(input = {}) {
    const p = Stats.normalize(input);
    if (p.resourceVersion === 2) {
      if (!stat(p.stats?.health) || !stat(p.stats?.mana))
        throw Error("체력/마나 스탯이 잘못되었습니다.");
      const hp = p.stats.health * 100,
        mp = p.stats.mana * 100;
      if (
        p.max !== hp ||
        p.maxMana !== mp ||
        !Number.isFinite(p.hp) ||
        !Number.isFinite(p.mana) ||
        p.hp < 0 ||
        p.hp > hp ||
        p.mana < 0 ||
        p.mana > mp
      )
        throw Error("스탯과 HP/MP 기록이 일치하지 않습니다.");
      return p;
    }
    const health = stat(p.stats?.health)
        ? p.stats.health
        : valid(p.max)
          ? p.max / 100
          : 1,
      mana = stat(p.stats?.mana)
        ? p.stats.mana
        : valid(p.maxMana)
          ? p.maxMana / 100
          : 1;
    const hp = health * 100,
      mp = mana * 100,
      oldHP = valid(p.max) ? p.max : 100,
      oldMP = valid(p.maxMana) ? p.maxMana : 24;
    return {
      ...p,
      stats: { ...p.stats, health, mana },
      max: hp,
      maxMana: mp,
      hp: Math.max(
        0,
        Math.min(hp, ((Number.isFinite(p.hp) ? p.hp : oldHP) / oldHP) * hp),
      ),
      mana: Math.max(
        0,
        Math.min(mp, ((Number.isFinite(p.mana) ? p.mana : oldMP) / oldMP) * mp),
      ),
      resourceVersion: 2,
    };
  }
  function create(health = 1, mana = 1) {
    return normalise({ stats: { health, mana } });
  }
  return { normalise, create, perPoint: 100 };
});
