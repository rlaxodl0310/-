'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const root = profile => path.join(profile, 'update-backups');
const marker = profile => path.join(profile, 'last-game-version.json');
const files = ['emergent-story.json', 'emergent-story.json.previous', 'story-slots', 'Local Storage'];

async function json(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function prepare(profile, version) {
  const previous = (await json(marker(profile)))?.version ?? null;
  if (previous === version) return;
  const sources = [];
  for (const name of files) {
    try { await fs.stat(path.join(profile, name)); sources.push(name); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (sources.length) {
    await fs.mkdir(root(profile), { recursive: true });
    const temp = await fs.mkdtemp(path.join(root(profile), '.backup-'));
    try {
      for (const name of sources) await fs.cp(path.join(profile, name), path.join(temp, name), { recursive: true });
      const story = await json(path.join(temp, 'emergent-story.json')).catch(() => null);
      const entry = { previousVersion: previous, version, savedAt: new Date().toISOString(),
        location: story?.location ?? null, minutes: story?.minutes ?? null };
      await fs.writeFile(path.join(temp, 'backup.json'), JSON.stringify(entry), { flag: 'wx' });
      await fs.rename(temp, path.join(root(profile), 'backup-' + crypto.randomUUID()));
    } finally {
      await fs.rm(temp, { recursive: true, force: true });
    }
  }
  await fs.mkdir(profile, { recursive: true });
  const file = marker(profile);
  const temp = file + '.' + crypto.randomUUID() + '.tmp';
  try {
    await fs.writeFile(temp, JSON.stringify({ version }), { flag: 'wx' });
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true });
  }
}

async function list(profile) {
  let entries;
  try { entries = await fs.readdir(root(profile), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const backups = [];
  for (const entry of entries.filter(e => e.isDirectory() && e.name.startsWith('backup-'))) {
    const data = await json(path.join(root(profile), entry.name, 'backup.json'));
    if (data) backups.push(data);
  }
  return backups.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

module.exports = { prepare, list };
