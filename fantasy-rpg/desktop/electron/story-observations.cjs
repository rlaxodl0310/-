'use strict';

const conditions = {
  intact: '온전함', toppled: '넘어짐', open: '열림', closed: '닫힘', locked: '잠김', broken: '파손',
};

function capture(state, next, sceneKey, resolution) {
  const observations = [];
  for (const step of resolution.steps) {
    if (step.verb === 'inspect' && step.status === 'success') {
      const object = next.actionWorld.locations[sceneKey].objects.find(item => item.id === step.target);
      if (object && conditions[object.condition]) observations.push({
        subject: object.id, confirmed: object.name + '의 상태를 확인했다. ' + conditions[object.condition] + '.',
        uncertain: '겉에서 확인할 수 없는 성질은 미확인.',
      });
    }
    if (step.verb === 'observe' && step.status === 'attempted') {
      observations.push({
        subject: null,
        confirmed: resolution.enemyResponse || '이번 관찰에서 새로 확인된 기척은 없었다.',
        uncertain: '정확한 방향과 추가 개체는 미확인.',
      });
    }
  }
  if (!observations.length) return;
  const site = next.actionWorld.locations[sceneKey];
  resolution.observations = observations.map((observation, index) => ({
    ...observation, id: 'observation-' + (state.revision + 1) + '-' + index,
    revision: state.revision + 1, location: state.location, sceneKey,
    encounterId: state.combat?.status === 'playing' ? state.combat.id : null,
  }));
  site.observations = [...(site.observations || []), ...resolution.observations].slice(-12);
}

function context(state, sceneKey) {
  return (state.actionWorld?.locations?.[sceneKey]?.observations || []).slice(-6).map(observation => {
    const encounterMatches = observation.encounterId === (state.combat?.status === 'playing' ? state.combat.id : null);
    const recent = observation.revision === state.revision && encounterMatches;
    return { ...observation, freshness: recent ? 'last-action' : 'historical' };
  });
}

module.exports = { capture, context };
