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


export async function angularGenerator(
  tree: Tree,
  options: AngularGeneratorSchema
): Promise<GeneratorCallback> {
  const spinner = ora('Adding angular').start();
  const directory = '.';

  //This is forcing angular 15. An easier way would be to downgrade nx to the correct version
  //(15.9.7) but this is not working because of a bug in this nx version
  addDependenciesToPackageJson(
    tree,
    { '@angular/core': '^15.2.7' },
    { '@angular-devkit/build-angular': '^15.2.7', typescript: '~4.9.4' }
  );

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
      remoteModuleName: names(options.name).className,
      remoteModuleFileName: names(options.name).fileName,
      fileName: names(options.name).fileName,
      constantName: names(options.name).constantName,
      propertyName: names(options.name).propertyName,
    }
  );
  const oneCXLibVersion = '^4.9.0';
  addDependenciesToPackageJson(
    tree,
    {
      primeflex: '^3.3.0',
      primeicons: '^6.0.1',
      primeng: '15.2.1', // 15.2.1 is the last version where the tests are running!!!
      '@onecx/keycloak-auth': oneCXLibVersion,
      '@onecx/portal-integration-angular': oneCXLibVersion,
      '@onecx/portal-layout-styles': oneCXLibVersion,
      '@onecx/accelerator': oneCXLibVersion,
      '@onecx/integration-interface': oneCXLibVersion,
      '@ngx-translate/core': '^14.0.0',
      '@ngx-translate/http-loader': '^7.0.0',
      '@angular-architects/module-federation': '^15.0.0',
    },
    {
      '@openapitools/openapi-generator-cli': '^2.5.2',
      'ngx-translate-testing': '^6.1.0',
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

    return pkgJson;
  });
}

function adaptTsConfig(tree: Tree, options: AngularGeneratorSchema) {
  const fileName = names(options.name).fileName;
  const filePath = 'tsconfig.app.json';

  let fileContent = tree.read(filePath, 'utf8');

  fileContent = fileContent.replace(
    '"files": [',
    `"files": [
    "src/app/${fileName}-app.remote.module.ts",
    "src/polyfills.ts",
  `
  );
  tree.write(filePath, fileContent);
}

function adaptProjectConfiguration(
  tree: Tree,
  options: AngularGeneratorSchema
) {
  const config = readProjectConfiguration(tree, names(options.name).fileName);
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

  let fileContent = tree.read(filePath, 'utf8');

  fileContent = fileContent.replace(
    /transformIgnorePatterns: .+?,/,
    `transformIgnorePatterns: ['node_modules/(?!@ngrx|(?!deck.gl)|d3-scale|(?!.*\\.mjs$))'],`
  );
  tree.write(filePath, fileContent);
}

function adaptAngularPrefixConfig(tree: Tree) {
  updateJson(tree, '.eslintrc.json', (json) => {
    const override = json['overrides'].find(
      (o) => !!o.rules['@angular-eslint/directive-selector']
    );
    override.rules['@angular-eslint/directive-selector'][1].prefix = 'app';
    override.rules['@angular-eslint/component-selector'][1].prefix = 'app';
    return json;
  });
  updateJson(tree, 'project.json', (json) => {
    json.prefix = 'app';
    return json;
  });
}

export default angularGenerator;
