"use strict";
let player,
  now = 0;
const container = document.getElementById("progression");
function reset() {
  now = 0;
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
reset();
