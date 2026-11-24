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

const reference = /(?:아까|방금|전에|조금\s*전에)\s*(?:다시\s*)?(?:확인한|살펴본|살핀|관찰한|들었던|들은|본|보았던|봤던|소리\s*난)|(?:그|저)\s*(?:물건|대상|쪽|방향)|(?:그것|그쪽|저쪽)/u;
const directional = /(?:소리|기척|방향|그쪽|저쪽|(?:그|저)\s*쪽)/u;
const generic = /^(?:\s*(?:그\s*)?(?:것|물건|대상|엄폐물|자리)?\s*(?:을|를|에|으로|로|부터|뒤|옆|쪽|근처|다시|자세히|살피|확인|이동|다가|접근|숨|가리|열|닫|밀|넘어|엎|$))/u;

function resolveReference(state, sceneKey, clauses, objects) {
  const matches = clauses.filter(text => reference.test(text));
  if (!matches.length) return null;
  if (matches.length > 1) return { message: '한 번에 어느 관찰 대상을 가리키는지 하나씩 알려 주세요.' };
  const [clause] = matches;
  const match = reference.exec(clause);
  const tail = clause.slice(match.index + match[0].length).trimStart().replace(/^그\s+/u, '');
  const names = objects.flatMap(object => {
    const words = object.name.trim().split(/\s+/u);
    const aliases = [object.name, words.at(-1)];
    return aliases.filter(alias => alias && tail.startsWith(alias) &&
      /^(?:$|[\s,.!?]|을|를|에|으로|로|의|뒤|옆|쪽|가|이)/u.test(tail.slice(alias.length))).map(alias => ({ id: object.id, length: alias.length }));
  });
  const longest = Math.max(0, ...names.map(item => item.length));
  const namedIds = new Set(names.filter(item => item.length === longest).map(item => item.id));
  if (directional.test(match[0]) || !namedIds.size && /^\s*(?:소리|기척|방향|쪽)/u.test(tail))
    return { message: '그 소리나 기척이 난 정확한 방향은 아직 확인되지 않았어요. 어느 방향을 살필지 알려 주세요.' };
  const observed = new Set((state.actionWorld?.locations?.[sceneKey]?.observations || []).map(row => row.subject).filter(Boolean));
  const candidates = objects.filter(object => observed.has(object.id) &&
    (namedIds.size ? namedIds.has(object.id) : generic.test(tail)));
  if (candidates.length === 1) return { target: candidates[0].id, name: candidates[0].name, clause };
  if (candidates.length > 1) {
    const names = [...new Set(candidates.map(object => object.name))];
    return { clause, candidates: candidates.map(object=>object.id), message: '어느 물건을 말하는 건가요? '+(names.length===1
      ? names[0]+'이 여럿이라 위치를 함께 말해 주세요.'
      : names.slice(0,4).join(', ')+' 중 무엇인지 알려 주세요.') };
  }
  return { message: '이 현장에서 가리킨 물건을 확인할 수 없어요. 어느 물건인지 알려 주세요.' };
}

function followup(state, sceneKey, input, objects) {
  const pending=state.pendingObservationAction;
  if (!pending||pending.revision!==state.revision||pending.sceneKey!==sceneKey||
      pending.combatId!==(state.combat?.id??null)) return null;
  const answer=input.trim().replace(/[.!。！]+$/u,'').trim();
  if (/^(?:취소|취소해|취소할게|그만|됐어)$/u.test(answer)) return { cancelled:true };
  const observed=new Set((state.actionWorld?.locations?.[sceneKey]?.observations||[]).map(row=>row.subject));
  const matches=objects.filter(object=>{
    if (!pending.candidates.includes(object.id)||!observed.has(object.id)) return false;
    const aliases=[object.name,object.name.trim().split(/\s+/u).at(-1)];
    return aliases.some(alias=>alias&&answer.startsWith(alias)&&
      /^(?:(?:의|은|는|을|를|이|가)?\s*(?:뒤(?:로|에)?|옆(?:으로|에)?|쪽(?:으로|에)?)?)$/u.test(answer.slice(alias.length)));
  });
  if (matches.length>1) return { pending, message:'같은 이름의 물건이 여럿 있어요. 위치와 행동을 함께 말해 주세요.' };
  if (matches.length===1) return {
    target:matches[0].id,name:matches[0].name,clause:pending.clause,input:pending.input,verb:pending.verb,
  };
  return null;
}

module.exports = { capture, context, resolveReference, followup };
