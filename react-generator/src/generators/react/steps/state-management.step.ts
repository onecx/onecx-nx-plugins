import {
  addDependenciesToPackageJson,
  Tree,
  generateFiles,
  joinPathFragments,
} from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { ReactGeneratorSchema } from '../schema';

export class StateManagementStep
  implements GeneratorStep<ReactGeneratorSchema>
{
  process(tree: Tree, options: ReactGeneratorSchema): void {
    generateFiles(tree, joinPathFragments(__dirname, '../files-zustand'), '.', {
      ...options,
    });

    addDependenciesToPackageJson(tree, { zustand: '^5.0.0' }, {});
  }

  getTitle(): string {
    return 'Adding state management';
  }

  isApplicable(options: ReactGeneratorSchema): boolean {
    return options.stateManagement === 'zustand';
  }
}
