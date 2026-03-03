import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';
import { safeReplace } from '../../shared/safeReplace';

export class SearchHTMLStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const className = names(options.resource).className;
    const constantName = names(options.resource).constantName;
    const htmlSearchFilePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.html`;

    const find = '<ocx-interactive-data-view';

    const replaceWith = `<ocx-interactive-data-view \n (viewItem)="details($event)"
      ${options.standalone ? '' : `viewPermission="${constantName}#VIEW"`}`;

    safeReplace(
      `Add view event and permission to ${className}SearchComponent HTML`,
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
