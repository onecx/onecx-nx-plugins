import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { PageGeneratorSchema } from '../schema';

export class FeatureReducerStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/${fileName}.reducers.ts`;

    const pageClassName = names(options.pageName).constantName;
    const pagePropertyName = names(options.pageName).propertyName;
    const pageFileName = names(options.pageName).propertyName;

    let fileContent = tree.read(filePath, 'utf8');

    fileContent = fileContent.replace(
      '>({',
      `>({
      ${pagePropertyName}: ${pageClassName}Reducer,`
    );

    fileContent =
      `import { ${pageClassName}Reducer } from './pages/${pageFileName}/${pageFileName}.reducers';` +
      fileContent;
    tree.write(filePath, fileContent);
  }
  getTitle(): string {
    return 'Adapting Feature Reducer';
  }
}
