"use strict";
RoleUI.configure("icons/");
let state = { party: ["yeogyeong", "dogyeom"], roleAssignments: {} },
  actors = [
    { id: "taei", name: "김태이" },
    { id: "yeogyeong", name: "차여경" },
    { id: "dogyeom", name: "백도겸" },
  ];
const $ = (id) => document.getElementById(id);
for (const role of PartyRoles.records) {
  const button = document.createElement("button"),
    label = document.createElement("span");
  label.textContent = role.name;
  button.append(RoleUI.icon(role.id, 64), label);
  button.title = role.description;
  button.dataset.role = role.id;
  button.onclick = () => {
    state = PartyRoles.assign(state, $("role-actor").value, [role.id]);
    draw();
  };
  $("role-gallery").append(button);
}
function draw() {
  RoleUI.strip($("role-preview"), state.roleAssignments, actors, {
    nameAbove: true,
  });
  RoleUI.editor(
    $("role-editor"),
    state.roleAssignments,
    actors,
    async (id, roles) => {
      state = PartyRoles.assign(state, id, roles);
      draw();
    },
  );
  $("role-status").textContent = actors
    .map(
      (a) =>
        a.name +
        " · " +
        (PartyRoles.forActor(state.roleAssignments, a.id)
          .map((id) => PartyRoles.get(id).name)
          .join(" / ") || "미배치"),
    )
    .join(" · ");
}
$("role-save").onclick = () => {
  state = JSON.parse(JSON.stringify(state));
  PartyRoles.validate(state.roleAssignments);
  draw();
  $("role-status").textContent += " · 저장 복구 완료";
};
draw();
