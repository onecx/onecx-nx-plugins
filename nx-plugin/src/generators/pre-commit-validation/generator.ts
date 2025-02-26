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
import { loadEnvFile } from 'process';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';

const PARAMETERS: GeneratorParameter<PreCommitValidationGeneratorSchema>[] = [
  {
    key: 'enableEslint',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt: 'Do you want to enable eslint check?',
  },
  {
    key: 'enableConventionalCommits',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt: 'Do you want to enable conventional commits check?',
  },
  {
    key: 'enableDetectSecrets',
    type: 'boolean',
    required: 'interactive',
    default: true,
    prompt: 'Do you want to enable detect secrets check?',
  },
]

function checkHuskyInstallation() {
  try {
    execSync('npx husky --version', { stdio: 'ignore' });
  } catch {
    console.log('📦 Installing Husky...');
    execSync('npm install husky --save-dev', { stdio: 'inherit' });
  }
}

  // function makeHookExecutable(hookPath: string) {
  //   if (fs.existsSync(hookPath)) {
  //     execSync(`chmod +x ${hookPath}`, { stdio: 'inherit' });
  //   }
  // }

export async function preCommitValidationGenerator(
  tree: Tree,
  options: PreCommitValidationGeneratorSchema
) {
  const parameters = await processParams<PreCommitValidationGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);
    checkHuskyInstallation();
  
    const templatePath = path.join(__dirname, 'files', 'src', '.husky');
  
    if (options.enableEslint) {
      console.log('Setting up ESLint check..')
      generateFiles(tree, path.join(templatePath, 'husky'), '.husky', { tmpl: '', filename: 'pre-commit' });
      console.log('ESLint pre-commit hook created.');
    } else {
      console.log('Skipped ESLint pre-commit hook.');
    }
  
    if (options.enableConventionalCommits) {
      console.log('Setting up ConventionalCommits check..')
      generateFiles(tree, path.join(templatePath, 'husky'), '.husky', { tmpl: '', filename: 'commit-msg' });
      console.log('ConventionalCommits pre-commit hook created.');
    } else {
      console.log('Skipped ConventionalCommits pre-commit hook.');
    }
  
    if (options.enableDetectSecrets) {
      // checkDetectSecretsInstallation()
      console.log('Setting up detect secrets check..')
      generateFiles(tree, path.join(templatePath, 'husky'), '.husky', { tmpl: '', filename: 'commit-msg' });
      console.log('detect secrets pre-commit hook created.');
    } else {
      console.log('Skipped detect secrets pre-commit hook.');
    }
  
    await formatFiles(tree);
    return () => installPackagesTask(tree);
  }
}

export default preCommitValidationGenerator;
