import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
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
    let moduleContent = tree.read(moduleFilePath, 'utf8');
    moduleContent = moduleContent.replace(
      'declarations: [',
      `declarations: [${className}CreateUpdateComponent,`
    );

    if (!moduleContent.includes('providePortalDialogService()')) {
      moduleContent = moduleContent.replace(
        'declarations:',
        `
    providers: [providePortalDialogService()],
    declarations:`
      );
    }
    
    moduleContent = moduleContent.replace(
      `from '@ngrx/effects';`,
      `from '@ngrx/effects';  
     import { ${className}CreateUpdateComponent } from './pages/${fileName}-search/dialogs/${fileName}-create-update/${fileName}-create-update.component';
     import { providePortalDialogService } from '@onecx/portal-integration-angular';`
    );

    tree.write(moduleFilePath, moduleContent);
  }
  getTitle(): string {
    return 'Adapting Feature Module';
  }
}
