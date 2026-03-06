import { Tree, names } from '@nx/devkit';

import { safeReplace } from '../../shared/safeReplace';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../../search/schema';

export class SearchHTMLStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const resourceConstantName = names(options.resource).constantName;
    const htmlSearchFilePath = `src/app/${featureFileName}/pages/${resourceFileName}-search/${resourceFileName}-search.component.html`;

    const find = '<ocx-interactive-data-view';

    const replaceWith = `<ocx-interactive-data-view \n (viewItem)="details($event)"
      ${options.standalone ? '' : `viewPermission="${resourceConstantName}#VIEW"`}`;

    safeReplace(
      `Add view event and permission to ${resourceClassName}SearchComponent HTML`,
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
