import { GeneratorCallback, Tree } from '@nx/devkit';
import { NGRXStandaloneGeneratorSchema as NgRXStandaloneGeneratorSchema } from './schema';

import ngrxGenerator from '../../ngrx/generator';

export async function standaloneNgRxGenerator(
  tree: Tree,
  options: NgRXStandaloneGeneratorSchema
): Promise<GeneratorCallback> {
  const ngrxGeneratorCallback = await ngrxGenerator(tree, {
    ...options,
    standalone: true
  });
  return async () => {
    await ngrxGeneratorCallback();
  };
}

export default standaloneNgRxGenerator;
