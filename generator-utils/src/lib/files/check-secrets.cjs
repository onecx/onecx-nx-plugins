const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');

const blacklistFile =
  process.env.BLACKLIST_FILE || join(homedir(), 'blacklist.txt');
const blacklist = readFileSync(blacklistFile, 'utf8')
  .split(/\r?\n/)
  .map((word) => word.trim())
  .filter(Boolean);

const files = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
  { encoding: 'utf8' }
)
  .split('\0')
  .filter(Boolean);

let failed = false;
for (const file of files) {
  const content = execFileSync('git', ['show', `:${file}`], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (blacklist.some((word) => content.includes(word))) {
    console.error(`Forbidden content found in staged file: ${file}`);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
