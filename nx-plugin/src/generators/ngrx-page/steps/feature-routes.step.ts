import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { PageGeneratorSchema } from '../schema';

export class FeatureRoutesStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;

    const pageClassName = names(options.pageName).className;
    const pagePropertyName = names(options.pageName).propertyName;
    const pageFileName = names(options.pageName).fileName;

    const routesFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.routes.ts'
    );
    const find = [/^/,'routes: Routes = ['];
    const replaceWith = [ `import { ${pageClassName}Component } from './pages/${pageFileName}/${pageFileName}.component';`
      ,`routes: Routes = [ { path: '${pagePropertyName}', component: ${pageClassName}Component, pathMatch: 'full' },`];

    safeReplace(`Feature Routes replace routes and import in ${fileName}`, routesFilePath, find,replaceWith, tree);

  }
  getTitle(): string {
    return 'Adapting Feature Routes';
  }
}
