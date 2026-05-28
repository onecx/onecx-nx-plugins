import { Tree, names } from '@nx/devkit';

import { GeneratorStep } from '../../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class ReactFeaturePageRegistrationStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;

    const indexFilePath = `src/pages/${featureFileName}/index.tsx`;
    const importLine = `import { ${resourceClassName}SearchPage } from './${resourceFileName}-search/${resourceFileName}-search.page';`;

    if (!tree.exists(indexFilePath)) {
      return;
    }

    const content = tree.read(indexFilePath, 'utf8');
    if (!content) {
      return;
    }

    let updatedContent = content;

    if (!content.includes(`${resourceClassName}SearchPage`)) {
      updatedContent = `${importLine}\n${updatedContent}`;
    }

    if (!content.includes(`<${resourceClassName}SearchPage`)) {
      updatedContent = updatedContent.replace(
        /(&lt;div&gt;|<div>)[\s\S]*?(&lt;\/div&gt;|<\/div>)/,
        `<${resourceClassName}SearchPage />`
      );
    }

    tree.write(indexFilePath, updatedContent);
  }

  getTitle(): string {
    return 'Adapting React Feature Page Registration';
  }
}
