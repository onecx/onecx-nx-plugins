import { Tree, joinPathFragments, names, updateJson } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { DetailsGeneratorSchema } from '../schema';
import path = require('path');
import { renderJsonFile } from '../../shared/renderJsonFile';
import * as fs from 'fs';
import { deepMerge } from '../../shared/deepMerge';

export class GeneralTranslationsStep implements GeneratorStep<DetailsGeneratorSchema> {
  process(tree: Tree, options: DetailsGeneratorSchema): void {
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

    console.log("Files:", tree.children(folderPath));

    tree.children(folderPath).forEach((file) => {
      updateJson(tree, joinPathFragments(folderPath, file), (json) => {
        console.log("\nUpdateJson ", file);
        try {
          const jsonPath = joinPathFragments(
            path.resolve(__dirname, '../input-files/i18n/'),
            file + '.template'
          );

          console.log("json path", jsonPath);

          let jsonContent = {};
          if (fs.existsSync(jsonPath)) {
            console.log("file exists");

            jsonContent = renderJsonFile(jsonPath, {
              ...options,
              featureConstantName: names(options.featureName).constantName,
              featureClassName: names(options.featureName).className,
            });
            console.log("json content", jsonContent);

          }

          json = deepMerge(masterJsonContent, jsonContent, json);

          console.log("Replacing in", file, " to ", json);
        } catch (error) {
          console.error(error)
        }
        return json;
      });
    });
  }
  getTitle(): string {
    return "Adapting Translations"
  }
}
