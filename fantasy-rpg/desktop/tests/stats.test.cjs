const test = require("node:test"),
  a = require("node:assert/strict");
const S = require("../ui/combat/stats.js"),
  R = require("../ui/combat/rules.js"),
  Resources = require("../ui/skills/resources.js"),
  Battle = require("../ui/realtime/engine.js"),
  World = require("../ui/world/rules.js");
const fields = [
  "strength",
  "agility",
  "defense",
  "magicAttack",
  "magicResistance",
  "health",
  "mana",
];
const hit = (source, target = {}, extra = {}) =>
  R.resolveHit(
    { source, target, basePower: 0, coefficient: 1, ...extra },
    () => 0.999,
  );
test("only the seven confirmed stats can be allocated; vital accuracy is not a base stat", () => {
  a.deepEqual(
    S.fields.map((f) => f.key),
    fields,
  );
  a.deepEqual(
    World.canon.stats,
    S.fields.map((f) => f.name),
  );
  a.deepEqual(S.validateAllocation({ strength: 2, mana: 3 }), {
    strength: 2,
    mana: 3,
  });
  for (const key of ["vitalAccuracy", "intelligence", "attack", "healingPower"])
    a.throws(() => S.validateAllocation({ [key]: 1 }));
  for (const v of [-1, Infinity, NaN, "3"])
    a.throws(() => S.validateAllocation({ strength: v }));
});
test("physical and magical attacks and defenses are independent without fallback", () => {
  const source = { stats: { strength: 100, magicAttack: 40 } },
    target = { stats: { defense: 100, magicResistance: 300 } };
  a.equal(hit(source, target).hpDamage, 50);
  a.equal(hit(source, target, { damageType: "magic" }).hpDamage, 10);
  a.equal(
    hit({ stats: { strength: 100 } }, target, { damageType: "magic" }).hpDamage,
    0,
  );
  a.equal(
    hit(
      { stats: { magicAttack: 100 } },
      { stats: { defense: 900 } },
      { damageType: "magic" },
    ).effectiveDefense,
    0,
  );
  a.equal(hit({ stats: { magicAttack: 100 } }, target).hpDamage, 0);
});
test("legacy fields migrate once without adding or activating global vital accuracy", () => {
  const old = {
    stats: { strength: 7, attack: 40, intelligence: 6, magicResistance: 5 },
    combatStats: {
      attack: 9,
      magicDefense: 15,
      vitalAccuracy: 0.8,
      healingPower: 4,
    },
    mana: 12,
    hp: 50,
    max: 100,
  };
  const next = Resources.normalise(old);
  a.equal(next.stats.strength, 7);
  a.equal(next.stats.magicAttack, 6);
  a.equal(next.stats.magicResistance, 5);
  a.equal(next.mana, 50);
  a.equal(next.hp, 50);
  a.equal(next.effectBonuses.healingPower, 4);
  a.equal(next.legacyCombatOptions.vitalAccuracy, 0.8);
  a.equal(R.stat(next, "vitalAccuracy"), 0);
  a(!Object.hasOwn(next.stats, "intelligence"));
  a.deepEqual(Resources.normalise(next), next);
  a.equal(old.combatStats.vitalAccuracy, 0.8);
});
test("missing stats remain unknown and current MP never becomes the mana stat", () => {
  const p = Resources.normalise({ hp: 50, max: 100, mana: 12 });
  a.deepEqual(p.stats, { health: 1, mana: 1 });
  a.deepEqual(S.derived(p), {});
  a.deepEqual(S.base({ mana: 100 }), {});
  a.equal(Resources.normalise(Resources.create(3, 4)).maxMana, 400);
  a.equal(Resources.create(3, 4).max, 300);
  a.throws(() =>
    Resources.normalise({
      ...Resources.create(),
      stats: { health: 1, mana: 1, strength: -1 },
    }),
  );
});
test("vital accuracy is read from the skill, not the character or another skill", () => {
  const source = {
    stats: { strength: 100, vitalAccuracy: 10 },
    combatStats: { vitalAccuracy: 10 },
    vitalAccuracy: 10,
  };
  const target = { stats: { defense: 100 } };
  a.equal(hit(source, target).excessVital, 0);
  const r = hit(source, target, { skillOptions: { vitalAccuracy: 0.3 } });
  a(Math.abs(r.excessVital - 30 / 230) < 1e-12);
  a.equal(
    hit(source, target, { skillOptions: { vitalAccuracy: 0 } }).excessVital,
    0,
  );
});
test("saved agility drives realtime movement and preparation; saved health and mana drive capacity", () => {
  const make = (agility) =>
    new Battle({
      resources: Resources.normalise({
        stats: {
          strength: 9,
          agility,
          defense: 4,
          magicAttack: 6,
          magicResistance: 3,
          health: 2,
          mana: 3,
        },
      }),
    });
  const slow = make(10),
    fast = make(150);
  a.equal(fast.units[0].agility, 150);
  a.equal(fast.units[0].max, 200);
  a.equal(fast.units[0].maxMana, 300);
  a.deepEqual(fast.units[0].combatStats, {
    attack: 9,
    defense: 4,
    magicAttack: 6,
    magicDefense: 3,
  });
  slow.move(slow.units[0], 1, 0, 0.1);
  fast.move(fast.units[0], 1, 0, 0.1);
  a(fast.units[0].x > slow.units[0].x);
  slow.startAttack(slow.units[0]);
  fast.startAttack(fast.units[0]);
  a(fast.units[0].action.remaining < slow.units[0].action.remaining);
  a.deepEqual(
    R.context().statSystem.baseStats,
    S.fields.map((f) => f.name),
  );
});
