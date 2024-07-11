import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DeleteGeneratorSchema } from '../schema';

export class SearchComponentStep
  implements GeneratorStep<DeleteGeneratorSchema>
{
  process(tree: Tree, options: DeleteGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const className = names(options.featureName).className;
    const filePath = `src/app/${fileName}/pages/${fileName}-search/${fileName}-search.component.ts`;

    let content = tree.read(filePath, 'utf8');
    content = content.replace(
      `} from '@onecx/portal-integration-angular';`,
      `RowListGridData
    } from '@onecx/portal-integration-angular';`
    );

    content = content.replace(
      'resetSearch',
      `  
    delete({ id }: RowListGridData) {
      this.store.dispatch(${className}SearchActions.delete${className}ButtonClicked({ id }));
    }

    resetSearch`
    );
    tree.write(filePath, content);
  }
  getName(): string {
    return 'Adapting Search Component';
  }
}
