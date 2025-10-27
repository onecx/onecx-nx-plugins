/* eslint-disable @typescript-eslint/no-unused-vars */
import { Tree } from '@nx/devkit';
import { ast, query, replace, ScriptKind } from '@phenomnomnominal/tsquery';

export default function addImportMetaToWebpackConfig(tree: Tree) {
  const filePath = 'webpack.config.js';
  if (tree.exists(filePath)) {
    let fileContent = tree.read(filePath, 'utf-8');
    if (!fileContent || fileContent.includes('importMeta: false')) {
      return;
    }

    const moduleExportsSelector =
      'ExpressionStatement:has(PropertyAccessExpression:has(Identifier[name=module]):has(Identifier[name=exports]))  > BinaryExpression  > ObjectLiteralExpression';
    const astSource = ast(fileContent);
    const moduleExports = query(astSource, moduleExportsSelector);
    if (moduleExports.length === 0) {
      return;
    }

    fileContent = replace(
      fileContent,
      moduleExportsSelector,
      (node) => {
        let text = node.getText().replace(/,?\s*$/, '');
        if (text.endsWith('}')) {
          text =
            text.slice(0, -1) +
            ', module: { parser: { javascript: { importMeta: false } } } }';
        }
        return text;
      },
      ScriptKind.JS
    );

    tree.write(filePath, fileContent);
  }
}
