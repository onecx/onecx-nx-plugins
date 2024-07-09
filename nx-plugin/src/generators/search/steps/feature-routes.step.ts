import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class FeatureRoutesStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const routesFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.routes.ts'
    );
    let moduleContent = tree.read(routesFilePath, 'utf8');
    moduleContent = moduleContent.replace(
      'routes: Routes = [',
      `routes: Routes = [ { path: '', component: ${className}SearchComponent, pathMatch: 'full' },`
    );

    moduleContent =
      `import { ${className}SearchComponent } from './pages/${fileName}-search/${fileName}-search.component';` +
      moduleContent;
    tree.write(routesFilePath, moduleContent);
  }
  getName(): string {
    return 'Adapting Feature Routes';
  }
}
