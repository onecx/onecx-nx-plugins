import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  installPackagesTask,
  joinPathFragments,
  names,
  readJson,
  Tree,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as ora from 'ora';
import { GeneratorProcessor } from '../shared/generator.utils';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { DetailsGeneratorSchema } from './schema';

import { FeatureModuleStep } from './steps/feature-module.step';
import { FeatureReducerStep } from './steps/feature-reducer.step';
import { FeatureRoutesStep } from './steps/feature-routes.step';
import { FeatureStateStep } from './steps/feature-state.step';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { SearchActionsStep } from './steps/search-actions.step';
import { SearchComponentStep } from './steps/search-component.step';
import { SearchEffectsStep } from './steps/search-effects.step';
import { SearchEffectsSpecStep } from './steps/search-effects.spec.step';
import { SearchHTMLStep } from './steps/search-html.step';
import { ValidateFeatureModuleStep } from '../shared/steps/validate-feature-module.step';
import { SearchComponentTestsStep } from './steps/search-component-spec.step';

const PARAMETERS: GeneratorParameter<DetailsGeneratorSchema>[] = [
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
    key: 'getResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Get${names(values.resource).className}Response`;
    },
    prompt:
      'Provide a name for the GetResourceResponse (e.g. GetBookResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'editMode',
    type: 'boolean',
    required: 'interactive',
    prompt: 'Do you want to have an Edit Mode for this page?',
    showInSummary: true,
    default: false,
  },
  {
    key: 'updateRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.resource).className}Request`;
    },
    prompt: 'Provide a name for the update request (e.g. UpdateBookRequest): ',
    showInSummary: true,
    showRules: [
      { showIf: (values) => values.customizeNamingForAPI && values.editMode },
    ],
  },
  {
    key: 'updateResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.resource).className}Response`;
    },
    prompt:
      'Provide a name for the update response (e.g. UpdateBookResponse): ',
    showInSummary: true,
    showRules: [
      { showIf: (values) => values.customizeNamingForAPI && values.editMode },
    ],
  },
  {
    key: 'allowDelete',
    type: 'boolean',
    required: 'interactive',
    prompt: 'Do you want to have a Delete Button on this page?',
    showInSummary: true,
    default: false,
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

export async function detailsGenerator(
  tree: Tree,
  options: DetailsGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams(PARAMETERS, options);
  Object.assign(options, parameters);

  const spinner = ora(`Adding detail to ${options.resource}`).start();
  const directory = '.';

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

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/ngrx'),
    `${directory}/`,
    {
      ...options,
      featureFileName: names(options.featureName).fileName,
      featurePropertyName: names(options.featureName).propertyName,
      featureClassName: names(options.featureName).className,
      featureConstantName: names(options.featureName).constantName,
      resource: options.resource,
      resourceFileName: names(options.resource).fileName,
      resourcePropertyName: names(options.resource).propertyName,
      resourceClassName: names(options.resource).className,
      resourceConstantName: names(options.resource).constantName,
      updateRequestPropertyName: names(options.updateRequestName).propertyName,
      updateResponsePropertyName: names(options.updateResponseName).propertyName,
      serviceName: options.serviceName,
      editMode: options.editMode,
      allowDelete: options.allowDelete,
    }
  );

  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new FeatureModuleStep());
  generatorProcessor.addStep(new FeatureRoutesStep());
  generatorProcessor.addStep(new FeatureStateStep());
  generatorProcessor.addStep(new FeatureReducerStep());
  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  // Optionally extend search with features to navigate to details (if search was generated beforehand)
  const featureFileName = names(options.featureName).fileName;
  const resourceFileName = names(options.resource).fileName;
  const htmlSearchFilePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.html`;
  if (tree.exists(htmlSearchFilePath)) {
    generatorProcessor.addStep(new SearchHTMLStep());
    generatorProcessor.addStep(new SearchComponentStep());
    generatorProcessor.addStep(new SearchComponentTestsStep());
    generatorProcessor.addStep(new SearchActionsStep());
    generatorProcessor.addStep(new SearchEffectsStep());
    generatorProcessor.addStep(new SearchEffectsSpecStep());
  }

  generatorProcessor.run(tree, options, spinner);

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
    let cmd = '';
    function log(command: string) {
      console.log('');
      console.log('generate detail ==> ' + command);
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

export default detailsGenerator;
