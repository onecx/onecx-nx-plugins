import { applicationNames } from './application-names';

describe('application naming', () => {
  it('normalizes the product without stripping a user-provided onecx prefix', () => {
    expect(
      applicationNames({ name: 'Onecx Orders', appPrefix: 'acme' })
    ).toMatchObject({
      productSlug: 'onecx-orders',
      applicationName: 'acme-onecx-orders-ui',
      bffName: 'acme-onecx-orders-bff',
      remoteName: 'acmeOnecxOrdersUi',
    });
    expect(applicationNames({ name: 'onecx-orders' }).applicationName).toBe(
      'onecx-orders-ui'
    );
  });

  it('supports multi-segment prefixes with safe JavaScript identifiers', () => {
    expect(
      applicationNames({ name: 'purchase-orders', appPrefix: 'acme-corp' })
    ).toMatchObject({
      applicationName: 'acme-corp-purchase-orders-ui',
      remoteName: 'acmeCorpPurchaseOrdersUi',
      remoteModuleName: 'AcmeCorpPurchaseOrdersUiModule',
    });
  });

  it.each(['onecx-', '-acme', 'Acme', 'acme_corp', 'acme/other'])(
    'rejects an invalid prefix %s',
    (appPrefix) => {
      expect(() => applicationNames({ name: 'orders', appPrefix })).toThrow(
        'appPrefix must be'
      );
    }
  );
});
