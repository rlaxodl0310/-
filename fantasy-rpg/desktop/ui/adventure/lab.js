"use strict";
let state,
  rare = "essence",
  serial = 0;
const root = document.getElementById("panel-body");
function reset() {
  state = {
    version: 1,
    revision: 0,
    era: "fantasy",
    location: "north-city-01",
    minutes: 0,
    player: ResourceRules.create(2, 3),
    combat: null,
  };
  state.player.stats.strength = 100;
  state = Adventure.ensure(state);
  serial = 0;
  draw();
}
function create(monsters, mode, reason) {
  const c = NarrativeCombat.createCombat(monsters, mode, reason);
  if (rare) {
    for (let i = 0; i < 1000000; i++) {
      const id = "lab-rare-" + serial + "-" + i;
      const roll = CombatRules.rng(
        CombatRules.hash("drop:" + id + ":0"),
      ).next();
      if (
        rare === "essence"
          ? roll < Adventure.policy.essenceChance
          : roll >= Adventure.policy.essenceChance &&
            roll <
              Adventure.policy.essenceChance + Adventure.policy.soulStoneChance
      ) {
        c.id = id;
        break;
      }
    }
  }
  return c;
}
function draw() {
  root.replaceChildren();
  AdventureUI.render(
    root,
    state,
    async (action) => {
      if (action.type === "refreshAI") action = { type: "refresh" };
      state = Adventure.apply(state, action, {
        requestId: "lab-action-" + ++serial,
        createCombat: create,
      });
      state.revision++;
      draw();
    },
    {
      allowAI: false,
      onTravel: (text) => {
        if (state.combat?.status === "playing") return;
        const target = GameGeography.records.find(
          (p) => text === Adventure.travelText(p.id),
        );
        if (!target) return;
        state.location = target.id;
        state.minutes += 10;
        state.combat = null;
        state = Adventure.ensure(state);
        draw();
      },
      onAbsorb: async (itemId) => {
        state.player = Progression.apply(
          state.player,
          { type: "absorb", itemId },
          state.minutes,
        );
        draw();
      },
    },
  );
  document.getElementById("attack").disabled =
    state.combat?.status !== "playing";
  document.getElementById("test-status").textContent =
    "세계 시간 " +
    state.minutes +
    "분 · 레벨 " +
    (state.player.level || 1) +
    " · 누적XP " +
    (state.player.experience?.total || 0) +
    " · 정수 슬롯 " +
    (state.player.progression?.absorbed.length || 0) +
    "/1";
}
document.getElementById("reset").onclick = reset;
document.getElementById("rare").onclick = () => {
  rare = rare === "essence" ? "soul" : rare === "soul" ? false : "essence";
  document.getElementById("rare").textContent =
    "희귀 드랍 고정 시험 · " +
    (rare === "essence" ? "정수" : rare === "soul" ? "영혼석" : "꺼짐");
};
document.getElementById("wait").onclick = () => {
  state.minutes += 31;
  state = Adventure.ensure(state);
  draw();
};
document.getElementById("save").onclick = () => {
  state = Adventure.ensure(JSON.parse(JSON.stringify(state)));
  state.player = ResourceRules.normalise(state.player);
  draw();
};
document.getElementById("attack").onclick = () => {
  const previous = JSON.parse(JSON.stringify(state)),
    result = NarrativeCombat.resolveCombat(
      state.combat,
      state.player,
      "attack",
      state.combat.enemies.find((e) => e.hp > 0)?.id || 0,
    );
  state = { ...state, player: result.player, combat: result.combat };
  state.player = ExperienceRules.settleBattle(
    state.player,
    previous.combat,
    state.combat,
  );
  state = Adventure.observe(previous, state);
  draw();
};
reset();
