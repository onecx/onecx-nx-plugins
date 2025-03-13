import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { PreCommitValidationGeneratorSchema } from './schema';
import { execSync } from 'child_process';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';

const PARAMETERS: GeneratorParameter<PreCommitValidationGeneratorSchema>[] = [
  {
    key: 'enableEslint',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt: 'Do you want to enable eslint check before committing?',
  },
  {
    key: 'enableConventionalCommits',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt:
      'Do you want to enable conventional commits check before committing?',
  },
  {
    key: 'enableDetectSecrets',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt: 'Do you want to enable detect secrets check before committing?',
  },
];

function checkHuskyInstallation() {
  try {
    execSync('npm ls husky', { stdio: 'ignore' });
  } catch {
    console.log('Installing Husky...');
    execSync('npm install --save-dev husky', { stdio: 'inherit' });
    console.log('Initializing Husky...');
    execSync('npx husky init', { stdio: 'inherit' });
  }
}

function checkLintStagedInstallation() {
  try {
    execSync('npm ls lint-staged', { stdio: 'ignore' });
  } catch {
    console.log('Installing lint-staged...');
    execSync('npm install --save-dev lint-staged', {
      stdio: 'inherit',
    });
  }
}

function checkDetectSecretsInstallation() {
  try {
    execSync('npm ls detect-secrets', { stdio: 'ignore' });
  } catch {
    console.log('Installing detect-secrets...');
    execSync('npm install --save-dev detect-secrets', { stdio: 'inherit' });
  }
}

function checkCommitlintInstallation() {
  try {
    execSync('npm ls commitlint', { stdio: 'ignore' });
  } catch {
    console.log('Installing commitlint...');
    execSync(
      'npm install --save-dev @commitlint/cli @commitlint/config-conventional',
      {
        stdio: 'inherit',
      }
    );
  }
}

export async function preCommitValidationGenerator(
  tree: Tree,
  options: PreCommitValidationGeneratorSchema
) {
  const parameters = await processParams<PreCommitValidationGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const templatePathHusky = path.join(
    __dirname,
    'files',
    'src',
    'husky-commits'
  );

  if (options.enableEslint) {
    checkHuskyInstallation();
    checkLintStagedInstallation();
    console.log('Setting up lint-staged...');
    generateFiles(
      tree,
      path.join(__dirname, 'files', 'src', 'config', 'lint-staged'),
      '.',
      {}
    );
    console.log('Lint-staged files created.');
  } else {
    console.log('Skipped lint-staged initialization.');
  }

  if (options.enableConventionalCommits) {
    checkHuskyInstallation();
    checkCommitlintInstallation();
    console.log('Setting up ConventionalCommits check...');
    generateFiles(
      tree,
      path.join(templatePathHusky, 'commit-msg'),
      '.husky',
      {}
    );
    generateFiles(
      tree,
      path.join(__dirname, 'files', 'src', 'config', 'commitlint'),
      '.',
      {}
    );
    console.log('ConventionalCommits commit-msg hook created.');
  } else {
    console.log('Skipped ConventionalCommits commit-msg hook.');
  }

  if (options.enableDetectSecrets) {
    checkHuskyInstallation();
    checkDetectSecretsInstallation();
    console.log('Setting up detect-secrets...');
    generateFiles(
      tree,
      path.join(__dirname, 'files', 'src', 'detect-secrets-plugin'),
      'scripts',
      {}
    );
    console.log('Detect secrets files created.');
  } else {
    console.log('Skipped detect-secrets initialization.');
  }

  if (options.enableEslint || options.enableDetectSecrets) {
    checkHuskyInstallation();
    console.log('Setting up pre-commit hook.');
    generateFiles(tree, path.join(templatePathHusky, 'pre-commit'), '.husky/', {
      lint: options.enableEslint,
      secrets: options.enableDetectSecrets,
    });
    console.log('pre-commit hook created.');
  } else {
    console.log('Skipped pre-commit hook.');
  }

  await formatFiles(tree);
  return () => installPackagesTask(tree);
}

export default preCommitValidationGenerator;
