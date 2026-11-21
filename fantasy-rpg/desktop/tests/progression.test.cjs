const t = require("node:test"),
  a = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path");
const G = require("../ui/progression/model.js"),
  R = require("../ui/skills/resources.js"),
  Rules = require("../ui/combat/rules.js"),
  P = require("../electron/progression.cjs"),
  S = require("../ui/skills/system.js"),
  Common = require("../ui/skills/common.js"),
  { StoryDirector, initial } = require("../electron/story-director.cjs"),
  Battle = require("../ui/realtime/engine.js");
const player = () => ({
  ...R.create(2, 3),
  hp: 120,
  mana: 170,
  stats: {
    health: 2,
    mana: 3,
    strength: 10,
    agility: 12,
    defense: 5,
    magicAttack: 8,
    magicResistance: 4,
  },
  statPoints: 3,
});
const gear = (id, slot = "weapon", stats = { strength: 5 }) => ({
  id,
  name: id,
  kind: "equipment",
  category: slot.startsWith("accessory")
    ? "artifact"
    : slot === "weapon"
      ? "weapon"
      : "armor",
  slot,
  weaponType: slot === "weapon" ? "sword" : undefined,
  stats,
  durability: 50,
  maxDurability: 50,
});
const give = (p, item, n = 0) => G.grant(p, item, "reward-" + item.id, n);
t(
  "sources recalculate from immutable base, not the previous total; allocation is bounded",
  () => {
    let p = give(player(), gear("sword"));
    p = G.apply(p, { type: "allocate", values: { strength: 2, health: 1 } });
    p = G.apply(p, { type: "equip", itemId: "sword" });
    a.equal(p.stats.strength, 17);
    a.equal(p.max, 300);
    a.equal(p.hp, 120);
    for (let i = 0; i < 20; i++) p = G.recalculate(p);
    a.equal(p.stats.strength, 17);
    a.equal(p.progression.base.strength, 10);
    a.equal(p.statPoints, 0);
    a.throws(() => G.apply(p, { type: "allocate", values: { mana: 1 } }));
    a.throws(() =>
      G.apply(p, { type: "allocate", values: { vitalAccuracy: 1 } }),
    );
    a.throws(() => G.apply(p, { type: "allocate", values: { mana: 0.5 } }));
    const f = G.breakdown(p).fields.find((x) => x.key === "strength");
    a.deepEqual(
      f.sources.map((s) => s.value),
      [10, 2, 5],
    );
  },
);
t(
  "replacement removes only the previous item and preserves other slots and base armor",
  () => {
    let p = player();
    p.armor = { head: { damageReduction: 0.1 } };
    for (const item of [
      gear("sword"),
      gear("sword2", "weapon", { strength: 9 }),
      {
        ...gear("pad", "shoulder", { defense: 3 }),
        armor: { shoulder: { damageReduction: 0.33 } },
      },
    ])
      p = give(p, item);
    p = G.apply(p, { type: "equip", itemId: "sword" });
    p = G.apply(p, { type: "equip", itemId: "pad" });
    p = G.apply(p, { type: "equip", itemId: "sword2" });
    a.equal(p.stats.strength, 19);
    a.equal(p.stats.defense, 8);
    a.equal(p.armor.shoulder.damageReduction, 0.33);
    p = G.apply(p, { type: "unequip", slot: "weapon" });
    a.equal(p.stats.strength, 10);
    a.equal(p.weaponType, "unarmed");
    a.equal(p.stats.defense, 8);
    p = G.apply(p, { type: "unequip", slot: "shoulder" });
    a.equal(p.armor.shoulder, undefined);
    a.equal(p.armor.head.damageReduction, 0.1);
  },
);
t(
  "HP and MP gear changes do not heal, resurrect or refill on repeated swaps",
  () => {
    let p = give(player(), gear("ring", "accessory1", { health: 2, mana: 2 }));
    p = G.apply(p, { type: "equip", itemId: "ring" });
    a.equal(p.max, 400);
    a.equal(p.maxMana, 500);
    a.equal(p.hp, 120);
    a.equal(p.mana, 170);
    p.hp = 0;
    p.mana = 450;
    p = G.apply(p, { type: "unequip", slot: "accessory1" });
    a.equal(p.hp, 0);
    a.equal(p.mana, 300);
    p = G.apply(p, { type: "equip", itemId: "ring" });
    a.equal(p.hp, 0);
    a.equal(p.mana, 300);
  },
);
t(
  "owned essence is consumed once, fixed stats and abilities are granted, slots and 30 minute expiry are checked",
  () => {
    let p = give(
      player(),
      { id: "essence1", kind: "essence", species: "lairon" },
      8,
    );
    p = G.apply(p, { type: "absorb", itemId: "essence1" }, 37.9);
    a.equal(p.stats.strength, 25);
    a.equal(p.stats.defense, 26);
    a.equal(p.stats.health, 11);
    a.equal(p.max, 1100);
    a.equal(p.hp, 120);
    a.equal(p.progression.inventory.length, 0);
    a.equal(p.grantedAbilities.length, 2);
    a.equal(p.grantedAbilities[1].name, "아이언 러시");
    a.equal(p.grantedAbilities[1].execution, "pending-cost-and-mechanic");
    a.throws(() => G.apply(p, { type: "absorb", itemId: "essence1" }, 37.9));
    p = give(p, { id: "essence2", kind: "essence", species: "slime" }, 38);
    a.throws(
      () => G.apply(p, { type: "absorb", itemId: "essence2" }, 38),
      /슬롯/,
    );
    let q = give(
      player(),
      { id: "expired", kind: "essence", species: "slime" },
      8,
    );
    a.throws(
      () => G.apply(q, { type: "absorb", itemId: "expired" }, 38),
      /소멸/,
    );
    a.equal(q.progression.inventory.length, 1);
  },
);
t(
  "reward receipts prevent duplicate items and cannot be reused for different contents",
  () => {
    const item = gear("a");
    let p = give(player(), item);
    p = give(p, item);
    a.equal(p.progression.inventory.length, 1);
    a.throws(() => give(p, { ...item, stats: { strength: 100 } }));
    a.throws(() => G.apply(p, { type: "equip", itemId: "missing" }));
    a.equal(p.stats.strength, 10);
  },
);
t(
  "broken gear loses bonuses, armor and granted skills; combat durability cannot be reset by reading",
  () => {
    let p = give(player(), gear("a"));
    p = G.apply(p, { type: "equip", itemId: "a" });
    p.weaponState.durability = 0;
    p = G.recalculate(p);
    a.equal(p.stats.strength, 10);
    a.equal(p.weaponState.durability, 0);
    a(!p.equipmentIds.includes("a"));
    a.equal(p.progression.inventory[0].durability, 0);
    a.throws(() => G.apply(p, { type: "equip", itemId: "a" }));
  },
);
t(
  "equipment skills deactivate on removal without erasing mastery; independent learned skills remain",
  () => {
    const commonId = Common.records[0].id;
    let state = {
      player: give(player(), { ...gear("a"), commonSkills: [commonId] }),
      skillBook: S.empty(),
    };
    state.player = G.apply(state.player, { type: "equip", itemId: "a" });
    state = P.sync(state);
    const sk = state.skillBook.skills[0];
    state.skillBook.progress[sk.id] = { xp: 18, uses: 3, encounters: {} };
    state.player = G.apply(state.player, { type: "unequip", slot: "weapon" });
    state = P.sync(state);
    a.equal(state.skillBook.skills.length, 0);
    a.throws(() => S.prepare(state.skillBook, sk.id, { actorId: "taei" }));
    state.player = G.apply(state.player, { type: "equip", itemId: "a" });
    state = P.sync(state);
    a.equal(state.skillBook.progress[sk.id].xp, 18);
    state.skillBook = S.learnCommon(state.skillBook, commonId, "taei", {
      kind: "teacher",
      eventId: "teacher-event",
    }).book;
    state.player = G.apply(state.player, { type: "unequip", slot: "weapon" });
    state = P.sync(state);
    a.equal(state.skillBook.skills.length, 1);
    a.equal(state.skillBook.skills[0].progressionGranted, undefined);
  },
);
t(
  "temporary buffs are strongest-per-effect, capped once, separate from permanent sources",
  () => {
    let p = give(player(), gear("a"));
    p = G.apply(p, { type: "equip", itemId: "a" });
    p.commonStatuses = [
      { key: "attack", effectKey: "x", potency: 0.5, until: 5 },
      { key: "attack", effectKey: "x", potency: 0.2, until: 8 },
      { key: "strength", effectKey: "y", potency: 0.3, until: 10 },
    ];
    const f = G.breakdown(p, 1).fields.find((f) => f.key === "strength");
    a.equal(f.total, 15);
    a.equal(f.effective, 27);
    a.equal(p.stats.strength, 15);
    a.equal(
      G.breakdown(p, 11).fields.find((f) => f.key === "strength").effective,
      15,
    );
    a.equal(Rules.effectiveAttack(p, "physical", 1), 27);
  },
);
t(
  "equipped weapon, stats and resources are passed to the real time engine",
  () => {
    let p = give(player(), gear("a"));
    p = G.apply(p, { type: "equip", itemId: "a" });
    const b = new Battle({ resources: p });
    a.equal(b.units[0].equipmentType, "sword");
    a.equal(b.units[0].weaponState.id, "a");
    a.equal(b.units[0].combatStats.attack, 15);
    a(b.units[0].equipmentIds.includes("a"));
    a.equal(b.units[0].mana, 170);
  },
);
t(
  "two-handed conflicts, invalid item stats and duplicate owned IDs are rejected",
  () => {
    let p = give(player(), { ...gear("a"), twoHanded: true });
    p = give(p, gear("shield", "offhand", { defense: 2 }));
    p = G.apply(p, { type: "equip", itemId: "a" });
    a.throws(() => G.apply(p, { type: "equip", itemId: "shield" }), /양손/);
    a.throws(() => give(player(), gear("bad", "weapon", { intelligence: 99 })));
    p.progression.inventory.push(p.progression.inventory[0]);
    a.throws(() => G.recalculate(p), /중복/);
  },
);
t(
  "director progression actions save atomically with replay safety and block combat or forged data",
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "growth-"));
    try {
      const d = new StoryDirector(path.join(dir, "story.json"), {});
      let state = {
        ...initial(),
        era: "fantasy",
        player: give(player(), gear("a")),
      };
      await d.save(state);
      const req = {
        revision: 0,
        requestId: "equip-request-01",
        action: { type: "equip", itemId: "a" },
      };
      state = await d.progressionAction(req);
      a.equal(state.player.stats.strength, 15);
      a.equal(state.revision, 1);
      a.deepEqual(await d.progressionAction(req), state);
      a.equal((await d.read()).player.stats.strength, 15);
      await a.rejects(
        d.progressionAction({
          ...req,
          action: { type: "allocate", values: { strength: 1 } },
        }),
        /내용/,
      );
      await a.rejects(
        d.progressionAction({
          revision: 1,
          requestId: "forged-request01",
          action: { type: "equip", itemId: "a", stats: { strength: 999 } },
        }),
        /형식/,
      );
      a.deepEqual(await d.read(), state);
      state.combat = { mode: "chat", status: "playing" };
      await d.save(state);
      await a.rejects(
        d.progressionAction({
          revision: 1,
          requestId: "during-combat01",
          action: { type: "unequip", slot: "weapon" },
        }),
        /전투/,
      );
      a.equal((await d.read()).player.stats.strength, 15);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t(
  "save/reload and repeated sync preserve sources, learned skills, HP/MP and frozen reward definitions",
  () => {
    let state = { player: give(player(), gear("a")), skillBook: S.empty() };
    state.player = G.apply(state.player, { type: "equip", itemId: "a" });
    for (let i = 0; i < 10; i++)
      state = P.sync(JSON.parse(JSON.stringify(state)));
    a.equal(state.player.stats.strength, 15);
    a.equal(state.player.hp, 120);
    a.equal(state.player.mana, 170);
    a.deepEqual(R.normalise(state.player), state.player);
  },
);
t(
  "weapon breaks during battle: bonuses and source IDs are removed before later hits, skill cannot be cast",
  () => {
    const commonId = Common.records[0].id;
    let state = {
      player: give(player(), {
        ...gear("battle-weapon"),
        commonSkills: [commonId],
      }),
      skillBook: S.empty(),
    };
    state.player = G.apply(state.player, {
      type: "equip",
      itemId: "battle-weapon",
    });
    state = P.sync(state);
    const battle = new Battle({
      resources: state.player,
      skillBook: state.skillBook,
    });
    const u = battle.units[0];
    battle.wearWeapon(u, 50);
    a.equal(u.stats.strength, 10);
    a.equal(u.weaponState.durability, 0);
    a(!u.equipmentIds.includes("battle-weapon"));
    a.throws(
      () =>
        S.prepare(battle.skillBook, battle.skillBook.skills[0].id, {
          actorId: "taei",
          now: 0,
          hp: 120,
          mana: 170,
          equipmentIds: u.equipmentIds,
        }),
      /장비/,
    );
  },
);
t(
  "trusted reward hookup requires a recorded event; renderer actions cannot create owned items",
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "growth-reward-"));
    try {
      const d = new StoryDirector(path.join(dir, "story.json"), {});
      await d.save({ ...initial(), era: "fantasy" });
      await a.rejects(d.grantReward([gear("a")], "unknown-event"), /근거/);
      await d.grantReward([gear("a")], "seed");
      a.equal((await d.read()).player.progression.inventory.length, 1);
      await d.grantReward([gear("a")], "seed");
      a.equal((await d.read()).player.progression.inventory.length, 1);
      await a.rejects(
        d.progressionAction({
          requestId: "fake-reward-123",
          revision: 2,
          action: { type: "grant", item: gear("b") },
        }),
        /형식/,
      );
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t(
  "learning a previously removed equipment skill independently also retains its prior mastery",
  () => {
    const id = Common.records[0].id;
    let state = {
      player: give(player(), { ...gear("a"), commonSkills: [id] }),
      skillBook: S.empty(),
    };
    state.player = G.apply(state.player, { type: "equip", itemId: "a" });
    state = P.sync(state);
    const skillId = state.skillBook.skills[0].id;
    state.skillBook.progress[skillId] = { xp: 18, uses: 3, encounters: {} };
    state.player = G.apply(state.player, { type: "unequip", slot: "weapon" });
    state = P.sync(state);
    state.skillBook = S.learnCommon(state.skillBook, id, "taei", {
      kind: "teacher",
      eventId: "new-teacher",
    }).book;
    state = P.sync(state);
    a.equal(state.skillBook.progress[skillId].xp, 18);
    a.equal(state.skillBook.skills[0].progressionGranted, undefined);
    a.equal(state.skillBook.dormantProgressionSkills[skillId], undefined);
  },
);
