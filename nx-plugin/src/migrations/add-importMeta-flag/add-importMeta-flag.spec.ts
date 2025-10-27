import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';

import addImportMetaToWebpackConfig from './add-importMeta-flag';

describe('update- migration', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should adjust webpack config for importMeta in module exports', async () => {
    const filePath = 'webpack.config.js';
    tree.write(
      filePath,
      `
    module.exports = {
        ...config,
        plugins,
        output: { uniqueName: 'onecx-app-ui', publicPath: 'auto' },
    };`
    );
    await addImportMetaToWebpackConfig(tree);

    const content = tree.read(filePath)?.toString();

    expect(content).toEqualIgnoringWhitespace(`
    module.exports = {
        ...config,
        plugins,
        output: { uniqueName: 'onecx-app-ui', publicPath: 'auto' },
        module: { parser: { javascript: { importMeta: false } } }
    };
    `);
  });

  it('should not adjust webpack config for importMeta if its already there', async () => {
    const filePath = 'webpack.config.js';
    tree.write(
      filePath,
      `
    module.exports = {
        ...config,
        plugins,
        output: { uniqueName: 'onecx-app-ui', publicPath: 'auto' },
        module: { parser: { javascript: { importMeta: false } } }
    };`
    );
    await addImportMetaToWebpackConfig(tree);

    const content = tree.read(filePath)?.toString();

    expect(content).toEqualIgnoringWhitespace(`
    module.exports = {
        ...config,
        plugins,
        output: { uniqueName: 'onecx-app-ui', publicPath: 'auto' },
        module: { parser: { javascript: { importMeta: false } } }
    };
    `);
  });
});
