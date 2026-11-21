(function (r) {
  "use strict";
  function render(
    body,
    player,
    now,
    onAction,
    { disabled = false, combatClock = now } = {},
  ) {
    const summary = Progression.breakdown(player, combatClock),
      n = (tag, text, parent = body) => {
        const e = document.createElement(tag);
        e.textContent = text;
        parent.append(e);
        return e;
      };
    n("h3", "능력치와 성장");
    const table = n("table", "");
    table.className = "progression-table";
    const header = n("tr", "", n("thead", "", table));
    for (const h of ["능력치", "최종", "출처"]) n("th", h, header);
    const tbody = n("tbody", "", table);
    for (const field of summary.fields) {
      const tr = n("tr", "", tbody);
      n("td", field.name, tr);
      n(
        "td",
        field.known
          ? String(Math.round(field.effective * 1000) / 1000)
          : "미확인",
        tr,
      );
      n(
        "td",
        field.sources
          .map((s) => s.name + " " + s.value)
          .concat(
            field.temporary
              ? [
                  "일시 효과 " +
                    (field.temporary > 0 ? "+" : "") +
                    field.temporary.toFixed(2),
                ]
              : [],
          )
          .join(" / ") || "아직 확인하지 못함",
        tr,
      );
    }
    n(
      "p",
      "HP " +
        player.hp +
        "/" +
        player.max +
        " · MP " +
        player.mana +
        "/" +
        player.maxMana,
    );
    for (const effect of summary.temporaryEffects)
      n(
        "p",
        "일시 효과 · " +
          effect.key +
          " " +
          Math.round(effect.potency * 100) +
          "%",
      );
    const message = n("p", "");
    message.setAttribute("role", "status");
    async function run(action) {
      if (disabled) return;
      const controls = [...body.querySelectorAll("button,input,select")].map(
        (b) => [b, b.disabled],
      );
      for (const [b] of controls) b.disabled = true;
      try {
        await onAction(action);
      } catch (e) {
        message.textContent = e.message;
        for (const [b, wasDisabled] of controls) b.disabled = wasDisabled;
      }
    }
    if (summary.points > 0) {
      const label = n("label", "배분할 능력치 · 잔여 " + summary.points + "점"),
        select = n("select", "", label);
      for (const f of StatRules.fields) {
        const option = n("option", f.name, select);
        option.value = f.key;
      }
      const amount = n("input", "", label);
      amount.type = "number";
      amount.min = 1;
      amount.max = summary.points;
      amount.value = 1;
      amount.setAttribute("aria-label", "배분 포인트");
      const b = n("button", "포인트 배분");
      b.disabled = disabled;
      b.onclick = () =>
        run({
          type: "allocate",
          values: { [select.value]: Number(amount.value) },
        });
    }
    n("h3", "장비");
    const g = player.progression;
    for (const [slot, itemId] of Object.entries(g?.equipped || {})) {
      const item = g.inventory.find((i) => i.id === itemId);
      n(
        "p",
        item.name + " · 내구도 " + item.durability + "/" + item.maxDurability,
      );
      const b = n("button", item.name + " 해제");
      b.disabled = disabled;
      b.onclick = () => run({ type: "unequip", slot });
    }
    const gear = (g?.inventory || []).filter(
      (i) =>
        i.kind === "equipment" && !Object.values(g.equipped).includes(i.id),
    );
    if (!gear.length && !Object.keys(g?.equipped || {}).length)
      n("p", "소지한 장비가 없습니다.");
    for (const item of gear) {
      n(
        "p",
        Object.entries(item.stats || {})
          .map(
            ([key, value]) =>
              (StatRules.fields.find((f) => f.key === key)?.name || key) +
              " +" +
              value,
          )
          .concat(
            (item.commonSkills || []).map(
              (id) => "스킬 " + (globalThis.CommonSkills?.get(id)?.name || id),
            ),
          )
          .join(" · "),
      );
      const b = n(
        "button",
        item.name + " 장착 · " + item.durability + "/" + item.maxDurability,
      );
      b.disabled = disabled || item.durability <= 0;
      b.onclick = () => run({ type: "equip", itemId: item.id });
    }
    n("h3", "정수 · " + summary.absorbed + "/" + summary.slots + " 슬롯");
    for (const x of g?.absorbed || []) {
      const e = EssenceRules.records.find((e) => e.id === x.species);
      n("p", e.name + " 정수 · 흡수됨");
    }
    const essences = (g?.inventory || []).filter((i) => i.kind === "essence");
    if (!essences.length) n("p", "소지한 정수가 없습니다.");
    for (const item of essences) {
      const e = EssenceRules.records.find((e) => e.id === item.species);
      n("p", e.name + " · " + e.effect.name + " · " + e.effect.effect);
      const b = n(
        "button",
        e.name +
          " 정수 흡수 · " +
          Math.max(0, item.expiresAt - now) +
          "분 남음",
      );
      b.disabled =
        disabled || now >= item.expiresAt || summary.absorbed >= summary.slots;
      b.onclick = () => run({ type: "absorb", itemId: item.id });
    }
    for (const ability of summary.abilities) {
      if (ability.commonId) continue;
      n(
        "p",
        ability.name +
          " · " +
          ability.description +
          (ability.execution ? " · 상세 시전 수치 미정" : ""),
      );
    }
    if (disabled)
      n("p", "전이 이후, 전투와 장면 생성이 끝난 상태에서 변경할 수 있습니다.");
  }
  r.ProgressionUI = { render };
})(globalThis);
