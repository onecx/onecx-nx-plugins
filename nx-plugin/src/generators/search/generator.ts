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
import { SearchActionsStep } from '../details/steps/search-actions.step';
import { SearchComponentStep } from '../details/steps/search-component.step';
import { SearchEffectsStep } from '../details/steps/search-effects.step';
import { SearchHTMLStep } from '../details/steps/search-html.step';
import { SearchTestsStep } from '../details/steps/search-tests.step';
import { GeneratorProcessor } from '../shared/generator.utils';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { SearchGeneratorSchema } from './schema';
import { AppModuleStep } from './steps/app-module.step';
import { AppReducerStep } from './steps/app-reducer.step';
import { FeatureModuleStep } from './steps/feature-module.step';
import { FeatureReducerStep } from './steps/feature-reducer.step';
import { FeatureRoutesStep } from './steps/feature-routes.step';
import { FeatureStateStep } from './steps/feature-state.step';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneralPermissionsStep } from './steps/general-permissions.step';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { ValidateFeatureModuleStep } from '../shared/steps/validate-feature-module.step';

const PARAMETERS: GeneratorParameter<SearchGeneratorSchema>[] = [
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
    prompt: 'Provide a name for your Resource (e.g., Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'searchRequestName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Search${names(values.featureName).className}Request`;
    },
    prompt:
      'Provide a name for your Search Request (e.g., SearchBookRequest): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
  {
    key: 'searchResponseName',
    type: 'text',
    required: 'interactive',
    default: (values) => {
      return `Search${names(values.featureName).className}Response`;
    },
    prompt:
      'Provide a name for your Search Response (e.g., SearchBookResponse): ',
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

export async function searchGenerator(
  tree: Tree,
  options: SearchGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<SearchGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding search to ${options.featureName}`).start();
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
      dataObjectName: options.dataObjectName,
      serviceName: options.apiServiceName,
      searchRequestName: options.searchRequestName,
      searchResponseName: options.searchResponseName,
      standalone: options.standalone,
    }
  );

  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new AppModuleStep());
  generatorProcessor.addStep(new AppReducerStep());
  generatorProcessor.addStep(new FeatureModuleStep());
  generatorProcessor.addStep(new FeatureRoutesStep());
  generatorProcessor.addStep(new FeatureStateStep());
  generatorProcessor.addStep(new FeatureReducerStep());
  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());
  generatorProcessor.addStep(new GeneralPermissionsStep());

  // Optionally extend search with features to navigate to details (if details were generated beforehand)
  const fileName = names(options.featureName).fileName;
  const htmlDetailsFilePath = `src/app/${fileName}/pages/${fileName}-details/${fileName}-details.component.html`;
  if (tree.exists(htmlDetailsFilePath)) {
    generatorProcessor.addStep(new SearchHTMLStep());
    generatorProcessor.addStep(new SearchComponentStep());
    generatorProcessor.addStep(new SearchActionsStep());
    generatorProcessor.addStep(new SearchEffectsStep());
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

export default searchGenerator;
