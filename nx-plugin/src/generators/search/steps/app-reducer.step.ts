import { Tree, joinPathFragments, names } from '@nx/devkit';
import {
  GeneratorStep,
} from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class AppReducerStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, _options: SearchGeneratorSchema) {
    const reducerFilePath = joinPathFragments('src/app/app.reducers.ts');
    const propertyName = names(_options.featureName).propertyName;
    const find = [`import { ActionReducerMap, MetaReducer } from '@ngrx/store';`,`export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];`];
    const replaceWith = [`import { ActionReducerMap, MetaReducer, ActionReducer } from '@ngrx/store';
         import { localStorageSync } from 'ngrx-store-localstorage';
         import { lazyLoadingMergeReducer } from '@onecx/ngrx-accelerator';`,`export function localStorageSyncReducer(
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
            : [localStorageSyncReducer];`];
      safeReplace(`App Reducer replace in app.reducers.ts'`, reducerFilePath, find, replaceWith, tree);
  }

  getTitle(): string {
    return 'Adapting App Reducer';
  }
}
