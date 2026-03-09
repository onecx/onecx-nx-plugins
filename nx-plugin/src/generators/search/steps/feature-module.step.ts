import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureName = options.featureName;
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    
    const moduleFilePath = joinPathFragments(
      'src/app',
      featureFileName,
      featureFileName + '.module.ts'
    );
    const find = [
      'declarations: [',
      `} from '@onecx/angular-accelerator'`,
      'EffectsModule.forFeature()',
      'EffectsModule.forFeature([',
      `from '@ngrx/effects'`,
    ];
    const replaceWith = [
      `declarations: [${resourceClassName}SearchComponent,`,
      ` ,InitializeModuleGuard } from '@onecx/portal-integration-angular'`,
      `EffectsModule.forFeature([])`,
      `EffectsModule.forFeature([${resourceClassName}SearchEffects,`,
      `from '@ngrx/effects';
    import { ${resourceClassName}SearchEffects } from './pages/${resourceFileName}-search/${resourceFileName}-search.effects';
    import { ${resourceClassName}SearchComponent } from './pages/${resourceFileName}-search/${resourceFileName}-search.component';`,
    ];

    safeReplace(
      `Integrating ${resourceClassName}SearchComponent into ${featureName} module"`,
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
