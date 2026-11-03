import { readFileSync } from 'fs';
import { join } from 'path';

describe('translation testing helper imports', () => {
  const componentSpecTemplates = [
    'angular/files/src/app/app.component.spec.ts.template',
    'create-update/files/ngrx/src/app/__featureFileName__/pages/__resourceFileName__-search/dialogs/__resourceFileName__-create-update/__resourceFileName__-create-update.component.spec.ts.template',
    'details/files/ngrx/src/app/__featureFileName__/pages/__resourceFileName__-details/__resourceFileName__-details.component.spec.ts.template',
    'search/files/ngrx/src/app/__featureFileName__/pages/__resourceFileName__-search/__resourceFileName__-search.component.spec.ts.template',
  ];

  it('imports the helper from @onecx/angular-testing', () => {
    for (const template of componentSpecTemplates) {
      const source = readFileSync(join(__dirname, template), 'utf8');

      expect(source).toContain(
        "import { provideTranslateTestingService } from '@onecx/angular-testing'"
      );
    }
  });
});
