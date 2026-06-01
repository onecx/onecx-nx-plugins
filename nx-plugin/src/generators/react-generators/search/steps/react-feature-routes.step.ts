import { Tree, names } from '@nx/devkit';

import {
  GeneratorStep,
  GeneratorStepError,
} from '../../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class ReactFeatureRoutesStep
  implements GeneratorStep<SearchGeneratorSchema>
{
  process(tree: Tree, options: SearchGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const pageComponentName = `${resourceClassName}SearchPage`;
    const routeFilePath = 'src/router.tsx';

    if (!tree.exists(routeFilePath)) {
      throw new GeneratorStepError(
        'React route file not found. Expected src/router.tsx'
      );
    }

    const content = tree.read(routeFilePath, 'utf8');
    if (!content) {
      throw new GeneratorStepError('React route file src/router.tsx is empty.');
    }

    if (content.includes(`element: <${pageComponentName} />`)) {
      return;
    }

    const importPath = `./pages/${featureFileName}/${resourceFileName}-search/${resourceFileName}-search.page`;
    const withImport = this.ensureImport(content, pageComponentName, importPath);
    const updated = this.injectRoute(
      withImport,
      resourceFileName,
      pageComponentName
    );

    if (!updated) {
      throw new GeneratorStepError(
        'src/router.tsx found but no return array matched. Please add route manually.'
      );
    }

    tree.write(routeFilePath, updated);
  }

  private injectRoute(
    content: string,
    resourceFileName: string,
    pageComponentName: string
  ): string | null {
    const routeArrayPattern = /return\s*\[/;
    if (routeArrayPattern.test(content)) {
      return content.replace(
        routeArrayPattern,
        (match) =>
          `${match}\n      {\n        path: \`\${href}/${resourceFileName}-search\`,\n        element: <${pageComponentName} />,\n      },`
      );
    }

    return null;
  }

  private ensureImport(
    content: string,
    pageComponentName: string,
    relativeImport: string
  ): string {
    if (
      content.includes(`import ${pageComponentName} from '${relativeImport}';`) ||
      content.includes(`import ${pageComponentName} from "${relativeImport}";`)
    ) {
      return content;
    }

    const importLine = `import ${pageComponentName} from '${relativeImport}';`;
    const importRegex = /^import\s.+?;$/gm;
    const matches = Array.from(content.matchAll(importRegex));

    if (matches.length === 0) {
      return `${importLine}\n\n${content}`;
    }

    const lastMatch = matches[matches.length - 1];
    const insertAt = (lastMatch.index ?? 0) + lastMatch[0].length;
    return `${content.slice(0, insertAt)}\n${importLine}${content.slice(insertAt)}`;
  }

  getTitle(): string {
    return 'Adapting React Feature Routes';
  }
}
