import { Tree, names } from '@nx/devkit';

import {
  GeneratorStep,
  GeneratorStepError,
} from '../../../shared/generator.utils';
import { safeReplace } from '../../../shared/safeReplace';
import { DetailsGeneratorSchema } from '../schema';

export class ReactFeatureRoutesStep
  implements GeneratorStep<DetailsGeneratorSchema>
{
  process(tree: Tree, options: DetailsGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const routeFilePath = 'src/router.tsx';

    if (!tree.exists(routeFilePath)) {
      throw new GeneratorStepError(
        'React route file not found. Expected src/router.tsx'
      );
    }

    const pageComponentName = `${resourceClassName}DetailsPage`;
    const importPath = `./pages/${featureFileName}/${resourceFileName}-details/${resourceFileName}-details.page`;

    safeReplace(
      `Add details import to React router`,
      routeFilePath,
      'import "./i18n/config";',
      `import "./i18n/config";
import ${pageComponentName} from '${importPath}';`,
      tree
    );

    const routeToAdd = `      {
        path: \`\${href}/${featureFileName}/:id\`,
        element: <${pageComponentName} />,
        handle: {},
      },`;

    // Add route to the main return array - target the closing bracket of the return array
    safeReplace(
      `Add details route to React router`,
      routeFilePath,
      '    ];\n  }, [href]);',
      `${routeToAdd}
    ];\n  }, [href]);`,
      tree
    );
  }

  getTitle(): string {
    return 'Adapting React Feature Routes';
  }
}
