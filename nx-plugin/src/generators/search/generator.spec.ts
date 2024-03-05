import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { searchGenerator } from './generator';
import { SearchGeneratorSchema } from './schema';

describe('search generator', () => {
  let tree: Tree;
  const options: SearchGeneratorSchema = { featureName: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await searchGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
