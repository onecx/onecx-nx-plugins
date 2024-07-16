import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class FeatureReducerStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/${fileName}.reducers.ts`;

    let fileContent = tree.read(filePath, 'utf8');

    fileContent = fileContent.replace(
      '>({',
      `>({
      search: ${propertyName}SearchReducer,`
    );

    fileContent =
      `import { ${propertyName}SearchReducer } from './pages/${fileName}-search/${fileName}-search.reducers';` +
      fileContent;
    tree.write(filePath, fileContent);
  }
  getTitle(): string {
    return 'Adapting Feature Reducer';
  }
}
