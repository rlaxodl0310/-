'use strict';

const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const Geography = require('../ui/map/geography.js');

const help = '/정리 현재 상황 · /질문 내용 게임 밖에서 질문 · /되돌리기 직전 저장 미리 보기 · /확인 복구 · /취소 복구 취소';
const place = state => Geography.records.find(record => record.id === state.location)?.name || state.location;
const digest = data => crypto.createHash('sha256').update(data).digest('hex');

async function previous(director) {
  const file = director.file + '.previous';
  try {
    const hash = digest(await fs.readFile(file));
    const state = await new director.constructor(file, director.bridge).read();
    return { hash, state };
  } catch (error) {
    if (error.code === 'ENOENT') throw Error('되돌릴 직전 저장이 없습니다.');
    throw error;
  }
}

async function run(director, request) {
  const text = typeof request?.text === 'string' ? request.text.trim() : '';
  if (!text.startsWith('/') || text.length > 1000) throw Error('채팅 명령을 확인해 주세요.');
  const [, name, argument = ''] = text.match(/^\/(\S*)(?:\s+([\s\S]*))?$/u);
  if (name === '도움말' && !argument) return { text: help };
  if (!['정리', '질문', '되돌리기', '확인', '취소'].includes(name) || (name === '질문') !== Boolean(argument))
    return { text: '명령 형식을 확인해 주세요. ' + help };

  if (director.busy || director.activeHandoff) throw Error('진행 중인 장면이나 전투를 먼저 마쳐 주세요.');
  director.busy = true;
  try {
    const current = await director.read();
    if (current.revision !== request.revision) throw Error('화면이 오래되었습니다. 이야기를 다시 열어 주세요.');
    if (current.combat?.mode === 'realtime' && current.combat.status === 'playing')
      throw Error('실시간 전투를 마친 뒤 채팅 명령을 사용해 주세요.');
    if (name === '취소') {
      director.pendingCommandRestore = null;
      return { text: '되돌리기를 취소했어요.' };
    }
    if (name === '되돌리기') {
      const target = await previous(director);
      director.pendingCommandRestore = { revision: current.revision, hash: target.hash };
      return { text: '직전 저장으로 돌아갈 수 있어요. ' + place(target.state) + ' · ' +
        target.state.minutes + '분 · 기록 ' + target.state.revision +
        '번째. /확인 을 입력하면 복구하고, /취소 를 입력하면 유지해요.' };
    }
    if (name === '확인') {
      const pending = director.pendingCommandRestore;
      director.pendingCommandRestore = null;
      if (!pending || pending.revision !== current.revision)
        return { text: '/되돌리기 로 복구할 상태를 먼저 확인해 주세요.' };
      const target = await previous(director);
      if (target.hash !== pending.hash) return { text: '직전 저장이 바뀌었어요. /되돌리기 로 다시 확인해 주세요.' };
      const restored = target.state;
      const revision = Math.max(current.revision, restored.revision) + 1;
      if (restored.pendingObservationAction?.revision === restored.revision)
        restored.pendingObservationAction.revision = revision;
      restored.revision = revision;
      restored.timeline = { id: crypto.randomUUID(), parentId: restored.timeline?.id || null };
      delete restored.saveSlot;
      const state = await director.save(restored, { restore: true, discussion: true });
      return { text: '직전 저장으로 돌아왔어요. 복구 직전 상태도 직전 저장으로 보존했어요.', state };
    }

    const ready = await director.bridge.check();
    if (!ready.ready) throw Error(ready.message);
    const context = {
      location: place(current), minutes: current.minutes, panels: current.panels,
      player: { hp: current.player.hp, mana: current.player.mana },
      combat: current.combat?.status ?? null,
      recent: current.turns.slice(-5).map(({ text, panels }) => ({ text, panels })),
    };
    const answer = await director.bridge.generateStructured([
      { role: 'system', content: '게임 밖에서 플레이어에게 안내한다. 주어진 정보로만 짧게 답한다. 행동 실행, 시간 경과, 설정 변경, 저장 변경 권한이 없다. 확인할 수 없는 것은 미확인이라고 답한다. 현재 공개 상태: ' + JSON.stringify(context) },
      { role: 'user', content: name === '정리' ? '현재 상황과 마지막으로 확인한 일을 한국어로 짧게 정리해 줘.' : argument },
    ], { type: 'object', additionalProperties: false, required: ['text'], properties: { text: { type: 'string' } } });
    if (typeof answer?.text !== 'string' || !answer.text.trim() || answer.text.length > 1600)
      throw Error('명령 답변을 확인하지 못했어요.');
    return { text: answer.text.trim() };
  } finally {
    director.busy = false;
  }
}

module.exports = { run };
