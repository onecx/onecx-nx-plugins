import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { CreateUpdateGeneratorSchema } from '../schema';

export class SearchComponentStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const constantName = names(options.featureName).constantName;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

    let content = tree.read(filePath, 'utf8');
    content = content.replace(
      `} from '@onecx/portal-integration-angular';`,
      `RowListGridData
      } from '@onecx/portal-integration-angular';`
    );
    content = content.replace(
      'const actions: Action[] = [',
      `const actions: Action[] = [
      {
       labelKey: '${constantName}_CREATE_UPDATE.ACTION.CREATE',
       icon: PrimeIcons.PLUS,
       show: 'always',
       actionCallback: () => this.create(),
      },`
    );
    content = content.replace(
      'resetSearch',
      `
      create() {
        this.store.dispatch(${className}SearchActions.create${className}ButtonClicked());
      }
  
      edit({ id }: RowListGridData) {
        this.store.dispatch(${className}SearchActions.edit${className}ButtonClicked({ id }));
      }
  
      resetSearch`
    );
    tree.write(filePath, content);
  }
  getName(): string {
    return 'Adapting Search Component';
  }
}
