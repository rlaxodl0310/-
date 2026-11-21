"use strict";
const $ = (id) => document.getElementById(id),
  v = (key) =>
    Number(document.querySelector('[data-value="' + key + '"]').value) || 0,
  R = CombatRules;
let state;
function reset() {
  const armor =
      $("armor-part").value === "none"
        ? {}
        : { [$("armor-part").value]: { damageReduction: v("armorDR") / 100 } },
    source = {
      level: v("sourceLevel"),
      attack: v("attack"),
      criticalChance: v("critical") / 100,
      vitalAccuracy: v("vital") / 100,
    },
    target = {
      level: v("targetLevel"),
      defense: v("defense"),
      armor,
      max: 500,
      hp: 500,
    };
  let shields = [];
  const mode = $("shield-mode").value;
  if (mode !== "none") {
    const capacity =
      mode === "one-hit"
        ? v("limit")
        : R.shieldCapacity({ mana: v("shieldMP"), grade: v("grade") });
    shields = R.grantShield(
      [],
      {
        id: "test-shield",
        effectKey: "trial",
        mode,
        capacity,
        until: mode === "one-hit" ? 5 : 8,
      },
      { maxHP: 500, now: 0 },
    );
  }
  state = {
    source,
    target,
    shields,
    spec: {
      basePower: v("base"),
      coefficient: v("coefficient"),
      hitMultiplier: v("hitPercent") / 100,
      penetrationPercent: v("percentPen") / 100,
      penetrationFlat: v("flatPen"),
      part: $("part").value,
      hits: Math.max(1, v("hits")),
      mana: v("healMP"),
      grade: v("grade"),
    },
    random: R.rng(71),
    count: 0,
  };
  $("rows").replaceChildren();
  $("detail").textContent =
    "시험 상태를 초기화했습니다. 타격마다 독립 판정을 확인하세요.";
  draw();
}
function draw() {
  const shield =
    R.activeShields(state.shields)
      .map((s) =>
        s.mode === "one-hit"
          ? "1회 차단 · 한계 " + s.capacity
          : "흡수 잔량 " + s.remaining.toFixed(2),
      )
      .join(" / ") || "보호막 없음";
  $("status").textContent =
    "HP " + state.target.hp.toFixed(2) + " / 500 · " + shield;
  $("hp").style.width = state.target.hp / 5 + "%";
  $("lag").style.width = state.target.hp / 5 + "%";
  $("hit").disabled = state.count >= state.spec.hits || state.target.hp <= 0;
}
$("reset").onclick = reset;
$("hit").onclick = () => {
  const result = R.resolveHit(
    {
      source: state.source,
      target: state.target,
      ...state.spec,
      shields: state.shields,
    },
    () => state.random.next(),
  );
  state.shields = result.shields;
  state.target.hp = Math.max(0, state.target.hp - result.hpDamage);
  state.count++;
  const row = document.createElement("tr");
  for (const value of [
    state.count,
    result.hpDamage.toFixed(2),
    result.absorbed.toFixed(2),
    [
      result.critical ? "치명타" : "일반",
      result.armorBreached
        ? "방호 우회"
        : result.armorPresent
          ? "부위 방호"
          : "노출",
      result.blockEffects ? "완전 차단" : "",
    ]
      .filter(Boolean)
      .join(" · "),
  ]) {
    const td = document.createElement("td");
    td.textContent = value;
    row.append(td);
  }
  $("rows").append(row);
  $("detail").textContent =
    "레벨 보정 ×" +
    result.levelMultiplier.toFixed(2) +
    " · 유효 방어력 " +
    result.effectiveDefense.toFixed(2) +
    " · 우회 확률 " +
    (result.breachChance * 100).toFixed(2) +
    "% · 노출부 추가 피해 " +
    (result.excessVital * 100).toFixed(2) +
    "%";
  draw();
};
$("heal").onclick = () => {
  if(state.target.hp<=0){$("detail").textContent="전투 불능은 일반 치유만으로 회복하지 않습니다.";return;}
  const r = R.healAmount({
    mana: state.spec.mana,
    grade: state.spec.grade,
    maxHP: 500,
    hp: state.target.hp,
  });
  state.target.hp += r.amount;
  $("detail").textContent =
    "실제 HP 회복 " +
    r.amount.toFixed(2) +
    " · 초과 회복 " +
    r.overheal.toFixed(2) +
    " 버림 · 부상 상태는 별도";
  draw();
};
reset();
