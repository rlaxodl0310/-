"use strict";
const $ = (id) => document.getElementById(id),
  ctx = $("arena").getContext("2d"),
  keys = new Set(),
  pixels = new Image();
pixels.src = "../battle/assets/battle-pixels.png";
let battle,
  selected,
  last = 0,
  preview = null;
for (const category of [
  ...new Set(CommonSkills.records.map((d) => d.category)),
]) {
  const o = document.createElement("option");
  o.value = category;
  o.textContent = category;
  $("category").append(o);
}
function notice(text) {
  $("notice").textContent = text;
}
function reset() {
  if (!selected) return;
  const hp = Math.max(1, Math.min(100, Number($("hp-stat").value) || 1)),
    mp = Math.max(1, Math.min(100, Number($("mp-stat").value) || 1)),
    type = $("weapon").value,
    r = ResourceRules.create(hp, mp);
  const learned = SkillSystem.learnCommon(null, selected.id, "taei", {
    kind: "test",
    eventId: "effect-lab",
  });
  battle = new RealTimeBattle({
    skillBook: learned.book,
    resources: r,
    weaponType: type,
    weapon: type === "bow" ? "bow" : type === "focus" ? "magic" : "gauntlet",
    monsters: ["goblin"],
    stats: { goblin: { hp: 10000, name: "시험 표적" } },
    allies: [{ id: "yeogyeong", name: "시험 아군", weapon: "magic" }],
    manaRegen: false,
    props: [
      {
        id: "test-stone",
        name: "시험용 작은 돌",
        x: 6,
        y: 6,
        weight: "light",
        fixed: false,
      },
    ],
  });
  battle.units[0].objectTarget = "test-stone";
  const p = battle.units[0];
  p.hp = p.max * 0.75;
  const ally = battle.units.find((u) => u.id === "yeogyeong");
  ally.x = 4;
  ally.y = 7;
  ally.hp = 30;
  ally.max = 100;
  ally.order = "hold";
  ally.cooldown = 1e8;
  const e = battle.living("enemy")[0];
  e.x = 6.4;
  e.y = 8;
  e.speed = 0;
  e.cooldown = 1e8;
  e.mass = 80;
  p.supportTarget = ally.id;
  last = 0;
  preview = null;
  $("pause").textContent = "일시정지";
  notice("시험 초기화 · 본편 저장과 습득 목록은 바뀌지 않습니다.");
}
function select() {
  selected = CommonSkills.get($("skill").value);
  if (!selected) return;
  $("title").textContent =
    selected.name + " · " + selected.grade + "등급 · MP " + selected.mana;
  $("description").textContent = selected.description;
  $("requirement").textContent =
    selected.category +
    " · 쿨타임 없음" +
    (selected.mechanic.weapon
      ? " · 필요 무기: " +
        ({
          sword: "검",
          spear: "창",
          shield: "방패",
          ranged: "원거리 무기",
          blade: "날붙이",
          any: "무기",
        }[selected.mechanic.weapon] || selected.mechanic.weapon)
      : " · 직업 제한 없음");
  $("details").textContent =
    selected.effectText +
    " / " +
    (selected.support === "context-required"
      ? "실제 물건/혈흔/장비/스태미나 조건 필요"
      : "전투 시험 가능 · 무기/거리/특수 조건은 별도 검사");
  reset();
}
function filter() {
  const q = $("search").value.trim(),
    category = $("category").value,
    grade = Number($("grade").value),
    list = CommonSkills.records.filter(
      (d) =>
        (!q || d.name.includes(q)) &&
        (!category || d.category === category) &&
        (!grade || d.grade === grade),
    );
  $("skill").replaceChildren();
  for (const d of list) {
    const o = document.createElement("option");
    o.value = d.id;
    o.textContent =
      d.name +
      " · " +
      d.grade +
      "등급 · MP " +
      d.mana +
      " · " +
      d.category.replace(/^\d+\.\s*/, "");
    $("skill").append(o);
  }
  $("count").textContent = list.length + " / 181항목";
  if (list.length) select();
  else {
    selected = null;
    battle = null;
    $("title").textContent = "검색 결과 없음";
  }
}
for (const id of ["search", "category", "grade"])
  $(id).addEventListener(id === "search" ? "input" : "change", filter);
$("skill").onchange = select;
$("reset").onclick = reset;
$("pause").onclick = () => {
  if (!battle) return;
  battle.setPaused(!battle.paused);
  $("pause").textContent = battle.paused ? "재개" : "일시정지";
};
$("cast").onclick = () => {
  if (!battle) return;
  const r = battle.submitIntent(
    {
      intent: "registered_skill",
      skillId: battle.skillBook.skills[0].id,
      targetId: battle.selected,
      when: "now",
    },
    "catalog-cast-" + Date.now(),
  );
  notice(
    r.ok
      ? r.planned
        ? "재개 시 조건을 다시 검사합니다."
        : "준비 동작을 시작했습니다. 결과는 실제 적중으로 결정됩니다."
      : r.error,
  );
};
$("preview").onclick = () => {
  if (!selected || !battle) return;
  preview = {
    time: performance.now(),
    x: battle.units[0].x,
    y: battle.units[0].y,
    face: { x: 1, y: 0 },
    visual: selected.visual,
  };
  notice("이펙트만 표시합니다. 시전·피해·마나·숙련에는 반영하지 않습니다.");
};
$("incoming").onclick = () => {
  if (!battle || battle.paused) return;
  const e = battle.living("enemy")[0];
  if (e) battle.damage(e, battle.units[0], 20);
};
addEventListener("keydown", (e) => {
  if (e.target.matches("input,select")) return;
  if (e.code.startsWith("Arrow")) e.preventDefault();
  keys.add(e.code);
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
const point = (u) => ({
  x: $("arena").width * 0.48 + (u.x - battle.units[0].x) * 60,
  y: 235 + (u.y - battle.units[0].y) * 45,
});
function drawUnit(u) {
  const p = point(u),
    size = u.kind === "illusion" ? 58 : 72;
  ctx.save();
  if (u.kind === "illusion") ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#071a2455";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 22, 7, 0, 0, 7);
  ctx.fill();
  if (
    pixels.complete &&
    pixels.naturalWidth &&
    ["taei", "goblin"].includes(u.kind)
  ) {
    const row = u.kind === "taei" ? 0 : 2,
      col = u.action
        ? 1
        : u.attackFlash > 0
          ? 2
          : u.animation === "move"
            ? Math.floor(battle.time * 7) % 2
            : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      pixels,
      (col * pixels.width) / 3,
      (row * pixels.height) / 5,
      pixels.width / 3,
      pixels.height / 5,
      p.x - size / 2,
      p.y - size * 0.8,
      size,
      size,
    );
  } else {
    ctx.fillStyle = u.team === "enemy" ? "#bf9b7a" : "#b9d7cd";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 6, 13, 0, 7);
    ctx.fill();
  }
  SkillEffects.weapon(
    ctx,
    p.x + size * 0.17,
    p.y - size * 0.26,
    size,
    u.equipmentType,
    u.attackFlash || 0,
  );
  ctx.font = "14px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "#e0ebdf";
  ctx.fillText(u.name, p.x, p.y - (u.id === "taei" ? 86 : 70));
  const width = 52;
  u.lagHP ??= u.hp;
  u.lagHP += (u.hp - u.lagHP) * 0.06;
  ctx.fillStyle = "#283b43";
  ctx.fillRect(p.x - width / 2, p.y - 59, width, 6);
  ctx.fillStyle = "#8c999e";
  ctx.fillRect(p.x - width / 2, p.y - 59, (width * u.lagHP) / u.max, 6);
  ctx.fillStyle = "#e77573";
  ctx.fillRect(p.x - width / 2, p.y - 59, (width * u.hp) / u.max, 6);
  ctx.restore();
}
function frame(ms) {
  requestAnimationFrame(frame);
  const width = Math.max(280, Math.round($("arena").clientWidth));
  if ($("arena").width !== width) $("arena").width = width;
  if ($("arena").height !== 360) $("arena").height = 360;
  ctx.clearRect(0, 0, width, 360);
  if (!battle) return;
  const dt = last ? Math.min(0.05, (ms - last) / 1000) : 0;
  last = ms;
  battle.step(dt, {
    x:
      Number(keys.has("KeyD") || keys.has("ArrowRight")) -
      Number(keys.has("KeyA") || keys.has("ArrowLeft")),
    y:
      Number(keys.has("KeyS") || keys.has("ArrowDown")) -
      Number(keys.has("KeyW") || keys.has("ArrowUp")),
  });
  ctx.strokeStyle = "#294149";
  for (let i = 0; i < width; i += 42) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 360);
    ctx.stroke();
  }
  for (let i = 0; i < 360; i += 34) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }
  for (const f of battle.commonFields || []) {
    const p = point(f);
    ctx.fillStyle = f.blocks ? "#a0d4de55" : "#afa9e026";
    ctx.beginPath();
    ctx.arc(p.x, p.y, f.radius * 34, 0, 7);
    ctx.fill();
  }
  for (const u of battle.units
    .filter((u) => u.hp > 0)
    .sort((a, b) => a.y - b.y))
    drawUnit(u);
  for (const e of battle.events)
    if (e.type === "skill_fx")
      SkillEffects.draw(
        ctx,
        e,
        point,
        36,
        battle.time - e.time,
        matchMedia("(prefers-reduced-motion:reduce)").matches,
      );
  if (preview)
    SkillEffects.draw(
      ctx,
      preview,
      point,
      36,
      (performance.now() - preview.time) / 1000,
      matchMedia("(prefers-reduced-motion:reduce)").matches,
    );
  for (const shot of battle.projectiles) {
    const p = point(shot);
    ctx.fillStyle = "#c2ddfa";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 7);
    ctx.fill();
  }
  const p = battle.units[0],
    e = battle.living("enemy")[0],
    stats = p.resourceStats || { health: 1, mana: 1 };
  $("status").textContent =
    "체력 " +
    stats.health +
    " → HP " +
    Math.ceil(p.hp) +
    "/" +
    p.max +
    " · 마나 " +
    stats.mana +
    " → MP " +
    Math.floor(p.mana) +
    "/" +
    p.maxMana +
    "\n표적 HP " +
    Math.ceil(e?.hp || 0) +
    " · " +
    (battle.paused ? "일시정지" : battle.time.toFixed(1) + "초");
  const progress = battle.skillBook.progress[battle.skillBook.skills[0].id];
  $("mastery").textContent =
    "등급 " +
    selected.grade +
    " 고정 · 유효 사용 " +
    progress.uses +
    "회 · 숙련 경험 " +
    progress.xp +
    " · 활성 상태: " +
    battle.units
      .filter((u) => battle.statuses(u).length)
      .map(
        (u) =>
          u.name +
          " [" +
          battle
            .statuses(u)
            .map((s) => s.key)
            .join(", ") +
          "]",
      )
      .join(" / ");
}
filter();
requestAnimationFrame(frame);
