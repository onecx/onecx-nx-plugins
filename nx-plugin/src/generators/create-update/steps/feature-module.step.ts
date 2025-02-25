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
    const contentToReplace = ['declarations: [',`from '@ngrx/effects';`,'declarations:']
    const replaceWith = [
    `declarations: [${className}CreateUpdateComponent,`,
    `from '@ngrx/effects';
     import { ${className}CreateUpdateComponent } from './pages/${fileName}-search/dialogs/${fileName}-create-update/${fileName}-create-update.component';
     import { providePortalDialogService } from '@onecx/portal-integration-angular';`,
     `
    providers: [providePortalDialogService()],
    declarations:`]

    safeReplace(`Feature Module Step replace declarations in ${fileName}`,moduleFilePath,contentToReplace,replaceWith,tree)
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
