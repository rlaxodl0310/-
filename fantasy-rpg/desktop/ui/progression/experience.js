(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(
      require("./model.js"),
      require("../monsters/essence-rules.js"),
    );
  else r.ExperienceRules = f(r.Progression, r.EssenceRules);
})(globalThis, (G, E) => {
  "use strict";
  const policy = Object.freeze({
    version: 1,
    decadeMultiplier: 1.6,
    exponent: 1.6,
    base: 100,
  });
  const monsterBase = Object.freeze({
    goblin: 26,
    slime: 16,
    moa: 18,
    ruke: 30,
    por: 22,
    tork: 28,
    kar: 24,
    ves: 25,
    rat: 20,
    chitin: 32,
    ant: 23,
    clad: 125,
    velum: 140,
    draven: 165,
    lairon: 650,
    noxvern: 1800,
  });
  const gradeBase = [
      0, 20, 120, 650, 1800, 5000, 14000, 40000, 110000, 300000, 850000,
    ],
    ranks = ["F", "E", "D", "C", "B", "A", "S", "SSS", "EX"],
    questBase = [30, 90, 250, 700, 1800, 5000, 14000, 50000, 180000];
  function required(level) {
    if (!Number.isSafeInteger(level) || level < 1)
      throw Error("레벨이 잘못되었습니다.");
    const n =
      Math.ceil(
        (policy.base *
          Math.pow(level, policy.exponent) *
          Math.pow(policy.decadeMultiplier, Math.floor(level / 10))) /
          10,
      ) * 10;
    if (!Number.isSafeInteger(n))
      throw Error("경험치 계산 범위를 초과했습니다.");
    return n;
  }
  function monsterReward(species) {
    const e = E.records.find((x) => x.id === species);
    if (!e) throw Error("등록되지 않은 몬스터입니다.");
    return monsterBase[species] ?? gradeBase[e.stars];
  }
  function questReward(rank, type) {
    const index = ranks.indexOf(rank);
    if (index < 0) throw Error("의뢰 랭크가 잘못되었습니다.");
    return Math.ceil(
      questBase[index] *
        ({
          caravan: 1.2,
          escort: 1,
          hunt: 1.15,
          dungeon: 1.5,
          ecology: 1,
          mining: 1.1,
          supply: 0.8,
          rescue: 1.4,
        }[type] ?? 1),
    );
  }
  function seed() {
    return {
      level: 1,
      hp: 100,
      max: 100,
      mana: 100,
      maxMana: 100,
      stats: { health: 1, mana: 1 },
      resourceVersion: 2,
    };
  }
  function record(actor) {
    const r = actor.experience || { version: 1, xp: 0, total: 0, receipts: [] };
    if (
      r.version !== 1 ||
      !Number.isSafeInteger(r.xp) ||
      r.xp < 0 ||
      r.xp >= required(actor.level ?? 1) ||
      !Number.isSafeInteger(r.total) ||
      r.total < 0 ||
      !Array.isArray(r.receipts) ||
      r.total < r.xp ||
      r.receipts.some(
        (x) =>
          !/^[-a-zA-Z0-9_:]{1,90}$/.test(x.id || "") ||
          !Number.isSafeInteger(x.xp) ||
          x.xp <= 0 ||
          !["monster", "quest", "test"].includes(x.source),
      ) ||
      new Set(r.receipts.map((x) => x.id)).size !== r.receipts.length
    )
      throw Error("경험치 기록이 잘못되었습니다.");
    return r;
  }
  function award(actor, xp, eventId, source) {
    if (
      !Number.isSafeInteger(xp) ||
      xp <= 0 ||
      !/^[-a-zA-Z0-9_:]{1,90}$/.test(eventId || "") ||
      !["monster", "quest", "test"].includes(source)
    )
      throw Error("경험치 보상 형식이 잘못되었습니다.");
    let p = G.ensure(actor);
    const old = record(p),
      prior = old.receipts.find((x) => x.id === eventId);
    if (prior) {
      if (prior.xp !== xp || prior.source !== source)
        throw Error("같은 경험치 사건의 내용이 다릅니다.");
      return G.recalculate(p);
    }
    if (!Number.isSafeInteger(old.total + xp))
      throw Error("경험치 합계 범위를 초과했습니다.");
    let level = p.level ?? 1,
      remaining = old.xp + xp,
      steps = 0;
    while (remaining >= required(level)) {
      remaining -= required(level);
      level++;
      if (++steps > 10000)
        throw Error("한 번에 지급하는 경험치가 너무 큽니다.");
    }
    if (level > (p.level ?? 1)) p = G.awardLevel(p, level, "xp:" + eventId);
    p.experience = {
      version: 1,
      xp: remaining,
      total: old.total + xp,
      receipts: [...old.receipts, { id: eventId, xp, source }],
    };
    return G.recalculate(p);
  }
  function settleBattle(actor, previous, next) {
    if (
      !previous ||
      !next ||
      previous.id !== next.id ||
      previous.status !== "playing" ||
      next.status !== "won"
    )
      return actor;
    if (
      !next.enemies?.length ||
      next.enemies.some((e) => e.hp > 0) ||
      next.enemies.length !== previous.enemies.length ||
      next.enemies.some(
        (e, i) =>
          e.id !== previous.enemies[i].id ||
          e.kind !== previous.enemies[i].kind,
      )
    )
      throw Error("검증할 수 없는 전투 보상입니다.");
    let p = actor;
    for (const e of next.enemies)
      p = award(
        p,
        monsterReward(e.kind),
        "battle:" + next.id + ":" + e.id,
        "monster",
      );
    return p;
  }
  return {
    policy,
    required,
    monsterBase,
    monsterReward,
    questReward,
    seed,
    record,
    award,
    settleBattle,
  };
});
