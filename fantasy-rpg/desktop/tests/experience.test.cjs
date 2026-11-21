const t = require("node:test"),
  a = require("node:assert/strict"),
  XP = require("../ui/progression/experience.js"),
  E = require("../ui/monsters/essence-rules.js"),
  Q = require("../ui/association/quests.js"),
  { createCombat } = require("../ui/story/combat.js");
t("XP grows within bands and has a pronounced jump at10→11 and20→21", () => {
  for (const boundary of [10, 20, 30, 50, 100])
    a(XP.required(boundary) / XP.required(boundary - 1) > 1.59);
  let previous = 0;
  for (let l = 1; l <= 100; l++) {
    a(XP.required(l) > previous);
    previous = XP.required(l);
  }
  a.equal(XP.required(1), 100);
  a.throws(() => XP.required(0));
});
t(
  "every monster has a positive species XP value; higher grade reward bands exceed lower grades",
  () => {
    const bands = new Map();
    for (const e of E.records) {
      const xp = XP.monsterReward(e.id);
      a(Number.isSafeInteger(xp) && xp > 0);
      if (!bands.has(e.stars)) bands.set(e.stars, []);
      bands.get(e.stars).push(xp);
    }
    const entries = [...bands].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < entries.length; i++)
      a(Math.min(...entries[i][1]) > Math.max(...entries[i - 1][1]));
    a.notEqual(XP.monsterReward("goblin"), XP.monsterReward("slime"));
    a.throws(() => XP.monsterReward("fake"));
  },
);
t(
  "XP carryover grants3 points only on actual level changes and prevents duplicate or changed receipts",
  () => {
    let p = XP.award(XP.seed(), 104, "kill-batch", "monster");
    a.equal(p.level, 2);
    a.equal(p.experience.xp, 4);
    a.equal(p.statPoints, 3);
    a.equal(p.hp, 100);
    a.deepEqual(XP.award(p, 104, "kill-batch", "monster"), p);
    a.throws(() => XP.award(p, 105, "kill-batch", "monster"));
    a.throws(() => XP.award(p, 10, "bad-source", "ai"));
    a.throws(() => XP.award(p, -1, "negative", "test"));
    p.experience.receipts.push({});
    a.throws(() => XP.record(p));
  },
);
t(
  "verified battle victory grants each enemy once; retreat, loss and partial or mismatched results give no victory XP",
  () => {
    const old = createCombat(["goblin", "slime"], "chat", "test"),
      won = {
        ...old,
        status: "won",
        enemies: old.enemies.map((e) => ({ ...e, hp: 0 })),
      };
    let p = XP.settleBattle(XP.seed(), old, won);
    a.equal(p.experience.total, 42);
    a.equal(XP.settleBattle(p, old, won).experience.total, 42);
    for (const status of ["escaped", "lost", "withdrawn", "playing"])
      a.equal(
        XP.settleBattle(XP.seed(), old, { ...won, status }).experience,
        undefined,
      );
    a.throws(() => XP.settleBattle(p, old, { ...won, enemies: old.enemies }));
  },
);
t(
  "quest XP is quoted by engine, paid only on successful verified settlement and never on accept or replay",
  () => {
    let s = Q.refresh(Q.initial(), "road", Q.drafts("road", 8), "test");
    const q = s.quests.find((q) => q.status === "open");
    a.equal(q.experienceReward, XP.questReward(q.rank, q.type));
    s = Q.accept(s, q.id, "D");
    a.equal(s.adventurer, undefined);
    const n = Q.simulateComplete(s, q.id);
    a.equal(n.adventurer.experience.total, q.experienceReward);
    a.equal(
      n.quests.find((x) => x.id === q.id).receipt.experience,
      q.experienceReward,
    );
    a.deepEqual(Q.simulateComplete(n, q.id), n);
    a.equal(s.adventurer, undefined);
    a.throws(() => Q.complete(s, q.id, { authority: "ai" }));
    a(XP.questReward("D", "hunt") > XP.questReward("E", "hunt"));
  },
);
t(
  "story chat victory pays XP atomically and a request retry cannot pay it twice",
  async () => {
    const fs = require("node:fs/promises"),
      os = require("node:os"),
      path = require("node:path"),
      { StoryDirector, initial } = require("../electron/story-director.cjs");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "xp-chat-"));
    try {
      let state = initial();
      state.era = "fantasy";
      state.location = require("../ui/map/geography.js").records[0].id;
      state.combat = createCombat(["goblin"], "chat", "test");
      state.combat.distance = 1;
      state.combat.enemies[0].hp = 1;
      const response = {
        era: state.era,
        location: state.location,
        elapsedMinutes: 0,
        scene: "combat",
        present: state.present,
        party: [],
        locals: [],
        focus: state.focus,
        panels: [{ speaker: "narrator", text: "고블린과의 공방이 이어진다." }],
        choices: [],
        facts: [],
        threads: [],
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
      const d = new StoryDirector(path.join(dir, "story.json"), {
        check: async () => ({ ready: true }),
        generateStructured: async () => response,
      });
      await d.save(state);
      const req = {
        text: "주먹으로 친다",
        revision: 0,
        requestId: "xp-chat-attack-01",
      };
      const next = await d.send(req);
      a.equal(next.combat.status, "won");
      a.equal(next.player.experience.total, 26);
      a.equal((await d.send(req)).player.experience.total, 26);
      a.equal((await d.read()).player.experience.total, 26);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t(
  "realtime victory uses the bound encounter, settles XP once and persists a valid defeated roster",
  async () => {
    const fs = require("node:fs/promises"),
      os = require("node:os"),
      path = require("node:path"),
      { StoryDirector, initial } = require("../electron/story-director.cjs");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "xp-rt-"));
    try {
      const d = new StoryDirector(path.join(dir, "story.json"), {}),
        s = initial();
      s.era = "fantasy";
      s.combat = createCombat(["goblin"], "realtime", "test");
      await d.save(s);
      const h = await d.realtimeStart(0);
      const req = { token: h.token, status: "won", hp: 100, mana: 100 };
      const next = await d.realtimeFinish(req);
      a.equal(next.player.experience.total, 26);
      a(next.combat.enemies.every((e) => e.hp === 0));
      await a.rejects(d.realtimeFinish(req));
      a.equal((await d.read()).player.experience.total, 26);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
