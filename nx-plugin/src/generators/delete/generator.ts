import {
  formatFiles,
  GeneratorCallback,
  installPackagesTask,
  names,
  readJson,
  Tree,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as ora from 'ora';

import { GeneratorProcessor } from '../shared/generator.utils';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { DeleteGeneratorSchema } from './schema';
import { FeatureModuleStep } from './steps/feature-module.step';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { SearchActionsStep } from './steps/search-actions.step';
import { SearchComponentStep } from './steps/search-component.step';
import { SearchEffectsStep } from './steps/search-effects.step';
import { SearchEffectsSpecStep } from './steps/search-effects.spec.step';
import { SearchHTMLStep } from './steps/search-html.step';
import { SearchTestsStep } from './steps/search-tests.step';
import { ValidateFeatureModuleStep } from '../shared/steps/validate-feature-module.step';

const PARAMETERS: GeneratorParameter<DeleteGeneratorSchema>[] = [
  {
    key: 'customizeNamingForAPI',
    type: 'boolean',
    required: 'interactive',
    default: false,
    prompt: 'Do you want to customize the names for the generated API?',
  },
  {
    key: 'resource',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for the Resource (e.g. Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'serviceName',
    type: 'text',
    required: 'never',
    default: (values) => GeneratorProcessor.getServiceName(`${names(values.resource).className}`),
  },
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function deleteGenerator(
  tree: Tree,
  options: DeleteGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<DeleteGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding delete to ${options.resource}`).start();

  const isNgRx = !!Object.keys(
    readJson(tree, 'package.json').dependencies
  ).find((k) => k.includes('@ngrx/'));
  if (!isNgRx) {
    spinner.fail('Currently only NgRx projects are supported.');
    throw new Error('Currently only NgRx projects are supported.');
  }

  const validator = await GeneratorProcessor.runBatch(
    tree,
    options,
    [new ValidateFeatureModuleStep()],
    spinner,
    true
  );
  if (validator.hasStoppedExecution()) {
    return () => {
      // Intentionally left blank
    };
  }

  const generatorProcessor = new GeneratorProcessor();

  generatorProcessor.addStep(new FeatureModuleStep());
  generatorProcessor.addStep(new SearchActionsStep());
  generatorProcessor.addStep(new SearchComponentStep());
  generatorProcessor.addStep(new SearchEffectsStep());
  generatorProcessor.addStep(new SearchEffectsSpecStep());
  generatorProcessor.addStep(new SearchHTMLStep());
  generatorProcessor.addStep(new SearchTestsStep());

  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  generatorProcessor.run(tree, options, spinner);

  await formatFiles(tree);

  spinner.succeed();

  return () => {
    installPackagesTask(tree);
    let cmd = '';
    function log(command: string) {
      console.log('');
      console.log('generate delete ==> ' + command);
    }
    cmd = 'npm run apigen ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts'))
      .join(' ');
    cmd = 'npx --yes organize-imports-cli ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
    cmd = 'npx prettier --write ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
  };
}

export default deleteGenerator;
