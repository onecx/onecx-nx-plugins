import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  readJson,
  Tree,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as ora from 'ora';

import { GeneratorProcessor } from '../../shared/generator.utils';
import processParams, {
  GeneratorParameter,
} from '../../shared/parameters.utils';
import { safeReplace } from '../../shared/safeReplace';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { GeneralPermissionStep } from './steps/general-helm-values.step';

import { ReactFeatureGeneratorSchema } from './schema';

const PARAMETERS: GeneratorParameter<ReactFeatureGeneratorSchema>[] = [
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
    prompt:
      'Provide a name for the resource/entity managed by the feature (e.g. Book): ',
    showInSummary: true,
    showRules: [{ showIf: (values) => values.customizeNamingForAPI }],
  },
];

export async function featureGenerator(
  tree: Tree,
  options: ReactFeatureGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<ReactFeatureGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora(`Adding React feature ${options.name}`).start();

  const isReact = !!Object.keys(
    readJson(tree, 'package.json').dependencies
  ).find((k) => k.includes('react'));
  if (!isReact) {
    spinner.fail('Currently only React projects are supported.');
    throw new Error('Currently only React projects are supported.');
  }

  const projectConfig = tree.read('project.json');
  let workspaceName = '';
  if (projectConfig) {
    const projectJson = JSON.parse(projectConfig.toString());
    workspaceName = projectJson.name;
  }

  generateFiles(tree, joinPathFragments(__dirname, './files/react'), './', {
    ...options,
    workspaceName: workspaceName,
    featureFileName: names(options.name).fileName,
    featureClassName: names(options.name).className,
    featurePropertyName: names(options.name).propertyName,
  });

  const generatorProcessor =
    new GeneratorProcessor<ReactFeatureGeneratorSchema>();
  generatorProcessor.addStep(new GeneralPermissionStep());
  generatorProcessor.addStep(new GeneralOpenAPIStep());

  generatorProcessor.run(tree, options, spinner);

  adaptAppRouting(tree, options);

  await formatFiles(tree);

  spinner.succeed();
  return () => {
    let cmd = '';
    function log(command: string) {
      console.log('');
      console.log('generate feature ==> ' + command);
    }

    cmd = 'npm run apigen ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });
    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
      .join(' ');

    cmd = 'npx --yes organize-imports-cli ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
    cmd = 'npx prettier --write ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
  };
}

function adaptAppRouting(tree: Tree, options: ReactFeatureGeneratorSchema) {
  const fileName = names(options.name).fileName;
  const className = names(options.name).className;
  const candidateRouteFiles = [
    'src/routes.tsx',
    'src/router.tsx',
    'src/app/routes.tsx',
    'src/app/router.tsx',
  ].filter((p) => tree.exists(p));

  if (candidateRouteFiles.length === 0) {
    console.warn(
      'No React route file found. Expected one of: src/routes.tsx, src/router.tsx, src/app/routes.tsx, src/app/router.tsx, src/main.tsx, src/App.tsx. Skipping routing adaptation.'
    );
    return;
  }
  const routingFilePath = candidateRouteFiles[0];

  safeReplace(
    'extend react import',
    routingFilePath,
    'import { useMemo } from "react";',
    'import { useMemo, lazy } from "react";',
    tree
  );
  safeReplace(
    `add ${className} lazy feature`,
    routingFilePath,
    'import "./i18n/config";',
    `import "./i18n/config";
const ${className}Feature = lazy(() => import('./app/${fileName}'));`,
    tree
  );

  safeReplace(
    `add route ${className}`,
    routingFilePath,
    '    ];',
    `    {
      path: \`\${href}/${fileName}\`,
      element: <${className}Feature />,
      handle: {},
    },
    ];`,
    tree
  );
}

export default featureGenerator;
