import { Tree, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { PageGeneratorSchema } from '../schema';

export class FeatureReducerStep implements GeneratorStep<PageGeneratorSchema> {
  process(tree: Tree, options: PageGeneratorSchema): void {
    const fileName = names(options.featureName).fileName;
    const filePath = `src/app/${fileName}/${fileName}.reducers.ts`;

    const pagePropertyName = names(options.pageName).propertyName;
    const pageFileName = names(options.pageName).fileName;

    const find = [/^/, '>({'];
    const replaceWith = [`import { ${pagePropertyName}Reducer } from './pages/${pageFileName}/${pageFileName}.reducers';`,`>({
      ${pagePropertyName}: ${pagePropertyName}Reducer,`];

    safeReplace(`Feature Reducer replace reducer and import in ${fileName}`, filePath, find,replaceWith, tree);


  }
  getTitle(): string {
    return 'Adapting Feature Reducer';
  }
}
