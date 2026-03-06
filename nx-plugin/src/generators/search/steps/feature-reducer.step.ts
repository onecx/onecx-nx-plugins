import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureReducerStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourcePropertyName = names(options.resource).propertyName;
    const filePath = `src/app/${featureFileName}/${featureFileName}.reducers.ts`;

    const reducerContent = tree.read(filePath, 'utf8');
    if (
      !reducerContent.includes(
        `import { ${resourcePropertyName}SearchReducer }`
      )
    ) {
      const find = [/^/, '>({'];
      const replaceWith = [
        `import { ${resourcePropertyName}SearchReducer } from './pages/${resourceFileName}-search/${resourceFileName}-search.reducers';`,
        `>({
      search: ${resourcePropertyName}SearchReducer,`,
      ];

      safeReplace(
        `Adding search reducer to ${featureFileName}`,
        filePath,
        find,
        replaceWith,
        tree
      );
    }
  }
  getTitle(): string {
    return 'Adapting Feature Reducer';
  }
}
