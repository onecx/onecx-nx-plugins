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
import { PageGeneratorSchema } from './schema';
import { FeatureModuleStep } from './steps/feature-module.step';
import { FeatureReducerStep } from './steps/feature-reducer.step';
import { FeatureRoutesStep } from './steps/feature-routes.step';
import { FeatureStateStep } from './steps/feature-state.step';
import { GeneralPermissionsStep } from './steps/general-permissions.step';
import { GeneralTranslationsStep } from './steps/general-translations.step';
import { ValidateFeatureModuleStep } from '../shared/steps/validate-feature-module.step';

const PARAMETERS: GeneratorParameter<PageGeneratorSchema>[] = [
  {
    key: 'pageName',
    type: 'text',
    required: 'always',
    default: 'Page',
    prompt: 'Provide a name for your page (e.g., "Book" for BookComponent): ',
    showInSummary: true,
  },
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function componentGenerator(
  tree: Tree,
  options: PageGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<PageGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding page to ${options.featureName}`).start();
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
      pageConstantName: names(options.pageName).constantName,
      pageClassName: names(options.pageName).className,
      pagePropertyName: names(options.pageName).propertyName,
      pageFileName: names(options.pageName).fileName,
      pageName: options.pageName,
      standalone: options.standalone,
    }
  );

  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new FeatureModuleStep());
  generatorProcessor.addStep(new FeatureRoutesStep());
  generatorProcessor.addStep(new FeatureStateStep());
  generatorProcessor.addStep(new FeatureReducerStep());
  generatorProcessor.addStep(new GeneralTranslationsStep());
  generatorProcessor.addStep(new GeneralPermissionsStep());

  generatorProcessor.run(tree, options, spinner);

  await formatFiles(tree);

  spinner.succeed();

  return () => {
    installPackagesTask(tree);
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

export default componentGenerator;
