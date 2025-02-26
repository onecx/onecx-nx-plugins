import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { preCommitValidationGenerator } from './generator';
import { PreCommitValidationGeneratorSchema } from './schema';

describe('nx-plugin/src/generators/pre-commit-validation generator', () => {
  let tree: Tree;
  const options: PreCommitValidationGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await preCommitValidationGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
