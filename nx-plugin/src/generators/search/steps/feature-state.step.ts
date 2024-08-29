import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/${fileName}.state.ts`;

    let fileContent = tree.read(filePath, 'utf8');

    fileContent = fileContent.replace(
      '{',
      `{
    search: ${className}SearchState;
  `
    );

    fileContent =
      `import { ${className}SearchState } from './pages/${fileName}-search/${fileName}-search.state';` +
      fileContent;
    tree.write(filePath, fileContent);
  }
  getTitle(): string {
    return "Adapting Feature State"
  }
}
