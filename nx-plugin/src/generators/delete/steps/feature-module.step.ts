import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const moduleFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.module.ts'
    );
    let moduleContent = tree.read(moduleFilePath, 'utf8');

    if (!moduleContent.includes('providePortalDialogService()')) {
      moduleContent = moduleContent.replace(
        'declarations:',
        `
      providers: [providePortalDialogService()],
      declarations:`
      );
      moduleContent = moduleContent.replace(
        `from '@ngrx/effects';`,
        `from '@ngrx/effects';
         import { providePortalDialogService } from '@onecx/portal-integration-angular';`
      );
    }
    tree.write(moduleFilePath, moduleContent);
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
