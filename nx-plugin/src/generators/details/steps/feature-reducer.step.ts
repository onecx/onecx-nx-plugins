import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';

export class FeatureReducerStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const propertyName = names(options.featureName).propertyName;
    const filePath = `src/app/${fileName}/${fileName}.reducers.ts`;

    let fileContent = tree.read(filePath, 'utf8');

    fileContent = fileContent.replace(
      '>({',
      `>({
    details: ${propertyName}DetailsReducer,`
    );

    fileContent =
      `import { ${propertyName}DetailsReducer } from './pages/${fileName}-details/${fileName}-details.reducers';` +
      fileContent;
    tree.write(filePath, fileContent);
  }
  getName(): string {
    return "Adapting Feature Reducer"
  }
}
