'use strict';

const quoted = /“[^”]*”|‘[^’]*’|「[^」]*」|『[^』]*』|"[^"]*"|'[^']*'/gu;
const question = /[?？]|(?:할까|해도\s*(?:돼|되나|되나요|될까)|(?:할|갈|쓸|볼|을|를|칠)\s*수\s*있(?:어|나|나요|을까|습니까)|(?:가능|어떻게)\s*(?:해|한가|한가요|할까)?)[.!\s]*$/u;
const reported = /(?:라고|다고|냐고|자고|고|라는\s*말을)\s*(?:말했|했(?:다|어|습니다)|물었|외쳤|들었|전했|안내했|적혀|써\s*있)/u;

function clauses(input) {
  return input.replace(quoted, match => ' '.repeat(match.length))
    .match(/[^.!?。！？\n]+[.!?。！？]*/gu)?.filter(part => part.trim()) || [];
}

function informational(part) {
  return question.test(part) || reported.test(part);
}

function isDiscussion(input) {
  const parts = clauses(input);
  return parts.length ? parts.every(informational) : Boolean(input.match(quoted));
}

function supportsAction(input, evidence, verb) {
  // Quoted speech can support an explicit current request to a companion.
  const active = clauses(input).filter(part => !informational(part));
  if (active.some(part => part.includes(evidence))) return true;
  if (verb !== 'request') return false;
  for (const match of input.matchAll(quoted)) {
    const suffix = input.slice(match.index + match[0].length);
    if (match[0].includes(evidence) &&
        /^\s*(?:라고|고)\s*(?:말하|부탁하|요청하|전하)/u.test(suffix))
      return true;
  }
  return false;
}

module.exports = { isDiscussion, supportsAction };
