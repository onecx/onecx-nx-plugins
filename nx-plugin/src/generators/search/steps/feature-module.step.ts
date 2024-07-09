import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
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
    let moduleContent = tree.read(moduleFilePath, 'utf8');
    moduleContent = moduleContent.replace(
      'declarations: [',
      `declarations: [${className}SearchComponent,`
    );
    moduleContent = moduleContent.replace(
      `} from '@onecx/portal-integration-angular'`,
      `InitializeModuleGuard, } from '@onecx/portal-integration-angular'`
    );
    moduleContent = moduleContent.replace(
      'EffectsModule.forFeature()',
      `EffectsModule.forFeature([])`
    );
    moduleContent = moduleContent.replace(
      'EffectsModule.forFeature([',
      `EffectsModule.forFeature([${className}SearchEffects,`
    );
    moduleContent = moduleContent.replace(
      `from '@ngrx/effects';`,
      `from '@ngrx/effects';
    import { ${className}SearchEffects } from './pages/${fileName}-search/${fileName}-search.effects';
    import { ${className}SearchComponent } from './pages/${fileName}-search/${fileName}-search.component';`
    );

    tree.write(moduleFilePath, moduleContent);
  }
  getName(): string {
    return 'Adapting Feature Module';
  }
}
