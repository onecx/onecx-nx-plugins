import {
  addDependenciesToPackageJson,
  Tree,
  generateFiles,
  joinPathFragments,
} from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactGeneratorSchema } from '../schema';

export class StylesStep implements GeneratorStep<ReactGeneratorSchema> {
  process(tree: Tree, options: ReactGeneratorSchema): void {
    if (options.styles === 'tailwind') {
      generateFiles(
        tree,
        joinPathFragments(__dirname, '../files-styles-tailwind'),
        '.',
        {
          ...options,
        }
      );

      addDependenciesToPackageJson(
        tree,
        {},
        {
          tailwindcss: '^4.0.0',
          '@tailwindcss/vite': '^4.0.0',
          'tailwindcss-primeui': '^0.3.0',
        }
      );
    }
  }

  getTitle(): string {
    return 'Adding styles';
  }

  isApplicable(options: ReactGeneratorSchema): boolean {
    return options.styles === 'tailwind';
  }
}
