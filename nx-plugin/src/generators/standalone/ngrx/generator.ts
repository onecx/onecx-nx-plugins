import { GeneratorCallback, Tree } from '@nx/devkit';
import { NGRXStandaloneGeneratorSchema } from './schema';

import ngrxGenerator from '../../ngrx/generator';

export async function standaloneNGRXGenerator(
  tree: Tree,
  options: NGRXStandaloneGeneratorSchema
): Promise<GeneratorCallback> {
  const ngrxGeneratorCallback = await ngrxGenerator(tree, {
    ...options,
    standalone: true
  });
  return async () => {
    await ngrxGeneratorCallback();
  };
}

export default standaloneNGRXGenerator;
