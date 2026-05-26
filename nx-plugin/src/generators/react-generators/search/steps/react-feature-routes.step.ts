import path from 'path';
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
    const routePath = `/${featureFileName}/${resourceFileName}-search`;

    const candidateRouteFiles = [
      'src/routes.tsx',
      'src/router.tsx',
      'src/app/routes.tsx',
      'src/app/router.tsx',
      'src/main.tsx',
    ].filter((p) => tree.exists(p));

    if (candidateRouteFiles.length === 0) {
      throw new GeneratorStepError(
        'No React route file found. Expected one of: src/routes.tsx, src/router.tsx, src/app/routes.tsx, src/app/router.tsx, src/main.tsx'
      );
    }

    for (const routeFilePath of candidateRouteFiles) {
      const content = tree.read(routeFilePath, 'utf8');
      if (!content) {
        continue;
      }

      if (
        content.includes(`path: '${routePath}'`) ||
        content.includes(`path="${routePath}"`) ||
        content.includes(`path='${routePath}'`)
      ) {
        return;
      }

      const updated = this.tryInjectRoute(
        content,
        routeFilePath,
        pageComponentName,
        featureFileName,
        resourceFileName,
        routePath
      );

      if (updated) {
        tree.write(routeFilePath, updated);
        return;
      }
    }

    throw new GeneratorStepError(
      'React route file found but no supported router pattern matched. Please add route manually.'
    );
  }

  private tryInjectRoute(
    content: string,
    routeFilePath: string,
    pageComponentName: string,
    featureFileName: string,
    resourceFileName: string,
    routePath: string
  ): string | null {
    const targetPagePath = `src/pages/${featureFileName}/${resourceFileName}-search/${resourceFileName}-search.page`;
    const routeDir = path.posix.dirname(routeFilePath);
    const relativeImport = this.normalizeImportPath(
      path.posix.relative(routeDir, targetPagePath)
    );

    const updated = this.ensureImport(
      content,
      pageComponentName,
      relativeImport
    );

    const routeObject = `  { path: '${routePath}', element: <${pageComponentName} /> },`;

    if (updated.includes('createBrowserRouter([')) {
      return updated.replace(
        'createBrowserRouter([',
        `createBrowserRouter([\n${routeObject}`
      );
    }

    const routesArrayPattern = /export\s+const\s+routes\s*=\s*\[|const\s+routes\s*=\s*\[/;
    if (routesArrayPattern.test(updated)) {
      return updated.replace(
        routesArrayPattern,
        (match) => `${match}\n${routeObject}`
      );
    }

    const routesJsxPattern = /<Routes[^>]*>/;
    if (routesJsxPattern.test(updated)) {
      return updated.replace(
        routesJsxPattern,
        (match) =>
          `${match}\n        <Route path="${routePath}" element={<${pageComponentName} />} />`
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

  private normalizeImportPath(importPath: string): string {
    if (importPath.startsWith('.')) {
      return importPath;
    }
    return `./${importPath}`;
  }

  getTitle(): string {
    return 'Adapting React Feature Routes';
  }
}
