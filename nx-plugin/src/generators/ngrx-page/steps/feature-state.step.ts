import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { PageGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/${fileName}.state.ts`;

    const pageClassName = names(options.pageName).className;
    const pagePropertyName = names(options.pageName).propertyName;
    const pageFileName = names(options.pageName).fileName;

    const find = [/^/, 'State {'];
    const replaceWith = [
      `import { ${pageClassName}State } from './pages/${pageFileName}/${pageFileName}.state';`,
      `State {
    ${pagePropertyName}: ${pageClassName}State;`,
    ];

    safeReplace(
      `Add page state to ${fileName}State`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Feature State';
  }
}
