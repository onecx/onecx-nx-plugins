import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '@onecx/generator-utils';
import { PageGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/${fileName}.state.ts`;

    const pageClassName = names(options.pageName).className;
    const pagePropertyName = names(options.pageName).propertyName;
    const pageFileName = names(options.pageName).fileName;
    const pageStateName =
      names(options.featureName).className === pageClassName
        ? `${pageClassName}PageState`
        : `${pageClassName}State`;
    const pageStateImport =
      pageStateName === `${pageClassName}State`
        ? pageStateName
        : `${pageClassName}State as ${pageStateName}`;

    const find = [/^/, 'State {'];
    const replaceWith = [
      `import { ${pageStateImport} } from './pages/${pageFileName}/${pageFileName}.state';`,
      `State {
    ${pagePropertyName}: ${pageStateName};`,
    ];

    safeReplace(
      `Update ${fileName}State to include ${pagePropertyName} state, map it to ${pageClassName}State, and extend import statements to include the new state`,
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
