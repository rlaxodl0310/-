const t = require("node:test"),
  a = require("node:assert/strict"),
  A = require("../ui/adventure/engine.js"),
  R = require("../ui/combat/rules.js"),
  { initial } = require("../electron/story-director.cjs"),
  { createCombat } = require("../ui/story/combat.js");
function seedFor(kind) {
  for (let i = 0; i < 1000000; i++) {
    const id = "rare-proof-" + i,
      roll = R.rng(R.hash("drop:" + id + ":0")).next();
    if (
      kind === "essence"
        ? roll < A.policy.essenceChance
        : roll >= A.policy.essenceChance &&
          roll < A.policy.essenceChance + A.policy.soulStoneChance
    )
      return id;
  }
  throw Error("No deterministic rare case");
}
function win(id) {
  const old = {
    ...initial(),
    era: "fantasy",
    location: "north-city-01",
    combat: createCombat(["goblin"], "chat", "test"),
  };
  old.combat.id = id;
  const next = {
    ...old,
    combat: {
      ...old.combat,
      status: "won",
      enemies: old.combat.enemies.map((e) => ({ ...e, hp: 0 })),
    },
  };
  return { old, next, state: A.observe(old, next) };
}
t(
  "essence is50 times rarer; soul stone has a slightly higher marginal chance",
  () => {
    a.equal(A.policy.essenceChance, 0.0001);
    a.equal(A.policy.soulStoneChance, 0.00015);
    a.equal(0.005 / A.policy.essenceChance, 50);
    a(A.policy.soulStoneChance > A.policy.essenceChance);
    a(A.policy.soulStoneChance < 2 * A.policy.essenceChance);
    a.equal(A.policy.stoneChance, 0.2);
  },
);
t(
  "soul stone is deterministic, picked up once, species-bound and survives30 minutes and save/reload",
  () => {
    const { old, next, state } = win(seedFor("soul")),
      loot = state.adventure.ground[0];
    a(loot.soulStone);
    a.equal(loot.essence, false);
    a.equal(loot.dropVersion, 2);
    a.deepEqual(A.observe(old, next).adventure.ground, state.adventure.ground);
    let s = A.apply(
      { ...state, minutes: 31 },
      { type: "pickup", lootId: loot.id },
    );
    const soul = s.adventure.inventory.find((i) => i.kind === "soul-stone");
    a.equal(soul.species, "goblin");
    a.equal(soul.stars, 1);
    a.equal(soul.quantity, 1);
    s = A.ensure({ ...JSON.parse(JSON.stringify(s)), minutes: 100000 });
    a.equal(
      s.adventure.inventory.find((i) => i.kind === "soul-stone").quantity,
      1,
    );
    a.throws(() => A.apply(s, { type: "pickup", lootId: loot.id }));
  },
);
t(
  "old generated loot is preserved without rerolling or retroactive soul stones",
  () => {
    const { state } = win(seedFor("essence"));
    state.adventure.ground[0].essence = true;
    delete state.adventure.ground[0].soulStone;
    delete state.adventure.ground[0].dropVersion;
    const s = A.ensure(state);
    a.equal(s.adventure.ground[0].essence, true);
    a.equal(s.adventure.ground[0].soulStone, false);
    a.equal(s.adventure.ground[0].dropVersion, 1);
    a.equal(state.adventure.ground[0].soulStone, undefined);
  },
);
t(
  "soul stones are not consumed or counted as material when a delivery quest is settled",
  () => {
    let { state: s } = win(seedFor("soul"));
    s = A.apply(s, { type: "pickup", lootId: s.adventure.ground[0].id });
    s = A.apply(s, { type: "refresh" });
    const q = s.adventure.quests.find((q) => q.type === "supply");
    s = A.apply(s, { type: "accept", questId: q.id });
    a.equal(A.ready(s, q), false);
    const old = { ...s, combat: createCombat(["goblin"], "chat", "second") };
    old.combat.id="material-only-fixed";
    const next = {
      ...old,
      combat: {
        ...old.combat,
        status: "won",
        enemies: old.combat.enemies.map((e) => ({ ...e, hp: 0 })),
      },
    };
    s = A.observe(old, next);
    const loot = s.adventure.ground.find((l) => !l.claimed);
    s = A.apply(s, { type: "pickup", lootId: loot.id });
    a(A.ready(s, q));
    s = A.apply(s, { type: "submit", questId: q.id });
    a.equal(s.adventure.economy.inventory.monster_scrap, 0);
    a.equal(
      s.adventure.inventory.find(
        (i) => i.kind === "soul-stone" && i.species === "goblin",
      ).quantity,
      1,
    );
  },
);
