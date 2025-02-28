import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
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

    const find = [
      'declarations: [',
      `} from '@onecx/portal-integration-angular'`,
      'EffectsModule.forFeature()',
      'EffectsModule.forFeature([',
      `from '@ngrx/effects';`,
    ];

    const replaceWith = [
      `declarations: [${pageClassName}Component,`,
      `InitializeModuleGuard, } from '@onecx/portal-integration-angular'`,
      `EffectsModule.forFeature([])`,
      `EffectsModule.forFeature([${pageClassName}Effects,`,
      `from '@ngrx/effects';
    import { ${pageClassName}Effects } from './pages/${pageFileName}/${pageFileName}.effects';
    import { ${pageClassName}Component } from './pages/${pageFileName}/${pageFileName}.component';`,
    ];

    safeReplace(
      `Add page component and effects to ${fileName}Module`,
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
