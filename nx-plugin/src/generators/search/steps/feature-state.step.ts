import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/${fileName}.state.ts`;
    const find = ['{',/^/];
    const replaceWith = [`{
    search: ${className}SearchState;
  `,`import { ${className}SearchState } from './pages/${fileName}-search/${fileName}-search.state';`]

    safeReplace(`Feature State replace with SearchState in ${fileName}`,filePath,find,replaceWith, tree);

  }
  getTitle(): string {
    return "Adapting Feature State"
  }
}
