import { Tree, names } from '@nx/devkit';

import {
  GeneratorStep,
  GeneratorStepError,
} from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { ReactPageGeneratorSchema } from '../schema';

export class ReactFeatureRoutesStep
  implements GeneratorStep<ReactPageGeneratorSchema>
{
  process(tree: Tree, options: ReactPageGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const pageFileName = names(options.pageName).fileName;
    const pageClassName = names(options.pageName).className;
    const routeFilePath = 'src/router.tsx';

    if (!tree.exists(routeFilePath)) {
      throw new GeneratorStepError(
        'React route file not found. Expected src/router.tsx'
      );
    }

    const pageComponentName = `${pageClassName}Page`;
    const importPath = `./pages/${featureFileName}/${pageFileName}/${pageFileName}.page`;

    safeReplace(
      `Add page import to React router`,
      routeFilePath,
      'import "./i18n/config";',
      `import "./i18n/config";
     import ${pageComponentName} from '${importPath}';`,
      tree
    );

    safeReplace(
      `Add page route to React router`,
      routeFilePath,
      '    ];',
      `    {
      path: \`\${href}/${featureFileName}/${pageFileName}\`,
      element: <${pageComponentName} />,
      handle: {},
    },
    ];`,
      tree
    );
  }

  getTitle(): string {
    return 'Adapting React Feature Routes';
  }
}
