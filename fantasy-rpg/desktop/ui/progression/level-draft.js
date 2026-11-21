(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(require("./model.js"));
  else r.LevelDraft = f(r.Progression);
})(globalThis, (G) => {
  "use strict";
  // Proposed balance: imported only by the isolated test lab, never by the director.
  function required(level) {
    if (!Number.isSafeInteger(level) || level < 1)
      throw Error("레벨은 양의 정수여야 합니다.");
    const n = Math.ceil((100 * Math.pow(level, 1.6)) / 10) * 10;
    if (!Number.isSafeInteger(n))
      throw Error("경험치 계산 범위를 초과했습니다.");
    return n;
  }
  function award(actor, xp, eventId) {
    if (
      !Number.isSafeInteger(xp) ||
      xp <= 0 ||
      xp > 10000000 ||
      !/^[-a-zA-Z0-9]{1,60}$/.test(eventId || "")
    )
      throw Error("시험 경험치 입력이 잘못되었습니다.");
    let p = G.ensure(actor);
    const record = p.draftExperience || { xp: 0, receipts: [] },
      old = record.receipts.find((r) => r.id === eventId);
    if (old) {
      if (old.xp !== xp) throw Error("경험치 사건 내용이 다릅니다.");
      return G.recalculate(p);
    }
    if (
      !Number.isSafeInteger(record.xp) ||
      record.xp < 0 ||
      record.xp >= required(p.level ?? 1)
    )
      throw Error("시험 경험치 기록이 잘못되었습니다.");
    let level = p.level ?? 1,
      remaining = record.xp + xp;
    while (remaining >= required(level)) {
      remaining -= required(level);
      level++;
    }
    if (level > (p.level ?? 1))
      p = G.awardLevel(p, level, "draft-level:" + eventId);
    p.draftExperience = {
      xp: remaining,
      receipts: [...record.receipts, { id: eventId, xp }],
    };
    return G.recalculate(p);
  }
  return { status: "proposal-not-canon", required, award };
});
