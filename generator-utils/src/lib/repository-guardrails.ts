import {
  addDependenciesToPackageJson,
  readJson,
  Tree,
  updateJson,
} from '@nx/devkit';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

type Framework = 'angular' | 'react';

export function configureQualityChecks(tree: Tree, framework: Framework) {
  const stylelintConfig = {
    angular: {
      packageName: 'stylelint-config-standard-scss',
      version: '^14.0.0',
    },
    react: {
      packageName: 'stylelint-config-standard',
      version: '^38.0.0',
    },
  }[framework];
  addDependenciesToPackageJson(
    tree,
    {},
    {
      stylelint: '^16.18.0',
      [stylelintConfig.packageName]: stylelintConfig.version,
    }
  );

  const configPath = '.stylelintrc.json';
  const configFiles = [
    '.stylelintrc',
    '.stylelintrc.json',
    '.stylelintrc.yml',
    '.stylelintrc.yaml',
    '.stylelintrc.js',
    '.stylelintrc.cjs',
    '.stylelintrc.mjs',
    'stylelint.config.js',
    'stylelint.config.cjs',
    'stylelint.config.mjs',
    'stylelint.config.ts',
  ];
  if (
    !configFiles.some((file) => tree.exists(file)) &&
    !readJson(tree, 'package.json').stylelint
  ) {
    tree.write(
      configPath,
      JSON.stringify(
        {
          extends: stylelintConfig.packageName,
          ignoreFiles: [
            'node_modules/**',
            'dist/**',
            'reports/**',
            'src/app/shared/generated/**',
            'src/api/generated/**',
          ],
          rules: {
            'no-empty-source': null,
            ...(framework === 'angular'
              ? {}
              : {
                  'at-rule-no-unknown': [
                    true,
                    {
                      ignoreAtRules: [
                        'theme',
                        'source',
                        'utility',
                        'variant',
                        'custom-variant',
                        'apply',
                        'reference',
                        'config',
                        'plugin',
                        'tailwind',
                      ],
                    },
                  ],
                  'import-notation': null,
                }),
          },
        },
        null,
        2
      ) + '\n'
    );
  }

  updateJson(tree, 'package.json', (pkg) => {
    pkg.scripts ??= {};
    const scripts: Record<string, string> = {
      'lint:eslint': 'nx lint',
      'lint:styles': 'stylelint "src/**/*.{css,scss}"',
      lint: 'npm run lint:eslint && npm run lint:styles',
      'lint:fix': 'nx lint --fix && npm run lint:styles -- --fix',
      prettier: 'prettier --check .',
      'test:ci': 'nx test --watch=false --coverage',
    };
    const legacyDefaults: Record<string, string> = {
      lint: 'nx lint',
      'lint:fix': 'nx lint --fix',
      'test:ci':
        'nx test --watch=false --browsers=ChromeHeadless --code-coverage',
    };
    for (const [name, command] of Object.entries(scripts)) {
      if (!pkg.scripts[name] || pkg.scripts[name] === legacyDefaults[name]) {
        pkg.scripts[name] = command;
      } else if (pkg.scripts[name] !== command && name === 'lint') {
        throw new Error(
          'Existing lint script differs from the OneCX default. Integrate lint:styles before installing guardrails.'
        );
      }
    }
    return pkg;
  });
}

export function configurePreCommit(
  tree: Tree,
  templateDirectory: string,
  options = { qualityChecks: true, secrets: false }
) {
  const marker = '# OneCX generated pre-commit entrypoint';
  const hookPath = '.husky/pre-commit';
  const existingHook = tree.read(hookPath, 'utf8');
  if (!options.qualityChecks && !options.secrets) {
    if (existingHook?.includes(marker)) {
      tree.delete(hookPath);
    }
    return;
  }
  if (existingHook && !existingHook.includes(marker)) {
    throw new Error(
      'Existing .husky/pre-commit is not managed by OneCX. Integrate it manually before installing guardrails.'
    );
  }

  if (options.qualityChecks) {
    const hook = readFileSync(join(templateDirectory, 'pre-commit'));
    const provenanceFile = readFileSync(
      join(templateDirectory, 'provenance.json')
    );
    const provenance: { sha256?: string } = JSON.parse(
      provenanceFile.toString('utf8')
    );
    if (createHash('sha256').update(hook).digest('hex') !== provenance.sha256) {
      throw new Error('Packaged pre-commit template checksum does not match.');
    }
    tree.write('scripts/pre-commit-qa', hook);
    tree.write('scripts/pre-commit-qa.provenance.json', provenanceFile);
  }

  let command = '';
  if (options.secrets) {
    tree.write(
      'scripts/check-secrets.cjs',
      readFileSync(join(__dirname, 'files', 'check-secrets.cjs'))
    );
    updateJson(tree, 'package.json', (pkg) => {
      pkg.scripts ??= {};
      if (
        pkg.scripts['secrets:check'] &&
        pkg.scripts['secrets:check'] !== 'node scripts/check-secrets.cjs'
      ) {
        throw new Error(
          'Existing secrets:check script differs from the OneCX default. Integrate it before installing secret scanning.'
        );
      }
      pkg.scripts['secrets:check'] = 'node scripts/check-secrets.cjs';
      return pkg;
    });
    command = options.qualityChecks
      ? 'export EXTRA_LINT_SCRIPTS="${EXTRA_LINT_SCRIPTS:+$EXTRA_LINT_SCRIPTS }secrets:check"\n'
      : 'exec npm run secrets:check\n';
  }
  if (options.qualityChecks) {
    command += 'exec sh scripts/pre-commit-qa\n';
  }
  if (command) {
    configureHusky(tree);
    tree.write(hookPath, `#!/usr/bin/env sh\n${marker}\n${command}`, {
      mode: 0o755,
    });
  }
}

export function configureHusky(tree: Tree) {
  addDependenciesToPackageJson(tree, {}, { husky: '^9.1.7' });
  const { scripts = {} } = readJson(tree, 'package.json');
  const prepare: string | undefined = scripts.prepare;
  updateJson(tree, 'package.json', (pkg) => {
    pkg.scripts ??= {};
    pkg.scripts.prepare = !prepare
      ? 'husky'
      : prepare.split('&&').some((command) => command.trim() === 'husky')
      ? prepare
      : `${prepare} && husky`;
    return pkg;
  });
}
