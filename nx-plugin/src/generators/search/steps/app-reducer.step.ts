import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { SearchGeneratorSchema } from '../schema';

export class AppReducerStep implements GeneratorStep<SearchGeneratorSchema> {
  //@ts-eslint:ignore @typescript-eslint/no-unused-var
  process(tree: Tree, _options: SearchGeneratorSchema): void {
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
        `import { ActionReducerMap, MetaReducer, ActionReducer } from '@ngrx/store';`
      );
    }

    if (
      !reducerContent.includes(
        `import { localStorageSync } from 'ngrx-store-localstorage';`
      )
    ) {
      reducerContent = reducerContent.replace(
        `import { State } from './app.state';`,
        `import { State } from './app.state';
          import { localStorageSync } from 'ngrx-store-localstorage';
          import { lazyLoadingMergeReducer } from '@onecx/ngrx-accelerator';`
      );
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
    }
    tree.write(reducerFilePath, reducerContent);
  }

  getTitle(): string {
    return 'Adapting App Reducer';
  }
}
