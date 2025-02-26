import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureRoutesStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const routesFilePath = `src/app/${fileName}/${fileName}.routes.ts`;
    const find = [/^/,'routes: Routes = ['];
    const replaceWith = [`import { ${className}DetailsComponent } from './pages/${fileName}-details/${fileName}-details.component';`,`routes: Routes = [ { path: 'details/:id', component: ${className}DetailsComponent, pathMatch: 'full' },`];

    safeReplace(`Feature Routes replace routes in ${fileName}`,routesFilePath, find, replaceWith,tree)
  }
  getTitle(): string {
    return 'Adapting Feature Routes';
  }
}
