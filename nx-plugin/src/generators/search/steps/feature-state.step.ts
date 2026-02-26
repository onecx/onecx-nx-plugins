import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureName = options.featureName;
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const className = names(options.resource).className;
    
    const filePath = `src/app/${featureFileName}/${featureFileName}.state.ts`;
    const find = ['{', /^/];
    const replaceWith = [
      `{
    search: ${className}SearchState;
  `,
      `import { ${className}SearchState } from './pages/${resourceFileName}-search/${resourceFileName}-search.state';`,
    ];

    safeReplace(
      `Injecting search state into ${featureName} feature`,
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
