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
import { SearchTestsStep } from './steps/search-tests.step';
import { ValidateFeatureModuleStep } from '../shared/steps/validate-feature-module.step';

const PARAMETERS: GeneratorParameter<DetailsGeneratorSchema>[] = [
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
    prompt: 'Provide a name for your API service (e.g. BookService): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'resource',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `${names(values.featureName).className}`;
    },
    prompt: 'Provide a name for your Resource (e.g. Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'getByIdResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Get${names(values.featureName).className}ByIdResponse`;
    },
    prompt:
      'Provide a name for your GetByIdResponse (e.g. GetBookByIdResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'editMode',
    type: 'boolean',
    required: 'interactive',
    prompt:
      'Do you want to have an Edit/Save Mode for this page?',
    showInSummary: true,
    default: false,
  },
  {
    key: 'updateRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.featureName).className}Request`;
    },
    prompt:
      'Provide a name for your update request (e.g. UpdateBookRequest): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI && values.editMode }],
  },
  {
    key: 'updateResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Update${names(values.featureName).className}Response`;
    },
    prompt:
      'Provide a name for your update response (e.g. UpdateBookResponse): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI && values.editMode }],
  },
  {
    key: 'allowDelete',
    type: 'boolean',
    required: 'interactive',
    prompt:
      'Do you want to have an Delete Button on this page?',
    showInSummary: true,
    default: false,
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

  const spinner = ora(`Adding details to ${options.featureName}`).start();
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
      serviceName: options.apiServiceName,
      editMode: options.editMode,
      allowDelete: options.allowDelete
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
  const fileName = names(options.featureName).fileName;
  const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;
  if (tree.exists(htmlSearchFilePath)) {
    generatorProcessor.addStep(new SearchHTMLStep());
    generatorProcessor.addStep(new SearchComponentStep());
    generatorProcessor.addStep(new SearchActionsStep());
    generatorProcessor.addStep(new SearchEffectsStep());
    generatorProcessor.addStep(new SearchEffectsSpecStep());
    generatorProcessor.addStep(new SearchTestsStep());
  }

  generatorProcessor.run(tree, options, spinner);

  await formatFiles(tree);
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

export default detailsGenerator;
