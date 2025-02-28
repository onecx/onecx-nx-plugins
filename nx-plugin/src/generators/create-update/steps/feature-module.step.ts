import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class FeatureModuleStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const moduleFilePath = joinPathFragments(
      'src/app',
      fileName,
      fileName + '.module.ts'
    );
    const find = ['declarations: [', `from '@ngrx/effects';`];
    const replaceWith = [
      `declarations: [${className}CreateUpdateComponent,`,
      `from '@ngrx/effects';
     import { ${className}CreateUpdateComponent } from './pages/${fileName}-search/dialogs/${fileName}-create-update/${fileName}-create-update.component';
     import { providePortalDialogService } from '@onecx/portal-integration-angular';`,
      `
    providers: [providePortalDialogService()],
    declarations:`,
    ];
    const moduleContent = tree.read(moduleFilePath, 'utf8');
    if (!moduleContent.includes('providePortalDialogService()')) {
      find.push('declarations:');
      replaceWith.push(`
    providers: [providePortalDialogService()],
    declarations:`);
    }
    safeReplace(
      `Add Component to feature module declarations and dialog service to providers`,
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
