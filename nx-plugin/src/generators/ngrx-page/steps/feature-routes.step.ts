import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { PageGeneratorSchema } from '../schema';

export class FeatureRoutesStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    
    const pageClassName = names(options.pageName).constantName;
    const pageFileName = names(options.pageName).propertyName;

    const routesFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.routes.ts'
    );
    let moduleContent = tree.read(routesFilePath, 'utf8');
    moduleContent = moduleContent.replace(
      'routes: Routes = [',
      `routes: Routes = [ { path: '', component: ${pageClassName}Component, pathMatch: 'full' },`
    );

    moduleContent =
      `import { ${pageClassName}Component } from './pages/${pageFileName}/${pageFileName}.component';` +
      moduleContent;
    tree.write(routesFilePath, moduleContent);
  }
  getTitle(): string {
    return 'Adapting Feature Routes';
  }
}
