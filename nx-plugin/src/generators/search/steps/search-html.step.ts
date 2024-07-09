import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class SearchHTMLStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

    let htmlContent = tree.read(htmlSearchFilePath, 'utf8');
    htmlContent = htmlContent.replace(
      '<ocx-interactive-data-view',
      `<ocx-interactive-data-view \n (viewItem)="details($event)"`
    );
    tree.write(htmlSearchFilePath, htmlContent);
  }
  getName(): string {
    return 'Adapting Search HTML';
  }
}
