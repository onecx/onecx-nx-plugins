import { Tree, joinPathFragments, names } from '@nx/devkit';
import {
  GeneratorStep,
  GeneratorStepError,
} from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class AppReducerStep implements GeneratorStep<SearchGeneratorSchema> {
  //@ts-eslint:ignore @typescript-eslint/no-unused-var
  process(
    tree: Tree,
    _options: SearchGeneratorSchema
  ): void | GeneratorStepError {
    const reducerFilePath = joinPathFragments('src/app/app.reducers.ts');
    const propertyName = names(_options.featureName).propertyName;
    let reducerContent = tree.read(reducerFilePath, 'utf8');

    if (
      reducerContent.includes(
        `import { ActionReducerMap, MetaReducer } from '@ngrx/store';`
      )
    ) {
      reducerContent = reducerContent.replace(
        `import { ActionReducerMap, MetaReducer } from '@ngrx/store';`,
        `import { ActionReducerMap, MetaReducer, ActionReducer } from '@ngrx/store';
         import { localStorageSync } from 'ngrx-store-localstorage';
         import { lazyLoadingMergeReducer } from '@onecx/ngrx-accelerator';`
      );
    } else {
      return {
        error:
          'Could not modify imports for app.reducers.ts, please investigate if the imports are already present!',
        stopExecution: false,
      };
    }

    if (
      reducerContent.includes(
        `export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];`
      )
    ) {
      reducerContent = reducerContent.replace(
        `export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];`,
        `export function localStorageSyncReducer(
            reducer: ActionReducer<any>,
          ): ActionReducer<any> {
            return localStorageSync({
              keys: [
                {
                  ${propertyName}: [
                    {
                      search: [
                        'chartVisible',
                        'resultComponentState',
                        'searchHeaderComponentState',
                        'diagramComponentState',
                      ],
                    },
                  ],
                },
              ],
              mergeReducer: lazyLoadingMergeReducer,
              rehydrate: true,
              storageKeySerializer: (key) => 'ibt-tsg-mgmt-page.\${key}',
            })(reducer);
          }

          export const metaReducers: MetaReducer<State>[] = isDevMode()
            ? [localStorageSyncReducer]
            : [localStorageSyncReducer];`
      );
    } else {
      return {
        error:
          'Could not add localStorageSyncReducer for app.reducers.ts, please investigate if it is already present!',
        stopExecution: false,
      };
    }
    tree.write(reducerFilePath, reducerContent);
  }

  getTitle(): string {
    return 'Adapting App Reducer';
  }
}
