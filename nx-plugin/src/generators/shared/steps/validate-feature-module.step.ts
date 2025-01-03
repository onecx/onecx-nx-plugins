import { Tree, joinPathFragments, names } from '@nx/devkit';
import {
  GeneratorStep,
  GeneratorStepError,
} from '../../shared/generator.utils';

interface FeatureSchema {
  featureName: string;
}

export class ValidateFeatureModuleStep
  implements GeneratorStep<FeatureSchema>
{
  process(
    tree: Tree,
    options: FeatureSchema
  ): void | GeneratorStepError {
    const fileName = names(options.featureName).fileName;
    const moduleFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.module.ts'
    );
    if (!tree.exists(moduleFilePath)) {
      return {
        error: `Feature module not found at ${moduleFilePath}, please generate feature first!`,
        stopExecution: true,
      };
    }
  }
  getTitle(): string {
    return 'Validating Feature Module exists';
  }
}
