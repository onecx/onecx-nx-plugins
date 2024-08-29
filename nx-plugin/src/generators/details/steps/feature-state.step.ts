import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/${fileName}.state.ts`;

    let fileContent = tree.read(filePath, 'utf8');
    fileContent = fileContent.replace(
      'State {',
      `State {
    details: ${className}DetailsState;
  `
    );

    fileContent =
      `import { ${className}DetailsState } from './pages/${fileName}-details/${fileName}-details.state';` +
      fileContent;
    tree.write(filePath, fileContent);
  }
  getTitle(): string {
    return "Adapting Feature State"
  }
}
