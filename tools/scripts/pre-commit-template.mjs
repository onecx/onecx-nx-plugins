import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [command, project] = process.argv.slice(2);
if (!['hash', 'copy'].includes(command)) {
  throw new Error('Expected hash or copy.');
}
if (!['angular-generator', 'react-generator'].includes(project)) {
  throw new Error('Expected angular-generator or react-generator.');
}

const directory = new URL(
  `../../${project}/src/generators/pre-commit-validation/files-upstream/`,
  import.meta.url
);
if (!existsSync(new URL('pre-commit', directory))) {
  throw new Error(
    'Missing upstream hook. Run npm run prepare:templates first.'
  );
}
const hook = readFileSync(new URL('pre-commit', directory));
const provenance = readFileSync(new URL('provenance.json', directory));
if (
  createHash('sha256').update(hook).digest('hex') !==
  JSON.parse(provenance.toString('utf8')).sha256
) {
  throw new Error('Upstream pre-commit template checksum does not match.');
}
if (command === 'hash') {
  console.log(
    createHash('sha256').update(hook).update(provenance).digest('hex')
  );
} else {
  const destination = new URL(
    `../../dist/${project}/src/generators/pre-commit-validation/files-upstream/`,
    import.meta.url
  );
  mkdirSync(destination, { recursive: true });
  writeFileSync(new URL('pre-commit', destination), hook);
  writeFileSync(new URL('provenance.json', destination), provenance);
  console.log(`Packaged upstream pre-commit template for ${project}.`);
}
