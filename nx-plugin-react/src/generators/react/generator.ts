import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit';
import { applicationGenerator } from '@nx/react';
import { execSync } from 'child_process';
import * as ora from 'ora';

import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { GeneratorProcessor } from '../shared/generator.utils';
import { ReactGeneratorSchema } from './schema';
import { GeneralOpenAPIStep } from './steps/general-openapi.step';
import { StylesStep } from './steps/styles.step';
import { AIStep } from './steps/ai.step';

const PARAMETERS: GeneratorParameter<ReactGeneratorSchema>[] = [
  {
    key: 'chatty',
    type: 'boolean',
    required: 'never',
    default: false,
  },
  {
    key: 'styles',
    type: 'select',
    required: 'interactive',
    prompt: 'Which CSS framework would you like to use?',
    default: 'primeflex',
    choices: ['primeflex', 'tailwind'],
  },
  {
    key: 'ai',
    type: 'boolean',
    required: 'interactive',
    prompt: 'Would you like to add AI agent configuration files?',
    default: false,
  },
];

export async function reactGenerator(
  tree: Tree,
  options: ReactGeneratorSchema
): Promise<GeneratorCallback> {
  function log(command: unknown) {
    if (options.chatty) {
      console.log('');
      console.log('generate react ==> ' + command);
    }
  }
  const parameters = await processParams<ReactGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora('Adding React').start();
  const directory = '.';

  const applicationGeneratorCallback = await applicationGenerator(tree, {
    name: options.name,
    directory: directory,
    style: 'css',
    tags: ``,
    projectNameAndRootFormat: 'as-provided',
    e2eTestRunner: 'none',
    bundler: 'vite',
    unitTestRunner: 'vitest',
    routing: false,
    linter: 'eslint',
  });

  tree.delete(`${directory}/src/app/app.tsx`);
  tree.delete(`${directory}/src/app/app.spec.tsx`);
  tree.delete(`${directory}/src/app/app.module.css`);

  tree.delete(`${directory}/src/app/nx-welcome.tsx`);

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    `${directory}/`,
    {
      ...options,
      className: names(options.name).className,
      remoteModuleName: names(options.name).className,
      remoteModuleFileName: names(options.name).fileName,
      fileName: names(options.name).fileName,
      constantName: names(options.name).constantName,
      propertyName: names(options.name).propertyName,
    }
  );

  const generatorProcessor = new GeneratorProcessor();
  generatorProcessor.addStep(new GeneralOpenAPIStep());
  generatorProcessor.addStep(new StylesStep());
  generatorProcessor.addStep(new AIStep());

  generatorProcessor.run(tree, options, spinner);

  addBaseToPackageJson(tree, options);
  addScriptsToPackageJson(tree);
  addExtensionsToPackageJson(tree);

  if (options.styles === 'tailwind') {
    addDependenciesToPackageJson(
      tree,
      {},
      {
        tailwindcss: '^4.0.0',
        '@tailwindcss/vite': '^4.0.0',
        'tailwindcss-primeui': '^0.3.0',
      }
    );
  }

  const oneCXLibVersion = '^8.2.2';
  const reactVersion = '^19.0.0';
  const nxVersion = '22.0.2';

  addDependenciesToPackageJson(
    tree,
    {
      '@onecx/accelerator': oneCXLibVersion,
      '@onecx/react-utils': oneCXLibVersion,
      '@onecx/react-remote-components': oneCXLibVersion,
      '@onecx/react-integration-interface': oneCXLibVersion,
      '@onecx/react-webcomponents': oneCXLibVersion,
      '@onecx/react-auth': oneCXLibVersion,
      '@onecx/integration-interface': oneCXLibVersion,
      react: reactVersion,
      'react-dom': reactVersion,
      'react-router': '^7.13.0',
      'react-i18next': '^17.0.8',
      i18next: '^25.8.0',
      primereact: '^10.9.7',
      primeicons: '^7.0.0',
      primeflex: '^4.0.0',
    },
    {
      '@nx/react': nxVersion,
      '@nx/vite': nxVersion,
      '@nx/devkit': nxVersion,
      '@nx/js': nxVersion,
      '@nx/web': nxVersion,
      '@nx/workspace': nxVersion,
      '@nx/plugin': nxVersion,
      '@nx/eslint': nxVersion,
      '@nx/eslint-plugin': nxVersion,
      '@openapitools/openapi-generator-cli': '^2.16.3',
      '@vitejs/plugin-react': '^4.4.0',
      '@eslint/js': '^8.57.1',
      eslint: '^9.8.0',
      'eslint-config-prettier': '^10.0.0',
      'eslint-plugin-import': '2.31.0',
      'eslint-plugin-prettier': '^5.2.1',
      'eslint-plugin-react': '^7.37.0',
      'eslint-plugin-react-hooks': '^5.0.0',
      nx: nxVersion,
      prettier: '^3.5.3',
      'sonar-scanner': '^3.1.0',
      typescript: '^5.9.0',
      vite: '^6.0.0',
      vitest: '^3.0.0',
      '@vitest/coverage-v8': '^3.0.0',
      jsdom: '^26.0.0',
      '@module-federation/vite': '^1.0.0',
      'vite-plugin-static-copy': '^2.0.0',
      '@testing-library/dom': '^10.0.0',
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/react': '^16.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@types/node': '^22.0.0',
    }
  );

  adaptTsConfig(tree);
  adaptProjectConfiguration(tree, options);

  await formatFiles(tree);

  spinner.succeed();

  return async () => {
    await applicationGeneratorCallback();
    let cmd = 'rm -rf .vscode apps libs';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });

    cmd = 'mv -f .gitignore.org .gitignore';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });

    cmd = 'npm run apigen ';
    log(cmd);
    execSync(cmd, { cwd: tree.root, stdio: 'inherit' });

    const files = tree
      .listChanges()
      .map((c) => c.path)
      .filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
      .join(' ');
    cmd = 'npx prettier --write ';
    log(cmd);
    execSync(cmd + files, { cwd: tree.root, stdio: 'inherit' });
  };
}

function addBaseToPackageJson(tree: Tree, options: ReactGeneratorSchema) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.name = 'onecx-' + names(options.name).fileName + '-ui';
    pkgJson.private = true;
    pkgJson.license = 'Apache-2.0';
    return pkgJson;
  });
}

function addExtensionsToPackageJson(tree: Tree) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.jestSonar = {
      reportPath: 'reports',
    };
    return pkgJson;
  });
}

function addScriptsToPackageJson(tree: Tree) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.scripts = pkgJson.scripts ?? {};
    pkgJson.scripts[
      'apigen'
    ] = `openapi-generator-cli generate -i src/assets/api/openapi-bff.yaml -c apigen.yaml -o src/api/generated -g typescript-fetch --type-mappings AnyType=object`;
    pkgJson.scripts['start'] = 'nx serve --host 0.0.0.0';
    pkgJson.scripts['build'] = `nx build`;
    pkgJson.scripts['clean'] =
      'npm cache clean --force && npx clear-npx-cache && rm -rf *.log dist reports .nx .eslintcache ./node_modules/.cache/prettier/.prettier-cache';
    pkgJson.scripts['format'] = 'nx format:write --uncommitted';
    pkgJson.scripts['lint'] = 'nx lint';
    pkgJson.scripts['lint:fix'] = 'nx lint --fix';
    pkgJson.scripts['sonar'] = 'npx sonar-scanner';
    pkgJson.scripts['test'] = 'nx test';
    pkgJson.scripts['test:ci'] = 'nx test --watch=false --code-coverage';
    return pkgJson;
  });
}

function adaptTsConfig(tree: Tree) {
  const filePath = 'tsconfig.app.json';

  updateJson(tree, filePath, (json) => {
    json.files = ['src/main.tsx', 'src/bootstrap.ts'];
    json.compilerOptions = json.compilerOptions ?? {};
    json.compilerOptions.jsx = 'react-jsx';
    json.compilerOptions.resolveJsonModule = true;
    return json;
  });
}

function adaptProjectConfiguration(tree: Tree, options: ReactGeneratorSchema) {
  const config = readProjectConfiguration(tree, options.name);
  config.targets['serve'].executor = '@nx/vite:dev-server';
  config.targets['serve'].options = {
    ...(config.targets['serve'].options ?? {}),
    host: '0.0.0.0',
    port: 4200,
    headers: {
      Allow: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    },
  };
  config.targets['build'].executor = '@nx/vite:build';
  config.targets['build'].options = {
    ...(config.targets['build'].options ?? {}),
    assets: [
      ...(config.targets['build'].options?.assets ?? []),
      {
        glob: '**/*',
        input: './node_modules/@onecx/react-utils/assets/',
        output: '/onecx-react-utils/assets/',
      },
    ],
  };
  config.targets['build'].configurations = {
    ...(config.targets['build'].configurations ?? {}),
    production: {
      ...(config.targets['build'].configurations?.production ?? {}),
      fileReplacements: [
        ...(config.targets['build'].configurations?.production
          ?.fileReplacements ?? []),
        {
          replace: 'src/environments/environment.ts',
          with: 'src/environments/environment.prod.ts',
        },
      ],
    },
  };
  config.targets['test'].executor = '@nx/vite:test';
  updateProjectConfiguration(tree, names(options.name).fileName, config);
}

export default reactGenerator;
