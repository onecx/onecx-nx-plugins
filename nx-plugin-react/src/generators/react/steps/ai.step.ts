import { Tree, generateFiles, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactGeneratorSchema } from '../schema';

export class AIStep implements GeneratorStep<ReactGeneratorSchema> {
  process(tree: Tree, options: ReactGeneratorSchema): void {
    const tool = options.aiTool ?? 'none';
    if (tool === 'agents' || tool === 'both') {
      generateFiles(tree, joinPathFragments(__dirname, '../files-ai'), '.', {
        ...options,
      });
    }
    if (tool === 'copilot' || tool === 'both') {
      generateFiles(
        tree,
        joinPathFragments(__dirname, '../files-ai-copilot'),
        '.',
        {
          ...options,
        }
      );
    }
  }

  getTitle(): string {
    return 'Adding AI agent configuration files';
  }

  isApplicable(options: ReactGeneratorSchema): boolean {
    return options.aiTool !== 'none' && options.aiTool !== undefined;
  }
}
