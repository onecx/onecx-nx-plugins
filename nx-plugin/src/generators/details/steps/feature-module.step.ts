import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureModuleStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const moduleFilePath = `src/app/${fileName}/${fileName}.module.ts`;
    const find = [
      'declarations: [',
      `} from '@onecx/portal-integration-angular'`,
      'EffectsModule.forFeature()',
      'EffectsModule.forFeature([',
      `from '@ngrx/effects';`,
    ];
    const replaceWith = [
      `declarations: [${className}DetailsComponent,`,
      `InitializeModuleGuard, } from '@onecx/portal-integration-angular'`,
      `EffectsModule.forFeature([])`,
      `EffectsModule.forFeature([${className}DetailsEffects,`,
      `from '@ngrx/effects';
  import { ${className}DetailsEffects } from './pages/${fileName}-details/${fileName}-details.effects';
  import { ${className}DetailsComponent } from './pages/${fileName}-details/${fileName}-details.component';`,
    ];
    safeReplace(
      `Enhance ${fileName}Module with details component and effects`,
      moduleFilePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
