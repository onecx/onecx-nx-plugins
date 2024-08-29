import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureRoutesStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const routesFilePath = `src/app/${fileName}/${fileName}.routes.ts`;
    let moduleContent = tree.read(routesFilePath, 'utf8');
    moduleContent =
      moduleContent.replace(
        'routes: Routes = [',
        `routes: Routes = [ { path: 'details/:id', component: ${className}DetailsComponent, pathMatch: 'full' },`
      );

    moduleContent =
      `import { ${className}DetailsComponent } from './pages/${fileName}-details/${fileName}-details.component';` +
      moduleContent;
    tree.write(routesFilePath, moduleContent);
  }
  getTitle(): string {
    return 'Adapting Feature Routes';
  }
}
