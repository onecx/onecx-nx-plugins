import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const featureClassName = names(options.featureName).className;
    const className = names(options.resource).className;
    const filePath = `src/app/${featureFileName}/${featureFileName}.state.ts`;

    const find = [/^/, 'State {'];
    const replaceWith = [
      `import { ${className}DetailsState } from './pages/${resourceFileName}-details/${resourceFileName}-details.state';`,
      `State { details: ${className}DetailsState; `,
    ];
    safeReplace(
      `Add details state to ${featureClassName}State`,
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
