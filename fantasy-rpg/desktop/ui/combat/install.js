(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(require("./rules.js"));
  else r.InstallCombatRules = f(r.CombatRules);
})(globalThis, (R) => {
  "use strict";
  return function install(B, S) {
    const oldAdd = B.prototype.addStatus,
      oldCast = B.prototype.castSkill,
      oldStart = B.prototype.startAttack,
      oldStep = B.prototype.step,
      oldRelease = B.prototype.releaseSkill;
    B.prototype.formulaRandom = function () {
      this.formulaRng ??= R.rng(R.hash(this.encounterId));
      return this.formulaRng.next();
    };
    B.prototype.activeShields = function (u) {
      return R.activeShields(
        this.statuses(u).filter((s) => s.key === "shield"),
        this.time,
      );
    };
    B.prototype.resolveRuledHit = function (
      source,
      target,
      amount,
      kind,
      registered,
    ) {
      if (target.invulnerable > 0) {
        this.emit("evade", { target: target.id, x: target.x, y: target.y });
        return null;
      }
      const def = registered?.common || null,
        m = def?.mechanic || {},
        now = this.time,
        counter = this.statuses(target).find((s) => s.key === "counter"),
        result = R.resolveHit(
          {
            source,
            target,
            basePower: amount,
            coefficient:
              (registered?.reaction ? 0 : (m.attackCoefficient ?? 1)) *
              (registered?.hitCoefficient ?? 1 / (m.hits || 1)),
            part:
              registered?.hitPart ||
              source.activeHitPart ||
              source.aimPart ||
              "torso",
            penetrationPercent: m.penetrationPercent ?? m.penetration ?? 0,
            penetrationFlat: m.penetrationFlat ?? 0,
            criticalChance: m.criticalChance ?? registered?.skill?.options?.criticalChance ?? R.stat(source,"criticalChance"),
            vitalAccuracy:m.vitalAccuracy??registered?.skill?.options?.vitalAccuracy??0,
            vitalCoefficient: m.vitalCoefficient ?? registered?.skill?.options?.vitalCoefficient ?? 1,
            damageType: kind === "magic" ? "magic" : "physical",
            projectile: !!registered?.projectile,
            shields: this.statuses(target)
              .filter((s) => s.key === "shield")
              .map((s) => ({
                ...s,
                mode: s.mode || "absorb",
                capacity: s.capacity ?? s.buffer,
                remaining: s.remaining ?? s.buffer,
              })),
            extraReduction:
              ((target.braceUntil || 0) > now && kind !== "magic" ? 0.4 : 0) +
              (counter && !registered?.reaction ? 0.5 : 0),
            now,
          },
          () => this.formulaRandom(),
        );
      target.commonStatuses = (target.commonStatuses || [])
        .filter((s) => s.key !== "shield")
        .concat(
          result.shields.map((s) => ({
            ...s,
            key: "shield",
            buffer: s.remaining,
          })),
        );
      for (const use of result.used) {
        const owner = this.units.find((u) => u.id === use.source),
          skill = this.skillBook.skills.find((s) => s.id === use.skillId);
        if (owner && skill)
          this.skillAward(owner, skill, use.castId, source, use.amount);
      }
      this.emit("combat_formula", {
        actor: source.id,
        target: target.id,
        x: target.x,
        y: target.y,
        hpBefore: target.hp,
        verdict: result,
      });
      this.formulaLog ??= [];
      const { shields: _, ...math } = result;
      this.formulaLog.push({
        id: "formula-" + this.encounterId + "-" + this.serial,
        actor: source.id,
        target: target.id,
        damage: Math.min(target.hp, result.hpDamage),
        verdict: math,
      });
      this.formulaLog = this.formulaLog.slice(-4096);
      const assisted=[...this.statuses(source).filter(s=>['attack','strength','weapon_edge','enchant','attackSpeed','castSpeed'].includes(s.key)).map(s=>({s,target:source.id})),...this.statuses(target).filter(s=>['defense','damageReduction'].includes(s.key)).map(s=>({s,target:target.id}))];
      for(const {s,target:actorId} of assisted)if(s.source&&s.source!==actorId&&this.units.find(u=>u.id===s.source)?.team==='ally'&&result.afterDefense>=0){this.partyUtilityLog??=[];this.partyUtilityLog.push({id:'buff-assist-'+this.encounterId+'-'+(++this.serial),kind:'buff-assist',actor:s.source,target:actorId,amount:1});this.partyUtilityLog=this.partyUtilityLog.slice(-4096);}
      if (result.absorbed > 0)
        this.emit("blocked", {
          actor: source.id,
          target: target.id,
          x: target.x,
          y: target.y,
          absorbed: result.absorbed,
          full: result.blockEffects,
        });
      if (counter && !registered?.reaction) {
        counter.until = now;
        const skill = this.skillBook.skills.find(
          (s) => s.id === counter.skillId,
        );
        if (skill && source.hp > 0)
          result.counterReaction = {
            skillId: skill.id,
            castId: counter.castId,
            amount: Math.min(result.preShieldDamage * 0.5, amount),
          };
      }
      const guard = target.registeredGuard;
      if (
        guard &&
        guard.until >= now &&
        kind !== "magic" &&
        result.generalReduction > 0
      ) {
        const sk = this.skillBook.skills.find((s) => s.id === guard.skill.id);
        if (sk)
          this.skillAward(
            target,
            sk,
            guard.castId,
            source,
            (result.preShieldDamage / (1 - result.generalReduction)) *
              Math.min(0.4, result.generalReduction),
          );
      }
      return result;
    };
    B.prototype.heal = function (source, target, spec, receipt = {}) {
      if (!target || target.hp <= 0) return 0;
      const r = R.healAmount({
        ...spec,
        healingPower: spec.healingPower ?? R.stat(source, "healingPower"),
        bonus: spec.bonus ?? R.modifier(source, ["healingBonus"], 1, this.time),
        reduction: R.modifier(target, ["healingReduction"], 0.75, this.time),
        maxHP: target.max,
        hp: target.hp,
      });
      target.hp += r.amount;
      if (r.amount > 0) {
        this.emit("heal", {
          actor: source.id,
          target: target.id,
          amount: r.amount,
          overheal: r.overheal,
          x: target.x,
          y: target.y,
        });
        this.healingLog ??= [];
        this.healingLog.push({
          id: "heal-" + this.encounterId + "-" + this.serial,
          kind: "healing",
          actor: source.id,
          target: target.id,
          amount: r.amount,
        });
        this.healingLog = this.healingLog.slice(-4096);
        if (receipt.skill)
          this.skillAward(
            source,
            receipt.skill,
            receipt.castId,
            target,
            r.amount,
          );
      }
      return r.amount;
    };
    B.prototype.grantShield = function (
      source,
      target,
      prepared,
      options = {},
    ) {
      const d = prepared.common,
        m = d.mechanic,
        mode = options.mode || m.shieldMode || "absorb",
        capacity = R.shieldCapacity({
          mana: d.mana,
          grade: d.grade,
          shieldPower: R.stat(source, "shieldPower"),
          coefficient: m.shieldCoefficient ?? 1,
          bonus: R.modifier(source, ["shieldBonus"], Infinity, this.time),
          mode,
        }),
        incoming = {
          key: "shield",
          id: "shield-" + ++this.serial,
          effectKey:
            m.shieldEffectKey || (mode === "one-hit" ? "one-hit" : d.id),
          commonId: d.id,
          source: source.id,
          skillId: prepared.skill.id,
          castId: prepared.castId,
          grade: d.grade,
          category: "magic",
          potency: capacity,
          capacity,
          mode,
          until: this.time + (mode === "one-hit" ? 5 : 8),
          projectileOnly: !!m.projectileOnly,
          reflect: !!m.reflect,
          capExempt: !!m.shieldCapExempt,
        };
      const shields = R.grantShield(
        this.statuses(target).filter((s) => s.key === "shield"),
        incoming,
        { now: this.time, maxHP: target.max },
      );
      target.commonStatuses = (target.commonStatuses || [])
        .filter((s) => s.key !== "shield")
        .concat(shields.map((s) => ({ ...s, buffer: s.remaining })));
      this.emit("shield_granted", {
        actor: source.id,
        target: target.id,
        capacity,
        mode,
        x: target.x,
        y: target.y,
      });
      return incoming;
    };
    B.prototype.addStatus = function (u, key, p, extra = {}) {
      const isDebuff = [
        "root",
        "freeze",
        "stun",
        "airborne",
        "slow",
        "weak",
        "weak-weapon",
        "vulnerable",
        "defenseWeak",
        "silence",
        "mana_leak",
        "anchor",
        "blind",
        "healingReduction",
      ].includes(key);
      let duration = p.common.mechanic.duration,
        extraFields = {
          grade: p.common.grade || 1,
          category: p.common.mechanic.debuffCategory || "magic",
        };
      const name = p.common.name;
      if (name === "마력 침식" || name === "방어 붕괴") {
        key = "defenseWeak";
        if (name === "마력 침식") extraFields.damageType = "magic";
      }
      if (name === "호신강기" || name === "경화") {
        key = "damageReduction";
        extraFields.damageType = "physical";
      }
      if (name === "균형 붕괴") extraFields.consumeOnHit = true;
      if (isDebuff) {
        const source = this.units.find((v) => v.id === p.skill.ownerId),
          report = R.debuff(
            {
              key,
              grade: p.common.grade || 1,
              duration,
              sourcePower: R.stat(source, "controlPower", 100),
              resistance:
                R.stat(u, "controlResistance") +
                R.modifier(u, ["resistance"], 1, this.time) * 100,
              history: u.controlHistory,
              now: this.time,
            },
            () => this.formulaRandom(),
          );
        u.controlHistory = report.history;
        if (!report.applied) {
          this.emit("resisted", {
            target: u.id,
            reason: report.reason,
            x: u.x,
            y: u.y,
          });
          return null;
        }
        duration = report.duration;
        extraFields = {
          ...extraFields,
          grade: p.common.grade || 1,
          category: p.common.mechanic.debuffCategory || "magic",
        };
      }
      const potency = extra.potency ?? p.common.mechanic.potency,
        existing = (u.commonStatuses || []).filter((s) => s.until > this.time),
        until = extra.until ?? this.time + duration;
      const same = existing.find(
        (s) =>
          s.key === key &&
          s.commonId === p.common.id &&
          s.source === p.skill.ownerId &&
          s.potency === potency,
      );
      if (same) {
        same.until = Math.max(same.until, until);
        return same;
      }
      const status = {
        key,
        effectKey: extra.effectKey || key,
        until,
        potency,
        source: p.skill.ownerId,
        skillId: p.skill.id,
        castId: p.castId,
        commonId: p.common.id,
        ...extraFields,
        ...extra,
      };
      u.commonStatuses = existing.concat(status).slice(-256);
      if(isDebuff&&['root','slow','weak','defenseWeak','silence','airborne','stun'].includes(key)){this.partyUtilityLog??=[];this.partyUtilityLog.push({id:'utility-'+this.encounterId+'-'+(++this.serial),kind:'utility',actor:p.skill.ownerId,target:u.id,amount:Math.min(10,duration)});this.partyUtilityLog=this.partyUtilityLog.slice(-4096);}
      return status;
    };
    B.prototype.statusPower = function (u, key) {
      const cap = ["speed", "attackSpeed", "castSpeed"].includes(key)
        ? 0.5
        : key === "slow"
          ? 0.6
          : key === "weak" || key === "defenseWeak"
            ? 0.5
            : key === "healingReduction" || key === "damageReduction"
              ? 0.75
              : 1;
      return R.modifier(u, [key], cap, this.time);
    };
    B.prototype.startAttack = function (u, skill) {
      const original = u.agility;
      u.agility =
        (original + 100) * (1 + this.statusPower(u, "attackSpeed")) - 100;
      try {
        return oldStart.call(this, u, skill);
      } finally {
        u.agility = original;
      }
    };
    B.prototype.castSkill = function (u, id, t) {
      const out = oldCast.call(this, u, id, t);
      if (out.ok && u.action) {
        u.action.hitPart = u.aimPart || "torso";
        const haste = this.statusPower(u, "castSpeed");
        u.action.remaining /= 1 + haste;
        u.action.duration = u.action.remaining;
      }
      return out;
    };
    B.prototype.releaseSkill = function (u, a) {
      if (
        !a.prepared.common &&
        ["barrier", "one-hit-barrier"].includes(a.prepared.skill.effect)
      ) {
        const p = a.prepared,
          s = p.skill;
        this.grantShield(u, u, {
          ...p,
          castId: a.castId,
          common: {
            id: s.id,
            name: s.name,
            mana: p.baseMana ?? s.cost.mana,
            grade: s.grade,
            mechanic: {
              shieldMode: s.effect === "one-hit-barrier" ? "one-hit" : "absorb",
            },
          },
        });
        this.emit("skill_fx", {
          actor: u.id,
          x: u.x,
          y: u.y,
          face: a.face,
          visual: s.visual,
        });
        return;
      }
      if (!a.prepared.common && a.prepared.skill.effect === "mend") {
        const p = a.prepared,
          t = this.units.find((v) => v.id === a.targetId && v.hp > 0);
        if (t && Math.hypot(u.x - t.x, u.y - t.y) <= p.distance) {
          this.heal(
            u,
            t,
            {
              mana: p.baseMana ?? p.skill.cost.mana,
              grade: p.grade || p.skill.grade || 1,
            },
            { skill: p.skill, castId: a.castId },
          );
          this.emit("skill_fx", {
            actor: u.id,
            x: u.x,
            y: u.y,
            face: a.face,
            visual: p.skill.visual,
          });
        }
        return;
      }
      return oldRelease.call(this, u, a);
    };
    B.prototype.scheduleHealing = function (
      source,
      target,
      {
        mana,
        grade,
        healingPower = 0,
        coefficient = 1,
        ticks = 3,
        interval = 1,
        effectKey = "regeneration",
        receipt = {},
      },
    ) {
      if (
        !Number.isInteger(ticks) ||
        ticks < 1 ||
        ticks > 100 ||
        !Number.isFinite(interval) ||
        interval < 0.05 ||
        ticks * interval > 600
      )
        throw Error("지속 치유 설정이 잘못되었습니다.");
      const base = R.healAmount({
        mana,
        grade,
        healingPower,
        coefficient,
        maxHP: 1e12,
        hp: 0,
      }).base;
      this.healingOverTime ??= [];
      const old = this.healingOverTime.find(
        (e) =>
          e.target === target.id &&
          e.effectKey === effectKey &&
          e.rate >= base / (ticks * interval) &&
          e.nextTick + (e.left - 1) * e.interval >= this.time,
      );
      if (old) return false;
      this.healingOverTime = this.healingOverTime.filter(
        (e) => !(e.target === target.id && e.effectKey === effectKey),
      );
      this.healingOverTime.push({
        source: source.id,
        target: target.id,
        effectKey,
        rate: base / (ticks * interval),
        amount: base / ticks,
        left: ticks,
        nextTick: this.time + interval,
        interval,
        receipt,
      });
      return true;
    };
    B.prototype.step = function (dt, input) {
      if (this.paused || this.status !== "playing") return;
      oldStep.call(this, dt, input);
      for (const e of this.healingOverTime || [])
        while (e.left > 0 && e.nextTick <= this.time) {
          const source = this.units.find((u) => u.id === e.source),
            target = this.units.find((u) => u.id === e.target);
          if (source && target)
            this.heal(source, target, { base: e.amount }, e.receipt);
          e.left--;
          e.nextTick += e.interval;
        }
      this.healingOverTime = (this.healingOverTime || []).filter(
        (e) => e.left > 0,
      );
    };
    B.prototype.dispel = function (target, spec) {
      const r = R.dispel(target.commonStatuses, { ...spec, now: this.time });
      target.commonStatuses = r.statuses;
      this.emit("dispel", { target: target.id, count: r.removed.length });
      return r;
    };
  };
});
