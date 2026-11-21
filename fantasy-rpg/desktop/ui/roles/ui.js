(function (r) {
  "use strict";
  let base = "roles/icons/";
  const images = new Map();
  function configure(value) {
    base = value;
    images.clear();
  }
  function icon(id, size = 28) {
    const role = PartyRoles.get(id);
    if (!role) throw Error("존재하지 않는 역할입니다.");
    const img = document.createElement("img");
    img.className = "role-icon";
    img.src = base + role.icon;
    img.alt = role.name;
    img.title = role.name + " · " + role.description;
    img.width = img.height = size;
    return img;
  }
  function badges(roles, { size = 28 } = {}) {
    const box = document.createElement("span");
    box.className = "role-badges";
    for (const id of PartyRoles.normalize(roles)) box.append(icon(id, size));
    return box;
  }
  function strip(parent, map, actors, { nameAbove = false } = {}) {
    parent.replaceChildren();
    for (const actor of actors) {
      const roles = PartyRoles.forActor(map, actor.id);
      if (!roles.length) continue;
      const entry = document.createElement("span"),
        name = document.createElement("span");
      entry.className = "role-party-entry";
      name.textContent = actor.name;
      if (nameAbove) {
        entry.classList.add("role-dialogue-entry");
        entry.append(name, badges(roles));
      } else entry.append(badges(roles), name);
      parent.append(entry);
    }
    parent.hidden = !parent.children.length;
  }
  function draw(ctx, roles, x, y, size = 28) {
    const ids = PartyRoles.normalize(roles);
    for (const [i, id] of ids.entries()) {
      const src = base + PartyRoles.get(id).icon;
      let img = images.get(src);
      if (!img) {
        img = new Image();
        img.src = src;
        images.set(src, img);
      }
      if (img.complete && img.naturalWidth)
        ctx.drawImage(
          img,
          x - (ids.length * size) / 2 + i * size,
          y,
          size,
          size,
        );
    }
  }
  function editor(parent, map, actors, onAssign, { disabled = false } = {}) {
    parent.replaceChildren();
    const info = document.createElement("p");
    info.textContent =
      "역할은 현재 맡은 포지션을 표시합니다. 겸임할 수 있으며 능력·무기를 자동으로 지급하지 않습니다.";
    parent.append(info);
    for (const actor of actors) {
      const section = document.createElement("section"),
        heading = document.createElement("h3"),
        current = document.createElement("div"),
        select = document.createElement("select"),
        add = document.createElement("button"),
        status = document.createElement("p");
      section.className = "role-editor-row";
      heading.textContent = actor.name;
      current.className = "role-current";
      select.setAttribute("aria-label", actor.name + " 배치할 역할");
      status.setAttribute("role", "status");
      const roles = PartyRoles.forActor(map, actor.id);
      async function change(values) {
        if (disabled) return;
        for (const control of parent.querySelectorAll("button,select"))
          control.disabled = true;
        try {
          await onAssign(actor.id, values);
        } catch (e) {
          status.textContent = e.message;
          editor(parent, map, actors, onAssign, { disabled });
          const message = document.createElement("p");
          message.setAttribute("role", "alert");
          message.textContent = e.message;
          parent.append(message);
        }
      }
      for (const roleId of roles) {
        const remove = document.createElement("button");
        remove.className = "role-remove";
        remove.append(
          icon(roleId, 26),
          document.createTextNode(PartyRoles.get(roleId).name + " 해제"),
        );
        remove.setAttribute(
          "aria-label",
          actor.name + " " + PartyRoles.get(roleId).name + " 역할 해제",
        );
        remove.disabled = disabled;
        remove.onclick = () => change(roles.filter((id) => id !== roleId));
        current.append(remove);
      }
      if (!roles.length) current.textContent = "역할 미배치";
      for (const role of PartyRoles.records) {
        const option = document.createElement("option");
        option.value = role.id;
        option.textContent = role.name;
        option.disabled = roles.includes(role.id);
        select.append(option);
      }
      const available = PartyRoles.records.find(
        (role) => !roles.includes(role.id),
      );
      if (available) select.value = available.id;
      add.textContent = "역할 배치";
      add.disabled = select.disabled = disabled || !available;
      add.onclick = () => change([...roles, select.value]);
      section.append(heading, current, select, add, status);
      parent.append(section);
    }
  }
  r.RoleUI = { configure, icon, badges, strip, draw, editor };
})(globalThis);
