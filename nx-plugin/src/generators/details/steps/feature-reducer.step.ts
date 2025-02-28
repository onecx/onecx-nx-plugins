import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureReducerStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/${fileName}.reducers.ts`;
    const find = [/^/, '>({'];
    const replaceWith = [
      `import { ${propertyName}DetailsReducer } from './pages/${fileName}-details/${fileName}-details.reducers';`,
      `>({
    details: ${propertyName}DetailsReducer,`,
    ];
    safeReplace(
      `Adapt ${fileName}Reducer with details reducer setup`,
      filePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Feature Reducer';
  }
}
