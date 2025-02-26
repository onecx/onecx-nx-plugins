import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchHTMLStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const constantName = names(options.featureName).constantName;
    const htmlSearchFilePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.html`;

    const find = '<ocx-interactive-data-view';

    const replaceWith = `<ocx-interactive-data-view \n (viewItem)="details($event)"
      ${options.standalone ? '' : `viewPermission="${constantName}#VIEW"`}`;

    safeReplace(
      `Replace '<ocx-interactive-data-view' in ${htmlSearchFilePath}`,
      htmlSearchFilePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Search HTML';
  }
}
