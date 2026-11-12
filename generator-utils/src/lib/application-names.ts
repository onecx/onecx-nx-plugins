import { names } from '@nx/devkit';

export function applicationNames(options: {
  name: string;
  appPrefix?: string;
}) {
  const product = names(options.name);
  const prefix = options.appPrefix ?? '';
  if (prefix !== '' && !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(prefix)) {
    throw new Error(
      'appPrefix must be empty or a lowercase kebab-case name without a trailing separator.'
    );
  }
  const applicationBaseName = `${prefix ? `${prefix}-` : ''}${
    product.fileName
  }`;
  const applicationName = `${applicationBaseName}-ui`;
  const application = names(applicationName);
  return {
    productSlug: product.fileName,
    applicationName,
    bffName: `${applicationBaseName}-bff`,
    remoteName: application.propertyName,
    remoteModuleName: `${application.className}Module`,
    remoteModuleFileName: application.fileName,
    tagName: `${applicationName}-component`,
  };
}
