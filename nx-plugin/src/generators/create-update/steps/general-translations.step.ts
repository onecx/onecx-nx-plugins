import { Tree, joinPathFragments, names, updateJson } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { CreateUpdateGeneratorSchema } from '../schema';
import path = require('path');
import { renderJsonFile } from '../../shared/renderJsonFile';
import { deepMerge } from '../../shared/deepMerge';
import * as fs from 'fs';

export class GeneralTranslationsStep
  implements GeneratorStep<CreateUpdateGeneratorSchema>
{
  process(tree: Tree, options: CreateUpdateGeneratorSchema): void {
    const folderPath = 'src/assets/i18n/';
  const masterJsonPath = path.resolve(
    __dirname,
    '../input-files/i18n/master.json.template'
  );

  const masterJsonContent = renderJsonFile(masterJsonPath, {
    ...options,
    featureConstantName: names(options.featureName).constantName,
    featureClassName: names(options.featureName).className,
  });

  tree.children(folderPath).forEach((file) => {
    updateJson(tree, joinPathFragments(folderPath, file), (json) => {
      const jsonPath = joinPathFragments(
        path.resolve(__dirname, '../input-files/i18n/'),
        file + '.template'
      );
      let jsonContent = {};
      if (fs.existsSync(jsonPath)) {
        jsonContent = renderJsonFile(jsonPath, {
          ...options,
          featureConstantName: names(options.featureName).constantName,
          featureClassName: names(options.featureName).className,
        });
      }

      json = deepMerge(masterJsonContent, jsonContent, json);

      return json;
    });
  });
  }
  getName(): string {
    return 'Adapting Translations';
  }
}
