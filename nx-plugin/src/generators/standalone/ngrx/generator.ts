import { GeneratorCallback, Tree } from '@nx/devkit';
import { NGRXStandaloneGeneratorSchema } from './schema';

import * as ora from 'ora';
import ngrxGenerator from '../../ngrx/generator';

export async function standaloneNGRXGenerator(
  tree: Tree,
  options: NGRXStandaloneGeneratorSchema
): Promise<GeneratorCallback> {
  return async () => {
    await ngrxGenerator(tree, options);
  };
}
