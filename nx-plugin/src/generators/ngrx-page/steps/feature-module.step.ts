import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { PageGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;

    const pageClassName = names(options.pageName).className;
    const pageFileName = names(options.pageName).fileName;

    const moduleFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.module.ts'
    );

    let moduleContent = tree.read(moduleFilePath, 'utf8');
    moduleContent = moduleContent.replace(
      'declarations: [',
      `declarations: [${pageClassName}Component,`
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
      `EffectsModule.forFeature([${pageClassName}Effects,`
    );
    moduleContent = moduleContent.replace(
      `from '@ngrx/effects';`,
      `from '@ngrx/effects';
    import { ${pageClassName}Effects } from './pages/${pageFileName}/${pageFileName}.effects';
    import { ${pageClassName}Component } from './pages/${pageFileName}/${pageFileName}.component';`
    );

    tree.write(moduleFilePath, moduleContent);
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
