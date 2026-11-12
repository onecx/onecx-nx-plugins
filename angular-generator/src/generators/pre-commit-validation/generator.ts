import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { PreCommitValidationGeneratorSchema } from './schema';
import {
  configureHusky,
  configurePreCommit,
  configureQualityChecks,
} from '@onecx/generator-utils';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';

const PARAMETERS: GeneratorParameter<PreCommitValidationGeneratorSchema>[] = [
  {
    key: 'enableEslint',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt: 'Do you want to enable quality checks before committing?',
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

export async function preCommitValidationGenerator(
  tree: Tree,
  options: PreCommitValidationGeneratorSchema
) {
  options.enableEslint ??= options.enableEslintCheck;
  options.enableConventionalCommits ??= options.enableConventionalCommitsCheck;
  options.enableDetectSecrets ??= options.enableDetectSecretsCheck;
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
    configureQualityChecks(tree, 'angular');
  }

  if (options.enableConventionalCommits) {
    configureHusky(tree);
    addDependenciesToPackageJson(
      tree,
      {},
      {
        '@commitlint/cli': '^19.0.0',
        '@commitlint/config-conventional': '^19.0.0',
      }
    );
    console.log('Setting up ConventionalCommits check...');
    generateFiles(
      tree,
      path.join(templatePathHusky, 'commit-msg'),
      '.husky',
      {}
    );
    tree.changePermissions('.husky/commit-msg', 0o755);
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

  configurePreCommit(tree, path.join(__dirname, 'files-upstream'), {
    qualityChecks: options.enableEslint ?? true,
    secrets: options.enableDetectSecrets ?? true,
  });

  await formatFiles(tree);
  return () => installPackagesTask(tree);
}

export default preCommitValidationGenerator;
