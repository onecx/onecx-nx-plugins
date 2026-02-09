import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const moduleFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.module.ts'
    );
    const find = [
      'declarations: [',
      `} from '@onecx/angular-accelerator'`,
      'EffectsModule.forFeature()',
      'EffectsModule.forFeature([',
      `from '@ngrx/effects';`,
    ];
    const replaceWith = [
      `declarations: [${className}SearchComponent,`,
      `} from '@onecx/angular-accelerator'`,
      `EffectsModule.forFeature([])`,
      `EffectsModule.forFeature([${className}SearchEffects,`,
      `from '@ngrx/effects';
    import { ${className}SearchEffects } from './pages/${fileName}-search/${fileName}-search.effects';
    import { ${className}SearchComponent } from './pages/${fileName}-search/${fileName}-search.component';`,
    ];

    safeReplace(
      `Integrating ${className}SearchComponent into ${fileName} module"`,
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
