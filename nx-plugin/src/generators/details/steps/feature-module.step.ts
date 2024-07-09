import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const moduleFilePath = `src/app/${fileName}/${fileName}.module.ts`;
    let moduleContent = tree.read(moduleFilePath, 'utf8');
    moduleContent = moduleContent.replace(
      'declarations: [',
      `declarations: [${className}DetailsComponent,`
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
      `EffectsModule.forFeature([${className}DetailsEffects,`
    );
    moduleContent = moduleContent.replace(
      `from '@ngrx/effects';`,
      `from '@ngrx/effects';
  import { ${className}DetailsEffects } from './pages/${fileName}-details/${fileName}-details.effects';
  import { ${className}DetailsComponent } from './pages/${fileName}-details/${fileName}-details.component';`
    );

    tree.write(moduleFilePath, moduleContent);
  }
  getName(): string {
    return "Adapting Feature Module"
  }
}
