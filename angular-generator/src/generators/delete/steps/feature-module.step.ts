import { Tree, joinPathFragments, names } from '@nx/devkit';

import { GeneratorStep } from '../../shared/generator.utils';
import { ensurePortalDialogProvider } from '../../shared/portal-dialog-provider.utils';
import { DeleteGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const moduleFilePath = joinPathFragments(
      'src/app',
      featureFileName,
      featureFileName + '.module.ts'
    );
    ensurePortalDialogProvider(tree, moduleFilePath);
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
