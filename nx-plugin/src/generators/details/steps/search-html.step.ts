import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchHTMLStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const constantName = names(options.featureName).constantName;
    const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

    let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
    htmlContent = htmlContent.replace(
      '<ocx-interactive-data-view',
      `<ocx-interactive-data-view \n (viewItem)="details($event)"
      ${options.standalone ? '' : `viewPermission="${constantName}#VIEW"`}`
    );
    tree.write(htmlSearchFilePath, htmlContent);
  }
  getTitle(): string {
    return 'Adapting Search HTML';
  }
}
