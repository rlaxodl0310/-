(function (r, f) {
  if (typeof module === "object" && module.exports) module.exports = f();
  else r.PartyRoles = f();
})(globalThis, () => {
  "use strict";
  const entries = [
    ["tank", "탱커", "방패로 적의 공격을 받아내고 진형을 보호"],
    ["bruiser", "브루저", "근접 공방을 이어가는 전투 역할"],
    ["slayer", "슬레이어", "강한 공격으로 적의 처치에 집중"],
    ["ranged", "원딜", "원거리 공격으로 적을 타격하고 견제"],
    ["mage", "메이지", "마법을 중심으로 전투"],
    ["thief", "시프", "기점을 만들고 전투의 빈 공간을 메우는 유틸리티"],
    ["supporter", "서포터", "동료 보조 분야의 통칭"],
    ["healer", "힐러", "회복과 동료의 부정적 효과 해제"],
    ["buffer", "버퍼", "강화·방호·마나 운용 보조"],
    ["debuffer", "디버퍼", "적 약화·제어·적의 강화 효과 해제"],
    ["scouter", "스카우터", "정찰·추적·길 안내·함정 대응"],
    ["carrier", "캐리어", "운반·보급·야영·회수·현장 정비"],
  ];
  const records = Object.freeze(
      entries.map(([id, name, description]) =>
        Object.freeze({ id, name, description, icon: id + ".svg" }),
      ),
    ),
    get = (id) => records.find((r) => r.id === id) || null;
  function normalize(values) {
    if (
      !Array.isArray(values) ||
      values.length > records.length ||
      values.some((id) => !get(id))
    )
      throw Error("역할 배치가 올바르지 않습니다.");
    const result = [...new Set(values)];
    return result.some((id) => ["healer", "buffer", "debuffer"].includes(id))
      ? result.filter((id) => id !== "supporter")
      : result;
  }
  function validate(map = {}) {
    if (!map || typeof map !== "object" || Array.isArray(map))
      throw Error("역할 기록 형식이 잘못되었습니다.");
    for (const [id, list] of Object.entries(map)) {
      if (!/^[-a-zA-Z0-9]{1,80}$/.test(id))
        throw Error("인물ID가 잘못되었습니다.");
      normalize(list);
    }
    return map;
  }
  function assign(state, actorId, roles) {
    if (!["taei", ...(state.party || [])].includes(actorId))
      throw Error("현재 파티에 속한 인물만 배치할 수 있습니다.");
    const next = JSON.parse(JSON.stringify(state)),
      map = next.roleAssignments || {};
    validate(map);
    const values = normalize(roles);
    if (values.length) map[actorId] = values;
    else delete map[actorId];
    next.roleAssignments = map;
    return next;
  }
  function forActor(map, id) {
    return normalize(map?.[id] || []);
  }
  function visible(state) {
    return Object.fromEntries(
      ["taei", ...(state.party || [])]
        .filter((id) => state.roleAssignments?.[id]?.length)
        .map((id) => [id, forActor(state.roleAssignments, id)]),
    );
  }
  return { records, get, normalize, validate, assign, forActor, visible };
});
