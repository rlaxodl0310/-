const t = require("node:test"),
  a = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os");
const G = require("../ui/progression/model.js"),
  L = require("../ui/progression/level-draft.js"),
  R = require("../ui/skills/resources.js"),
  Rules = require("../ui/combat/rules.js"),
  S = require("../ui/skills/system.js"),
  C = require("../ui/skills/common.js"),
  Skills = require("../electron/story-skills.cjs"),
  { StoryDirector, initial } = require("../electron/story-director.cjs"),
  { createCombat } = require("../ui/story/combat.js");
const gear = {
  id: "flow-weapon",
  name: "통합 시험 무기",
  kind: "equipment",
  category: "weapon",
  slot: "weapon",
  weaponType: "unarmed",
  stats: { strength: 5 },
  durability: 50,
  maxDurability: 50,
};
function sample() {
  const p = R.create(2, 3);
  p.hp = 120;
  p.mana = 170;
  p.stats = {
    ...p.stats,
    strength: 10,
    agility: 12,
    defense: 5,
    magicAttack: 8,
    magicResistance: 4,
  };
  return p;
}
t(
  "trusted level rewards grant exactly3 points per gained level, never stats or HP/MP, and cannot replay",
  () => {
    const before = sample();
    let p = G.awardLevel(before, 3, "level-proof");
    a.equal(p.level, 3);
    a.equal(p.statPoints, 6);
    a.deepEqual(p.stats, before.stats);
    a.equal(p.hp, 120);
    a.equal(p.mana, 170);
    a.deepEqual(G.awardLevel(p, 3, "level-proof"), p);
    a.throws(() => G.awardLevel(p, 4, "level-proof"));
    a.throws(() => G.awardLevel(p, 2, "different-proof"));
    a.equal(before.level, undefined);
  },
);
t(
  "draft curve increases with level, carries excess XP and applies3 points once per actual level",
  () => {
    a.equal(L.status, "proposal-not-canon");
    let prev = 0;
    for (let level = 1; level <= 1000; level++) {
      a(L.required(level) > prev);
      prev = L.required(level);
    }
    let p = L.award(sample(), 410, "battle-proof");
    a.equal(p.level, 3);
    a.equal(p.draftExperience.xp, 0);
    a.equal(p.statPoints, 6);
    a.deepEqual(L.award(p, 410, "battle-proof"), p);
    a.throws(() => L.award(p, 411, "battle-proof"));
    a.throws(() => L.award(p, -1, "negative-proof"));
    a.throws(() => L.required(0));
    p = L.award(p, 25, "leftover-proof");
    a.equal(p.draftExperience.xp, 25);
    a.equal(p.statPoints, 6);
    a.equal(p.hp, 120);
  },
);
t(
  "level→allocate→essence→equipment→real skill→save/reload preserves final stats, cost and deterministic damage",
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "growth-flow-"));
    try {
      const director = new StoryDirector(path.join(dir, "story.json"), {});
      let state = {
        ...initial(),
        era: "fantasy",
        player: G.awardLevel(sample(), 2, "flow-level"),
      };
      await director.save(state);
      let revision = 0;
      const action = async (action, id) => {
        state = await director.progressionAction({
          action,
          revision,
          requestId: id,
        });
        revision = state.revision;
      };
      await action(
        { type: "allocate", values: { strength: 3 } },
        "flow-allocate-01",
      );
      state = await director.grantReward(
        [{ id: "flow-essence", kind: "essence", species: "goblin" }, gear],
        "seed",
      );
      revision = state.revision;
      await action(
        { type: "absorb", itemId: "flow-essence" },
        "flow-absorb-01",
      );
      await action({ type: "equip", itemId: "flow-weapon" }, "flow-equip-01");
      a.equal(state.player.level, 2);
      a.equal(state.player.stats.strength, 20);
      a.equal(state.player.stats.agility, 13);
      a.equal(state.player.statPoints, 0);
      a.equal(state.player.hp, 120);
      a.equal(state.player.mana, 170);
      const target = {
          level: 1,
          stats: { defense: 100 },
          armor: { torso: { damageReduction: 0 } },
        },
        verdict = Rules.resolveHit(
          { source: state.player, target, basePower: 100, coefficient: 1 },
          () => 0.999,
        );
      a.equal(verdict.hpDamage, 60.6);
      await director.save(state);
      state = await director.read();
      a.equal(
        Rules.resolveHit(
          { source: state.player, target, basePower: 100, coefficient: 1 },
          () => 0.999,
        ).hpDamage,
        60.6,
      );
      const common = C.records.find((s) => s.id === "common-01-001");
      a(common);
      state.skillBook = S.learnCommon(state.skillBook, common.id, "taei", {
        kind: "test",
        eventId: "flow-learn",
      }).book;
      state.combat = createCombat(["goblin"], "chat", "통합 시험");
      state.combat.distance = 1;
      const skill = state.skillBook.skills.find(
          (s) => s.commonId === common.id,
        ),
        cast = Skills.cast(state, skill, "마력탄 사용", "flow-cast", 0);
      a.equal(cast.player.mana, 170 - common.mana);
      a(cast.resolution.outgoing > 0);
      a(cast.resolution.formulaEvents.length > 0);
      const damage = cast.resolution.outgoing;
      const repeated = Skills.cast(
        JSON.parse(JSON.stringify(state)),
        skill,
        "마력탄 사용",
        "flow-cast",
        0,
      );
      a.equal(repeated.resolution.outgoing, damage);
      state = {
        ...state,
        player: cast.player,
        combat: cast.combat,
        skillBook: cast.skillBook,
      };
      await director.save(state);
      const loaded = await director.read();
      a.equal(loaded.player.stats.strength, 20);
      a.equal(loaded.player.mana, 170 - common.mana);
      a.equal(loaded.combat.enemies[0].hp, cast.combat.enemies[0].hp);
      a.equal(
        loaded.skillBook.progress[skill.id].xp,
        cast.skillBook.progress[skill.id].xp,
      );
      a.equal(loaded.player.progression.absorbed.length, 1);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t("main story does not import or auto-award the proposed XP curve", () => {
  const source = require("node:fs").readFileSync(
    path.join(__dirname, "../electron/story-director.cjs"),
    "utf8",
  );
  a(!source.includes("level-draft"));
  a.equal(initial().player.draftExperience, undefined);
});
