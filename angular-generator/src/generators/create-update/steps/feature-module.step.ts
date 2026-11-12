import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '@onecx/generator-utils';
import { ensurePortalDialogProvider } from '../../shared/portal-dialog-provider.utils';
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
    const find = [/^/, `imports: [`];
    const replaceWith = [
      `import { ${resourceClassName}CreateUpdateComponent } from './pages/${resourceFileName}-search/dialogs/${resourceFileName}-create-update/${resourceFileName}-create-update.component';\n`,
      `imports: [
      ${resourceClassName}CreateUpdateComponent,`,
    ];
    safeReplace(
      `Update feature module to import ${resourceClassName}CreateUpdateComponent, add providePortalDialogService to providers when missing, and extend import statements to include necessary dependencies`,
      moduleFilePath,
      find,
      replaceWith,
      tree
    );

    ensurePortalDialogProvider(tree, moduleFilePath);
  }
  getTitle(): string {
    return 'Adapting Feature Module (create/update)';
  }
}
