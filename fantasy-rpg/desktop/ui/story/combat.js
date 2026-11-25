(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(
      require("../battle/roster.js"),
      require("../combat/rules.js"),
      require("../escort/model.js"),
    );
  else r.NarrativeCombat = f(r.CombatRoster, r.CombatRules, r.CaravanEscort);
})(globalThis, (Roster, Rules, Escort) => {
  "use strict";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function createCombat(monsters, mode, reason) {
    if (
      !monsters.length ||
      monsters.some((id) => !Roster.encounterMonsters.some((m) => m.id === id))
    )
      throw Error("등록된 적이 필요합니다.");
    const id = globalThis.crypto?.randomUUID?.() || "combat-" + Date.now();
    return {
      id,
      mode,
      reason,
      status: "playing",
      round: 0,
      rngState: Rules.hash(id),
      monsters: [...monsters],
      enemies: monsters.map((kind, i) => ({
        id: i,
        kind,
        level: 1,
        hp: Roster.get(kind).hp,
        max: Roster.get(kind).hp,
      })),
      distance: 2,
      guard: false,
    };
  }
  function resolveCombat(original, stats, intent, target = 0, tactical = {}) {
    if (original.mode !== "chat" || original.status !== "playing")
      throw Error("진행 중인 채팅 전투가 아닙니다.");
    if(Rules.fatigue(stats).exhausted&&!['observe','talk'].includes(intent))throw Error('탈진 상태에서는 공격·이동을 할 수 없습니다.');
    if (
      original.commonState &&
      typeof module === "object" &&
      module.exports &&
      !tactical.registeredSkill
    )
      return require("../skills/common-chat.js").resolve(
        { combat: original, player: stats },
        original.commonBook || null,
        null,
        "basic-" + original.id + "-" + original.round,
        target,
        intent,
        tactical,
      );
    if (
      !["attack", "defend", "move", "flee", "talk", "observe"].includes(intent)
    )
      throw Error("지원하지 않는 시도입니다.");
    if(Rules.fatigue(stats).exhausted&&!['observe','talk'].includes(intent))throw Error('탈진 상태에서는 공격·이동을 할 수 없습니다.');
    const combat = clone(original),
      player = clone(stats),
      random = Rules.rng(combat.rngState || Rules.hash(combat.id)),
      resolution = {
        intent,
        outgoing: 0,
        incoming: 0,
        escaped: false,
        enemyResponse: "",
        note: "",
        formulaEvents: [],
      },
      alive = () => combat.enemies.filter((e) => e.hp > 0),
      enemy =
        combat.enemies.find((e) => e.id === target && e.hp > 0) || alive()[0];
    if (!enemy) throw Error("유효한 적이 없습니다.");
    if (player.hp <= 0) throw Error("전투 불능입니다.");
    combat.round++;
    function hit(
      source,
      victim,
      basePower,
      part,
      extraReduction = 0,
      damageType = "physical",
    ) {
      const before = victim.hp,
        shields = (victim.commonStatuses || []).filter(
          (s) => s.key === "shield",
        ),
        verdict = Rules.resolveHit(
          {
            source,
            target: victim,
            basePower,
            part,
            damageType,
            extraReduction,
            shields,
            now: combat.round * 3,
          },
          () => random.next(),
        );
      victim.commonStatuses = (victim.commonStatuses || [])
        .filter((s) => s.key !== "shield")
        .concat(verdict.shields.map((s) => ({ ...s, key: "shield" })));
      victim.hp = Math.max(0, victim.hp - verdict.hpDamage);
      const actual = before - victim.hp;
      resolution.formulaEvents.push({
        id:
          "formula-" +
          combat.id +
          "-" +
          combat.round +
          "-" +
          resolution.formulaEvents.length,
        actor: source === player ? "taei" : "enemy-" + source.id,
        target: victim === player ? "taei" : victim.id?.startsWith?.("escort-") ? victim.id : "enemy-" + victim.id,
        damage: actual,
        verdict,
      });
      return { actual, verdict };
    }
    const registered = tactical.registeredSkill;
    if (registered) {
      const sk = registered;
      if (["strike", "bolt"].includes(sk.effect))
        resolution.outgoing = hit(
          player,
          enemy,
          sk.amount,
          player.aimPart || "torso",
          0,
          sk.damageType || "physical",
        ).actual;
      else if (sk.effect === "mend") {
        const h = Rules.healAmount({
          mana: sk.baseMana ?? sk.mana,
          grade: sk.grade || 1,
          healingPower: Rules.stat(player, "healingPower"),
          bonus: Rules.modifier(player, ["healingBonus"], 1, combat.round * 3),
          reduction: Rules.modifier(
            player,
            ["healingReduction"],
            0.75,
            combat.round * 3,
          ),
          hp: player.hp,
          maxHP: player.max,
        });
        resolution.healed = h.amount;
        player.hp += h.amount;
        resolution.formulaEvents.push({
          id: "heal-" + combat.id + "-" + combat.round,
          kind: "healing",
          amount: h.amount,
        });
      } else if (["barrier", "one-hit-barrier"].includes(sk.effect)) {
        const mode = sk.effect === "one-hit-barrier" ? "one-hit" : "absorb",
          capacity = Rules.shieldCapacity({
            mana: sk.baseMana ?? sk.mana,
            grade: sk.grade || 1,
            shieldPower: Rules.stat(player, "shieldPower"),
            mode,
          }),
          shields = Rules.grantShield(
            (player.commonStatuses || []).filter((s) => s.key === "shield"),
            {
              id: "shield-" + combat.id + "-" + combat.round,
              effectKey: mode,
              mode,
              capacity,
              source: "taei",
              key: "shield",
              until: combat.round * 3 + (mode === "one-hit" ? 5 : 8),
            },
            { maxHP: player.max, now: combat.round * 3 },
          );
        player.commonStatuses = (player.commonStatuses || [])
          .filter((s) => s.key !== "shield")
          .concat(shields);
      } else if (sk.effect === "guard") combat.guard = true;
      else if (sk.effect === "dash") {
        const old = combat.distance;
        combat.distance = Math.min(4, old + 2);
        resolution.moved = combat.distance - old;
      }
      resolution.note = sk.name + " 사용 판정";
    }
    if (!registered && intent === "attack") {
      if (combat.distance > 1) {
        combat.distance--;
        resolution.moved = 1;
        resolution.note = "공격 거리에 접근했다. 아직 타격은 닿지 않았다.";
      } else {
        resolution.outgoing = hit(
          player,
          enemy,
          12 + (combat.guard ? 4 : 0),
          player.aimPart || "torso",
        ).actual;
        resolution.note = "실제 타격 범위의 적에게 피해를 주었다.";
      }
      combat.guard = false;
    }
    if (intent === "defend") {
      combat.guard = true;
      resolution.note = "자세를 낮춰 다음 충격에 대비했다.";
    }
    if (intent === "move") {
      combat.distance = Math.min(4, combat.distance + 2);
      resolution.note = "주변을 보며 거리를 벌렸다.";
    }
    if (intent === "flee") {
      if (combat.distance >= 3) {
        combat.status = "escaped";
        resolution.escaped = true;
        resolution.note = "추격권을 벗어나 전투에서 이탈했다.";
      } else {
        combat.distance = Math.min(4, combat.distance + 2);
        resolution.note = "이탈을 시도하며 거리를 벌렸지만 적의 추격권 안이다.";
      }
    }
    if (["observe", "talk"].includes(intent) && !registered)
      resolution.note =
        "관찰하거나 말을 시도한다. 적이 공격을 멈춘다고 가정하지 않는다.";
    if (!alive().length) combat.status = "won";
    if (combat.status === "playing") {
      const actor = alive()[combat.round % alive().length],
        ranged = ["draven", "noxvern"].includes(actor.kind);
      if (tactical.delayEnemy) {
        resolution.enemyResponse =
          "접근로가 물건에 막히자 적이 옆으로 돌아갈 길을 찾는다.";
        combat.lastObstacleRound = combat.round;
      } else if (combat.distance > 1 && !ranged) {
        combat.distance--;
        resolution.enemyResponse = "적이 빈 거리를 좁히며 추격한다.";
      } else {
        const raw = Roster.get(actor.kind).damage,
          victim=Escort?Escort.combatTarget(combat,player,intent):player,
          r = hit(
            actor,
            victim,
            raw,
            actor.aimPart || "torso",
            combat.guard ? 0.65 : 0,
          );
        resolution.incoming = victim===player?r.actual:0;
        if(victim!==player){resolution.escortDamage={target:victim.id,name:victim.name,damage:r.actual,hp:victim.hp};resolution.enemyResponse='적이 '+victim.name+' 쪽으로 공격했다.';}
        if (registered?.effect === "guard") {
          resolution.blocked = Math.max(
            0,
            r.verdict.afterDefense - r.verdict.preShieldDamage,
          );
          combat.guard = false;
        }
        if(victim===player)resolution.enemyResponse = combat.guard
          ? "적의 공격을 대비한 자세로 받아냈다."
          : "적이 빈틈을 노려 공격했다.";
      }
      if (player.hp <= 0) combat.status = "lost";
    }
    combat.rngState = random.state;
    return { combat, player, resolution };
  }
  return { createCombat, resolveCombat };
});
