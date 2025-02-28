import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { DeleteGeneratorSchema } from '../schema';

export class FeatureModuleStep implements GeneratorStep<DeleteGeneratorSchema> {
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const moduleFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.module.ts'
    );
    const find = [`from '@ngrx/effects';`];
    const replaceWith = [
      `from '@ngrx/effects';
         import { providePortalDialogService } from '@onecx/portal-integration-angular';`,
    ];
    const moduleContent = tree.read(moduleFilePath, 'utf8');
    if (!moduleContent.includes('providePortalDialogService()')) {
      find.push('declarations:');
      replaceWith.push(`
    providers: [providePortalDialogService()],
    declarations:`);
    }
    safeReplace(
      `Add providePortalDialogService to ${fileName}Module providers`,
      moduleFilePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
