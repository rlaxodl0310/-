"use strict";
const R = require("../ui/combat/rules.js");
const CLAIM_SCHEMA = {
  type: "array",
  maxItems: 20,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["eventId", "kind", "value"],
    properties: {
      eventId: { type: "string" },
      kind: {
        type: "string",
        enum: [
          "damage",
          "healing",
          "absorbed",
          "armor-bypassed",
          "critical",
          "level-multiplier",
        ],
      },
      value: { type: "number" },
    },
  },
};
function examples() {
  const hit = (source, target, base = 100, other = {}) =>
    R.resolveHit(
      { source, target, basePower: base, coefficient: 0, ...other },
      () => 0.999999,
    );
  return [
    {
      scenario: "7레벨이1레벨을공격",
      actual: hit({ level: 7 }, { level: 1 }).hpDamage,
    },
    {
      scenario: "33%씩3회,치명타없음",
      actual: [0.33, 0.33, 0.33].map(
        (hitMultiplier) => hit({}, {}, 100, { hitMultiplier }).hpDamage,
      ),
    },
    {
      scenario: "방호한계100에300피해",
      actual: R.consumeShields(
        [
          {
            id: "example",
            mode: "one-hit",
            effectKey: "once",
            capacity: 100,
            remaining: 100,
            until: 5,
          },
        ],
        300,
      ).hpDamage,
    },
    {
      scenario: "MP24 2등급치유",
      actual: R.healAmount({ mana: 24, grade: 2, maxHP: 500, hp: 0 }).amount,
    },
    {
      scenario: "공격130 대 저항133",
      actual: R.vitalContest(100, 100, 0.3, 1, 0.33),
    },
    {
      scenario: "노출부위급소공략",
      actual: R.vitalContest(100, 100, 0.3, 1, 0),
    },
    {
      scenario: "치유는골절/절단/중독을자동제거하지않는다",
      actual: "HP회복만",
    },
  ];
}
function context() {
  return {
    rules: R.context(),
    examples: examples(),
    claimRule:
      "combatClaims는 실제 resolution.formulaEvents의eventId·kind·value를인용한다. 엔진판정전또는전투없으면빈배열. 수치·급소우회·치명타성공을발명하지않는다. 골절/절단치료를HP회복과동일시하지않는다.",
  };
}
function claims(resolution) {
  const rows = [];
  for (const e of resolution?.formulaEvents || []) {
    if (e.verdict) {
      rows.push(
        { eventId: e.id, kind: "damage", value: e.damage },
        { eventId: e.id, kind: "absorbed", value: e.verdict.absorbed },
        {
          eventId: e.id,
          kind: "armor-bypassed",
          value: e.verdict.armorBreached ? 1 : 0,
        },
        { eventId: e.id, kind: "critical", value: e.verdict.critical ? 1 : 0 },
        {
          eventId: e.id,
          kind: "level-multiplier",
          value: e.verdict.levelMultiplier,
        },
      );
    } else if (e.kind === "healing")
      rows.push({ eventId: e.id, kind: "healing", value: e.amount });
  }
  return rows;
}
function review(candidate, resolution) {
  const proposed = candidate.combatClaims || [],
    actual = claims(resolution),
    errors = [];
  if (!Array.isArray(proposed) || proposed.length > 20)
    return { errors: ["전투 수치 주장 형식이 올바르지 않습니다."] };
  for (const p of proposed) {
    if (
      !p ||
      !Number.isFinite(p.value) ||
      !actual.some(
        (e) =>
          e.eventId === p.eventId &&
          e.kind === p.kind &&
          Math.abs(e.value - p.value) < 1e-5,
      )
    )
      errors.push(
        "엔진 판정과 일치하지 않는 전투 수치/치명타/급소 주장입니다.",
      );
  }
  if (resolution) {
    const values = [
      resolution.outgoing,
      resolution.incoming,
      resolution.healed,
      ...actual
        .filter((e) => ["damage", "healing", "absorbed"].includes(e.kind))
        .map((e) => e.value),
    ].filter(Number.isFinite);
    const text = (candidate.panels || []).map((p) => p.text).join(" ");
    for (const m of text.matchAll(
      /(?:피해량|대미지|데미지|회복량|치유량)\s*(?:은|는|이|가|:)?\s*(\d+(?:\.\d+)?)(?![\d.%])/g,
    )) {
      if (!values.some((v) => Math.abs(v - Number(m[1])) < 0.02))
        errors.push("묘사한 피해/회복 수치가 실제 엔진 결과에 없습니다.");
    }
    for (const m of text.matchAll(
      /(\d+(?:\.\d+)?)\s*(?:의\s*)?(?:피해|대미지|데미지|회복)/g,
    )) {
      if (!values.some((v) => Math.abs(v - Number(m[1])) < 0.02))
        errors.push("묘사한 피해/회복 수치가 실제 엔진 결과에 없습니다.");
    }
  }
  return { errors };
}
module.exports = { context, claims, review, CLAIM_SCHEMA };
