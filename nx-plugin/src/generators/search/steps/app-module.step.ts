import { Tree, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class AppModuleStep implements GeneratorStep<SearchGeneratorSchema> {
  //@ts-eslint:ignore @typescript-eslint/no-unused-var
  process(tree: Tree, _options: SearchGeneratorSchema): void {
    const moduleFilePath = joinPathFragments('src/app/app.module.ts');
    let moduleContent = tree.read(moduleFilePath, 'utf8');
    if (!moduleContent.includes('providers: [providePortalDialogService(),')) {
      moduleContent = moduleContent.replace(
        'providers: [',
        `providers: [providePortalDialogService(),`
      );
    }

    if (
      !moduleContent.includes(
        `providePortalDialogService } from '@onecx/portal-integration-angular'`
      )
    ) {
      moduleContent = moduleContent.replace(
        `} from '@onecx/portal-integration-angular'`,
        `, providePortalDialogService } from '@onecx/portal-integration-angular'`
      );
    }
    tree.write(moduleFilePath, moduleContent);
  }

  getName(): string {
    return 'Adapting App Module';
  }
}
