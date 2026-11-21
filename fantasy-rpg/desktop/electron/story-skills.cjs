"use strict";
const S = require("../ui/skills/system.js"),
  Common = require("../ui/skills/common.js"),
  CommonChat = require("../ui/skills/common-chat.js");
const { resolveCombat } = require("../ui/story/combat.js");
function proposals(state, result) {
  const ps = result.skillProposals || [];
  if (!Array.isArray(ps) || ps.length > 2)
    throw Error("스킬 제안 한도를 지켜 주세요.");
  let b = S.read(state.skillBook);
  for (const p of ps) {
    if (!["taei", ...state.present].includes(p.ownerId))
      throw Error("현장에 없는 인물의 스킬을 새로 등록할 수 없습니다.");
    b = S.register(b, p, { era: state.era }).book;
  }
  return b;
}
function select(state, input) {
  if (
    state.era !== "fantasy" ||
    /[?？]|않|말고|말자|어때|가능|할까|설명|알려|취소|안\s/.test(input)
  )
    return null;
  const matches = S.read(state.skillBook).skills.filter(
    (s) =>
      s.ownerId === "taei" &&
      input.includes(s.name) &&
      /사용|시전|발동|써|쓴다|쓸게/.test(input),
  );
  if (matches.length > 1) throw Error("한 번에 스킬 하나를 선택해 주세요.");
  return matches[0] || null;
}
function cast(state, skill, input, id, target = 0) {
 if(require('../ui/combat/stats.js').fatigue(state.player).exhausted)throw Error('탈진 상태에서는 스킬을 사용할 수 없습니다.');
  if (skill.origin === "common") {
    const def = Common.get(skill.commonId);
    if (["pull_object", "vibrate_object"].includes(def.mechanic.kind)) {
      const objects =
          state.actionWorld?.locations?.[state.era + ":" + state.location]
            ?.objects || [],
        named = objects.filter((o) => input.includes(o.name)),
        eligible = named.length
          ? named
          : objects.filter((o) => !o.fixed && o.weight === "light");
      if (eligible.length !== 1)
        throw Error("사용할 물건을 이름으로 명확히 지정해 주세요.");
      state = { ...state, skillObjectTarget: eligible[0].id };
    }
    return CommonChat.resolve(state, state.skillBook, skill, id, target);
  }
  if (state.combat?.mode !== "chat" || state.combat.status !== "playing")
    throw Error("스킬은 현재 진행 중인 일반 전투에서 사용해 주세요.");
  const b = S.read(state.skillBook),
    enemy =
      state.combat.enemies.find((e) => e.id === target && e.hp > 0) ||
      state.combat.enemies.find((e) => e.hp > 0),
    now = b.clock,
    ctx = {
      actorId: "taei",
      now,
      hp: state.player.hp,
      mana: state.player.mana,
      distance: skill.effect === "mend" ? 0 : state.combat.distance,
      targetAlive: !!enemy,
      targetTeam: skill.effect === "mend" ? "ally" : "enemy",
      equipmentIds: state.player.equipmentIds || [],
      castId: id,
    };
  if (skill.effect === "mend" && state.player.hp >= state.player.max)
    throw Error("이미 체력이 가득 차 있습니다.");
  const prepared = S.prepare(b, skill.id, ctx),
    used = S.consume(b, prepared, ctx);
  let book = used.book;
  book.clock = now + 3;
  const next = resolveCombat(
    state.combat,
    { ...state.player, mana: state.player.mana - prepared.mana },
    "observe",
    target,
    {
      registeredSkill: {
        ...prepared,
        skill: undefined,
        effect: skill.effect,
        damageType:skill.element==='physical'?'physical':'magic',
        name: skill.name,
      },
    },
  );
  const amount =
    next.resolution.outgoing ||
    next.resolution.healed ||
    next.resolution.blocked ||
    next.resolution.moved ||
    0;
  if (amount > 0)
    book = S.award(book, {
      id,
      castId: id,
      skillId: skill.id,
      ownerId: "taei",
      encounterId: state.combat.id,
      targetId: String(enemy?.id ?? "taei"),
      amount,
      meaningful: true,
    });
  if (next.resolution.incoming > 0)
    book = S.incoming(
      book,
      "taei",
      Math.min(state.player.hp, next.resolution.incoming),
      book.clock,
    );
  next.resolution.skillId = skill.id;
  next.resolution.skillName = skill.name;
  next.resolution.visual = skill.visual;
  return { ...next, skillBook: book };
}
function observe(state, next, id) {
  let b = S.read(next.skillBook || state.skillBook);
  if (next.resolution?.skillId || next.resolution?.engine === "common") {
    b.clock += Math.max(
      0,
      (next.elapsedMinutes || 0) * 60 -
        (next.resolution?.engine === "common" ? 2 : 3),
    );
    return b;
  }
  const r = next.resolution;
  const acted =
    r &&
    (!r.steps?.length ||
      r.steps.some((s) => s.status === "success") ||
      r.enemyResponse ||
      r.incoming > 0 ||
      r.outgoing > 0);
  b.clock += Math.max(
    acted ? 3 : 0,
    Math.max(0, Math.min(900, (next.elapsedMinutes || 0) * 60)),
  );
  if (state.era === "fantasy" && state.combat && r?.outgoing > 0) {
    const target =
      state.combat.enemies.find((e) => e.id === (r.target ?? 0) && e.hp > 0) ||
      state.combat.enemies.find((e) => e.hp > 0);
    if (target)
      b = S.practice(b, {
        id,
        ownerId: "taei",
        encounterId: state.combat.id,
        targetId: String(target.id),
        kind: "unarmed",
        amount: Math.min(target.hp, r.outgoing),
        meaningful: true,
      });
  }
  if (r?.incoming > 0)
    b = S.incoming(b, "taei", Math.min(state.player.hp, r.incoming), b.clock);
  return b;
}
// The desktop combat client is trusted for hit outcomes, as it already is for HP.
// Never accept new definitions/capabilities from that client; bound mastery gains.
function finish(original, returned, duration) {
  let b = S.read(original);
  if (!returned) return b;
  if (JSON.stringify(returned).length > 512000)
    throw Error("전투 스킬 기록이 너무 큽니다.");
  const r = S.read(returned);
  if (
    JSON.stringify(r.skills) !== JSON.stringify(b.skills) ||
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > 21600
  )
    throw Error("전투 스킬 기록이 일치하지 않습니다.");
  const end = b.clock + duration;
  const fresh = r.practice.filter(
    (e) =>
      !b.practice.some((old) => old.id === e.id) &&
      !b.evidence.some((old) => old.id === e.id),
  );
  if (fresh.length > Math.ceil(duration / 0.15) + 1)
    throw Error("수련 기록 한도를 벗어났습니다.");
  for (const event of fresh) {
    if (event.ownerId !== "taei" || event.kind !== "unarmed")
      throw Error("전투 수련 기록이 일치하지 않습니다.");
    b = S.practice(b, event);
  }
  if (JSON.stringify(r.capabilities) !== JSON.stringify(b.capabilities))
    throw Error("전투 클라이언트가 능력 근거를 바꿀 수 없습니다.");
  for (const skill of b.skills) {
    const before = b.progress[skill.id] || { xp: 0, uses: 0, encounters: {} },
      after = r.progress[skill.id];
    if (
      !after ||
      !Number.isInteger(after.xp) ||
      !Number.isInteger(after.uses) ||
      after.xp < before.xp ||
      after.xp - before.xp > 20 ||
      after.uses < before.uses ||
      after.uses - before.uses > Math.ceil(duration / 0.2) + 1 ||
      (skill.ownerId !== "taei" &&
        (after.xp !== before.xp || after.uses !== before.uses))
    )
      throw Error("스킬 사용 기록 범위를 벗어났습니다.");
    b.progress[skill.id] = { ...before, xp: after.xp, uses: after.uses };
  }
  const rt = r.runtime.taei;
  if (rt) {
    const cooldowns = {};
    for (const [id, time] of Object.entries(rt.cooldowns || {})) {
      const sk = b.skills.find((s) => s.id === id && s.ownerId === "taei");
      if (
        !sk ||
        !Number.isFinite(time) ||
        time < 0 ||
        time > end + sk.cost.cooldown + 0.01
      )
        throw Error("재사용 시간 기록이 잘못되었습니다.");
      cooldowns[id] = time;
    }
    if (
      (rt.lastDamageAt !== undefined &&
        (!Number.isFinite(rt.lastDamageAt) ||
          rt.lastDamageAt < 0 ||
          rt.lastDamageAt > end)) ||
      !Number.isFinite(rt.impact ?? 0) ||
      (rt.impact || 0) < 0 ||
      (rt.impact || 0) > 30
    )
      throw Error("피격 기록이 잘못되었습니다.");
    b.runtime.taei = {
      cooldowns,
      impact: rt.impact || 0,
      ...(rt.lastDamageAt === undefined
        ? {}
        : { lastDamageAt: rt.lastDamageAt }),
    };
  }
  b.clock = end;
  b.revision++;
  return b;
}

function events(prior, next, resolution) {
  const added = next.skillBook.skills.filter(
    (s) => !S.read(prior.skillBook).skills.some((old) => old.id === s.id),
  );
  const rows = added.map(
    (s) => "기술 등록: " + s.ownerId + " / " + s.name + " / " + s.id,
  );
  if (resolution?.skillId)
    rows.push(
      "기술 사용: " +
        resolution.skillName +
        " / 실제 피해 " +
        (resolution.outgoing || 0) +
        " / 회복 " +
        (resolution.healed || 0) +
        " / 받은 피해 " +
        (resolution.incoming || 0) +
        " / 남은 마나 " +
        next.player.mana,
    );
  return rows.map((text, i) => ({
    id: "skill-event-" + next.revision + "-" + i,
    turn: next.revision,
    text,
    evidence: "스킬 엔진 판정",
    source: "engine-skill",
    witnesses: ["taei", ...next.present],
  }));
}
module.exports = {
  proposals,
  select,
  cast,
  observe,
  finish,
  events,
  train,
  commonContext,
};

function commonContext(state, input) {
  const ids = Common.records
    .filter((d) => input.includes(d.name))
    .map((d) => d.id);
  return {
    rule: "공용 도감은 습득 목록이 아니다. 공용 기술은 등급 고정, MP 소모, 쿨타임 없음. 실제 무기/조건/학습을 검사한다. 현재 MP 상한은 마나 스탯×100이다. 기본1등급은 안전한 비전투 장소에서 이름+수련 입력으로3회 연습하여 배운다. 고등급은 실제 교사/교본 습득 근거가 필요하다.",
    matchingSkills: ids.map((id) => Common.get(id)),
    learned:
      state.skillBook?.skills
        .filter((s) => s.origin === "common")
        .map((s) => S.describe(state.skillBook, s)) || [],
  };
}
function train(state, input, id) {
  if (
    state.era !== "fantasy" ||
    /[?？]|말고|않|취소|안\s/.test(input) ||
    !/수련|연습|배운다|배울게/.test(input)
  )
    return null;
  let ds = Common.records.filter((d) => input.includes(d.name));
  if (ds.length > 1) {
    const qualified = ds.filter((d) =>
      input.includes(d.category.split(". ")[1].split(" ")[0]),
    );
    if (qualified.length) ds = qualified;
  }
  if (ds.length !== 1) return null;
  const d = ds[0];
  if (state.combat?.status === "playing")
    throw Error("안전한 비전투 장소에서 수련해 주세요.");
  const existing = S.read(state.skillBook).skills.find(
    (s) => s.commonId === d.id && s.ownerId === "taei",
  );
  if (existing)
    throw Error("이미 습득한 기술입니다. 전투에서 사용해 숙련할 수 있습니다.");
  const proof = (state.skillTrainingSources || []).find(
    (s) => s.commonId === d.id && ["teacher", "manual"].includes(s.kind),
  );
  if (d.grade > 1 && !proof)
    throw Error(
      "이 등급의 기술은 실제 교사나 교본을 통해 배울 근거가 필요합니다.",
    );
  if (d.mechanic.weapon) {
    const type = state.player.weaponType || "unarmed",
      need = d.mechanic.weapon;
    if (
      !(need === "any"
        ? type !== "unarmed"
        : need === "blade"
          ? ["sword", "dagger", "axe"].includes(type)
          : need === "ranged"
            ? ["bow", "crossbow", "throwing"].includes(type)
            : type === need)
    )
      throw Error("해당 기술을 수련할 실제 무기가 필요합니다.");
  }
  const cost = Math.max(1, Math.ceil(d.mana * 0.25));
  if (state.player.mana < cost) throw Error("수련할 마나가 부족합니다.");
  const training = { ...(state.skillTraining || {}) },
    count = (training[d.id] || 0) + 1;
  training[d.id] = count;
  let book = S.read(state.skillBook);
  if (count >= 3)
    book = S.learnCommon(book, d.id, "taei", {
      kind: proof?.kind || "training",
      eventId: proof?.eventId || id,
    }).book;
  return { book, training, cost, skill: d, learned: count >= 3, count };
}
