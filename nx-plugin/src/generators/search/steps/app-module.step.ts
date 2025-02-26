import { Tree, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class AppModuleStep implements GeneratorStep<SearchGeneratorSchema> {
  //@ts-eslint:ignore @typescript-eslint/no-unused-var
  process(tree: Tree, _options: SearchGeneratorSchema): void {
    const moduleFilePath = joinPathFragments('src/app/app.module.ts');
    let contentToReplace = [`} from '@onecx/portal-integration-angular'`];
    let replaceWith = [` providePortalDialogService } from '@onecx/portal-integration-angular'`];
    const moduleContent = tree.read(moduleFilePath, 'utf8');
    if (!moduleContent.includes('providePortalDialogService()')) {
      contentToReplace.push('providers: [')
      replaceWith.push(`providers: [providePortalDialogService(),`)
    }
    safeReplace(`AppModule replace providers and imports in app.module.ts'`, moduleFilePath, contentToReplace, replaceWith, tree);

  }

  getTitle(): string {
    return 'Adapting App Module';
  }
}
