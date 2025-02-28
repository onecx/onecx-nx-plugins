import { Tree, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class AppModuleStep implements GeneratorStep<SearchGeneratorSchema> {
  //@ts-eslint:ignore @typescript-eslint/no-unused-var
  process(tree: Tree, _options: SearchGeneratorSchema): void {
    const moduleFilePath = joinPathFragments('src/app/app.module.ts');
    const find = [`} from '@onecx/portal-integration-angular'`];
    const replaceWith = [
      ` providePortalDialogService } from '@onecx/portal-integration-angular'`,
    ];
    const moduleContent = tree.read(moduleFilePath, 'utf8');
    if (!moduleContent.includes('providePortalDialogService()')) {
      find.push('providers: [');
      replaceWith.push(`providers: [providePortalDialogService(),`);
    }
    safeReplace(
      `Add providePortalDialogService to AppModule`,
      moduleFilePath,
      find,
      replaceWith,
      tree
    );
  }

  getTitle(): string {
    return 'Adapting App Module';
  }
}
