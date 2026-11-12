import { readJson, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { execFileSync, spawnSync } from 'child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import {
  configurePreCommit,
  configureQualityChecks,
} from './repository-guardrails';

const templates = resolve(
  __dirname,
  '../../../angular-generator/src/generators/pre-commit-validation/files-upstream'
);

function writeTree(directory: string, tree: Tree) {
  for (const change of tree.listChanges()) {
    if (change.type === 'DELETE') {
      rmSync(join(directory, change.path));
    } else {
      const file = join(directory, change.path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, change.content, change.options);
    }
  }
}

describe('repository guardrails', () => {
  let directory: string;
  let tree: Tree;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'onecx-guardrails-'));
    tree = createTreeWithEmptyWorkspace();
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it.each(['angular', 'react'] as const)(
    'configures working quality entrypoints for %s without losing existing scripts',
    (framework) => {
      updateJson(tree, 'package.json', (pkg) => ({
        ...pkg,
        scripts: {
          lint: 'nx lint',
          prepare: 'node setup.cjs',
          custom: 'echo keep',
        },
      }));
      configureQualityChecks(tree, framework);
      configurePreCommit(tree, templates);
      configurePreCommit(tree, templates);

      const { scripts } = readJson(tree, 'package.json');
      expect(scripts).toMatchObject({
        lint: 'npm run lint:eslint && npm run lint:styles',
        'lint:styles': 'stylelint "src/**/*.{css,scss}"',
        prettier: 'prettier --check .',
        'test:ci': 'nx test --watch=false --coverage',
        custom: 'echo keep',
        prepare: 'node setup.cjs && husky',
      });
      expect(tree.read('scripts/pre-commit-qa')).toEqual(
        readFileSync(join(templates, 'pre-commit'))
      );
      expect(
        tree.listChanges().find((change) => change.path === '.husky/pre-commit')
          ?.options?.mode
      ).toBe(0o755);
    }
  );

  it('refuses to overwrite a custom hook or lint script', () => {
    tree.write('.husky/pre-commit', 'echo custom');
    expect(() => configurePreCommit(tree, templates)).toThrow(
      'not managed by OneCX'
    );
    expect(tree.read('.husky/pre-commit', 'utf8')).toBe('echo custom');
    configurePreCommit(tree, templates, {
      qualityChecks: false,
      secrets: false,
    });
    expect(tree.read('.husky/pre-commit', 'utf8')).toBe('echo custom');
    updateJson(tree, 'package.json', (pkg) => ({
      ...pkg,
      scripts: { lint: 'custom-linter' },
    }));
    expect(() => configureQualityChecks(tree, 'react')).toThrow(
      'Existing lint script'
    );
  });

  it('rejects a damaged snapshot instead of installing an unchecked hook', () => {
    writeFileSync(join(directory, 'pre-commit'), '#!/bin/sh\nexit 0\n');
    writeFileSync(
      join(directory, 'provenance.json'),
      JSON.stringify({ sha256: 'wrong' })
    );
    expect(() => configurePreCommit(tree, directory)).toThrow(
      'checksum does not match'
    );
  });

  it('retains existing Stylelint configuration', () => {
    tree.write('stylelint.config.cjs', 'module.exports = { rules: {} };');
    configureQualityChecks(tree, 'react');
    expect(tree.exists('.stylelintrc.json')).toBe(false);
    expect(tree.read('stylelint.config.cjs', 'utf8')).toBe(
      'module.exports = { rules: {} };'
    );
  });

  it('runs fast checks normally, gates heavy checks, and blocks an actual commit on failure', () => {
    configurePreCommit(tree, templates);
    const names = [
      'lint',
      'prettier',
      'build',
      'test:ci',
      'sonar',
      'test:arch',
      'test:a11y',
      'extra',
    ];
    updateJson(tree, 'package.json', (pkg) => {
      pkg.scripts = Object.fromEntries(
        names.map((name) => [
          name,
          `node -e "require('fs').appendFileSync('checks', '${name} ')"`,
        ])
      );
      return pkg;
    });
    writeTree(directory, tree);
    const env = { ...process.env };
    for (const name of [
      'CI',
      'FORCE_CI_COMMIT_HOOKS',
      'EXTRA_LINT_SCRIPTS',
      'EXTRA_QA_SCRIPTS',
    ]) {
      delete env[name];
    }
    const run = (extraEnv: NodeJS.ProcessEnv = {}) =>
      spawnSync('sh', ['.husky/pre-commit'], {
        cwd: directory,
        env: { ...env, ...extraEnv },
        encoding: 'utf8',
      });
    expect(run().status).toBe(0);
    expect(readFileSync(join(directory, 'checks'), 'utf8')).toBe(
      'lint prettier '
    );
    writeFileSync(join(directory, 'checks'), '');
    expect(
      run({ FORCE_CI_COMMIT_HOOKS: '1', EXTRA_QA_SCRIPTS: 'extra' }).status
    ).toBe(0);
    expect(readFileSync(join(directory, 'checks'), 'utf8')).toBe(
      `${names.join(' ')} `
    );
    writeFileSync(join(directory, 'checks'), '');
    expect(run({ CI: 'true' }).status).toBe(0);
    expect(readFileSync(join(directory, 'checks'), 'utf8')).toContain('sonar ');

    updateJson(tree, 'package.json', (pkg) => {
      pkg.scripts.lint = 'node -e "process.exit(1)"';
      return pkg;
    });
    writeTree(directory, tree);
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    execFileSync('git', ['add', 'package.json'], { cwd: directory });
    const commit = spawnSync(
      'git',
      [
        '-c',
        'core.hooksPath=.husky',
        '-c',
        'user.name=Guardrail Test',
        '-c',
        'user.email=guardrail-test@example.invalid',
        'commit',
        '-m',
        'test: exercise generated guardrails',
        '-m',
        'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>',
      ],
      { cwd: directory, env, encoding: 'utf8' }
    );
    expect(commit.status).not.toBe(0);
    expect(commit.stdout + commit.stderr).toContain('FAILED: lint');
    expect(commit.stdout + commit.stderr).toContain('commit aborted');
  }, 60000);

  it.each([false, true])(
    'checks staged content without exposing blacklist values (QA enabled: %s)',
    (qualityChecks) => {
      configurePreCommit(tree, templates, {
        qualityChecks,
        secrets: true,
      });
      writeTree(directory, tree);
      const blacklist = join(directory, 'blacklist.txt');
      writeFileSync(blacklist, 'blocked-test-word\n');
      const stagedFile = join(directory, 'file with spaces.txt');
      writeFileSync(stagedFile, 'blocked-test-word');
      execFileSync('git', ['init', '--quiet'], { cwd: directory });
      execFileSync('git', ['add', 'file with spaces.txt'], { cwd: directory });
      writeFileSync(stagedFile, 'working tree is clean');
      const run = (blacklistFile: string) =>
        spawnSync('sh', ['.husky/pre-commit'], {
          cwd: directory,
          env: { ...process.env, BLACKLIST_FILE: blacklistFile },
          encoding: 'utf8',
        });
      const blocked = run(blacklist);
      expect(blocked.status).not.toBe(0);
      expect(blocked.stderr).toContain('file with spaces.txt');
      expect(blocked.stdout + blocked.stderr).not.toContain(
        'blocked-test-word'
      );
      execFileSync('git', ['add', 'file with spaces.txt'], { cwd: directory });
      expect(run(blacklist).status).toBe(0);
      expect(run(join(directory, 'missing-blacklist'))).toMatchObject({
        status: 1,
        stderr: expect.stringContaining('ENOENT'),
      });
    }
  );
});
