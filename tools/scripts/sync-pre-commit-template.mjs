import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repository = 'onecx/onecx-ai-workflows';
const sourcePath = 'templates/pre-commit/npm/.husky/pre-commit';
const ref = process.argv[2] ?? 'main';
const headers = { 'User-Agent': 'onecx-nx-plugins' };
if (process.env.GH_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
}

async function download(url) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return response;
}

const commitResponse = await download(
  `https://api.github.com/repos/${repository}/commits/${encodeURIComponent(
    ref
  )}`
);
const { sha } = await commitResponse.json();
if (typeof sha !== 'string' || !/^[a-f0-9]{40}$/.test(sha)) {
  throw new Error('Upstream did not return a valid commit SHA.');
}

const response = await download(
  `https://api.github.com/repos/${repository}/contents/${sourcePath}?ref=${sha}`
);
const file = await response.json();
if (file.encoding !== 'base64' || typeof file.content !== 'string') {
  throw new Error('Upstream did not return the pre-commit template.');
}
const hook = Buffer.from(file.content, 'base64');
const syntax = spawnSync('sh', ['-n'], { input: hook, encoding: 'utf8' });
if (!hook.toString('utf8').startsWith('#!') || syntax.status !== 0) {
  throw new Error(
    `Invalid upstream shell hook: ${syntax.error ?? syntax.stderr}`
  );
}

const provenance = {
  repository,
  commit: sha,
  path: sourcePath,
  sha256: createHash('sha256').update(hook).digest('hex'),
};

for (const project of ['angular-generator', 'react-generator']) {
  const directory = fileURLToPath(
    new URL(
      `../../${project}/src/generators/pre-commit-validation/files-upstream/`,
      import.meta.url
    )
  );
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/pre-commit`, hook);
  await writeFile(
    `${directory}/provenance.json`,
    `${JSON.stringify(provenance, null, 2)}\n`
  );
}
console.log(`Prepared pre-commit template: ${JSON.stringify(provenance)}`);
