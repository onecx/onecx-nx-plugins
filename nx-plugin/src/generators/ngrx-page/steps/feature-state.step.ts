import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { PageGeneratorSchema } from '../schema';

export class FeatureStateStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/${fileName}.state.ts`;

    const pageClassName = names(options.pageName).constantName;
    const pagePropertyName = names(options.pageName).propertyName;
    const pageFileName = names(options.pageName).propertyName;

    let fileContent = tree.read(filePath, 'utf8');

    fileContent = fileContent.replace(
      '{',
      `{
    ${pagePropertyName}: ${pageClassName}State;
  `
    );

    fileContent =
      `import { ${pageClassName}State } from './pages/${pageFileName}/${pageFileName}.state';` +
      fileContent;
    tree.write(filePath, fileContent);
  }
  getTitle(): string {
    return 'Adapting Feature State';
  }
}
