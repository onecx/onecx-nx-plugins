import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  installPackagesTask,
  joinPathFragments,
  names,
  readJson,
  Tree
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as ora from 'ora';

import { GeneratorProcessor } from '../shared/generator.utils';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { CreateUpdateGeneratorSchema } from './schema';
import { FeatureModuleStep } from './steps/feature-module.step';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { SearchActionsStep } from './steps/search-actions.step';
import { SearchComponentStep } from './steps/search-component.step';
import { SearchEffectsStep } from './steps/search-effects.step';
import { SearchHTMLStep } from './steps/search-html.step';
import { SearchTestsStep } from './steps/search-tests.step';

const PARAMETERS: GeneratorParameter<CreateUpdateGeneratorSchema>[] = [
  {
    key: 'customizeNamingForAPI',
    type: 'boolean',
    required: 'interactive',
    default: false,
    prompt: 'Do you want to customize the names for the generated API?',
  },
  {
    key: 'apiServiceName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}BffService`;
    },
    prompt: 'Provide a name for your API service (e.g., BookBffService): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'dataObjectName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for your Data Object (e.g., Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'createRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Create${names(values.featureName).className}Request`;
    },
    prompt: 'Provide a name for your create request (e.g., CreateBookRequest): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'createResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Create${names(values.featureName).className}Response`;
    },
    prompt:
      'Provide a name for your create response (e.g., CreateBookResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'updateRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.featureName).className}Request`;
    },
    prompt: 'Provide a name for your update request (e.g., UpdateBookRequest): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'updateResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.featureName).className}Response`;
    },
    prompt:
      'Provide a name for your update response (e.g., UpdateBookResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function createUpdateGenerator(
  tree: Tree,
  options: CreateUpdateGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<CreateUpdateGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding create/update to ${options.featureName}`).start();
  const directory = '.';

  const isNgRx = !!Object.keys(
    readJson(tree, 'package.json').dependencies
  ).find((k) => k.includes('@ngrx/'));
  if (!isNgRx) {
    spinner.fail('Currently only NgRx projects are supported.');
    throw new Error('Currently only NgRx projects are supported.');
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
      dataObjectName: options.dataObjectName,
      serviceName: options.apiServiceName,
      createRequestName: options.createRequestName,
      createResponseName: options.createResponseName,
      updateRequestName: options.updateRequestName,
      updateResponseName: options.updateResponseName,
    }
  );

  const generatorProcessor = new GeneratorProcessor();

  generatorProcessor.addStep(new FeatureModuleStep());
  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  const fileName = names(options.featureName).fileName;
  const htmlDetailsFilePath = `src/app/${fileName}/pages/${fileName}-search/dialogs/${fileName}-create-update/${fileName}-create-update.component.html`;
  if (tree.exists(htmlDetailsFilePath)) {
    generatorProcessor.addStep(new SearchActionsStep());
    generatorProcessor.addStep(new SearchEffectsStep());
    generatorProcessor.addStep(new SearchComponentStep());
    generatorProcessor.addStep(new SearchHTMLStep());
    generatorProcessor.addStep(new SearchTestsStep());
  }
  generatorProcessor.run(tree, options, spinner);

  await formatFiles(tree);

  spinner.succeed();

  return () => {
    installPackagesTask(tree);
    execSync('npm run apigen', {
      cwd: tree.root,
      stdio: 'inherit',
    });
    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts'))
      .join(' ');
    execSync('npx organize-imports-cli ' + files, {
      cwd: tree.root,
      stdio: 'inherit',
    });
    execSync('npx prettier --write ' + files, {
      cwd: tree.root,
      stdio: 'inherit',
    });
  };
}

export default createUpdateGenerator;
