(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SkillEffects = factory();
})(globalThis, () => {
  "use strict";
  const palettes = {
    physical: "#ffe6b0",
    fire: "#ff9c69",
    frost: "#acecff",
    shadow: "#b6a5ec",
    light: "#fff3c4",
    arcane: "#adc2ff",
    lightning: "#cce7ff",
    water: "#8dd9ed",
    wind: "#bbebdf",
    poison: "#b5d78b",
  };
  const motifs = [
    "arc",
    "ring",
    "trail",
    "sparks",
    "chain",
    "rune",
    "flash",
    "afterimage",
    "rift",
    "stitch",
    "tether",
    "shield",
    "crystal",
    "mist",
    "aura",
    "vortex",
    "bolt",
    "burst",
    "rain",
    "lightning",
  ];
  function draw(ctx, event, point, scale, age, reduced = false) {
    const v = event?.visual;
    if (
      !v ||
      !Object.hasOwn(palettes, v.element) ||
      !motifs.includes(v.motif) ||
      !Number.isFinite(age) ||
      age < 0
    )
      return false;
    const duration = Math.max(0.3, Math.min(1.2, v.duration || 0.55));
    if (age > duration) return false;
    const p = point(event),
      t = reduced ? 0.4 : age / duration,
      r =
        Math.min(90, Math.max(12, scale * 1.25)) *
        Math.min(1.8, Math.max(0.8, Number(v.scale) || 1)),
      angle = Math.atan2(event.face?.y || 0, event.face?.x || 1),
      seed = (v.seed || 0) % 31,
      hits = Math.min(12, Math.max(1, v.hits || 1));
    ctx.save();
    ctx.globalAlpha = (reduced ? 0.65 : 1 - t) * 0.9;
    ctx.strokeStyle = palettes[v.element];
    ctx.fillStyle = palettes[v.element];
    ctx.lineWidth = reduced ? 2 : 2 + (1 - t) * 2;
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.beginPath();
    if (v.motif === "rain") {
      for (let i = 0; i < 12; i++) {
        const x = (((i * 19 + seed) % 101) / 100) * r * 2 - r,
          y = (((i * 13 + seed) % 71) / 70) * r - r;
        ctx.moveTo(x - r * 0.2 * t, y - r * 0.8);
        ctx.lineTo(x, y + r * 0.4 * t);
      }
    } else if (v.motif === "lightning") {
      ctx.moveTo(0, -r * 1.4);
      for (let i = 0; i < 7; i++)
        ctx.lineTo(Math.sin(i * 2 + seed) * r * 0.22, -r * 1.4 + i * r * 0.35);
    } else if (v.motif === "arc") {
      for (let i = 0; i < Math.min(7, hits); i++) {
        const phase = Math.max(0, Math.min(1, t * 1.8 - i * 0.1));
        ctx.moveTo(Math.cos(-1 + phase) * r, Math.sin(-1 + phase) * r);
        ctx.arc(
          0,
          0,
          r * (0.45 + i * 0.1 + phase * 0.2),
          -1 + phase * 0.8,
          1 + phase * 0.8,
        );
      }
    } else if (
      ["ring", "burst", "rain", "lightning", "aura", "shield"].includes(v.motif)
    ) {
      const radius = r * (v.motif === "aura" ? 0.8 : 0.4 + t * 0.7);
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      if (v.motif === "shield") {
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius * 0.8, -radius * 0.5);
        ctx.lineTo(radius * 0.6, radius * 0.5);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius * 0.6, radius * 0.5);
        ctx.lineTo(-radius * 0.8, -radius * 0.5);
        ctx.closePath();
      }
      if (v.motif === "burst")
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5;
          ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.lineTo(Math.cos(a) * (radius + 8), Math.sin(a) * (radius + 8));
        }
    } else if (["trail", "bolt", "tether"].includes(v.motif)) {
      ctx.moveTo(-r * t, 0);
      ctx.quadraticCurveTo(0, -r * 0.4, r * (0.4 + t), 0);
      if (v.motif === "bolt") {
        ctx.moveTo(r, 0);
        ctx.lineTo(r - 12, -7);
        ctx.moveTo(r, 0);
        ctx.lineTo(r - 12, 7);
      }
    } else if (v.motif === "chain") {
      for (let i = 0; i < 7; i++) {
        ctx.moveTo(i * r * 0.2 + 6, Math.sin(i + seed) * r * 0.12);
        ctx.ellipse(
          i * r * 0.2,
          Math.sin(i + seed) * r * 0.12,
          7,
          4,
          (i % 2) * 0.6,
          0,
          7,
        );
      }
    } else if (v.motif === "rune") {
      ctx.arc(0, 0, r * 0.75, 0, 7);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + t;
        ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.lineTo(
          Math.cos(a + Math.PI * 0.67) * r * 0.6,
          Math.sin(a + Math.PI * 0.67) * r * 0.6,
        );
      }
    } else if (v.motif === "rift") {
      ctx.ellipse(0, 0, r * (0.2 + t * 0.3), r, 0, 0, 7);
      ctx.moveTo(-r * 0.3, -r);
      ctx.lineTo(r * 0.15, -r * 0.2);
      ctx.lineTo(-r * 0.1, r * 0.3);
      ctx.lineTo(r * 0.3, r);
    } else if (v.motif === "stitch") {
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * r * 0.25;
        ctx.moveTo(x, -r * 0.35);
        ctx.quadraticCurveTo(x + r * 0.2, 0, x, r * 0.35);
      }
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
    } else if (v.motif === "afterimage") {
      for (let i = 0; i < 3; i++) {
        const x = -i * r * 0.4 * (0.5 + t);
        ctx.moveTo(x + 7, -r * 0.5);
        ctx.arc(x, -r * 0.5, 7, 0, 7);
        ctx.moveTo(x, -r * 0.3);
        ctx.lineTo(x, r * 0.1);
        ctx.lineTo(x - r * 0.2, r * 0.5);
        ctx.moveTo(x, r * 0.1);
        ctx.lineTo(x + r * 0.15, r * 0.45);
      }
    } else if (v.motif === "crystal") {
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * r * 0.3,
          h = r * (0.5 + (i % 2) * 0.4);
        ctx.moveTo(x - r * 0.12, r * 0.4);
        ctx.lineTo(x - r * 0.1, -h);
        ctx.lineTo(x, -h - r * 0.2);
        ctx.lineTo(x + r * 0.12, -h);
        ctx.lineTo(x + r * 0.15, r * 0.4);
      }
    } else if (v.motif === "vortex") {
      for (let i = 0; i < 3; i++) {
        ctx.moveTo(0, 0);
        for (let n = 0; n < 45; n++) {
          const a = n * 0.2 + i * 2.094 + t * 3,
            rr = (n / 45) * r;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
      }
    } else if (v.motif === "mist") {
      ctx.globalAlpha *= 0.3;
      for (let i = 0; i < 8; i++) {
        const a = i * 2.4 + seed,
          x = Math.cos(a) * r * 0.65,
          y = Math.sin(a) * r * 0.4;
        ctx.moveTo(x + r * 0.35, y);
        ctx.arc(x, y, r * (0.3 + t * 0.15), 0, 7);
      }
    } else
      for (let i = 0; i < (v.motif === "flash" ? 12 : 8); i++) {
        const a = (i * Math.PI) / (v.motif === "flash" ? 6 : 4) + seed * 0.1,
          d = r * (0.2 + t);
        ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d);
        ctx.lineTo(Math.cos(a) * (d + 10), Math.sin(a) * (d + 10));
      }
    ctx.stroke();
    ctx.restore();
    return true;
  }
  function weapon(ctx, x, y, size, type, phase = 0) {
    if (!["sword", "spear", "shield"].includes(type)) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.6 + Math.sin(phase * 12) * 0.6);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#d4e0e4";
    ctx.fillStyle = "#94b5c4";
    if (type === "shield") {
      ctx.beginPath();
      ctx.moveTo(-size * 0.12, -size * 0.2);
      ctx.lineTo(size * 0.14, -size * 0.2);
      ctx.lineTo(size * 0.16, size * 0.05);
      ctx.lineTo(0, size * 0.2);
      ctx.lineTo(-size * 0.15, size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, size * 0.08);
      ctx.lineTo(0, -size * (type === "spear" ? 0.65 : 0.4));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, -size * (type === "spear" ? 0.55 : 0.3));
      ctx.lineTo(0, -size * (type === "spear" ? 0.72 : 0.45));
      ctx.lineTo(4, -size * (type === "spear" ? 0.55 : 0.3));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (type === "sword") {
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  return { draw, motifs, weapon };
});
