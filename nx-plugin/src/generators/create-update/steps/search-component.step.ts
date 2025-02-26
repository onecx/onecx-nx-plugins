import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchComponentStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const constantName = names(options.featureName).constantName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

    const contentToReplace = [`} from '@onecx/portal-integration-angular';`, 'const actions: Action[] = [','resetSearch'];
    const replaceWith =[`RowListGridData
      } from '@onecx/portal-integration-angular';`,`const actions: Action[] = [
      {
       labelKey: '${constantName}_CREATE_UPDATE.ACTION.CREATE',
       icon: PrimeIcons.PLUS,
       show: 'always',
       actionCallback: () => this.create(),
      },`, `
      create() {
        this.store.dispatch(${className}SearchActions.create${className}ButtonClicked());
      }

      edit({ id }: RowListGridData) {
        this.store.dispatch(${className}SearchActions.edit${className}ButtonClicked({ id }));
      }

      resetSearch`];
    safeReplace(`Search Components Step replace in ${fileName}`, filePath, contentToReplace, replaceWith, tree)

  }
  getTitle(): string {
    return 'Adapting Search Component';
  }
}
