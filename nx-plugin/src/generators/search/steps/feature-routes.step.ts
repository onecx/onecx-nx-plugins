import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
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
    const find = [/^/, 'routes: Routes = ['];
    const replaceWith = [
      `import { ${className}SearchComponent } from './pages/${fileName}-search/${fileName}-search.component';`,
      `routes: Routes = [ { path: '', component: ${className}SearchComponent, pathMatch: 'full' },`,
    ];

    safeReplace(
      `Update ${fileName}Routes to add a new route for ${className}SearchComponent and extend import statements to include the component`,
      routesFilePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Feature Routes';
  }
}
