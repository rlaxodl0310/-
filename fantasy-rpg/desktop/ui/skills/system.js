(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./common.js"));
  else root.SkillSystem = factory(root.CommonSkills);
})(globalThis, (Common) => {
  "use strict";
  const EFFECTS = ["strike", "bolt", "guard", "dash", "mend"],
    ELEMENTS = ["physical", "fire", "frost", "shadow", "light", "arcane"],
    CONDITIONS = ["none", "counter-window", "stored-impact"],
    MOTIFS = ["arc", "ring", "trail", "sparks"];
  const clone = (x) => JSON.parse(JSON.stringify(x)),
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const finite = (v, a, b) =>
    typeof v === "number" && Number.isFinite(v) && v >= a && v <= b;
  const ID = {
    test: (value) =>
      typeof value === "string" &&
      /^[-a-zA-Z0-9:_]{1,100}$/.test(value) &&
      value !== "prototype" &&
      !Object.hasOwn(Object.prototype, value),
  };
  function empty() {
    return {
      version: 1,
      revision: 0,
      clock: 0,
      capabilities: [],
      skills: [],
      practice: [],
      evidence: [],
      receipts: [],
      runtime: {},
      casts: [],
      progress: {},
    };
  }
  function read(book) {
    if (book === undefined || book === null) return empty();
    if (
      book.version !== 1 ||
      !Array.isArray(book.skills) ||
      !Array.isArray(book.capabilities) ||
      !Array.isArray(book.practice) ||
      !Array.isArray(book.receipts) ||
      !book.runtime ||
      !book.progress ||
      !finite(book.clock, 0, 1e12) ||
      !Number.isInteger(book.revision)
    )
      throw Error("스킬 기록 형식이 올바르지 않습니다.");
    const result = clone({
      ...book,
      evidence: book.evidence || [],
      casts: book.casts || [],
    });
    for (const s of result.skills)
      if (s.origin !== "common") {
        s.grade ??= s.power;
        s.fixedGrade = true;
        s.cost = {
          ...s.cost,
          mana: costs({
            power: s.grade,
            effect: s.effect,
            condition: s.condition,
          }).mana,
          cooldown: 0,
        };
      }
    for (const rt of Object.values(result.runtime)) rt.cooldowns = {};
    return result;
  }
  function hash(text) {
    let n = 2166136261;
    for (const c of text) {
      n ^= c.charCodeAt(0);
      n = Math.imul(n, 16777619);
    }
    return (n >>> 0).toString(36);
  }
  function capabilityCheck(cap) {
    if (
      !cap ||
      !ID.test(cap.id) ||
      !ID.test(cap.ownerId) ||
      !["practice", "trait", "essence", "ego"].includes(cap.origin) ||
      typeof cap.name !== "string" ||
      cap.name.length > 60 ||
      !Array.isArray(cap.effects) ||
      !cap.effects.length ||
      cap.effects.some((x) => !EFFECTS.includes(x)) ||
      !Array.isArray(cap.elements) ||
      !cap.elements.length ||
      cap.elements.some((x) => !ELEMENTS.includes(x)) ||
      !Array.isArray(cap.conditions) ||
      cap.conditions.some((x) => !CONDITIONS.includes(x)) ||
      !finite(cap.maxPower, 1, 10) ||
      !finite(cap.maxRange, 0.5, 8) ||
      typeof cap.active !== "boolean" ||
      typeof cap.equipmentId !== "string"
    )
      throw Error("능력 근거의 형식이 잘못되었습니다.");
  }
  function grant(book, cap) {
    capabilityCheck(cap);
    const next = read(book),
      old = next.capabilities.find((c) => c.id === cap.id);
    if (old) {
      if (JSON.stringify(old) !== JSON.stringify(cap))
        throw Error("같은 근거 ID를 다른 능력으로 덮어쓸 수 없습니다.");
      return next;
    }
    if (next.capabilities.length >= 128)
      throw Error("능력 근거 한도에 도달했습니다.");
    next.capabilities.push(clone(cap));
    next.revision++;
    return next;
  }
  function practice(book, event) {
    const next = read(book);
    if (
      !event ||
      !ID.test(event.id) ||
      !ID.test(event.ownerId) ||
      !ID.test(event.encounterId) ||
      typeof event.targetId !== "string" ||
      event.targetId.length > 100 ||
      !["unarmed", "damage", "heal", "guard", "dash"].includes(event.kind) ||
      !finite(event.amount, 0.001, 10000) ||
      event.meaningful !== true
    )
      throw Error("실제 판정에 근거한 사용 경험이 필요합니다.");
    if (
      next.practice.some((e) => e.id === event.id) ||
      next.evidence.some((e) => e.id === event.id)
    )
      return next;
    next.practice.push(clone(event));
    if (next.practice.length > 512) next.practice.shift();
    const physical = next.practice.filter(
      (e) => e.ownerId === event.ownerId && e.kind === "unarmed",
    );
    const capId = "practice:" + event.ownerId + ":unarmed";
    if (
      physical.length >= 3 &&
      !next.capabilities.some((c) => c.id === capId)
    ) {
      const proof = physical.slice(-3);
      next.capabilities.push({
        id: capId,
        ownerId: event.ownerId,
        origin: "practice",
        name: "실제로 쌓인 맨손 전투 경험",
        effects: ["strike", "guard", "dash"],
        elements: ["physical"],
        conditions: ["none", "counter-window"],
        maxPower: 2,
        maxRange: 2.2,
        active: true,
        equipmentId: "",
        evidenceIds: proof.map((e) => e.id),
      });
      next.evidence.push(
        ...proof.filter((e) => !next.evidence.some((old) => old.id === e.id)),
      );
    }
    next.revision++;
    return next;
  }
  const PROPOSAL_SCHEMA = {
    type: "array",
    maxItems: 2,
    items: {
      type: "object",
      additionalProperties: false,
      required: [
        "ownerId",
        "name",
        "basisIds",
        "evidenceIds",
        "effect",
        "element",
        "power",
        "range",
        "condition",
        "motif",
      ],
      properties: {
        ownerId: { type: "string" },
        name: { type: "string" },
        basisIds: {
          type: "array",
          minItems: 1,
          maxItems: 2,
          items: { type: "string" },
        },
        evidenceIds: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: { type: "string" },
        },
        effect: { type: "string", enum: EFFECTS },
        element: { type: "string", enum: ELEMENTS },
        power: { type: "integer", minimum: 1, maximum: 10 },
        range: { type: "number", minimum: 0.5, maximum: 8 },
        condition: { type: "string", enum: CONDITIONS },
        motif: { type: "string", enum: MOTIFS },
      },
    },
  };
  function checkProposal(book, p, { era = "fantasy" } = {}) {
    const b = read(book);
    if (era !== "fantasy")
      throw Error("전이 이전에는 판타지 스킬을 등록하지 않습니다.");
    if (
      !p ||
      Object.keys(p).some(
        (k) =>
          ![
            "ownerId",
            "name",
            "basisIds",
            "evidenceIds",
            "effect",
            "element",
            "power",
            "range",
            "condition",
            "motif",
          ].includes(k),
      ) ||
      !ID.test(p.ownerId) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 40 ||
      /[\u0000-\u001f\u007f]/.test(p.name) ||
      !Array.isArray(p.basisIds) ||
      p.basisIds.length < 1 ||
      p.basisIds.length > 2 ||
      new Set(p.basisIds).size !== p.basisIds.length ||
      !Array.isArray(p.evidenceIds) ||
      p.evidenceIds.length < 1 ||
      p.evidenceIds.length > 6 ||
      new Set(p.evidenceIds).size !== p.evidenceIds.length ||
      !EFFECTS.includes(p.effect) ||
      !ELEMENTS.includes(p.element) ||
      !Number.isInteger(p.power) ||
      !finite(p.power, 1, 10) ||
      !finite(p.range, 0.5, 8) ||
      !CONDITIONS.includes(p.condition) ||
      !MOTIFS.includes(p.motif)
    )
      throw Error("지원하는 스킬 정의 형식을 지켜 주세요.");
    const bases = p.basisIds.map((id) =>
      b.capabilities.find(
        (c) => c.id === id && c.ownerId === p.ownerId && c.active,
      ),
    );
    if (bases.some((c) => !c))
      throw Error("해당 인물이 실제 보유한 활성 능력 근거가 아닙니다.");
    if (
      !bases.some(
        (c) =>
          c.effects.includes(p.effect) &&
          c.elements.includes(p.element) &&
          c.conditions.includes(p.condition) &&
          p.power <= c.maxPower &&
          p.range <= c.maxRange,
      )
    )
      throw Error("기존 능력으로 실행할 수 없는 효과·범위·출력입니다.");
    const pool = [...b.practice, ...b.evidence];
    if (
      p.evidenceIds.some(
        (id) =>
          !pool.some(
            (e) => e.id === id && e.ownerId === p.ownerId && e.meaningful,
          ),
      )
    )
      throw Error("이 인물의 실제 사용 경험을 인용해야 합니다.");
    if (p.evidenceIds.length < 3)
      throw Error(
        "아직 안정적인 기술로 등록할 실제 경험이 부족합니다(서로 다른 경험3개 필요).",
      );
    return bases;
  }
  function costs(p) {
    return {
      mana: [8, 24, 45, 80, 120, 200, 325, 525, 825, 1500][p.power - 1],
      cooldown: 0,
      windup: p.effect === "bolt" ? 0.34 : p.effect === "mend" ? 0.4 : 0.2,
      impact: p.condition === "stored-impact" ? Math.max(2, p.power * 2) : 0,
    };
  }
  function fingerprint(p) {
    return JSON.stringify([
      p.ownerId,
      [...p.basisIds].sort(),
      p.effect,
      p.element,
      p.power,
      p.range,
      p.condition,
    ]);
  }
  function register(book, p, context = {}) {
    const bases = checkProposal(book, p, context),
      next = read(book),
      key = fingerprint(p),
      existing = next.skills.find((s) => s.fingerprint === key);
    if (existing) return { book: next, skill: existing, created: false };
    if (next.skills.filter((s) => s.ownerId === p.ownerId).length >= 32)
      throw Error("인물별 스킬 기록 한도에 도달했습니다.");
    let id = "skill-" + hash(key),
      suffix = 0;
    while (next.skills.some((s) => s.id === id))
      id = "skill-" + hash(key) + "-" + ++suffix;
    const skill = {
      id,
      ownerId: p.ownerId,
      name: p.name.trim(),
      basisIds: [...p.basisIds],
      evidenceIds: [...p.evidenceIds],
      effect: p.effect,
      element: p.element,
      power: p.power,
      grade: p.power,
      fixedGrade: true,
      range: p.range,
      condition: p.condition,
      visual: {
        motif: p.motif,
        element: p.element,
        duration: 0.55,
        scale: clamp(0.8 + p.power * 0.15, 0.8, 1.55),
      },
      cost: costs(p),
      fingerprint: key,
      createdAtRevision: next.revision + 1,
    };
    next.skills.push(skill);
    next.progress[id] = { xp: 0, uses: 0, encounters: {} };
    for (const id of p.evidenceIds) {
      const event = [...next.practice, ...next.evidence].find(
        (e) => e.id === id,
      );
      if (event && !next.evidence.some((e) => e.id === id))
        next.evidence.push(clone(event));
    }
    next.revision++;
    return { book: next, skill: clone(skill), created: true };
  }
  function tier(book, id) {
    const xp = book.progress[id]?.xp || 0;
    return [0, 20, 80, 200, 500].filter((n) => xp >= n).length - 1;
  }
  function learnCommon(book, id, ownerId, source) {
    if (
      !ID.test(ownerId) ||
      !source ||
      !["training", "teacher", "manual", "test"].includes(source.kind) ||
      !ID.test(source.eventId)
    )
      throw Error("실제 습득 근거가 필요합니다.");
    const b = read(book),
      skill = Common.definition(id, ownerId),
      old = b.skills.find((s) => s.id === skill.id);
    if (old) return { book: b, skill: old, created: false };
    if (b.skills.length >= 1024) throw Error("스킬 기록 한도입니다.");
    skill.acquisition = clone(source);
    b.skills.push(skill);
    b.progress[skill.id] = { xp: 0, uses: 0, encounters: {} };
    b.revision++;
    return { book: b, skill, created: true };
  }
  function describe(book, skillOrId) {
    const b = read(book),
      s =
        typeof skillOrId === "string"
          ? b.skills.find((s) => s.id === skillOrId)
          : skillOrId;
    if (!s) return null;
    if (s.origin === "common") return Common.describe(s, b.progress[s.id]);
    const rank = tier(b, s.id),
      progress = b.progress[s.id] || { xp: 0, uses: 0 };
    return {
      id: s.id,
      ownerId: s.ownerId,
      name: s.name,
      grade: s.grade,
      rank,
      masteryXP: progress.xp,
      uses: progress.uses,
      text:
        {
          strike: "범위 안의 적을 타격",
          bolt: "조준한 방향으로 투사체를 발사",
          guard: "짧게 다음 충격에 대비",
          dash: "지정 방향으로 짧게 이동",
          mend: "범위 안 아군의 실제 손상을 회복",
        }[s.effect] +
        " · " +
        s.grade +
        "등급 고정 · 숙련 " +
        rank +
        "단계 · 마나 " +
        Math.max(1, Math.ceil(s.cost.mana * (1 - rank * 0.025))) +
        " · 재사용 " +
        s.cost.cooldown.toFixed(1) +
        "초" +
        (s.condition === "none"
          ? ""
          : s.condition === "stored-impact"
            ? " · 저장 충격 " + s.cost.impact + " 필요"
            : " · 공격을 받은 직후에만 사용"),
      visual: clone(s.visual),
    };
  }
  function prepare(book, id, ctx) {
    const b = read(book),
      s = b.skills.find((s) => s.id === id);
    if (!s || s.ownerId !== ctx.actorId)
      throw Error("이 인물의 등록된 스킬이 아닙니다.");
    if (
      !finite(ctx.now, 0, 1e12) ||
      !finite(ctx.hp, 0.001, 1000000) ||
      !finite(ctx.mana, 0, 1000000)
    )
      throw Error("지금 행동할 수 있는 상태가 아닙니다.");
    if (s.origin === "common") {
      const p = Common.prepare(s, ctx);
      if (ctx.mana < p.mana) throw Error("마나가 부족합니다.");
      return { ...p, skill: clone(s) };
    }
    const rt = b.runtime[ctx.actorId] || {},
      bases = s.basisIds.map((id) =>
        b.capabilities.find(
          (c) => c.id === id && c.ownerId === ctx.actorId && c.active,
        ),
      );
    if (
      bases.some(
        (c) =>
          !c ||
          (c.equipmentId && !(ctx.equipmentIds || []).includes(c.equipmentId)),
      )
    )
      throw Error("스킬의 근거 능력/장비를 현재 사용할 수 없습니다.");
    const cooldown = rt.cooldowns?.[s.id] || 0;
    if (ctx.now < cooldown) throw Error("아직 재사용 대기 중입니다.");
    if (
      s.condition === "counter-window" &&
      !(
        finite(rt.lastDamageAt, 0, 1e12) &&
        ctx.now >= rt.lastDamageAt &&
        ctx.now - rt.lastDamageAt <= 1.2
      )
    )
      throw Error("반격할 순간이 아닙니다.");
    if (s.condition === "stored-impact" && (rt.impact || 0) < s.cost.impact)
      throw Error("실제 받아 저장한 충격이 부족합니다.");
    const rank = tier(b, s.id),
      mana = Math.max(1, Math.ceil(s.cost.mana * (1 - rank * 0.025)));
    if (ctx.mana < mana) throw Error("마나가 부족합니다.");
    if (
      ["strike", "mend"].includes(s.effect) &&
      (!finite(ctx.distance, 0, 100) || ctx.distance > s.range)
    )
      throw Error("스킬 사거리 밖입니다.");
    if (["strike", "bolt"].includes(s.effect) && ctx.targetAlive !== true)
      throw Error("살아 있는 공격 대상이 필요합니다.");
    if (s.effect === "mend" && ctx.targetTeam !== "ally")
      throw Error("회복할 아군 대상이 필요합니다.");
    return {
      skill: clone(s),
      mana,
      cooldown: s.cost.cooldown,
      windup: s.cost.windup,
      amount: Math.round(
        (s.effect === "mend" ? 7 + s.power * 4 : 4 + s.power * 5) *
          (1 + rank * 0.03),
      ),
      distance: s.range,
    };
  }
  function consume(book, prepared, ctx) {
    const next = read(book),
      p = prepare(next, prepared.skill.id, ctx);
    if (!ID.test(ctx.castId)) throw Error("잘못된 사용 번호입니다.");
    if (next.receipts.includes("cast:" + ctx.castId))
      throw Error("이미 처리한 스킬 사용입니다.");
    const rt = next.runtime[ctx.actorId] || {};
    rt.cooldowns ??= {};
    rt.cooldowns[p.skill.id] = ctx.now + p.cooldown;
    rt.impact = Math.max(0, (rt.impact || 0) - p.skill.cost.impact);
    next.runtime[ctx.actorId] = rt;
    next.casts.push({
      id: ctx.castId,
      skillId: p.skill.id,
      ownerId: ctx.actorId,
    });
    next.casts = next.casts.slice(-4096);
    next.receipts.push("cast:" + ctx.castId);
    next.receipts = next.receipts.slice(-4096);
    next.revision++;
    return { book: next, prepared: p };
  }
  function incoming(book, ownerId, amount, now) {
    const b = read(book);
    if (
      !ID.test(ownerId) ||
      !finite(amount, 0.001, 10000) ||
      !finite(now, 0, 1e12)
    )
      return b;
    const rt = b.runtime[ownerId] || {};
    rt.lastDamageAt = now;
    if (
      b.capabilities.some(
        (c) =>
          c.ownerId === ownerId &&
          c.active &&
          c.conditions.includes("stored-impact"),
      )
    )
      rt.impact = clamp((rt.impact || 0) + amount * 0.25, 0, 30);
    b.runtime[ownerId] = rt;
    return b;
  }
  function award(book, event) {
    const b = read(book),
      s = b.skills.find(
        (s) => s.id === event.skillId && s.ownerId === event.ownerId,
      );
    if (
      !s ||
      !b.casts.some(
        (c) =>
          c.id === event.castId &&
          c.skillId === s.id &&
          c.ownerId === event.ownerId,
      ) ||
      !ID.test(event.id) ||
      !ID.test(event.encounterId) ||
      typeof event.targetId !== "string" ||
      event.targetId.length > 100 ||
      !finite(event.amount, 0.001, 10000) ||
      event.meaningful !== true
    )
      return b;
    if (b.receipts.includes("xp:" + event.castId)) return b;
    const p = b.progress[s.id] || { xp: 0, uses: 0, encounters: {} },
      used = p.encounters[event.encounterId] || 0,
      gain = Math.min(4, Math.max(0, 20 - used));
    p.xp = Math.min(100000, (p.xp || 0) + gain);
    p.uses++;
    p.encounters[event.encounterId] = used + gain;
    const keys = Object.keys(p.encounters);
    if (keys.length > 64) delete p.encounters[keys[0]];
    b.progress[s.id] = p;
    b.receipts.push("xp:" + event.castId);
    b.receipts = b.receipts.slice(-4096);
    b.revision++;
    return b;
  }
  function context(book, owners) {
    const b = read(book);
    return {
      capabilities: b.capabilities.filter(
        (c) => owners.includes(c.ownerId) && c.active,
      ),
      skills: b.skills
        .filter((s) => owners.includes(s.ownerId))
        .map((s) => describe(b, s)),
      practice: b.practice.filter((e) => owners.includes(e.ownerId)).slice(-24),
      rule: "실제 활성 근거와 서로 다른 성공 경험3개가 있을 때만 skillProposals로 등록한다. 이름/설명만으로 새 힘을 만들지 않는다. 공용 스킬은 별도 도감이다. 도감에 있다는 이유로 습득 처리하지 않는다. 미확정 기술은 추가하지 않는다.",
    };
  }
  return {
    empty,
    read,
    learnCommon,
    grant,
    practice,
    PROPOSAL_SCHEMA,
    checkProposal,
    register,
    prepare,
    consume,
    incoming,
    award,
    describe,
    context,
  };
});
