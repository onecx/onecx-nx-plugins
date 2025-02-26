import {
  addProjectConfiguration,
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
    prompt: 'Do you want to enable conventional commits check before committing?',
  },
  {
    key: 'enableDetectSecrets',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt: 'Do you want to enable detect secrets check before committing?',
  },
]

function checkHuskyInstallation() {
  try {
    execSync('npm ls husky', { stdio: 'ignore' });
  } catch {
    console.log('Installing Husky...');
    execSync('npm install husky --save-dev', { stdio: 'inherit' });
  }
}

function checkDetectSecretsInstallation() {
  try {
    execSync('npm ls detect-secrets', { stdio: 'ignore' });
  } catch {
    console.log('Installing detect-secrets...');
    execSync('npm install detect-secrets --save-dev', { stdio: 'inherit' });
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
    
    const templatePathHusky = path.join(__dirname, 'files', 'src', 'husky-commits');
  
    if (options.enableEslint) {
      checkHuskyInstallation();
      console.log('Setting up ESLint check..')
      generateFiles(tree, path.join(templatePathHusky, 'eslint'), '.husky', { tmpl: '', filename: 'pre-commit' });
      console.log('ESLint pre-commit hook created.');
    } else {
      console.log('Skipped ESLint pre-commit hook.');
    }
  
    if (options.enableConventionalCommits) {
      checkHuskyInstallation();
      console.log('Setting up ConventionalCommits check..')
      generateFiles(tree, path.join(templatePathHusky, 'conventional-commits'), '.husky', { tmpl: '', filename: 'commit-msg' });
      console.log('ConventionalCommits pre-commit hook created.');
    } else {
      console.log('Skipped ConventionalCommits pre-commit hook.');
    }
  
    if (options.enableDetectSecrets) {
      checkHuskyInstallation();
      checkDetectSecretsInstallation()
      console.log('Setting up detect secrets check..')
      generateFiles(tree, path.join(__dirname, 'files', 'src', 'detect-secrets'), '.husky', { tmpl: '', filename: 'pre-commit' });
      generateFiles(tree, path.join(__dirname, 'files', 'src', 'detect-secrets-plugin'), 'scripts', { tmpl: '', filename: 'detect-secrets-plugin.ts' });
      console.log('Detect secrets pre-commit hook created.');
    } else {
      console.log('Skipped detect secrets pre-commit hook.');
    }
  
    await formatFiles(tree);
    return () => installPackagesTask(tree);
  }

export default preCommitValidationGenerator;
