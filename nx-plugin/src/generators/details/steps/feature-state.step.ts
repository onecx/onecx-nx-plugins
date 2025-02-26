import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/${fileName}.state.ts`;

    const find = [/^/,'State {'];
    const replaceWith = [`import { ${className}DetailsState } from './pages/${fileName}-details/${fileName}-details.state';`,`State {
    details: ${className}DetailsState;
  `];
    safeReplace(`Feature State replace import and state in ${fileName}`, filePath, find,replaceWith, tree)

  }
  getTitle(): string {
    return "Adapting Feature State"
  }
}
