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
      this.removeUnusedStyleRule(
        tree,
        options.styles,
        '.agents/rules/frontend-styling-primeflex.mdc',
        '.agents/rules/frontend-styling-tailwind.mdc'
      );
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
      this.removeUnusedStyleRule(
        tree,
        options.styles,
        '.github/instructions/frontend-styling-primeflex.instructions.md',
        '.github/instructions/frontend-styling-tailwind.instructions.md'
      );
    }
  }

  private removeUnusedStyleRule(
    tree: Tree,
    styles: string,
    primeflexFile: string,
    tailwindFile: string
  ): void {
    if (styles === 'tailwind') {
      tree.delete(primeflexFile);
    } else {
      tree.delete(tailwindFile);
    }
  }

  getTitle(): string {
    return 'Adding AI agent configuration files';
  }

  isApplicable(options: ReactGeneratorSchema): boolean {
    return options.aiTool !== 'none' && options.aiTool !== undefined;
  }
}
