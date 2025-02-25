import { Tree, joinPathFragments } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class AppModuleStep implements GeneratorStep<SearchGeneratorSchema> {
  //@ts-eslint:ignore @typescript-eslint/no-unused-var
  process(tree: Tree, _options: SearchGeneratorSchema): void {
    const moduleFilePath = joinPathFragments('src/app/app.module.ts');
    const find = ['providers: [',`} from '@onecx/portal-integration-angular'`];
    const replaceWith = [`providers: [providePortalDialogService(),`,` providePortalDialogService } from '@onecx/portal-integration-angular'`];

    safeReplace(`AppModule replace providers and imports in app.module.ts'`, moduleFilePath, find, replaceWith, tree);

  }

  getTitle(): string {
    return 'Adapting App Module';
  }
}
