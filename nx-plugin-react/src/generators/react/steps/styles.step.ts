import { Tree, generateFiles, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactGeneratorSchema } from '../schema';

export class StylesStep implements GeneratorStep<ReactGeneratorSchema> {
  process(tree: Tree, options: ReactGeneratorSchema): void {
    const templateDir =
      options.styles === 'tailwind'
        ? '../files-styles-tailwind'
        : '../files-styles-primeflex';
    generateFiles(tree, joinPathFragments(__dirname, templateDir), '.', {
      ...options,
    });
  }

  getTitle(): string {
    return 'Adding styles';
  }
}
