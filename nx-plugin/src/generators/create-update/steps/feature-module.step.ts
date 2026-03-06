import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class FeatureModuleStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const featureFileName = names(options.featureName).fileName;
    const resourceFileName = names(options.resource).fileName;
    const resourceClassName = names(options.resource).className;
    const moduleFilePath = joinPathFragments(
      'src/app',
      featureFileName,
      featureFileName + '.module.ts'
    );
    const find = ['declarations: [', `from '@ngrx/effects';`];
    const replaceWith = [
      `declarations: [${resourceClassName}CreateUpdateComponent,`,
      `from '@ngrx/effects';
     import { ${resourceClassName}CreateUpdateComponent } from './pages/${resourceFileName}-search/dialogs/${resourceFileName}-create-update/${resourceFileName}-create-update.component';
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
      `Update feature module to include ${resourceClassName}CreateUpdateComponent in declarations, add providePortalDialogService to providers, and extend import statements to include necessary dependencies`,
      moduleFilePath,
      find,
      replaceWith,
      tree
    );
  }
  getTitle(): string {
    return 'Adapting Feature Module (create/update)';
  }
}
