(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(require("./common.js"));
  else r.InstallCommonBattle = f(r.CommonSkills);
})(globalThis, (C) => {
  "use strict";
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    clone = (v) => JSON.parse(JSON.stringify(v)),
    buffs = [
      "strength",
      "speed",
      "defense",
      "sense",
      "pain",
      "attack",
      "resistance",
      "mana_regen",
      "weapon_edge",
      "enchant",
      "resonance",
    ];
  return function install(B, S) {
    const old = {
      step: B.prototype.step,
      damage: B.prototype.damage,
      move: B.prototype.move,
      release: B.prototype.release,
      releaseSkill: B.prototype.releaseSkill,
      dodge: B.prototype.dodge,
      startAttack: B.prototype.startAttack,
      enemyAttack: B.prototype.enemyAttack,
    };
    B.prototype.dodge = function (u, dx, dy) {
      if ((u.stamina ?? 100) < 10) return false;
      const ok = old.dodge.call(this, u, dx, dy);
      if (ok) u.stamina = Math.max(0, (u.stamina ?? 100) - 10);
      return ok;
    };
    B.prototype.startAttack = function (u, skill = null) {
      if (
        (u.stamina ?? 100) < 2 ||
        u.weaponState?.durability === 0 ||
        (this.hasStatus(u, "weak-weapon") && u.equipmentType !== "unarmed") ||
        (this.hasStatus(u, "silence") && u.weapon === "magic")
      )
        return false;
      const ok = old.startAttack.call(this, u, skill);
      if (ok) u.stamina = Math.max(0, (u.stamina ?? 100) - 2);
      return ok;
    };
    B.prototype.enemyAttack = function (u, t) {
      if (
        this.hasStatus(u, "silence") &&
        ["draven", "noxvern"].includes(u.kind)
      ) {
        u.cooldown = 0.2;
        return;
      }
      return old.enemyAttack.call(this, u, t);
    };
    B.prototype.restoreCommon = function (state) {
      if (!state) return;
      const now =
          (Number(state.time) || 0) +
          (Number.isFinite(state.captureClock)
            ? Math.max(0, this.skillBook.clock - state.captureClock)
            : 0),
        convert = (s) => ({
          ...clone(s),
          until: this.time + Math.max(0, s.until - now),
        });
      for (const saved of state.units || []) {
        const u = this.units.find((u) => u.id === saved.id);
        if (u) {
          u.controlHistory = clone(saved.controlHistory || {});
          u.commonStatuses = (saved.statuses || [])
            .filter((s) => s.until > now)
            .map(convert);
          if (saved.weaponState) u.weaponState = clone(saved.weaponState);
          if (Number.isFinite(saved.stamina)) u.stamina = saved.stamina;
          if (u.team === "enemy" && Number.isFinite(saved.mana))
            u.mana = saved.mana;
        }
      }
      this.commonFields = (state.fields || [])
        .filter((f) => f.until > now)
        .map((f) => ({
          ...convert(f),
          nextTick: this.time + Math.max(0, f.nextTick - now),
        }));
      this.healingOverTime = (state.healingOverTime || []).map((e) => ({
        ...clone(e),
        nextTick: this.time + (e.nextTick - now),
      }));
      this.bloodTrails = clone(state.bloodTrails || []);
      this.props = clone(state.props || this.props || []);
      for (const ghost of state.illusions || [])
        if (ghost.until > now) this.units.push(convert(ghost));
    };
    B.prototype.statuses = function (u) {
      return (u.commonStatuses || []).filter((s) => s.until > this.time);
    };
    B.prototype.hasStatus = function (u, key) {
      return this.statuses(u).some((s) => s.key === key);
    };
    B.prototype.statusPower = function (u, key) {
      return this.statuses(u)
        .filter((s) => s.key === key)
        .reduce((n, s) => Math.max(n, s.potency || 0), 0);
    };
    B.prototype.addStatus = function (u, key, prepared, extra = {}) {
      const d = prepared.common,
        m = d.mechanic,
        until =
          this.time +
          m.duration *
            (1 - this.statusPower(u, "resistance")) *
            (u.team === "enemy" && ["root", "silence", "blind"].includes(key)
              ? Math.max(0.25, Math.min(1, 100 / u.max))
              : 1);
      u.commonStatuses = (u.commonStatuses || []).filter(
        (s) => s.key !== key || s.source !== prepared.skill.ownerId,
      );
      const status = {
        key,
        until,
        potency: m.potency,
        source: prepared.skill.ownerId,
        skillId: prepared.skill.id,
        castId: prepared.castId,
        commonId: d.id,
        ...extra,
      };
      u.commonStatuses.push(status);
      return status;
    };
    B.prototype.wearWeapon = function (u, amount) {
      if (!u.weaponState) return;
      for (const s of this.statuses(u).filter(
        (s) => s.key === "weapon_durable",
      )) {
        const n = Math.min(s.buffer, amount);
        s.buffer -= n;
        amount -= n;
      }
      u.weaponState.durability = Math.max(0, u.weaponState.durability - amount);
    };
    B.prototype.commonContext = function (u, s, t) {
      const target =
        s?.commonId &&
        ["heal", "transfer", "link"].includes(C.get(s.commonId)?.mechanic.kind)
          ? this.units.find(
              (v) => v.id === u.supportTarget && v.team === u.team && v.hp > 0,
            ) || u
          : t;
      const object = (this.props || []).find((o) => o.id === u.objectTarget);
      return {
        object: object ? { ...object, distance: dist(u, object) } : null,
        bloodTrails: (this.bloodTrails || []).filter(
          (trace) => trace.subject === target?.id,
        ).length,
        weaponState: u.weaponState,
        abilitySourceIds:u.abilitySourceIds||[],essenceSpecies:u.essenceSpecies||[],
        stamina: u.stamina,
        weapon: u.weapon,
        weaponType:
          u.equipmentType ||
          { gauntlet: "unarmed", bow: "bow", magic: "focus" }[u.weapon],
        sheathed: !!u.sheathed,
        silenced: this.hasStatus(u, "silence"),
        disarmed: this.hasStatus(u, "weak-weapon"),
        anchored: this.hasStatus(u, "anchor") || this.hasStatus(u, "root"),
        manaLeak: this.hasStatus(u, "mana_leak"),
        targetMana: target?.mana || 0,
        targetMass: target?.mass || 80,
        actorMass: u.mass || 80,
        targetHP: target?.hp || 0,
        targetMax: target?.max || 0,
        hasAlly: this.living(u.team).some(
          (v) => v.id !== u.id && v.kind !== "illusion",
        ),
        hasIllusion: this.living(u.team).some(
          (v) => v.owner === u.id && v.kind === "illusion",
        ),
      };
    };
    const previousContext = B.prototype.skillContext;
    B.prototype.skillContext = function (u, s, t) {
      return {
        ...previousContext.call(this, u, s, t),
        ...this.commonContext(u, s, t),
      };
    };
    B.prototype.move = function (u, dx, dy, dt, mult = 1) {
      if (this.hasStatus(u, "root") || this.hasStatus(u, "airborne")) return;
      const oldPos = { x: u.x, y: u.y },travel=u.commonTravel;
      if(travel?.configured){
        if(travel.remaining<=0){if(u.intentMove)u.intentMove.remaining=0;return;}
        dt=Math.min(dt,travel.remaining/travel.speed);
        mult=travel.speed/Math.max(.001,u.speed*(1+u.agility/100));
      }
      old.move.call(this, u, dx, dy, dt, mult);
      for (const field of this.commonFields || [])
        if (
          field.blocks &&
          field.until > this.time &&
          dist(u, field) < field.radius + u.radius &&
          dist(oldPos, field) >= dist(u, field)
        ) {
          u.x = oldPos.x;
          u.y = oldPos.y;
        }
      if(travel?.configured){travel.remaining=Math.max(0,travel.remaining-dist(oldPos,u));if(dist(oldPos,u)<.000001||travel.remaining<=.000001){if(u.intentMove)u.intentMove.remaining=0;travel.remaining=0;}}
    };
    B.prototype.releaseSkill = function (u, a) {
      if (!a.prepared.common) return old.releaseSkill.call(this, u, a);
      this.releaseCommon(u, a);
    };
    B.prototype.releaseCommon = function (u, a) {
      const p = a.prepared,
        d = p.common,
        m = d.mechanic,
        skill = p.skill;
      p.castId = a.castId;
      p.hitPart = a.hitPart || u.aimPart || "torso";
      const target =
        this.units.find((v) => v.id === a.targetId && v.hp > 0) ||
        this.target(u);
      if (this.hasStatus(u, "silence") && m.element !== "physical") return;
      u.animation = "attack";
      u.attackFlash = 0.3;
      if (m.requiresSheathed) u.sheathed = false;
      this.emit("skill_fx", {
        actor: u.id,
        x: u.x,
        y: u.y,
        face: a.face,
        visual: d.visual,
        targetX: target?.x,
        targetY: target?.y,
      });
      const enemies = this.living(u.team === "ally" ? "enemy" : "ally").filter(
          (e) => dist(u, e) <= m.range + 0.05,
        ),
        ally = m.teamArea
          ? this.living(u.team)
              .filter((v) => v.kind !== "illusion" && dist(u, v) < 7)
              .slice(0, m.maxTargets || 3)
          : [u];
      const mark = (t, key, extra = {}) => this.addStatus(t, key, p, extra),
        award = (t, n) => this.skillAward(u, skill, a.castId, t, n),
        hit = (t, n = m.amount) =>
          this.damage(
            u,
            t,
            n,
            m.element === "physical" ? "gauntlet" : "magic",
            { skill, castId: a.castId, common: d },
          ),
        schedule = (t, delay, n = m.amount) => {
          this.commonTasks ??= [];
          this.commonTasks.push({
            at: this.time + delay,
            source: u.id,
            target: t.id,
            prepared: clone(p),
            amount: n,
          });
        };
      if (m.kind === "weapon_durable") {
        mark(u, "weapon_durable", {
          buffer: (u.weaponState?.max || 100) * 0.3,
        });
        return;
      }
      if (m.kind === "stamina") {
        mark(u, "stamina");
        return;
      }
      if (["pull_object", "vibrate_object"].includes(m.kind)) {
        const o = (this.props || []).find((o) => o.id === u.objectTarget);
        if (!o) return;
        if (m.kind === "pull_object") {
          const before = dist(u, o);
          o.x += (u.x - o.x) * 0.6;
          o.y += (u.y - o.y) * 0.6;
          award(u, before - dist(u, o));
          o.moved = true;
        } else {
          o.vibratingUntil = this.time + m.duration;
          award(u, 1);
        }
        return;
      }
      if (m.kind === "track") {
        if (d.name === "혈흔 추적") {
          this.revealedTrail = clone(
            (this.bloodTrails || []).filter(
              (trace) => trace.subject === target?.id,
            ),
          );
          award(u, this.revealedTrail.length);
        } else if (target) {
          mark(target, "tracked");
          award(target, 1);
        }
        return;
      }
      if(m.selfStatuses){
        for(const spec of m.selfStatuses){
          u.commonStatuses??=[];
          u.commonStatuses=u.commonStatuses.filter(s=>!(s.commonId===d.id&&s.key===spec.key));
          u.commonStatuses.push({key:spec.key,effectKey:spec.key,source:u.id,skillId:skill.id,castId:a.castId,commonId:d.id,grade:d.grade,potency:spec.potency,until:this.time+spec.duration,linkedTo:m.kind});
        }
      }
      if (buffs.includes(m.kind)) {
        for (const v of ally) {
          mark(v, m.kind, { weapon: u.equipmentType });
          if (d.name === "과부하")
            mark(v, "speed", { potency: 0.25, fatigue: true });
          if (d.name === "전의 고양") mark(v, "attack");
          if (["순발 강화", "전의 고양"].includes(d.name))
            mark(v, "attackSpeed");
          if (d.name === "전투 격려") mark(v, "defense");
        }
        return;
      }
      if (
        [
          "root",
          "slow",
          "blind",
          "weak",
          "vulnerable",
          "silence",
          "mana_leak",
          "anchor",
        ].includes(m.kind)
      ) {
        for (const t of enemies.slice(0, d.name === "연쇄 구속" ? 3 : 1)) {
          const applied = mark(t, m.kind);
          if (applied) {
            if (d.name === "쇄암수" || d.name === "무장 약화")
              mark(t, "weak-weapon");
            if (["root", "silence"].includes(m.kind)) t.action = null;
            award(t, 1);
          }
        }
        return;
      }
      if (m.kind === "shield") {
        for (const v of ally) this.grantShield(u, v, p);
        return;
      }
      if (m.kind === "counter") {
        for (const v of ally) mark(v, "counter");
        return;
      }
      if (m.kind === "impact") {
        const old = this.statuses(u).find((s) => s.key === "impact");
        if (old?.stored > 0) {
          for (const t of enemies.filter((e) => dist(u, e) < 2.5))
            hit(t, Math.min(old.stored, m.amount * 2));
          u.commonStatuses = u.commonStatuses.filter((s) => s !== old);
        } else mark(u, "impact", { stored: 0 });
        return;
      }
      if (m.kind === "heal") {
        const t =
          this.units.find(
            (v) => v.id === u.supportTarget && v.team === u.team && v.hp > 0,
          ) || u;
        const n = this.heal(
          u,
          t,
          { mana: d.mana, grade: d.grade, coefficient: m.healCoefficient ?? 1 },
          { skill, castId: a.castId },
        );
        for (const linked of this.living(u.team).filter(
          (v) =>
            v.id !== t.id &&
            this.statuses(v).some((s) => s.key === "link" && s.link === t.id),
        ))
          this.heal(u, linked, { base: n * 0.5, bonus: 0 });
        return;
      }
      if (m.kind === "transfer") {
        const t = this.living(u.team).find(
          (v) => v.id !== u.id && v.kind !== "illusion" && v.hp < v.max,
        );
        if (!t) return;
        const n = Math.min(m.amount, u.hp - 1, t.max - t.hp);
        u.hp -= n;
        const received = this.heal(u, t, { base: n, bonus: 0 });
        award(t, received);
        return;
      }
      if (m.kind === "link") {
        const t = this.living(u.team).find(
          (v) => v.id !== u.id && v.kind !== "illusion",
        );
        if (t) {
          mark(u, "link", { link: t.id });
          mark(t, "link", { link: u.id });
        }
        return;
      }
      if (m.kind === "drain") {
        if (target && dist(u, target) <= m.range) {
          const n = Math.min(target.mana, m.amount, u.maxMana - u.mana);
          target.mana -= n;
          u.mana += n;
          award(target, n);
        }
        return;
      }
      if (["fog", "poison_field", "snare_field", "wall"].includes(m.kind)) {
        this.commonFields ??= [];
        this.commonFields.push({
          id: "field-" + ++this.serial,
          x: target?.x ?? u.x + 2,
          y: target?.y ?? u.y,
          radius: m.kind === "wall" ? 1.1 : 2.2,
          until: this.time + m.duration,
          nextTick: this.time + 1,
          blocks: m.kind === "wall",
          source: u.id,
          kind: m.kind,
          prepared: clone(p),
          visual: d.visual,
        });
        return;
      }
      if (d.name === "그림자 투영") {
        const shadow = this.living(u.team).find(
          (v) => v.owner === u.id && v.kind === "illusion",
        );
        if (shadow) {
          const old = { x: u.x, y: u.y };
          u.x = shadow.x;
          u.y = shadow.y;
          shadow.x = old.x;
          shadow.y = old.y;
          award(u, 1);
          return;
        }
      }
      if (["illusion", "clone"].includes(m.kind)) {
        const count = d.name === "허상 군집" ? 4 : 1;
        for (let i = 0; i < count; i++) {
          const x = Math.max(
              0.5,
              Math.min(this.width - 0.5, u.x + Math.cos(i * 1.57) * 1.3),
            ),
            y = Math.max(
              0.5,
              Math.min(this.height - 0.5, u.y + Math.sin(i * 1.57) * 1.3),
            );
          this.units.push({
            ...clone(u),
            id: "illusion-" + ++this.serial,
            kind: "illusion",
            name: "허상",
            owner: u.id,
            x,
            y,
            hp: 1,
            max: 1,
            commonStatuses: [],
            action: null,
            order: "hold",
            cooldown: 1e8,
            until: this.time + m.duration,
            copy: m.kind === "clone",
            prepared: clone(p),
          });
        }
        return;
      }
      if (m.kind === "swap") {
        const decoy = this.living(u.team).find(
          (v) => v.owner === u.id && v.kind === "illusion",
        );
        if (decoy) {
          const old = { x: u.x, y: u.y };
          u.x = decoy.x;
          u.y = decoy.y;
          decoy.x = old.x;
          decoy.y = old.y;
          award(u, 1);
        }
        return;
      }
      if (["dash", "leap", "teleport", "charge"].includes(m.kind)) {
        if (m.kind === "teleport") {
          const x = Math.max(
              0.5,
              Math.min(this.width - 0.5, u.x + a.face.x * 3),
            ),
            y = Math.max(0.5, Math.min(this.height - 0.5, u.y + a.face.y * 3));
          if (
            !this.units.some(
              (v) =>
                v !== u &&
                v.hp > 0 &&
                Math.hypot(v.x - x, v.y - y) < v.radius + u.radius,
            ) &&
            !(this.commonFields || []).some(
              (f) =>
                f.blocks &&
                f.until > this.time &&
                Math.hypot(f.x - x, f.y - y) < f.radius,
            )
          ) {
            u.x = x;
            u.y = y;
            award(u, 1);
          }
        } else {
          u.intentMove = { x: a.face.x, y: a.face.y, remaining: m.travelDuration||0.55 };
          mark(u, "speed", { potency: m.kind === "leap" ? 0.6 : 1 });
          if(m.travelDistance){u.commonTravel={configured:true,remaining:m.travelDistance,speed:m.travelDistance/m.travelDuration,origin:{x:u.x,y:u.y},until:this.time+m.travelDuration+.05,prepared:clone(p)};}
          if (m.kind === "charge" && target) schedule(target, m.travelDuration||0.5);
          if (!m.travelDistance && enemies.some((v) => dist(u, v) < 3))
            u.commonTravel = {
              origin: { x: u.x, y: u.y },
              until: this.time + 0.6,
              prepared: clone(p),
            };
        }
        return;
      }
      if (m.kind === "pull" && target) {
        for (const t of enemies.slice(0, 4)) {
          const v = { x: u.x - t.x, y: u.y - t.y };
          this.move(t, v.x, v.y, 0.25, 2);
          if (d.name === "중력 압축") schedule(t, 0.3);
          award(t, 1);
        }
        return;
      }
      if (m.kind === "mark_bomb" && target) {
        const markStatus = this.statuses(target).find(
          (s) => s.key === "mark_bomb" && s.source === u.id,
        );
        if (markStatus) {
          hit(target);
          target.commonStatuses = target.commonStatuses.filter(
            (s) => s !== markStatus,
          );
        } else mark(target, "mark_bomb");
        return;
      }
      if (m.kind === "throw" && target) {
        for (let i = 0; i < 2; i++) schedule(target, i * 0.15, m.amount / 2);
        return;
      }
      if (d.name === "충격 전이" && target) {
        const before = target.hp;
        hit(target);
        if (target.hp < before)
          for (const e of enemies.filter(
            (e) => e !== target && dist(e, target) < 2,
          ))
            hit(e, m.amount * 0.35);
        return;
      }
      if (m.kind === "damage") {
        if (m.delivery === "projectile") {
          for (let i = 0; i < m.hits; i++) {
            const angle =
              Math.atan2(a.face.y, a.face.x) +
              (d.name === "分열사" || d.name === "분열사"
                ? (i - (m.hits - 1) / 2) * 0.11
                : 0);
            this.projectiles.push({
              id: ++this.serial,
              source: u.id,
              team: u.team,
              x: u.x,
              y: u.y,
              vx: Math.cos(angle) * 9,
              vy: Math.sin(angle) * 9,
              radius: 0.2,
              damage: m.amount / m.hits,
              life: m.range / 9,
              weapon: m.element === "physical" ? "bow" : "magic",
              registered: {
                skill,
                castId: a.castId,
                common: d,
                hitPart: p.hitPart,
              },
              commonId: d.id,
              pierce: m.pierce || 1,
              hitIds: [],
              homing: ["추적사", "낙뢰 추적"].includes(d.name)
                ? target?.id
                : null,
              delay: i * 0.09,
            });
          }
        } else {
          const targets =
            m.delivery === "area"
              ? enemies.filter((e) => dist(u, e) < m.radius)
              : target && dist(u, target) <= m.range
                ? [target]
                : [];
          for (const t of targets.slice(0, m.maxTargets || 20))
            for (let i = 0; i < m.hits; i++)
              schedule(t, i * 0.075, m.amount / m.hits);
        }
        return;
      }
    };
    B.prototype.damage = function (
      source,
      t,
      amount,
      kind = source.weapon,
      registered = null,
    ) {
      if (!source || !t || t.hp <= 0) return;
      const def = registered?.common || C.get(registered?.skill?.commonId),
        m = def?.mechanic;
      if (
        this.hasStatus(source, "blind") &&
        this.serial % 3 === 0 &&
        !registered?.reaction
      ) {
        this.emit("evade", { target: t.id, x: t.x, y: t.y });
        return;
      }
      const before = t.hp;
      const verdict = this.resolveRuledHit(source, t, amount, kind, registered);
      if (!verdict) return;
      if (verdict.hpDamage > 0)
        old.damage.call(this, source, t, verdict.hpDamage, kind, {
          ...(registered || {}),
          resolved: true,
        });
      const actual = before - t.hp;
      if (!verdict.blockEffects)
        for (const status of this.statuses(t).filter((s) => s.consumeOnHit))
          status.until = this.time;
      if(actual>0&&!verdict.blockEffects&&m?.onHitStatuses){for(const spec of m.onHitStatuses){const p={...registered,skill:registered.skill,castId:registered.castId,common:{...def,mechanic:{...m,potency:spec.potency,duration:spec.duration}}};this.addStatus(t,spec.key,p);}}
      if (actual > 0) {
        if (t.kind === "illusion" && t.prepared) {
          const owner = this.units.find((u) => u.id === t.owner);
          if (owner)
            this.skillAward(
              owner,
              t.prepared.skill,
              t.prepared.castId,
              t,
              actual,
            );
        }
        if (m?.kind === "throw") {
          this.move(t, t.x - source.x, t.y - source.y, 0.25, 2);
        }
        if (def?.name === "폭발사")
          for (const other of this.living(t.team).filter(
            (o) => o !== t && dist(o, t) < 1.5,
          ))
            this.damage(
              source,
              other,
              Math.ceil(actual * 0.5),
              "magic",
              registered,
            );
        if (kind === "gauntlet" || kind === "bow") {
          this.bloodTrails ??= [];
          this.bloodTrails.push({
            subject: t.id,
            x: t.x,
            y: t.y,
            time: this.time,
          });
          this.bloodTrails = this.bloodTrails.slice(-64);
        }
        if (source.weaponState) this.wearWeapon(source, 1);
        for (const s of this.statuses(t).filter((s) => s.key === "impact"))
          s.stored = Math.min((s.stored || 0) + actual * 0.4, 200);
        if (
          m?.lifesteal ||
          this.statuses(source).some(
            (s) => s.key === "enchant" && C.get(s.commonId)?.mechanic.lifesteal,
          )
        ) {
          this.heal(source, source, { base: actual * (m?.lifesteal || 0.15) });
        }
        if (this.hasStatus(source, "resonance") && !registered?.reaction) {
          t.resonanceHits =
            typeof t.resonanceHits === "object" ? t.resonanceHits : {};
          const resonanceKey = m?.element || kind;
          t.resonanceHits[resonanceKey] =
            (t.resonanceHits[resonanceKey] || 0) + 1;
          if (t.resonanceHits[resonanceKey] % 3 === 0)
            this.damage(source, t, actual * 0.3, "magic", { reaction: true });
        }
      }
      if (verdict.preShieldDamage > 0 && t.hp > 0) {
        if (!verdict.blockEffects && m?.push)
          this.move(t, t.x - source.x, t.y - source.y, 0.2, m.push);
        if (!verdict.blockEffects && m?.launch && t.hp > 0)
          this.addStatus(t, "airborne", {
            common: {
              mechanic: { duration: m.launch, potency: 0 },
              id: def.id,
            },
            skill: registered.skill,
            castId: registered.castId,
          });
      }
      if (verdict.counterReaction && t.hp > 0 && source.hp > 0) {
        const r = verdict.counterReaction,
          skill = this.skillBook.skills.find((s) => s.id === r.skillId);
        if (skill)
          this.damage(t, source, r.amount, "magic", {
            skill,
            castId: r.castId,
            reaction: true,
          });
      }
      return { actual, verdict };
    };
    B.prototype.release = function (u, a) {
      old.release.call(this, u, a);
      for (const decoy of this.living(u.team).filter(
        (v) => v.owner === u.id && v.copy,
      )) {
        const t = this.target(u);
        if (t && dist(decoy, t) < (u.weapon === "gauntlet" ? 1.55 : 7)) {
          this.damage(u, t, 12, u.weapon, {
            skill: decoy.prepared.skill,
            castId: decoy.prepared.castId,
            common: decoy.prepared.common,
          });
          decoy.copy = false;
        }
      }
    };
    B.prototype.step = function (dt, input = {}) {
      if (this.paused || this.status !== "playing") return;
      dt = Math.max(0, Math.min(0.05, Number(dt) || 0));
      for (const u of this.units) {
        u.commonStatuses ??= [];
        u.stamina ??= 100;
        u.maxStamina ??= 100;
        u.stamina = Math.min(
          u.maxStamina,
          u.stamina + dt * 4 * (1 + this.statusPower(u, "stamina")),
        );
        u.commonStatuses = u.commonStatuses.filter((s) => s.until > this.time);
        u.commonStatuses=u.commonStatuses.filter(s=>!s.linkedTo||u.commonStatuses.some(v=>v.commonId===s.commonId&&v.skillId===s.skillId&&v.key===s.linkedTo&&!v.dispelled&&v.until>this.time));
        for(const active of [...u.commonStatuses]){const cfg=C.get(active.commonId)?.mechanic;if(active.key!==cfg?.kind||active.dispelled)continue;for(const spec of cfg.selfStatuses||[]){if(!u.commonStatuses.some(s=>s.commonId===active.commonId&&s.skillId===active.skillId&&s.key===spec.key))u.commonStatuses.push({...active,key:spec.key,effectKey:spec.key,potency:spec.potency,linkedTo:active.key});}}

        if (u.kind === "illusion" && u.until <= this.time) u.hp = 0;
        if (u.commonTravel && this.time >= u.commonTravel.until) {
          const p = u.commonTravel.prepared;
          if (dist(u, u.commonTravel.origin) > 0.5)
            this.skillAward(
              u,
              p.skill,
              p.castId,
              u,
              dist(u, u.commonTravel.origin),
            );
          u.commonTravel = null;
        }
        for (const s of this.statuses(u).filter((s) => s.key === "mana_regen"))
          u.mana = Math.min(u.maxMana, u.mana + dt * u.maxMana * 0.01);
        u._commonSpeed = u.speed;
        u.speed *= Math.max(
          0.1,
          1 + this.statusPower(u, "speed") - this.statusPower(u, "slow"),
        );
        if (this.hasStatus(u, "root") || this.hasStatus(u, "airborne"))
          u.speed = 0;
      }
      for (const f of this.commonFields || []) {
        if (f.until <= this.time) continue;
        const owner = this.units.find((u) => u.id === f.source);
        if (!owner) continue;
        for (const t of this.living(
          owner.team === "ally" ? "enemy" : "ally",
        ).filter((v) => dist(v, f) < f.radius)) {
          if (f.kind === "fog")
            this.addStatus(t, "blind", f.prepared, { until: this.time + 0.1 });
          if (f.kind === "snare_field")
            this.addStatus(t, "slow", f.prepared, {
              until: this.time + 0.1,
              potency: 0.45,
            });
          if (f.kind === "poison_field" && this.time >= f.nextTick)
            this.damage(
              owner,
              t,
              Math.ceil(f.prepared.common.mechanic.amount * 0.2),
              "magic",
              {
                skill: f.prepared.skill,
                castId: f.prepared.castId,
                common: f.prepared.common,
              },
            );
        }
        if (this.time >= f.nextTick) f.nextTick = this.time + 1;
      }
      this.commonFields = (this.commonFields || []).filter(
        (f) => f.until > this.time,
      );
      for (const task of [...(this.commonTasks || [])])
        if (task.at <= this.time) {
          this.commonTasks = this.commonTasks.filter((t) => t !== task);
          const u = this.units.find((v) => v.id === task.source && v.hp > 0),
            t = this.units.find((v) => v.id === task.target && v.hp > 0),
            m = task.prepared.common.mechanic;
          if (
            u &&
            t &&
            dist(u, t) <=
              (m.kind === "charge" ? 1.7 : Math.max(m.range, m.radius) + 0.2)
          )
            this.damage(
              u,
              t,
              task.amount,
              m.element === "physical" ? "gauntlet" : "magic",
              {
                skill: task.prepared.skill,
                castId: task.prepared.castId,
                hitPart: task.prepared.hitPart,
                common: task.prepared.common,
              },
            );
        }
      for (const shot of this.projectiles) {
        if (shot.life <= 0) continue;
        for (const f of this.commonFields || [])
          if (
            f.blocks &&
            f.until > this.time &&
            C.get(shot.commonId)?.name !== "곡사" &&
            B.segmentDistance(f, shot, {
              x: shot.x + shot.vx * dt,
              y: shot.y + shot.vy * dt,
            }) < f.radius
          ) {
            shot.life = 0;
            this.emit("clash", { x: shot.x, y: shot.y });
          }
        if (shot.life <= 0) continue;
        for (const u of this.living(shot.team === "ally" ? "enemy" : "ally")) {
          const shield = this.activeShields(u).find(
            (s) =>
              s.key === "shield" && s.reflect && (s.remaining ?? s.buffer) > 0,
          );
          if (
            shield &&
            dist(shot, u) < 0.9 &&
            (u.x - shot.x) * shot.vx + (u.y - shot.y) * shot.vy > 0
          ) {
            shot.vx = -shot.vx;
            shot.vy = -shot.vy;
            shot.team = u.team;
            shot.source = u.id;
            const sk = this.skillBook.skills.find(
              (s) => s.id === shield.skillId,
            );
            shot.registered = sk
              ? { skill: sk, castId: shield.castId, projectile: true }
              : null;
            shield.remaining = Math.max(
              0,
              (shield.remaining ?? shield.buffer) - shot.damage,
            );
            shield.buffer = shield.remaining;
            if (shield.buffer <= 0) shield.until = this.time;
            this.emit("skill_fx", {
              actor: u.id,
              x: u.x,
              y: u.y,
              face: u.face,
              visual: C.get(shield.commonId).visual,
            });
            break;
          }
        }
        if (shot.delay > 0) {
          shot.delay -= dt;
          shot.x -= shot.vx * dt;
          shot.y -= shot.vy * dt;
          shot.life += dt;
        }
        if (shot.homing) {
          const t = this.units.find((u) => u.id === shot.homing && u.hp > 0);
          if (t) {
            const a = Math.atan2(shot.vy, shot.vx),
              b = Math.atan2(t.y - shot.y, t.x - shot.x),
              diff = Math.atan2(Math.sin(b - a), Math.cos(b - a)),
              angle = a + Math.max(-dt * 2, Math.min(dt * 2, diff));
            shot.vx = Math.cos(angle) * 9;
            shot.vy = Math.sin(angle) * 9;
          }
        }
      }
      old.step.call(this, dt, input);
      for (const u of this.units)
        if (u._commonSpeed !== undefined) {
          u.speed = u._commonSpeed;
          delete u._commonSpeed;
        }
    };
  };
});
