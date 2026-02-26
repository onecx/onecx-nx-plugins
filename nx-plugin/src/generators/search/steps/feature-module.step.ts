import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureName = options.featureName;
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const className = names(options.resource).className;
    
    const moduleFilePath = joinPathFragments(
      'src/app',
      featureFileName,
      featureFileName + '.module.ts'
    );
    const find = [
      'declarations: [',
      `} from '@onecx/portal-integration-angular'`,
      'EffectsModule.forFeature()',
      'EffectsModule.forFeature([',
      `from '@ngrx/effects';`,
    ];
    const replaceWith = [
      `declarations: [${className}SearchComponent,`,
      `,InitializeModuleGuard, } from '@onecx/portal-integration-angular'`,
      `EffectsModule.forFeature([])`,
      `EffectsModule.forFeature([${className}SearchEffects,`,
      `from '@ngrx/effects';
    import { ${className}SearchEffects } from './pages/${resourceFileName}-search/${resourceFileName}-search.effects';
    import { ${className}SearchComponent } from './pages/${resourceFileName}-search/${resourceFileName}-search.component';`,
    ];

    safeReplace(
      `Integrating ${className}SearchComponent into ${featureName} module"`,
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
