import { Tree, generateFiles, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactGeneratorSchema } from '../schema';

export class AIStep implements GeneratorStep<ReactGeneratorSchema> {
  process(tree: Tree, options: ReactGeneratorSchema): void {
    generateFiles(tree, joinPathFragments(__dirname, '../files-ai'), '.', {
      ...options,
    });
  }

  getTitle(): string {
    return 'Adding AI agent configuration files';
  }

  isApplicable(options: ReactGeneratorSchema): boolean {
    return options.ai === true;
  }
}
