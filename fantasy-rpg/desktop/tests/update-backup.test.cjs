const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Backup = require('../electron/update-backup.cjs');

test('version upgrade copies saves before opening them and avoids duplicate backups', async () => {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'fantasy-version-'));
  try {
    await Backup.prepare(profile, '0.42.76');
    assert.deepEqual(await Backup.list(profile), []);
    const story = JSON.stringify({ location: 'test-place', minutes: 65 });
    await fs.writeFile(path.join(profile, 'emergent-story.json'), story);
    await fs.mkdir(path.join(profile, 'story-slots'));
    await fs.writeFile(path.join(profile, 'story-slots', 'slot.json'), 'slot-data');
    await fs.writeFile(path.join(profile, 'settings.json'), 'settings');
    await Backup.prepare(profile, '0.42.77');
    await Backup.prepare(profile, '0.42.77');
    const [entry, extra] = await Backup.list(profile);
    assert.equal(extra, undefined);
    assert.deepEqual({ ...entry, savedAt: undefined }, {
      savedAt: undefined, previousVersion: '0.42.76', version: '0.42.77', location: 'test-place', minutes: 65,
    });
    const folder = path.join(profile, 'update-backups');
    const copy = path.join(folder, (await fs.readdir(folder))[0]);
    assert.equal(await fs.readFile(path.join(copy, 'emergent-story.json'), 'utf8'), story);
    assert.equal(await fs.readFile(path.join(copy, 'story-slots', 'slot.json'), 'utf8'), 'slot-data');
    await assert.rejects(fs.stat(path.join(copy, 'settings.json')), { code: 'ENOENT' });
  } finally {
    await fs.rm(profile, { recursive: true, force: true });
  }
});
