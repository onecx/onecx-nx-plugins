import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '@onecx/generator-utils';
import { ensurePortalDialogProvider } from '../../shared/portal-dialog-provider.utils';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureModuleStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const featureClassName = names(options.featureName).className;
    const resourceClassName = names(options.resource).className;
    const moduleFilePath = `src/app/${featureFileName}/${featureFileName}.module.ts`;
    const find = [
      'EffectsModule.forFeature()',
      'EffectsModule.forFeature([',
      `from '@ngrx/effects'`,
      `imports: [`,
    ];
    const replaceWith = [
      `EffectsModule.forFeature([])`,
      `EffectsModule.forFeature([${resourceClassName}DetailsEffects,`,
      `from '@ngrx/effects';
  import { ${resourceClassName}DetailsEffects } from './pages/${resourceFileName}-details/${resourceFileName}-details.effects';
  import { ${resourceClassName}DetailsComponent } from './pages/${resourceFileName}-details/${resourceFileName}-details.component';`,
      `imports: [
      ${resourceClassName}DetailsComponent,`,
    ];
    safeReplace(
      `Enhance ${featureClassName}Module with details component and effects`,
      moduleFilePath,
      find,
      replaceWith,
      tree
    );

    if (options.editMode || options.allowDelete) {
      ensurePortalDialogProvider(tree, moduleFilePath);
    }
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
