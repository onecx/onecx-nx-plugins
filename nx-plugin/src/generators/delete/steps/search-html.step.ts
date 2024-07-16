import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';

export class SearchHTMLStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const constantName = names(options.featureName).constantName;
    const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

    let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
    htmlContent = htmlContent.replace(
      '<ocx-interactive-data-view',
      `<ocx-interactive-data-view 
      (deleteItem)="delete($event)"
      ${options.standalone ? '' : `deletePermission="${constantName}#DELETE"`}`
    );
    tree.write(htmlSearchFilePath, htmlContent);
  }
  getTitle(): string {
    return 'Adapting Search HTML';
  }
}
