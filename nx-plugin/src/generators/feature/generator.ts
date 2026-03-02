import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  readJson,
  Tree,
} from '@nx/devkit';
import { FeatureGeneratorSchema } from './schema';
import * as ora from 'ora';
import { execSync } from 'child_process';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { safeReplace } from '../shared/safeReplace';
import { GeneralPermissionStep } from './steps/general-helm-values.step';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneratorProcessor } from '../shared/generator.utils';

const PARAMETERS: GeneratorParameter<FeatureGeneratorSchema>[] = [
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
      return `${names(values.name).className}`;
    },
    prompt: 'Provide a name for your Resource (e.g. Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
];

export async function featureGenerator(
  tree: Tree,
  options: FeatureGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<FeatureGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding feature ${options.name}\n`).start();
  const directory = '.';

  const isNgRx = !!Object.keys(
    readJson(tree, 'package.json').dependencies
  ).find((k) => k.includes('@ngrx/'));
  if (!isNgRx) {
    spinner.fail('Currently only NgRx projects are supported.');
    throw new Error('Currently only NgRx projects are supported.');
  }

  const projectConfig = tree.read('project.json');
  let workspaceName = '';
  if (projectConfig) {
    const projectJson = JSON.parse(projectConfig.toString());
    workspaceName = projectJson.name; // or the relevant property
  }

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/ngrx'),
    `${directory}/`,
    {
      ...options,
      workspaceName: workspaceName,
      featureFileName: names(options.name).fileName,
      featureClassName: names(options.name).className,
      featurePropertyName: names(options.name).propertyName,
      standalone: options.standalone,
    }
  );
  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new GeneralPermissionStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  generatorProcessor.run(tree, options, spinner);

  adaptAppRoutingModule(tree, options);

  await formatFiles(tree);

  spinner.succeed();
  return () => {
    let cmd = '';
    function log(command: string) {
      console.log('');
      console.log('generate feature ==> ' + command);
    }
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

function adaptAppRoutingModule(tree: Tree, options: FeatureGeneratorSchema) {
  const fileName = names(options.name).fileName;
  const className = names(options.name).className;
  const moduleFilePath = 'src/app/app-routing.module.ts';
  const find = [/^/, 'routes: Routes = ['];
  const replaceWith = [
    `import { startsWith } from '@onecx/angular-webcomponents';`,
    `routes: Routes = [ {
    // Adjust the matcher to match the feature route.
    // If you only have one feature, you can use '' for simplification.
    matcher: startsWith('${fileName}'),
    loadChildren: () =>
      import('./${fileName}/${fileName}.module').then(
        (mod) => mod.${className}Module
      ),
  },`,
  ];
  safeReplace(
    `Update AppRoutingModule to add a new route for the ${className}Module using startsWith matcher, dynamically load the module, and extend import statements to include necessary dependencies`,
    moduleFilePath,
    find,
    replaceWith,
    tree
  );
}

export default featureGenerator;
