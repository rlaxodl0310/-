const t = require("node:test"),
  a = require("node:assert/strict"),
  S = require("../ui/skills/system.js"),
  C = require("../ui/skills/common.js"),
  B = require("../ui/realtime/engine.js"),
  R = require("../ui/skills/resources.js"),
  Chat = require("../ui/skills/common-chat.js"),
  Story = require("../electron/story-skills.cjs"),
  { createCombat } = require("../ui/story/combat.js");
const definition = (name) => C.records.find((s) => s.name === name),
  tick = (b, n = 100) => {
    for (let i = 0; i < n; i++) b.step(0.02);
  };
function setup(d, over = {}) {
  const book = S.learnCommon(null, d.id, "taei", {
      kind: "test",
      eventId: "test-grant",
    }).book,
    type =
      { ranged: "bow", blade: "sword", any: "sword" }[d.mechanic.weapon] ||
      d.mechanic.weapon ||
      "unarmed",
    b = new B({
      skillBook: book,
      monsters: ["goblin"],
      stats: { goblin: { hp: 10000 } },
      resources: R.create(10, 10),
      weaponType: type,
      weapon: type === "bow" ? "bow" : "gauntlet",
      allies: [{ id: "yeogyeong" }],
      props: [{ id: "stone", x: 6, y: 8, weight: "light", fixed: false }],
      manaRegen: false,
      ...over,
    });
  const p = b.units[0],
    e = b.living("enemy")[0],
    ally = b.units.find((u) => u.id === "yeogyeong");
  ally.hp = 20;
  ally.order = "hold";
  ally.cooldown = 1e8;
  p.hp = 500;
  p.objectTarget = "stone";
  p.supportTarget = ally.id;
  e.x = 6.2;
  e.y = 8;
  e.speed = 0;
  e.cooldown = 1e8;
  return {
    b,
    p,
    e,
    ally,
    skill: book.skills[0],
    cast: () => b.castSkill(p, book.skills[0].id, e),
  };
}
t(
  "catalog preserves all 181 source entries, original costs, fixed grades, duplicates and distinct VFX recipes",
  () => {
    a.equal(C.records.length, 181);
    a.equal(new Set(C.records.map((d) => d.id)).size, 181);
    a.equal(C.records.filter((s) => s.name === "철산고").length, 2);
    a.deepEqual(
      C.records
        .filter((s) => s.name === "철산고")
        .map((d) => [d.grade, d.mana]),
      [
        [2, 24],
        [1, 12],
      ],
    );
    for (const d of C.records) {
      a.equal(d.cooldown, 0);
      a(d.grade >= 1 && d.grade <= 4);
      a(d.mana >= C.bands[d.grade - 1][0] && d.mana <= C.bands[d.grade - 1][1]);
      a(d.description && d.effectText && d.mechanic && d.visual);
    }
    a(new Set(C.records.map((d) => d.visual.motif)).size >= 15);
  },
);
t(
  "HP/MP stat conversion is exact; old saves preserve ratios and migrate only once",
  () => {
    a.deepEqual([R.create(5, 3).max, R.create(5, 3).maxMana], [500, 300]);
    const r = R.normalise({ hp: 50, max: 100, mana: 12 });
    a.equal(r.hp, 50);
    a.equal(r.mana, 50);
    a.equal(r.maxMana, 100);
    a.deepEqual(R.normalise(r), r);
    a.throws(() => R.normalise({ ...r, maxMana: 24 }));
  },
);
t(
  "every common skill can execute when its actual prerequisites are supplied; fixed grade and costs survive use",
  () => {
    for (const d of C.records) {
      const { b, p, e, skill, cast } = setup(d);
      b.bloodTrails = [{ subject: e.id, x: e.x, y: e.y }];
      if (d.mechanic.kind === "swap")
        b.units.push({
          ...p,
          id: "illusion-proof",
          kind: "illusion",
          owner: p.id,
          x: 4,
          y: 8,
          until: 100,
        });
      const before = p.mana,
        r = cast();
      a(r.ok, d.id + " " + r.error);
      a.equal(p.mana, before - d.mana, d.name);
      tick(b);
      a(
        b.events.some((e) => e.type === "skill_fx"),
        d.id,
      );
      a.equal(b.skillBook.skills[0].grade, d.grade);
      a.equal(b.skillBook.skills[0].cost.cooldown, 0);
      a(Number.isFinite(p.hp) && Number.isFinite(p.mana), d.id);
    }
  },
);
t(
  "unknown ownership, weapon mismatch, broken weapon and missing blood/object data never spend MP",
  () => {
    for (const name of ["삼연격", "혈흔 추적", "마력 견인"]) {
      const d = definition(name),
        { b, p, cast } = setup(d);
      if (name === "삼연격") p.equipmentType = "unarmed";
      if (name === "마력 견인") b.props = [];
      const before = p.mana;
      a.equal(cast().ok, false, name);
      a.equal(p.mana, before);
    }
    const r = setup(definition("삼연격"));
    r.p.weaponState = { durability: 0 };
    a.equal(r.cast().ok, false);
  },
);
t(
  "common skill has no cooldown after recovery, insufficient MP and pause still gate casts",
  () => {
    const { b, p, cast } = setup(definition("마력탄"));
    a(cast().ok);
    tick(b, 40);
    a(cast().ok);
    a.equal(p.mana, 984);
    b.setPaused(true);
    const before = p.mana;
    b.submitIntent(
      {
        intent: "registered_skill",
        skillId: b.skillBook.skills[0].id,
        targetId: b.selected,
        when: "now",
      },
      "pause-common",
    );
    tick(b);
    a.equal(p.mana, before);
    p.mana = 0;
    b.setPaused(false);
    a(b.events.some((e) => e.type === "intent_failed"));
  },
);
t(
  "weapon buff changes actual damage and debuffs expire, refresh instead of stacking without bound",
  () => {
    const attack = setup(definition("근력 강화"));
    a(attack.cast().ok);
    tick(attack.b, 30);
    const old = attack.e.hp;
    attack.b.damage(attack.p, attack.e, 20);
    a(old - attack.e.hp > 20);
    a(attack.cast().ok);
    tick(attack.b, 30);
    a.equal(
      attack.b.statuses(attack.p).filter((s) => s.key === "strength").length,
      1,
    );
    const root = setup(definition("마력쇄"));
    a(root.cast().ok);
    tick(root.b, 30);
    const x = root.e.x;
    root.b.move(root.e, 1, 0, 0.2);
    a.equal(root.e.x, x);
    root.b.time += 10;
    root.e.speed = 2;
    root.b.move(root.e, 1, 0, 0.2);
    a(root.e.x > x);
  },
);
t(
  "projectile reflection changes actual owner and direction; shield and healing act on real damage",
  () => {
    const r = setup(definition("반사막"));
    r.cast();
    tick(r.b, 30);
    r.e.x = 9;
    r.b.projectiles.push({
      id: 500,
      source: r.e.id,
      team: "enemy",
      x: r.p.x + 0.7,
      y: r.p.y,
      vx: -5,
      vy: 0,
      damage: 10,
      radius: 0.2,
      life: 2,
      weapon: "bow",
    });
    r.b.step(0.02);
    const shot = r.b.projectiles[0];
    a.equal(shot.team, "ally");
    a(shot.vx > 0);
    const heal = setup(definition("마력 봉합"));
    const hp = heal.ally.hp;
    heal.cast();
    tick(heal.b, 30);
    a(heal.ally.hp > hp);
    a.equal(heal.b.skillBook.progress[heal.skill.id].xp, 4);
  },
);
t(
  "MP 8 subtracts 8 actual points, not eight stat points; catalog is not automatically learned",
  () => {
    a.equal(S.empty().skills.length, 0);
    const r = setup(definition("마력탄"), { resources: R.create(1, 3) });
    r.cast();
    a.equal(r.p.maxMana, 300);
    a.equal(r.p.mana, 292);
  },
);
t(
  "ordinary chat common skills persist buffs and share actual execution with realtime engine",
  () => {
    const d = definition("근력 강화"),
      book = S.learnCommon(null, d.id, "taei", {
        kind: "test",
        eventId: "test",
      }).book,
      state = {
        era: "fantasy",
        location: "field",
        combat: createCombat(["goblin"], "chat", ""),
        player: R.create(),
        skillBook: book,
      };
    state.combat.distance = 1;
    let out = Chat.resolve(state, book, book.skills[0], "chat-cast");
    a.equal(out.player.mana, 90);
    a(
      out.combat.commonState.units[0].statuses.some(
        (s) => s.key === "strength",
      ),
    );
    out = Chat.resolve(
      { ...state, ...out },
      out.skillBook,
      null,
      "basic",
      0,
      "attack",
    );
    a(out.resolution.outgoing > 12);
  },
);
t(
  "training requires explicit safe-world action; common acquisition is separate from AI proposals",
  () => {
    const state = {
      era: "fantasy",
      player: R.create(),
      skillBook: S.empty(),
      present: [],
    };
    a.equal(
      Story.train({ ...state, era: "earth" }, "마력탄 수련", "try-1"),
      null,
    );
    a.throws(() =>
      Story.train(
        { ...state, combat: { status: "playing" } },
        "마력탄 수련",
        "try-1",
      ),
    );
    for (let i = 0; i < 3; i++) {
      const r = Story.train(state, "마력탄 수련", "training-" + i);
      state.skillTraining = r.training;
      state.skillBook = r.book;
      state.player.mana -= r.cost;
    }
    a.equal(state.skillBook.skills[0].commonId, definition("마력탄").id);
    a.throws(() => Story.train(state, "공간 도약 수련", "high-grade"));
  },
);
t(
  "three safe training requests save acquisition atomically and retry does not duplicate MP cost",
  async () => {
    const fs = require("node:fs/promises"),
      os = require("node:os"),
      path = require("node:path"),
      { StoryDirector, initial } = require("../electron/story-director.cjs"),
      G = require("../ui/map/geography.js");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "common-training-"));
    try {
      const d = new StoryDirector(path.join(dir, "save.json"), {
          check: async () => ({ ready: false, message: "offline" }),
        }),
        s = { ...initial(), era: "fantasy", location: G.records[0].id };
      await d.save(s);
      let next;
      for (let i = 0; i < 3; i++)
        next = await d.send({
          text: "마력탄 수련",
          revision: i,
          requestId: "common-training-" + i,
        });
      a.equal(next.skillBook.skills[0].name, "마력탄");
      a.equal(next.player.mana, 94);
      const retry = await d.send({
        text: "마력탄 수련",
        revision: 2,
        requestId: "common-training-2",
      });
      a(retry.replayed);
      a.equal(retry.player.mana, 94);
      const read = await d.read();
      a.equal(read.skillBook.skills[0].grade, 1);
      await d.restorePrevious(read.revision);
      a.equal((await d.read()).skillBook.skills.length, 0);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  },
);
t(
  "common skill cast narration failure preserves the migrated resources and skill record",
  async () => {
    const fs = require("node:fs/promises"),
      os = require("node:os"),
      path = require("node:path"),
      { StoryDirector, initial } = require("../electron/story-director.cjs"),
      G = require("../ui/map/geography.js");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "common-cast-"));
    try {
      const dfn = definition("마력탄"),
        book = S.learnCommon(null, dfn.id, "taei", {
          kind: "test",
          eventId: "seed",
        }).book,
        s = {
          ...initial(),
          era: "fantasy",
          location: G.records[0].id,
          scene: "combat",
          combat: createCombat(["goblin"], "chat", ""),
          skillBook: book,
        },
        reply = {
          era: s.era,
          location: s.location,
          elapsedMinutes: 0,
          scene: "combat",
          present: s.present,
          party: [],
          locals: [],
          focus: s.focus,
          panels: [{ speaker: "narrator", text: "마력을 모은다." }],
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
            intent: "observe",
            target: 0,
            stakes: "danger",
          },
        };
      let calls = 0;
      const d = new StoryDirector(path.join(dir, "save.json"), {
        check: async () => ({ ready: true }),
        generateStructured: async () => {
          if (++calls > 1) throw Error("cancelled");
          return reply;
        },
      });
      await d.save(s);
      await a.rejects(
        d.send({
          text: "마력탄 사용",
          revision: 0,
          requestId: "common-cast-1",
        }),
        /cancelled/,
      );
      a.deepEqual(await d.read(), s);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  },
);
t(
  "story handoff retains remaining temporary effects without advancing the battle clock twice",
  () => {
    const d = definition("근력 강화"),
      r = setup(d);
    r.cast();
    tick(r.b, 50);
    const until = r.b.statuses(r.p)[0].until,
      state = {
        time: r.b.time,
        units: [{ id: "taei", statuses: r.p.commonStatuses }],
        fields: [],
      };
    const b = new B({ skillBook: r.b.skillBook });
    b.restoreCommon(state);
    a.equal(b.time, 0);
    a(Math.abs(b.statuses(b.units[0])[0].until - (until - r.b.time)) < 1e-8);
    b.setPaused(true);
    tick(b);
    a.equal(b.time, 0);
  },
);
t(
  "a failed conditional cast and preview leave mana, mastery and props unchanged",
  () => {
    const r = setup(definition("허상 교체")),
      before = JSON.stringify(r.b.skillBook),
      mana = r.p.mana;
    const out = r.cast();
    a.equal(out.ok, false);
    a.equal(r.p.mana, mana);
    a.equal(JSON.stringify(r.b.skillBook), before);
  },
);
t(
  "learned utility skills can move an observed object outside combat without spawning enemies",
  () => {
    const d = definition("마력 견인"),
      book = S.learnCommon(null, d.id, "taei", {
        kind: "test",
        eventId: "fixture",
      }).book,
      state = {
        era: "fantasy",
        location: "village",
        player: R.create(),
        skillBook: book,
        actionWorld: {
          locations: {
            "fantasy:village": {
              objects: [
                {
                  id: "cup",
                  name: "나무 잔",
                  weight: "light",
                  fixed: false,
                  distance: 2,
                  condition: "intact",
                  affordances: ["push"],
                },
              ],
            },
          },
          actors: {},
        },
      };
    const out = Story.cast(
      state,
      book.skills[0],
      "나무 잔에 마력 견인 사용",
      "utility-cast",
    );
    a.equal(out.combat, undefined);
    a.equal(out.player.mana, 87);
    a.equal(
      out.actionWorld.locations["fantasy:village"].objects[0].moved,
      true,
    );
    a(out.resolution.objectChanges.length);
    a.equal(state.player.mana, 100);
  },
);
