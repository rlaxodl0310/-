"use strict";
let player,
  now = 0,
  xpSerial = 0;
const container = document.getElementById("progression");
function reset() {
  now = 0;
  xpSerial = 0;
  player = ResourceRules.create(2, 3);
  player.stats = {
    ...player.stats,
    strength: 10,
    agility: 12,
    defense: 5,
    magicAttack: 8,
    magicResistance: 4,
  };
  player.statPoints = 3;
  player.hp = 120;
  player.mana = 170;
  for (const [i, item] of [
    {
      id: "sample-gauntlet",
      name: "시험 건틀릿",
      kind: "equipment",
      category: "weapon",
      slot: "weapon",
      weaponType: "unarmed",
      stats: { strength: 5 },
      durability: 50,
      maxDurability: 50,
    },
    {
      id: "sample-armor",
      name: "시험 견갑",
      kind: "equipment",
      category: "armor",
      slot: "shoulder",
      stats: { defense: 3 },
      armor: { shoulder: { damageReduction: 0.33 } },
      durability: 50,
      maxDurability: 50,
    },
    {
      id: "sample-ring",
      name: "시험 생명 반지",
      kind: "equipment",
      category: "artifact",
      slot: "accessory1",
      stats: { health: 2, mana: 1 },
      durability: 50,
      maxDurability: 50,
    },
    { id: "sample-slime", species: "slime", kind: "essence" },
    { id: "sample-lairon", species: "lairon", kind: "essence" },
  ].entries())
    player = Progression.grant(player, item, "sample-reward-" + i, now);
  draw();
}
function draw() {
  document.getElementById("level-state").textContent =
    "레벨 " +
    (player.level ?? 1) +
    " · 경험치 " +
    (player.draftExperience?.xp || 0) +
    " / " +
    LevelDraft.required(player.level ?? 1) +
    " · 레벨업당 3포인트";
  container.replaceChildren();
  ProgressionUI.render(container, player, now, async (action) => {
    player = Progression.apply(player, action, now);
    draw();
  });
}
document.getElementById("reset").onclick = reset;
document.getElementById("wait").onclick = () => {
  now += 31;
  draw();
};
document.getElementById("break").onclick = () => {
  player = Progression.damageEquipment(player, "sample-gauntlet", 50);
  draw();
};
document.getElementById("reload").onclick = () => {
  const saved = JSON.stringify({ player, now });
  ({ player, now } = JSON.parse(saved));
  player = ResourceRules.normalise(Progression.recalculate(player));
  draw();
};
document.getElementById("xp").onclick = () => {
  player = LevelDraft.award(player, 100, "lab-xp-" + ++xpSerial);
  draw();
};
document.getElementById("integration").onclick = () => {
  const status = document.getElementById("integration-state");
  try {
    let sample = ResourceRules.create(2, 3);
    sample.stats = {
      ...sample.stats,
      strength: 10,
      defense: 5,
      magicAttack: 8,
      magicResistance: 4,
      agility: 12,
    };
    sample.hp = 120;
    sample.mana = 170;
    sample = LevelDraft.award(sample, 100, "integration-xp");
    sample = Progression.apply(sample, {
      type: "allocate",
      values: { strength: 3 },
    });
    sample = Progression.grant(
      sample,
      { id: "integration-essence", kind: "essence", species: "goblin" },
      "integration-drop",
      0,
    );
    sample = Progression.apply(
      sample,
      { type: "absorb", itemId: "integration-essence" },
      0,
    );
    sample = Progression.grant(
      sample,
      {
        id: "integration-weapon",
        name: "시험 무기",
        kind: "equipment",
        category: "weapon",
        slot: "weapon",
        weaponType: "unarmed",
        stats: { strength: 5 },
        durability: 50,
        maxDurability: 50,
      },
      "integration-loot",
      0,
    );
    sample = Progression.apply(
      sample,
      { type: "equip", itemId: "integration-weapon" },
      0,
    );
    const target = {
        level: 1,
        stats: { defense: 100 },
        armor: { torso: { damageReduction: 0 } },
      },
      verdict = CombatRules.resolveHit(
        { source: sample, target, basePower: 100, coefficient: 1 },
        () => 0.999,
      ),
      saved = JSON.stringify(sample),
      loaded = ResourceRules.normalise(
        Progression.recalculate(JSON.parse(saved)),
      ),
      again = CombatRules.resolveHit(
        { source: loaded, target, basePower: 100, coefficient: 1 },
        () => 0.999,
      );
    if (
      loaded.level !== 2 ||
      loaded.stats.strength !== 20 ||
      verdict.hpDamage !== 60.6 ||
      again.hpDamage !== verdict.hpDamage ||
      loaded.hp !== 120 ||
      loaded.mana !== 170
    )
      throw Error("통합 시험 결과가 예상값과 다릅니다.");
    status.textContent =
      "통과 · 레벨2 → 3포인트 배분 → 고블린 정수 → 무기 착용 → 힘20 → 피해60.6 → 저장/다시 읽기 동일. 본편 저장은 변경하지 않았습니다.";
  } catch (e) {
    status.textContent = "실패 · " + e.message;
  }
};
reset();
