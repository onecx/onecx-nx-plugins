import { Tree } from '@nx/devkit';
import { PresetGeneratorSchema } from './schema';
import reactGenerator from '../react/generator';

export async function presetGenerator(
  tree: Tree,
  options: PresetGeneratorSchema
) {
  const generators = {
    react: reactGenerator,
  };

  if (!generators[options.flavor]) {
    throw 'Unknown flavor: ' + options.flavor;
  }
  const generatorCallback = await generators[options.flavor](tree, options);
  return async () => {
    await generatorCallback();
  };
}

export default presetGenerator;
