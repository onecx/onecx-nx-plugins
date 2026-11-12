import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '@onecx/generator-utils';
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
      'EffectsModule.forFeature()',
      'EffectsModule.forFeature([',
      /^/,
      `imports: [`,
    ];

    const replaceWith = [
      `EffectsModule.forFeature([])`,
      `EffectsModule.forFeature([${pageClassName}Effects,`,
      `import { ${pageClassName}Effects } from './pages/${pageFileName}/${pageFileName}.effects';
       import { ${pageClassName}Component } from './pages/${pageFileName}/${pageFileName}.component';`,
      `imports: [
      ${pageClassName}Component,`,
    ];

    safeReplace(
      `Update ${fileName}Module to import ${pageClassName}Component, add ${pageClassName}Effects to EffectsModule.forFeature, and extend import statements to include necessary dependencies`,
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
