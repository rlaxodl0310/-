"use strict";
RoleUI.configure("../roles/icons/");
let legacyRoleMap = {};
const legacyRoleRender = render,
  roleStrip = document.createElement("div");
roleStrip.className = "legacy-party-roles";
roleStrip.setAttribute("aria-label", "시험 파티 역할");
const launchRoles = document.createElement("button");
launchRoles.textContent = "시험 역할 배치";
document.querySelector("header").append(launchRoles);
document.querySelector("header").after(roleStrip);
render = function () {
  legacyRoleRender();
  RoleUI.strip(
    roleStrip,
    legacyRoleMap,
    battle.units
      .filter((u) => u.team === "ally")
      .map((u) => ({ id: u.kind, name: u.name })),
  );
  for (const [i, element] of [
    ...document.querySelectorAll(".ally-status-group .unit"),
  ].entries()) {
    const unit = battle.units.filter((u) => u.team === "ally")[i],
      roles = unit && PartyRoles.forActor(legacyRoleMap, unit.kind);
    if (roles?.length) {
      const badge = RoleUI.badges(roles, { size: 24 });
      badge.style.cssText = "grid-column:1 / -1;justify-content:center";
      element.prepend(badge);
    }
  }
};
launchRoles.onclick = () => {
  if (busy) return;
  const dialog = document.createElement("dialog"),
    close = document.createElement("button"),
    body = document.createElement("div");
  dialog.className = "legacy-role-dialog";
  close.textContent = "닫기";
  close.onclick = () => dialog.close();
  function show() {
    RoleUI.editor(
      body,
      legacyRoleMap,
      battle.units
        .filter((u) => u.team === "ally")
        .map((u) => ({ id: u.kind, name: u.name })),
      async (id, roles) => {
        legacyRoleMap = { ...legacyRoleMap, [id]: PartyRoles.normalize(roles) };
        show();
        render();
      },
    );
  }
  dialog.append(close, body);
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  show();
  dialog.showModal();
};
render();
