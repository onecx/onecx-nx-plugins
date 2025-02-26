import {
  GeneratorCallback,
  Tree,
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  names,
} from '@nx/devkit';

import { execSync } from 'child_process';
import * as ora from 'ora';
import angularGenerator from '../angular/generator';
import { safeReplace } from '../shared/safeReplace';
import { NgrxGeneratorSchema } from './schema';

export async function ngrxGenerator(
  tree: Tree,
  options: NgrxGeneratorSchema
): Promise<GeneratorCallback> {
  const directory = '.';
  let angularGeneratorCallback;
  if (!options.skipInitAngular) {
    angularGeneratorCallback = await angularGenerator(tree, options);
  }

  const spinner = ora('Adding NgRx').start();
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    `${directory}/`,
    {
      ...options,
      remoteModuleName: names(options.name)['className'],
      lowerCamelCaseName: names(options.name)['propertyName'],
    }
  );

  addDependenciesToPackageJson(
    tree,
    {
      '@ngrx/effects': '^15.4.0',
      '@ngrx/router-store': '^15.4.0',
      '@ngrx/store': '^15.4.0',
      '@ngrx/component': '^15.4.0',
      '@ngrx/store-devtools': '^15.3.0',
      zod: '^3.22.1',
    },
    {}
  );

  addModulesToAppModule(tree);

  await formatFiles(tree);

  spinner.succeed();

  return async () => {
    if (angularGeneratorCallback) {
      await angularGeneratorCallback();
    }

    installPackagesTask(tree, true);

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

function addModulesToAppModule(tree: Tree) {
  addImportsToAppModule(tree);
  safeReplace(`Ngrx Generator add modules in app.module.ts`,'src/app/app.module.ts','AppRoutingModule,',`AppRoutingModule,
     LetDirective,
     StoreRouterConnectingModule.forRoot(),
     StoreModule.forRoot(reducers, { metaReducers }),
     StoreDevtoolsModule.instrument({
       maxAge: 25,
       logOnly: !isDevMode(),
       autoPause: true,
       trace: false,
       traceLimit: 75,
     }),
     EffectsModule.forRoot([]),`, tree)

}

function addImportsToAppModule(tree: Tree) {
  const contentToReplace = [`from '@angular/common';`,`PortalCoreModule,`, `NgModule`];
  const replaceWith = [`from '@angular/common';
    import { StoreModule } from '@ngrx/store';
    import { reducers, metaReducers } from './app.reducers';
    import { StoreDevtoolsModule } from '@ngrx/store-devtools';
    import { LetDirective } from '@ngrx/component';
    import { EffectsModule } from '@ngrx/effects';
    import { StoreRouterConnectingModule } from '@ngrx/router-store';
    import { environment } from 'src/environments/environment';
    `, `PortalCoreModule,
     APP_CONFIG,`, `NgModule, isDevMode`];
  safeReplace(`Ngrx Generator add Imports replace in app.module.ts`,'src/app/app.module.ts', contentToReplace, replaceWith, tree)

}



export default ngrxGenerator;
