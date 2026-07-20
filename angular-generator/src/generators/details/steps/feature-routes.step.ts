import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureRoutesStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const featureClassName = names(options.featureName).className;
    const resourceClassName = names(options.resource).className;
    const routesFilePath = `src/app/${featureFileName}/${featureFileName}.routes.ts`;
    const find = [/^/, 'routes: Routes = ['];
    const replaceWith = [
      `import { ${resourceClassName}DetailsComponent } from './pages/${resourceFileName}-details/${resourceFileName}-details.component';`,
      `routes: Routes = [ { path: 'details/:id', component: ${resourceClassName}DetailsComponent, pathMatch: 'full' },`,
    ];

    safeReplace(
      `Add details route to ${featureClassName}Routes`,
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
