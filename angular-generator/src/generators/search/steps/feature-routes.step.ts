import { Tree, joinPathFragments, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureRoutesStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureName = options.featureName;
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;

    const routesFilePath = joinPathFragments(
      'src/app',
      featureFileName,
      featureFileName + '.routes.ts'
    );
    const find = [/^/, 'routes: Routes = ['];
    const replaceWith = [
      `import { ${resourceClassName}SearchComponent } from './pages/${resourceFileName}-search/${resourceFileName}-search.component';`,
      `routes: Routes = [ { path: '', component: ${resourceClassName}SearchComponent, pathMatch: 'full' },`,
    ];

    safeReplace(
      `Update ${featureName} Routes to add a new route for ${resourceClassName}SearchComponent and extend import statements to include the component`,
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
