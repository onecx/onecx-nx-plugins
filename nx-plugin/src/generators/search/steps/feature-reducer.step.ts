import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureReducerStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/${fileName}.reducers.ts`;
    const find = [/^/,'>({'];
    const replaceWith = [ `import { ${propertyName}SearchReducer } from './pages/${fileName}-search/${fileName}-search.reducers';`, `>({
      search: ${propertyName}SearchReducer,`];

    safeReplace(`Feature Reducer replace in ${fileName}`, filePath, find, replaceWith,tree)
  }
  getTitle(): string {
    return 'Adapting Feature Reducer';
  }
}
