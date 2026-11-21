const test = require("node:test"),
  assert = require("node:assert/strict");
const R = require("../ui/combat/rules.js"),
  B = require("../ui/realtime/engine.js"),
  S = require("../ui/skills/system.js"),
  C = require("../ui/skills/common.js"),
  N = require("../ui/story/combat.js"),
  AI = require("../electron/combat-context.cjs");
const near = (x, y) => assert(Math.abs(x - y) < 1e-5, `${x} != ${y}`);
const plain = (extra = {}) =>
  R.resolveHit(
    {
      source: { level: 1 },
      target: { level: 1 },
      basePower: 100,
      coefficient: 0,
      ...extra,
    },
    () => 0.999999,
  );
test("level gap contributes 1% per higher attacker level and does not penalize lower attackers", () => {
  near(plain({ source: { level: 7 } }).hpDamage, 106);
  near(plain({ source: { level: 1 }, target: { level: 7 } }).hpDamage, 100);
  near(plain({ source: { level: 101 } }).levelMultiplier, 2);
});
test("each 33% hit is resolved independently; no rounding into a full 100% attack", () => {
  const hits = [0.33, 0.33, 0.33].map(
    (hitMultiplier) => plain({ hitMultiplier }).hpDamage,
  );
  assert.deepEqual(hits, [33, 33, 33]);
  near(
    hits.reduce((a, b) => a + b),
    99,
  );
});
test("critical and armor breach use independent random samples per contact", () => {
  const rolls = [0.1, 0.9, 0.9, 0.1, 0.1, 0.1];
  const random = () => rolls.shift();
  const args = {
    source: { attack: 100, criticalChance: 0.5, vitalAccuracy: 0.3 },
    target: { defense: 100, armor: { shoulder: { damageReduction: 0.33 } } },
    basePower: 100,
    coefficient: 0,
    part: "shoulder",
  };
  const hits = Array.from({ length: 3 }, () => R.resolveHit(args, random));
  assert.deepEqual(
    hits.map((h) => [h.critical, h.armorBreached]),
    [
      [true, false],
      [false, true],
      [true, true],
    ],
  );
  assert.equal(rolls.length, 0);
});
test("armor applies only at the actually struck part; breach never removes defense", () => {
  const args = {
    source: { stats: { strength: 100 } },
    vitalAccuracy: 0.3,
    target: { defense: 100, armor: { shoulder: { damageReduction: 0.33 } } },
    basePower: 100,
    coefficient: 0,
    part: "shoulder",
  };
  const fail = R.resolveHit(args, () => 0.999),
    pass = R.resolveHit(args, () => 0);
  near(fail.hpDamage, 33.5);
  near(pass.hpDamage, 50);
  near(pass.effectiveDefense, 100);
  assert(pass.armorBreached);
  const leg = plain({ ...args, part: "leg" });
  near(leg.excessVital, 30 / 230);
  near(leg.hpDamage, 50 * (1 + 30 / 230));
});
test("vital contest neutral zero stats is finite and proposed 130 vs133 gives48.8593% breach", () => {
  near(R.vitalContest(100, 100, 0.3, 1, 0.33).chance, 0.5 - 3 / 263);
  near(R.vitalContest(0, 0).chance, 0.5);
  assert.equal(plain().excessVital, 0);
});
test("percent and fixed penetration are both supported, ordered by explicit runtime policy and floored at zero", () => {
  near(R.penetration(100, 0.3, 20), 50);
  near(R.penetration(100, 0.3, 20, "flat-then-percent"), 56);
  near(R.penetration(10, 1, 500), 0);
});
const oneHit = (limit = 100) => ({
  id: "one",
  effectKey: "once",
  mode: "one-hit",
  capacity: limit,
  remaining: limit,
  until: 5,
});
test("one-hit shield breaks on overflow instead of blocking an unlimited high-grade attack", () => {
  const low = R.consumeShields([oneHit()], 60);
  assert.equal(low.hpDamage, 0);
  assert(low.blockEffects);
  assert(low.shields[0].used);
  const high = R.consumeShields([oneHit()], 300);
  near(high.hpDamage, 200);
  assert(!high.blockEffects);
});
test("one-hit shields block exactly one contact in a multihit and an empty contact consumes nothing", () => {
  let shields = [oneHit()];
  assert.equal(R.consumeShields(shields, 0).used.length, 0);
  const damage = [];
  for (let i = 0; i < 3; i++) {
    const r = R.consumeShields(shields, 80);
    shields = r.shields;
    damage.push(r.hpDamage);
  }
  assert.deepEqual(damage, [0, 80, 80]);
});
test("final armor mitigation happens before shield consumption; absorb shields are not implicit status immunity", () => {
  const shield = {
      id: "abs",
      effectKey: "magic",
      mode: "absorb",
      capacity: 75,
      remaining: 75,
      until: 8,
    },
    r = plain({
      target: { armor: { torso: { damageReduction: 0.33 } } },
      shields: [shield],
    });
  near(r.preShieldDamage, 67);
  near(r.hpDamage, 0);
  near(r.shields[0].remaining, 8);
  assert(!r.blockEffects);
});
test("shield grants obey50%HP cap, strongest same effect, no refill or duration extension by weaker effects", () => {
  let shields = R.grantShield(
    [],
    {
      ...oneHit(75),
      mode: "absorb",
      effectKey: "protect",
      source: "a",
      until: 8,
    },
    { maxHP: 100 },
  );
  near(shields[0].remaining, 50);
  shields = R.grantShield(
    shields,
    {
      ...oneHit(30),
      mode: "absorb",
      effectKey: "protect",
      source: "b",
      until: 12,
    },
    { maxHP: 100 },
  );
  assert.equal(R.activeShields(shields, 1)[0].capacity, 75);
  assert.equal(R.activeShields(shields, 1)[0].until, 8);
  assert.equal(R.activeShields(shields, 9)[0].capacity, 30);
  const broken = R.consumeShields(shields, 80, { now: 1, maxHP: 100 });
  near(broken.hpDamage, 30);
});
test("different absorb shields share a total cap; shrinking maximumHP reapplies the cap", () => {
  let shields = R.grantShield(
    [],
    { id: "a", effectKey: "a", mode: "absorb", capacity: 75, until: 8 },
    { maxHP: 500 },
  );
  shields = R.grantShield(
    shields,
    { id: "b", effectKey: "b", mode: "absorb", capacity: 250, until: 8 },
    { maxHP: 500 },
  );
  near(
    shields.reduce((a, b) => a + b.remaining, 0),
    250,
  );
  const r = R.consumeShields(shields, 300, { maxHP: 100 });
  near(r.absorbed, 50);
  near(r.hpDamage, 250);
});
test("same status uses the stronger instance and lets the still-live weaker instance return later", () => {
  const actor = {
    commonStatuses: [
      { key: "attack", potency: 0.1, until: 20 },
      { key: "attack", potency: 0.5, until: 5 },
      { key: "strength", potency: 0.8, until: 20 },
    ],
  };
  near(R.modifier(actor, ["attack", "strength"], 1, 1), 1);
  near(R.modifier(actor, ["attack"], 1, 6), 0.1);
});
test("damage and speed caps combine distinct effects additively rather than multiplying them", () => {
  const source = {
      commonStatuses: [
        { key: "attack", potency: 0.8, until: 20 },
        { key: "strength", potency: 0.8, until: 20 },
      ],
    },
    target = {
      commonStatuses: [
        { key: "damageReduction", potency: 0.6, until: 20 },
        {
          key: "damageReduction",
          effectKey: "second",
          potency: 0.6,
          until: 20,
        },
      ],
    };
  near(plain({ source, target, now: 1 }).hpDamage, 50);
});
test("healing scales byMP and grade, obeys caps, discards overheal and cannot revive dead targets through the adapter", () => {
  near(R.healAmount({ mana: 24, grade: 2, maxHP: 500, hp: 0 }).amount, 48);
  near(
    R.healAmount({
      mana: 24,
      grade: 2,
      bonus: 0.2,
      reduction: 0.3,
      maxHP: 500,
      hp: 0,
    }).amount,
    43.2,
  );
  near(
    R.healAmount({ mana: 24, grade: 2, bonus: 10, maxHP: 500, hp: 0 }).amount,
    96,
  );
  near(
    R.healAmount({ mana: 24, grade: 2, reduction: 10, maxHP: 500, hp: 0 })
      .amount,
    12,
  );
  near(R.healAmount({ mana: 24, grade: 2, maxHP: 500, hp: 490 }).amount, 10);
  assert.deepEqual([1, 3, 5, 8].map(R.efficiency), [2, 2.5, 3, 3.5]);
  near(R.shieldCapacity({ mana: 30, grade: 2 }), 75);
  near(R.shieldCapacity({ mana: 30, grade: 2, mode: "one-hit" }), 90);
  const b = new B();
  b.units[0].hp = 0;
  assert.equal(b.heal(b.units[0], b.units[0], { mana: 30, grade: 2 }), 0);
});
test("repeat hard control follows100/50/25/immunity and recovers after the runtime immunity window", () => {
  let history = {};
  const results = [];
  for (let i = 0; i < 4; i++) {
    const r = R.debuff(
      { key: "root", duration: 8, now: i * 0.1, history },
      () => 0,
    );
    results.push(r);
    history = r.history;
  }
  assert.deepEqual(
    results.slice(0, 3).map((r) => r.duration),
    [8, 4, 2],
  );
  assert(!results[3].applied);
  assert(
    R.debuff({ key: "root", duration: 8, now: 6, history }, () => 0).applied,
  );
});
test("dispel has category and grade limits and does not heal or erase unrelated wounds", () => {
  const statuses = [
    { key: "curse", category: "curse", grade: 5, until: 20 },
    { key: "poison", category: "poison", grade: 2, until: 20 },
    { key: "fracture", category: "injury", grade: 1, until: 20 },
  ];
  const r = R.dispel(statuses, {
    categories: ["poison", "curse"],
    maxGrade: 3,
    count: 3,
    now: 0,
  });
  assert.deepEqual(
    r.removed.map((s) => s.key),
    ["poison"],
  );
  assert.equal(statuses[1].until, 20);
});
test("real-time pipeline has independent contact barriers and evades do not consume shields", () => {
  const b = new B({ monsters: ["goblin"] });
  const p = b.units[0],
    e = b.units[1];
  e.hp = e.max = 1000;
  e.commonStatuses = [{ ...oneHit(100), key: "shield" }];
  e.invulnerable = 1;
  b.damage(p, e, 80);
  assert(!e.commonStatuses[0].used);
  e.invulnerable = 0;
  for (let i = 0; i < 3; i++) b.damage(p, e, 80);
  near(e.hp, 840);
  assert.equal(b.events.filter((e) => e.type === "combat_formula").length, 3);
});
test("real-time level and armor rules match pure calculations, paused execution draws no random numbers", () => {
  const b = new B();
  const p = b.units[0],
    e = b.units[1];
  p.level = 7;
  e.hp = e.max = 1000;
  b.damage(p, e, 100);
  near(e.hp, 894);
  b.setPaused(true);
  const state = b.formulaRng?.state;
  b.step(0.05, { attack: true });
  assert.equal(b.formulaRng?.state, state);
});
test("actual healing and shield skill adapters use the agreed MP efficiency", () => {
  const book = S.learnCommon(
      null,
      C.records.find((s) => s.name === "마력 봉합").id,
      "taei",
      { kind: "test", eventId: "test" },
    ).book,
    b = new B({ skillBook: book, manaRegen: false });
  const p = b.units[0];
  p.hp = 20;
  assert(b.castSkill(p, book.skills[0].id, b.units[1]).ok);
  for (let i = 0; i < 30; i++) b.step(0.02);
  near(p.hp, 68);
});
test("story damage uses the same level formula and retains an authoritative trace", () => {
  const combat = N.createCombat(["goblin"], "chat", "");
  combat.distance = 1;
  combat.enemies[0].hp = combat.enemies[0].max = 1000;
  const r = N.resolveCombat(
    combat,
    { hp: 100, max: 100, mana: 100, level: 7 },
    "attack",
  );
  near(r.resolution.outgoing, 12.72);
  near(r.resolution.formulaEvents[0].verdict.levelMultiplier, 1.06);
});
test("AI cannot assert invented damage, critical or armor bypass; worked examples come from the real engine", () => {
  const verdict = plain(),
    resolution = { formulaEvents: [{ id: "proof", damage: 100, verdict }] };
  assert.equal(
    AI.review(
      { combatClaims: [{ eventId: "proof", kind: "damage", value: 100 }] },
      resolution,
    ).errors.length,
    0,
  );
  assert(
    AI.review(
      {
        combatClaims: [{ eventId: "proof", kind: "armor-bypassed", value: 1 }],
      },
      resolution,
    ).errors.length,
  );
  assert(
    AI.review(
      { combatClaims: [{ eventId: "invented", kind: "damage", value: 100 }] },
      resolution,
    ).errors.length,
  );
  assert.equal(AI.context().examples[0].actual, 106);
});
test("seeded RNG is reproducible and explicit body aim respects negation", () => {
  const a = R.rng(71),
    b = R.rng(71);
  assert.deepEqual(
    Array.from({ length: 30 }, () => a.next()),
    Array.from({ length: 30 }, () => b.next()),
  );
  assert.equal(R.parseAim("머리 말고 어깨를 공격한다"), "shoulder");
});
test("periodic healing divides a fixed budget, pauses and records only actual restoredHP", () => {
  const b = new B({ manaRegen: false }),
    p = b.units[0];
  p.hp = 20;
  p.wounds = [{ kind: "fracture" }];
  assert(
    b.scheduleHealing(p, p, { mana: 24, grade: 2, ticks: 3, interval: 0.2 }),
  );
  b.setPaused(true);
  for (let i = 0; i < 30; i++) b.step(0.02);
  near(p.hp, 20);
  b.setPaused(false);
  for (let i = 0; i < 31; i++) b.step(0.02);
  near(p.hp, 68);
  assert.deepEqual(p.wounds, [{ kind: "fracture" }]);
  assert.equal(b.events.filter((e) => e.type === "heal").length, 3);
});
test("resisted control has no mastery gain and does not cancel an existing action", () => {
  const def = C.records.find((d) => d.name === "마력쇄"),
    book = S.learnCommon(null, def.id, "taei", {
      kind: "test",
      eventId: "seed",
    }).book,
    b = new B({ skillBook: book }),
    p = b.units[0],
    e = b.units[1];
  e.x = 6;
  e.y = 8;
  e.speed = 0;
  e.cooldown = 100;
  e.controlResistance = 1e9;
  b.formulaRandom = () => 0.999;
  const r = b.castSkill(p, book.skills[0].id, e);
  assert(r.ok);
  for (let i = 0; i < 30; i++) b.step(0.02);
  assert(!b.hasStatus(e, "root"));
  assert.equal(b.skillBook.progress[book.skills[0].id].xp, 0);
});
test("AI numeric narration is checked against actual outcomes even with an empty claims array", () => {
  const resolution = { outgoing: 33, incoming: 0, formulaEvents: [] };
  assert(
    AI.review(
      { combatClaims: [], panels: [{ text: "피해량은 999다." }] },
      resolution,
    ).errors.length,
  );
  assert.equal(
    AI.review(
      { combatClaims: [], panels: [{ text: "피해량은 33이다." }] },
      resolution,
    ).errors.length,
    0,
  );
});
test("failed AI formula claims do not commit damage, RNG advance or a new story turn", async () => {
  const fs = require("node:fs/promises"),
    os = require("node:os"),
    path = require("node:path"),
    { StoryDirector, initial } = require("../electron/story-director.cjs"),
    G = require("../ui/map/geography.js");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "formula-ai-"));
  try {
    const state = {
      ...initial(),
      era: "fantasy",
      location: G.records[0].id,
      scene: "combat",
      combat: N.createCombat(["goblin"], "chat", ""),
    };
    state.combat.distance = 1;
    const reply = {
      era: state.era,
      location: state.location,
      elapsedMinutes: 0,
      scene: "combat",
      present: state.present,
      party: [],
      locals: [],
      focus: state.focus,
      panels: [{ speaker: "narrator", text: "주먹이 닿았다." }],
      choices: [],
      facts: [],
      threads: [],
      skillProposals: [],
      sceneObjects: [],
      actionPlan: [],
      combat: {
        importance: "ordinary",
        reason: "",
        evidenceIds: [],
        monsters: ["goblin"],
        intent: "attack",
        target: 0,
        stakes: "danger",
      },
    };
    let calls = 0,
      contextSeen = false;
    const d = new StoryDirector(path.join(dir, "story.json"), {
      check: async () => ({ ready: true }),
      generateStructured: async (messages) => {
        calls++;
        contextSeen ||= messages[0].content.includes("combatRulesContext");
        return calls === 1
          ? reply
          : {
              ...reply,
              combatClaims: [
                { eventId: "invented", kind: "critical", value: 1 },
              ],
            };
      },
    });
    await d.save(state);
    await assert.rejects(
      d.send({
        text: "주먹으로 친다",
        requestId: "formula-invalid-1",
        revision: 0,
      }),
      /엔진 판정/,
    );
    assert(contextSeen);
    assert.deepEqual(await d.read(), state);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("handoff resources retain real player level, body armor and explicit combat stats", () => {
  const b = new B({
    resources: {
      resourceVersion: 2,
      stats: { health: 5, mana: 3 },
      hp: 500,
      max: 500,
      mana: 300,
      maxMana: 300,
      level: 7,
      attack: 20,
      armor: { shoulder: { damageReduction: 0.33 } },
    },
  });
  assert.equal(b.units[0].level, 7);
  assert.equal(b.units[0].combatStats.attack, 20);
  near(b.units[0].armor.shoulder.damageReduction, 0.33);
});
test("authoritative logs survive visual event ring-buffer truncation", () => {
  const b = new B({ monsters: ["goblin"] });
  const p = b.units[0],
    e = b.units[1];
  e.hp = e.max = 10000;
  for (let i = 0; i < 200; i++) b.damage(p, e, 1);
  assert.equal(b.formulaLog.length, 200);
  assert(b.events.length <= 140);
  near(
    b.formulaLog.reduce((n, e) => n + e.damage, 0),
    200,
  );
});
test("a source-authorized personal one-hit barrier uses a finite limit and remains a real usable skill", () => {
  let book = S.empty();
  for (let i = 0; i < 3; i++)
    book = S.practice(book, {
      id: "proof-" + i,
      ownerId: "taei",
      encounterId: "training",
      targetId: "dummy",
      kind: "unarmed",
      amount: 1,
      meaningful: true,
    });
  book = S.grant(book, {
    id: "barrier-source",
    ownerId: "taei",
    origin: "essence",
    name: "시험 보호막 출처",
    effects: ["one-hit-barrier"],
    elements: ["arcane"],
    conditions: ["none"],
    maxPower: 1,
    maxRange: 2,
    active: true,
    equipmentId: "",
  });
  const created = S.register(book, {
      ownerId: "taei",
      name: "시험 1회 보호막",
      basisIds: ["barrier-source"],
      evidenceIds: ["proof-0", "proof-1", "proof-2"],
      effect: "one-hit-barrier",
      element: "arcane",
      power: 1,
      range: 1,
      condition: "none",
      motif: "ring",
    }),
    b = new B({ skillBook: created.book, manaRegen: false }),
    p = b.units[0],
    e = b.units[1];
  assert(b.castSkill(p, created.skill.id, e).ok);
  for (let i = 0; i < 20; i++) b.step(0.02);
  assert.equal(p.mana, 92);
  near(b.activeShields(p)[0].capacity, 24);
  b.damage(e, p, 80);
  near(p.hp, 44);
  assert.equal(b.skillBook.progress[created.skill.id].xp, 4);
});
test("counter reactions occur after the original damage and do not recurse or corrupt hit logs", () => {
  const def = C.records.find((s) => s.name === "반격 인장"),
    book = S.learnCommon(null, def.id, "taei", {
      kind: "test",
      eventId: "counter-proof",
    }).book,
    b = new B({ skillBook: book });
  const p = b.units[0],
    e = b.units[1];
  e.hp = e.max = 1000;
  assert(b.castSkill(p, book.skills[0].id, e).ok);
  for (let i = 0; i < 30; i++) b.step(0.02);
  b.damage(e, p, 80);
  near(p.hp, 60);
  near(e.hp, 980);
  assert.deepEqual(
    b.formulaLog.map((e) => e.actor),
    [e.id, p.id],
  );
});
