import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  installPackagesTask,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit';
import { applicationGenerator, E2eTestRunner } from '@nx/angular/generators';
import { AngularGeneratorSchema } from './schema';
import { execSync } from 'child_process';

import * as ora from 'ora';
import processParams, { GeneratorParameter } from '../shared/parameters.utils';
import { safeReplace } from '../shared/safeReplace';

const PARAMETERS: GeneratorParameter<AngularGeneratorSchema>[] = [
  {
    key: 'standalone',
    type: 'boolean',
    required: 'never',
    default: false,
  },
];

export async function angularGenerator(
  tree: Tree,
  options: AngularGeneratorSchema
): Promise<GeneratorCallback> {
  const parameters = await processParams<AngularGeneratorSchema>(
    PARAMETERS,
    options
  );
  Object.assign(options, parameters);

  const spinner = ora('Adding angular').start();
  const directory = '.';

  const applicationGeneratorCallback = await applicationGenerator(tree, {
    name: options.name,
    directory: directory,
    style: 'scss',
    tags: ``,
    routing: false,
    projectNameAndRootFormat: 'as-provided',
    e2eTestRunner: E2eTestRunner.None,
  });

  tree.delete(`${directory}/src/app/nx-welcome.component.ts`);
  tree.delete(`${directory}/src/app/app.config.ts`);
  tree.delete(`${directory}/src/assets/.gitkeep`);

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
      standalone: options.standalone,
    }
  );

  // If standalone, remove unwanted files
  if (options.standalone) {
    tree.delete(`${directory}/scripts/load-permissions.sh`);
  }

  const oneCXLibVersion = '^5.47.0';
  addDependenciesToPackageJson(
    tree,
    {
      primeflex: '^3.3.1',
      primeicons: '^7.0.0',
      primeng: '^17.18.8',
      '@onecx/accelerator': oneCXLibVersion,
      '@onecx/angular-accelerator': oneCXLibVersion,
      '@onecx/angular-auth': oneCXLibVersion,
      '@onecx/angular-remote-components': oneCXLibVersion,
      '@onecx/angular-webcomponents': oneCXLibVersion,
      '@onecx/integration-interface': oneCXLibVersion,
      '@onecx/angular-integration-interface': oneCXLibVersion,
      '@onecx/ngrx-accelerator': oneCXLibVersion,
      '@onecx/keycloak-auth': oneCXLibVersion,
      '@onecx/portal-integration-angular': oneCXLibVersion,
      '@onecx/portal-layout-styles': oneCXLibVersion,
      '@ngx-translate/core': '^15.0.0',
      '@ngx-translate/http-loader': '^8.0.0',
      '@angular-architects/module-federation': '^18.0.4',
      'keycloak-angular': '^16.0.1',
      'ngrx-store-localstorage': '^18.0.0',
      '@angular/animations': '^18.1.4',
      '@angular/cdk': '^18.1.4',
      '@angular/common': '^18.1.4',
      '@angular/compiler': '^18.1.4',
      '@angular/core': '^18.1.4',
      '@angular/elements': '^18.1.4',
      '@angular/forms': '^18.1.4',
      '@angular/platform-browser': '^18.1.4',
      '@angular/platform-browser-dynamic': '^18.1.4',
      '@angular/router': '^18.1.4',
      '@ngrx/component': '^18.0.2',
      '@ngrx/effects': '^18.0.2',
      '@ngrx/router-store': '^18.0.2',
      '@ngrx/store': '^18.0.2',
      '@ngrx/store-devtools': '^18.0.2',
      '@nx/angular': '^19.8.14',
      '@nx/devkit': '^19.8.14',
      '@nx/plugin': '^19.8.14',
      '@webcomponents/webcomponentsjs': '^2.8.0',
    },
    {
      '@openapitools/openapi-generator-cli': '^2.5.2',
      'ngx-translate-testing': '^7.0.0',
      '@angular-devkit/build-angular': '^18.1.4',
      '@angular-devkit/core': '^18.1.4',
      '@angular-devkit/schematics': '^18.1.4',
      '@angular/cli': '~18.1.4',
      '@angular/compiler-cli': '^18.1.4',
      '@angular/language-service': '^18.1.4',
      typescript: '~5.5.4',
      jest: '^29.7.0',
      'jest-environment-jsdom': '^29.7.0',
      'jest-preset-angular': '~14.2.2',
      webpack: '5.94.0',
    }
  );

  addScriptsToPackageJson(tree, options);

  adaptTsConfig(tree, options);

  adaptProjectConfiguration(tree, options);

  adaptJestConfig(tree);

  adaptAngularPrefixConfig(tree);

  await formatFiles(tree);

  spinner.succeed();

  return async () => {
    await applicationGeneratorCallback();

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
    installPackagesTask(tree, true);
  };
}

function addScriptsToPackageJson(tree: Tree, options: AngularGeneratorSchema) {
  updateJson(tree, 'package.json', (pkgJson) => {
    pkgJson.name = names(options.name).fileName;
    pkgJson.scripts = pkgJson.scripts ?? {};
    pkgJson.scripts[
      'apigen'
    ] = `openapi-generator-cli generate -i src/assets/swagger/${options['name']}-bff.yaml -c apigen.yaml -o src/app/shared/generated -g typescript-angular --type-mappings AnyType=object`;
    pkgJson.scripts['start'] = 'nx serve';
    pkgJson.scripts['build'] = 'nx build';
    pkgJson.scripts['format'] = 'nx format:write --uncommitted';
    pkgJson.scripts['lint'] = 'nx lint';
    pkgJson.scripts['lint:fix'] = 'nx lint --fix';
    pkgJson.scripts['test'] = 'nx test';
    pkgJson.scripts['test:ci'] =
      'nx test --watch=false --browsers=ChromeHeadless --code-coverage';

    return pkgJson;
  });
}

function adaptTsConfig(tree: Tree, options: AngularGeneratorSchema) {
  const fileName = names(options.name).fileName;
  const filePath = 'tsconfig.app.json';
  const find = ['"files": [', '"compilerOptions": {'];
  const replaceWith = [
    `"files": [
    "src/app/${fileName}-app.remote.module.ts",
    "src/polyfills.ts",
  `,
    `"compilerOptions": {
    "useDefineForClassFields": false,
  `,
  ];

  safeReplace(
    'Adapt files and compilerOptions Typescript Config',
    filePath,
    find,
    replaceWith,
    tree
  );
}

function adaptProjectConfiguration(
  tree: Tree,
  options: AngularGeneratorSchema
) {
  const config = readProjectConfiguration(tree, options.name);
  config.targets['serve'].executor = '@nx/angular:dev-server';
  config.targets['serve'].options = {
    ...(config.targets['serve'].options ?? {}),
    disableHostCheck: true,
    publicHost: 'http://localhost:4200',
    proxyConfig: 'proxy.conf.js',
  };
  config.targets['build'].executor = '@nx/angular:webpack-browser';
  config.targets['build'].options = {
    ...(config.targets['build'].options ?? {}),
    polyfills: 'src/polyfills.ts',
    assets: [
      ...(config.targets['build'].options.assets ?? []),
      {
        glob: '**/*',
        input: './node_modules/@onecx/portal-integration-angular/assets/',
        output: '/onecx-portal-lib/assets/',
      },
    ],
    styles: [
      ...(config.targets['build'].options.styles ?? []),
      'node_modules/primeicons/primeicons.css',
      'node_modules/primeng/resources/primeng.min.css',
      'node_modules/@onecx/portal-integration-angular/assets/output.css',
    ],
    customWebpackConfig: {
      path: 'webpack.config.js',
    },
  };
  config.targets['build'].configurations = {
    ...(config.targets['build'].configurations ?? {}),
    production: {
      ...(config.targets['build'].configurations.production ?? {}),
      fileReplacements: [
        ...(config.targets['build'].configurations.production
          .fileReplacements ?? []),
        {
          replace: 'src/environments/environment.ts',
          with: 'src/environments/environment.prod.ts',
        },
      ],
      customWebpackConfig: {
        path: 'webpack.prod.config.js',
      },
    },
  };
  updateProjectConfiguration(tree, names(options.name).fileName, config);
}

function adaptJestConfig(tree: Tree) {
  const filePath = 'jest.config.ts';
  safeReplace(
    'Adapt transformIgnorePatterns in Jest Config',
    filePath,
    /transformIgnorePatterns: .+?,/,
    `transformIgnorePatterns: ['node_modules/(?!@ngrx|(?!deck.gl)|d3-scale|(?!.*\\.mjs$))'],`,
    tree
  );
}

function adaptAngularPrefixConfig(tree: Tree) {
  if (tree.exists('.eslintrc.json')) {
    updateJson(tree, '.eslintrc.json', (json) => {
      const override = json['overrides'].find(
        (o) => !!o.rules['@angular-eslint/directive-selector']
      );
      override.rules['@angular-eslint/directive-selector'][1].prefix = 'app';
      override.rules['@angular-eslint/component-selector'][1].prefix = 'app';
      return json;
    });
  }
  updateJson(tree, 'project.json', (json) => {
    json.prefix = 'app';
    json.targets.test.options.coverage = true;
    json.targets.build.options.main = json.targets.build.options.browser;
    json.targets.build.options.assets = [
      'src/favicon.ico',
      'src/assets',
      ...json.targets.build.options.assets,
    ];
    delete json.targets.build.options.browser;
    json.targets.build.options.scripts = [
      'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js',
    ];
    return json;
  });
}

export default angularGenerator;
