'use strict';

function append(previous, next, {input, resolution, requestId}) {
  if (!previous || next.revision <= previous.revision) return;
  const changes = {};
  for (const [key, before, after] of [
    ['minutes', previous.minutes, next.minutes],
    ['hp', previous.player.hp, next.player.hp],
    ['mana', previous.player.mana, next.player.mana],
    ['fatigue', previous.player.fatigue, next.player.fatigue],
  ]) {
    if (Number.isFinite(before) && Number.isFinite(after) && before !== after)
      changes[key] = { before, after };
  }
  if (previous.location !== next.location)
    changes.location = { before: previous.location, after: next.location };
  if (previous.combat?.status !== next.combat?.status)
    changes.combat = { before: previous.combat?.status ?? null, after: next.combat?.status ?? null };
  const row = {
    revision: next.revision, requestId, input, panels: next.panels, changes,
    steps: (resolution?.steps || []).map(({ reason }) => reason).filter(Boolean),
    reactions: (resolution?.npcReactions || []).filter(r => r.response !== 'autonomous')
      .map(({ actor, response }) => ({ actor, response })),
  };
  next.turnReview = [...(previous.turnReview || []), row].slice(-100);
}

module.exports = { append };
