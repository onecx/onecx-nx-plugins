import { Tree } from '@nx/devkit';
import { PresetGeneratorSchema } from './schema';
import angularGenerator from '../angular/generator';
import ngrxGenerator from '../ngrx/generator';
import standaloneNGRXGenerator from '../standalone/ngrx/generator';

export async function presetGenerator(
  tree: Tree,
  options: PresetGeneratorSchema
) {
  const generators = {
    angular: angularGenerator,
    ngrx: ngrxGenerator,
    'standalone-ngrx': standaloneNGRXGenerator
  };

  if (!generators[options.flavor]) {
    throw 'Unknown flavor: ' + options.flavor;
  }
  const generatorCallback = await generators[options.flavor](tree, options);
  return async () => {
    await generatorCallback();
  }
}

export default presetGenerator;
