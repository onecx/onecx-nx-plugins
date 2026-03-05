import { Tree, joinPathFragments, names } from '@nx/devkit';
import { GeneratorStep } from '../../shared/generator.utils';
import { safeReplace } from '../../shared/safeReplace';
import { SearchGeneratorSchema } from '../schema';

export class AppReducerStep implements GeneratorStep<SearchGeneratorSchema> {
  process(tree: Tree, _options: SearchGeneratorSchema) {
    const reducerFilePath = joinPathFragments('src/app/app.reducers.ts');
    const propertyName = names(_options.featureName).propertyName;
    const find = [
      "import { ActionReducerMap, MetaReducer } from '@ngrx/store'",
      "import { oneCxReducer } from '@onecx/ngrx-accelerator'",
      "export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : []",
    ];
    console.log(find);
    const replaceWith = [
      `import { ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store'
       import { localStorageSync } from 'ngrx-store-localstorage'`,
      `import { lazyLoadingMergeReducer, oneCxReducer } from '@onecx/ngrx-accelerator'`,
`export function localStorageSyncReducer(reducer: ActionReducer<State>): ActionReducer<State> {
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
    storageKeySerializer: (key) => \`${propertyName}.\${key}\`,
  })(reducer);
}
   
export const metaReducers: MetaReducer<State>[] = isDevMode()
  ? [localStorageSyncReducer]
  : [localStorageSyncReducer]`
    ];
    safeReplace(
      `Update AppReducer to include localStorageSyncReducer in metaReducers, implement state synchronization with localStorage, and extend import statements to include necessary dependencies`,
      reducerFilePath,
      find,
      replaceWith,
      tree
    );
  }

  getTitle(): string {
    return 'Adapting App Reducer';
  }
}
