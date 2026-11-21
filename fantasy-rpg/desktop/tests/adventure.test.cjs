const t = require("node:test"),
  a = require("node:assert/strict"),
  A = require("../ui/adventure/engine.js"),
  G = require("../ui/progression/model.js"),
  Rules = require("../ui/combat/rules.js"),
  M = require("../ui/association/economy.js"),
  XP = require("../ui/progression/experience.js"),
  { initial, StoryDirector } = require("../electron/story-director.cjs"),
  { createCombat } = require("../ui/story/combat.js");
function sampleContracts(s){const D=require('../ui/association/dynamic-contracts.js'),b=D.local(A.ensure(s));for(const p of b.plans){if(p.type==='hunt'){p.count=2;p.species='goblin';p.reward=100;}if(p.type==='supply'){p.count=2;p.reward=24;}}return b;}
const start = () => ({
    ...initial(),
    era: "fantasy",
    location: "north-city-01",
  }),
  board = () => A.apply(start(), { type: "refresh" }),
  find = (s, type) => s.adventure.quests.find((q) => q.type === type),
  act = (s, type, q) =>
    A.apply(
      s,
      { type, questId: q.id },
      { requestId: "test-step", createCombat },
    );
function won(s, id = "test-battle") {
  const q = find(s, "hunt");
  const old = {
    ...s,
    location: q.destination,
    combat: createCombat([q.species, q.species], "chat", "test"),
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
  return { old, next };
}
t(
  "live board has escrowed contracts and no free money/items; repeat refresh and remote access are blocked",
  () => {
    const s = board();
    a.equal(s.adventure.economy.wallet, 0);
    a.deepEqual(s.adventure.inventory, []);
    a.equal(s.adventure.quests.length, 5);
    M.check(s.adventure.economy);
    a.throws(() => A.apply(s, { type: "refresh" }));
    a.throws(() => A.apply(initial(), { type: "refresh" }));
    a.throws(() =>
      A.apply({ ...s, location: "north-wild-01" }, { type: "refresh" }),
    );
    a.equal(initial().adventure, undefined);
  },
);
t(
  "accepted quests require actual local combat proof and cannot be completed by claimed prose or wrong-location fights",
  () => {
    let s = board(),
      q = find(s, "hunt");
    s = act(s, "accept", q);
    a.equal(s.adventure.economy.wallet, 0);
    a.throws(() => act(s, "submit", q));
    let { old, next } = won(s);
    const wrong = A.observe(
      { ...old, location: "north-wild-01" },
      { ...next, location: "north-wild-01" },
    );
    a.equal(find(wrong, "hunt").progress, 0);
    const complete = A.observe(old, next);
    a.equal(find(complete, "hunt").progress, 2);
    a.equal(complete.adventure.economy.wallet, 0);
    a.throws(() => act(complete, "submit", q));
    const returned = { ...complete, location: q.issuerLocation };
    const paid = act(returned, "submit", q);
    a.equal(paid.adventure.economy.wallet, 100);
    a.equal(paid.player.experience.total, 52);
    a.throws(() => act(paid, "submit", q), /이미/);
    M.check(paid.adventure.economy);
  },
);
t(
  "victory creates stable ground loot once; only physical pickup creates inventory and supply consumes it once",
  () => {
    let s = board(),
      hunt = find(s, "hunt"),
      supply = find(s, "supply");
    s = act(s, "accept", hunt);
    s = act(s, "accept", supply);
    const { old, next } = won(s);
    s = A.observe(old, next);
    a.equal(s.adventure.inventory.length, 0);
    a.equal(A.observe(old, s).adventure.ground.length, 2);
    const loot = s.adventure.ground[0];
    a.throws(() =>
      A.apply(
        { ...s, location: "north-city-01" },
        { type: "pickup", lootId: loot.id },
      ),
    );
    for (const x of s.adventure.ground)
      s = A.apply(s, { type: "pickup", lootId: x.id });
    a.equal(s.adventure.economy.inventory.monster_scrap, 2);
    a.throws(() => A.apply(s, { type: "pickup", lootId: loot.id }));
    s = { ...s, location: "north-city-01" };
    s = act(s, "submit", supply);
    a.equal(s.adventure.economy.inventory.monster_scrap, 0);
    a.equal(
      s.adventure.inventory.filter((i) => i.kind === "material").length,
      0,
    );
    a.equal(s.adventure.economy.wallet, 24);
    M.check(s.adventure.economy);
  },
);
t(
  "field survey requires its real destination and10 minutes; return and evidence submission pay the reward",
  () => {
    let s = board(),
      q = find(s, "ecology");
    s = act(s, "accept", q);
    a.throws(() => act(s, "survey", q));
    s = act({ ...s, location: q.destination }, "survey", q);
    a.equal(s.minutes, 10);
    a(find(s, "ecology").proofs.length === 1);
    a.equal(s.player.experience, undefined);
    a.throws(() => act(s, "survey", q));
    s = act({ ...s, location: q.issuerLocation }, "submit", q);
    a.equal(s.adventure.economy.wallet, 40);
    a.equal(s.player.experience.total, 45);
  },
);
t(
  "a genuine seeded rare drop retains its creation deadline on pickup and expires on world time, even while held",
  () => {
    let s = board();
    s = act(s, "accept", find(s, "hunt"));
    let id;
    for (let i = 0; i < 1000000; i++) {
      const candidate = "rare-" + i;
      if (
        Rules.rng(Rules.hash("drop:" + candidate + ":0")).next() <
        A.policy.essenceChance
      ) {
        id = candidate;
        break;
      }
    }
    a(id);
    const { old, next } = won(s, id);
    s = A.observe(old, next);
    const loot = s.adventure.ground.find((x) => x.essence);
    a(loot);
    const picked = A.apply(
      { ...s, minutes: 5 },
      { type: "pickup", lootId: loot.id },
    );
    const item = picked.player.progression.inventory.find(
      (i) => i.kind === "essence",
    );
    a.equal(item.expiresAt, 30);
    const absorbed = G.apply(
      picked.player,
      { type: "absorb", itemId: item.id },
      5,
    );
    a.equal(absorbed.progression.absorbed.length, 1);
    a.equal(
      A.ensure({ ...picked, minutes: 30 }).player.progression.inventory.some(
        (i) => i.id === item.id,
      ),
      false,
    );
    const late = A.apply(
      { ...s, minutes: 31 },
      { type: "pickup", lootId: loot.id },
    );
    a(!late.player.progression?.inventory.some((i) => i.kind === "essence"));
  },
);
t(
  "expiry releases escrow and cannot pay XP; malformed item ledgers are rejected",
  () => {
    let s = board();
    const q = find(s, "hunt");
    s = act(s, "accept", q);
    s = A.ensure({ ...s, minutes: q.deadline + 1 });
    a.equal(find(s, "hunt").status, "expired");
    a.equal(s.adventure.economy.wallet, 0);
    a.throws(() => act(s, "submit", q));
    M.check(s.adventure.economy);
    s.adventure.inventory.push({ id: "fake", kind: "material", quantity: 100 });
    a.throws(() => A.ensure(s), /장부/);
  },
);
t(
  "director full loop: board→accept→AI travel→real combat→pickup→return→cash/XP→reload, with atomic replay",
  async () => {
    const fs = require("node:fs/promises"),
      os = require("node:os"),
      path = require("node:path");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "adventure-flow-"));
    try {
      let d;
      const bridge = {
        check: async () => ({ ready: true }),
        generateStructured: async (messages,schema) => {
          if(schema.properties.plans)return sampleContracts(await d.read());
          const s = await d.read(),
            moving = !!bridge.travel;
          return {
            era: s.era,
            location: bridge.travel || s.location,
            elapsedMinutes: moving ? 10 : 0,
            scene: moving ? "dialogue" : "combat",
            present: s.present,
            party: s.party || [],
            locals: [],
            focus: s.focus,
            panels: [
              {
                speaker: "narrator",
                text: moving ? "주변 풍경이 바뀐다." : "공방이 이어진다.",
              },
            ],
            choices: [],
            facts: [],
            threads: [],
            combat: {
              importance: moving ? "none" : "ordinary",
              reason: "",
              evidenceIds: [],
              monsters: s.combat?.monsters || [],
              intent: "attack",
              target: s.combat?.enemies.find((e) => e.hp > 0)?.id || 0,
              stakes: moving ? "none" : "danger",
            },
          };
        },
      };
      d = new StoryDirector(path.join(dir, "story.json"), bridge);
      const seed = start();
      seed.player = require("../ui/skills/resources.js").create(2, 3);
      seed.player.stats.strength = 100;
      await d.save(seed);
      let s = await d.read(),
        serial = 0;
      const perform = async (action) =>
        (s = await d.adventureAction({
          revision: s.revision,
          requestId: "action-" + ++serial + "-request",
          action,
        }));
      await perform({ type: "refresh" });
      const q = find(s, "hunt"),
        supply = find(s, "supply");
      await perform({ type: "accept", questId: q.id });
      await perform({ type: "accept", questId: supply.id });
      bridge.travel = q.destination;
      s = await d.send({
        revision: s.revision,
        requestId: "travel-to-site",
        text: A.locationName(q.destination) + "로 이동한다",
      });
      bridge.travel = null;
      await perform({ type: "hunt", questId: q.id });
      for (let i = 0; i < 5 && s.combat.status === "playing"; i++)
        s = await d.send({
          revision: s.revision,
          requestId: "attack-" + i + "-request",
          text: "공격한다",
        });
      a.equal(s.combat.status, "won");
      a.equal(find(s, "hunt").progress, 2);
      a(s.player.experience.total > 0);
      for (const loot of s.adventure.ground)
        await perform({ type: "pickup", lootId: loot.id });
      bridge.travel = q.issuerLocation;
      s = await d.send({
        revision: s.revision,
        requestId: "travel-back-home",
        text: A.locationName(q.issuerLocation) + "로 이동한다",
      });
      bridge.travel = null;
      const req = {
        revision: s.revision,
        requestId: "submit-hunt-once",
        action: { type: "submit", questId: q.id },
      };
      s = await d.adventureAction(req);
      a.equal(s.adventure.economy.wallet, 100);
      a.equal((await d.adventureAction(req)).adventure.economy.wallet, 100);
      await perform({ type: "submit", questId: supply.id });
      a.equal(s.adventure.economy.wallet, 124);
      const loaded = await d.read();
      a.equal(loaded.adventure.economy.wallet, 124);
      a.equal(loaded.player.experience.total, s.player.experience.total);
      a.equal(loaded.adventure.economy.inventory.monster_scrap, 0);
      a.equal(loaded.combat, null);
      await a.rejects(
        d.adventureAction({
          revision: loaded.revision,
          requestId: "forged-new-money",
          action: { type: "submit", questId: q.id, reward: 999999 },
        }),
      );
      a.equal((await d.read()).adventure.economy.wallet, 124);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t(
  "AI creates complete executable contracts and invalid generation preserves the existing board",
  async () => {
    const fs = require("node:fs/promises"),
      os = require("node:os"),
      path = require("node:path");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "adventure-ai-"));
    try {
      let bad = false;
      const d = new StoryDirector(path.join(dir, "story.json"), {
        check: async () => ({ ready: true }),
        generateStructured: async () => {const b=sampleContracts(start());if(bad)b.plans[0].count=999;return b;},
      });
      await d.save(start());
      let s = await d.adventureAction({
        revision: 0,
        requestId: "ai-board-first",
        action: { type: "refreshAI" },
      });
      a.equal(s.adventure.quests.length, 5);
      a(s.adventure.quests.every((q) => q.flavor));
      a.equal(s.adventure.quests[0].reward, 100);
      s.minutes=360;await d.save(s);
      const before = await fs.readFile(d.file, "utf8");
      bad = true;
      await a.rejects(
        d.adventureAction({
          revision: s.revision,
          requestId: "ai-board-bad-text",
          action: { type: "refreshAI" },
        }),
        /계약/,
      );
      a.equal(await fs.readFile(d.file, "utf8"), before);
      a.equal((await d.read()).adventure.economy.wallet, 0);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t(
  "realtime victory also records physical loot and hunt proof exactly once",
  async () => {
    const fs = require("node:fs/promises"),
      os = require("node:os"),
      path = require("node:path");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "adventure-realtime-"));
    try {
      const d = new StoryDirector(path.join(dir, "story.json"), {});
      let s = board(),
        q = find(s, "hunt");
      s = act(s, "accept", q);
      s.location = q.destination;
      s.combat = createCombat([q.species, q.species], "realtime", "test");
      await d.save(s);
      const h = await d.realtimeStart(s.revision);
      const req = {
        token: h.token,
        status: "won",
        hp: s.player.hp,
        mana: s.player.mana,
      };
      const next = await d.realtimeFinish(req);
      a.equal(next.adventure.ground.length, 2);
      a.equal(find(next, "hunt").progress, 2);
      await a.rejects(d.realtimeFinish(req));
      a.equal((await d.read()).adventure.ground.length, 2);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
