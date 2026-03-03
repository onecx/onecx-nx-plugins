import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureModuleStep
  implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const featureClassName = names(options.featureName).className;
    const className = names(options.resource).className;
    const moduleFilePath = `src/app/${featureFileName}/${featureFileName}.module.ts`;
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
  import { ${className}DetailsEffects } from './pages/${resourceFileName}-details/${resourceFileName}-details.effects';
  import { ${className}DetailsComponent } from './pages/${resourceFileName}-details/${resourceFileName}-details.component';
  import { providePortalDialogService } from '@onecx/portal-integration-angular';
  `,
    ];
    safeReplace(
      `Enhance ${featureClassName}Module with details component and effects`,
      moduleFilePath,
      find,
      replaceWith,
      tree
    );

    if (options.editMode || options.allowDelete) {
      const moduleContent = tree.read(moduleFilePath, 'utf8');
      if (!moduleContent.includes('providePortalDialogService()')) {
        find.push('declarations:');
        replaceWith.push(`
    providers: [providePortalDialogService()],
    declarations:`);
      }
      safeReplace(
        `Add providePortalDialogService()`,
        moduleFilePath,
        find,
        replaceWith,
        tree
      );
    }
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
