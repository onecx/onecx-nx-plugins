import { Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { ScriptKind } from 'typescript';

/**
 * Registers a generated page in a feature's `index.tsx` barrel file by adding the
 * page import and replacing the `<div>` placeholder with the page component.
 *
 * @param tree - The Nx `Tree`.
 * @param indexFilePath - Path to the feature `index.tsx`.
 * @param pageComponent - The page component name to render (e.g. `BookSearchPage`).
 * @param importLine - The full import statement for the page component.
 */
export function replacePlaceholder(
  tree: Tree,
  indexFilePath: string,
  pageComponent: string,
  importLine: string
): void {
  if (!tree.exists(indexFilePath)) {
    return;
  }

  const content = tree.read(indexFilePath, 'utf8');
  if (!content) {
    return;
  }

  if (content.includes(pageComponent)) {
    return;
  }

  const withImport = `${importLine}\n${content}`;
  const ast = tsquery.ast(withImport, indexFilePath, ScriptKind.TSX);
  const [placeholder] = tsquery(
    ast,
    'JsxElement:has(> JsxOpeningElement > Identifier[name="div"])'
  );

  if (!placeholder) {
    const comment = `// Generator Failure occurred!
// The goal of the generation was to: Replace the <div> placeholder with ${pageComponent}
//
// Could not find the <div> placeholder element to replace.
//
// Please perform the replacement manually.
`;
    tree.write(indexFilePath, `${comment}\n${withImport}`);
    console.error(
      `Error: Could not replace the placeholder. Review the file for more information: ${indexFilePath}`
    );
    return;
  }

  const updatedContent =
    withImport.slice(0, placeholder.getStart(ast)) +
    `<${pageComponent} />` +
    withImport.slice(placeholder.getEnd());

  tree.write(indexFilePath, updatedContent);
}
