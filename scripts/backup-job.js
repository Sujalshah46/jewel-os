import { mkdir, writeFile, rename } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { backupDatabase } from './recovery.js';

try {
  const directory = process.env.BACKUP_DIRECTORY;
  if (!directory || !isAbsolute(directory)) throw new Error('Absolute BACKUP_DIRECTORY required.');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const started = Date.now();
  const archivePath = join(directory, `jewel-${new Date().toISOString().replaceAll(':','-')}-${randomUUID()}.dump.enc`);
  await backupDatabase({ connectionString: process.env.DATABASE_URL, keyFile: process.env.BACKUP_KEY_FILE, archivePath });
  const temporary = join(directory, '.backup-status-' + randomUUID());
  await writeFile(temporary, JSON.stringify({ lastSuccessAt: new Date().toISOString(), durationMs: Date.now()-started })+'\n', { flag:'wx', mode:0o600 });
  await rename(temporary, join(directory,'last-success.json'));
  console.log(JSON.stringify({ event:'backup_complete', durationMs:Date.now()-started }));
} catch { console.error(JSON.stringify({event:'backup_failed'})); process.exitCode=1; }
